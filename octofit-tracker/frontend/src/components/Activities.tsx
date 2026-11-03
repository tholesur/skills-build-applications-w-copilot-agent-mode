import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadActivities = () => getJson<{ activities: Record<string, unknown>[] }>('/api/activities');

export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." loadRecords={loadActivities} collectionKey="activities" emptyMessage="No activities yet." />;
}
