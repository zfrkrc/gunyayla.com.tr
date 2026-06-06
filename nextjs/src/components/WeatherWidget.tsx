"use client"

import { useEffect, useState } from "react"

const WEATHER_CODES: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Açık" },
  1: { icon: "🌤", label: "Az Bulutlu" },
  2: { icon: "⛅", label: "Parçalı Bulutlu" },
  3: { icon: "☁️", label: "Kapalı" },
  45: { icon: "🌫", label: "Sisli" },
  48: { icon: "🌫", label: "Yoğun Sis" },
  51: { icon: "🌦", label: "Hafif Yağmurlu" },
  53: { icon: "🌦", label: "Yağmurlu" },
  55: { icon: "🌧", label: "Şiddetli Yağmurlu" },
  61: { icon: "🌧", label: "Yağmurlu" },
  63: { icon: "🌧", label: "Yağmurlu" },
  65: { icon: "🌧", label: "Şiddetli Yağmurlu" },
  71: { icon: "🌨", label: "Hafif Karlı" },
  73: { icon: "🌨", label: "Karlı" },
  75: { icon: "❄️", label: "Şiddetli Karlı" },
  80: { icon: "🌦", label: "Sağanak Yağış" },
  81: { icon: "🌧", label: "Sağanak Yağış" },
  82: { icon: "🌧", label: "Şiddetli Sağanak" },
  95: { icon: "⛈", label: "Gök Gürültülü" },
  96: { icon: "⛈", label: "Gök Gürültülü Dolu" },
  99: { icon: "⛈", label: "Şiddetli Gök Gürültülü" },
}

type WeatherData = {
  temp: number
  code: number
  city: string
  humidity?: number
  wind?: number
}

export function WeatherWidget({
  latitude = 39.9334,
  longitude = 32.8597,
  city = "Ankara",
}: {
  latitude?: number
  longitude?: number
  city?: string
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe/Istanbul`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            code: data.current_weather.weathercode,
            city,
          })
        }
      })
      .catch(() => setError(true))
  }, [latitude, longitude, city])

  if (error || !weather) return null

  const w = WEATHER_CODES[weather.code] || { icon: "🌡", label: "Bilinmiyor" }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white shadow-sm">
      <div className="text-xs text-blue-200 uppercase tracking-wider mb-2 font-medium">
        {weather.city}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{weather.temp}°C</div>
          <div className="text-sm text-blue-100 mt-0.5">{w.label}</div>
        </div>
        <div className="text-5xl">{w.icon}</div>
      </div>
    </div>
  )
}
