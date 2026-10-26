import { getTalents } from '@/lib/server-data';
import TalentsView from '@/components/TalentsView';
import { parsePlatform } from '@/lib/platform';

export const dynamic = 'force-dynamic';

export default async function TalentsPage({
  searchParams,
}: {
  searchParams?: { platform?: string | string[] };
}) {
  const initialPlatform = parsePlatform(searchParams?.platform);
  const talents = await getTalents();
  return <TalentsView talents={talents} initialPlatform={initialPlatform} />;
}
