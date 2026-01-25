
import React, { useEffect } from 'react';
import { AppSettings, Language, AppTheme, WeatherSource } from '../types';
import { TRANSLATIONS } from '../constants';
import { Languages, Ruler, Bell, Trash2 } from 'lucide-react';
import { requestNotificationPermission } from '../services/notificationService';

interface Props {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsPage: React.FC<Props> = ({ settings, updateSettings }) => {
  const t = TRANSLATIONS[settings.language];

  // Logic to handle notification toggle with permission request
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission immediately on user interaction
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ enableNotifications: true });
      } else {
        // Permission failed or denied
        alert(t.permissionDenied);
        updateSettings({ enableNotifications: false });
      }
    } else {
      updateSettings({ enableNotifications: false });
    }
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-4 shadow-sm border border-gray-50 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const RadioOption = ({ label, checked, onClick }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors ${checked ? 'bg-[#d3e3fd]/30 dark:bg-[#004a77]/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
    >
      <span className={`font-medium ${checked ? 'text-[#041e49] dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${checked ? 'border-[#041e49] dark:border-blue-400' : 'border-gray-300 dark:border-gray-700'}`}>
        {checked && <div className="w-3 h-3 rounded-full bg-[#041e49] dark:bg-blue-400" />}
      </div>
    </div>
  );

  const TimeOption = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50">
      <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
      <div className="relative">
        <input
          type="time"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
        />
      </div>
    </div>
  );

  const ToggleOption = ({ label, checked, onChange }: any) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50">
      <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#041e49] dark:peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-[calc(100px+env(safe-area-inset-bottom))] animate-fade-in bg-[#fdfcff] dark:bg-transparent landscape:pb-6">
      <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-8 leading-tight">{t.settings}</h1>

      {/* Notification Settings */}
      <SettingSection title={t.notifications} icon={Bell}>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl mb-4 border border-orange-100 dark:border-orange-900/20">
          <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed font-medium">
            📱 如果是移动端设备，必须将本项目安装为PWA应用后，才能开启通知权限！
          </p>
          <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed font-medium">
            ❗ 受限于技术原因，该功能可能无效，请您谅解。
          </p>
        </div>
        <ToggleOption
          label={t.enableNotifications}
          checked={settings.enableNotifications}
          onChange={handleNotificationToggle}
        />

        {settings.enableNotifications && (
          <div className="space-y-3 mt-4 animate-fade-in">
            <TimeOption
              label={t.morningReport}
              value={settings.morningReportTime}
              onChange={(val: string) => updateSettings({ morningReportTime: val })}
            />
            <TimeOption
              label={t.eveningReport}
              value={settings.eveningReportTime}
              onChange={(val: string) => updateSettings({ eveningReportTime: val })}
            />
          </div>
        )}
      </SettingSection>

      <SettingSection title={t.weatherSource} icon={Ruler}>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl mb-4 border border-orange-100 dark:border-orange-900/20">
          <p className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed font-medium">
            {t.sourceWarning}
          </p>
        </div>
        <div className="space-y-1">
          <RadioOption
            label={t.sourceMixed}
            checked={settings.weatherSource === WeatherSource.MIXED}
            onClick={() => updateSettings({ weatherSource: WeatherSource.MIXED })}
          />
          <RadioOption
            label={t.sourceQWeather}
            checked={settings.weatherSource === WeatherSource.QWEATHER}
            onClick={() => updateSettings({ weatherSource: WeatherSource.QWEATHER })}
          />
          <RadioOption
            label={t.sourceCaiyun}
            checked={settings.weatherSource === WeatherSource.CAIYUN}
            onClick={() => updateSettings({ weatherSource: WeatherSource.CAIYUN })}
          />
          <RadioOption
            label={t.sourceOpenWeather}
            checked={settings.weatherSource === WeatherSource.OPENWEATHER}
            onClick={() => updateSettings({ weatherSource: WeatherSource.OPENWEATHER })}
          />
        </div>
      </SettingSection>

      <SettingSection title={t.theme} icon={Languages}>
        <div className="space-y-1">
          <RadioOption
            label="浅色模式"
            checked={settings.theme === AppTheme.LIGHT}
            onClick={() => updateSettings({ theme: AppTheme.LIGHT })}
          />
          <RadioOption
            label="深色模式"
            checked={settings.theme === AppTheme.DARK}
            onClick={() => updateSettings({ theme: AppTheme.DARK })}
          />
          <RadioOption
            label="跟随系统"
            checked={settings.theme === AppTheme.SYSTEM}
            onClick={() => updateSettings({ theme: AppTheme.SYSTEM })}
          />
        </div>
      </SettingSection>

      {/* PWA Installation Section */}
      <SettingSection title={t.pwaTitle} icon={Ruler}>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl mb-4 border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed font-medium">
            {t.pwaDesc}
          </p>
        </div>
        <a
          href="https://web.developers.google.cn/learn/pwa/installation?hl=zh-cn"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <span className="text-gray-700 dark:text-gray-300 font-medium">{t.pwaGuide}</span>
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </SettingSection>

      {/* Data Management */}
      <SettingSection title={t.dataManagement} icon={Trash2}>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl mb-4 border border-blue-100 dark:border-blue-900/20">
          <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed font-medium">
            💡 如果无法正常获取位置信息，请在下方存储管理中选择清除所有数据！
          </p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-between border border-transparent dark:border-red-900/20">
          <div className="flex-1 mr-4">
            <h4 className="text-red-800 dark:text-red-400 font-medium mb-1">{t.clearData}</h4>
            <p className="text-red-600/70 dark:text-red-400/60 text-xs">{t.clearDataDesc}</p>
          </div>
          <button
            onClick={() => {
              if (window.confirm(t.clearDataConfirm)) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-95 transition-all"
          >
            {t.clearData}
          </button>
        </div>
      </SettingSection>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">SkyYou Weather V3.2.0 RC (PWA)</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Design inspired by Material You</p>
      </div>
    </div>
  );
};

export default SettingsPage;
