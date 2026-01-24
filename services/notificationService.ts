
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
            // Using the root icon.png
            const opts = {
                icon: '/icon.png',
                tag: 'skyyou-weather', // Tag prevents stacking multiple notifications
                ...options
            };
            
            // Standard web notification
            new Notification(title, opts);
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
};
