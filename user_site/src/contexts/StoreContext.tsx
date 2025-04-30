import React, { createContext, useContext, useState, useCallback } from 'react';

interface StoreContextType {
  totalItems: number;
  addItem: () => void;
  removeItem: () => void;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [totalItems, setTotalItems] = useState(0);

  const addItem = useCallback(() => {
    setTotalItems(prev => prev + 1);
  }, []);

  const removeItem = useCallback(() => {
    setTotalItems(prev => Math.max(0, prev - 1));
  }, []);

  const clearCart = useCallback(() => {
    setTotalItems(0);
  }, []);

  return (
    <StoreContext.Provider value={{ totalItems, addItem, removeItem, clearCart }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}