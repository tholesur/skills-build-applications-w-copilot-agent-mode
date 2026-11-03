import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadSuggestions = () => getJson<{ suggestions: Record<string, unknown>[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);

export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loadRecords={loadSuggestions} collectionKey="suggestions" emptyMessage="No workout suggestions yet." />;
}
