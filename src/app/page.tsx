import { getPlayers, getTalents } from '@/lib/server-data';
import PlayerBoard from '@/components/PlayerBoard';
import { parsePlatform } from '@/lib/platform';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams?: { platform?: string | string[] };
}) {
  const initialPlatform = parsePlatform(searchParams?.platform);
  const [players, talents] = await Promise.all([getPlayers(), getTalents()]);
  return (
    <PlayerBoard
      players={players}
      talents={talents}
      initialPlatform={initialPlatform}
    />
  );
}
