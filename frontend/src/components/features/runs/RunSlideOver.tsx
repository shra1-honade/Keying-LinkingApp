import { useState } from 'react';
import { BarChart3, CheckCircle, AlertTriangle, Hash, Trash2 } from 'lucide-react';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import { formatDate, formatDuration, formatPercentage, formatNumber } from '../../../lib/utils';
import { type Run } from '../../../types';

interface RunSlideOverProps {
  run: Run;
  onViewAnalysis: () => void;
  onDelete?: (runId: string) => void;
  isDeleting?: boolean;
}

export default function RunSlideOver({ run, onViewAnalysis, onDelete, isDeleting }: RunSlideOverProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge status={run.status} pulse={run.status === 'in_progress'} />
        {run.status === 'completed' && (
          <Button variant="primary" size="sm" onClick={onViewAnalysis}>
            View Analysis
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          icon={<Hash className="h-4 w-4 text-efx-red" />}
          label="Input Records"
          value={formatNumber(run.input_count)}
        />
        <MetricCard
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          label="Matched"
          value={formatNumber(run.matched_count)}
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4 text-efx-red" />}
          label="Match Rate"
          value={formatPercentage(run.match_rate)}
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4 text-teal-600" />}
          label="Avg Confidence"
          value={run.avg_confidence ? run.avg_confidence.toFixed(1) : '\u2014'}
        />
      </div>

      {/* Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-efx-gray-900">Details</h4>
        <div className="bg-efx-gray-50 rounded-lg p-4 space-y-3">
          <DetailRow label="Run ID" value={run.run_id} mono />
          <DetailRow label="Config" value={run.config_name || 'Unknown'} />
          <DetailRow label="Started" value={formatDate(run.started_at)} />
          <DetailRow
            label="Duration"
            value={
              run.duration_seconds
                ? `${run.duration_seconds.toFixed(1)}s`
                : run.completed_at
                  ? formatDuration(run.started_at, run.completed_at)
                  : 'In progress...'
            }
          />
          {run.error_message && (
            <div className="pt-2 border-t border-efx-gray-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-red-600">Error</div>
                  <div className="text-sm text-red-700 mt-0.5">{run.error_message}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-efx-gray-200 space-y-3">
        {run.status === 'completed' && (
          <Button variant="primary" className="w-full" onClick={onViewAnalysis}>
            View Full Analysis
          </Button>
        )}

        {onDelete && (
          confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                Are you sure? This will permanently delete this run and all its match results.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => onDelete(run.run_id)}
                  isLoading={isDeleting}
                >
                  Delete Run
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Run
            </Button>
          )
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-efx-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-efx-gray-400">{label}</span>
      </div>
      <div className="text-lg font-semibold text-efx-gray-900">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-efx-gray-400">{label}</span>
      <span className={`text-efx-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
