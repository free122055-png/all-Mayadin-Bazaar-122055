import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Settings, Play, Pause, AlertTriangle } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description: string;
  status: "not_configured" | "configuration_saved" | "connection_tested" | "active" | "error" | "disabled";
  onConfigure: () => void;
  onToggle?: (enabled: boolean) => void;
  icon?: React.ReactNode;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  name, description, status, onConfigure, onToggle, icon 
}) => {
  const getStatusDisplay = () => {
    switch (status) {
    case "active":
    case "ACTIVE":
      return { label: "ACTIVE", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" };
    case "disabled":
    case "INACTIVE":
      return { label: "DISABLED", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" };
    case "connection_tested":
    case "INITIALIZED":
      return { label: "READY", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" };
    case "error":
      return { label: "ERROR", color: "text-rose-600", bg: "bg-rose-50", dot: "bg-rose-500" };
    case "configuration_saved":
      return { label: "CONFIGURED", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" };
    default:
      return { label: "NOT CONFIGURED", color: "text-gray-400", bg: "bg-gray-50", dot: "bg-gray-300" };
    }
  };

  const display = getStatusDisplay();

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
            {icon || <Settings className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">{name}</h3>
            <div className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${display.bg} ${display.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${display.dot}`} />
              {display.label}
            </div>
          </div>
        </div>

        {status !== "not_configured" && onToggle && (
          <button
            onClick={() => onToggle(status === "disabled")}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              status === "active" 
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100" 
                : "bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
            }`}
            title={status === "active" ? "Disable" : "Enable"}
          >
            {status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={onConfigure}
          className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          {status === "not_configured" ? "Configure" : "Manage"}
        </button>
      </div>
    </motion.div>
  );
};
