import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermission = async (): Promise<boolean> => {
    // For Capacitor (native platforms)
    if (Capacitor.isNativePlatform()) {
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display === 'granted') return true;
            
            const permission = await LocalNotifications.requestPermissions();
            return permission.display === 'granted';
        } catch (error) {
            console.error("Error requesting native notification permission:", error);
            return false;
        }
    }

    // Fallback to web Notification API
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }
    
    try {
        if (Notification.permission === "granted") {
            return true;
        }

        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
    } catch (error) {
        console.error("Error requesting web notification permission:", error);
    }

    return false;
};

export const scheduleWeatherNotifications = async (
    settings: { enableNotifications: boolean; morningReportTime: string; eveningReportTime: string },
    weather: any,
    t: any
) => {
    if (!settings.enableNotifications || !weather) {
        if (Capacitor.isNativePlatform()) {
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] });
        }
        return;
    }

    if (Capacitor.isNativePlatform()) {
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') return;

            // Cancel existing to avoid duplicates
            await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] });

            const notifications: any[] = [];

            // Morning Report
            const [mHour, mMin] = settings.morningReportTime.split(':').map(Number);
            const morningDate = new Date();
            morningDate.setHours(mHour, mMin, 0, 0);
            if (morningDate < new Date()) morningDate.setDate(morningDate.getDate() + 1);

            const today = weather.daily[0];
            if (today) {
                notifications.push({
                    title: t.morningReportTitle,
                    body: `${t.today}: ${today.condition}, ${Math.round(today.minTemp)}° / ${Math.round(today.maxTemp)}°.`,
                    id: 1001,
                    schedule: { at: morningDate, allowWhileIdle: true },
                    sound: 'default',
                    attachments: [],
                    actionTypeId: '',
                    extra: null
                });
            }

            // Evening Report
            const [eHour, eMin] = settings.eveningReportTime.split(':').map(Number);
            const eveningDate = new Date();
            eveningDate.setHours(eHour, eMin, 0, 0);
            if (eveningDate < new Date()) eveningDate.setDate(eveningDate.getDate() + 1);

            const tomorrow = weather.daily[1];
            if (tomorrow) {
                notifications.push({
                    title: t.eveningReportTitle,
                    body: `${t.daily}: ${tomorrow.condition}, ${Math.round(tomorrow.minTemp)}° / ${Math.round(tomorrow.maxTemp)}°.`,
                    id: 1002,
                    schedule: { at: eveningDate, allowWhileIdle: true },
                    sound: 'default',
                    attachments: [],
                    actionTypeId: '',
                    extra: null
                });
            }

            if (notifications.length > 0) {
                // On Android, we might need to create a channel first for custom sounds/importance
                // But default channel usually works.
                await LocalNotifications.schedule({ notifications });
                console.log("Successfully scheduled native notifications:", notifications);
            }
        } catch (error) {
            console.error("Failed to schedule native notifications", error);
        }
    }
};

export const sendNotification = async (title: string, options?: NotificationOptions) => {
    // For Capacitor (native platforms)
    if (Capacitor.isNativePlatform()) {
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') {
                console.warn("Native notification permission not granted");
                return;
            }

            await LocalNotifications.schedule({
                notifications: [{
                    title: title,
                    body: options?.body?.toString() || '',
                    id: Math.floor(Math.random() * 1000000),
                    sound: 'default',
                    actionTypeId: '',
                    extra: null
                }]
            });
        } catch (err) {
            console.error("Native notification failed:", err);
        }
        return;
    }

    // Web Notification API fallback
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        try {
            const opts = {
                icon: '/icon-192.png', // Use local icon instead of external URL
                badge: '/icon-192.png',
                tag: 'skyyou-weather',
                renotify: true, // Allow re-notifying for the same tag
                ...options
            };
            
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, opts);
            } else {
                new Notification(title, opts);
            }
        } catch (e) {
            console.error("Web notification failed", e);
        }
    } else {
        console.warn("Web notification permission not granted");
    }
};
