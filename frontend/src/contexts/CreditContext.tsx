import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { UserCreditInfo, CreditTier } from '../types';

interface CreditContextType {
  creditInfo: UserCreditInfo | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
  isTopupModalOpen: boolean;
  selectedPackageId: CreditTier | null;
  openTopupModal: (packageId?: CreditTier) => void;
  closeTopupModal: () => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CreditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [creditInfo, setCreditInfo] = useState<UserCreditInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState<boolean>(false);
  const [selectedPackageId, setSelectedPackageId] = useState<CreditTier | null>(null);

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setCreditInfo(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getBillingBalance();
      setCreditInfo(data);
    } catch (err) {
      console.error('Lỗi khi tải thông tin Credit:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const openTopupModal = (packageId: CreditTier = 'plus') => {
    setSelectedPackageId(packageId);
    setIsTopupModalOpen(true);
  };

  const closeTopupModal = () => {
    setIsTopupModalOpen(false);
  };

  return (
    <CreditContext.Provider
      value={{
        creditInfo,
        loading,
        refreshCredits,
        isTopupModalOpen,
        selectedPackageId,
        openTopupModal,
        closeTopupModal,
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};
