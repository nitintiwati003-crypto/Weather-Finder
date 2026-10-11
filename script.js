// ==========================================
// WEATHER FINDER APP
// HTML + CSS + JavaScript
// Free Weather API: Open-Meteo
// ==========================================

const $ = (id) => document.getElementById(id);

// Weather codes and icons
const weatherCodes = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Foggy", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    56: ["Freezing Drizzle", "🌧️"],
    57: ["Heavy Freezing Drizzle", "🌧️"],
    61: ["Light Rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    66: ["Freezing Rain", "🌧️"],
    67: ["Heavy Freezing Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy Snow", "❄️"],
    77: ["Snow Grains", "🌨️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Heavy Rain Showers", "⛈️"],
    85: ["Snow Showers", "🌨️"],
    86: ["Heavy Snow Showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Severe Thunderstorm", "⛈️"]
};

// Get weather condition and icon
function weatherInfo(code) {
    return weatherCodes[code] || ["Unknown Weather", "🌡️"];
}

// Show status messages
function setStatus(message) {
    const status = $("status");

    if (status) {
        status.textContent = message;
    }
}

// Fetch JSON data from an API
async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch data from the weather service.");
    }

    return response.json();
}

// ==========================================
// SEARCH CITY
// ==========================================

async function searchCity(city) {
    if (!city || !city.trim()) {
        setStatus("Please enter a city name.");
        return;
    }

    setStatus("Searching for city...");

    try {
        const params = new URLSearchParams({
            name: city.trim(),
            count: 1,
            language: "en",
            format: "json"
        });

        const url =
            "https://geocoding-api.open-meteo.com/v1/search?" +
            params.toString();

        const data = await getJSON(url);

        if (!data.results || data.results.length === 0) {
            setStatus("City not found. Please try another city.");
            return;
        }

        const place = data.results[0];

        const cityName = [
            place.name,
            place.admin1,
            place.country
        ].filter(Boolean).join(", ");

        await loadWeather(
            place.latitude,
            place.longitude,
            cityName
        );

    } catch (error) {
        console.error("City search error:", error);

        setStatus(
            "Unable to search city. Please check your internet connection."
        );
    }
}

// ==========================================
// LOAD WEATHER DATA
// ==========================================

async function loadWeather(latitude, longitude, cityName) {
    setStatus("Loading weather information...");

    try {
        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m"
            ].join(","),

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "uv_index_max",
                "precipitation_probability_max",
                "sunrise",
                "sunset"
            ].join(","),

            timezone: "auto",
            forecast_days: 5
        });

        const url =
            "https://api.open-meteo.com/v1/forecast?" +
            params.toString();

        const data = await getJSON(url);

        if (!data.current || !data.daily) {
            throw new Error("Weather data is incomplete.");
        }

        displayWeather(data, cityName);

        setStatus("Weather updated successfully!");

    } catch (error) {
        console.error("Weather loading error:", error);

        setStatus(
            "Unable to load weather. Check your internet connection and try again."
        );
    }
}

// ==========================================
// DISPLAY CURRENT WEATHER
// ==========================================

function displayWeather(data, cityName) {
    const current = data.current;
    const daily = data.daily;

    const weather = weatherInfo(current.weather_code);

    if ($("cityName")) {
        $("cityName").textContent = cityName;
    }

    if ($("currentDate")) {
        $("currentDate").textContent =
            new Date(current.time).toLocaleString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            });
    }

    if ($("temperature")) {
        $("temperature").textContent =
            Math.round(current.temperature_2m);
    }

    if ($("feelsLike")) {
        $("feelsLike").textContent =
            Math.round(current.apparent_temperature);
    }

    if ($("condition")) {
        $("condition").textContent = weather[0];
    }

    if ($("weatherIcon")) {
        $("weatherIcon").textContent = weather[1];
    }

    if ($("humidity")) {
        $("humidity").textContent =
            current.relative_humidity_2m + "%";
    }

    if ($("wind")) {
        $("wind").textContent =
            current.wind_speed_10m + " km/h";
    }

    if ($("pressure")) {
        $("pressure").textContent =
            Math.round(current.surface_pressure) + " hPa";
    }

    if ($("uv")) {
        const uvIndex = daily.uv_index_max[0];

        $("uv").textContent =
            uvIndex == null ? "N/A" : uvIndex;
    }

    // Display 5-day forecast
    displayForecast(daily);

    // Display smart suggestions
    displayInsights(current, daily);

    // Display sunrise and sunset in status-independent elements
    // These can be added to the HTML later.
    console.log("Sunrise:", daily.sunrise?.[0]);
    console.log("Sunset:", daily.sunset?.[0]);
}

// ==========================================
// DISPLAY 5-DAY FORECAST
// ==========================================

