
import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../services/notificationService';
import { getCoordinates } from '../services/weatherService';
import { AppSettings, Language } from '../types';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationGranted: (coords: any) => void;
    onNotificationGranted: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
    isOpen,
    onClose,
    onLocationGranted,
    onNotificationGranted
}) => {
    const [locStatus, setLocStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const [notifStatus, setNotifStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const t = {
        title: "欢迎使用 SkyYou Weather",
        desc: "为了提供当地天气和灾害预警，我们需要获取您的位置和通知权限。",
        enableLoc: "开启定位",
        enableNotif: "开启通知",
        continue: "开始使用",
        locSuccess: "定位已开启",
        notifSuccess: "通知已开启",
        skip: "暂不开启"
    };

    useEffect(() => {
        if (isOpen) {
            // Check initial states
            if ("Notification" in window && Notification.permission === 'granted') {
                setNotifStatus('success');
            }
            navigator.permissions?.query({ name: 'geolocation' }).then(result => {
                if (result.state === 'granted') setLocStatus('success');
            }).catch(() => { });
        }
    }, [isOpen]);

    const handleLocationClick = async () => {
        if (!window.isSecureContext) {
            alert("Error: Location requires HTTPS. If testing locally, use localhost or enable HTTPS.");
        }
        try {
            const coords = await getCoordinates();
            setLocStatus('success');
            onLocationGranted(coords);
        } catch (e: any) {
            console.warn(e);
            alert(`Location Error: ${e.message || e}`);
            setLocStatus('error');
        }
    };

    const handleNotificationClick = async () => {
        if (!window.isSecureContext) {
            alert("Error: Notifications require HTTPS.");
        }
        if (!("Notification" in window)) {
            alert("Notifications not supported in this browser.");
            setNotifStatus('error');
            return;
        }

        // Diagnostic
        if (Notification.permission === 'denied') {
            alert("Permission is currently DENIED. Please reset permissions in iOS Settings -> Safari -> Settings for Website.");
            // We allow retry in case they fixed it
        }

        const granted = await requestNotificationPermission();
        if (granted) {
            setNotifStatus('success');
            onNotificationGranted();
        } else {
            // If it wasn't denied before but is now, they likely clicked "Don't Allow" or it auto-failed
            setNotifStatus('error');
            if (Notification.permission !== 'granted') {
                alert(`Failed. Status: ${Notification.permission}`);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
                </div>

                <div className="space-y-4">
                    {/* Location Button */}
                    <button
                        onClick={handleLocationClick}
                        disabled={locStatus === 'success'}
                        className={`w-full py-4 px-4 rounded-xl flex items-center justify-between transition-all ${locStatus === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100 active:scale-95'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{locStatus === 'success' ? '📍' : '🌍'}</span>
                            <span className="font-semibold">{locStatus === 'success' ? t.locSuccess : t.enableLoc}</span>
                        </div>
                        {locStatus === 'success' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                    </button>

                    {/* Notification Button */}
                    <button
                        onClick={handleNotificationClick}
                        disabled={notifStatus === 'success'}
                        className={`w-full py-4 px-4 rounded-xl flex items-center justify-between transition-all ${notifStatus === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100 active:scale-95'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{notifStatus === 'success' ? '🔔' : '📨'}</span>
                            <span className="font-semibold">{notifStatus === 'success' ? t.notifSuccess : t.enableNotif}</span>
                        </div>
                        {notifStatus === 'success' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                    </button>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium shadow-lg hover:shadow-xl active:scale-95 transition-all"
                    >
                        {t.continue}
                    </button>

                </div>
                <button onClick={onClose} className="w-full mt-4 text-xs text-gray-400 font-medium hover:text-gray-600">{t.skip}</button>
            </div>
        </div>
    );
};

export default PermissionModal;
