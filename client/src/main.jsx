  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { BrowserRouter } from 'react-router-dom';
  import { AuthProvider }       from './context/AuthContext';
  import { PermissionProvider } from './context/PermissionContext';
  import { CartProvider }     from './context/CartContext';
  import { UIProvider }       from './context/UIContext';
  import { WishlistProvider } from './context/WishlistContext';
  import { Toaster } from 'react-hot-toast';
  import './index.css';
  import App from './App.jsx';

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <PermissionProvider>
            <UIProvider>
              <WishlistProvider>
                <CartProvider>
                  <Toaster position="top-right" />
                  <App />
                </CartProvider>
              </WishlistProvider>
            </UIProvider>
          </PermissionProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
