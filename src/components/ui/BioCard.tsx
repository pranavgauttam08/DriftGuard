'use client';
import { motion } from 'framer-motion';
import React from 'react';

interface BioCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
  halo?: boolean;
  onClick?: () => void;
  delay?: number;
}

export default function BioCard({ children, className = '', style, glow, halo, onClick, delay = 0 }: BioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={`ag-card p-5 ${glow ? 'bio-glow-border' : ''} ${halo ? 'halo-border' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01, borderColor: 'rgba(59,130,246,0.4)' } : undefined}
    >
      {children}
    </motion.div>
  );
}
