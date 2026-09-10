import { getPlayers, getTalents } from '@/lib/server-data';
import PlayerBoard from '@/components/PlayerBoard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [players, talents] = await Promise.all([getPlayers(), getTalents()]);
  return <PlayerBoard players={players} talents={talents} />;
}
