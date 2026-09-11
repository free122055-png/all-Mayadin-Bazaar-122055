import React, { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  onSnapshot, 
  getDocs,
  doc, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { UserProfile } from "../../types";
import { getApiUrl } from "../../lib/api";
import { 
  Users, 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  Shield, 
  Calendar, 
  LogIn,
  Mail,
  Phone,
  Filter,
  Bell,
  RefreshCw,
  Edit3,
  X,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

interface UserManagementProps {
  onSendNotification?: (user: UserProfile) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onSendNotification }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<'customer' | 'admin'>('customer');
  const [editStatus, setEditStatus] = useState<'active' | 'blocked'>('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Confirmation Modal State (replaces window.confirm which is blocked in iframes)
  const [confirmModal, setConfirmModal] = useState<{
    type: 'block' | 'unblock' | 'delete';
    user: UserProfile;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchUsersDirectly = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as UserProfile);
      });
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : 0);
        return timeB - timeA;
      });
      if (list.length > 0) {
        setUsers(list);
      }
    } catch (e) {
      console.warn("Direct users fetch fallback error:", e);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsersDirectly();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    setLoading(true);
    const usersCol = collection(db, "users");
    
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((d) => {
        usersData.push({ id: d.id, ...d.data() } as UserProfile);
      });
      usersData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : 0);
        return timeB - timeA;
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.warn("User management listener notice:", error.message);
      fetchUsersDirectly().finally(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [fetchUsersDirectly]);

  // Open Edit Modal
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.displayName || (user as any).name || (user as any).fullName || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phoneNumber || (user as any).phone || "");
    setEditRole((user.role === 'admin' ? 'admin' : 'customer'));
    setEditStatus((user.status === 'blocked' ? 'blocked' : 'active'));
  };

  // Save User Edits
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSavingEdit(true);
    const userId = editingUser.id;

    // Optimistically update local state immediately
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      displayName: editName.trim(),
      email: editEmail.trim(),
      phoneNumber: editPhone.trim(),
      role: editRole,
      status: editStatus,
      updatedAt: Date.now()
    } : u));

    try {
      // 1. Client Firestore SDK update
      await updateDoc(doc(db, "users", userId), {
        displayName: editName.trim(),
        email: editEmail.trim(),
        phoneNumber: editPhone.trim(),
        role: editRole,
        status: editStatus,
        updatedAt: Date.now()
      });

      // 2. Server REST API update for backup
      await fetch(getApiUrl("/api/admin/users/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          displayName: editName.trim(),
          email: editEmail.trim(),
          phoneNumber: editPhone.trim(),
          role: editRole,
          status: editStatus
        })
      });

      showToast("ইউজারের তথ্য সফলভাবে আপডেট করা হয়েছে!");
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error saving user profile edit:", error);
      showToast("ইউজারের তথ্য আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle Block/Unblock
  const confirmToggleBlock = async (user: UserProfile) => {
    const isCurrentlyBlocked = user.status === 'blocked';
    const actionText = isCurrentlyBlocked ? 'আনব্লক' : 'ব্লক';
    const newStatus = isCurrentlyBlocked ? 'active' : 'blocked';

    setConfirmModal(null);
    setActionLoading(user.id);

    // Optimistically update state
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    
    try {
      // 1. Client Firestore update
      await updateDoc(doc(db, "users", user.id), {
        status: newStatus,
        updatedAt: Date.now()
      });

      // 2. Server API backup
      await fetch(getApiUrl("/api/admin/users/update"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus })
      });

      showToast(`ইউজারকে সফলভাবে ${actionText} করা হয়েছে!`);
    } catch (error) {
      console.error("Error updating user status:", error);
      showToast("ইউজার স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete User
  const confirmDeleteUser = async (user: UserProfile) => {
    setConfirmModal(null);
    setActionLoading(user.id);

    // Optimistically filter user out of local state
    setUsers(prev => prev.filter(u => u.id !== user.id));
    
    try {
      // Execute both server API delete and client SDK delete
      const results = await Promise.allSettled([
        fetch(getApiUrl("/api/admin/users/delete"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        }),
        deleteDoc(doc(db, "users", user.id))
      ]);

      console.log("Delete user execution results:", results);
      showToast("ইউজার অ্যাকাউন্ট সফলভাবে ডিলিট করা হয়েছে!");
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("ইউজার ডিলিট করতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(null);
    }
  };

  const safeFormat = (dateValue: any, formatStr: string) => {
    if (!dateValue) return "N/A";
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp objects
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        date = new Date(dateValue.seconds * 1000);
      } 
      // Handle numbers (milliseconds)
      else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      }
      // Handle Date objects
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      else {
        return "N/A";
      }

      // Final check for valid date
      if (isNaN(date.getTime())) return "N/A";
      
      return format(date, formatStr);
    } catch (error) {
      console.error("Date formatting error:", error, dateValue);
      return "N/A";
    }
  };

  const filteredUsers = users.filter(user => {
    const nameStr = (user.displayName || (user as any).name || (user as any).fullName || "").toLowerCase();
    const emailStr = (user.email || "").toLowerCase();
    const phoneStr = (user.phoneNumber || (user as any).phone || "");
    const searchLower = searchTerm.toLowerCase().trim();
    
    const matchesSearch = 
      !searchLower ||
      nameStr.includes(searchLower) ||
      emailStr.includes(searchLower) ||
      phoneStr.includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus || (filterStatus === 'active' && !user.status);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-8 h-8 text-orange-600" />
              ইউজার ম্যানেজমেন্ট
            </h2>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all active:scale-90"
              title="ইউজার ডাটা রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">আপনার অ্যাপের সকল গ্রাহকদের এখান থেকে নিয়ন্ত্রণ করুন।</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">সক্রিয় ইউজার</p>
              <p className="text-lg font-bold text-gray-800">{users.filter(u => u.status !== 'blocked').length}</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">ব্লকড ইউজার</p>
              <p className="text-lg font-bold text-gray-800">{users.filter(u => u.status === 'blocked').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-5 h-5 hidden md:block" />
          <select
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">সকল ইউজার ({users.length})</option>
            <option value="active">সক্রিয় ({users.filter(u => u.status !== 'blocked').length})</option>
            <option value="blocked">ব্লকড ({users.filter(u => u.status === 'blocked').length})</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 animate-pulse font-medium">ইউজার ডাটা লোড হচ্ছে...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-20 text-center">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">কোনো ইউজার পাওয়া যায়নি।</p>
            <button
              onClick={handleManualRefresh}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> পুনরায় রিফ্রেশ করুন
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <th className="px-6 py-4 font-semibold">ইউজার</th>
                  <th className="px-6 py-4 font-semibold">যোগাযোগ</th>
                  <th className="px-6 py-4 font-semibold">স্ট্যাটাস</th>
                  <th className="px-6 py-4 font-semibold">মেটাডাটা</th>
                  <th className="px-6 py-4 font-semibold text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{user.displayName || (user as any).name || (user as any).fullName || "গ্রাহক"}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {user.role === 'admin' ? (
                                <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                  <Shield className="w-2.5 h-2.5" /> Admin
                                </span>
                              ) : (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                  Customer
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-mono">UID: {user.id ? `${user.id.substring(0, 8)}...` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{user.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{user.phoneNumber || (user as any).phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.status === 'blocked' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {user.status === 'blocked' ? (
                            <><UserX className="w-3.5 h-3.5" /> ব্লকড</>
                          ) : (
                            <><UserCheck className="w-3.5 h-3.5" /> সক্রিয়</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          জয়েন: {safeFormat(user.createdAt, 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LogIn className="w-3 h-3" />
                          লাস্ট: {safeFormat(user.lastLoginAt, 'MMM d, h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            title="এডিট করুন"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {onSendNotification && (
                            <button
                              onClick={() => onSendNotification(user)}
                              className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                              title="নোটিফিকেশন পাঠান"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmModal({ type: user.status === 'blocked' ? 'unblock' : 'block', user })}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg transition-all ${
                              user.status === 'blocked'
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={user.status === 'blocked' ? "আনব্লক করুন" : "ব্লক করুন"}
                          >
                            {actionLoading === user.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : user.status === 'blocked' ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', user })}
                            disabled={actionLoading === user.id}
                            className="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                            title="ডিলিট করুন"
                          >
                            {actionLoading === user.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-[#004b23] text-white px-4 py-3 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#ffb703]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">ইউজারের তথ্য এডিট করুন</h3>
                  <p className="text-xs text-gray-500 font-mono">UID: {editingUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">নাম (Name)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                  placeholder="ইউজারের পুরো নাম"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ইমেইল (Email)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                  placeholder="ইউজারের ইমেইল অ্যাড্রেস"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ফোন নম্বর (Phone Number)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">রোল (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold"
                  >
                    <option value="customer">Customer (সাধারণ গ্রাহক)</option>
                    <option value="admin">Admin (এডমিন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">স্ট্যাটাস (Status)</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold"
                  >
                    <option value="active">Active (সক্রিয়)</option>
                    <option value="blocked">Blocked (ব্লকড)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "সেভ হচ্ছে..." : "পরিবর্তন সেভ করুন"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Custom Confirmation Modal (bypasses iframe window.confirm restriction) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${
                confirmModal.type === 'delete'
                  ? 'bg-red-100 text-red-600'
                  : confirmModal.type === 'block'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {confirmModal.type === 'delete' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.type === 'block' ? (
                  <UserX className="w-6 h-6" />
                ) : (
                  <UserCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  {confirmModal.type === 'delete' && "ইউজার অ্যাকাউন্ট ডিলিট করবেন?"}
                  {confirmModal.type === 'block' && "ইউজার অ্যাকাউন্ট ব্লক করবেন?"}
                  {confirmModal.type === 'unblock' && "ইউজার অ্যাকাউন্ট আনব্লক করবেন?"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ইউজার: <span className="font-bold text-gray-800">{confirmModal.user.displayName || confirmModal.user.email || 'N/A'}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 leading-relaxed">
              {confirmModal.type === 'delete' && "আপনি কি নিশ্চিতভাবে এই ইউজার অ্যাকাউন্টটি ডিলিট করতে চান? ডাটাবেজ থেকে সকল রেকর্ড স্থায়ীভাবে মুছে যাবে।"}
              {confirmModal.type === 'block' && "ইউজারকে ব্লক করলে সে আল মায়াদীন বাজারে লগইন করতে বা নতুন অর্ডার করতে পারবে না।"}
              {confirmModal.type === 'unblock' && "ইউজারকে আনব্লক করলে সে পুনরায় স্বাভাবিকভাবে লগইন ও কেনাকাটা করতে পারবে।"}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'delete') {
                    confirmDeleteUser(confirmModal.user);
                  } else {
                    confirmToggleBlock(confirmModal.user);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.type === 'block'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmModal.type === 'delete' && "হ্যাঁ, ডিলিট করুন"}
                {confirmModal.type === 'block' && "হ্যাঁ, ব্লক করুন"}
                {confirmModal.type === 'unblock' && "হ্যাঁ, আনব্লক করুন"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
