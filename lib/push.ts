import { supabase } from "@/lib/supabase";

// Public half of the VAPID key pair; the private half is in Supabase Vault (see send-push)
const VAPID_PUBLIC_KEY = "BKNPDtiMsfBH8g5imwxuIApoI-VMwJefaeEyn_9K_5byw9VKzua87cFTT-g9gCmn-rLJD0oUIJAGMq6nM5vOSKs";

export type PushStatus = "on" | "off" | "unsupported" | "denied" | "needs-install";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const isSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// iOS only allows Web Push for apps added to the Home Screen
const isIosBrowserTab = () => {
  if (typeof window === "undefined") return false;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  return isIos && !standalone;
};

// Remembers that the user turned push off on this device, so ensurePushHealthy won't undo it
const OPT_OUT_KEY = "dormitory-push-opted-out";
const setOptedOut = (value: boolean) => {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
};
const isOptedOut = () => {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
};

const getRegistration = () => navigator.serviceWorker.getRegistration("/sw.js");

export const getPushStatus = async (): Promise<PushStatus> => {
  if (isIosBrowserTab()) return "needs-install";
  if (!isSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? "on" : "off";
  } catch {
    return "off";
  }
};

// Must be called from a user gesture (button click): browsers block permission prompts otherwise
export const subscribeToPush = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!isSupported()) return { ok: false, error: "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน" };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, error: "ไม่ได้รับอนุญาตให้แจ้งเตือน" };

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const raw = subscription.toJSON();
    const { error } = await supabase.rpc("save_push_subscription", {
      p_endpoint: raw.endpoint,
      p_p256dh: raw.keys?.p256dh,
      p_auth: raw.keys?.auth,
    });
    if (error) return { ok: false, error: "บันทึกการแจ้งเตือนไม่สำเร็จ" };
    setOptedOut(false);
    return { ok: true };
  } catch (e) {
    console.error("subscribeToPush error:", e);
    return { ok: false, error: "เปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่" };
  }
};

export const unsubscribeFromPush = async (): Promise<{ ok: boolean; error?: string }> => {
  if (!isSupported()) return { ok: true };
  try {
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return { ok: true };
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase.rpc("remove_push_subscription", { p_endpoint: endpoint });
    setOptedOut(true);
    return { ok: true };
  } catch (e) {
    console.error("unsubscribeFromPush error:", e);
    return { ok: false, error: "ปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่" };
  }
};

// Some browsers (notably iOS) silently drop the subscription while keeping the permission.
// Re-subscribe quietly on load, and re-save so the endpoint follows the logged-in account.
export const ensurePushHealthy = async () => {
  if (!isSupported() || isIosBrowserTab() || isOptedOut() || Notification.permission !== "granted") return;
  const registration = await getRegistration();
  if (!registration) return;
  await subscribeToPush();
};

// On logout: stop this device receiving the account's notifications, but keep the browser
// subscription so the next login on this device picks it up again via ensurePushHealthy.
export const detachPushFromAccount = async () => {
  if (!isSupported()) return;
  try {
    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) await supabase.rpc("remove_push_subscription", { p_endpoint: subscription.endpoint });
  } catch {}
};
