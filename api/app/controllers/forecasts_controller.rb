class ForecastsController < ApplicationController
  def show
    location = location_query
    if location.blank?
      render json: { error: "q is required" }, status: :bad_request
      return
    end

    data, from_cache = Forecasts::FetchWithCache.call(location)
    render json: { q: location, data: data, from_cache: from_cache }, status: :ok
  rescue WorldWeatherOnline::ConfigurationError
    render json: { error: "weather service is not configured" }, status: :service_unavailable
  rescue WorldWeatherOnline::ApiError, WorldWeatherOnline::RequestError => e
    render json: { error: e.message }, status: :bad_gateway
  end

  private

  # WWO's `q` accepts city, ZIP/postcode, lat,lng, etc. Prefer `q`; `zip` kept as a backward-compatible alias.
  def location_query
    (params[:q].presence || params[:zip]).to_s.strip
  end
end
