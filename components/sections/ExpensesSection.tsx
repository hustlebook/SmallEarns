import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ReceiptText, Plus, Edit, Trash2, Search, SortAsc, SortDesc, Filter, X, Calendar } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatCurrency } from '../../utils/financeUtils';
import { formatDate, getTodayString } from '../../utils/dateUtils';
import DateFilter from '../Shared/DateFilter';
import { Modal } from '../Shared/Modal';
import { ConfirmDialog } from '../Shared/ConfirmDialog';
import { Button } from '../Shared/Button';

const ExpensesSection = () => {
  const { state, dispatch } = useBusiness();
  const { expenses } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  
  // Helper functions
  const addExpense = (expense) => {
    dispatch({ type: 'ADD_EXPENSE', payload: { ...expense, id: Date.now().toString(), createdAt: new Date().toISOString() } });
  };
  
  const updateExpense = (expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    setEditingExpense(null);
  };
  
  const deleteExpense = (expenseId) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
    setShowDeleteDialog(null);
  };

  // Enhanced expense categories for tax deductions
  const categories = [
    'Office Supplies',
    'Software & Tools', 
    'Travel & Mileage',
    'Professional Services',
    'Marketing & Advertising',
    'Equipment',
    'Phone & Internet',
    'Rent & Utilities',
    'Meals & Entertainment',
    'Other'
  ];

  // Filter and sort expenses
  const filteredAndSortedExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateFrom || dateTo) {
        const expenseDate = new Date(expense.date);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          matchesDateRange = matchesDateRange && expenseDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          matchesDateRange = matchesDateRange && expenseDate <= toDate;
        }
      }
      
      return matchesSearch && matchesCategory && matchesDateRange;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Calculate totals
  const totalExpenses = filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = filteredAndSortedExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate category breakdown
  const categoryTotals = categories.reduce((acc, category) => {
    acc[category] = filteredAndSortedExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return acc;
  }, {});

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <ReceiptText className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Expenses</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-3 sm:py-2 min-h-[44px] rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>
            <ReceiptText className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">This Month</p>
              <p className="text-3xl font-bold">${monthlyExpenses.toFixed(2)}</p>
            </div>
            <ReceiptText className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Expenses by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map(category => (
            <div key={category} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                category === 'Rent' ? 'bg-blue-600' :
                category === 'Supplies' ? 'bg-green-600' :
                category === 'Tools' ? 'bg-purple-600' :
                category === 'Travel' ? 'bg-yellow-600' :
                'bg-gray-600'
              }`}>
                ${Math.round(categoryTotals[category] || 0)}
              </div>
              <p className="text-sm text-gray-400 mt-2">{category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
            />
          </div>
          <div className="md:min-w-[200px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-dropdown w-full px-4 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filter */}

        <DateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClear={() => {
            setDateFrom('');
            setDateTo('');
          }}
        />
      </div>

      {/* Expenses Table */}
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAndSortedExpenses.map((expense) => (
                <motion.tr 
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-700 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-400">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      expense.category === 'Rent' ? 'bg-blue-600 text-white' :
                      expense.category === 'Supplies' ? 'bg-green-600 text-white' :
                      expense.category === 'Tools' ? 'bg-purple-600 text-white' :
                      expense.category === 'Travel' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {expense.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {expense.receiptUrl ? (
                      <a 
                        href={expense.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-500 hover:text-emerald-400 transition-colors duration-200"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-500">No receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8" aria-label="Edit expense">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                        aria-label="Delete expense"
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

      {filteredAndSortedExpenses.length === 0 && (
        <div className="text-center py-12">
          <ReceiptText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm || filterCategory !== 'all' 
              ? 'No expenses found matching your filters.' 
              : 'No expenses recorded yet. Add your first expense!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpensesSection;