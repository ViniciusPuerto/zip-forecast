require "rails_helper"

RSpec.describe "Forecasts", type: :request do
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
    ensure
      ENV.delete("WORLD_WEATHER_ONLINE_API_KEY")
    end
  end
end
