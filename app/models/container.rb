# frozen_string_literal: true

# == Schema Information
#
# Table name: containers
#
#  id                :integer          not null, primary key
#  ancestry          :string
#  containable_id    :integer
#  containable_type  :string
#  name              :string
#  container_type    :string
#  description       :text
#  extended_metadata :hstore
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  parent_id         :integer
#
# Indexes
#
#  index_containers_on_containable  (containable_type,containable_id)
#

class Container < ApplicationRecord
  include ElementCodes
  include Labimotion::Datasetable

  belongs_to :containable, polymorphic: true, optional: true
  has_many :attachments, as: :attachable

  before_save :content_to_plain_text
  # TODO: dependent destroy for attachments should be implemented when attachment get paranoidized instead of this DJ
  before_destroy :delete_attachment
  before_destroy :destroy_datasetable

  has_closure_tree

  scope :analyses_for_root, lambda { |root_id|
    where(container_type: 'analysis').joins(
      "inner join container_hierarchies ch on ch.generations = 2
      and ch.ancestor_id = #{root_id} and ch.descendant_id = containers.id ",
    )
  }

  def analyses
    Container.analyses_for_root(id)
  end

  def root_element
    root.containable
  end

  def self.create_root_container(**args)
    root_con = Container.create(name: 'root', container_type: 'root', **args)
    root_con.children.create(container_type: 'analyses')
    root_con
  end

  private

  def delete_attachment
    if Rails.env.production?
      attachments.each do |attachment|
        attachment.delay(run_at: 96.hours.from_now, queue: 'attachment_deletion').destroy!
      end
    else
      attachments.each(&:destroy!)
    end
  end

  # rubocop:disable Style/StringLiterals

  def content_to_plain_text
    return unless extended_metadata_changed?
    return if extended_metadata.blank? || (extended_metadata.present? && extended_metadata['content'].blank?)

    plain_text = Chemotion::QuillToPlainText.convert(extended_metadata['content'])
    return if plain_text.blank?

    self.plain_text_content = plain_text
  end
  # rubocop:enable Style/StringLiterals
end
