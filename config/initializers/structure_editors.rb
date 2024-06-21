# frozen_string_literal: true

# This initializer loads the optional configuration for:
#   the additional structure editors

# Specific
validations = lambda do |config, service|
  editor_count = config.send(service).editors.size
  raise ArgumentError, 'No Editor config' unless editor_count.positive?

  # set description
  config.send(service).desc = "#{editor_count} optional editors"
end

# Generic initialization
service = File.basename(__FILE__, '.rb').to_sym # Service name
service_setter = "#{service}=".to_sym # Service setter
ref = "Initializing #{service}:" # Message prefix

Rails.application.configure do
  config.send(service_setter, config_for(service)) # Load config/.yml

  validations.call(config, service) # Validate and set description

# Rescue:
# - RuntimeError is raised if the file is not found
# - NoMethodError is raised if the yml file cannot be parsed
rescue RuntimeError, NoMethodError, ArgumentError, URI::InvalidURIError => e
  Rails.logger.warn "#{ref} Error while loading configuration #{e.message}"
  # Create service key or clear config
  config.send(service_setter, nil)
ensure
  # Load default missing configuration if the yml file not found or no config is defined for the environment
  config.send(service_setter, config_for(:default_missing)) unless config.send(service)
  Rails.logger.info "#{ref} #{config.send(service).desc}"
end
