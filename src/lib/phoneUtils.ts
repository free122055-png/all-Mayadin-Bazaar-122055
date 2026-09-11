/**
 * Bangladeshi Phone Number Normalization and Firebase Authentication Error Localization
 */

export interface ParsedPhone {
  raw: string;
  digits: string;
  last10: string;
  formatted: string;
  email: string;
  isValid: boolean;
}

export function parseBangladeshiPhone(raw: string): ParsedPhone {
  if (!raw) {
    return { raw: "", digits: "", last10: "", formatted: "", email: "", isValid: false };
  }

  // 1. Convert Bengali numerals (০-৯) to ASCII digits (0-9)
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let s = raw;
  bengaliDigits.forEach((bDigit, i) => {
    s = s.split(bDigit).join(String(i));
  });

  // 2. Remove all non-digit characters (+, -, spaces, parentheses, etc.)
  const digits = s.replace(/\D/g, "");

  // 3. Extract the core 10 digits (e.g. 1712345678 from 01712345678 or 8801712345678)
  const last10 = digits.length >= 10 ? digits.slice(-10) : "";
  const isValid = last10.length === 10 && last10.startsWith("1");
  const formatted = isValid ? `0${last10}` : digits;
  const email = isValid ? `${last10}@allmayadin.com` : "";

  return { raw, digits, last10, formatted, email, isValid };
}

export function getBanglaAuthErrorMessage(err: any, type: 'login' | 'register', phone: string): { message: string; errorType: 'already-exists' | 'not-found' | 'wrong-password' | 'general' } {
  const code = String(err?.code || "").toLowerCase();
  const rawMsg = String(err?.message || "").toUpperCase();

  if (code.includes("email-already-in-use") || rawMsg.includes("EMAIL_EXISTS")) {
    return {
      message: `এই মোবাইল নম্বর (${phone}) দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।`,
      errorType: 'already-exists'
    };
  }

  if (code.includes("user-not-found") || rawMsg.includes("EMAIL_NOT_FOUND")) {
    return {
      message: `এই মোবাইল নম্বরে (${phone}) কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন অ্যাকাউন্ট তৈরি করুন।`,
      errorType: 'not-found'
    };
  }

  if (
    code.includes("wrong-password") ||
    code.includes("invalid-credential") ||
    code.includes("invalid-login-credentials") ||
    rawMsg.includes("INVALID_LOGIN_CREDENTIALS") ||
    rawMsg.includes("INVALID_PASSWORD")
  ) {
    return {
      message: "মোবাইল নম্বর অথবা পাসওয়ার্ডটি সঠিক নয়। সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।",
      errorType: 'wrong-password'
    };
  }

  if (code.includes("weak-password")) {
    return {
      message: "পাসওয়ার্ডটি দুর্বল। অনুগ্রহ করে অন্তত ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড দিন।",
      errorType: 'general'
    };
  }

  if (code.includes("too-many-requests") || rawMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
    return {
      message: "অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      errorType: 'general'
    };
  }

  if (code.includes("network-request-failed") || code.includes("network-timeout") || rawMsg.includes("TIMEOUT")) {
    return {
      message: "ইন্টারনেট সংযোগে সমস্যা হচ্ছে। আপনার ডাটা বা ওয়াইফাই চেক করুন।",
      errorType: 'general'
    };
  }

  return {
    message: type === 'login' 
      ? "লগইন করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।" 
      : "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    errorType: 'general'
  };
}
