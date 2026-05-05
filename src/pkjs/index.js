/**
 * Phone-side proxy and settings handler
 *
 * Uses @moddable/pebbleproxy to forward fetch() and Location requests
 * from the watch through the phone to the internet.
 *
 * IMPORTANT: PKJS in this SDK uses an older JS runtime/bundler.
 * - `fetch` is not available in PKJS (ReferenceError at runtime)
 * - `async`/`await` is not supported by the webpack parser in this toolchain
 *
 * For that reason, weather requests here use XMLHttpRequest + Promise chains.
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

const moddableProxy = require("@moddable/pebbleproxy");

const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000;
const WEATHER_CACHE_KEY = "carbon.weather.v1";
const USE_TEST_LOCATION = false;
const TEST_LOCATION = Object.freeze({
	latitude: 41.505493,
	longitude: -81.681290,
});

// Cache the last successful weather payload on the phone to avoid redundant
// API calls when the watchface is reopened within a short interval.
let weatherCache = null;

function hasFreshCache(cache, now) {
	return !!cache && !!cache.payload && Number.isFinite(cache.expiresAt) && (now < cache.expiresAt);
}

function getWeatherWindowEnd(now) {
	return (Math.floor(now / WEATHER_REFRESH_INTERVAL) * WEATHER_REFRESH_INTERVAL) + WEATHER_REFRESH_INTERVAL;
}

function readWeatherCacheFromStorage() {
	try {
		if (!localStorage || !localStorage.getItem)
			return null;

		const raw = localStorage.getItem(WEATHER_CACHE_KEY);
		if (!raw)
			return null;

		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object")
			return null;
		if (!parsed.payload || !Number.isFinite(parsed.expiresAt))
			return null;

		return {
			expiresAt: parsed.expiresAt,
			payload: parsed.payload,
		};
	} catch (_e) {
		return null;
	}
}

function writeWeatherCacheToStorage(cache) {
	try {
		if (!localStorage || !localStorage.setItem)
			return;
		localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
	} catch (_e) {
		// Ignore storage failures. In-memory cache is still available.
	}
}

function getFreshWeatherCache(now) {
	if (hasFreshCache(weatherCache, now))
		return weatherCache;

	const persisted = readWeatherCacheFromStorage();
	if (!hasFreshCache(persisted, now))
		return null;

	weatherCache = persisted;
	return weatherCache;
}

function buildCurrentUrl(latitude, longitude) {
	return `${WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=precipitation_probability,temperature_2m&forecast_hours=24&daily=sunrise,sunset,temperature_2m_min,temperature_2m_max&forecast_days=1&temperature_unit=fahrenheit&timeformat=unixtime`;
}

function clampInt(value, min, max) {
	const n = Math.round(Number(value) || 0);
	if (n < min) return min;
	if (n > max) return max;
	return n;
}

function makeChunkString(values, start, count) {
	return values.slice(start, start + count).join(",");
}

function requestJSON(url) {
	return new Promise(function(resolve, reject) {
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.onload = function() {
			if (req.status < 200 || req.status >= 300) {
				reject(new Error("HTTP " + req.status + " from " + url));
				return;
			}

			try {
				resolve(JSON.parse(req.responseText));
			} catch (e) {
				reject(new Error("JSON parse failed: " + e));
			}
		};
		req.onerror = function() {
			reject(new Error("XHR failed for " + url));
		};
		req.send();
	});
}

function requestCoordinates() {
	if (USE_TEST_LOCATION) {
		return Promise.resolve({
			latitude: TEST_LOCATION.latitude,
			longitude: TEST_LOCATION.longitude,
		});
	}

	return new Promise(function(resolve, reject) {
		if (!navigator || !navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
			reject(new Error("Geolocation unavailable"));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			function(position) {
				if (!position || !position.coords) {
					reject(new Error("Geolocation returned no coordinates"));
					return;
				}

				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			function(error) {
				reject(new Error("Geolocation failed: " + JSON.stringify(error)));
			},
			{
				enableHighAccuracy: false,
				timeout: 15000,
				maximumAge: 300000,
			}
		);
	});
}

function sendPayload(payload) {
	Pebble.sendAppMessage(payload,
		function() { console.log("pkjs weather payload sent"); },
		function(err) { console.error("pkjs weather payload failed: " + JSON.stringify(err)); }
	);
}

function buildWeatherPayload(weatherData) {
	if (!weatherData || !weatherData.current || !weatherData.hourly || !weatherData.hourly.precipitation_probability || !weatherData.hourly.temperature_2m || !weatherData.daily || !weatherData.daily.sunrise || !weatherData.daily.sunset || !weatherData.daily.temperature_2m_min || !weatherData.daily.temperature_2m_max)
		return null;

	var precipSource = weatherData.hourly.precipitation_probability.slice(0, 24);
	var hourlyPrecip = precipSource.map(function(value) {
		return clampInt(value, 0, 100);
	});
	var tempSource = weatherData.hourly.temperature_2m.slice(0, 24);
	var currentTemp = clampInt(weatherData.current.temperature_2m, -99, 199);
	var hourlyTemp = tempSource.map(function(value) {
		return clampInt(value, -99, 199);
	});

	while (hourlyPrecip.length < 24)
		hourlyPrecip.push(0);
	while (hourlyTemp.length < 24)
		hourlyTemp.push(currentTemp);

	return {
		WEATHER_TEMP: currentTemp,
		WEATHER_TEMP_LOW: clampInt(weatherData.daily.temperature_2m_min[0], -99, 199),
		WEATHER_TEMP_HIGH: clampInt(weatherData.daily.temperature_2m_max[0], -99, 199),
		WEATHER_TEMP_HOURLY_0: makeChunkString(hourlyTemp, 0, 8),
		WEATHER_TEMP_HOURLY_1: makeChunkString(hourlyTemp, 8, 8),
		WEATHER_TEMP_HOURLY_2: makeChunkString(hourlyTemp, 16, 8),
		WEATHER_CODE: clampInt(weatherData.current.weather_code, 0, 99),
		WEATHER_PRECIP_0: makeChunkString(hourlyPrecip, 0, 8),
		WEATHER_PRECIP_1: makeChunkString(hourlyPrecip, 8, 8),
		WEATHER_PRECIP_2: makeChunkString(hourlyPrecip, 16, 8),
		WEATHER_SUNRISE: clampInt(weatherData.daily.sunrise[0], 0, 2147483647),
		WEATHER_SUNSET: clampInt(weatherData.daily.sunset[0], 0, 2147483647),
		WEATHER_ERROR: 0,
	};
}

function fetchAndSendWeather() {
	var now = Date.now();
	var cached = getFreshWeatherCache(now);
	if (cached) {
		console.log("pkjs weather cache hit");
		sendPayload(cached.payload);
		return;
	}

	requestCoordinates()
		.then(function(coords) {
			var weatherUrl = buildCurrentUrl(coords.latitude, coords.longitude);
			console.log("pkjs weather url: " + weatherUrl);
			return requestJSON(weatherUrl);
		})
		.then(function(weatherData) {
			var payload = buildWeatherPayload(weatherData);
			if (!payload) {
				sendPayload({ WEATHER_ERROR: 2 });
				return;
			}

			weatherCache = {
				expiresAt: getWeatherWindowEnd(Date.now()),
				payload,
			};
			writeWeatherCacheToStorage(weatherCache);
			sendPayload(payload);
		})
		.catch(function(e) {
			console.error("pkjs weather fetch failed: " + e);
			sendPayload({ WEATHER_ERROR: 1 });
		});
}

Pebble.addEventListener("ready", moddableProxy.readyReceived);
Pebble.addEventListener("appmessage", function(e) {
	if (moddableProxy.appMessageReceived(e))
		return;

	if (e && e.payload && e.payload.WEATHER_REQUEST !== undefined)
		fetchAndSendWeather();

	// Relay health data back to the watch so the JS layer can receive it.
	if (e && e.payload && (e.payload.HEALTH_STEPS !== undefined || e.payload.HEART_RATE_BPM !== undefined)) {
		const relay = {};
		if (e.payload.HEALTH_STEPS !== undefined)
			relay.HEALTH_STEPS = e.payload.HEALTH_STEPS;
		if (e.payload.HEART_RATE_BPM !== undefined)
			relay.HEART_RATE_BPM = e.payload.HEART_RATE_BPM;

		Pebble.sendAppMessage(
			relay,
			function() { console.log("pkjs health relay sent"); },
			function(err) { console.error("pkjs health relay failed: " + JSON.stringify(err)); }
		);
	}
});
