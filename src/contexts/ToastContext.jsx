import React, { createContext, useContext, useState } from 'react';
import ToastNotification from '../components/modals/ToastNotification';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ isOpen: true, message, type, duration });
  };

  const hideToast = () => {
    setToast({ ...toast, isOpen: false });
  };

  // Convenience methods
  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      <ToastNotification
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        duration={toast.duration || 3000}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};


