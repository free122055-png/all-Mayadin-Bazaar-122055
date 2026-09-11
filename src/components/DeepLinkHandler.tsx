import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export const DeepLinkHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUrl = (rawUrl: string) => {
      try {
        if (!rawUrl || typeof rawUrl !== "string") return;
        const cleanUrl = rawUrl.trim();
        console.log("[DeepLinkHandler] Processing Deep Link URL:", cleanUrl);

        let targetPath = "";

        if (cleanUrl.startsWith("almayadinbazar://")) {
          // Remove scheme prefix
          let pathPart = cleanUrl.replace("almayadinbazar://", "");
          
          // Handle cases like "product/458", "p/458", "458", "product?id=458"
          if (pathPart.startsWith("product/") || pathPart.startsWith("p/")) {
            targetPath = "/" + pathPart.replace(/^p\//, "product/");
          } else if (/^\d+$/.test(pathPart)) {
            // Raw numeric ID like almayadinbazar://458
            targetPath = `/product/${pathPart}`;
          } else if (pathPart.startsWith("product?")) {
            const searchParams = new URLSearchParams(pathPart.replace("product?", ""));
            const id = searchParams.get("id") || searchParams.get("productId");
            targetPath = id ? `/product/${id}` : "/";
          } else {
            targetPath = "/" + pathPart;
          }
        } else {
          try {
            const parsed = new URL(cleanUrl);
            targetPath = parsed.pathname + parsed.search + parsed.hash;
          } catch (e) {
            targetPath = cleanUrl;
          }
        }

        if (targetPath) {
          if (!targetPath.startsWith("/")) {
            targetPath = "/" + targetPath;
          }
          targetPath = targetPath.replace(/\/+/g, "/");
          console.log("[DeepLinkHandler] Direct navigation to product route:", targetPath);
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        console.error("[DeepLinkHandler] Failed to parse and route deep link:", err);
      }
    };

    // Expose global handler for Android Native Layer
    (window as any).__handleNativeDeepLink = handleUrl;

    // Check if initial deep link was passed via window parameters or search
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const deepParam = urlParams.get("deep_link") || urlParams.get("productId") || urlParams.get("product");
      if (deepParam) {
        handleUrl(deepParam.startsWith("almayadinbazar://") ? deepParam : `almayadinbazar://product/${deepParam}`);
      }
    }

    // 1. Listen for background/resumed deep link clicks
    let listenerHandle: any = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("appUrlOpen", (event) => {
        if (event && event.url) {
          handleUrl(event.url);
        }
      }).then(handle => {
        listenerHandle = handle;
      }).catch(err => {
        console.warn("[DeepLinkHandler] Error attaching appUrlOpen listener:", err);
      });

      // 2. Check for cold start launch URL (when app wasn't running)
      CapApp.getLaunchUrl().then((launchData) => {
        if (launchData && launchData.url) {
          handleUrl(launchData.url);
        }
      }).catch(err => {
        console.warn("[DeepLinkHandler] Error getting cold launch URL:", err);
      });
    }

    return () => {
      delete (window as any).__handleNativeDeepLink;
      if (listenerHandle && typeof listenerHandle.remove === "function") {
        listenerHandle.remove();
      }
    };
  }, [navigate]);

  return null;
};
