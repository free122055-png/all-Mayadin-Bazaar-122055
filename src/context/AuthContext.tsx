import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithCustomToken,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { getApiUrl } from "../lib/api";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase";
import { UserProfile } from "../types";
import { notificationService } from "../lib/notifications";
import { sendSms } from "../lib/smsService";

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  photoURL?: string;
  isPhoneVerified?: boolean;
  otpState?: 'OTP_PENDING' | 'OTP_VERIFIED' | 'OTP_EXPIRED' | 'OTP_FAILED';
  phoneVerifiedAt?: number;
  otpVerificationToken?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  authModalMessage: string | null;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot', message?: string, onAuthSuccess?: () => void) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void, customMessage?: string) => boolean;
  loginWithEmail: (email: string, pass: string) => Promise<User>;
  registerWithEmail: (data: RegisterData) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  quickDemoLogin: (role?: 'customer' | 'admin') => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalMessage, setAuthModalMessage] = useState<string | null>(null);
  
  // Pending action callback when user logs in successfully
  const pendingActionRef = useRef<(() => void) | null>(null);

  const normalizePhone = (phone: string) => {
    // Extract last 10 digits to handle +880, 0, or just 10 digits
    const digits = phone.replace(/[^0-9]/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const fetchProfile = async (firebaseUser: User) => {
    // If we already have a profile and it matches this user, don't refetch
    if (profile && profile.id === firebaseUser.uid) return;

    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), 3000))
      ]);
      
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // Block Logic
        if (data.status === 'blocked') {
          await firebaseSignOut(auth);
          setUser(null);
          setProfile(null);
          setLoading(false);
          alert("আপনার অ্যাকাউন্টটি সাময়িকভাবে ব্লক করা হয়েছে। দয়া করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।");
          return;
        }

        const isAdminEmail = firebaseUser.email === "free122055@gmail.com";
        const currentRole = isAdminEmail ? "admin" : data.role;

        setProfile({
          ...data,
          role: currentRole,
          lastLoginAt: data.lastLoginAt || Date.now()
        });

        // Update last login and role asynchronously using setDoc with merge: true - DON'T AWAIT
        setDoc(docRef, { 
          role: currentRole,
          lastLoginAt: Date.now(),
          updatedAt: serverTimestamp() 
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
      } else {
        // Only create if we don't have it (fallback)
        const phone = firebaseUser.phoneNumber || "";
        const isAdminEmail = firebaseUser.email === "free122055@gmail.com";
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "সম্মানিত গ্রাহক",
          role: isAdminEmail ? "admin" : "customer",
          status: "active",
          phoneNumber: phone,
          photoURL: firebaseUser.photoURL || "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastLoginAt: Date.now(),
        };
        
        // Parallelize initial creation
        setProfile(newProfile);
        setDoc(docRef, { 
          ...newProfile, 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp(),
          lastLoginAt: Date.now()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`));
      }
    } catch (err: any) {
      console.warn("Profile fetch notice (offline/network):", err?.message || err);
      const isAdminEmail = firebaseUser.email === "free122055@gmail.com";
      setProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "সম্মানিত গ্রাহক",
        role: isAdminEmail ? "admin" : "customer",
        status: "active",
        phoneNumber: firebaseUser.phoneNumber || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchProfile(firebaseUser);
        notificationService.loginUser(firebaseUser.uid);
        
        if (pendingActionRef.current) {
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          try {
            action();
          } catch (e) {
            console.error("Error executing pending action post-login:", e);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const openAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login', 
    message?: string, 
    onAuthSuccess?: () => void
  ) => {
    setAuthModalMode(mode);
    setAuthModalMessage(message || null);
    if (onAuthSuccess) {
      pendingActionRef.current = onAuthSuccess;
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalMessage(null);
  };

  /**
   * Enforces the purchase/order guard:
   * If the user is logged in, immediately performs the action and returns true.
   * If not logged in, queues the action, opens the auth modal with customMessage, and returns false.
   */
  const requireAuth = (action: () => void, customMessage?: string): boolean => {
    if (user) {
      action();
      return true;
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/food/buy";
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    return false;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User> => {
    let userCredential;
    const trimmedEmail = email.trim();
    try {
      userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    } catch (err: any) {
      if (err?.code === "auth/user-not-found" || err?.message?.includes("EMAIL_NOT_FOUND")) {
        let altEmail = "";
        if (trimmedEmail.endsWith("@allmayadin.com")) {
          const userPart = trimmedEmail.split("@")[0];
          if (userPart.length === 10 && userPart.startsWith("1")) {
            altEmail = `0${userPart}@allmayadin.com`;
          } else if (userPart.length === 11 && userPart.startsWith("01")) {
            altEmail = `${userPart.slice(1)}@allmayadin.com`;
          }
        }
        if (altEmail) {
          userCredential = await signInWithEmailAndPassword(auth, altEmail, pass);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
    setUser(userCredential.user);
    
    // Asynchronously fetch profile without blocking immediate login completion
    Promise.race([
      fetchProfile(userCredential.user),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]).catch(err => console.warn("Background profile fetch:", err));
    
    closeAuthModal();
    return userCredential.user;
  };

  const registerWithEmail = async (data: RegisterData): Promise<User> => {
    // 1. Try server-assisted registration for high reliability (handles existing accounts, password sync, custom tokens)
    try {
      const apiRes = await fetch(getApiUrl("/api/auth/register-verified-user"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          address: data.address || "",
          photoURL: data.photoURL || "",
          isPhoneVerified: data.isPhoneVerified,
          otpState: data.otpState || (data.isPhoneVerified ? "OTP_VERIFIED" : undefined)
        })
      });

      if (apiRes.ok) {
        const resData = await apiRes.json();
        if (resData.success && resData.customToken) {
          const userCredential = await signInWithCustomToken(auth, resData.customToken);
          const registeredUser = userCredential.user;
          
          const isAdminEmail = registeredUser.email === "free122055@gmail.com";
          const userDoc: UserProfile = {
            id: registeredUser.uid,
            email: data.email.trim(),
            displayName: data.name.trim(),
            role: isAdminEmail ? "admin" : "customer",
            status: "active",
            phoneNumber: data.phone.trim(),
            photoURL: data.photoURL || "",
            isPhoneVerified: data.isPhoneVerified ?? false,
            otpState: data.otpState || (data.isPhoneVerified ? "OTP_VERIFIED" : undefined),
            phoneVerifiedAt: data.phoneVerifiedAt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastLoginAt: Date.now(),
          };
          
          setProfile(userDoc);
          setUser(registeredUser);
          closeAuthModal();
          return registeredUser;
        }
      }
    } catch (serverErr) {
      console.warn("Server auth registration fallback to client SDK:", serverErr);
    }

    // 2. Client SDK Fallback
    let userCredential;
    try {
      // Create Auth Account
      userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        try {
          // Attempt sign in with password if user already exists
          userCredential = await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
        } catch (loginErr) {
          // Check if alt email format works
          let altEmail = "";
          const trimmedEmail = data.email.trim();
          if (trimmedEmail.endsWith("@allmayadin.com")) {
            const userPart = trimmedEmail.split("@")[0];
            if (userPart.length === 10 && userPart.startsWith("1")) {
              altEmail = `0${userPart}@allmayadin.com`;
            } else if (userPart.length === 11 && userPart.startsWith("01")) {
              altEmail = `${userPart.slice(1)}@allmayadin.com`;
            }
          }
          if (altEmail) {
            try {
              userCredential = await signInWithEmailAndPassword(auth, altEmail, data.password);
            } catch {
              throw err;
            }
          } else {
            throw err;
          }
        }
      } else {
        throw err;
      }
    }
    const registeredUser = userCredential.user;

    // Prepare Profile Data
    const isAdminEmail = registeredUser.email === "free122055@gmail.com";
    const userDoc: UserProfile = {
      id: registeredUser.uid,
      email: data.email.trim(),
      displayName: data.name.trim(),
      role: isAdminEmail ? "admin" : "customer",
      status: "active",
      phoneNumber: data.phone.trim(),
      photoURL: data.photoURL || "",
      isPhoneVerified: data.isPhoneVerified ?? false,
      otpState: data.otpState || (data.isPhoneVerified ? "OTP_VERIFIED" : undefined),
      phoneVerifiedAt: data.phoneVerifiedAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    // Set local state immediately for instant feedback
    setProfile(userDoc);
    setUser(registeredUser);

    // Background tasks
    Promise.all([
      updateProfile(registeredUser, {
        displayName: data.name.trim(),
        photoURL: data.photoURL || ""
      }),
      setDoc(doc(db, "users", registeredUser.uid), {
        ...userDoc,
        address: data.address || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }),
      (async () => {
        try {
          const smsConfigSnap = await getDoc(doc(db, "configs", "integration_sms"));
          if (smsConfigSnap.exists()) {
            const config = smsConfigSnap.data();
            if (config.masterEnabled && config.welcomeSmsEnabled && config.welcomeSmsText && data.phone) {
              await sendSms(data.phone, config.welcomeSmsText, "Welcome SMS", "System");
            }
          }
        } catch (e) {
          console.error("Welcome SMS Error:", e);
        }
      })()
    ]).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${registeredUser.uid}`));

    closeAuthModal();
    return registeredUser;
  };

  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async (): Promise<void> => {
    try {
      await notificationService.logoutUser();
    } catch (e) {
      console.warn("OneSignal logout warning:", e);
    }
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const quickDemoLogin = async (role: 'customer' | 'admin' = 'customer'): Promise<void> => {
    const demoEmail = role === 'admin' ? "admin@allmayadin.com" : "customer@allmayadin.com";
    const demoPass = "mayadin123456";

    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
    } catch (err: any) {
      // If demo account doesn't exist, create it
      try {
        const cred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        await updateProfile(cred.user, {
          displayName: role === 'admin' ? "অ্যাডমিন (Admin)" : "মোঃ আরিফুল ইসলাম",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
        });
        await setDoc(doc(db, "users", cred.user.uid), {
          id: cred.user.uid,
          email: demoEmail,
          displayName: role === 'admin' ? "অ্যাডমিন (Admin)" : "মোঃ আরিফুল ইসলাম",
          role: role,
          status: "active",
          phoneNumber: "01711223344",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } catch (innerErr) {
        console.error("Demo login error:", innerErr);
        throw innerErr;
      }
    }
    closeAuthModal();
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      if (profile) {
        setProfile({ ...profile, email: newEmail });
      }
    } catch (e) {
      console.error("Error updating user email:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        authModalMode,
        authModalMessage,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        quickDemoLogin,
        refreshProfile,
        updateUserEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
