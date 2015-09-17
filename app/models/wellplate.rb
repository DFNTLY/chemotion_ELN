class Wellplate < ActiveRecord::Base
  has_many :collections_wellplates
  has_many :collections, through: :collections_wellplates

  has_many :wellplates_samples

  has_many :wells
end
