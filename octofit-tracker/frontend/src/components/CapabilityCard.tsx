import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiRecord = Record<string, unknown>;
type Props = {
  title: string;
  description: string;
  endpoint: string;
  collectionKey: string;
  emptyMessage: string;
};

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '');
}

export function CapabilityCard({ title, description, endpoint, collectionKey, emptyMessage }: Props) {
  const [records, setRecords] = useState<ApiRecord[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setRecords(null);
    setHasError(false);

    getJson<Record<string, ApiRecord[]>>(endpoint)
      .then((response) => {
        if (active) setRecords(Array.isArray(response[collectionKey]) ? response[collectionKey] : []);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [collectionKey, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {records === null && !hasError && <p role="status">Loading {title.toLowerCase()}...</p>}
        {hasError && <p role="alert">Unable to load {title.toLowerCase()}.</p>}
        {records?.length === 0 && <p>{emptyMessage}</p>}
        {records && records.length > 0 && (
          <ul className="list-group">
            {records.map((record, index) => (
              <li className="list-group-item" key={String(record._id ?? index)}>
                {Object.entries(record)
                  .filter(([key]) => key !== '_id' && key !== '__v')
                  .map(([key, value]) => (
                    <span className="me-3" key={key}>
                      <strong>{key.replace(/([A-Z])/g, ' $1')}:</strong> {displayValue(value)}
                    </span>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
