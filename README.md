# sunset-weather-dashboard
# Aurora Sky — Live Weather & Air Quality Dashboard

A responsive real-time weather and air quality web dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript**, powered by the **Open-Meteo REST API**.

## Live Demo
Check the live weather here: `https://tanishkabonthula23-jpg.github.io/sunset-weather-dashboard/`

## Key Features
- **Global City Search:** Converts any city name into latitude/longitude via Open-Meteo's Geocoding API.
- **Parallel API Requests:** Uses `Promise.all()` to fetch live weather conditions, 5-day forecasts, and US Air Quality Index (AQI) simultaneously.
- **Instant °C / °F Unit Switching:** Dynamically converts current, feels-like, and forecast temperatures without re-fetching data.
- **Persistent Quick-Access Cities:** Saves recent searches in `localStorage` for one-click switching.
- **Zero API Key Required:** Runs cleanly on GitHub Pages without exposing private API keys.

## Tech Stack
- **HTML5** & **CSS3** (CSS Grid, Flexbox, Glassmorphism)
- **JavaScript (ES6+)** (`async/await`, `fetch`, `Promise.all`, `localStorage`)
- **Open-Meteo API** (Geocoding, Weather Forecast & Air Quality endpoints)
