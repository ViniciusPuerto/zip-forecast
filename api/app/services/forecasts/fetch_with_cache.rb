# frozen_string_literal: true

module Forecasts
  # Reads through Rails.cache before calling World Weather Online.
  class FetchWithCache
    TTL = 30.minutes
    KEY_PREFIX = %w[forecast v1].freeze

    class << self
      # @param zip [String] normalized query (postal code or lat,lng), already stripped
      # @return [Array(Hash, Boolean)] provider +data+ hash and whether it came from cache
      def call(zip)
        key = cache_key(zip)
        if (data = Rails.cache.read(key))
          [ data.deep_dup, true ]
        else
          data = WorldWeatherOnline::ForecastService.new.call(zip)
          Rails.cache.write(key, data, expires_in: TTL)
          [ data, false ]
        end
      end

      def cache_key(zip)
        [ *KEY_PREFIX, zip.to_s.strip ]
      end
    end
  end
end
