import api from "./api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export async function requestPushPermission(): Promise<string | null> {
  if (!("Notification" in window) || !VAPID_PUBLIC_KEY) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const token = JSON.stringify(subscription);
    await api.post("/notifications/subscribe", { token });
    return token;
  } catch {
    return null;
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!("Notification" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const token = JSON.stringify(subscription);
      await api.post("/notifications/unsubscribe", { token });
      await subscription.unsubscribe();
    }
  } catch {}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
