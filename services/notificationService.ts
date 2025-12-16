
export const requestNotificationPermission = async (): Promise<boolean> => {
    // Check if browser supports notifications
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
        console.error("Error requesting notification permission:", error);
        return false;
    }

    return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
        try {
            // Using a simple icon for the notification
            const opts = {
                icon: '/icon.png',
                tag: 'skyyou-weather', // Tag prevents stacking multiple notifications
                ...options
            };
            
            // Try ServiceWorker first (better for mobile PWA)
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, opts);
                });
            } else {
                // Fallback to standard web notification
                new Notification(title, opts);
            }
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
};
