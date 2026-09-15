import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  // Check if running on Android/iOS native app, Standalone PWA, or if splash was already shown
  const isNativeOrStandalone = typeof window !== "undefined" && (
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    (window as any).Capacitor?.getPlatform?.() === 'android' ||
    (window as any).Capacitor?.getPlatform?.() === 'ios' ||
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone) ||
    /wv|Android.*Version\/[\d.]+/i.test(navigator.userAgent)
  );

  const alreadyShown = typeof window !== "undefined" && Boolean(sessionStorage.getItem("almayadin_splash_shown"));

  // If in native app (where Android already shows the native splash screen) or already shown in session, don't show React splash
  const [isVisible, setIsVisible] = useState(() => {
    if (isNativeOrStandalone || alreadyShown) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    // Hide native Capacitor splash screen immediately once webview is ready
    try {
      if (typeof window !== "undefined" && (window as any).Capacitor?.Plugins?.SplashScreen) {
        (window as any).Capacitor.Plugins.SplashScreen.hide().catch(() => {});
      }
    } catch {
      // Ignore in standard web browser
    }

    if (isNativeOrStandalone || alreadyShown) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("almayadin_splash_shown", "true");
      }
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // For standard web browser, show a quick branding screen (800ms) once per session
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("almayadin_splash_shown", "true");
      }
      if (onComplete) {
        onComplete();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete, isNativeOrStandalone, alreadyShown]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="official-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white select-none pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center p-6"
          >
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden shadow-lg bg-white flex items-center justify-center border border-gray-100">
              <img
                src="/app_icon.png"
                alt="All MAYADIN FASHION"
                className="w-full h-full object-contain"
                loading="eager"
                decoding="sync"
              />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-5 text-center"
            >
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-[#005a36] uppercase font-sans">
                All MAYADIN FASHION
              </h1>
              <p className="text-xs font-semibold text-gray-500 tracking-widest mt-1">
                ONLINE SHOPPING & GROCERY
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

