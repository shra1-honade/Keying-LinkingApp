import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from 'recharts';
import {
  ArrowLeft, Download, ChevronDown, ChevronRight,
  Search, BarChart3, Users, Target, TrendingUp, FileSearch,
} from 'lucide-react';
import { useRun, useRunResults } from '../hooks/useRuns';
import { runsApi } from '../lib/api';
import { formatDate, formatPercentage, formatNumber, downloadCSV } from '../lib/utils';
import { CONFIDENCE_LABELS, CONFIDENCE_COLORS, type MatchResult } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const columnHelper = createColumnHelper<MatchResult>();

const CONFIDENCE_BG: Record<number, string> = {
  5: 'bg-emerald-50 text-emerald-700',
  4: 'bg-blue-50 text-blue-700',
  3: 'bg-violet-50 text-violet-700',
  2: 'bg-amber-50 text-amber-700',
  1: 'bg-orange-50 text-orange-700',
  0: 'bg-red-50 text-red-700',
};

export default function Analysis() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const { data: run, isLoading: runLoading } = useRun(runId);
  const { data: results, isLoading: resultsLoading } = useRunResults(runId, {
    page,
    page_size: 25,
    min_score: minScore,
    search: searchQuery || undefined,
    show_unmatched: showUnmatched,
  });

  const handleDownload = async () => {
    if (!runId) return;
    const data = await runsApi.download(runId);
    downloadCSV(data.filename, data.content);
  };

  // Chart data - distribution of confidence scores
  const chartData = useMemo(() => {
    if (!results?.results) return [];
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    results.results.forEach((r) => {
      counts[r.confidence_score] = (counts[r.confidence_score] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([score, count]) => ({
        name: CONFIDENCE_LABELS[Number(score)],
        value: count,
        score: Number(score),
      }))
      .filter((d) => d.value > 0)
      .reverse();
  }, [results]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'expander',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); row.toggleExpanded(); }}
            className="p-1 hover:bg-efx-gray-100 rounded"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4 text-efx-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-efx-gray-400" />
            )}
          </button>
        ),
        size: 40,
      }),
      columnHelper.accessor('client_id', {
        header: 'Client ID',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
        size: 160,
      }),
      columnHelper.accessor('input_business_name', {
        header: 'Input Business',
        cell: (info) => <span className="font-medium text-efx-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('matched_efx_business', {
        header: 'Matched EFX Business',
        cell: (info) => (
          <span className="text-efx-gray-700">{info.getValue() || '\u2014'}</span>
        ),
      }),
      columnHelper.accessor('confidence_score', {
        header: 'Confidence',
        cell: (info) => {
          const score = info.getValue();
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_BG[score]}`}>
              {score}/5 {CONFIDENCE_LABELS[score]}
            </span>
          );
        },
        size: 180,
      }),
      columnHelper.accessor('name_similarity', {
        header: 'Name %',
        cell: (info) => {
          const val = info.getValue();
          return <span className="text-efx-gray-600">{val ? `${val.toFixed(0)}%` : '\u2014'}</span>;
        },
        size: 80,
      }),
      columnHelper.accessor('flagged_for_review', {
        header: 'Flag',
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700" title="Flagged for review">
              Review
            </span>
          ) : null,
        size: 70,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: results?.results || [],
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  if (runLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12">
        <p className="text-efx-gray-600">Run not found.</p>
        <Button variant="secondary" onClick={() => navigate('/runs')} className="mt-4">
          Back to Runs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/runs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-efx-gray-900">
                Run Analysis
              </h1>
              <Badge status={run.status} pulse={run.status === 'in_progress'} />
            </div>
            <p className="text-sm text-efx-gray-600 mt-0.5">
              {run.config_name} &bull; {formatDate(run.started_at)}
              {run.duration_seconds && ` \u2022 ${run.duration_seconds.toFixed(1)}s`}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-efx-gray-100 rounded-lg">
              <Users className="h-5 w-5 text-efx-gray-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Total Input</div>
              <div className="text-2xl font-semibold text-efx-gray-900">{formatNumber(run.input_count)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Matched</div>
              <div className="text-2xl font-semibold text-efx-gray-900">{formatNumber(run.matched_count)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Match Rate</div>
              <div className="text-2xl font-semibold text-green-600">{formatPercentage(run.match_rate)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-xs text-efx-gray-600">Avg Confidence</div>
              <div className="text-2xl font-semibold text-efx-gray-900">
                {run.avg_confidence?.toFixed(1) ?? '\u2014'}/5
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart + Filters Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Donut Chart */}
        <Card className="p-6 col-span-1">
          <h3 className="text-sm font-medium text-efx-gray-900 mb-4">Score Distribution</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={CONFIDENCE_COLORS[entry.score]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-efx-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-efx-gray-400 text-sm">
              No data available
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="p-6 col-span-2">
          <h3 className="text-sm font-medium text-efx-gray-900 mb-4">Filter Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-efx-gray-600 mb-1">Min Confidence</label>
              <select
                value={minScore ?? ''}
                onChange={(e) => {
                  setMinScore(e.target.value ? Number(e.target.value) : undefined);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red"
              >
                <option value="">All Scores</option>
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>{s} - {CONFIDENCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-efx-gray-600 mb-1">Search Business</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-efx-gray-400" />
                <input
                  type="text"
                  placeholder="Business name..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-2 border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red"
                />
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-efx-gray-700 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={showUnmatched}
                  onChange={(e) => { setShowUnmatched(e.target.checked); setPage(1); }}
                  className="rounded border-efx-gray-300 text-efx-red focus:ring-efx-red"
                />
                Show unmatched only
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-efx-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-efx-gray-900">Match Results</h2>
          {results && (
            <span className="text-sm text-efx-gray-600">
              {formatNumber(results.total)} results
            </span>
          )}
        </div>

        {resultsLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : results?.results.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<FileSearch className="h-12 w-12" />}
              title="No results found"
              description={
                searchQuery || minScore !== undefined || showUnmatched
                  ? "No match results found for your current filters. Try adjusting your search criteria."
                  : "This run has no match results yet. Results will appear once the run completes."
              }
              action={
                (searchQuery || minScore !== undefined || showUnmatched) ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setMinScore(undefined);
                      setShowUnmatched(false);
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-efx-gray-50 border-b border-efx-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider"
                          style={{ width: header.getSize() }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-efx-gray-100">
                  {table.getRowModel().rows.map((row) => (
                    <>
                      <tr
                        key={row.id}
                        className="hover:bg-efx-gray-50 cursor-pointer transition-colors"
                        onClick={() => row.toggleExpanded()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-3 whitespace-nowrap text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr key={`${row.id}-expanded`}>
                          <td colSpan={columns.length} className="px-6 py-4 bg-efx-gray-50">
                            <div className="grid grid-cols-2 gap-6">
                              {/* Input Data */}
                              <div>
                                <h4 className="text-xs font-medium text-efx-gray-600 uppercase mb-2">Input Data</h4>
                                <div className="space-y-1.5 text-sm">
                                  <div><span className="text-efx-gray-500">Business:</span> <span className="text-efx-gray-900 font-medium">{row.original.input_business_name}</span></div>
                                  <div><span className="text-efx-gray-500">Address:</span> <span className="text-efx-gray-900">{row.original.input_address || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">City:</span> <span className="text-efx-gray-900">{row.original.input_city || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">State:</span> <span className="text-efx-gray-900">{row.original.input_state || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">Zip:</span> <span className="text-efx-gray-900">{row.original.input_zip || '\u2014'}</span></div>
                                </div>
                              </div>
                              {/* Matched Data */}
                              <div>
                                <h4 className="text-xs font-medium text-efx-gray-600 uppercase mb-2">Matched EFX Record</h4>
                                <div className="space-y-1.5 text-sm">
                                  <div><span className="text-efx-gray-500">Business:</span> <span className="text-efx-gray-900 font-medium">{row.original.matched_efx_business || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">EFX ID:</span> <span className="font-mono text-efx-gray-900">{row.original.efx_id || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">Address:</span> <span className="text-efx-gray-900">{row.original.efx_address || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">City/State:</span> <span className="text-efx-gray-900">{row.original.efx_city || '\u2014'}, {row.original.efx_state || '\u2014'}</span></div>
                                  <div><span className="text-efx-gray-500">Zip:</span> <span className="text-efx-gray-900">{row.original.efx_zip || '\u2014'}</span></div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-efx-gray-200 text-sm text-efx-gray-600">
                              <span className="font-medium">Match Reason:</span> {row.original.match_reason || 'N/A'}
                              {row.original.address_similarity != null && (
                                <span className="ml-4">| Address Similarity: {row.original.address_similarity.toFixed(0)}%</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {results && results.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-efx-gray-200 flex items-center justify-between">
                <div className="text-sm text-efx-gray-600">
                  Page {results.page} of {results.total_pages} ({formatNumber(results.total)} results)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= (results.total_pages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
