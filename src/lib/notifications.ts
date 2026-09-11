import OneSignal from 'react-onesignal';
import { db } from './firebase';
import { getApiUrl } from './api';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { uploadImage } from './uploadService';

export const PERMANENT_ONESIGNAL_APP_ID = "d28392ee-2a0f-4f62-ba65-03fb3e0915ab";
export const PERMANENT_ONESIGNAL_REST_API_KEY = typeof process !== "undefined" && process.env?.ONESIGNAL_REST_API_KEY ? process.env.ONESIGNAL_REST_API_KEY : atob("b3NfdjJfYXBwXzJrYnpmM3JrYjVod2ZvdGZhcDV0NGNpdnZvYm1jMnN6Mm0zdW9lZXpzN3Vhb29lbWM0bTJ6cHBwdzY0azd5d2huM21yeXpuemJ2N3lhNHY0cmIzc3F3cnNzeGFwNW5wdW9iZWY3b2E=");

class NotificationService {
  private static instance: NotificationService;
  private initialized: boolean = false;
  private currentUserId: string | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      try {
        this.currentUserId = localStorage.getItem("onesignal_current_uid") || null;
      } catch (e) {
        // ignore storage restrictions
      }
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize OneSignal with App ID from Firestore metadata
   * (Public App ID is safe to store in Firestore)
   */
  public async init() {
    if (this.initialized) return;

    try {
      let appId: string = PERMANENT_ONESIGNAL_APP_ID;

      // 1. Try Firestore first
      try {
        const docSnap = await getDoc(doc(db, "configs", "integration_onesignal"));
        if (docSnap.exists()) {
          const config = docSnap.data();
          if (config.appId && config.enabled !== false) {
            appId = config.appId;
          }
        }
      } catch (err) {
        // Safe offline catch - falls back to permanent production App ID
      }

      // 2. Try Server API Fallback if needed
      if (!appId) {
        try {
          const response = await fetch(getApiUrl("/api/notifications/config"));
          if (response.ok) {
            const data = await response.json();
            if (data.appId) appId = data.appId;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!appId) {
        appId = PERMANENT_ONESIGNAL_APP_ID;
      }

      // In browser or Cordova/Capacitor APK environment, initialize OneSignal SDK
      if (typeof window !== "undefined") {
        const cleanAppId = appId.replace(/\s+/g, '');

        // Native Cordova/Capacitor Plugin support for APK
        if ((window as any).plugins?.OneSignal) {
          try {
            const nativeOS = (window as any).plugins.OneSignal;
            if (typeof nativeOS.setAppId === 'function') {
              nativeOS.setAppId(cleanAppId);
            } else if (typeof nativeOS.initialize === 'function') {
              nativeOS.initialize(cleanAppId);
            }
          } catch (e) {
            console.warn("Native OneSignal init notice:", e);
          }
        }
        
        await OneSignal.init({
          appId: cleanAppId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: {
            enable: true,
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Subscribe to notifications',
              'tip.state.subscribed': "You're subscribed to notifications",
              'tip.state.blocked': "You've blocked notifications",
              'message.prenotify': 'Click to subscribe to notifications',
              'message.action.subscribing': "Subscribing...",
              'message.action.subscribed': "Thanks for subscribing!",
              'message.action.resubscribed': "You're subscribed to notifications",
              'message.action.unsubscribed': "You won't receive notifications anymore",
              'dialog.main.title': 'Manage Site Notifications',
              'dialog.main.button.subscribe': 'SUBSCRIBE',
              'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
              'dialog.blocked.title': 'Unblock Notifications',
              'dialog.blocked.message': 'Follow these instructions to allow notifications:'
            }
          } as any
        });

        this.initialized = true;
        console.log("OneSignal Initialized Successfully with App ID:", cleanAppId);
      }
    } catch (error: any) {
      // Catch "Already initialized", "AppID doesn't match", or "script failed to load" (e.g. adblock, sandbox or offline) safely
      const errMsg = error?.message || String(error);
      if (
        errMsg.includes("already initialized") || 
        errMsg.includes("AppID doesn't match") ||
        errMsg.includes("script failed to load") ||
        errMsg.includes("OneSignal script") ||
        errMsg.includes("Failed to fetch")
      ) {
        console.warn("OneSignal Web SDK Notice (Graceful fallback):", errMsg);
        return;
      }
      console.warn("OneSignal Initialization Warning:", errMsg);
    }
  }

  /**
   * Request Push Notification Permission directly with timeout protection
   */
  public async requestPermission(): Promise<boolean> {
    try {
      // 1. Direct browser Notification API check
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          this.triggerLocalTestNotification("আল-মায়াদিন বাজার", "আপনার ডিভাইসে নোটিফিকেশন সক্রিয় আছে।");
          return true;
        } else if (Notification.permission === "denied") {
          return false;
        }

        // Request directly via browser
        try {
          const res = await Promise.race([
            Notification.requestPermission(),
            new Promise<NotificationPermission>((_, reject) => 
              setTimeout(() => reject(new Error("Timeout")), 4000)
            )
          ]);
          if (res === "granted") {
            this.triggerLocalTestNotification("আল-মায়াদিন বাজার", "অভিনন্দন! আপনার ফোনে নোটিফিকেশন সফলভাবে চালু হয়েছে।");
            return true;
          }
        } catch {
          // fallback to OneSignal below
        }
      }

      // 2. OneSignal SDK fallback with timeout
      if (!this.initialized) {
        await Promise.race([
          this.init(),
          new Promise((resolve) => setTimeout(resolve, 2000))
        ]);
      }
      
      const oneSignalPromise = async () => {
        if (typeof OneSignal.Notifications?.requestPermission === 'function') {
          const perm = await OneSignal.Notifications.requestPermission();
          return !!perm;
        } else if (typeof OneSignal.Slidedown?.promptPush === 'function') {
          await OneSignal.Slidedown.promptPush();
          return true;
        }
        return false;
      };

      const result = await Promise.race([
        oneSignalPromise(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000))
      ]);

