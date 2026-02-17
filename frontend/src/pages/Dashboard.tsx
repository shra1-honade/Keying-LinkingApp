import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Target, TrendingUp, Activity, ArrowRight, PlayCircle,
} from 'lucide-react';
import { dashboardApi } from '../lib/api';
import { formatNumber, formatPercentage, getRelativeTime } from '../lib/utils';
import { getMatchRateColor } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PageSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 15000,
  });

  if (isLoading) return <PageSkeleton />;

  if (!stats || stats.total_runs === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-efx-gray-900">Dashboard</h1>
        <EmptyState
          icon={<PlayCircle className="h-12 w-12" />}
          title="Welcome to BizMatch"
          description="Get started by creating your first matching run. Map your data columns to Equifax's reference dataset and discover business matches."
          action={
            <Button variant="primary" onClick={() => navigate('/runs/new')}>
              + New Run
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-efx-gray-900">Dashboard</h1>
          <p className="text-sm text-efx-gray-600 mt-1">Overview of your matching activity</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/runs/new')}>
          + New Run
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-efx-gray-100 rounded-lg">
              <Activity className="h-5 w-5 text-efx-red" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Total Runs</div>
              <div className="text-2xl font-semibold text-efx-gray-900">{formatNumber(stats.total_runs)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Completed</div>
              <div className="text-2xl font-semibold text-efx-gray-900">{formatNumber(stats.completed_runs)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Avg Match Rate</div>
              <div className={`text-2xl font-semibold ${getMatchRateColor(stats.avg_match_rate)}`}>
                {formatPercentage(stats.avg_match_rate)}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Records Matched</div>
              <div className="text-2xl font-semibold text-efx-gray-900">{formatNumber(stats.total_records_matched)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <div className="px-6 py-4 border-b border-efx-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-efx-gray-900">Recent Runs</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/runs')}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="divide-y divide-efx-gray-100">
          {stats.recent_runs.map((run) => (
            <div
              key={run.run_id}
              className="px-6 py-4 flex items-center justify-between hover:bg-efx-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                if (run.status === 'completed') {
                  navigate(`/runs/${run.run_id}/analysis`);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium text-efx-gray-900">
                    {run.config_name || 'Unknown Config'}
                  </div>
                  <div className="text-xs text-efx-gray-400 mt-0.5">
                    {run.run_id.slice(0, 8)}... &bull; {getRelativeTime(run.started_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {run.status === 'completed' && (
                  <span className={`text-sm font-medium ${getMatchRateColor(run.match_rate)}`}>
                    {formatPercentage(run.match_rate)}
                  </span>
                )}
                <Badge status={run.status} pulse={run.status === 'in_progress'} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
