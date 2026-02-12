import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skyyou.weather',
  appName: 'SkyYou Weather',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    minVersion: 24,
    allowMixedContent: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    Geolocation: {
      timeout: 30000
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  }
};

export default config;
