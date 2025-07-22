import React from 'react';
import { X, Calendar } from 'lucide-react';

interface DateFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClear: () => void;
  label?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  label = "Date Range"
}) => {
  const handleDateChange = (type: 'start' | 'end') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    if (type === 'start') {
      onDateFromChange(value);
    } else {
      onDateToChange(value);
    }
  };

  const hasAnyDate = dateFrom || dateTo;

  return (
    <div className="date-filter-mobile p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-2 text-gray-300 mb-3">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">{label}:</span>
      </div>
      
      <div className="date-inputs-row flex gap-3 mb-3">
        <div className="date-input-group flex-1">
          <label htmlFor="start-date" className="block text-xs text-gray-400 mb-1">
            From
          </label>
          <input
            id="start-date"
            type="date"
            value={dateFrom}
            onChange={handleDateChange('start')}
            aria-label="Start date"
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:ring-emerald-600 focus:border-emerald-600 text-sm"
            style={{ 
              minHeight: '40px', // iOS touch target
              fontSize: '16px' // Prevent iOS zoom
            }}
          />
        </div>

        <div className="date-input-group flex-1">
          <label htmlFor="end-date" className="block text-xs text-gray-400 mb-1">
            To
          </label>
          <input
            id="end-date"
            type="date"
            value={dateTo}
            onChange={handleDateChange('end')}
            aria-label="End date"
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:ring-emerald-600 focus:border-emerald-600 text-sm"
            style={{ 
              minHeight: '40px', // iOS touch target
              fontSize: '16px' // Prevent iOS zoom
            }}
          />
        </div>
      </div>

      {hasAnyDate && (
        <div className="flex justify-center">
          <button
            onClick={onClear}
            className="clear-dates-button flex items-center space-x-1 px-3 py-2 bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white rounded-lg transition-colors duration-200"
            aria-label="Clear date selection"
            style={{ minHeight: '40px' }} // iOS touch target
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear Dates</span>
          </button>
        </div>
      )}

      {hasAnyDate && (
        <div className="text-xs text-emerald-400 mt-2 text-center">
          Showing {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 
                   dateFrom ? `from ${dateFrom}` : 
                   dateTo ? `up to ${dateTo}` : ''}
        </div>
      )}
    </div>
  );
};

export default DateFilter;