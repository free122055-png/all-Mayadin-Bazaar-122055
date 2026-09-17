// In-App Floating Bubble Notification Service for Order Tracking
// Exclusively in-app UI/UX logic. Does NOT modify or interfere with push notifications or background services.

export interface FloatingBubbleConfig {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoExpandBanner: boolean;
  bannerDurationSeconds: number;
  showOnDeliveredMinutes: number; // How long to show after delivery before auto-hiding
  defaultPosition: 'bottom-right' | 'bottom-left' | 'middle-right';
}

export const DEFAULT_BUBBLE_CONFIG: FloatingBubbleConfig = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  autoExpandBanner: true,
  bannerDurationSeconds: 7,
  showOnDeliveredMinutes: 120, // 2 hours
  defaultPosition: 'bottom-right',
};

export interface OrderStatusDisplay {
  title: string;
  shortLabel: string;
  badgeColor: string;
  textColor: string;
  bgLight: string;
  borderLight: string;
  pulseColor: string;
  step: number; // 1 to 5
}

export const getOrderStatusInfo = (status?: string): OrderStatusDisplay => {
  const s = (status || "").toLowerCase().trim();

  if (s === "pending" || s === "placed" || s === "অপেক্ষমাণ") {
    return {
      title: "অর্ডার গ্রহণ করা হয়েছে",
      shortLabel: "অপেক্ষমাণ",
      badgeColor: "bg-amber-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50",
      borderLight: "border-amber-200",
      pulseColor: "rgba(245, 158, 11, 0.4)",
      step: 1,
    };
  }

  if (s === "confirmed" || s === "নিশ্চিত") {
    return {
      title: "অর্ডার কনফার্ম করা হয়েছে",
      shortLabel: "কনফার্মড",
      badgeColor: "bg-blue-600",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50",
      borderLight: "border-blue-200",
      pulseColor: "rgba(37, 99, 235, 0.4)",
      step: 2,
    };
  }

  if (s === "processing" || s === "প্রক্রিয়াধীন" || s === "রান্না" || s === "প্যাকেজিং") {
    return {
      title: "প্যাকেজিং ও প্রস্তুতি চলছে",
      shortLabel: "প্রক্রিয়াধীন",
      badgeColor: "bg-indigo-600",
      textColor: "text-indigo-700",
      bgLight: "bg-indigo-50",
      borderLight: "border-indigo-200",
      pulseColor: "rgba(79, 70, 229, 0.4)",
      step: 3,
    };
  }

  if (
    s === "shipped" ||
    s === "picked_up" ||
    s === "on_the_way" ||
    s === "কুরিয়ারে হস্তান্তর" ||
    s === "ডেলিভারির পথে"
  ) {
    return {
      title: "ডেলিভারির উদ্দেশ্যে রওনা হয়েছে",
      shortLabel: "ডেলিভারির পথে",
      badgeColor: "bg-purple-600",
      textColor: "text-purple-700",
      bgLight: "bg-purple-50",
      borderLight: "border-purple-200",
      pulseColor: "rgba(147, 51, 234, 0.4)",
      step: 4,
    };
  }

  if (s === "delivered" || s === "completed" || s === "ডেলিভারি সম্পন্ন") {
    return {
      title: "অর্ডার ডেলিভারি সম্পন্ন হয়েছে",
      shortLabel: "ডেলিভার্ড",
      badgeColor: "bg-emerald-600",
      textColor: "text-emerald-700",
      bgLight: "bg-emerald-50",
      borderLight: "border-emerald-200",
      pulseColor: "rgba(5, 150, 105, 0.4)",
      step: 5,
    };
  }

  if (s === "cancelled" || s === "বাতিল") {
    return {
      title: "অর্ডারটি বাতিল করা হয়েছে",
      shortLabel: "বাতিল",
      badgeColor: "bg-rose-600",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50",
      borderLight: "border-rose-200",
      pulseColor: "rgba(225, 29, 72, 0.4)",
      step: 0,
    };
  }

  return {
    title: status || "অর্ডার আপডেট",
    shortLabel: status || "আপডেট",
    badgeColor: "bg-emerald-700",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50",
    borderLight: "border-emerald-200",
    pulseColor: "rgba(16, 185, 129, 0.4)",
    step: 1,
  };
};

// Play a subtle in-app audio chime using Web Audio API (safe, self-contained, no external assets needed)
export const playInAppBubbleChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic soft chime
    const freqs = [587.33, 880]; // D5, A5
    freqs.forEach((freq, index) => {
      const startTime = now + index * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (err) {
    // Autoplay policy or browser audio restrictions gracefully handled
  }
};

// Phone haptic vibration (Android WebView/PWA compatible)
export const triggerInAppVibration = () => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch (err) {
    // Ignore if not supported
  }
};
