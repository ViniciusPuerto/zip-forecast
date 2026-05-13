# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module WorldWeatherOnline
  Error = Class.new(StandardError)
  ConfigurationError = Class.new(Error)
  RequestError = Class.new(Error)
  ApiError = Class.new(Error)

  class ForecastService
    BASE_URL = "https://api.worldweatheronline.com/premium/v1/weather.ashx"

    DEFAULT_QUERY = {
      "format" => "json",
      "num_of_days" => "7",
      "tp" => "1",
      "fx24" => "yes",
      "extra" => "isDayTime,utcDateTime,localObsTime",
      "aqi" => "yes",
      "alerts" => "yes",
      "mca" => "yes",
      "includelocation" => "yes",
      "showlocaltime" => "yes",
      "showmap" => "yes",
      "cc" => "yes",
      "fx" => "yes"
    }.freeze

    def initialize(api_key: ENV["WORLD_WEATHER_ONLINE_API_KEY"].to_s.strip)
      @api_key = api_key
    end

    # @param location [String] any WWO +q+ value (city, US ZIP, UK postcode, lat,lng, …)
    # @return [Hash] the provider +data+ object (string keys), unmodified shape
    def call(location)
      raise ConfigurationError, "WORLD_WEATHER_ONLINE_API_KEY is not set" if @api_key.blank?

      uri = build_uri(location)
      response = perform_get(uri)

      unless response.is_a?(Net::HTTPSuccess)
        raise RequestError, "weather API HTTP #{response.code}"
      end

      payload = parse_json(response.body)
      extract_data!(payload)
    end

    private

    def build_uri(location)
      query = DEFAULT_QUERY.merge(
        "key" => @api_key,
        "q" => location.to_s
      )
      uri = URI(BASE_URL)
      uri.query = URI.encode_www_form(query)
      uri
    end

    def perform_get(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.open_timeout = 5
      http.read_timeout = 15
      http.get(uri.request_uri)
    rescue SocketError, IOError, Net::OpenTimeout, Net::ReadTimeout => e
      raise RequestError, e.message
    end

    def parse_json(body)
      JSON.parse(body)
    rescue JSON::ParserError
      raise RequestError, "invalid JSON from weather API"
    end

    def extract_data!(payload)
      data = payload["data"]
      raise RequestError, "unexpected weather API response" unless data.is_a?(Hash)

      if data.key?("error") && data["error"]
        raw_err = data["error"]
        list = raw_err.is_a?(Array) ? raw_err : [ raw_err ]
        messages = list.filter_map do |e|
          next unless e.is_a?(Hash)

          e["msg"] || e[:msg]
        end
        raise ApiError, (messages.compact.join(", ").presence || "weather API error")
      end

      data
    end
  end
end
