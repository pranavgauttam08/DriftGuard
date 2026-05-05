'use client';
import { motion } from 'framer-motion';

export default function LoadingOrb({ size = 60 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="rounded-full"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background: 'radial-gradient(circle, rgba(0,255,209,0.4), transparent)',
          boxShadow: '0 0 30px rgba(0,255,209,0.3), 0 0 60px rgba(0,255,209,0.1)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-[rgba(0,255,209,0.2)]"
        style={{ width: size * 0.9, height: size * 0.9 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
