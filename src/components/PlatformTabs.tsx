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
      className={`flex justify-center px-5 ${size === 'lg' ? 'pt-5 pb-8 sm:pt-7 sm:pb-10' : 'pb-8'}`}
    >
      <div className="flex items-end gap-8 sm:gap-14">
        {PLATFORMS.map((platform) => {
          const isActive = platform === active;

          return (
            <button
              key={platform}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(platform)}
              className={`relative cursor-pointer select-none pb-3 transition-colors duration-300 ${
                isActive ? 'text-white/95' : 'text-white/30 hover:text-white/60'
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
                  className="absolute bottom-0 left-0 right-0 block text-white"
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
