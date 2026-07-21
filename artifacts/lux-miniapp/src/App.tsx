import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import imgPersonal from '@assets/4269841B-8864-46C1-AA6D-32AE947E468A_1784634375287.png';
import imgChannel from '@assets/99C00AB3-C020-4B82-BAE0-1ADDD6765E39_1784634375287.png';
import imgBot from '@assets/49B40F2D-A70D-4761-9A63-3FD792FAAF93_1784634375287.png';
import imgLogo from '@assets/5983DFB3-09D2-48F7-8EDC-A343596CF9F4_1784626560701.png';

const ALL_IMAGES = [imgPersonal, imgChannel, imgBot];

type TabId = 'channel' | 'personal' | 'bot';

interface TabData {
  id: TabId;
  label: string;
  title: string;
  subtitle: string;
  promo?: string;
  price: string;
  originalPrice?: string;
  period: string;
  label2: string;
  monthly: string;
  image: string;
}

const TABS: TabData[] = [
  {
    id: 'channel',
    label: 'Channel',
    title: 'Channel or Group Verification',
    subtitle: 'Verify your Telegram channel or group with an annual plan.',
    promo: 'Special limited-time price',
    price: '$1,500',
    originalPrice: '$2,500',
    period: '1 year',
    label2: 'Channel or group',
    monthly: '$125 / month',
    image: imgChannel,
  },
  {
    id: 'personal',
    label: 'Personal',
    title: 'Personal Profile Verification',
    subtitle: 'Verify your Telegram personal profile with an annual plan.',
    price: '$3,500',
    period: '1 year',
    label2: 'Profile plan',
    monthly: '$291.67 / month',
    image: imgPersonal,
  },
  {
    id: 'bot',
    label: 'Bot',
    title: 'Bot Verification',
    subtitle: 'Verify your Telegram bot with an annual plan.',
    price: '$5,000',
    period: '1 year',
    label2: 'Telegram bot',
    monthly: '$416.67 / month',
    image: imgBot,
  },
];

// Preload all images and resolve when every one has loaded (or failed)
function preloadImages(srcs: string[]): Promise<void> {
  return new Promise((resolve) => {
    let remaining = srcs.length;
    if (remaining === 0) { resolve(); return; }
    srcs.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        remaining -= 1;
        if (remaining === 0) resolve();
      };
      img.src = src;
    });
  });
}

// ── Splash screen ─────────────────────────────────────────────────────────────
function Splash() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#2AABEE]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <motion.img
        src={imgLogo}
        alt="Lux"
        className="w-32 h-32 object-contain"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
      {/* Loading dots */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-white/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('channel');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.setHeaderColor('#2AABEE');
      window.Telegram.WebApp.setBackgroundColor('#ffffff');
    }

    // Preload tab images, then show the app
    preloadImages(ALL_IMAGES).then(() => {
      // Small extra delay so the splash isn't jarring on fast connections
      setTimeout(() => setReady(true), 400);
    });
  }, []);

  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <>
      <AnimatePresence>{!ready && <Splash />}</AnimatePresence>

      <div className="h-[100dvh] overflow-hidden flex flex-col bg-white font-sans select-none">

        {/* ── Tab selector ── */}
        <div className="flex-none bg-[#2AABEE] pt-3 pb-2 px-4 flex justify-center">
          <div className="flex gap-1 bg-[#1a9ad6] rounded-full p-[3px]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-white text-[#1a9ad6] shadow-sm'
                    : 'text-white/90',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Blue image section ── */}
        <div className="flex-[0_0_46%] bg-[#22A7F0] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeTab}
              src={current.image}
              alt={current.title}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full w-full object-contain translate-y-[20px] scale-[1.25]"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* ── White pricing card ── */}
        <div className="flex-1 flex flex-col bg-white rounded-t-3xl -mt-4 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] overflow-hidden px-5 pt-5 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col flex-1"
            >
              {/* Title + subtitle */}
              <h1 className="text-[17px] font-bold text-gray-900 leading-snug">
                {current.title}
              </h1>
              <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">
                {current.subtitle}
              </p>

              {/* Promo badge */}
              {current.promo && (
                <div className="mt-2 inline-flex items-center gap-1 self-start">
                  <span className="text-[11px] font-semibold text-[#e8722a]">
                    🔥 {current.promo}
                  </span>
                </div>
              )}

              {/* Price row */}
              <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-3">
                <div>
                  <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wide">
                    {current.period} · {current.label2}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-[28px] font-extrabold text-gray-900 leading-none">
                      {current.price}
                    </span>
                    {current.originalPrice && (
                      <span className="text-[16px] text-gray-400 line-through">
                        {current.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {current.monthly}
                  </p>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* CTA button */}
              <button
                onClick={() => window.open('https://t.me/li0nchik', '_blank')}
                className="w-full py-3.5 rounded-2xl bg-[#2AABEE] text-white font-bold text-[16px] active:opacity-80 transition-opacity shadow-[0_4px_14px_rgba(42,171,238,0.35)]"
              >
                Buy via Manager
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
