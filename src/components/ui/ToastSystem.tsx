'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  addToastFn?.({ message, type, duration });
}

export default function ToastSystem() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), toast.duration || 4000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  const icons = { success: <CheckCircle size={16} />, error: <AlertTriangle size={16} />, warning: <AlertTriangle size={16} />, info: <Info size={16} /> };
  const colors = { success: '#00FF88', error: '#EF4444', warning: '#F59E0B', info: '#00E5FF' };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
            className="ag-card px-4 py-3 flex items-center gap-3"
            style={{ borderColor: colors[t.type], boxShadow: `0 0 20px ${colors[t.type]}30` }}
          >
            <span style={{ color: colors[t.type] }}>{icons[t.type]}</span>
            <span className="text-sm flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-[var(--color-text-secondary)] hover:text-white"><X size={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
