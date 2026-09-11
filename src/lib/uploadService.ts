import { getApiUrl } from "./api";

/**
 * High-speed Public CDN Upload Service
 * Generates globally accessible HTTPS image URLs for OneSignal push notifications and social cards
 */

export const PERMANENT_IMGBB_API_KEY = typeof process !== "undefined" && process.env?.IMGBB_API_KEY ? process.env.IMGBB_API_KEY : atob("NTJlY2Y5ZWI0NGYzMmQyYTg4ZDIxMGNhMzM5OWMwNTQ=");

export const uploadToImgBB = async (base64Image: string, apiKey?: string): Promise<string> => {
  return uploadImage(base64Image, apiKey);
};

export const uploadImageFile = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          const url = await uploadImage(base64);
          resolve(url || base64);
        } else {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("[Upload] Error in uploadImageFile:", err);
      resolve("");
    }
  });
};

export const uploadImage = async (base64Image: string, apiKey?: string): Promise<string> => {
  if (!base64Image) return "";

  // If already a valid public HTTPS URL, return immediately
  if ((base64Image.startsWith("http://") || base64Image.startsWith("https://")) && 
      !base64Image.includes("localhost") && !base64Image.includes("127.0.0.1")) {
    return base64Image;
  }

  let cleanBase64 = base64Image.trim();
  if (cleanBase64.includes(",")) {
    cleanBase64 = cleanBase64.split(",")[1];
  }

  try {
    // 1. First Tier: Direct Public CDN Upload (FreeImage.host)
    try {
      const fd = new FormData();
      fd.append("key", "6d207e02198a847aa98d0a2a901485a5");
      fd.append("action", "upload");
      fd.append("source", cleanBase64);
      fd.append("format", "json");

      const res = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST",
        body: fd
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data?.status_code === 200 && data?.image?.url) {
          console.log("[Upload] Client FreeImage CDN URL generated:", data.image.url);
          return data.image.url;
        }
      }
    } catch (cdnErr) {
      console.warn("[Upload] Client CDN direct upload notice:", cdnErr);
    }

    // 2. Second Tier: Server Upload Endpoint (Proxies upload & saves fallback)
    try {
      const serverRes = await fetch(getApiUrl("/api/upload/image"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: base64Image,
          apiKey: apiKey && apiKey !== PERMANENT_IMGBB_API_KEY ? apiKey : undefined
        })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && data.url && (data.url.startsWith("http://") || data.url.startsWith("https://"))) {
          console.log("[Upload] Server hosted public CDN URL generated:", data.url);
          return data.url;
        }
      }
    } catch (serverErr) {
      console.warn("[Upload] Server storage route notice:", serverErr);
    }

    // 3. Third Tier: Custom ImgBB key if provided by user
    const keyToUse = (apiKey && apiKey.trim() !== "") ? apiKey.trim() : "";
    if (keyToUse && keyToUse !== PERMANENT_IMGBB_API_KEY) {
      try {
        const formData = new FormData();
        formData.append("image", cleanBase64);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${keyToUse}`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success && data.data?.url) {
          return data.data.url;
        }
      } catch (imgbbErr) {
        console.warn("[Upload] ImgBB client upload notice:", imgbbErr);
      }
    }

    // Return the base64 string (server will auto-convert to public URL on send)
    return base64Image;
  } catch (error: any) {
    console.warn("[Upload] Process completed with fallback:", error?.message || error);
    return base64Image;
  }
};
