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
      <div className="glass flex items-center gap-1 rounded-full p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:gap-2">
        {PLATFORMS.map((platform) => {
          const isActive = platform === active;

          return (
            <button
              key={platform}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(platform)}
              className={`relative min-w-[92px] cursor-pointer select-none rounded-full px-5 py-3 text-center transition-colors duration-300 ${
                isActive ? 'bg-white/[0.12] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)]' : 'text-white/30 hover:bg-white/[0.05] hover:text-white/60'
              }`}
              style={{
                fontFamily: 'var(--font-bebas), Impact, sans-serif',
                fontSize:
                  size === 'lg' ? 'clamp(2.25rem, 6vw, 3.5rem)' : '1.9rem',
                letterSpacing: '0.06em',
                lineHeight: 1,
              }}
            >
              {PLATFORM_LABEL[platform].toUpperCase()}

              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute bottom-1 left-1/2 block w-10 -translate-x-1/2 text-white"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.35))' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                >
                  <svg
                    viewBox="0 0 100 8"
                    preserveAspectRatio="none"
                    className="block h-2 w-full"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 4 Q6.25 0.5 12.5 4 T25 4 T37.5 4 T50 4 T62.5 4 T75 4 T87.5 4 T100 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