function displayForecast(daily) {
    const forecastContainer = $("forecast");

    if (!forecastContainer) {
        console.error("Forecast container not found in HTML.");
        return;
    }

    forecastContainer.replaceChildren();

    daily.time.forEach((date, index) => {
        const weather = weatherInfo(daily.weather_code[index]);

        const maxTemp = daily.temperature_2m_max[index];
        const minTemp = daily.temperature_2m_min[index];

        const probability =
            daily.precipitation_probability_max[index];

        // Forecast card
        const card = document.createElement("article");
        card.className = "forecast-card";

        // Date
        const day = document.createElement("p");

        day.textContent = new Date(
            date + "T12:00:00"
        ).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        // Weather icon
        const weatherIcon = document.createElement("div");

        weatherIcon.className = "forecast-icon";
        weatherIcon.textContent = weather[1];

        // Weather condition
        const name = document.createElement("small");

        name.textContent = weather[0];

        // Temperatures
        const temperatures = document.createElement("h3");

        temperatures.textContent =
            Math.round(maxTemp) + "° / " +
            Math.round(minTemp) + "°C";

        // Rain probability
        const rain = document.createElement("small");

        if (probability == null) {
            rain.textContent = "Rain chance unavailable";
        } else {
            rain.textContent =
                "Rain chance: " + probability + "%";
        }

        // Add everything to the card
        card.append(
            day,
            weatherIcon,
            name,
            temperatures,
            rain
        );

        forecastContainer.appendChild(card);
    });
}

// ==========================================
// SMART WEATHER INSIGHTS
// ==========================================

function displayInsights(current, daily) {
    const temp = current.temperature_2m;
    const code = current.weather_code;

    const rainChance =
        daily.precipitation_probability_max[0];

    const rainyCodes = [
        51, 53, 55, 56, 57,
        61, 63, 65, 66, 67,
        80, 81, 82, 95, 96, 99
    ];

    let insight = "";

    if (rainyCodes.includes(code)) {
        insight =
            "Rain or storm conditions may occur. " +
            "Carry an umbrella and check local weather alerts.";
    } else if (temp >= 35) {
        insight =
            "The weather is very hot. Drink enough water, " +
            "wear light clothing and avoid prolonged exposure to heat.";
    } else if (temp >= 30) {
        insight =
            "The weather is warm. Stay hydrated and consider " +
            "avoiding strenuous outdoor activity during peak heat.";
    } else if (temp <= 10) {
        insight =
            "The weather is cold. Wear warm clothes when outdoors.";
    } else {
        insight =
            "Conditions may be suitable for everyday activities. " +
            "Check the forecast before making outdoor plans.";
    }

    if (rainChance != null && rainChance >= 60) {
        insight +=
            " There is also a high chance of rain today.";
    }

    if ($("insight")) {
        $("insight").textContent = insight;
    }

    // Activity suggestions
    let activity = "";

    if (rainChance != null && rainChance >= 60) {
        activity =
            "Indoor exercise may be a better choice because " +
            "rain could affect outdoor plans.";
    } else if (temp >= 33) {
        activity =
            "Try walking or exercising early in the morning " +
            "or in the evening when it is cooler.";
    } else if (rainyCodes.includes(code)) {
        activity =
            "Consider indoor activities if rain or thunderstorms " +
            "make outdoor conditions unsafe.";
    } else {
        activity =
            "Walking, cycling or light outdoor exercise may be " +
            "suitable if local conditions are safe.";
    }

    if ($("activity")) {
        $("activity").textContent = activity;
    }
}

// ==========================================
// CURRENT LOCATION
// ==========================================

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        setStatus(
            "Your browser does not support location services."
        );
        return;
    }

    setStatus("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            let cityName = "Your Current Location";

            // Try to find the location's city name
            try {
                const params = new URLSearchParams({
                    latitude: latitude,
                    longitude: longitude,
                    language: "en",
                    format: "json"
                });

                const url =
                    "https://geocoding-api.open-meteo.com/v1/reverse?" +
                    params.toString();

                const data = await getJSON(url);

                if (data.results && data.results.length > 0) {
                    const place = data.results[0];

                    cityName = [
                        place.name,
                        place.country
                    ].filter(Boolean).join(", ");
                }
            } catch (error) {
                console.warn(
                    "Could not determine city name:",
                    error
                );
            }

            await loadWeather(
                latitude,
                longitude,
                cityName
            );
        },

        function (error) {
            let message = "Unable to get your location.";

            if (error.code === 1) {
                message =
                    "Location permission denied. Allow location access in your browser.";
            } else if (error.code === 2) {
                message =
                    "Your current location could not be determined.";
            } else if (error.code === 3) {
                message =
                    "Location request timed out. Please try again.";
            }

            setStatus(message);
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// City search form
const searchForm = $("searchForm");

if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const cityInput = $("cityInput");

        if (cityInput) {
            searchCity(cityInput.value);
        }
    });
}

// Current location button
const locationButton = $("locationBtn");

if (locationButton) {
    locationButton.addEventListener("click", function () {
        getCurrentLocation();
    });
}

// ==========================================
// START APP
// ==========================================

// Load Mumbai weather when the app opens.
searchCity("Mumbai");