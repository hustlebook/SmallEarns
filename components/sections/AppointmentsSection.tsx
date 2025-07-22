import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

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

// Add SingleEntryExportModal component (reusable)
const SingleEntryExportModal = ({ isOpen, onClose, onExport, entryType }) => {
  const [option, setOption] = useState('csv');
  const [screenshotSize, setScreenshotSize] = useState('mobile');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl border border-emerald-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Export {entryType}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors" aria-label="Close modal">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Export as:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="exportTypeSingle" value="csv" checked={option === 'csv'} onChange={() => setOption('csv')} />
                <span>CSV (single row)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="exportTypeSingle" value="pdf" checked={option === 'pdf'} onChange={() => setOption('pdf')} />
                <span>PDF (print-optimized)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="exportTypeSingle" value="screenshot" checked={option === 'screenshot'} onChange={() => setOption('screenshot')} />
                <span>Screenshot</span>
              </label>
              {option === 'screenshot' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setScreenshotSize('mobile')} className={`px-2 py-1 rounded ${screenshotSize === 'mobile' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Mobile</button>
                  <button onClick={() => setScreenshotSize('tablet')} className={`px-2 py-1 rounded ${screenshotSize === 'tablet' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Tablet</button>
                  <button onClick={() => setScreenshotSize('desktop')} className={`px-2 py-1 rounded ${screenshotSize === 'desktop' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Desktop</button>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="radio" name="exportTypeSingle" value="print" checked={option === 'print'} onChange={() => setOption('print')} />
                <span>Print</span>
              </label>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-900 rounded p-2">
            Export will include only this {entryType}.
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600">Cancel</button>
            <button onClick={() => onExport(option, screenshotSize)} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">Export</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsSection = ({ appointments, clients, addAppointment, updateAppointment, deleteAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [singleExportAppointment, setSingleExportAppointment] = useState(null);

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
          className={`h-24 min-h-[44px] bg-gray-800 border border-gray-700 p-2 cursor-pointer hover:bg-gray-700 transition-colors duration-200 ${
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
      <div className="grid grid-cols-7 gap-1 overflow-x-auto min-w-[600px]">
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
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200 flex items-center space-x-2"
          title="Export filtered appointments"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
          <span>Export</span>
        </button>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={(type) => { setShowExportModal(false); /* TODO: implement export logic */ }} sectionName="Appointments" />
      <SingleEntryExportModal isOpen={!!singleExportAppointment} onClose={() => setSingleExportAppointment(null)} onExport={(type, size) => { setSingleExportAppointment(null); /* TODO: implement single export logic */ }} entryType="Appointment" />

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
                    <button onClick={() => setSingleExportAppointment(appointment)} className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8" title="Export this appointment">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                    </button>
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