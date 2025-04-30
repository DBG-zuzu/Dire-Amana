import React, { createContext, useContext, useState } from 'react';

interface AdminContextType {
  authenticateAdmin: (password: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real application, this should be securely stored and compared
  const ADMIN_PASSWORD = 'admin123';

  const authenticateAdmin = (password: string): boolean => {
    return password === ADMIN_PASSWORD;
  };

  const value = {
    authenticateAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};