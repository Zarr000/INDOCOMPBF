import { getTalents } from '@/lib/server-data';
import TalentsView from '@/components/TalentsView';

export const dynamic = 'force-dynamic';

export default async function TalentsPage() {
  const talents = await getTalents();
  return <TalentsView talents={talents} />;
}
