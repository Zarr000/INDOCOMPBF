'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import TierSection from '@/components/TierSection';
import FruitFilter, { FruitFilterValue } from '@/components/FruitFilter';
import TierFilter, { TierFilterValue } from '@/components/TierFilter';
import ProtestSection from '@/components/ProtestSection';
import PlatformTabs from '@/components/PlatformTabs';
import Footer from '@/components/Footer';
import { groupPlayersByTier, getTierOrder, getTierDisplayName } from '@/lib/groupPlayers';
import { Player } from '@/types/player';
import { Talent } from '@/types/talent';
import { PLATFORM_LABEL, syncPlatformToUrl, type Platform } from '@/lib/platform';

export default function PlayerBoard({
  players,
  talents,
  initialPlatform,
}: {
  players: Player[];
  talents: Talent[];
  initialPlatform: Platform;
}) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [activeFruit, setActiveFruit] = useState<FruitFilterValue>('ALL');
  const [activeTier, setActiveTier] = useState<TierFilterValue>('ALL');

  const handlePlatformChange = (next: Platform) => {
    setPlatform(next);
    syncPlatformToUrl(next);
  };

  const platformPlayers = useMemo(
    () => players.filter((p) => p.platform === platform),
    [players, platform]
  );

  const platformTalents = useMemo(
    () => talents.filter((t) => t.platform === platform),
    [talents, platform]
  );

  const playerTalents = useMemo(() => {
    const map: Record<string, string[]> = {};
    platformTalents.forEach((t) => {
      if (t.holder_id) {
        if (!map[t.holder_id]) map[t.holder_id] = [];
        map[t.holder_id].push(t.name);
      }
    });
    return map;
  }, [platformTalents]);

  const groupedPlayers = useMemo(() => {
    return groupPlayersByTier(platformPlayers);
  }, [platformPlayers]);

  const tierOrder = getTierOrder();

  const filteredGroups = useMemo(() => {
    const result: Record<string, Player[]> = {};

    tierOrder.forEach((tier) => {
      let tierPlayers = groupedPlayers[tier] ?? [];

      if (activeFruit !== 'ALL') {
        const fruitKey = activeFruit.toLowerCase();
        tierPlayers = tierPlayers.filter(
          (p) => typeof p.fruit === 'string' && p.fruit.toLowerCase() === fruitKey
        );
      }

      if (activeTier !== 'ALL' && tier !== activeTier) {
        tierPlayers = [];
      }

      result[tier] = tierPlayers;
    });

    return result as typeof groupedPlayers;
  }, [activeFruit, activeTier, groupedPlayers, tierOrder]);

  const filterKey = `${platform}-${activeFruit}-${activeTier}`;

  return (
    <main className="min-h-screen bg-black relative">
      <Hero />

      <PlatformTabs active={platform} onChange={handlePlatformChange} />

      <FruitFilter active={activeFruit} onChange={setActiveFruit} />

      <TierFilter active={activeTier} onChange={setActiveTier} />

      <motion.div
        id="tiers"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={filterKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {platformPlayers.length === 0 && (
              <p className="px-5 pb-24 text-center font-rajdhani text-sm uppercase tracking-[0.2em] text-white/30">
                No players ranked on {PLATFORM_LABEL[platform]} yet.
              </p>
            )}

            {tierOrder.map((tier, index) => (
              <TierSection
                key={tier}
                tier={tier}
                displayName={getTierDisplayName(tier)}
                players={filteredGroups[tier] ?? []}
                playerTalents={playerTalents}
                index={index}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        id="protest"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ProtestSection />
      </motion.div>

      <Footer />
    </main>
  );
}
