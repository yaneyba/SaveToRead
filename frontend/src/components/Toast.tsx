/**
 * Toast Notification Component
 * Shows temporary notifications for user actions
 */

import { useEffect, useState } from 'react';
import '../styles/toast.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('[Toast] Showing toast:', message, type);
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      closeTimer = setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      if (closeTimer) {
        clearTimeout(closeTimer);
      }
    };
  }, [duration, onClose, message, type]);

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-visible' : ''}`}>
      <div className="toast-icon">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
      </div>
      <span className="toast-message">{message}</span>
    </div>
  );
}
