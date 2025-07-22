import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { generateId } from '../utils/idGenerator';

const RecurringAppointments = ({ clients, addAppointment, appointments }) => {
  const [recurringAppointments, setRecurringAppointments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);

  // Load recurring appointments from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('smallearns_recurring_appointments');
    if (stored) {
      setRecurringAppointments(JSON.parse(stored));
    }
  }, []);

  // Save recurring appointments to localStorage
  useEffect(() => {
    localStorage.setItem('smallearns_recurring_appointments', JSON.stringify(recurringAppointments));
  }, [recurringAppointments]);

  // Generate next occurrence date based on frequency
  const getNextOccurrence = (lastDate, frequency, interval) => {
    const date = new Date(lastDate);
    
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (interval * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + interval);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + interval);
        break;
      default:
        break;
    }
    
    return date.toISOString().split('T')[0];
  };

  // Check and generate appointments for recurring schedules
  const generateRecurringAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const futureLimit = new Date();
    futureLimit.setMonth(futureLimit.getMonth() + 3); // Generate 3 months ahead
    const futureLimitStr = futureLimit.toISOString().split('T')[0];

    recurringAppointments.forEach(recurring => {
      if (!recurring.isActive) return;

      let currentDate = recurring.lastGenerated || recurring.startDate;
      
      while (currentDate <= futureLimitStr) {
        const nextDate = getNextOccurrence(currentDate, recurring.frequency, recurring.interval);
        
        // Check if appointment already exists for this date
        const existingAppointment = appointments.find(apt => 
          apt.clientId === recurring.clientId && 
          apt.date === nextDate &&
          apt.recurringId === recurring.id
        );

        if (!existingAppointment && nextDate >= today) {
          // Generate new appointment
          const newAppointment = {
            id: generateId(),
            clientId: recurring.clientId,
            date: nextDate,
            time: recurring.time,
            service: recurring.service,
            status: 'confirmed',
            notes: recurring.notes + ' (Recurring)',
            recurringId: recurring.id
          };
          
          addAppointment(newAppointment);
        }
        
        currentDate = nextDate;
        
        // Update last generated date
        setRecurringAppointments(prev => 
          prev.map(r => 
            r.id === recurring.id 
              ? { ...r, lastGenerated: nextDate }
              : r
          )
        );
      }
    });
  };

  // Run generation check on component mount and periodically
  useEffect(() => {
    generateRecurringAppointments();
  }, [recurringAppointments, appointments]);

  const addRecurringAppointment = (recurringData) => {
    const newRecurring = {
      ...recurringData,
      id: generateId(),
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0],
      lastGenerated: null
    };
    setRecurringAppointments(prev => [...prev, newRecurring]);
    setShowAddModal(false);
  };

  const updateRecurringAppointment = (updatedRecurring) => {
    setRecurringAppointments(prev =>
      prev.map(r => r.id === updatedRecurring.id ? updatedRecurring : r)
    );
    setEditingRecurring(null);
  };

  const deleteRecurringAppointment = (id) => {
    setRecurringAppointments(prev => prev.filter(r => r.id !== id));
  };

  const toggleRecurringStatus = (id) => {
    setRecurringAppointments(prev =>
      prev.map(r => 
        r.id === id 
          ? { ...r, isActive: !r.isActive }
          : r
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <RefreshCcw className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Recurring Appointments</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateRecurringAppointments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Generate</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      {/* Recurring Appointments List */}
      <div className="space-y-4">
        {recurringAppointments.map((recurring) => {
          const client = clients.find(c => c.id === recurring.clientId);
          const nextOccurrence = getNextOccurrence(
            recurring.lastGenerated || recurring.startDate, 
            recurring.frequency, 
            recurring.interval
          );
          
          return (
            <motion.div
              key={recurring.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-800 p-6 rounded-lg border ${
                recurring.isActive ? 'border-emerald-600' : 'border-gray-700'
              } transition-colors duration-200`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-100">
                      {client?.name || 'Unknown Client'}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      recurring.isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      {recurring.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>{recurring.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RefreshCcw className="w-4 h-4 text-emerald-500" />
                      <span>Every {recurring.interval} {recurring.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Next: {nextOccurrence}</span>
                    </div>
                  </div>
                  
                  {recurring.service && (
                    <p className="text-sm text-gray-400 mt-2">
                      Service: {recurring.service}
                    </p>
                  )}
                  
                  {recurring.notes && (
                    <p className="text-sm text-gray-400 mt-1">
                      Notes: {recurring.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleRecurringStatus(recurring.id)}
                    className={`p-2 rounded transition-colors duration-200 ${
                      recurring.isActive 
                        ? 'text-yellow-500 hover:text-yellow-400' 
                        : 'text-green-500 hover:text-green-400'
                    }`}
                    title={recurring.isActive ? 'Pause' : 'Resume'}
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingRecurring(recurring)}
                    className="text-emerald-500 hover:text-emerald-400 transition-colors duration-200 p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRecurringAppointment(recurring.id)}
                    className="text-red-500 hover:text-red-400 transition-colors duration-200 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {recurringAppointments.length === 0 && (
        <div className="text-center py-12">
          <RefreshCcw className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            No recurring appointments set up yet.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Create recurring schedules for regular clients to save time!
          </p>
        </div>
      )}

      {/* Add/Edit Modal would go here */}
      {showAddModal && (
        <RecurringAppointmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addRecurringAppointment}
          clients={clients}
        />
      )}
      
      {editingRecurring && (
        <RecurringAppointmentModal
          isOpen={!!editingRecurring}
          onClose={() => setEditingRecurring(null)}
          onSave={updateRecurringAppointment}
          clients={clients}
          initialData={editingRecurring}
        />
      )}
    </div>
  );
};

// Modal component for adding/editing recurring appointments
const RecurringAppointmentModal = ({ isOpen, onClose, onSave, clients, initialData }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    service: '',
    time: '',
    frequency: 'weekly',
    interval: 1,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    ...initialData
  });

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
          {initialData ? 'Edit Recurring Appointment' : 'Add Recurring Appointment'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Service</label>
            <input
              type="text"
              value={formData.service}
              onChange={(e) => setFormData({...formData, service: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              placeholder="e.g., Weekly consultation"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Every</label>
              <input
                type="number"
                min="1"
                value={formData.interval}
                onChange={(e) => setFormData({...formData, interval: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
          </div>
          
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              rows="3"
              placeholder="Optional notes"
            />
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

export default RecurringAppointments;