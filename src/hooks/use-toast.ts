import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    
    // Simple alert for now - you can replace with a proper toast system
    if (toast.variant === 'destructive') {
      alert(`Error: ${toast.title}\n${toast.description || ''}`);
    } else {
      alert(`Success: ${toast.title}\n${toast.description || ''}`);
    }
    
    // Remove toast after showing
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 100);
  }, []);

  return { toast, toasts };
}