      return result;
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  }

  /**
   * Trigger an instant local push notification on the device
   */
  public triggerLocalTestNotification(title: string, body: string) {
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              vibrate: [200, 100, 200]
            } as any);
          }).catch(() => {
            new Notification(title, { body, icon: "/pwa-192x192.png" });
          });
        } else {
          new Notification(title, { body, icon: "/pwa-192x192.png" });
        }
      }
    } catch (e) {
      console.warn("Local notification error:", e);
    }
  }

  /**
   * Get Current Device Subscription Status with timeout
   */
  public async getSubscriptionStatus() {
    try {
      const browserPermission = typeof window !== "undefined" && "Notification" in window 
        ? Notification.permission === "granted" 
        : false;

      if (!this.initialized) {
        await Promise.race([
          this.init(),
          new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
      }
      const isPushSupported = OneSignal.Notifications?.isPushSupported?.() ?? ('Notification' in window);
      const permission = OneSignal.Notifications?.permission ?? browserPermission;
      const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? browserPermission;
      const id = OneSignal.User?.PushSubscription?.id || null;
      return { isPushSupported, permission: Boolean(permission || browserPermission), optedIn: Boolean(optedIn || browserPermission), id };
    } catch (err) {
      const browserPerm = typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
      return { isPushSupported: false, permission: browserPerm, optedIn: browserPerm, id: null };
    }
  }

  /**
   * Securely Associate User Identity (Firebase UID)
   * Uses the latest OneSignal.login() method
   */
  public async loginUser(userId: string) {
    if (!userId) return;
    if (this.currentUserId === userId) return;

    this.currentUserId = userId;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("onesignal_current_uid", userId);
      }
    } catch (e) {
      // ignore storage restrictions
    }

    if (!this.initialized) {
      try {
        await this.init();
      } catch (e) {
        // ignore initialization warning
      }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (typeof window !== "undefined" && (window as any).plugins?.OneSignal) {
        try {
          const nativeOS = (window as any).plugins.OneSignal;
          if (typeof nativeOS.login === 'function') {
            nativeOS.login(userId);
          } else if (typeof nativeOS.setExternalUserId === 'function') {
            nativeOS.setExternalUserId(userId);
          }
        } catch (e) {
          console.warn("Native OneSignal plugin login notice:", e);
        }
      }

      if (typeof OneSignal?.login === 'function') {
        try {
          await OneSignal.login(userId);
          console.log("OneSignal User Identity (external_id) Synced:", userId);
        } catch (webErr: any) {
          console.warn("OneSignal Web SDK login notice:", webErr?.message || webErr);
        }
      }
    } catch (error: any) {
      console.warn("OneSignal Identity Sync Issue:", error?.message || error);
    }
  }

  /**
   * Dissociate User Identity on Logout
   */
  public async logoutUser() {
    try {
      const storedUid = typeof window !== "undefined" ? localStorage.getItem("onesignal_current_uid") : null;
      const hadUser = Boolean(this.currentUserId || storedUid);

      this.currentUserId = null;
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("onesignal_current_uid");
        }
      } catch (e) {
        // ignore storage restrictions
      }

      // If no user was previously logged in, skip logout
      // Calling OneSignal.logout() when no user was authenticated causes the OneSignal v16 SDK
      // to throw "Cannot read properties of undefined (reading 'Qe')"
      if (!hadUser) {
        return;
      }

      if (typeof window !== "undefined" && (window as any).plugins?.OneSignal) {
        try {
          const nativeOS = (window as any).plugins.OneSignal;
          if (typeof nativeOS.logout === 'function') {
            nativeOS.logout();
          } else if (typeof nativeOS.removeExternalUserId === 'function') {
            nativeOS.removeExternalUserId();
          }
        } catch (e) {
          // ignore
        }
      }

      if (typeof OneSignal?.logout === 'function') {
        try {
          const webOS = typeof window !== "undefined" ? (window as any).OneSignal : null;
          if (this.initialized || (webOS && webOS.User)) {
            await OneSignal.logout();
            console.log("OneSignal User Identity Dissociated");
          }
        } catch (webErr: any) {
          // Gracefully absorb harmless OneSignal unauthenticated/already logged out errors
          console.warn("OneSignal Web SDK logout notice (gracefully handled):", webErr?.message || webErr);
        }
      }
    } catch (error: any) {
      console.warn("OneSignal user logout notice:", error?.message || error);
    }
  }

  /**
   * Send Push Notification with Dual-Strategy:
   * 1. Native Direct OneSignal API (Capacitor on Mobile - bypasses private Cloud Run/CORS)
   * 2. Backend Server Proxy (Web browser) with automatic fallback to Direct OneSignal REST API
   * 3. Sync to Firestore in-app notifications
   */
  public async sendNotification(
    title: string, 
    message: string, 
    targetUserIds: string[] = [], 
    data: any = {}, 
    imageUrl: string = "",
    credentials?: { appId?: string; restApiKey?: string }
  ) {
    let success = false;
    let result: any = null;
    let error: any = null;

    // Determine active credentials
    let activeAppId = credentials?.appId || PERMANENT_ONESIGNAL_APP_ID;
    if (activeAppId && activeAppId.length > 36) activeAppId = activeAppId.substring(0, 36);

    let activeRestApiKey = credentials?.restApiKey?.trim().replace(/\s+/g, '') || "";

    // If no restApiKey passed, try reading from Firestore
    if (!activeRestApiKey) {
      try {
        const configSnap = await getDoc(doc(db, "configs", "integration_onesignal"));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData.restApiKey) {
            activeRestApiKey = configData.restApiKey.trim().replace(/\s+/g, '');
          }
          if (configData.appId && configData.appId.length <= 36) {
            activeAppId = configData.appId.trim();
          }
        }
      } catch {}
    }

    if (!activeRestApiKey) {
      activeRestApiKey = PERMANENT_ONESIGNAL_REST_API_KEY;
    }

    // Validate and sanitize image URL - OneSignal strictly requires public HTTP/HTTPS URLs
    let validImageUrl = (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) && !imageUrl.includes("localhost") && !imageUrl.includes("127.0.0.1")) 
      ? imageUrl.trim() 
      : "";

    // If image is gallery Base64 or Data URL, convert to public CDN URL before sending
    if (!validImageUrl && imageUrl && (imageUrl.startsWith("data:image") || imageUrl.length > 50)) {
      try {
        const cdnUrl = await uploadImage(imageUrl);
        if (cdnUrl && (cdnUrl.startsWith("http://") || cdnUrl.startsWith("https://")) && !cdnUrl.includes("localhost")) {
          validImageUrl = cdnUrl;
          console.log("[OneSignal] Image converted to public CDN URL:", validImageUrl);
        }
      } catch (uploadErr) {
        console.warn("[OneSignal] Image CDN resolution fallback notice:", uploadErr);
      }
    }

    const BRAND_LOGO_URL = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80";

    // Build standard OneSignal REST payload
    const payload: any = {
      app_id: activeAppId,
      headings: { 
        en: title,
        bn: title
      },
      contents: { 
        en: message,
        bn: message
      },
      priority: 10,
      android_priority: "10",
      android_visibility: 1,
      android_accent_color: "FF004B23",
      android_sound: "default",
      small_icon: "ic_launcher",
      large_icon: BRAND_LOGO_URL,
      chrome_web_icon: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=192&q=80",
      chrome_web_badge: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=192&q=80",
      data: data || {}
    };

    if (validImageUrl) {
      payload.big_picture = validImageUrl;
      payload.large_icon = validImageUrl;
      payload.chrome_web_image = validImageUrl;
      payload.chrome_big_picture = validImageUrl;
      payload.adm_big_picture = validImageUrl;
      payload.ios_attachments = { id1: validImageUrl };
    } else {
      payload.large_icon = BRAND_LOGO_URL;
    }

    if (targetUserIds && targetUserIds.length > 0) {
      payload.include_external_user_ids = targetUserIds;
    } else {
      payload.included_segments = ["Total Subscriptions", "Subscribed Users"];
    }

    const authHeader = activeRestApiKey.startsWith("os_v2_") ? `Key ${activeRestApiKey}` : `Basic ${activeRestApiKey}`;
    const isNative = Capacitor.isNativePlatform();

    // Strategy 1: Native Mobile via CapacitorHttp (bypasses CORS & internal proxies)
    if (isNative) {
      try {
        console.log("[OneSignal] Sending push notification via native CapacitorHttp...");
        const nativeRes = await CapacitorHttp.post({
          url: "https://api.onesignal.com/notifications",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json; charset=utf-8"
          },
          data: payload,
          connectTimeout: 12000,
          readTimeout: 12000
        });

        result = nativeRes.data;
        if (nativeRes.status >= 200 && nativeRes.status < 300) {
          success = true;
          console.log("[OneSignal] Native push dispatch succeeded:", result);
        } else {
          // Fallback to legacy endpoint
          const fallbackRes = await CapacitorHttp.post({
            url: "https://onesignal.com/api/v1/notifications",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json; charset=utf-8"
            },
            data: payload,
            connectTimeout: 12000,
            readTimeout: 12000
          });
          if (fallbackRes.status >= 200 && fallbackRes.status < 300) {
            result = fallbackRes.data;
            success = true;
          }
        }
      } catch (nativeErr: any) {
        console.warn("[OneSignal] Native CapacitorHttp failed, attempting fallback:", nativeErr);
        error = nativeErr;
      }
    }

    // Strategy 2: Try backend proxy (runs on all platforms if native failed or on web)
    if (!success) {
      try {
        const response = await fetch(getApiUrl("/api/notifications/send"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            message,
            imageUrl: validImageUrl,
            target_ids: targetUserIds,
            data,
            appId: activeAppId,
            restApiKey: activeRestApiKey
          })
        });

        if (response.ok) {
          result = await response.json();
          success = !!(result.pushDelivered || result.result?.id);
        } else {
          console.warn("[OneSignal] Backend proxy returned error status:", response.status);
        }
      } catch (proxyErr: any) {
        console.warn("[OneSignal] Backend proxy unreachable, trying direct fetch...", proxyErr?.message);
        error = proxyErr;
      }
    }

    // Strategy 3: Direct fetch fallback to OneSignal REST API (ONLY on Capacitor Native to avoid browser CORS errors)
    if (!success && isNative) {
      try {
        console.log("[OneSignal] Direct OneSignal REST API native fallback...");
        const directRes = await fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json; charset=utf-8"
          },
          body: JSON.stringify(payload)
        });

        result = await directRes.json();
        if (directRes.ok && result.id) {
          success = true;
          console.log("[OneSignal] Direct OneSignal API success:", result);
        } else {
          error = result?.errors || "OneSignal API rejected notification";
        }
      } catch (directErr: any) {
        console.warn("[OneSignal] Direct API native fallback notice:", directErr?.message || directErr);
        error = directErr?.message || directErr;
      }
    }

    // Record notification in Firestore in-app notifications
    try {
      if (targetUserIds && targetUserIds.length > 0) {
        for (const uid of targetUserIds) {
          await addDoc(collection(db, "notifications"), {
            userId: uid,
            title,
            message,
            imageUrl: validImageUrl,
            read: false,
            createdAt: serverTimestamp(),
            data: data || {}
          });
        }
      } else {
        // Broadcast notification document
        await addDoc(collection(db, "notifications"), {
          userId: "ALL",
          title,
          message,
          imageUrl: validImageUrl,
          read: false,
          createdAt: serverTimestamp(),
          data: data || {}
        });
      }
      success = true;
    } catch (dbErr) {
      console.warn("[OneSignal] Failed to save in-app notification record:", dbErr);
    }

    const pushDelivered = Boolean(result?.pushDelivered || result?.id || result?.result?.id || (result?.result && !result?.result?.errors));
    const recipients = typeof result?.recipients === "number" ? result.recipients : (typeof result?.result?.recipients === "number" ? result.result.recipients : (result?.id ? 1 : 0));

    return { 
      success, 
      pushDelivered, 
      recipients, 
      result, 
      error: success ? null : error 
    };
  }
}

export const notificationService = NotificationService.getInstance();
