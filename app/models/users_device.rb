# == Schema Information
#
# Table name: users_devices
#
#  id              :integer          not null, primary key
#  user_id         :integer
#  device_id       :integer
#  is_super_device :boolean          default(FALSE)
#

class UsersDevice < ApplicationRecord
  belongs_to :user
  belongs_to :device

  scope :by_user_ids, ->(ids) { where(user_id: ids) }
end
