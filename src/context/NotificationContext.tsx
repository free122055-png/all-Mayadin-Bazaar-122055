import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  body?: string;
  imageUrl?: string;
  read: boolean;
  createdAt: any;
  type?: 'order' | 'offer' | 'system' | 'payment' | 'push';
  link?: string;
  userId?: string;
  data?: any;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string, link?: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Local storage helper for broadcast notifications read status
  const getReadKey = () => `read_notifs_${user?.uid || 'guest'}`;

  const getLocalReadIds = (): string[] => {
    try {
      const stored = localStorage.getItem(getReadKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalReadId = (id: string) => {
    try {
      const current = getLocalReadIds();
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(getReadKey(), JSON.stringify(current));
      }
    } catch {
      // ignore
    }
  };

  const saveAllLocalReadIds = (ids: string[]) => {
    try {
      const current = new Set([...getLocalReadIds(), ...ids]);
      localStorage.setItem(getReadKey(), JSON.stringify(Array.from(current)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let unSubAll: (() => void) | null = null;
    let unSubUser: (() => void) | null = null;

    let allDocs: NotificationItem[] = [];
    let userDocs: NotificationItem[] = [];

    const mergeAndSet = () => {
      const localReadIds = getLocalReadIds();
      const combinedMap = new Map<string, NotificationItem>();

      [...allDocs, ...userDocs].forEach((item) => {
        const isReadLocally = localReadIds.includes(item.id);
        const derivedMessage = item.message || item.body || "";
        const derivedType = item.type || (item.data?.productId ? 'offer' : 'system');
        const derivedLink = item.link || (item.data?.productId ? `/product/${item.data.productId}` : undefined);

        combinedMap.set(item.id, {
          ...item,
          message: derivedMessage,
          body: derivedMessage,
          type: derivedType,
          link: derivedLink,
          read: Boolean(item.read || isReadLocally)
        });
      });

      const list = Array.from(combinedMap.values()).sort((a, b) => {
        const getTime = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime() || 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });

      setNotifications(list);
      setLoading(false);
    };

    // 1. Broadcast / Software-wide notifications (userId === "ALL")
    try {
      const qAll = query(collection(db, "notifications"), where("userId", "==", "ALL"));
      unSubAll = onSnapshot(qAll, (snap) => {
        allDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotificationItem[];
        mergeAndSet();
      }, (err) => {
        console.warn("Broadcast notifications fetch issue:", err);
        setLoading(false);
      });
    } catch (e) {
      console.warn("qAll error:", e);
    }

    // 2. User-specific notifications (userId === user.uid)
    if (user?.uid) {
      try {
        const qUser = query(collection(db, "notifications"), where("userId", "==", user.uid));
        unSubUser = onSnapshot(qUser, (snap) => {
          userDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NotificationItem[];
          mergeAndSet();
        }, (err) => {
          console.warn("User notifications fetch issue:", err);
          setLoading(false);
        });
      } catch (e) {
        console.warn("qUser error:", e);
      }
    } else {
      userDocs = [];
      mergeAndSet();
    }

    return () => {
      if (unSubAll) unSubAll();
      if (unSubUser) unSubUser();
    };
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    saveLocalReadId(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const targetNotif = notifications.find(n => n.id === id);
    if (targetNotif && targetNotif.userId === user?.uid) {
      try {
        await updateDoc(doc(db, "notifications", id), { read: true });
      } catch (e) {
        console.warn("Failed to update Firestore notification doc:", e);
      }
    }
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    saveAllLocalReadIds(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    if (user?.uid) {
      try {
        const batch = writeBatch(db);
        notifications.forEach(notif => {
          if (!notif.read && notif.userId === user.uid) {
            batch.update(doc(db, "notifications", notif.id), { read: true });
          }
        });
        await batch.commit();
      } catch (e) {
        console.warn("Failed to mark all as read in Firestore:", e);
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};
