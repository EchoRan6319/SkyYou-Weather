
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        return false;
    }
    
    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
        try {
            // Using a simple icon for the notification
            const opts = {
                icon: 'https://cdn-icons-png.flaticon.com/512/4052/4052984.png',
                ...options
            };
            // Registering via ServiceWorkerRegistration gives better mobile support if available, 
            // but fallback to new Notification() for standard web
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, opts);
                });
            } else {
                new Notification(title, opts);
            }
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
};
