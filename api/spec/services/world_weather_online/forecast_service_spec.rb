# frozen_string_literal: true

require "rails_helper"

RSpec.describe WorldWeatherOnline::ForecastService do
  let(:fixture_path) { Rails.root.join("spec/fixtures/files/world_weather_online_success.json") }
  let(:success_body) { File.read(fixture_path) }
  let(:wwo_uri_matcher) { %r{\Ahttps://api\.worldweatheronline\.com/premium/v1/weather\.ashx} }

  describe "#call" do
    it "raises ConfigurationError when API key is blank" do
      expect do
        described_class.new(api_key: "   ").call("94102")
      end.to raise_error(WorldWeatherOnline::ConfigurationError, /WORLD_WEATHER_ONLINE_API_KEY/)
    end

    it "returns the data hash on success" do
      stub_request(:get, wwo_uri_matcher)
        .with(
          query: hash_including(
            "key" => "secret-key",
            "q" => "94102",
            "format" => "json",
            "num_of_days" => "7",
            "tp" => "1",
            "fx24" => "yes",
            "aqi" => "yes",
            "alerts" => "yes",
            "mca" => "yes"
          )
        )
        .to_return(status: 200, body: success_body, headers: { "Content-Type" => "application/json" })

      result = described_class.new(api_key: "secret-key").call("94102")

      expect(result).to be_a(Hash)
      expect(result["current_condition"]).to be_a(Array)
      expect(result.dig("current_condition", 0, "temp_F")).to eq("60")
    end

    it "raises RequestError on non-success HTTP status" do
      stub_request(:get, wwo_uri_matcher).to_return(status: 503, body: "unavailable")

      expect do
        described_class.new(api_key: "secret-key").call("94102")
      end.to raise_error(WorldWeatherOnline::RequestError, /HTTP 503/)
    end

    it "raises ApiError when the payload contains data.error" do
      error_body = File.read(Rails.root.join("spec/fixtures/files/world_weather_online_error.json"))
      stub_request(:get, wwo_uri_matcher).to_return(status: 200, body: error_body)

      expect do
        described_class.new(api_key: "secret-key").call("94102")
      end.to raise_error(WorldWeatherOnline::ApiError, /Invalid API key/)
    end

    it "raises RequestError on malformed JSON" do
      stub_request(:get, wwo_uri_matcher).to_return(status: 200, body: "not json")

      expect do
        described_class.new(api_key: "secret-key").call("94102")
      end.to raise_error(WorldWeatherOnline::RequestError, /invalid JSON/)
    end
  end
end
