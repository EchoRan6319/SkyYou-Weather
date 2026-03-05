
import { WeatherLocation, AppSettings, Language, AppTheme, WeatherSource } from './types';
export { WeatherSource };

// ============================================================================
// API CONFIGURATION
// Replace these with your actual keys to use real data.
// If keys are empty, the app will automatically fallback to MOCK data.
// ============================================================================
export const CAIYUN_API_KEY = "请填写你的彩云天气API Key"; // Enter your Caiyun Token
export const OPENWEATHER_API_KEY = "请填写你的OPEN WEATHER API Key"; // Enter your OpenWeather Key
export const QWEATHER_API_KEY = "请填写你的和风天气API Key"; // To be filled by user
export const QWEATHER_API_HOST = "请填写你的和风天气API Key"; // To be filled by user

export const SETTINGS_STORAGE_KEY = 'skyyou_settings';
export const LOCATIONS_STORAGE_KEY = 'skyyou_locations';
export const CURRENT_LOC_STORAGE_KEY = 'skyyou_current_loc_id';
export const WEATHER_CACHE_KEY = 'skyyou_weather_cache';
export const ONBOARDED_STORAGE_KEY = 'skyyou_has_onboarded';

// ============================================================================
// LOCALIZATION
// ============================================================================
export const TRANSLATIONS = {
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
    manageLocations: "城市管理",
    unit: "单位",
    language: "语言",
    theme: "主题",
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
    eveningReportTitle: "明日天气预告",
    permissionDenied: "通知权限已被拒绝，请在浏览器设置中开启。",
    // Unit Settings
    unitMetric: "公制 (°C, km/h)",
    unitImperial: "英制 (°F, mph)",
    // Data Management
    dataManagement: "存储管理",
    clearData: "清除所有数据",
    clearDataDesc: "重置应用为初始状态。此操作无法撤销。",
    clearDataConfirm: "确定要清除所有数据吗？这将重置应用并删除所有保存的城市和设置。",
    cleared: "数据已清除",
    // PWA
    pwaTitle: "安装应用",
    pwaGuide: "查看 PWA 安装指南",
    pwaDesc: "为了获得更沉浸的体验以及开启通知功能，建议将本项目安装为应用。",
    // Weather Source
    weatherSource: "数据源",
    sourceMixed: "混合 (推荐)",
    sourceQWeather: "和风天气",
    sourceCaiyun: "彩云天气",
    sourceOpenWeather: "OpenWeather",
    sourceWarning: "注意：切换至单一数据源可能会由于 API 限制导致部分数据（如 24 小时预报）缺失。"
  }
};

// ============================================================================
// DEFAULT STATE
// ============================================================================
export const DEFAULT_SETTINGS: AppSettings = {
  language: Language.ZH,
  theme: AppTheme.SYSTEM,
  enableNotifications: false,
  morningReportTime: "08:00",
  eveningReportTime: "20:00",
  weatherSource: WeatherSource.MIXED
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
