import { useQuery } from '@tanstack/react-query';
import { datasourceApi } from '../lib/api';

export function useTables(sourceType: string = 'sqlite') {
  return useQuery({
    queryKey: ['datasource', 'tables', sourceType],
    queryFn: () => datasourceApi.getTables(sourceType),
    select: (data) => data.tables,
  });
}

export function useTableColumns(table: string | undefined, sourceType: string = 'sqlite') {
  return useQuery({
    queryKey: ['datasource', 'columns', table, sourceType],
    queryFn: () => datasourceApi.getColumns(table!, sourceType),
    enabled: !!table,
    select: (data) => data.columns,
  });
}
