import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ScanLookupResult, lookupBarcodeOrQR } from "../lib/scannerLookup";

export type ScannerUserRole = "buyer" | "seller" | "delivery";

export interface OpenScannerOptions {
  mode?: "all" | "product" | "order";
  role?: ScannerUserRole;
  initialCode?: string;
}

interface ScannerContextType {
  isScannerOpen: boolean;
  activeRole: ScannerUserRole;
  scanResult: ScanLookupResult | null;
  loading: boolean;
  openScanner: (options?: OpenScannerOptions) => void;
  closeScanner: () => void;
  setActiveRole: (role: ScannerUserRole) => void;
  processCode: (code: string) => Promise<ScanLookupResult>;
  clearResult: () => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<ScannerUserRole>("buyer");
  const [scanResult, setScanResult] = useState<ScanLookupResult | null>(null);
  const [loading, setLoading] = useState(false);

  const processCode = useCallback(async (code: string): Promise<ScanLookupResult> => {
    setLoading(true);
    try {
      const result = await lookupBarcodeOrQR(code);
      setScanResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const openScanner = useCallback((options?: OpenScannerOptions) => {
    if (options?.role) {
      setActiveRole(options.role);
    }
    if (options?.initialCode) {
      processCode(options.initialCode);
    } else {
      setScanResult(null);
    }
    setIsScannerOpen(true);
  }, [processCode]);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const clearResult = useCallback(() => {
    setScanResult(null);
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        isScannerOpen,
        activeRole,
        scanResult,
        loading,
        openScanner,
        closeScanner,
        setActiveRole,
        processCode,
        clearResult,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error("useScanner must be used within a ScannerProvider");
  }
  return context;
};
