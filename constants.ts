
import { WeatherLocation, AppSettings, Language, AppTheme, LocationService } from './types';

// ============================================================================
// API CONFIGURATION
// Replace these with your actual keys to use real data.
// If keys are empty, the app will automatically fallback to MOCK data.
// ============================================================================
export const CAIYUN_API_KEY = "19o10LzcwHoF3FJY"; // Enter your Caiyun Token
export const OPENWEATHER_API_KEY = "9393c55a6a2bccb1c47d368d0c42bfba"; // Enter your OpenWeather Key
export const TENCENT_MAP_API_KEY = "SKZBZ-K5Krd-N4W4X-PI623-73N7S-SMF5M"; // Key for demo/testing. Replace with your own if needed.

// ============================================================================
// LOCALIZATION
// ============================================================================
export const TRANSLATIONS = {
  [Language.EN]: {
    home: "Home",
    locations: "Locations",
    settings: "Settings",
    feelsLike: "Feels Like",
    humidity: "Humidity",
    wind: "Wind",
    uvIndex: "UV Index",
    aqi: "Air Quality",
    hourly: "24-Hour Forecast",
    daily: "7-Day Forecast",
    addLocation: "Add Location",
    currentLocation: "Current Location",
    manageLocations: "Manage Cities",
    unit: "Unit",
    language: "Language",
    theme: "Theme",
    locationService: "Location Service",
    serviceTencent: "Tencent Maps (Recommended for China)",
    serviceOsm: "OpenStreetMap (Global)",
    about: "About",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    searchPlaceholder: "Search city...",
    loading: "Loading...",
    gpsError: "GPS Unavailable",
    unknownLocation: "Unknown Location",
    unknown: "Unknown",
    today: "Today",
    alerts: "Weather Alerts",
    noAlerts: "No weather alerts",
    // UV Levels
    uvLow: "Low",
    uvModerate: "Moderate",
    uvHigh: "High",
    uvVeryHigh: "Very High",
    uvExtreme: "Extreme",
    // Humidity Levels
    humidityLow: "Dry",
    humidityModerate: "Comfortable",
    humidityHigh: "Humid",
    noData: "No forecast data available",
    // Notifications
    notifications: "Notifications",
    enableNotifications: "Enable Notifications",
    morningReport: "Morning Report",
    eveningReport: "Evening Report",
    precipWarning: "Precipitation Warning",
    precipWarningDesc: "Rain or snow expected in the next 2 hours.",
    morningReportTitle: "Morning Forecast",
    eveningReportTitle: "Tomorrow's Forecast"
  },
  [Language.ZH]: {
    home: "首页",
    locations: "城市管理",
    settings: "设置",
    feelsLike: "体感温度",
    humidity: "相对湿度",
    wind: "风速",
    uvIndex: "紫外线",
    aqi: "空气质量",
    hourly: "24小时预报",
    daily: "未来7天预报",
    addLocation: "添加城市",
    currentLocation: "当前位置",
    manageLocations: "管理城市",
    unit: "单位",
    language: "语言",
    theme: "主题",
    locationService: "定位服务",
    serviceTencent: "腾讯地图 (国内推荐)",
    serviceOsm: "OpenStreetMap (全球)",
    about: "关于",
    goodMorning: "早上好",
    goodAfternoon: "下午好",
    goodEvening: "晚上好",
    searchPlaceholder: "输入城市名称搜索...",
    loading: "正在获取天气...",
    gpsError: "无法获取定位",
    unknownLocation: "未知位置",
    unknown: "未知",
    today: "今天",
    alerts: "气象预警",
    noAlerts: "暂无预警信息",
    // UV Levels
    uvLow: "低",
    uvModerate: "中等",
    uvHigh: "高",
    uvVeryHigh: "很高",
    uvExtreme: "极高",
    // Humidity Levels
    humidityLow: "干燥",
    humidityModerate: "舒适",
    humidityHigh: "潮湿",
    noData: "暂无预报数据",
    // Notifications
    notifications: "消息通知",
    enableNotifications: "开启通知",
    morningReport: "早间播报 (今日天气)",
    eveningReport: "晚间播报 (明日预报)",
    precipWarning: "临近降水提醒",
    precipWarningDesc: "未来2小时内可能有降水，请注意防范。",
    morningReportTitle: "今日天气播报",
    eveningReportTitle: "明日天气预告"
  }
};

// ============================================================================
// DEFAULT STATE
// ============================================================================
export const DEFAULT_SETTINGS: AppSettings = {
  unit: 'metric',
  language: Language.ZH, 
  theme: AppTheme.SYSTEM,
  locationService: LocationService.OSM,
  enableNotifications: false,
  morningReportTime: "08:00",
  eveningReportTime: "20:00"
};

export const DEFAULT_LOCATIONS: WeatherLocation[] = [
  {
    id: 'loc_1',
    name: '北京市',
    district: '朝阳区',
    coords: { lat: 39.9042, lon: 116.4074 },
    isCurrentLocation: false
  },
  {
    id: 'loc_2',
    name: '上海市',
    district: '浦东新区',
    coords: { lat: 31.2304, lon: 121.4737 },
    isCurrentLocation: false
  }
];
