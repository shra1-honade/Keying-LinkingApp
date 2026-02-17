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
import { Settings, Pencil, Trash2, ArrowUpDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useConfigs, useDeleteConfig, useUpdateConfig } from '../hooks/useConfigs';
import { formatDate } from '../lib/utils';
import type { Config } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import SlideOver from '../components/ui/SlideOver';
import Input from '../components/ui/Input';

const columnHelper = createColumnHelper<Config>();

export default function Configs() {
  const navigate = useNavigate();
  const { data: configs, isLoading } = useConfigs();
  const deleteConfig = useDeleteConfig();
  const updateConfig = useUpdateConfig();

  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [editName, setEditName] = useState('');
  const [editSourceTable, setEditSourceTable] = useState('');

  const filteredConfigs = useMemo(() => {
    if (!configs) return [];
    if (!searchQuery) return configs;
    const q = searchQuery.toLowerCase();
    return configs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.source_table.toLowerCase().includes(q)
    );
  }, [configs, searchQuery]);

  const handleEdit = (config: Config) => {
    setEditingConfig(config);
    setEditName(config.name);
    setEditSourceTable(config.source_table);
  };

  const handleSaveEdit = () => {
    if (!editingConfig) return;
    updateConfig.mutate(
      { configId: editingConfig.config_id, payload: { name: editName, source_table: editSourceTable } },
      {
        onSuccess: () => {
          toast.success('Configuration updated');
          setEditingConfig(null);
        },
        onError: () => toast.error('Failed to update configuration'),
      }
    );
  };

  const handleDelete = (config: Config) => {
    if (!confirm(`Delete "${config.name}"?`)) return;
    deleteConfig.mutate(config.config_id, {
      onSuccess: () => toast.success('Configuration deleted'),
      onError: () => toast.error('Failed to delete configuration'),
    });
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Configuration Name',
        cell: (info) => (
          <div>
            <span className="font-medium text-efx-gray-900">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('source_table', {
        header: 'Source Table',
        cell: (info) => (
          <span className="font-mono text-sm text-efx-gray-600">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('source_type', {
        header: 'Type',
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-efx-gray-100 text-efx-gray-700">
            {info.getValue() || 'sqlite'}
          </span>
        ),
        size: 100,
      }),
      columnHelper.accessor('run_count', {
        header: 'Runs',
        cell: (info) => <span className="text-efx-gray-700">{info.getValue()}</span>,
        size: 80,
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: (info) => <span className="text-efx-gray-600 text-xs">{formatDate(info.getValue())}</span>,
        size: 160,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}
              className="p-1.5 text-efx-gray-400 hover:text-efx-red rounded hover:bg-efx-gray-100 transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }}
              className="p-1.5 text-efx-gray-400 hover:text-efx-red rounded hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
        size: 100,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredConfigs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 border-b border-efx-gray-100">
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-efx-gray-900">Configurations</h1>
          <Button variant="primary" onClick={() => navigate('/runs/new')}>
            + New Config
          </Button>
        </div>
        <EmptyState
          icon={<Settings className="h-12 w-12" />}
          title="No configurations yet"
          description="Create a column mapping configuration to get started with matching."
          action={
            <Button variant="primary" onClick={() => navigate('/runs/new')}>
              Create Configuration
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
        <h1 className="text-2xl font-semibold text-efx-gray-900">Configurations</h1>
        <Button variant="primary" onClick={() => navigate('/runs/new')}>
          + New Config
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-efx-gray-400" />
        <input
          type="text"
          placeholder="Search configurations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 w-full border border-efx-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-efx-red focus:border-transparent"
        />
      </div>

      {/* Table */}
      {filteredConfigs.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No matching configurations"
          description="No configurations match your search. Try a different search term."
          action={
            <Button variant="secondary" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          }
        />
      ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-efx-gray-50 border-b border-efx-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-efx-gray-700 uppercase tracking-wider cursor-pointer select-none"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-efx-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-efx-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-efx-gray-50 transition-colors">
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
      )}

      {/* Edit Slide-over */}
      <SlideOver
        open={!!editingConfig}
        onClose={() => setEditingConfig(null)}
        title="Edit Configuration"
        subtitle={editingConfig?.name}
      >
        {editingConfig && (
          <div className="space-y-6">
            <Input
              label="Configuration Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Source Table"
              value={editSourceTable}
              onChange={(e) => setEditSourceTable(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-efx-gray-700 mb-2">
                Column Mapping
              </label>
              <div className="bg-efx-gray-50 rounded-lg p-4 space-y-2">
                {Object.entries(editingConfig.column_mapping).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-efx-gray-600">{key}</span>
                    <span className="font-mono text-efx-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSaveEdit}
                isLoading={updateConfig.isPending}
              >
                Save Changes
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setEditingConfig(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
