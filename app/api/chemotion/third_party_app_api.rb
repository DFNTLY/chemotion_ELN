# frozen_string_literal: true

TPA_EXPIRATION = 48.hours

module Chemotion
  # Publish-Subscription MessageAPI
  class ThirdPartyAppAPI < Grape::API
    helpers do
      # desc: expiry time for the token and the cached upload/download counters
      def expiry_time
        @expiry_time ||= TPA_EXPIRATION.from_now
      end

      # desc: instantiate local file cache for TPA
      def cache
        @cache ||= ActiveSupport::Cache::FileStore.new('tmp/ThirdPartyApp', expires_in: TPA_EXPIRATION)
      end

      # desc: fetch the token and download/upload counters from the cache
      def cached_token
        @cached_token ||= cache.read(cache_key[1])
      end

      # desc: define the cache key based on the attachment/user/app ids
      def cache_key
        @user_key ||= @user&.id
        @cache_key_attachment_app ||= "#{@app&.id}/#{@attachment&.id}"
        [@user_key, @cache_key_attachment_app]
      end

      # desc: prepare the token payload from the params
      def prepare_payload
        @payload = {
          'appID' => params[:appID],
          'userID' => current_user.id,
          'attID' => params[:attID],
        }
      end

      # desc: find records from the payload
      def parse_payload(payload = @payload)
        # TODO: implement attachment authorization
        @attachment = Attachment.find(payload['attID']&.to_i)
        @user = User.find(payload['userID']&.to_i)
        @app = ThirdPartyApp.find(payload['appID']&.to_i)
      rescue ActiveRecord::RecordNotFound
        error!('Record not found', 404)
      end

      # desc: decrement the counters / check if token permission is expired
      def update_cache(key, token)
        parse_payload(token)
        cached_token
        if cached_token.nil? || (@cached_token[:download] < 1 && @cached_token[:upload] < 1)
          cache.delete(cache_key[1])
          error!('Invalid token', 403)
        elsif @cached_token[key] < 1
          error!("Token #{key} permission expired", 403)
        else
          @cached_token[key] -= 1
          cache.write(cache_key[1], @cached_token)
        end
      end

      # desc: return file for download to third party app
      def download_third_party_app(token)
        update_cache(:download, token)
        content_type 'application/octet-stream'
        header['Content-Disposition'] = "attachment; filename=#{@attachment.filename}"
        env['api.format'] = :binary
        @attachment.read_file
      end

      # desc: upload file from the third party app
      def upload_third_party_app(token)
        update_cache(:upload, token)
        new_attachment = Attachment.new(
          attachable: @attachment.attachable,
          created_by: @attachment.created_by,
          created_for: @attachment.created_for,
          filename: params[:attachmentName].presence&.strip || "#{@app.name[0, 20]}-#{params[:file][:filename]}",
          file_path: params[:file][:tempfile].path,
        )
        new_attachment.save
        { message: 'File uploaded successfully' }
      end

      # store token values if updated
      def encode_and_cache_token_user_collection_with_type
        current_state = cache.read(cache_key[0])
        new_state = if current_state
                      idx = current_state.index(cache_key[1])
                      idx.nil? ? current_state.push(cache_key[1]) : current_state
                    else
                      [cache_key[1]]
                    end
        cache.write(cache_key[0], new_state)
      end

      # store token against cache key
      def encode_and_cache_token_attachment_app(payload = @payload)
        @token = JsonWebToken.encode(payload, expiry_time)
        cache.write(
          cache_key[1],
          { token: @token, download: 3, upload: 10 },
          expires_at: expiry_time,
        )
      end
    end

    # desc: public endpoint for third party apps to {down,up}load files
    namespace :public do
      resource :third_party_apps, requirements: { token: /.*/ } do
        route_param :token, regexp: /^[\w-]+\.[\w-]+\.[\w-]+$/ do
          after_validation do
            parse_payload(JsonWebToken.decode(params[:token]))
          end
          desc 'download file to 3rd party app'
          get '/', requirements: { token: /.*/ } do
            download_third_party_app(JsonWebToken.decode(params[:token]))
          end

          desc 'Upload file from 3rd party app'
          params do
            requires :file, type: File, desc: 'File to upload'
            optional :attachmentName, type: String, desc: 'Name of the file'
          end
          post '/' do
            upload_third_party_app(JsonWebToken.decode(params[:token]))
          end
        end
      end
    end

    resource :third_party_apps do
      rescue_from ActiveRecord::RecordNotFound do
        error!('Record not found', 404)
      end
      namespace :admin do
        before do
          error!('Unauthorized. User has to be admin.', 401) unless current_user.is_a?(Admin)
        end
        after_validation do
          params[:name]&.strip!
          params[:url]&.strip!
          params[:file_types]&.strip!
        end

        desc 'create new third party app entry'
        params do
          requires :url, type: String, allow_blank: false, desc: 'The url in order to redirect to the app.'
          requires :name, type: String, allow_blank: false,
                          desc: 'name of third party app. User will chose correct app based on names.'
          optional :file_types, type: String, desc: 'comma separated mime-types'
        end

        rescue_from ActiveRecord::RecordInvalid do |e|
          error!(e.record.errors.full_messages.join(', '), 400)
        end

        post do
          ThirdPartyApp.create!(declared(params))
          status 201
        end

        route_param :id, type: Integer, desc: '3rd party app id' do
          desc 'update a third party app entry'
          params do
            optional :url, type: String, allow_blank: false, desc: 'The url where the 3rd party app lives.'
            optional :name, type: String, allow_blank: false, desc: 'Name of third party app.'
            optional :file_types, type: String, desc: 'comma separated mime-types'
          end

          put do
            ThirdPartyApp.find(params[:id]).update!(declared(params, include_missing: false))
            status 201
          end

          desc 'delete third party app entry'
          delete do
            ThirdPartyApp.delete(params[:id])
            status 201
          end
        end
      end

      desc 'get all thirdPartyApps'
      get do
        ThirdPartyApp.all
      end

      desc 'create token for use in download public_api'
      params do
        requires :attID, type: Integer, desc: 'Attachment ID'
        requires :appID, type: Integer, desc: 'id of the third party app'
      end

      get 'token' do
        prepare_payload
        parse_payload
        encode_and_cache_token_user_collection_with_type
        encode_and_cache_token_attachment_app
        # redirect url with callback url to {down,up}load file: NB path should match the public endpoint
        url = CGI.escape("#{Rails.application.config.root_url}/api/v1/public/third_party_apps/#{@token}")
        "#{@app.url}?url=#{url}"
      end

      desc 'list of TPA token in a collection'
      get 'collection_tpa_tokens' do
        token_list = []
        cache_user_keys = cache.read(current_user.id)
        cache_user_keys&.each do |token_key|
          cached_value = cache.read(token_key)
          token_list
            .push({
                    "#{token_key}": cached_value,
                  })
        end
        { token_list: token_list }
      end

      route_param :id, type: Integer, desc: '3rd party app id' do
        desc 'get a thirdPartyApps by id'
        get do
          ThirdPartyApp.find(params[:id])
        end
      end
    end
  end
end
