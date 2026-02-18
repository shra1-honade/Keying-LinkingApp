import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { Search, FileSearch, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useRuns, useDeleteRun } from '../hooks/useRuns';
import { formatDate, formatPercentage, formatNumber } from '../lib/utils';
import { getMatchRateColor, type Run } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SlideOver from '../components/ui/SlideOver';
import RunSlideOver from '../components/features/runs/RunSlideOver';

const statusTabs: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Error', value: 'error' },
];

const columnHelper = createColumnHelper<Run>();

const columns = [
  columnHelper.accessor('run_id', {
    header: 'Run ID',
    cell: (info) => (
      <span className="font-mono text-xs text-efx-gray-700">
        {info.getValue().slice(0, 8)}...
      </span>
    ),
  }),
  columnHelper.accessor('config_name', {
    header: 'Configuration',
    cell: (info) => (
      <span className="font-medium text-efx-gray-900">
        {info.getValue() || 'Unknown Config'}
      </span>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <Badge status={info.getValue()} pulse={info.getValue() === 'in_progress'} />,
  }),
  columnHelper.accessor('input_count', {
    header: 'Records',
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor('match_rate', {
    header: 'Match Rate',
    cell: (info) => (
      <span className={`font-medium ${getMatchRateColor(info.getValue())}`}>
        {formatPercentage(info.getValue())}
      </span>
    ),
  }),
  columnHelper.accessor('avg_confidence', {
    header: 'Avg Score',
    cell: (info) => {
      const val = info.getValue();
      return val ? val.toFixed(1) : '—';
    },
  }),
  columnHelper.accessor('started_at', {
    header: 'Started',
    cell: (info) => (
      <span className="text-efx-gray-400 text-sm">{formatDate(info.getValue())}</span>
    ),
  }),
  columnHelper.accessor('completed_at', {
    header: 'End Time',
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <span className="text-efx-gray-400 text-sm">{formatDate(val)}</span>
      ) : (
        <span className="text-efx-gray-300 text-sm">—</span>
      );
    },
  }),
];

export default function Runs() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'started_at', desc: true }]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const { data: runs, isLoading, error } = useRuns(statusFilter);
  const deleteRun = useDeleteRun();

  const filteredData = useMemo(() => {
    const data = runs ?? [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (run) =>
        run.run_id.toLowerCase().includes(q) ||
        (run.config_name || '').toLowerCase().includes(q)
    );
  }, [runs, search]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Render table content based on state — tabs always stay visible above
  function renderTableContent() {
    if (error) {
      return (
        <Card className="p-6">
          <div className="text-center text-red-600">
            Error loading runs. Please check if the backend server is running.
          </div>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card className="p-12">
          <div className="flex items-center justify-center gap-2 text-efx-gray-400 text-sm">
            <div className="h-4 w-4 border-2 border-efx-gray-300 border-t-efx-red rounded-full animate-spin" />
            Loading runs...
          </div>
        </Card>
      );
    }

    if (filteredData.length === 0) {
      return (
        <EmptyState
          icon={<FileSearch className="h-12 w-12" />}
          title={search || statusFilter ? "No matching runs" : "No runs yet"}
          description={
            search || statusFilter
              ? "No runs match your current filters. Try adjusting your search or status filter."
              : "Start your first matching job to see results here."
          }
          action={
            search || statusFilter ? (
              <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter(undefined); }}>
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/runs/new')}>
                + New Run
              </Button>
            )
          }
        />
      );
    }

    return (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-efx-gray-50 border-b border-efx-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider cursor-pointer hover:bg-efx-gray-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-3 w-3" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-3 w-3" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-efx-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    const run = row.original;
                    if (run.status === 'completed') {
                      navigate(`/runs/${run.run_id}/analysis`);
                    } else {
                      setSelectedRun(run);
                    }
                  }}
                  className="hover:bg-efx-gray-50 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-efx-gray-900">My Runs</h1>
        <Button variant="primary" onClick={() => navigate('/runs/new')}>
          + New Run
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex bg-efx-gray-100 rounded-lg p-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-efx-red shadow-sm'
                  : 'text-efx-gray-400 hover:text-efx-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-efx-gray-400" />
          <input
            type="text"
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-efx-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-efx-red w-64"
          />
        </div>
      </div>

      {/* Table Content */}
      {renderTableContent()}

      {/* Slide-over Panel */}
      <SlideOver
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title={selectedRun ? `Run ${selectedRun.run_id.slice(0, 8)}...` : ''}
        subtitle={selectedRun?.config_name}
      >
        {selectedRun && (
          <RunSlideOver
            run={selectedRun}
            onViewAnalysis={() => {
              navigate(`/runs/${selectedRun.run_id}/analysis`);
              setSelectedRun(null);
            }}
            onDelete={(runId) => {
              deleteRun.mutate(runId, {
                onSuccess: () => {
                  toast.success('Run deleted');
                  setSelectedRun(null);
                },
                onError: () => toast.error('Failed to delete run'),
              });
            }}
            isDeleting={deleteRun.isPending}
          />
        )}
      </SlideOver>
    </div>
  );
}
