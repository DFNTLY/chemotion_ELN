# frozen_string_literal: true

module Entities
  # wraps a ReactionsSample object
  class ReactionMaterialEntity < ApplicationEntity
    expose! :coefficient
    expose! :equivalent
    expose! :position
    expose! :reference
    expose! :show_label
    expose! :waste
    expose! :feedstock_gas_reference
    expose! :gas
    expose! :gas_phase_data

    expose! :sample, using: 'Entities::SampleEntity', merge: true
  end
end
