// API helper for absolute backend routing in Capacitor mobile apps vs relative routing in web
export const BACKEND_URL = 
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_BACKEND_URL)
    ? import.meta.env.VITE_BACKEND_URL
    : "https://ais-dev-6twbajs3vsvw72beceozo4-117943534727.asia-southeast1.run.app";

export function getApiUrl(endpoint: string): string {
  const isCapacitor = 
    typeof window !== "undefined" && 
    (window.location.protocol === "capacitor:" || 
     window.location.protocol === "file:" || 
     (window as any).Capacitor !== undefined);

  if (isCapacitor) {
    return `${BACKEND_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }
  return endpoint;
}
