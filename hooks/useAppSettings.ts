import { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../constants';

export const useAppSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
            console.warn("Settings load failed", e);
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return { settings, updateSettings };
};
