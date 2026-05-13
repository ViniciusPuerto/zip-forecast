class ForecastsController < ApplicationController
  def show
    zip = params[:zip].to_s.strip
    if zip.blank?
      render json: { error: "zip is required" }, status: :bad_request
      return
    end

    data, from_cache = Forecasts::FetchWithCache.call(zip)
    render json: { zip: zip, data: data, from_cache: from_cache }, status: :ok
  rescue WorldWeatherOnline::ConfigurationError
    render json: { error: "weather service is not configured" }, status: :service_unavailable
  rescue WorldWeatherOnline::ApiError, WorldWeatherOnline::RequestError => e
    render json: { error: e.message }, status: :bad_gateway
  end
end
