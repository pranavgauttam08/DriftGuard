'use client';
import { motion } from 'framer-motion';
import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function GlowButton({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', icon }: GlowButtonProps) {
  const base = variant === 'danger' ? 'ag-button-danger' : variant === 'ghost' ? 'ag-button-ghost' : 'ag-button';
  const sizeClass = size === 'sm' ? '!px-4 !py-2 !text-xs' : size === 'lg' ? '!px-8 !py-4 !text-base' : '';
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${base} ${sizeClass} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </motion.button>
  );
}
