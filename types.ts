
export interface Coordinates {
  lat: number;
  lon: number;
}

export interface WeatherLocation {
  id: string;
  name: string; // City level, e.g., "北京市"
  district?: string; // District level, e.g., "朝阳区"
  coords: Coordinates;
  isCurrentLocation: boolean;
}

export interface HourlyForecast {
  time: string; // HH:mm
  temp: number;
  icon: WeatherIconType;
  pop: number; // Probability of precipitation
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue
  minTemp: number;
  maxTemp: number;
  icon: WeatherIconType;
  condition: string;
}

export interface WeatherAlert {
  title: string;
  description: string;
  level: 'standard' | 'minor' | 'moderate' | 'major' | 'severe';
  source: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  highTemp: number;
  lowTemp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  aqi: number; // Air Quality Index
  aqiDescription: string;
  icon: WeatherIconType;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  lastUpdated: number;
}

export type WeatherIconType = 
  | 'clear-day' | 'clear-night' 
  | 'partly-cloudy-day' | 'partly-cloudy-night' 
  | 'cloudy' | 'rain' | 'snow' | 'wind' | 'fog' | 'thunderstorm';

export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export enum Language {
  EN = 'en',
  ZH = 'zh'
}

export enum LocationService {
  TENCENT = 'tencent',
  OSM = 'osm'
}

export interface AppSettings {
  unit: 'metric' | 'imperial';
  language: Language;
  theme: AppTheme;
  locationService: LocationService;
  // Notification Settings
  enableNotifications: boolean;
  morningReportTime: string; // Format "08:00"
  eveningReportTime: string; // Format "20:00"
}
