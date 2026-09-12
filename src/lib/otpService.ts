/**
 * OTP Verification Client Service for Al Mayadin Bazar
 * High-Reliability Standalone & Hybrid Engine
 */

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { sendSms, formatBangladeshiPhoneNumber } from "./smsService";
import { getApiUrl } from "./api";

export interface OtpStatus {
  otpVerificationEnabled: boolean;
  masterEnabled: boolean;
}

export interface SendOtpResult {
  success: boolean;
  message?: string;
  phone?: string;
  cooldown?: number;
  remainingSeconds?: number;
  error?: string;
  code?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verificationToken?: string;
  message?: string;
  remainingAttempts?: number;
  error?: string;
  code?: string;
}

interface LocalOtpSession {
  phone: string;
  otpHash: string;
  salt: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
  verificationToken?: string;
}

// In-memory + SessionStorage cache for resilience across web and native app
const localSessions = new Map<string, LocalOtpSession>();

// Fast SHA-256 computation using Web Crypto API
async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Basic deterministic fallback
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function getStoredSession(phone: string): LocalOtpSession | null {
  const formatted = formatBangladeshiPhoneNumber(phone);
  if (localSessions.has(formatted)) {
    return localSessions.get(formatted)!;
  }
  try {
    const stored = sessionStorage.getItem(`otp_session_${formatted}`);
    if (stored) {
      const session = JSON.parse(stored);
      localSessions.set(formatted, session);
      return session;
    }
  } catch (e) {
    // sessionStorage not available
  }
  return null;
}

function saveStoredSession(session: LocalOtpSession) {
  localSessions.set(session.phone, session);
  try {
    sessionStorage.setItem(`otp_session_${session.phone}`, JSON.stringify(session));
  } catch (e) {
    // sessionStorage not available
  }
}

export const otpService = {
  /**
   * Checks current OTP Verification & SMS Master switches from Firestore.
   */
  async getStatus(): Promise<OtpStatus> {
    try {
      const configDocPromise = getDoc(doc(db, "configs", "integration_sms"));
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
      const docSnap = await Promise.race([configDocPromise, timeoutPromise]);

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        return {
          otpVerificationEnabled: Boolean(data?.otpVerificationEnabled),
          masterEnabled: data?.masterEnabled !== undefined ? Boolean(data.masterEnabled) : true
        };
      }
    } catch (e) {
      console.warn("[OTP] Direct Firestore status check notice:", e);
    }

    return { otpVerificationEnabled: false, masterEnabled: true };
  },

  /**
   * Request an OTP to be generated and transmitted via SAS Bulk SMS Gateway.
   * Works standalone on Web and native Android APK / Play Store AAB.
   */
  async sendOtp(phone: string): Promise<SendOtpResult> {
    const formatted = formatBangladeshiPhoneNumber(phone);
    if (!formatted || formatted.length < 11) {
      return {
        success: false,
        error: "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।"
      };
    }

    // 1. First try high-reliability Server-side OTP Sending Endpoint (/api/otp/send)
    try {
      const response = await fetch(getApiUrl("/api/otp/send"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          saveStoredSession({
            phone: formatted,
            otpHash: "",
            salt: "",
            createdAt: Date.now(),
            expiresAt: Date.now() + (5 * 60 * 1000),
            attempts: 0,
            lastSentAt: Date.now(),
            verified: false
          });

          return {
            success: true,
            message: data.message || `আপনার মোবাইল নম্বর 0${formatted.slice(-10)}-এ একটি ৬ সংখ্যার ওটিপি পাঠানো হয়েছে।`,
            phone: `0${formatted.slice(-10)}`,
            cooldown: data.cooldown || 60
          };
        } else if (data.error) {
          return {
            success: false,
            error: data.error,
            code: data.code
          };
        }
      }
    } catch (serverErr) {
      console.warn("[OTP] Server OTP send notice, trying direct client fallback:", serverErr);
    }

    // 2. Client-side Fallback
    const now = Date.now();
    const existing = getStoredSession(formatted);

    // Cooldown check (60 seconds)
    if (existing && (now - existing.lastSentAt) < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      return {
        success: false,
        error: `অনুগ্রহ করে ${remainingSeconds} সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।`,
        remainingSeconds,
        code: "COOLDOWN_ACTIVE"
      };
    }

    // Generate 6-digit numeric OTP
    const randomVal = Math.floor(100000 + Math.random() * 900000);
    const otp = randomVal.toString();
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const otpHash = await sha256Hex(otp + salt);

    const messageContent = `Your Al Mayadin Bazar verification code is ${otp}. Valid for 5 minutes. Please do not share this OTP.`;

    try {
      const smsResult = await sendSms(formatted, messageContent, "OTP Verification", "System");

      if (!smsResult.success) {
        console.warn("[OTP] Gateway dispatch error:", smsResult.error);
        return {
          success: false,
          error: "এসএমএস গেটওয়ে থেকে ওটিপি পাঠানো সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট কানেকশন বা নম্বর চেক করে আবার চেষ্টা করুন।"
        };
      }

      const session: LocalOtpSession = {
        phone: formatted,
        otpHash,
        salt,
        createdAt: now,
        expiresAt: now + (5 * 60 * 1000),
        attempts: 0,
        lastSentAt: now,
        verified: false
      };
      saveStoredSession(session);

      return {
        success: true,
        message: `আপনার মোবাইল নম্বর 0${formatted.slice(-10)}-এ একটি ৬ সংখ্যার ওটিপি পাঠানো হয়েছে।`,
        phone: `0${formatted.slice(-10)}`,
        cooldown: 60
      };
    } catch (err: any) {
      console.error("[OTP Send Error]:", err);
      return {
        success: false,
        error: "OTP পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।"
      };
    }
  },

  /**
   * Verify the 6-digit OTP code against the server or hashed session.
   */
  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
    if (!phone || !otp || otp.trim().length !== 6) {
      return {
        success: false,
        error: "অনুগ্রহ করে ৬ সংখ্যার সম্পূর্ণ OTP কোডটি লিখুন।"
      };
    }

    const formatted = formatBangladeshiPhoneNumber(phone);

    // 1. First try server-side verification via /api/otp/verify
    try {
      const response = await fetch(getApiUrl("/api/otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted, otp: otp.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.verificationToken) {
          return {
            success: true,
            verificationToken: data.verificationToken,
            message: data.message || "OTP ভেরিফিকেশন সফল হয়েছে।"
          };
        } else if (data.error && data.code !== "NO_ACTIVE_OTP") {
          return {
            success: false,
            error: data.error,
            code: data.code,
            remainingAttempts: data.remainingAttempts
          };
        }
      }
    } catch (serverErr) {
      console.warn("[OTP] Server OTP verify notice, checking local session:", serverErr);
    }

    // 2. Client-side local session verification fallback
    const session = getStoredSession(formatted);
    if (!session) {
      return {
        success: false,
        error: "কোনো সক্রিয় OTP পাওয়া যায়নি। অনুগ্রহ করে 'Resend OTP' চাপুন।",
        code: "NO_ACTIVE_OTP"
      };
    }

    const now = Date.now();

    // Expiry check (5 minutes)
    if (now > session.expiresAt) {
      return {
        success: false,
        error: "OTP-এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার OTP কোড রিকোয়েস্ট করুন।",
        code: "OTP_EXPIRED"
      };
    }

    if (session.attempts >= 5) {
      return {
        success: false,
        error: "সর্বোচ্চ ৫ বার ভুল OTP দেওয়া হয়েছে। অনুগ্রহ করে নতুন OTP রিকোয়েস্ট করুন।",
        code: "MAX_ATTEMPTS_EXCEEDED"
      };
    }

    const trimmedOtp = otp.trim();
    const computedHash = await sha256Hex(trimmedOtp + session.salt);
    if (computedHash !== session.otpHash) {
      session.attempts += 1;
      saveStoredSession(session);
      const remaining = 5 - session.attempts;
      return {
        success: false,
        error: `ভুল OTP কোড। আপনার আর ${remaining} বার চেষ্টা করার সুযোগ রয়েছে।`,
        remainingAttempts: remaining,
        code: "INVALID_OTP"
      };
    }

    session.verified = true;
    session.verificationToken = "vt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
    saveStoredSession(session);

    return {
      success: true,
      verificationToken: session.verificationToken,
      message: "OTP সফলভাবে যাচাই করা হয়েছে।"
    };
  },

  /**
   * Validate verification token
   */
  async validateToken(phone: string, verificationToken: string): Promise<boolean> {
    const formatted = formatBangladeshiPhoneNumber(phone);
    const session = getStoredSession(formatted);
    if (session && session.verified && session.verificationToken === verificationToken) {
      return true;
    }
    return false;
  }
};

