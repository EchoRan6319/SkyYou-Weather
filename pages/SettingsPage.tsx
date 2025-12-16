
import React, { useEffect } from 'react';
import { AppSettings, Language, AppTheme } from '../types';
import { TRANSLATIONS } from '../constants';
import { Languages, Ruler, Bell } from 'lucide-react';
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
    <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const RadioOption = ({ label, checked, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors ${checked ? 'bg-[#d3e3fd]/30' : 'hover:bg-gray-50'}`}
    >
        <span className={`font-medium ${checked ? 'text-[#041e49]' : 'text-gray-600'}`}>{label}</span>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${checked ? 'border-[#041e49]' : 'border-gray-300'}`}>
            {checked && <div className="w-3 h-3 rounded-full bg-[#041e49]" />}
        </div>
    </div>
  );

  const TimeOption = ({ label, value, onChange }: any) => (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
          <span className="text-gray-700 font-medium">{label}</span>
          <div className="relative">
             <input 
                type="time" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
             />
          </div>
      </div>
  );

  const ToggleOption = ({ label, checked, onChange }: any) => (
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50">
          <span className="text-gray-700 font-medium">{label}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#041e49]"></div>
          </label>
      </div>
  );

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-24 animate-fade-in bg-[#fdfcff] landscape:pb-6 landscape:pl-[80px]">
      <h1 className="text-3xl font-medium text-gray-900 mb-8">{t.settings}</h1>

      {/* Notification Settings */}
      <SettingSection title={t.notifications} icon={Bell}>
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

      <SettingSection title={t.language} icon={Languages}>
        <RadioOption 
            label="English" 
            checked={settings.language === Language.EN} 
            onClick={() => updateSettings({ language: Language.EN })} 
        />
        <RadioOption 
            label="中文 (简体)" 
            checked={settings.language === Language.ZH} 
            onClick={() => updateSettings({ language: Language.ZH })} 
        />
      </SettingSection>

      <SettingSection title={t.unit} icon={Ruler}>
        <RadioOption 
            label="Metric (°C, km/h)" 
            checked={settings.unit === 'metric'} 
            onClick={() => updateSettings({ unit: 'metric' })} 
        />
        <RadioOption 
            label="Imperial (°F, mph)" 
            checked={settings.unit === 'imperial'} 
            onClick={() => updateSettings({ unit: 'imperial' })} 
        />
      </SettingSection>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">SkyYou Weather v1.2.0 (PWA)</p>
        <p className="text-xs text-gray-300 mt-1">Design inspired by Material You</p>
      </div>
    </div>
  );
};

export default SettingsPage;
