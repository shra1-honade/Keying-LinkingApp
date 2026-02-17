import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, FileSearch } from 'lucide-react';
import { auditApi } from '../lib/api';
import { formatDate } from '../lib/utils';
import Card from '../components/ui/Card';
import { PageSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const EVENT_BADGES: Record<string, { bg: string; text: string }> = {
  run_started: { bg: 'bg-blue-50', text: 'text-blue-700' },
  run_completed: { bg: 'bg-green-50', text: 'text-green-700' },
  run_error: { bg: 'bg-red-50', text: 'text-red-700' },
  config_created: { bg: 'bg-violet-50', text: 'text-violet-700' },
  config_deleted: { bg: 'bg-orange-50', text: 'text-orange-700' },
};

const defaultBadge = { bg: 'bg-efx-gray-100', text: 'text-efx-gray-600' };

export default function AuditLog() {
  const [eventFilter, setEventFilter] = useState<string>('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', eventFilter],
    queryFn: () => auditApi.getAll(eventFilter ? { event_type: eventFilter } : undefined),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-efx-red" />
          <h1 className="text-2xl font-semibold text-efx-gray-900">Audit Log</h1>
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red"
        >
          <option value="">All Events</option>
          <option value="run_started">Run Started</option>
          <option value="run_completed">Run Completed</option>
          <option value="run_error">Run Error</option>
          <option value="config_created">Config Created</option>
          <option value="config_deleted">Config Deleted</option>
        </select>
      </div>

      {/* Log Entries */}
      {!logs || logs.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-12 w-12" />}
          title={eventFilter ? "No matching events" : "No audit events yet"}
          description={
            eventFilter
              ? "No events match the selected filter. Try a different event type."
              : "Audit events will appear here as actions are performed in the system."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-efx-gray-50 border-b border-efx-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider">Run ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-efx-gray-100">
              {logs.map((log) => {
                const badge = EVENT_BADGES[log.event_type] || defaultBadge;
                return (
                  <tr key={log.log_id} className="hover:bg-efx-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-efx-gray-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm whitespace-nowrap">
                      {log.run_id ? (
                        <span className="font-mono text-xs text-efx-gray-700">{log.run_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-efx-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-efx-gray-600">
                      {log.payload ? (
                        <span className="text-xs text-efx-gray-500">
                          {Object.entries(log.payload)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </span>
                      ) : (
                        <span className="text-efx-gray-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
