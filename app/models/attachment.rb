# == Schema Information
#
# Table name: attachments
#
#  id              :integer          not null, primary key
#  attachable_id   :integer
#  filename        :string
#  identifier      :uuid
#  checksum        :string
#  storage         :string(20)       default("tmp")
#  created_by      :integer          not null
#  created_for     :integer
#  version         :string
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  content_type    :string
#  bucket          :string
#  key             :string(500)
#  thumb           :boolean          default(FALSE)
#  folder          :string
#  attachable_type :string
#  aasm_state      :string
#  filesize        :bigint
#  attachment_data :jsonb
#  is_editing      :boolean          default(FALSE)
#  log_data        :jsonb
#
# Indexes
#
#  index_attachments_on_attachable_type_and_attachable_id  (attachable_type,attachable_id)
#  index_attachments_on_identifier                         (identifier) UNIQUE
#


class Attachment < ApplicationRecord
  include AttachmentJcampAasm
  include AttachmentJcampProcess
  include AttachmentConverter
  include AttachmentUploader::Attachment(:attachment)

  attr_accessor :file_data, :file_path, :thumb_path, :thumb_data, :duplicated, :transferred

  before_create :generate_key
  before_create :add_checksum, if: :new_upload
  before_create :add_content_type
  before_save :update_filesize


  #reload to get identifier:uuid
  after_create :reload, on: :create

  after_destroy :delete_file_and_thumbnail

  belongs_to :attachable, polymorphic: true, optional: true
  has_one :report_template

  scope :where_research_plan, lambda { |c_id|
    where(attachable_id: c_id, attachable_type: 'ResearchPlan')
  }

  scope :where_container, lambda { |c_id|
    where(attachable_id: c_id, attachable_type: 'Container')
  }

  scope :where_report, lambda { |r_id|
    where(attachable_id: r_id, attachable_type: 'Report')
  }

  scope :where_template, lambda {
    where(attachable_type: 'Template')
  }

  def copy(**args)
    d = self.dup
    d.identifier = nil
    d.duplicated = true
    d.update(args)
    d
  end

  def extname
    File.extname(self.filename.to_s)
  end

  def read_file
    attachment_attacher.file.read if attachment_attacher.file.present?
  end

  def read_thumbnail
    attachment(:thumbnail).read if attachment(:thumbnail).present?
  end

  def abs_path
    attachment_attacher.url if attachment_attacher.file.present?
  end

  def abs_prev_path
    store.prev_path
  end

  def store
    Storage.new_store(self)
  end

  def old_store(old_store = self.storage_was)
    Storage.old_store(self, old_store)
  end

  def add_checksum
    checksum = Digest::MD5.hexdigest(read_file) if self.attachment_attacher.file.present?
  end

  def reset_checksum
    add_checksum
    update if checksum_changed?
  end

  def regenerate_thumbnail
    return unless filesize <= 50 * 1024 * 1024

    store.regenerate_thumbnail
    update_column('thumb', thumb) if thumb_changed?
  end

  def for_research_plan?
    attachable_type == 'ResearchPlan'
  end

  def for_container?
    attachable_type == 'Container'
  end

  def research_plan_id
    for_research_plan? ? attachable_id : nil
  end

  def container_id
    for_container? ? attachable_id : nil
  end

  def research_plan
    for_research_plan? ? attachable : nil
  end

  def container
    for_container? ? attachable : nil
  end

  def update_research_plan!(c_id)
    update!(attachable_id: c_id, attachable_type: 'ResearchPlan')
  end

  def rewrite_file_data!
    return unless file_data.present?
    store.destroy
    store.store_file
    self
  end

  def update_filesize
    self.filesize = file_data.bytesize if file_data.present?
    self.filesize = File.size(file_path) if file_path.present? && File.exist?(file_path)
  end

  def add_content_type
    return if content_type.present?
    self.content_type = begin
                          MimeMagic.by_path(filename)&.type
                        rescue
                          nil
                        end
  end

  def reload
    super
  
    set_key
  end

  def set_key
    key = identifier
  end

  private

  def generate_key
    self.key = SecureRandom.uuid unless self.key
  end

  def new_upload
    self.storage == 'tmp'
  end

  def store_changed
    !self.duplicated && storage_changed?
  end

  def store_tmp_file_and_thumbnail
    stored = store.store_file
    self.thumb = store.store_thumb if stored
    stored
  end

  def store_file_and_thumbnail_for_dup
    #TODO have copy function inside store
    return unless self.filesize <= 50 * 1024 * 1024

    self.duplicated = nil
    if store.respond_to?(:path)
      self.file_path = store.path
    else
      self.file_data = store.read_file
    end
    if store.respond_to?(:thumb_path)
      self.thumb_path = store.thumb_path
    else
      self.thumb_data = store.read_thumb
    end
    stored = store.store_file
    self.thumb = store.store_thumb if stored
    self.save if stored
    stored
  end

  def transferred?
    self.transferred || false
  end

  def delete_file_and_thumbnail
    attachment_attacher.destroy
  end

  def move_from_store(from_store = self.storage_was)
    old_store.move_to_store(self.storage)
  end
end
