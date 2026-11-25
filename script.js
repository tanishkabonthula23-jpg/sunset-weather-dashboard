onst searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const recentCitiesEl = document.getElementById('recent-cities');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error-msg');
const weatherContentEl = document.getElementById('weather-content');

const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');

let currentUnit = 'C';
let latestData = null;
let recentCities = JSON.parse(localStorage.getItem('auroraRecentCities')) || [
  'Visakhapatnam',
  'Hyderabad',
  'Bengaluru',
  'Tokyo',
  'London'
];

// Map WMO Weather Codes to Emojis & Descriptions
function decodeWeatherCode(code) {
  if (code === 0) return { icon: '☀️', label: 'Clear Sky' };
  if ([1, 2].includes(code)) return { icon: '⛅', label: 'Partly Cloudy' };
  if (code === 3) return { icon: '☁️', label: 'Overcast' };
  if ([45, 48].includes(code)) return { icon: '🌫️', label: 'Foggy' };
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { icon: '🌧️', label: 'Rain Showers' };
  if ([71, 73, 75, 77].includes(code)) return { icon: '❄️', label: 'Snowfall' };
  if ([80, 81, 82].includes(code)) return { icon: '🌦️', label: 'Heavy Showers' };
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', label: 'Thunderstorm' };
  return { icon: '🌤️', label: 'Fair Weather' };
}

function formatTemp(celsius) {
  if (currentUnit === 'F') {
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Fetch Coordinates -> Weather & Air Quality
async function fetchWeatherForCity(cityQuery) {
  loaderEl.classList.remove('hidden');
  errorEl.classList.add('hidden');

  try {
    // 1. Geocoding API
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Could not find "${cityQuery}". Try another city name.`);
    }

    const place = geoData.results[0];
    const { latitude, longitude, name, country } = place;

    // 2. Fetch Forecast & Air Quality in parallel
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=5`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)]);
    const weatherData = await weatherRes.json();
    const aqiData = await aqiRes.json();

    latestData = {
      locationLabel: country ? `${name}, ${country}` : name,
      weather: weatherData,
      aqi: aqiData.current?.us_aqi ?? null
    };

    saveRecentCity(name);
    renderDashboard();
  } catch (err) {
    errorEl.textContent = err.message || 'Unable to load weather data right now.';
    errorEl.classList.remove('hidden');
  } finally {
    loaderEl.classList.add('hidden');
  }
}

function renderDashboard() {
  if (!latestData) return;

  const { locationLabel, weather, aqi } = latestData;
  const current = weather.current;
  const daily = weather.daily;
  const decoded = decodeWeatherCode(current.weather_code);

  // Header & Hero
  document.getElementById('city-name').textContent = locationLabel;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  document.getElementById('weather-icon').textContent = decoded.icon;
  document.getElementById('current-temp').textContent = formatTemp(current.temperature_2m);
  document.getElementById('weather-desc').textContent = decoded.label;

  document.getElementById('feels-like').textContent = formatTemp(current.apparent_temperature);
  document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
  document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;

  // Air Quality
  const aqiValEl = document.getElementById('aqi-value');
  const aqiBadgeEl = document.getElementById('aqi-badge');
  const aqiAdviceEl = document.getElementById('aqi-advice');

  if (aqi !== null) {
    aqiValEl.textContent = `${aqi} AQI`;
    aqiBadgeEl.className = 'aqi-status';
    if (aqi <= 50) {
      aqiBadgeEl.textContent = 'Good';
      aqiBadgeEl.classList.add('good');
      aqiAdviceEl.textContent = 'Clean air — ideal for outdoor activities.';
    } else if (aqi <= 100) {
      aqiBadgeEl.textContent = 'Moderate';
      aqiBadgeEl.classList.add('moderate');
      aqiAdviceEl.textContent = 'Acceptable air quality for most people.';
    } else {
      aqiBadgeEl.textContent = 'Unhealthy';
      aqiBadgeEl.classList.add('poor');
      aqiAdviceEl.textContent = 'Elevated pollution — limit prolonged outdoor exertion.';
    }
  } else {
    aqiValEl.textContent = 'N/A';
  }

  // Highlights
  document.getElementById('sunrise-time').textContent = formatTime(daily.sunrise[0]);
  document.getElementById('sunset-time').textContent = formatTime(daily.sunset[0]);
  document.getElementById('wind-dir').textContent = `${current.wind_direction_10m}°`;
  document.getElementById('rain-prob').textContent = `${daily.precipitation_probability_max[0] ?? 0}%`;

  // 5-Day Forecast
  const forecastListEl = document.getElementById('forecast-list');
  forecastListEl.innerHTML = '';

  daily.time.forEach((dateStr, idx) => {
    const dayDate = new Date(dateStr + 'T00:00:00');
    const dayName = idx === 0 ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dayInfo = decodeWeatherCode(daily.weather_code[idx]);

    const dayCard = document.createElement('div');
    dayCard.className = 'forecast-day';
    dayCard.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-icon">${dayInfo.icon}</div>
      <div class="day-temps">
        <span>${formatTemp(daily.temperature_2m_max[idx])}</span>
        <span class="low-temp">${formatTemp(daily.temperature_2m_min[idx])}</span>
      </div>
    `;
    forecastListEl.appendChild(dayCard);
  });

  weatherContentEl.classList.remove('hidden');
}

// Recent Cities Pills
function saveRecentCity(cityName) {
  recentCities = [cityName, ...recentCities.filter(c => c.toLowerCase() !== cityName.toLowerCase())].slice(0, 6);
  localStorage.setItem('auroraRecentCities', JSON.stringify(recentCities));
  renderRecentCities();
}

function renderRecentCities() {
  recentCitiesEl.innerHTML = '';
  recentCities.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'city-pill';
    btn.textContent = city;
    btn.addEventListener('click', () => fetchWeatherForCity(city));
    recentCitiesEl.appendChild(btn);
  });
}

// Event Listeners
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (query) {
    fetchWeatherForCity(query);
    cityInput.value = '';
  }
});

celsiusBtn.addEventListener('click', () => {
  if (currentUnit === 'C') return;
  currentUnit = 'C';
  celsiusBtn.classList.add('active');
  fahrenheitBtn.classList.remove('active');
  renderDashboard();
});

fahrenheitBtn.addEventListener('click', () => {
  if (currentUnit === 'F') return;
  currentUnit = 'F';
  fahrenheitBtn.classList.add('active');
  celsiusBtn.classList.remove('active');
  renderDashboard();
});

// Initialize Dashboard
renderRecentCities();
fetchWeatherForCity('Visakhapatnam');
