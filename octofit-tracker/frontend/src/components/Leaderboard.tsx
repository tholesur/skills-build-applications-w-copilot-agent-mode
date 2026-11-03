import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadLeaderboard = () => getJson<{ leaderboard: Record<string, unknown>[] }>('/api/leaderboard');

export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." loadRecords={loadLeaderboard} collectionKey="leaderboard" emptyMessage="No leaderboard entries yet." />;
}
