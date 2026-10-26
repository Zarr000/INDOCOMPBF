'use client';

import { motion } from 'framer-motion';
import { PLATFORMS, PLATFORM_LABEL, type Platform } from '@/lib/platform';

interface PlatformTabsProps {
  active: Platform;
  onChange: (platform: Platform) => void;
  // Each page that shows tabs uses its own id so the underline animates independently.
  layoutId?: string;
  size?: 'lg' | 'md';
}

export default function PlatformTabs({
  active,
  onChange,
  layoutId = 'platform-underline',
  size = 'lg',
}: PlatformTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Platform"
      className={`flex justify-center px-5 ${size === 'lg' ? 'pt-8 pb-10 sm:pt-10 sm:pb-12' : 'pb-8'}`}
    >
      <div className="glass flex items-center gap-1 rounded-xl p-1 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {PLATFORMS.map((platform) => {
          const isActive = platform === active;

          return (
            <button
              key={platform}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(platform)}
              className={`relative min-w-[68px] cursor-pointer select-none rounded-lg px-3 py-2 text-center transition-colors duration-300 ${
                isActive ? 'bg-white/[0.12] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]' : 'text-white/30 hover:bg-white/[0.05] hover:text-white/60'
              }`}
              style={{
                fontFamily: 'var(--font-bebas), Impact, sans-serif',
                fontSize:
                  size === 'lg' ? 'clamp(1.35rem, 3vw, 1.8rem)' : '1.15rem',
                letterSpacing: '0.06em',
                lineHeight: 1,
              }}
            >
              {PLATFORM_LABEL[platform].toUpperCase()}

              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute bottom-1 left-1/2 block w-8 -translate-x-1/2 text-white"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.35))' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                >
                  <span className="block h-0.5 w-full rounded-full bg-current" />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

