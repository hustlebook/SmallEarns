import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Edit, Trash2, TrendingUp, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { generateId } from '../utils/idGenerator';

const BusinessGoals = ({ clients, appointments, incomeEntries, expenses }) => {
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('smallearns_business_goals');
    if (stored) {
      setGoals(JSON.parse(stored));
    }
    // Start with empty goals - user will create their own
  }, []);

  // Save goals to localStorage
  useEffect(() => {
    localStorage.setItem('smallearns_business_goals', JSON.stringify(goals));
  }, [goals]);

  // Calculate goal progress
  const calculateProgress = (goal) => {
    const now = new Date();
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    
    let current = 0;
    
    switch (goal.type) {
      case 'revenue':
        current = incomeEntries
          .filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
          })
          .reduce((sum, entry) => sum + entry.amount, 0);
        break;
        
      case 'clients':
        // Count unique clients with appointments in the period
        const clientIds = new Set(
          appointments
            .filter(apt => {
              const aptDate = new Date(apt.date);
              return aptDate >= startDate && aptDate <= endDate;
            })
            .map(apt => apt.clientId)
        );
        current = clientIds.size;
        break;
        
      case 'appointments':
        current = appointments
          .filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= startDate && aptDate <= endDate && apt.status === 'completed';
          }).length;
        break;
        
      case 'expenses':
        current = expenses
          .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
          })
          .reduce((sum, expense) => sum + expense.amount, 0);
        break;
        
      default:
        current = 0;
    }
    
    const percentage = Math.min((current / goal.target) * 100, 100);
    const timeElapsed = ((now - startDate) / (endDate - startDate)) * 100;
    
    return {
      current,
      percentage,
      timeElapsed: Math.min(timeElapsed, 100),
      isCompleted: current >= goal.target,
      isOverdue: now > endDate && current < goal.target,
      daysLeft: Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
    };
  };

  const addGoal = (goalData) => {
    const newGoal = {
      ...goalData,
      id: generateId(),
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setGoals(prev => [...prev, newGoal]);
    setShowAddModal(false);
  };

  const updateGoal = (updatedGoal) => {
    setGoals(prev =>
      prev.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal)
    );
    setEditingGoal(null);
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const toggleGoalStatus = (id) => {
    setGoals(prev =>
      prev.map(goal => 
        goal.id === id 
          ? { ...goal, isActive: !goal.isActive }
          : goal
      )
    );
  };

  // Group goals by status
  const activeGoals = goals.filter(goal => goal.isActive);
  const completedGoals = goals.filter(goal => {
    const progress = calculateProgress(goal);
    return progress.isCompleted;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Business Goals</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Goals</p>
              <p className="text-3xl font-bold">{activeGoals.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Completed</p>
              <p className="text-3xl font-bold">{completedGoals.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Completion Rate</p>
              <p className="text-3xl font-bold">
                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Active Goals</h3>
        <div className="space-y-4">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(goal);
            const getStatusColor = () => {
              if (progress.isCompleted) return 'emerald';
              if (progress.isOverdue) return 'red';
              if (progress.percentage < progress.timeElapsed) return 'yellow';
              return 'blue';
            };
            const statusColor = getStatusColor();
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 p-6 rounded-lg border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-100 mb-2">
                      {goal.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-3">
                      {goal.description}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="text-emerald-500 hover:text-emerald-400 transition-colors duration-200 p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-400 transition-colors duration-200 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Progress</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-300">
                        {goal.type === 'revenue' || goal.type === 'expenses' ? '$' : ''}{progress.current.toLocaleString()} / {goal.type === 'revenue' || goal.type === 'expenses' ? '$' : ''}{goal.target.toLocaleString()}
                      </span>
                      <span className={`text-${statusColor}-400 font-semibold`}>
                        {progress.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-3 rounded-full bg-${statusColor}-500`}
                    />
                    {/* Time elapsed indicator */}
                    <div
                      className="absolute top-0 h-3 w-1 bg-white opacity-50"
                      style={{ left: `${Math.min(progress.timeElapsed, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Started: {new Date(goal.startDate).toLocaleDateString()}</span>
                    <span>
                      {progress.daysLeft > 0 
                        ? `${progress.daysLeft} days left`
                        : progress.isOverdue 
                          ? 'Overdue' 
                          : 'Completed'
                      }
                    </span>
                    <span>Due: {new Date(goal.endDate).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Status badges */}
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      progress.isCompleted 
                        ? 'bg-emerald-600 text-white' 
                        : progress.isOverdue
                          ? 'bg-red-600 text-white'
                          : `bg-${statusColor}-600 text-white`
                    }`}>
                      {progress.isCompleted ? 'Completed' : progress.isOverdue ? 'Overdue' : 'In Progress'}
                    </span>
                    
                    <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium">
                      {goal.period.charAt(0).toUpperCase() + goal.period.slice(1)}
                    </span>
                    
                    <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium">
                      {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {activeGoals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            No active goals set yet.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Set goals to track your business growth and stay motivated!
          </p>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddModal && (
        <GoalModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addGoal}
        />
      )}
      
      {editingGoal && (
        <GoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onSave={updateGoal}
          initialData={editingGoal}
        />
      )}
    </div>
  );
};

// Modal for adding/editing business goals
const GoalModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'revenue',
    target: 1000,
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    ...initialData
  });

  const goalTypes = [
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'clients', label: 'New Clients', icon: Users },
    { value: 'appointments', label: 'Appointments', icon: Calendar },
    { value: 'expenses', label: 'Expense Control', icon: TrendingUp }
  ];

  const periods = ['weekly', 'monthly', 'quarterly', 'yearly'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700"
      >
        <h3 className="text-xl font-bold text-gray-100 mb-6">
          {initialData ? 'Edit Business Goal' : 'Add Business Goal'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Goal Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              placeholder="e.g., Monthly Revenue Target"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              rows="3"
              placeholder="Describe your goal"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Goal Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
            >
              {goalTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target</label>
              <input
                type="number"
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({...formData, target: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                {periods.map(period => (
                  <option key={period} value={period}>{period.charAt(0).toUpperCase() + period.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BusinessGoals;