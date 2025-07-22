import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

/**
 * Generic sortable hook for consistent sorting behavior across components
 * Provides centralized sort logic to eliminate duplication
 */
export const useSortable = <T extends Record<string, any>>(
  data: T[],
  defaultSortField?: keyof T,
  defaultSortDirection: SortDirection = 'desc'
) => {
  const [sortField, setSortField] = useState<keyof T | null>(defaultSortField || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      let comparison = 0;
      
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const toggleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    toggleSort
  };
};