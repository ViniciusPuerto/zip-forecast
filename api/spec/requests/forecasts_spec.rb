require "rails_helper"

RSpec.describe "Forecasts", type: :request do
  around do |example|
    previous_cache = Rails.cache
    previous_perform_caching = Rails.application.config.action_controller.perform_caching
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    Rails.application.config.action_controller.perform_caching = true
    example.run
  ensure
    Rails.cache = previous_cache
    Rails.application.config.action_controller.perform_caching = previous_perform_caching
  end

  describe "GET /forecast" do
    it "returns bad request when zip is missing" do
      get "/forecast"
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to eq("error" => "zip is required")
    end

    it "returns bad request when zip is blank" do
      get "/forecast", params: { zip: "   " }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to eq("error" => "zip is required")
    end

    it "returns ok with zip param and provider data" do
      ENV["WORLD_WEATHER_ONLINE_API_KEY"] = "test-key"
      body = File.read(Rails.root.join("spec/fixtures/files/world_weather_online_success.json"))
      stub_request(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx})
        .to_return(status: 200, body: body, headers: { "Content-Type" => "application/json" })

      get "/forecast", params: { zip: "94102" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["zip"]).to eq("94102")
      expect(json["data"]).to be_a(Hash)
      expect(json["data"]["current_condition"]).to be_a(Array)
      expect(json["from_cache"]).to eq(false)
    ensure
      ENV.delete("WORLD_WEATHER_ONLINE_API_KEY")
    end

    it "returns from_cache true on second request and hits the weather API once" do
      ENV["WORLD_WEATHER_ONLINE_API_KEY"] = "test-key"
      body = File.read(Rails.root.join("spec/fixtures/files/world_weather_online_success.json"))
      stub_request(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx})
        .to_return(status: 200, body: body, headers: { "Content-Type" => "application/json" })

      get "/forecast", params: { zip: "94102" }
      expect(JSON.parse(response.body)["from_cache"]).to eq(false)

      get "/forecast", params: { zip: "94102" }
      expect(JSON.parse(response.body)["from_cache"]).to eq(true)

      expect(WebMock).to have_requested(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx}).times(1)
    ensure
      ENV.delete("WORLD_WEATHER_ONLINE_API_KEY")
    end

    it "uses separate cache entries for different zip values" do
      ENV["WORLD_WEATHER_ONLINE_API_KEY"] = "test-key"
      body = File.read(Rails.root.join("spec/fixtures/files/world_weather_online_success.json"))
      stub_request(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx})
        .to_return(status: 200, body: body, headers: { "Content-Type" => "application/json" })

      get "/forecast", params: { zip: "94102" }
      get "/forecast", params: { zip: "90210" }
      expect(WebMock).to have_requested(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx}).times(2)

      get "/forecast", params: { zip: "94102" }
      expect(JSON.parse(response.body)["from_cache"]).to eq(true)
      expect(WebMock).to have_requested(:get, %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx}).times(2)
    ensure
      ENV.delete("WORLD_WEATHER_ONLINE_API_KEY")
    end
  end
end
