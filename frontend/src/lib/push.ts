import api from "./api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window) || !VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const sub = subscription.toJSON();
    await api.post("/notifications/subscribe", {
      endpoint: sub.endpoint,
      keys: sub.keys,
    });
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!("Notification" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await api.post("/notifications/unsubscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  } catch {}
}

export function isPushSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
