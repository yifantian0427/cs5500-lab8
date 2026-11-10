import { useEffect, useState } from 'react';
import {
  errorMessage,
  fetchResources,
  type Resource,
  type ResourceType,
} from '../api/campushubApi';
interface ResourceListProps {
  onSelect: (resource: Resource) => void;
}
const labels: Record<ResourceType, string> = {
  ROOM: 'Study room',
  EQUIPMENT: 'Equipment',
  LAB: 'Lab',
};
export function ResourceList({ onSelect }: ResourceListProps) {
  const [type, setType] = useState<ResourceType | ''>('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setIsLoading(true);
    setError('');
    setResources([]);
    fetchResources(type || undefined)
      .then((data) => {
        if (current) setResources(data);
      })
      .catch((e: unknown) => {
        if (current) setError(errorMessage(e));
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [type, retry]);
  return (
    <section aria-labelledby="directory-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FIND YOUR SPACE</p>
          <h2 id="directory-title">Campus, at your fingertips.</h2>
        </div>
        <span className="muted">Rooms. Tools. Possibilities.</span>
      </div>
      <div className="filters" aria-label="Filter by resource type">
        {(['', 'ROOM', 'EQUIPMENT', 'LAB'] as const).map((value) => (
          <button
            key={value}
            aria-pressed={type === value}
            onClick={() => setType(value)}
          >
            {value === 'EQUIPMENT'
              ? 'Equipment'
              : value
                ? labels[value] + 's'
                : 'All resources'}
          </button>
        ))}
      </div>
      {isLoading && (
        <p role="status" className="empty">
          Finding campus resources…
        </p>
      )}
      {error && (
        <div role="alert" className="error">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </div>
      )}
      {!isLoading && !error && resources.length === 0 && (
        <p className="empty">No resources match this filter.</p>
      )}
      <div className="resource-grid">
        {resources.map((resource) => (
          <article className="resource-card" key={resource.id}>
            <div className={'card-art ' + resource.type.toLowerCase()}>
              <span aria-hidden="true">
                {resource.type === 'ROOM'
                  ? '▦'
                  : resource.type === 'LAB'
                    ? '⚗'
                    : '◉'}
              </span>
              <span className="type-tag">{labels[resource.type]}</span>
            </div>
            <div className="card-body">
              <div className="availability">
                <i
                  className={resource.isAvailable ? 'dot' : 'dot unavailable'}
                />
                {resource.isAvailable ? 'Open for booking' : 'Unavailable'}
              </div>
              <h3>{resource.name}</h3>
              <p className="muted">↗ {resource.location}</p>
              <button
                className="book-button"
                disabled={!resource.isAvailable}
                onClick={() => onSelect(resource)}
              >
                Reserve resource <span aria-hidden="true">↗</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
