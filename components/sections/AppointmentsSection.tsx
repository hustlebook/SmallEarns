import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

const AppointmentsSection = ({ appointments, clients, addAppointment, updateAppointment, deleteAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  // Calendar rendering functions
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-900"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 bg-gray-800 border border-gray-700 p-2 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${
            isToday ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => {
            setSelectedDate(date);
            setShowAddModal(true);
          }}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-emerald-500' : 'text-gray-300'}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayAppointments.slice(0, 2).map((apt, index) => {
              const client = clients.find(c => c.id === apt.clientId);
              return (
                <div
                  key={apt.id}
                  className={`text-xs p-1 rounded truncate ${
                    apt.status === 'confirmed' ? 'bg-emerald-600 text-white' :
                    apt.status === 'pending' ? 'bg-yellow-600 text-white' :
                    apt.status === 'completed' ? 'bg-blue-600 text-white' :
                    'bg-red-600 text-white'
                  }`}
                >
                  {apt.time} - {client?.name || 'Unknown'}
                </div>
              );
            })}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-gray-400">+{dayAppointments.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 bg-gray-900 flex items-center justify-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Appointments</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Today</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-gray-100 min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric',
              ...(viewMode === 'week' && { day: 'numeric' })
            })}
          </h3>
          <button
            onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded ${
              viewMode === 'month' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } transition-colors duration-200`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded ${
              viewMode === 'week' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } transition-colors duration-200`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-gray-900 rounded-lg p-4">
        {viewMode === 'month' && renderMonthView()}
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">
          Appointments for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="space-y-3">
          {(() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const monthAppointments = appointments.filter(apt => {
              const aptDate = new Date(apt.date);
              return aptDate.getFullYear() === year && aptDate.getMonth() === month;
            });

            if (monthAppointments.length === 0) {
              return (
                <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
                  <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                  <h4 className="text-gray-300 font-medium mb-2">No appointments this month</h4>
                  <p className="text-gray-400 text-sm">
                    Click on any day in the calendar above to schedule a new appointment.
                  </p>
                </div>
              );
            }

            return monthAppointments.slice(0, 10).map((appointment) => {
              const client = clients.find(c => c.id === appointment.clientId);
              return (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium text-gray-100">{client?.name || 'Unknown Client'}</h4>
                    <p className="text-sm text-gray-400">
                      {appointment.date} at {appointment.time}
                    </p>
                    {appointment.service && (
                      <p className="text-sm text-gray-400">Service: {appointment.service}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      appointment.status === 'confirmed' ? 'bg-emerald-600 text-white' :
                      appointment.status === 'pending' ? 'bg-yellow-600 text-white' :
                      appointment.status === 'completed' ? 'bg-blue-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </motion.div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsSection;