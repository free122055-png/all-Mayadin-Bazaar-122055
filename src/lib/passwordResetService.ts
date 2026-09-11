import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { sendSms } from "./smsService";
import { parseBangladeshiPhone } from "./phoneUtils";
import { Capacitor } from "@capacitor/core";
import { getApiUrl } from "./api";

export interface AccountLookupResult {
  exists: boolean;
  userId?: string;
  name?: string;
  phone: string;
  email: string;
  error?: string;
}

export interface SendResetOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  phone?: string;
  cooldown?: number;
  remainingSeconds?: number;
  code?: string;
}

export interface VerifyResetOtpResult {
  success: boolean;
  resetToken?: string;
  message?: string;
  error?: string;
  remainingAttempts?: number;
  code?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface LocalResetSession {
  phone: string;
  userId: string;
  email: string;
  name: string;
  otpHash: string;
  salt: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
  resetToken?: string;
}

const memoryResetSessions = new Map<string, LocalResetSession>();

// Secure SHA-256 Hex helper
async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function getStoredSession(phone: string): LocalResetSession | null {
  if (memoryResetSessions.has(phone)) {
    return memoryResetSessions.get(phone)!;
  }
  try {
    const raw = sessionStorage.getItem(`pwd_reset_${phone}`);
    if (raw) {
      const s = JSON.parse(raw);
      memoryResetSessions.set(phone, s);
      return s;
    }
  } catch (e) {}
  return null;
}

function saveStoredSession(session: LocalResetSession) {
  memoryResetSessions.set(session.phone, session);
  try {
    sessionStorage.setItem(`pwd_reset_${session.phone}`, JSON.stringify(session));
  } catch (e) {}
}

function clearStoredSession(phone: string) {
  memoryResetSessions.delete(phone);
  try {
    sessionStorage.removeItem(`pwd_reset_${phone}`);
  } catch (e) {}
}

export const passwordResetService = {
  /**
   * Step 1: Check if user account exists with the provided Bangladeshi phone number
   */
  async checkAccount(rawPhone: string): Promise<AccountLookupResult> {
    const parsed = parseBangladeshiPhone(rawPhone);
    if (!parsed.isValid) {
      return {
        exists: false,
        phone: rawPhone,
        email: "",
        error: "অনুগ্রহ করে একটি সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।"
      };
    }

    try {
      // 1. Try server endpoint first
      try {
        const res = await fetch(getApiUrl("/api/auth/forgot-password/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsed.formatted })
      });
      if (res.ok) {
        const data = await res.json();
        return {
          exists: true,
          userId: data.userId,
          name: data.name || "সম্মানিত গ্রাহক",
          phone: parsed.formatted,
          email: data.email || parsed.email
        };
      } else if (res.status === 404) {
        return {
          exists: false,
          phone: parsed.formatted,
          email: parsed.email,
          error: `এই মোবাইল নম্বরে (${parsed.formatted}) কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন অ্যাকাউন্ট তৈরি করুন।`
        };
      }
    } catch (serverErr) {
      console.warn("[PasswordReset] Server check fallback to client Firestore:", serverErr);
    }

      // 2. Client Firestore Lookup (Works on native Android and fallback)
      const usersRef = collection(db, "users");
      
      // Check by formatted phone (017...)
      const qPhone = query(usersRef, where("phoneNumber", "==", parsed.formatted));
      const snapPhone = await getDocs(qPhone);

      if (!snapPhone.empty) {
        const userDoc = snapPhone.docs[0];
        const data = userDoc.data();
        return {
          exists: true,
          userId: userDoc.id,
          name: data.displayName || data.name || "সম্মানিত গ্রাহক",
          phone: parsed.formatted,
          email: data.email || parsed.email
        };
      }

      // Check by digits or international phone (88017...)
      const qIntl = query(usersRef, where("phoneNumber", "==", `88${parsed.formatted}`));
      const snapIntl = await getDocs(qIntl);
      if (!snapIntl.empty) {
        const userDoc = snapIntl.docs[0];
        const data = userDoc.data();
        return {
          exists: true,
          userId: userDoc.id,
          name: data.displayName || data.name || "সম্মানিত গ্রাহক",
          phone: parsed.formatted,
          email: data.email || parsed.email
        };
      }

      // Check by email (1712345678@allmayadin.com)
      if (parsed.email) {
        const qEmail = query(usersRef, where("email", "==", parsed.email));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const userDoc = snapEmail.docs[0];
          const data = userDoc.data();
          return {
            exists: true,
            userId: userDoc.id,
            name: data.displayName || data.name || "সম্মানিত গ্রাহক",
            phone: parsed.formatted,
            email: data.email || parsed.email
          };
        }
      }

      return {
        exists: false,
        phone: parsed.formatted,
        email: parsed.email,
        error: `এই মোবাইল নম্বরে (${parsed.formatted}) কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন অ্যাকাউন্ট তৈরি করুন।`
      };
    } catch (err: any) {
      console.error("[PasswordReset] Account check error:", err);
      return {
        exists: false,
        phone: parsed.formatted,
        email: parsed.email,
        error: "অ্যাকাউন্ট যাচাই করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।"
      };
    }
  },

  /**
   * Step 2: Send 6-digit OTP via existing Bulk SMS Gateway (SAS Gateway)
   * 5 minutes validity (300s) and 60 seconds resend cooldown
   */
  async sendResetOtp(rawPhone: string): Promise<SendResetOtpResult> {
    const check = await this.checkAccount(rawPhone);
    if (!check.exists) {
      return {
        success: false,
        error: check.error || "এই মোবাইল নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি।"
      };
    }

    const parsed = parseBangladeshiPhone(rawPhone);
    const now = Date.now();
    const existing = getStoredSession(parsed.formatted);

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

    // 1. Try server endpoint first
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsed.formatted })
      });
        const data = await res.json();
        if (res.ok && data.success) {
          return {
            success: true,
            message: data.message || `আপনার মোবাইল নম্বর ${parsed.formatted}-এ একটি ৬ সংখ্যার ওটিপি পাঠানো হয়েছে।`,
            phone: parsed.formatted,
            cooldown: data.cooldown || 60
          };
        } else if (res.status === 429) {
          return {
            success: false,
            error: data.error || `অনুগ্রহ করে অপেক্ষা করুন।`,
            remainingSeconds: data.remainingSeconds || 60,
            code: "COOLDOWN_ACTIVE"
          };
        }
      } catch (e) {
        console.warn("[PasswordReset] Server send OTP fallback to client gateway:", e);
      }

    // 2. Client / Direct Native Fallback: Generate cryptographic 6-digit random OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomOtp = (100000 + (array[0] % 900000)).toString();
    const salt = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const otpHash = await sha256Hex(randomOtp + salt);

    // Prepare message using standard format
    const messageContent = `Your Al Mayadin Bazar password reset code is ${randomOtp}. Valid for 5 minutes. Do not share this OTP.`;

    try {
      // Send SMS via existing configured SAS Bulk SMS Gateway
      const smsResult = await sendSms(parsed.formatted, messageContent, "Password Reset OTP", "System");

      if (!smsResult.success) {
        return {
          success: false,
          error: "এসএমএস গেটওয়ে থেকে ওটিপি পাঠানো সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ বা নম্বর চেক করে আবার চেষ্টা করুন।"
        };
      }

      // Store in secure session (Valid for 5 minutes)
      const session: LocalResetSession = {
        phone: parsed.formatted,
        userId: check.userId || "",
        email: check.email || parsed.email,
        name: check.name || "সম্মানিত গ্রাহক",
        otpHash,
        salt,
        createdAt: now,
        expiresAt: now + (5 * 60 * 1000), // 5 minutes validity
        attempts: 0,
        lastSentAt: now,
        verified: false
      };
      saveStoredSession(session);

      return {
        success: true,
        message: `আপনার মোবাইল নম্বর ${parsed.formatted}-এ একটি ৬ সংখ্যার পাসওয়ার্ড রিসেট ওটিপি পাঠানো হয়েছে।`,
        phone: parsed.formatted,
        cooldown: 60
      };
    } catch (err: any) {
      console.error("[PasswordReset] Send OTP error:", err);
      return {
        success: false,
        error: "OTP পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
      };
    }
  },

  /**
   * Step 3: Verify the 6-digit OTP code against the hashed session
   * Enforces 5-minute expiry, max 5 attempts limit, and invalidates OTP after success
   */
  async verifyResetOtp(rawPhone: string, otp: string): Promise<VerifyResetOtpResult> {
    const parsed = parseBangladeshiPhone(rawPhone);
    const cleanOtp = (otp || "").replace(/\D/g, "").trim();

    if (cleanOtp.length !== 6) {
      return {
        success: false,
        error: "অনুগ্রহ করে ৬ সংখ্যার সম্পূর্ণ OTP কোডটি লিখুন।"
      };
    }

    // 1. Try server verification first
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsed.formatted, otp: cleanOtp })
      });
        const data = await res.json();
        if (res.ok && data.success && data.resetToken) {
          // Sync local storage token
          const localSess = getStoredSession(parsed.formatted) || {
            phone: parsed.formatted,
            userId: "",
            email: parsed.email,
            name: "",
            otpHash: "",
            salt: "",
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000,
            attempts: 0,
            lastSentAt: Date.now(),
            verified: true,
            resetToken: data.resetToken
          };
          localSess.verified = true;
          localSess.resetToken = data.resetToken;
          saveStoredSession(localSess);

          return {
            success: true,
            resetToken: data.resetToken,
            message: data.message || "OTP সফলভাবে যাচাই হয়েছে! নতুন পাসওয়ার্ড দিন।"
          };
        } else if (res.status === 400 || res.status === 429) {
          return {
            success: false,
            error: data.error || "ভুল OTP কোড। দয়া করে সঠিক কোড দিন।",
            remainingAttempts: data.remainingAttempts,
            code: data.code
          };
        }
      } catch (e) {
        console.warn("[PasswordReset] Server verify OTP fallback to local check:", e);
      }

    // 2. Local / Native verification
    const session = getStoredSession(parsed.formatted);
    if (!session) {
      return {
        success: false,
        error: "কোনো সক্রিয় OTP পাওয়া যায়নি। অনুগ্রহ করে নতুন কোড পাঠান।",
        code: "NO_ACTIVE_OTP"
      };
    }

    const now = Date.now();

    // Expiry check (5 minutes)
    if (now > session.expiresAt) {
      clearStoredSession(parsed.formatted);
      return {
        success: false,
        error: "OTP কোডের ৫ মিনিট মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন করে কোড পাঠান।",
        code: "OTP_EXPIRED"
      };
    }

    // Max attempts check (5 attempts limit)
    if (session.attempts >= 5) {
      clearStoredSession(parsed.formatted);
      return {
        success: false,
        error: "সর্বোচ্চ ৫ বার ভুল OTP দেওয়া হয়েছে। এই OTP বাতিল করা হয়েছে। নতুন করে OTP নিন।",
        code: "MAX_ATTEMPTS_EXCEEDED"
      };
    }

    // Hash comparison
    const candidateHash = await sha256Hex(cleanOtp + session.salt);
    if (candidateHash !== session.otpHash) {
      session.attempts += 1;
      saveStoredSession(session);
      const remaining = 5 - session.attempts;
      if (remaining <= 0) {
        clearStoredSession(parsed.formatted);
        return {
          success: false,
          error: "সর্বোচ্চ ৫ বার ভুল OTP দেওয়া হয়েছে। নতুন করে OTP পাঠান।",
          code: "MAX_ATTEMPTS_EXCEEDED"
        };
      }
      return {
        success: false,
        error: `ভুল OTP কোড। দয়া করে সঠিক কোড দিন। (অবশিষ্ট সুযোগ: ${remaining} বার)`,
        remainingAttempts: remaining,
        code: "INVALID_OTP"
      };
    }

    // Verification Success: Generate cryptographically secure reset token
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const resetToken = "rst_" + Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    session.verified = true;
    session.resetToken = resetToken;
    session.otpHash = ""; // Invalidate OTP immediately to prevent replay attacks
    saveStoredSession(session);

    return {
      success: true,
      resetToken,
      message: "OTP সফলভাবে যাচাই হয়েছে! অনুগ্রহ করে নতুন পাসওয়ার্ড নির্ধারণ করুন।"
    };
  },

  /**
   * Step 4: Set new password and securely update in Database / Firebase Auth
   */
  async resetPassword(
    rawPhone: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ResetPasswordResult> {
    const parsed = parseBangladeshiPhone(rawPhone);

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "নতুন পাসওয়ার্ডটি নূন্যতম ৬ অক্ষরের হতে হবে।"
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: "উভয় পাসওয়ার্ড একই হতে হবে। দয়া করে মিলিয়ে লিখুন।"
      };
    }

    // 1. Server-side password reset (Updates & verifies Firebase Authentication + Firestore)
    try {
      const res = await fetch(getApiUrl("/api/auth/forgot-password/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: parsed.formatted,
          resetToken,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
        };
      }

      // Invalidate session completely
      clearStoredSession(parsed.formatted);

      return {
        success: true,
        message: data.message || "আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।"
      };
    } catch (e: any) {
      console.error("[PasswordReset] Server reset error:", e);
      return {
        success: false,
        error: "সার্ভারে সংযোগ করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।"
      };
    }
  }
};
