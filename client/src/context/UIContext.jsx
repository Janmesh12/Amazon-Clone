  import { createContext, useContext, useState } from 'react';

  const UIContext = createContext();

  export function UIProvider({ children }) {
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [searchQuery, setSearchQuery]           = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedProduct, setSelectedProduct]     = useState(null);

    return (
      <UIContext.Provider value={{ 
        showOrdersModal, setShowOrdersModal, 
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        selectedProduct, setSelectedProduct
      }}>
        {children}
      </UIContext.Provider>
    );
  }

  export function useUI() {
    return useContext(UIContext);
  }
