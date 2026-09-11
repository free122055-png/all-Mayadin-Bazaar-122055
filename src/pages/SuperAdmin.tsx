import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Store, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Truck, 
  ChevronDown, 
  LayoutGrid, 
  Image as ImageIcon, 
  Package, 
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  BellRing,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot
} from "firebase/firestore";

// --- Types ---
interface SubStore {
  id: string;
  name: string;
  title: string;
  isActive: boolean;
  orderCount: number;
  revenue: number;
  bannerSlides: string[];
}

interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  discountPrice: number;
  weight: string;
  image: string;
  categoryId: string;
  storeId?: string;
}

// --- Mock Data for Global Overview ---
const globalStats = [
  { label: "Total Sales", value: "৳1,24,500", change: "+12.5%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { label: "Total Orders", value: "842", change: "+8.2%", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Active Users", value: "12,405", change: "+24.1%", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Pending Deliveries", value: "42", change: "-2.4%", icon: Truck, color: "text-orange-600", bg: "bg-orange-50" },
];

export const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "stores" | "settings" | "specific_store">("overview");
  const [selectedStore, setSelectedStore] = useState<SubStore | null>(null);
  const [stores, setStores] = useState<SubStore[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch Stores
  useEffect(() => {
    const q = collection(db, "stores");
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubStore));
        setStores(fetchedStores);
      },
      (error) => {
        console.warn("Stores listener notice:", error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSelectStore = (store: SubStore) => {
    setSelectedStore(store);
    setActiveTab("specific_store");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC] overflow-x-hidden -mx-4 -mt-4 pb-12 md:pb-0">
      {/* --- Sidebar --- */}
      <motion.aside 
        initial={false}
        animate={{ width: typeof window !== "undefined" && window.innerWidth < 768 ? "100%" : (isSidebarOpen ? 280 : 80) }}
        className="w-full md:w-auto bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col relative z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#004b23] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#004b23]/20">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Mayadin</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Super Admin</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <SidebarLink 
            icon={LayoutDashboard} 
            label="Master Overview" 
            active={activeTab === "overview"} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab("overview")}
          />
          <SidebarLink 
            icon={Store} 
            label="Sub-Store Manager" 
            active={activeTab === "stores"} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab("stores")}
          />
          <SidebarLink 
            icon={Settings} 
            label="Global Settings" 
            active={activeTab === "settings"} 
            collapsed={!isSidebarOpen}
            onClick={() => setActiveTab("settings")}
          />
          
          <div className="pt-6 pb-2">
            {isSidebarOpen && <p className="text-[10px] font-black text-gray-300 uppercase px-3 tracking-widest">Store Verticals</p>}
          </div>

          {stores.map((store) => (
            <SidebarLink 
              key={store.id}
              icon={LayoutGrid} 
              label={store.title} 
              active={activeTab === "specific_store" && selectedStore?.id === store.id} 
              collapsed={!isSidebarOpen}
              onClick={() => handleSelectStore(store)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
          >
            {isSidebarOpen ? "Collapse" : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search analytics, stores..." 
                className="bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm w-72 focus:ring-2 focus:ring-[#004b23]/10 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-900">Admin User</p>
                <p className="text-[10px] font-bold text-gray-400">Master Control</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004b23] to-[#008a5c] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-[#004b23]/20">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardOverview />
              </motion.div>
            )}
            {activeTab === "stores" && (
              <motion.div key="stores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StoreManager stores={stores} />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlobalSettings />
              </motion.div>
            )}
            {activeTab === "specific_store" && selectedStore && (
              <motion.div key={selectedStore.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StoreVisualEditor store={selectedStore} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const SidebarLink = ({ icon: Icon, label, active, collapsed, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
      active 
        ? "bg-[#004b23] text-white shadow-lg shadow-[#004b23]/20" 
        : "text-gray-500 hover:bg-gray-50"
    }`}
  >
    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-900"}`} />
    {!collapsed && <span className="text-sm font-bold whitespace-nowrap">{label}</span>}
  </button>
);

const DashboardOverview = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Master Overview</h2>
        <p className="text-gray-400 text-sm font-bold mt-1">Live performance tracking across all Mayadin Bazar verticals.</p>
      </div>
      <button className="flex items-center gap-2 px-6 py-3 bg-[#004b23] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#004b23]/20 hover:scale-105 active:scale-95 transition-all">
        Download Report
      </button>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {globalStats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {stat.change}
            </span>
          </div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">{stat.label}</h3>
          <p className="text-2xl font-black text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>

    {/* Recent Activity / Charts Placeholder */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-gray-900">Revenue Growth</h3>
          <div className="flex gap-2">
            {['Week', 'Month', 'Year'].map((t) => (
              <button key={t} className={`px-4 py-1.5 rounded-full text-xs font-black ${t === 'Month' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100 flex items-center justify-center">
          <p className="text-xs text-gray-400 font-bold">Chart Visualization Module</p>
        </div>
      </div>
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6">Delivery Pulse</h3>
        <div className="space-y-6">
          {[
            { label: "On Time", value: 85, color: "bg-green-500" },
            { label: "Delayed", value: 12, color: "bg-orange-500" },
            { label: "Failed", value: 3, color: "bg-red-500" },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs font-black text-gray-700 uppercase">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const StoreManager = ({ stores }: { stores: SubStore[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStore, setNewStore] = useState({ title: "", name: "" });

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "stores"), {
        ...newStore,
        isActive: true,
        orderCount: 0,
        revenue: 0,
        bannerSlides: [],
        createdAt: Date.now()
      });
      setIsAdding(false);
      setNewStore({ title: "", name: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    await updateDoc(doc(db, "stores", id), { isActive: !current });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Master Category Creator</h2>
          <p className="text-gray-400 text-sm font-bold mt-1">Manage platform verticals and sub-store availability.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#004b23] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#004b23]/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Store
        </button>
      </div>

      {isAdding && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="bg-white p-8 rounded-[40px] border-2 border-[#004b23]/10">
          <form onSubmit={handleAddStore} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase ml-1">Store Display Title (Bengali)</label>
              <input 
                required
                type="text" 
                placeholder="পোশাক বাজার" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#004b23]/10"
                value={newStore.title}
                onChange={e => setNewStore({ ...newStore, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase ml-1">Store Technical Name (English)</label>
              <input 
                required
                type="text" 
                placeholder="Fashion Market" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#004b23]/10"
                value={newStore.name}
                onChange={e => setNewStore({ ...newStore, name: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-[#004b23] text-white py-4 rounded-2xl font-black text-sm">Deploy Vertical</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative group overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${store.isActive ? 'bg-green-500' : 'bg-red-500'} opacity-[0.03] rounded-bl-full`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-gray-50 rounded-3xl group-hover:bg-[#004b23]/5 transition-colors">
                <Store className="w-8 h-8 text-[#004b23]" />
              </div>
              <button onClick={() => toggleStatus(store.id, store.isActive)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${store.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {store.isActive ? "Active" : "Disabled"}
              </button>
            </div>

            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">{store.title}</h3>
            <p className="text-gray-400 text-xs font-bold mb-6">{store.name}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Orders</p>
                <p className="text-lg font-black text-gray-900">{store.orderCount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Revenue</p>
                <p className="text-lg font-black text-gray-900">৳{store.revenue}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 p-3 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase flex items-center justify-center gap-2">
                <Edit className="w-3.5 h-3.5" />
                Edit Layout
              </button>
              <button className="p-3 bg-red-50 text-red-500 rounded-2xl">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const GlobalSettings = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl space-y-8">
    <div>
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">App Infrastructure</h2>
      <p className="text-gray-400 text-sm font-bold mt-1">Configure site-wide gateways and communication protocols.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Payment Gateways</h3>
        </div>
        <div className="space-y-4">
          {['bKash Checkout', 'Nagad API', 'Cash on Delivery'].map((gw) => (
            <div key={gw} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-sm font-bold text-gray-700">{gw}</span>
              <div className="w-10 h-6 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-gray-900">Communication</h3>
        </div>
        <div className="space-y-4">
          {['WhatsApp Notification', 'Push Notifications', 'Order Emails'].map((gw) => (
            <div key={gw} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-sm font-bold text-gray-700">{gw}</span>
              <div className="w-10 h-6 bg-gray-200 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const StoreVisualEditor = ({ store }: { store: SubStore }) => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("mobile");
  const [isEditingBanner, setIsEditingBanner] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <LayoutGrid className="w-8 h-8 text-[#004b23]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{store.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Layout Editor</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-[10px] font-black text-[#004b23] uppercase tracking-widest">Live Sync Enabled</span>
            </div>
          </div>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setViewMode("mobile")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-[#004b23] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => setViewMode("desktop")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-[#004b23] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Visual Canvas (WYSIWYG) */}
        <div className="xl:col-span-8 flex justify-center">
          <div className={`bg-white shadow-2xl rounded-[60px] border-[12px] border-gray-900 relative overflow-hidden transition-all duration-500 ${viewMode === 'mobile' ? 'w-[375px] h-[750px]' : 'w-full h-[600px]'}`}>
            {/* Mock App Content */}
            <div className="absolute inset-0 bg-[#F8FAFC] overflow-y-auto no-scrollbar pb-10">
              <div className="p-6 flex justify-between items-center bg-white mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                <div className="h-6 w-24 bg-gray-100 rounded-full" />
                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
              </div>

              {/* Banners */}
              <div className="px-6 mb-8 group relative">
                <div className="aspect-[21/9] bg-[#004b23] rounded-[32px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                  <p className="text-white text-xs font-black uppercase tracking-widest">Promotion Banner 01</p>
                  <button className="absolute inset-0 bg-[#004b23]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs uppercase gap-2 backdrop-blur-sm">
                    <ImageIcon className="w-4 h-4" /> Edit Banners
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="px-6 mb-8">
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 group">
                      <div className="w-16 h-16 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-[#004b23] transition-colors">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                      <div className="h-2 w-10 bg-gray-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="px-6 grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white p-3 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
                    <div className="aspect-square bg-gray-50 rounded-3xl" />
                    <div className="space-y-1 px-1">
                      <div className="h-3 w-3/4 bg-gray-200 rounded-full" />
                      <div className="h-2 w-1/2 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Property Editor */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#004b23]" />
              Banner Slider
            </h3>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="p-4 bg-gray-50 rounded-3xl border border-gray-100 group">
                  <div className="aspect-[16/9] bg-white rounded-2xl border border-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                     <ImageIcon className="text-gray-200 w-8 h-8" />
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase hover:bg-gray-50">Upload</button>
                    <button className="py-2 px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4" /> Add Slide
              </button>
            </div>
          </div>

          <div className="bg-[#004b23] rounded-[40px] p-8 shadow-2xl shadow-[#004b23]/20 text-white">
            <h3 className="text-lg font-black mb-2 tracking-tight">Publish Changes</h3>
            <p className="text-xs text-white/60 font-medium mb-6 leading-relaxed">Changes made to the visual layout will be deployed instantly to all active customer apps.</p>
            <button className="w-full py-4 bg-white text-[#004b23] rounded-2xl font-black text-sm hover:bg-[#ffb703] transition-all">
              Deploy to Production
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
