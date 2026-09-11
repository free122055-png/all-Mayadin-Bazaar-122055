import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../lib/notifications";
import { App as CapacitorApp } from "@capacitor/app";

export const NotificationInitializer: React.FC = () => {
  const { user, loading } = useAuth();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // 1. Initial OneSignal Init (Read App ID from Firestore with safe catch)
    notificationService.init().catch(err => {
      console.warn("OneSignal initialization skipped:", err?.message || err);
    });

    // 2. Configure Android Hardware Back Button to navigate back in history instead of exiting app
    let backButtonHandle: any = null;
    try {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack && window.location.pathname !== "/") {
          window.history.back();
        } else {
          CapacitorApp.exitApp();
        }
      }).then(handle => {
        backButtonHandle = handle;
      });
    } catch (e) {
      // Not in Capacitor environment
    }

    return () => {
      if (backButtonHandle && typeof backButtonHandle.remove === 'function') {
        backButtonHandle.remove();
      }
    };
  }, []);

  useEffect(() => {
    // 3. Sync User Identity on Auth State Change
    if (!loading) {
      const currentUid = user ? user.uid : null;

      // First run when auth finishes loading
      if (prevUserIdRef.current === undefined) {
        prevUserIdRef.current = currentUid;
        if (currentUid) {
          notificationService.loginUser(currentUid);
        }
        return;
      }

      // If user state actually changed
      if (prevUserIdRef.current !== currentUid) {
        if (currentUid) {
          notificationService.loginUser(currentUid);
        } else if (prevUserIdRef.current) {
          notificationService.logoutUser();
        }
        prevUserIdRef.current = currentUid;
      }
    }
  }, [user, loading]);

  return null; // Invisible component
};
