# frozen_string_literal: true

require 'rails_helper'
require 'webmock/rspec'

RSpec.describe 'Indigo API', type: :request do
  let!(:unauthorized_user) { create(:person) }
  let(:molfile_structure) { 'C1=CC=CC=C1' }
  let(:service_url) { Rails.configuration.indigo_service.indigo_service_url }
  let(:output_format_convert) { 'chemical/x-mdl-molfile' }
  let(:output_format_render) { 'image/svg+xml' }

  # Mock Warden Authentication for unauthorized user
  let(:warden_authentication_instance) { instance_double(WardenAuthentication) }

  before do
    allow(WardenAuthentication).to receive(:new).and_return(warden_authentication_instance)
    allow(warden_authentication_instance).to receive(:current_user).and_return(unauthorized_user)
    allow(Rails.configuration.indigo_service).to receive(:indigo_service_url).and_return(service_url)
  end

  describe 'POST /indigo/structure/convert' do
    let(:url) { 'http://indigo_service/v2/indigo/convert' }
    let(:request_data) { { struct: molfile_structure, output_format: output_format_convert }.to_json }

    context 'when the request is successful' do
      let(:response_body) { { result: 'converted structure' }.to_json }

      before do
        # Stubbing the external request to the Indigo service
        stub_request(:post, 'http://indigo_service/v2/indigo/convert')
          .with(
            body: '{"struct":"C1=CC=CC=C1","output_format":"chemical/x-mdl-molfile"}',
            headers: {
              'Accept' => '*/*',
              'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
              'Content-Type' => 'application/json',
              'User-Agent' => 'Ruby',
            },
          )
          .to_return(status: 200, body: response_body, headers: {})
      end

      it 'returns the converted structure' do
        post '/api/v1/molecules/indigo/structure/convert',
             params: { struct: molfile_structure, output_format: output_format_convert }

        expect(response).to have_http_status(:success)
      end
    end
  end
end
