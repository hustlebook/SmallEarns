import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit, Trash2, Search, SortAsc, SortDesc, Wallet, X, Calendar } from 'lucide-react';
import { useSortable } from '../../hooks/useSortable';
import { calculateTotalIncome, calculateMonthlyIncome } from '../../utils/financeCalculations';
import { primaryButton, secondaryButton, inputBase, selectBase } from '../../lib/styles';

// Add ExportModal component (reusable)
const ExportModal = ({ isOpen, onClose, onExport, sectionName }) => {
  const [option, setOption] = useState('csv');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl border border-emerald-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Export {sectionName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors" aria-label="Close modal">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Export as:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="exportType" value="csv" checked={option === 'csv'} onChange={() => setOption('csv')} />
                <span>CSV (spreadsheet)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="exportType" value="pdf" checked={option === 'pdf'} onChange={() => setOption('pdf')} />
                <span>PDF (print-optimized)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="exportType" value="print" checked={option === 'print'} onChange={() => setOption('print')} />
                <span>Print</span>
              </label>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-900 rounded p-2">
            Export will include only currently filtered results.
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
            <button onClick={() => onExport(option)} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">Export</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IncomeSection = ({ incomeEntries, clients, addIncome, updateIncome, deleteIncome }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter income entries  
  const filteredIncome = incomeEntries.filter(entry => {
    const matchesSearch = entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || entry.method === filterMethod;
    
    // Date range filtering
    let matchesDateRange = true;
    if (dateFrom || dateTo) {
      const entryDate = new Date(entry.date);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        matchesDateRange = matchesDateRange && entryDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        matchesDateRange = matchesDateRange && entryDate <= toDate;
      }
    }
    
    return matchesSearch && matchesMethod && matchesDateRange;
  });

  // Use sortable hook
  const { sortedData: filteredAndSortedIncome, sortField, sortDirection, toggleSort } = useSortable(filteredIncome, 'date', 'desc');

  // Calculate totals using utility functions
  const totalIncome = calculateTotalIncome(filteredAndSortedIncome);
  const monthlyIncome = calculateMonthlyIncome(filteredAndSortedIncome);

  // Get unique payment methods
  const paymentMethods = [...new Set(incomeEntries.map(entry => entry.method))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Income</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-3 sm:py-2 min-h-[44px] rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income</span>
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200 flex items-center space-x-2"
          title="Export filtered income"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
          <span>Export</span>
        </button>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={(type) => { setShowExportModal(false); /* TODO: implement export logic */ }} sectionName="Income" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-2 sm:p-3 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Total Income</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">${totalIncome.toFixed(2)}</p>
            </div>
            <Wallet className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 sm:p-3 md:p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">This Month</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">${monthlyIncome.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search income entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
            />
          </div>
          <div className="md:min-w-[200px]">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="filter-dropdown w-full px-4 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 cursor-pointer"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center space-x-2 text-gray-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Date Range:</span>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white rounded-lg transition-colors duration-200"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Clear</span>
              </button>
            )}
          </div>
          {(dateFrom || dateTo) && (
            <div className="text-xs text-emerald-400">
              Showing {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 
                      dateFrom ? `from ${dateFrom}` : 
                      dateTo ? `up to ${dateTo}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Amount</span>
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAndSortedIncome.map((entry) => (
                <motion.tr 
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400">
                    ${entry.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      entry.method === 'Cash' ? 'bg-green-600 text-white' :
                      entry.method === 'Bank Transfer' ? 'bg-blue-600 text-white' :
                      entry.method === 'PayPal' ? 'bg-indigo-600 text-white' :
                      entry.method === 'Venmo' ? 'bg-purple-600 text-white' :
                      entry.method === 'Zelle' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {entry.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {entry.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8" aria-label="Edit income">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteIncome(entry.id)}
                        className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                        aria-label="Delete income"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedIncome.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm || filterMethod !== 'all' 
              ? 'No income entries found matching your filters.' 
              : 'No income recorded yet. Add your first income entry!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default IncomeSection;