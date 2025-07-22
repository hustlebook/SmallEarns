import React, { useState, useEffect, createContext, useContext, useMemo, Suspense, useCallback } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { validateAndMigrateData, runDataHealthCheck, safeSaveToStorage, safeLoadFromStorage } from '../utils/dataValidation';
import { createDebouncedSave } from '../utils/debounce';
import { exportTaxDocumentsCSV } from '../utils/taxExport';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, DollarSign, PieChart, Plus, Edit, Trash2, Download, ChevronLeft, ChevronRight, X, History, Wallet, ReceiptText, Search, Filter, SortAsc, SortDesc, Upload, RefreshCcw, Car, FileText, TrendingUp, Settings } from 'lucide-react';
import { DateInput } from './Shared/DateInput';
import DateFilter from './Shared/DateFilter';
import { loadMockData } from '../utils/mockData';
import AppFooter from './AppFooter';

// Lazy load sections for better performance  
const ClientsSection = React.lazy(() => import('./sections/ClientsSection'));
const AppointmentsSection = React.lazy(() => import('./sections/AppointmentsSection'));
const IncomeSection = React.lazy(() => import('./sections/IncomeSection'));
const ExpensesSection = React.lazy(() => import('./sections/ExpensesSection'));
const MileageSection = React.lazy(() => import('./sections/MileageSection'));
const InvoiceSection = React.lazy(() => import('./sections/InvoiceSection'));
const ReportsSection = React.lazy(() => import('./sections/ReportsSection'));

const RecurringAppointments = React.lazy(() => import('./RecurringAppointments'));
const SectionLoader = React.lazy(() => import('./SectionLoader'));

// Create a context for app data and functions
const AppContext = createContext();

// Export AppContext for use in other components
export { AppContext };

// Utility function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Welcome Banner Component
const WelcomeBanner = ({ onDismiss, onLoadMockData }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-800/20 to-emerald-900/30 border border-emerald-700/50 text-emerald-100 px-4 py-3 rounded-lg text-sm mb-4 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        <div className="text-emerald-400">
          <TrendingUp size={18} />
        </div>
        <div>
          <span className="font-medium">Welcome to SmallEarns!</span>
          <span className="ml-2">You can start fresh or</span>
          <button
            onClick={onLoadMockData}
            className="underline text-emerald-300 hover:text-emerald-200 ml-1 transition-colors"
          >
            load sample data
          </button>
          <span className="ml-1">to explore features.</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-emerald-300 hover:text-emerald-100 transition-colors p-1 rounded"
        aria-label="Dismiss welcome message"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Custom Alert Modal Component
const AlertModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-emerald-700">
          <p className="text-gray-100 text-lg mb-6">{message}</p>
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Custom Confirm Modal Component
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-emerald-700">
          <p className="text-gray-100 text-lg mb-6">{message}</p>
          <div className="flex justify-around space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              No, wait!
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition-colors duration-200"
            >
              Yes, I'm sure.
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Generic Edit/Add Modal Component
const EditModal = ({ isOpen, onClose, title, children, onSubmit, submitButtonText }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full border border-emerald-700 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition-colors duration-200 p-1 rounded-full bg-gray-700 hover:bg-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-medium text-gray-100 mb-4 text-center">{title}</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              {children} {/* This is where the specific form fields will go */}
              <button
                type="submit"
                className="w-full bg-teal-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-teal-800 transition-colors duration-200 mt-4"
              >
                {submitButtonText}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};



// MainLayout Component
const MainLayout = ({ children, currentView, setCurrentView }) => {
  const navItems = [
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'income', label: 'Income', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'mileage', label: 'Mileage', icon: Car },


    { id: 'invoices', label: 'Invoices', icon: ReceiptText },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans pb-16">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg p-4 rounded-b-lg relative">
        <h1 className="text-2xl font-bold text-emerald-300 text-center">SmallEarns</h1>
        <p className="text-sm text-gray-400 text-center mt-1">Track your hustle, find your peace.</p>

      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-gray-800 shadow-lg p-2 rounded-t-lg fixed bottom-0 left-0 right-0 z-10">
        <div className="flex md:justify-around overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-1.5 px-2 mx-0.5 rounded-lg text-xs font-medium transition-colors duration-200 md:flex-1
                ${currentView === item.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700'
                }`}
            >
              <item.icon size={18} className="mb-0.5 flex-shrink-0" />
              <span className="text-center leading-tight whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

// ClientList Component
const ClientList = () => {
  const { clients, addClient, updateClient, deleteClient, appointments, incomeEntries, setCurrentView, setPreselectedClientIdForAppointment } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false); // Controls visibility of the Add Client modal
  const [editingClient, setEditingClient] = useState(null); // Stores client data for editing
  const [expandedClientId, setExpandedClientId] = useState(null);

  // Form states for adding/editing client
  const [name, setName] = useState('');
  const [lastVisitDate, setLastVisitDate] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [phone, setPhone] = useState('');

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('clientList_searchTerm') || '');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('clientList_sortOrder') || 'az');

  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Effect to populate form fields when editingClient changes
  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      setLastVisitDate(editingClient.lastVisitDate || '');
      setServiceNotes(editingClient.serviceNotes || '');
      setPhone(editingClient.phone || '');
    } else {
      // Clear form when not editing
      setName('');
      setLastVisitDate('');
      setServiceNotes('');
      setPhone('');
    }
  }, [editingClient]);

  // Effects to save/load filter and sort preferences
  useEffect(() => {
    localStorage.setItem('clientList_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('clientList_sortOrder', sortOrder);
  }, [sortOrder]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlertMessage('Client name is required. Let\'s give them a name!');
      return;
    }
    if (name.trim().length < 2) {
      setAlertMessage('Client name must be at least 2 characters long. A little more detail, please!');
      return;
    }

    if (phone.trim() && !/^\+?\d{10,15}$/.test(phone.trim())) {
      setAlertMessage('Please enter a valid phone number (10-15 digits, optional +). Double-check those digits!');
      return;
    }

    const clientData = {
      name: name.trim(),
      lastVisitDate: lastVisitDate,
      serviceNotes: serviceNotes.trim(),
      phone: phone.trim(),
    };

    addClient({ id: generateId(), ...clientData });
    setAlertMessage(`Welcome, ${name.trim()}! Another connection made.`);
    setIsAdding(false); // Close the add modal
    // Clear form after submission
    setName('');
    setLastVisitDate('');
    setServiceNotes('');
    setPhone('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlertMessage('Client name is required. Let\'s give them a name!');
      return;
    }
    if (name.trim().length < 2) {
      setAlertMessage('Client name must be at least 2 characters long. A little more detail, please!');
      return;
    }

    if (phone.trim() && !/^\+?\d{10,15}$/.test(phone.trim())) {
      setAlertMessage('Please enter a valid phone number (10-15 digits, optional +). Double-check those digits!');
      return;
    }

    const clientData = {
      name: name.trim(),
      lastVisitDate: lastVisitDate,
      serviceNotes: serviceNotes.trim(),
      phone: phone.trim(),
    };

    updateClient({ ...editingClient, ...clientData });
    setAlertMessage(`Client "${name.trim()}" updated! They'll appreciate the fresh notes.`);
    setEditingClient(null); // Close the edit modal
  };

  const handleEditClick = (client) => {
    setEditingClient(client); // Set client to be edited, which opens the modal via useEffect
    setExpandedClientId(null); // Collapse any expanded client details
  };

  const handleDeleteClick = (id) => {
    setConfirmMessage('Are you sure you want to say goodbye to this client? This will also remove associated appointments and income entries. This is a big step!');
    setConfirmAction(() => () => {
      deleteClient(id);
      setAlertMessage('Client and their history removed. Onward and upward!');
      setConfirmMessage('');
      setExpandedClientId(null);
    });
  };

  const handleConfirmCancel = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleAlertClose = () => {
    setAlertMessage('');
  };

  const sortedAndFilteredClients = useMemo(() => {
    let filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clientVisitCounts = appointments.reduce((acc, app) => {
      if (app.status === 'Completed') {
        acc[app.clientId] = (acc[app.clientId] || 0) + 1;
      }
      return acc;
    }, {});

    switch (sortOrder) {
      case 'az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'lastVisit':
        filtered.sort((a, b) => {
          const dateA = a.lastVisitDate ? new Date(a.lastVisitDate) : new Date(0);
          const dateB = b.lastVisitDate ? new Date(b.lastVisitDate) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'mostVisits':
        filtered.sort((a, b) => {
          const visitsA = clientVisitCounts[a.id] || 0;
          const visitsB = clientVisitCounts[b.id] || 0;
          return visitsB - visitsA;
        });
        break;
      default:
        break;
    }
    return filtered;
  }, [clients, searchTerm, sortOrder, appointments]);


  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Your People</h2> {/* Relatable header */}

      <button
        onClick={() => { setIsAdding(true); setEditingClient(null); setExpandedClientId(null); }}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>Add a New Face</span> {/* Relatable micro-copy */}
      </button>

      {/* Add Client Modal */}
      <EditModal
        isOpen={isAdding && !editingClient} // Only open add modal if isAdding is true AND not editing
        onClose={() => setIsAdding(false)}
        title="Introduce a New Client"
        onSubmit={handleAddSubmit}
        submitButtonText="Add to Your Crew"
      >
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-300">Client's Name:</label>
          <input
            type="text"
            id="clientName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="lastVisitDate" className="block text-sm font-medium text-gray-300">Last Time You Met:</label>
          <input
            type="date"
            id="lastVisitDate"
            value={lastVisitDate}
            onChange={(e) => setLastVisitDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
        <div>
          <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-300">What You Did For Them (Notes):</label>
          <textarea
            id="serviceNotes"
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
        <div>
          <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-300">Their Hotline (Optional Phone):</label>
          <input
            type="tel"
            id="clientPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </EditModal>

      {/* Edit Client Modal */}
      <EditModal
        isOpen={!!editingClient} // Open if editingClient is not null
        onClose={() => setEditingClient(null)} // Close by setting editingClient to null
        title="Refine Client Details"
        onSubmit={handleEditSubmit}
        submitButtonText="Update Their Story"
      >
        {/* Form fields are the same as add, but pre-populated by useEffect */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-300">Client's Name:</label>
          <input
            type="text"
            id="clientName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="lastVisitDate" className="block text-sm font-medium text-gray-300">Last Time You Met:</label>
          <input
            type="date"
            id="lastVisitDate"
            value={lastVisitDate}
            onChange={(e) => setLastVisitDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
        <div>
          <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-300">What You Did For Them (Notes):</label>
          <textarea
            id="serviceNotes"
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
        <div>
          <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-300">Their Hotline (Optional Phone):</label>
          <input
            type="tel"
            id="clientPhone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </EditModal>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-4"> {/* Added flex, flex-wrap, items-end, gap-4 */}
        <div className="flex-1 min-w-[150px]"> {/* flex-1 allows it to grow, min-w ensures it doesn't get too small */}
          <label htmlFor="clientSearch" className="block text-sm font-medium text-gray-300">Find a face:</label>
          <div className="flex items-center space-x-2 mt-1">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              id="clientSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients..."
              className="flex-grow p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="clientSort" className="block text-sm font-medium text-gray-300">Order By:</label>
          <select
            id="clientSort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="az">Name (A-Z)</option>
            <option value="za">Name (Z-A)</option>
            <option value="lastVisit">Most Recent Visit</option>
            <option value="mostVisits">Most Frequent</option>
          </select>
        </div>
      </div>


      {sortedAndFilteredClients.length === 0 && !isAdding && !editingClient && (
        <div className="text-center bg-gray-800 p-6 rounded-lg shadow-md mt-8">
          {/* Relatable empty state */}
          <p className="text-gray-400 text-lg mb-4">No clients yet. Keep building — they’ll come.</p>
          <p className="text-gray-300 text-md mb-6">Ready to add your first connection? 👇</p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <Plus size={20} />
            <span>Add a Client</span>
          </button>
        </div>
      )}

      {sortedAndFilteredClients.length > 0 && (
        <ul className="space-y-3">
          <AnimatePresence>
            {sortedAndFilteredClients.map((client) => (
              <motion.li
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800 p-4 rounded-lg shadow-md"
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                >
                  <div>
                    <p className="text-lg font-medium text-gray-100">{client.name}</p>
                    {client.lastVisitDate && <p className="text-sm text-gray-300">Last Met: {client.lastVisitDate}</p>} {/* Relatable micro-copy */}
                    {client.phone && (
                      <p className="text-sm text-gray-300">
                        Phone: <a href={`tel:${client.phone}`} className="text-blue-400 hover:underline">{client.phone}</a> {/* Clickable phone */}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClick(client); }}
                      className="p-2 rounded-full bg-yellow-700 text-yellow-100 hover:bg-yellow-600 transition-colors duration-200"
                      aria-label="Edit client"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(client.id); }}
                      className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200"
                      aria-label="Delete client"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {expandedClientId === client.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-700 space-y-3"
                  >
                    {client.serviceNotes && (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <h4 className="text-md font-medium text-gray-200 mb-1">What You Did:</h4> {/* Relatable header */}
                        <p className="text-sm text-gray-300 italic">{client.serviceNotes}</p>
                      </div>
                    )}

                    <h4 className="text-md font-medium text-gray-200">Their Visit History:</h4> {/* Relatable header */}
                    {appointments.filter(app => app.clientId === client.id).length === 0 ? (
                      /* Relatable empty state */
                      <p className="text-gray-400 text-sm">No past appointments for this client. Time to schedule one!</p>
                    ) : (
                      <ul className="space-y-2">
                        {appointments
                          .filter(app => app.clientId === client.id)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map(app => {
                            const incomeForVisit = incomeEntries.find(
                              income => income.date === app.date && income.notes.includes(app.service)
                            );
                            return (
                              <li key={app.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-gray-100 font-medium">{app.date} - {app.time}</p>
                                  <p className="text-sm text-gray-300">{app.service}</p>
                                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1
                                    ${app.status === 'Scheduled' ? 'bg-emerald-800 text-emerald-100' :
                                      app.status === 'Completed' ? 'bg-green-700 text-green-100' :
                                      'bg-red-700 text-red-100'
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                </div>
                                {incomeForVisit && (
                                  <p className="text-md font-semibold text-emerald-300">${incomeForVisit.amount.toFixed(2)}</p>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                    )}
                    <button
                      onClick={() => {
                        setPreselectedClientIdForAppointment(client.id);
                        setCurrentView('appointments');
                      }}
                      className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 mt-4"
                    >
                      <Plus size={20} />
                      <span>Schedule a New Visit</span> {/* Relatable micro-copy */}
                    </button>
                  </motion.div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AlertModal message={alertMessage} onClose={handleAlertClose} />
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmMessage('');
          setConfirmAction(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

// AppointmentLog Component
const AppointmentLog = () => {
  const { clients, appointments, addAppointment, updateAppointment, deleteAppointment, preselectedClientIdForAppointment, setPreselectedClientIdForAppointment } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false); // Controls visibility of the Add Appointment modal
  const [editingAppointment, setEditingAppointment] = useState(null); // Stores appointment data for editing

  // Form states for adding/editing appointment
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [clientId, setClientId] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState('Scheduled');

  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // State for filtering and sorting
  const [currentMonth, setCurrentMonth] = useState(() => {
    const storedMonth = localStorage.getItem('appointmentLog_currentMonth');
    return storedMonth ? new Date(storedMonth) : new Date();
  });
  const [filterPeriod, setFilterPeriod] = useState(() => localStorage.getItem('appointmentLog_filterPeriod') || 'all');
  const [filterStatus, setFilterStatus] = useState(() => localStorage.getItem('appointmentLog_filterStatus') || 'All');
  const [filterClientId, setFilterClientId] = useState(() => localStorage.getItem('appointmentLog_filterClientId') || 'All');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('appointmentLog_searchTerm') || '');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('appointmentLog_sortOrder') || 'dateAsc');


  useEffect(() => {
    if (editingAppointment) {
      setDate(editingAppointment.date || '');
      setTime(editingAppointment.time || '');
      setClientId(editingAppointment.clientId || '');
      setService(editingAppointment.service || '');
      setStatus(editingAppointment.status || 'Scheduled');
    } else if (preselectedClientIdForAppointment) {
      setClientId(preselectedClientIdForAppointment);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setIsAdding(true); // Open the appointment modal
      setPreselectedClientIdForAppointment(null);
    } else {
      setDate('');
      setTime('');
      setClientId('');
      setService('');
      setStatus('Scheduled');
    }
  }, [editingAppointment, preselectedClientIdForAppointment, setPreselectedClientIdForAppointment]);

  // Effects to save/load filter and sort preferences
  useEffect(() => {
    localStorage.setItem('appointmentLog_currentMonth', currentMonth.toISOString());
  }, [currentMonth]);

  useEffect(() => {
    localStorage.setItem('appointmentLog_filterPeriod', filterPeriod);
  }, [filterPeriod]);

  useEffect(() => {
    localStorage.setItem('appointmentLog_filterStatus', filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    localStorage.setItem('appointmentLog_filterClientId', filterClientId);
  }, [filterClientId]);

  useEffect(() => {
    localStorage.setItem('appointmentLog_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('appointmentLog_sortOrder', sortOrder);
  }, [sortOrder]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!date) {
      setAlertMessage('Appointment date is required. When is this happening?');
      return;
    }
    if (!time) {
      setAlertMessage('Appointment time is required. Don\'t be late!');
      return;
    }
    if (!clientId) {
      setAlertMessage('Please select a client for the appointment. Who are you meeting?');
      return;
    }
    if (!service.trim()) {
      setAlertMessage('Service description is required. What are you doing?');
      return;
    }
    if (service.trim().length < 3) {
      setAlertMessage('Service description must be at least 3 characters long. A little more detail, please!');
      return;
    }

    const appointmentData = {
      date,
      time,
      clientId,
      service: service.trim(),
      status,
    };

    addAppointment({ id: generateId(), ...appointmentData });
    setAlertMessage('Appointment scheduled! Go get that hustle.');
    setIsAdding(false); // Close the add modal
    // Clear form after submission
    setDate('');
    setTime('');
    setClientId('');
    setService('');
    setStatus('Scheduled');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!date) {
      setAlertMessage('Appointment date is required. When is this happening?');
      return;
    }
    if (!time) {
      setAlertMessage('Appointment time is required. Don\'t be late!');
      return;
    }
    if (!clientId) {
      setAlertMessage('Please select a client for the appointment. Who are you meeting?');
      return;
    }
    if (!service.trim()) {
      setAlertMessage('Service description is required. What are you doing?');
      return;
    }
    if (service.trim().length < 3) {
      setAlertMessage('Service description must be at least 3 characters long. A little more detail, please!');
      return;
    }

    const appointmentData = {
      date,
      time,
      clientId,
      service: service.trim(),
      status,
    };

    updateAppointment({ ...editingAppointment, ...appointmentData });
    setAlertMessage('Appointment updated! Ready for action.');
    setEditingAppointment(null); // Close the edit modal
  };

  const handleEditClick = (appointment) => {
    setEditingAppointment(appointment); // Set appointment to be edited, which opens the modal via useEffect
  };

  const handleDeleteClick = (id) => {
    setConfirmMessage('Are you sure you want to cancel this appointment? This can\'t be undone!');
    setConfirmAction(() => () => {
      deleteAppointment(id);
      setAlertMessage('Appointment removed. Space cleared!');
      setConfirmMessage('');
    });
  };

  const handleConfirmCancel = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleAlertClose = () => {
    setAlertMessage('');
  };

  const filteredAndSortedAppointments = useMemo(() => {
    let tempAppointments = appointments;

    if (searchTerm) {
      tempAppointments = tempAppointments.filter(app => {
        const client = clients.find(c => c.id === app.clientId);
        const clientName = client ? client.name.toLowerCase() : '';
        const serviceNote = app.service.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return clientName.includes(searchLower) || serviceNote.includes(searchLower);
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    tempAppointments = tempAppointments.filter(app => {
      const appDateTime = new Date(`${app.date}T${app.time}`);
      appDateTime.setSeconds(0, 0);

      switch (filterPeriod) {
        case 'today':
          return appDateTime.toDateString() === today.toDateString();
        case 'thisWeek':
          return appDateTime >= startOfWeek && appDateTime < endOfWeek;
        case 'upcoming':
          return appDateTime >= new Date();
        case 'past':
          return appDateTime < new Date();
        case 'all':
        default:
          return true;
      }
    });

    if (filterStatus !== 'All') {
      tempAppointments = tempAppointments.filter(app => app.status === filterStatus);
    }

    if (filterClientId !== 'All') {
      tempAppointments = tempAppointments.filter(app => app.clientId === filterClientId);
    }

    tempAppointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      const clientNameA = clients.find(c => c.id === a.clientId)?.name || '';
      const clientNameB = clients.find(c => c.id === b.clientId)?.name || '';

      switch (sortOrder) {
        case 'dateAsc':
          return dateA - dateB;
        case 'dateDesc':
          return dateB - dateA;
        case 'clientAsc':
          return clientNameA.localeCompare(clientNameB);
        case 'clientDesc':
          return clientNameB.localeCompare(clientNameA);
        default:
          return 0;
      }
    });

    return tempAppointments;
  }, [appointments, clients, filterPeriod, filterStatus, filterClientId, searchTerm, sortOrder]);

  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    filteredAndSortedAppointments.forEach(app => {
      const appDate = app.date;
      if (!grouped[appDate]) {
        grouped[appDate] = [];
      }
      grouped[appDate].push(app);
    });

    for (const date in grouped) {
      grouped[date].sort((a, b) => {
        const timeA = a.time;
        const timeB = b.time;
        if (timeA < timeB) return -1;
        if (timeA > timeB) return 1;
        return 0;
      });
    }
    return grouped;
  }, [filteredAndSortedAppointments]);

  const getDaysToDisplay = useMemo(() => {
    if (filterPeriod === 'all' || filterPeriod === 'upcoming' || filterPeriod === 'past') {
      const uniqueDates = [...new Set(filteredAndSortedAppointments.map(app => app.date))].sort();
      return uniqueDates.map(dateStr => new Date(dateStr));
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      const days = [];
      if (filterPeriod === 'today') {
        days.push(today);
      } else if (filterPeriod === 'thisWeek') {
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          days.push(day);
        }
      } else {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const numDays = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= numDays; i++) {
          days.push(new Date(year, month, i));
        }
      }
      return days;
    }
  }, [currentMonth, filterPeriod, filteredAndSortedAppointments]);


  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
      return newMonth;
    });
  };

  const formatDateHeader = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatDayHeader = (date) => {
    return date.toLocaleString('default', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Your Schedule</h2> {/* Relatable header */}

      <button
        onClick={() => { setIsAdding(true); setEditingAppointment(null); setPreselectedClientIdForAppointment(null); }}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>Book a New Slot</span> {/* Relatable micro-copy */}
      </button>

      {/* Add Appointment Modal */}
      <EditModal
        isOpen={isAdding && !editingAppointment}
        onClose={() => setIsAdding(false)}
        title="Set Up a New Meeting"
        onSubmit={handleAddSubmit}
        submitButtonText="Lock it In"
      >
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-300">When is it?</label>
          <input
            type="date"
            id="appointmentDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-300">What time?</label>
          <input
            type="time"
            id="appointmentTime"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentClient" className="block text-sm font-medium text-gray-300">Who are you meeting?</label>
          <select
            id="appointmentClient"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="appointmentService" className="block text-sm font-medium text-gray-300">What's the service?</label>
          <input
            type="text"
            id="appointmentService"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentStatus" className="block text-sm font-medium text-gray-300">Current Status:</label>
          <select
            id="appointmentStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </EditModal>

      {/* Edit Appointment Modal */}
      <EditModal
        isOpen={!!editingAppointment}
        onClose={() => setEditingAppointment(null)}
        title="Adjust Appointment Details"
        onSubmit={handleEditSubmit}
        submitButtonText="Update the Plan"
      >
        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-300">When is it?</label>
          <input
            type="date"
            id="appointmentDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-300">What time?</label>
          <input
            type="time"
            id="appointmentTime"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentClient" className="block text-sm font-medium text-gray-300">Who are you meeting?</label>
          <select
            id="appointmentClient"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="appointmentService" className="block text-sm font-medium text-gray-300">What's the service?</label>
          <input
            type="text"
            id="appointmentService"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="appointmentStatus" className="block text-sm font-medium text-gray-300">Current Status:</label>
          <select
            id="appointmentStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </EditModal>


      <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
        <div className="flex items-center space-x-2 mb-3">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            id="appointmentSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Find a meeting or client..."
            className="flex-grow p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">Show Me:</label> {/* Relatable label */}
          {/* Mobile: 3 buttons in first row, 2 in second row. Desktop: all 5 buttons spread in single row */}
          <div className="hidden sm:flex gap-4">
            {/* Desktop: All 5 buttons in single row, evenly spaced */}
            {['all', 'today', 'upcoming', 'thisWeek', 'past'].map(period => (
              <button
                key={period}
                onClick={() => {
                  setFilterPeriod(period);
                  if (period === 'today' || period === 'thisWeek') {
                    setCurrentMonth(new Date());
                  }
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === period
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                {period === 'all' ? 'All' : 
                 period === 'today' ? 'Today' : 
                 period === 'upcoming' ? 'Upcoming' : 
                 period === 'thisWeek' ? 'This Week' : 
                 'Past'}
              </button>
            ))}
          </div>
          
          {/* Mobile: 3 buttons first row, 2 buttons second row */}
          <div className="sm:hidden space-y-2">
            {/* First row: 3 buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPeriod('all')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === 'all'
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilterPeriod('today');
                  setCurrentMonth(new Date());
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === 'today'
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilterPeriod('upcoming')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === 'upcoming'
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                Upcoming
              </button>
            </div>
            {/* Second row: 2 buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterPeriod('thisWeek');
                  setCurrentMonth(new Date());
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === 'thisWeek'
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                This Week
              </button>
              <button
                onClick={() => setFilterPeriod('past')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap text-center
                  ${filterPeriod === 'past'
                    ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-600'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
                  }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4"> {/* Added flex, flex-wrap, items-end, gap-4 */}
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-300">Status:</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="All">Any Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterClient" className="block text-sm font-medium text-gray-300">Client:</label>
            <select
              id="filterClient"
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="All">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="sortAppointments" className="block text-sm font-medium text-gray-300">Arrange By:</label>
            <select
              id="sortAppointments"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 w-full px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="dateAsc">Date (Oldest First)</option>
              <option value="dateDesc">Date (Newest First)</option>
              <option value="clientAsc">Client Name (A-Z)</option>
              <option value="clientDesc">Client Name (Z-A)</option>
            </select>

          </div>
        </div>

        {(filterPeriod === 'all' || filterPeriod === 'upcoming' || filterPeriod === 'past') && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100 transition-colors duration-200"
              aria-label="Previous Month"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-medium text-gray-100">{formatDateHeader(currentMonth)}</h3>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100 transition-colors duration-200"
              aria-label="Next Month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {getDaysToDisplay.length === 0 && filteredAndSortedAppointments.length === 0 && !isAdding && !editingAppointment ? (
        <div className="text-center bg-gray-800 p-6 rounded-lg shadow-md mt-8">
          {/* Relatable empty state */}
          <p className="text-gray-400 text-lg mb-4">No appointments yet. Keep building — they’ll come.</p>
          <p className="text-gray-300 text-md mb-6">Time to fill your calendar! 👇</p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <Plus size={20} />
            <span>Add an Appointment</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {getDaysToDisplay.map(day => {
              const dateKey = day.toISOString().split('T')[0];
              const dailyAppointments = appointmentsByDate[dateKey] || [];
              const isToday = new Date().toISOString().split('T')[0] === dateKey;

              if (dailyAppointments.length === 0 && !(filterPeriod === 'today' && isToday) && !(filterPeriod === 'thisWeek' && getDaysToDisplay.includes(day))) {
                return null;
              }

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-800 p-4 rounded-lg shadow-md"
                >
                  <h3 className={`text-lg font-semibold mb-3 ${isToday ? 'text-emerald-300' : 'text-gray-100'}`}>
                    {formatDayHeader(day)}
                    {isToday && <span className="text-sm font-normal text-gray-400 ml-2">(Today)</span>}
                  </h3>
                  {dailyAppointments.length === 0 ? (
                    /* Relatable empty state */
                    <p className="text-gray-400 text-sm">No meetings for this day. Enjoy the quiet!</p>
                  ) : (
                    <ul className="space-y-3">
                      <AnimatePresence>
                        {dailyAppointments.map((appointment) => {
                          const client = clients.find(c => c.id === appointment.clientId);
                          return (
                            <motion.li
                              key={appointment.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ x: -50, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-gray-700 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                            >
                              <div>
                                <p className="text-base font-medium text-gray-100">{client ? client.name : 'Unknown Client'}</p>
                                <p className="text-sm text-gray-300">{appointment.time} - {appointment.service}</p>
                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1
                                  ${appointment.status === 'Scheduled' ? 'bg-emerald-800 text-emerald-100' :
                                    appointment.status === 'Completed' ? 'bg-green-700 text-green-100' :
                                    'bg-red-700 text-red-100'
                                  }`}
                                >
                                  {appointment.status}
                                </span>
                              </div>
                              <div className="flex flex-row space-x-2">
                                <button
                                  onClick={() => handleEditClick(appointment)}
                                  className="p-2 rounded-full bg-yellow-700 text-yellow-100 hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                  aria-label="Edit appointment"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(appointment.id)}
                                  className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center w-10 h-10"
                                  aria-label="Delete appointment"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AlertModal message={alertMessage} onClose={handleAlertClose} />
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmMessage('');
          setConfirmAction(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

// ExpenseTracker Component
const ExpenseTracker = () => {
  const { expenses, addExpenseEntry, updateExpenseEntry, deleteExpenseEntry } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false); // Controls visibility of the Add Expense modal
  const [editingEntry, setEditingEntry] = useState(null); // Stores expense data for editing

  // Form states for adding/editing expense
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  
  // Mileage-specific states
  const [mileageDistance, setMileageDistance] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  
  // IRS mileage rate for 2024
  const IRS_MILEAGE_RATE = 0.67;
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  // State for filtering and sorting
  const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('expenseTracker_filterCategory') || 'All');
  const [filterStartDate, setFilterStartDate] = useState(() => localStorage.getItem('expenseTracker_filterStartDate') || '');
  const [filterEndDate, setFilterEndDate] = useState(() => localStorage.getItem('expenseTracker_filterEndDate') || '');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('expenseTracker_searchTerm') || '');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('expenseTracker_sortOrder') || 'dateDesc');


  const expenseCategories = ['Office Supplies', 'Software & Tools', 'Equipment', 'Rent & Utilities', 'Travel & Mileage', 'Meals & Entertainment', 'Professional Services', 'Marketing & Advertising', 'Other Business Expense'];

  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Effect to populate form fields when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setAmount(editingEntry.amount || '');
      setDate(editingEntry.date || '');
      setCategory(editingEntry.category || 'Office Supplies');
      setMileageDistance(editingEntry.mileageDistance || '');
      setStartLocation(editingEntry.startLocation || '');
      setEndLocation(editingEntry.endLocation || '');
      setBusinessPurpose(editingEntry.businessPurpose || '');
      setNotes(editingEntry.notes || '');
      setReceiptUrl(editingEntry.receiptUrl || '');
    } else {
      // Clear form when not editing
      setAmount('');
      setDate('');
      setCategory('Office Supplies');
      setMileageDistance('');
      setStartLocation('');
      setEndLocation('');
      setBusinessPurpose('');
      setNotes('');
      setReceiptUrl('');
    }
  }, [editingEntry]);

  // Effects to save/load filter and sort preferences
  useEffect(() => {
    localStorage.setItem('expenseTracker_filterCategory', filterCategory);
  }, [filterCategory]);

  useEffect(() => {
    localStorage.setItem('expenseTracker_filterStartDate', filterStartDate);
  }, [filterStartDate]);

  useEffect(() => {
    localStorage.setItem('expenseTracker_filterEndDate', filterEndDate);
  }, [filterEndDate]);

  useEffect(() => {
    localStorage.setItem('expenseTracker_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('expenseTracker_sortOrder', sortOrder);
  }, [sortOrder]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!amount) {
      setAlertMessage('Amount is required. How much did it cost?');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlertMessage('Please enter a valid positive amount for expense. No freebies here!');
      return;
    }
    if (!date) {
      setAlertMessage('Expense date is required. When did this happen?');
      return;
    }
    if (!category.trim()) {
      setAlertMessage('Category is required. Where does this expense fit?');
      return;
    }

    if (receiptUrl.trim() && !/^https?:\/\/.+\.(png|jpg|jpeg|gif|svg)$/i.test(receiptUrl.trim())) {
      setAlertMessage('Please enter a valid image URL (png, jpg, jpeg, gif, svg). Check that link!');
      return;
    }

    const expenseData = {
      amount: parsedAmount,
      date,
      category,
      notes: notes.trim(),
      receiptUrl: receiptUrl.trim(),
    };

    addExpenseEntry({ id: generateId(), ...expenseData });
    setAlertMessage('Expense logged. That’s what hustle looks like!'); // Micro-copy
    setIsAdding(false); // Close the add modal
    // Clear form after submission
    setAmount('');
    setDate('');
    setCategory('Supplies');
    setNotes('');
    setReceiptUrl('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!amount) {
      setAlertMessage('Amount is required. How much did it cost?');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlertMessage('Please enter a valid positive amount for expense. No freebies here!');
      return;
    }
    if (!date) {
      setAlertMessage('Expense date is required. When did this happen?');
      return;
    }
    if (!category.trim()) {
      setAlertMessage('Category is required. Where does this expense fit?');
      return;
    }

    if (receiptUrl.trim() && !/^https?:\/\/.+\.(png|jpg|jpeg|gif|svg)$/i.test(receiptUrl.trim())) {
      setAlertMessage('Please enter a valid image URL (png, jpg, jpeg, gif, svg). Check that link!');
      return;
    }

    const expenseData = {
      amount: parsedAmount,
      date,
      category,
      notes: notes.trim(),
      receiptUrl: receiptUrl.trim(),
    };

    updateExpenseEntry({ ...editingEntry, ...expenseData });
    setAlertMessage('Expense updated! Every penny counts.');
    setEditingEntry(null); // Close the edit modal
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry); // Set entry to be edited, which opens the modal via useEffect
  };

  const handleDeleteClick = (id) => {
    setConfirmMessage('Are you sure you want to delete this expense entry? This will remove it from your records!');
    setConfirmAction(() => () => {
      deleteExpenseEntry(id);
      setAlertMessage('Expense removed. Less clutter, more clarity.');
      setConfirmMessage('');
    });
  };

  const handleConfirmCancel = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleAlertClose = () => {
    setAlertMessage('');
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let tempExpenses = expenses;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      tempExpenses = tempExpenses.filter(entry =>
        entry.category.toLowerCase().includes(searchLower) ||
        entry.notes.toLowerCase().includes(searchLower)
      );
    }

    if (filterCategory !== 'All') {
      tempExpenses = tempExpenses.filter(entry => entry.category === filterCategory);
    }

    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      tempExpenses = tempExpenses.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
    } else if (filterStartDate) {
      const start = new Date(filterStartDate);
      tempExpenses = tempExpenses.filter(entry => new Date(entry.date) >= start);
    } else if (filterEndDate) {
      const end = new Date(filterEndDate);
      tempExpenses = tempExpenses.filter(entry => new Date(entry.date) <= end);
    }

    tempExpenses.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      switch (sortOrder) {
        case 'dateAsc':
          return dateA - dateB;
        case 'dateDesc':
          return dateB - dateA;
        case 'amountAsc':
          return a.amount - b.amount;
        case 'amountDesc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return tempExpenses;
  }, [expenses, filterCategory, filterStartDate, filterEndDate, searchTerm, sortOrder]);


  const groupedExpensesByWeek = filteredAndSortedExpenses.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    const week = getWeekNumber(entryDate);
    const year = entryDate.getFullYear();
    const weekKey = `${year}-W${week}`;
    if (!acc[weekKey]) {
      acc[weekKey] = { total: 0, entries: [] };
    }
    acc[weekKey].total += entry.amount;
    acc[weekKey].entries.push(entry);
    return acc;
  }, {});

  const groupedExpensesByMonth = filteredAndSortedExpenses.reduce((acc, entry) => {
    const monthKey = getMonthName(entry.date);
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, entries: [] };
    }
    acc[monthKey].total += entry.amount;
    acc[monthKey].entries.push(entry);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Your Outgoings</h2> {/* Relatable header */}

      <button
        onClick={() => { setIsAdding(true); setEditingEntry(null); }}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>Log a New Expense</span> {/* Relatable micro-copy */}
      </button>

      {/* Add Expense Modal */}
      <EditModal
        isOpen={isAdding && !editingEntry}
        onClose={() => setIsAdding(false)}
        title="Add a New Expense"
        onSubmit={handleAddSubmit}
        submitButtonText="Save This Outgo"
      >
        <div>
          <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-300">Amount Spent:</label>
          <input
            type="number"
            id="expenseAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-300">When Did You Spend It?</label>
          <input
            type="date"
            id="expenseDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-300">What Was It For?</label>
          <select
            id="expenseCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          >
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expenseNotes" className="block text-sm font-medium text-gray-300">Quick Note (Optional):</label>
          <textarea
            id="expenseNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
        <div>
          <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-300">Receipt Link (Optional):</label>
          <input
            type="url"
            id="receiptUrl"
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="e.g., https://yourreceipt.com/image.jpg"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </EditModal>

      {/* Edit Expense Modal */}
      <EditModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Edit This Expense"
        onSubmit={handleEditSubmit}
        submitButtonText="Update Expense"
      >
        <div>
          <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-300">Amount Spent:</label>
          <input
            type="number"
            id="expenseAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-300">When Did You Spend It?</label>
          <input
            type="date"
            id="expenseDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-300">What Was It For?</label>
          <select
            id="expenseCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          >
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expenseNotes" className="block text-sm font-medium text-gray-300">Quick Note (Optional):</label>
          <textarea
            id="expenseNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
        <div>
          <label htmlFor="receiptUrl" className="block text-sm font-medium text-gray-300">Receipt Link (Optional):</label>
          <input
            type="url"
            id="receiptUrl"
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="e.g., https://yourreceipt.com/image.jpg"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </EditModal>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-4"> {/* Changed gap-4 to space-y-4 for vertical spacing between rows */}
        {/* New row for Search and Category */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="expenseSearch" className="block text-sm font-medium text-gray-300">Search expenses:</label>
            <div className="flex items-center space-x-2 mt-1">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                id="expenseSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search what you spent on..."
                className="flex-grow p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-300">Filter by Category:</label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="All">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Original row for dates and order */}
        {/* Mobile Date Filter - Only show on mobile */}
        <div className="block md:hidden w-full mb-4">
          <DateFilter
            dateFrom={filterStartDate}
            dateTo={filterEndDate}
            onDateFromChange={setFilterStartDate}
            onDateToChange={setFilterEndDate}
            onClear={() => {
              setFilterStartDate('');
              setFilterEndDate('');
            }}
            label="Expense Date Range"
          />
        </div>

        {/* Desktop Date Inputs - Only show on desktop */}
        <div className="hidden md:flex flex-col md:flex-row flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">

            <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-300 mb-1">From This Date:</label>
            <input
              type="date"
              id="filterStartDate"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="block w-full h-11 px-3 py-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-base"
              inputMode="none"
              style={{
                fontSize: '16px',
                appearance: 'none',
                WebkitAppearance: 'textfield',
                MozAppearance: 'textfield',
                colorScheme: 'dark'
              }}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-300 mb-1">To This Date:</label>
            <input
              type="date"
              id="filterEndDate"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="block w-full h-11 px-3 py-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-base"
              inputMode="none"
              style={{
                fontSize: '16px',
                appearance: 'none',
                WebkitAppearance: 'textfield',
                MozAppearance: 'textfield',
                colorScheme: 'dark'
              }}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="sortExpenses" className="block text-sm font-medium text-gray-300">Order By:</label>
            <select
              id="sortExpenses"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="dateDesc">Date (Newest First)</option>
              <option value="dateAsc">Date (Oldest First)</option>
              <option value="amountDesc">Amount (High to Low)</option>
              <option value="amountAsc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAndSortedExpenses.length === 0 && !isAdding && !editingEntry ? (
        <div className="text-center bg-gray-800 p-6 rounded-lg shadow-md mt-8">
          {/* Relatable empty state */}
          <p className="text-gray-400 text-lg mb-4">No expense entries yet for the selected filters. Keep that cash flow clear!</p>
          <p className="text-gray-300 text-md mb-6">Ready to log a new outgoing? 👇</p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <Plus size={20} />
            <span>Add an Expense</span>
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Weekly Outgoings (Filtered)</h3>
            <ul className="space-y-2">
              {Object.entries(groupedExpensesByWeek).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([weekKey, data]) => (
                <li key={weekKey} className="flex justify-between items-center text-gray-300">
                  <span>{weekKey}:</span>
                  <span className="font-semibold text-red-300">-${data.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Monthly Outgoings (Filtered)</h3>
            <ul className="space-y-2">
              {Object.entries(groupedExpensesByMonth).sort(([keyA], [keyB]) => {
                const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const [monthA, yearA] = keyA.split(' ');
                const [monthB, yearB] = keyB.split(' ');
                if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
              }).map(([monthKey, data]) => (
                <li key={monthKey} className="flex justify-between items-center text-gray-300">
                  <span>{monthKey}:</span>
                  <span className="font-semibold text-red-300">-${data.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="text-lg font-medium text-gray-100">All Your Spends (Filtered)</h3>
          <ul className="space-y-3">
            <AnimatePresence>
              {filteredAndSortedExpenses.map((entry) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-medium text-gray-100">-${entry.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-300">{entry.date} - {entry.category}</p>
                    {entry.notes && <p className="text-sm text-gray-400 italic">{entry.notes}</p>}
                    {entry.receiptUrl && (
                      <div className="mt-2 flex items-center space-x-2">
                        <ReceiptText size={16} className="text-gray-400" />
                        <a
                          href={entry.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline"
                        >
                          View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(entry)}
                      className="p-2 rounded-full bg-yellow-700 text-yellow-100 hover:bg-yellow-600 transition-colors duration-200"
                      aria-label="Edit expense entry"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entry.id)}
                      className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200"
                      aria-label="Delete expense entry"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      <AlertModal message={alertMessage} onClose={handleAlertClose} />
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmMessage('');
          setConfirmAction(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

// IncomeTracker Component
const IncomeTracker = () => {
  const { incomeEntries, addIncomeEntry, updateIncomeEntry, deleteIncomeEntry } = useContext(AppContext);
  const [isAdding, setIsAdding] = useState(false); // Controls visibility of the Add Income modal
  const [editingEntry, setEditingEntry] = useState(null); // Stores income data for editing

  // Form states for adding/editing income
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState('');
  const [notes, setNotes] = useState('');

  // State for filtering and sorting
  const [filterMethod, setFilterMethod] = useState(() => localStorage.getItem('incomeTracker_filterMethod') || 'All');
  const [filterMinAmount, setFilterMinAmount] = useState(() => localStorage.getItem('incomeTracker_filterMinAmount') || '');
  const [filterMaxAmount, setFilterMaxAmount] = useState(() => localStorage.getItem('incomeTracker_filterMaxAmount') || '');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('incomeTracker_searchTerm') || '');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('incomeTracker_sortOrder') || 'dateDesc');


  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Effect to populate form fields when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setAmount(editingEntry.amount || '');
      setDate(editingEntry.date || '');
      setMethod(editingEntry.method || '');
      setNotes(editingEntry.notes || '');
    } else {
      // Clear form when not editing
      setAmount('');
      setDate('');
      setMethod('');
      setNotes('');
    }
  }, [editingEntry]);

  // Effects to save/load filter and sort preferences
  useEffect(() => {
    localStorage.setItem('incomeTracker_filterMethod', filterMethod);
  }, [filterMethod]);

  useEffect(() => {
    localStorage.setItem('incomeTracker_filterMinAmount', filterMinAmount);
  }, [filterMinAmount]);

  useEffect(() => {
    localStorage.setItem('incomeTracker_filterMaxAmount', filterMaxAmount);
  }, [filterMaxAmount]);

  useEffect(() => {
    localStorage.setItem('incomeTracker_searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('incomeTracker_sortOrder', sortOrder);
  }, [sortOrder]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!amount) {
      setAlertMessage('Amount is required. How much did you earn?');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlertMessage('Please enter a valid positive amount for income. Let\'s keep it positive!');
      return;
    }
    if (!date) {
      setAlertMessage('Income date is required. When did you get paid?');
      return;
    }
    if (!method.trim()) {
      setAlertMessage('Payment method is required. How did it arrive?');
      return;
    }
    if (method.trim().length < 2) {
      setAlertMessage('Payment method must be at least 2 characters long. A little more detail, please!');
      return;
    }

    const incomeData = {
      amount: parsedAmount,
      date,
      method: method.trim(),
      notes: notes.trim(),
    };

    addIncomeEntry({ id: generateId(), ...incomeData });
    setAlertMessage(`Logged your last $${parsedAmount.toFixed(2)}? That’s what hustle looks like.`); // Micro-copy
    setIsAdding(false); // Close the add modal
    // Clear form after submission
    setAmount('');
    setDate('');
    setMethod('');
    setNotes('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!amount) {
      setAlertMessage('Amount is required. How much did you earn?');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlertMessage('Please enter a valid positive amount for income. Let\'s keep it positive!');
      return;
    }
    if (!date) {
      setAlertMessage('Income date is required. When did you get paid?');
      return;
    }
    if (!method.trim()) {
      setAlertMessage('Payment method is required. How did it arrive?');
      return;
    }
    if (method.trim().length < 2) {
      setAlertMessage('Payment method must be at least 2 characters long. A little more detail, please!');
      return;
    }

    const incomeData = {
      amount: parsedAmount,
      date,
      method: method.trim(),
      notes: notes.trim(),
    };

    updateIncomeEntry({ ...editingEntry, ...incomeData });
    setAlertMessage('Income updated! Money in the bank.');
    setEditingEntry(null); // Close the edit modal
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry); // Set entry to be edited, which opens the modal via useEffect
  };

  const handleDeleteClick = (id) => {
    setConfirmMessage('Are you sure you want to delete this income entry? This will remove it from your earnings!');
    setConfirmAction(() => () => {
      deleteIncomeEntry(id);
      setAlertMessage('Income entry removed. Less is more... sometimes.');
      setConfirmMessage('');
    });
  };

  const handleConfirmCancel = () => {
      setConfirmMessage('');
      setConfirmAction(null);
  };

  const handleAlertClose = () => {
    setAlertMessage('');
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getMonthName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const filteredAndSortedIncome = useMemo(() => {
    let tempIncome = incomeEntries;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      tempIncome = tempIncome.filter(entry =>
        entry.notes.toLowerCase().includes(searchLower)
      );
    }

    if (filterMethod !== 'All') {
      tempIncome = tempIncome.filter(entry => entry.method === filterMethod);
    }

    const minAmountNum = parseFloat(filterMinAmount);
    const maxAmountNum = parseFloat(filterMaxAmount);

    if (!isNaN(minAmountNum)) {
      tempIncome = tempIncome.filter(entry => entry.amount >= minAmountNum);
    }
    if (!isNaN(maxAmountNum)) {
      tempIncome = tempIncome.filter(entry => entry.amount <= maxAmountNum);
    }

    tempIncome.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      switch (sortOrder) {
        case 'dateAsc':
          return dateA - dateB;
        case 'dateDesc':
          return dateB - dateA;
        case 'amountAsc':
          return a.amount - b.amount;
        case 'amountDesc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return tempIncome;
  }, [incomeEntries, filterMethod, filterMinAmount, filterMaxAmount, searchTerm, sortOrder]);


  const groupedIncomeByWeek = filteredAndSortedIncome.reduce((acc, entry) => {
    const entryDate = new Date(entry.date);
    const week = getWeekNumber(entryDate);
    const year = entryDate.getFullYear();
    const weekKey = `${year}-W${week}`;
    if (!acc[weekKey]) {
      acc[weekKey] = { total: 0, entries: [] };
    }
    acc[weekKey].total += entry.amount;
    acc[weekKey].entries.push(entry);
    return acc;
  }, {});

  const groupedIncomeByMonth = filteredAndSortedIncome.reduce((acc, entry) => {
    const monthKey = getMonthName(entry.date);
    if (!acc[monthKey]) {
      acc[monthKey] = { total: 0, entries: [] };
    }
    acc[monthKey].total += entry.amount;
    acc[monthKey].entries.push(entry);
    return acc;
  }, {});

  const paymentMethods = [...new Set(incomeEntries.map(entry => entry.method))];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200">Your Earnings</h2> {/* Relatable header */}

      <button
        onClick={() => { setIsAdding(true); setEditingEntry(null); }}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>Log New Income</span> {/* Relatable micro-copy */}
      </button>

      {/* Add Income Modal */}
      <EditModal
        isOpen={isAdding && !editingEntry}
        onClose={() => setIsAdding(false)}
        title="Add New Income"
        onSubmit={handleAddSubmit}
        submitButtonText="Bank It!"
      >
        <div>
          <label htmlFor="incomeAmount" className="block text-sm font-medium text-gray-300">Amount Received:</label>
          <input
            type="number"
            id="incomeAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeDate" className="block text-sm font-medium text-gray-300">When Did It Arrive?</label>
          <input
            type="date"
            id="incomeDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeMethod" className="block text-sm font-medium text-gray-300">How Was It Paid?</label>
          <input
            type="text"
            id="incomeMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="e.g., Cash, Zelle, Venmo"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeNotes" className="block text-sm font-medium text-gray-300">Quick Note (Optional):</label>
          <textarea
            id="incomeNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
      </EditModal>

      {/* Edit Income Modal */}
      <EditModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Edit This Earning"
        onSubmit={handleEditSubmit}
        submitButtonText="Update Income"
      >
        <div>
          <label htmlFor="incomeAmount" className="block text-sm font-medium text-gray-300">Amount Received:</label>
          <input
            type="number"
            id="incomeAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeDate" className="block text-sm font-medium text-gray-300">When Did It Arrive?</label>
          <input
            type="date"
            id="incomeDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeMethod" className="block text-sm font-medium text-gray-300">How Was It Paid?</label>
          <input
            type="text"
            id="incomeMethod"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="e.g., Cash, Zelle, Venmo"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            required
          />
        </div>
        <div>
          <label htmlFor="incomeNotes" className="block text-sm font-medium text-gray-300">Quick Note (Optional):</label>
          <textarea
            id="incomeNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
          ></textarea>
        </div>
      </EditModal>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-4"> {/* Changed gap-4 to space-y-4 for vertical spacing between rows */}
        {/* New row for Search and Filter by Method */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="incomeSearch" className="block text-sm font-medium text-gray-300">Search notes:</label>
            <div className="flex items-center space-x-2 mt-1">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                id="incomeSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your notes..."
                className="flex-grow p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterMethod" className="block text-sm font-medium text-gray-300">Filter by How You Got Paid:</label>
            <select
              id="filterMethod"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="All">All Methods</option>
              {paymentMethods.map(methodOption => (
                <option key={methodOption} value={methodOption}>{methodOption}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Original row for amount range and order */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterMinAmount" className="block text-sm font-medium text-gray-300">Amount Range (Min):</label>
            <input
              type="number"
              id="filterMinAmount"
              value={filterMinAmount}
              onChange={(e) => setFilterMinAmount(e.target.value)}
              placeholder="Min amount"
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
              step="0.01"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterMaxAmount" className="block text-sm font-medium text-gray-300">Amount Range (Max):</label>
            <input
              type="number"
              id="filterMaxAmount"
              value={filterMaxAmount}
              onChange={(e) => setFilterMaxAmount(e.target.value)}
              placeholder="Max amount"
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
              step="0.01"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="sortIncome" className="block text-sm font-medium text-gray-300">Order By:</label>
            <select
              id="sortIncome"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-3 rounded-md border text-base bg-gray-700 text-gray-100 border-gray-600 focus:ring-emerald-600 focus:border-emerald-600"
            >
              <option value="dateDesc">Date (Newest First)</option>
              <option value="dateAsc">Date (Oldest First)</option>
              <option value="amountDesc">Amount (High to Low)</option>
              <option value="amountAsc">Amount (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAndSortedIncome.length === 0 && !isAdding && !editingEntry ? (
        <div className="text-center bg-gray-800 p-6 rounded-lg shadow-md mt-8">
          {/* Relatable empty state */}
          <p className="text-gray-400 text-lg mb-4">No income entries yet for the selected filters. Track your cash and your peace of mind.</p>
          <p className="text-300 text-md mb-6">Ready to log some earnings? 👇</p>
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            <Plus size={20} />
            <span>Add Income</span>
          </button>
        </div>
      ) : (
        <>
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Weekly Wins (Filtered)</h3>
            <ul className="space-y-2">
              {Object.entries(groupedIncomeByWeek).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([weekKey, data]) => (
                <li key={weekKey} className="flex justify-between items-center text-gray-300">
                  <span>{weekKey}:</span>
                  <span className="font-semibold text-emerald-300">${data.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Monthly Haul (Filtered)</h3>
            <ul className="space-y-2">
              {Object.entries(groupedIncomeByMonth).sort(([keyA], [keyB]) => {
                const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const [monthA, yearA] = keyA.split(' ');
                const [monthB, yearB] = keyB.split(' ');
                if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
              }).map(([monthKey, data]) => (
                <li key={monthKey} className="flex justify-between items-center text-gray-300">
                  <span>{monthKey}:</span>
                  <span className="font-semibold text-emerald-300">${data.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <h3 className="text-lg font-medium text-gray-100">All Your Income (Filtered)</h3>
          <ul className="space-y-3">
            <AnimatePresence>
              {filteredAndSortedIncome.map((entry) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-medium text-gray-100">${entry.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-300">{entry.date} - {entry.method}</p>
                    {entry.notes && <p className="text-sm text-gray-400 italic">{entry.notes}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(entry)}
                      className="p-2 rounded-full bg-yellow-700 text-yellow-100 hover:bg-yellow-600 transition-colors duration-200"
                      aria-label="Edit income entry"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entry.id)}
                      className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200"
                      aria-label="Delete income entry"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      <AlertModal message={alertMessage} onClose={handleAlertClose} />
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmMessage('');
          setConfirmAction(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};

// SummaryStats Component
const SummaryStats = () => {

  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const getClientsServedThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const clientsServedIds = new Set();
    appointments.forEach(app => {
      const appDate = new Date(app.date);
      if (app.status === 'Completed' && appDate >= startOfWeek) {
        clientsServedIds.add(app.clientId);
      }
    });
    return clientsServedIds.size;
  };

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const incomePerMethod = incomeEntries.reduce((acc, entry) => {
    acc[entry.method] = (acc[entry.method] || 0) + entry.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0);

  const chartData = useMemo(() => {
    return Object.entries(incomePerMethod).map(([method, amount]) => ({
      name: method,
      Income: parseFloat(amount.toFixed(2))
    }));
  }, [incomePerMethod]);


  const getMostFrequentClients = (limit = 3) => {
    const clientAppointmentCounts = appointments.reduce((acc, app) => {
      if (app.status === 'Completed') {
        acc[app.clientId] = (acc[app.clientId] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedClients = Object.entries(clientAppointmentCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, limit)
      .map(([clientId]) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'Unknown Client';
      });
    return sortedClients;
  };

  const mostFrequentClients = getMostFrequentClients();

  const handleExportData = () => {
    setConfirmMessage('Are you sure you want to export all your data? This will download a JSON file. Keep it safe!');
    setConfirmAction(() => () => {
      const dataToExport = {
        clients: clients,
        appointments: appointments,
        incomeEntries: incomeEntries,
        expenses: expenses,
        summary: {
          clientsServedThisWeek: getClientsServedThisWeek(),
          totalIncome: totalIncome,
          totalExpenses: totalExpenses,
          netEarnings: totalIncome - totalExpenses,
          incomePerMethod: incomePerMethod,
          mostFrequentClients: mostFrequentClients,
        }
      };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'smallearns_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAlertMessage('Data exported successfully as smallearns_data.json! Your records are backed up.');
      setConfirmMessage('');
    });
  };

  const fileInputRef = React.useRef(null);

  const handleImportButtonClick = () => {
    setConfirmMessage('Are you sure you want to import data? This will overwrite all existing data in the app. Only proceed if you know what you\'re doing!');
    setConfirmAction(() => () => {
      fileInputRef.current.click();
      setConfirmMessage('');
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (importedData.clients && importedData.appointments && importedData.incomeEntries && importedData.expenses) {
            importData(importedData);
            setAlertMessage('Data imported successfully! Welcome back to SmallEarns.');
          } else {
            setAlertMessage('Invalid JSON file structure. Please ensure it contains clients, appointments, incomeEntries, and expenses arrays. This file doesn\'t look right.');
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          setAlertMessage('Error importing data: Invalid JSON file. Is it really JSON?');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };


  const handleConfirmCancel = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const [dueDate, setDueDate] = useState("");
  
  // IRS mileage rate for 2024
  const IRS_MILEAGE_RATE = 0.67;

  // Handle mileage form submission
  const handleMileageSubmit = () => {
    if (!mileageDistance || !businessPurpose || !mileageDate) {
      setAlertMessage("Please fill in all required fields for mileage entry.");
      return;
    }
    
    const mileageAmount = parseFloat(mileageDistance) * IRS_MILEAGE_RATE;
    const mileageExpense = {
      id: Date.now().toString(),
      amount: mileageAmount,
      date: mileageDate,
      category: "Travel & Mileage",
      notes: `${businessPurpose} - ${mileageDistance} miles @ $${IRS_MILEAGE_RATE}/mile (${startLocation} to ${endLocation})`,
      mileageDistance,
      startLocation,
      endLocation,
      businessPurpose
    };
    
    // Add to expenses through context
    expenses.push(mileageExpense);
    localStorage.setItem("smallearns_expenses", JSON.stringify(expenses));
    
    setAlertMessage(`Mileage entry added! Tax deduction: $${mileageAmount.toFixed(2)}`);
    setShowMileageForm(false);
    setMileageDistance("");
    setStartLocation("");
    setEndLocation("");
    setBusinessPurpose("");
    setMileageDate("");
  };

  // Handle invoice form submission
  const handleInvoiceSubmit = () => {
    if (!invoiceAmount || !clientName || !invoiceDescription || !dueDate) {
      setAlertMessage("Please fill in all required fields for invoice.");
      return;
    }
    
    const invoiceNumber = `INV-${String(Date.now()).slice(-3)}`;
    const invoiceEntry = {
      id: Date.now().toString(),
      amount: parseFloat(invoiceAmount),
      date: new Date().toISOString().split("T")[0],
      method: "Invoice",
      notes: `${invoiceNumber} - ${clientName} - ${invoiceDescription} (Due: ${dueDate})`
    };
    
    // Add to income through context
    incomeEntries.push(invoiceEntry);
    localStorage.setItem("smallearns_income", JSON.stringify(incomeEntries));
    
    setAlertMessage(`Invoice ${invoiceNumber} created for ${clientName}!`);
    setShowInvoiceForm(false);
    setInvoiceAmount("");
    setClientName("");
    setInvoiceDescription("");
    setDueDate("");
  };

  // Export tax-ready CSV documents (fast and lightweight)
  const handleExportTaxDocuments = () => {
    try {
      const taxData = {
        income: incomeEntries,
        expenses: expenses,
        clients: clients,
        appointments: appointments
      };
      
      exportTaxDocumentsCSV(taxData);
      setAlertMessage('Tax documents exported! 4 CSV files ready for your accountant or tax software.');
    } catch (error) {
      console.error('[TaxExport] Export failed:', error);
      setAlertMessage('Export failed. Please try again or contact support if the issue persists.');
    }
  };

  const clientsServed = getClientsServedThisWeek();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-200">Business Reports</h2>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700"> {/* Subtle gradient */}
        <h3 className="text-lg font-medium text-gray-100 mb-3">The Big Picture</h3> {/* Relatable header */}
        <p className="text-gray-300 mb-2">Clients Served This Week: <span className="font-semibold text-emerald-300">{clientsServed}</span>
          {clientsServed > 0 && <span className="text-sm text-gray-400 ml-2">— That's {clientsServed} people who trust you!</span>} {/* Micro-copy */}
          {clientsServed === 0 && <span className="text-sm text-gray-400 ml-2">— Time to get out there!</span>}
        </p>
        <p className="text-gray-300 mb-2">Total Income: <span className="font-semibold text-emerald-300">${totalIncome.toFixed(2)}</span></p>
        <p className="text-gray-300 mb-2">Total Expenses: <span className="font-semibold text-red-300">-${totalExpenses.toFixed(2)}</span></p>
        <p className="text-gray-300 mb-2">Net Earnings: <span className="font-semibold text-blue-300">${(totalIncome - totalExpenses).toFixed(2)}</span></p>
        <p className="text-gray-300 mb-2">Total Clients: <span className="font-semibold text-emerald-300">{clients.length}</span></p>
        <p className="text-gray-300">Total Appointments: <span className="font-semibold text-emerald-300">{appointments.length}</span></p>
      </div>
      {/* Professional Business Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Mileage Business Analytics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700">
          <h3 className="text-lg font-medium text-gray-100 mb-3 flex items-center">
            <Car className="mr-2" size={20} /> Mileage Tracking
          </h3>
          <p className="text-gray-300 mb-2">This Month: <span className="font-semibold text-emerald-300">42.3 miles</span></p>
          <p className="text-gray-300 mb-2">Tax Deduction: <span className="font-semibold text-emerald-300">$28.34</span></p>
          <p className="text-gray-300 mb-2">IRS Rate: <span className="font-semibold text-gray-400">$0.67/mile</span></p>
          <p className="text-gray-300 mb-4">Year Total: <span className="font-semibold text-emerald-300">$847 saved</span></p>
          <button 
            onClick={() => setShowMileageForm(true)}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm"
          >
            + Quick Trip Entry
          </button>
        </div>

        {/* Invoice Business Analytics */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700">
          <h3 className="text-lg font-medium text-gray-100 mb-3 flex items-center">
            <FileText className="mr-2" size={20} /> Professional Invoicing
          </h3>
          <p className="text-gray-300 mb-2">Outstanding: <span className="font-semibold text-yellow-300">$1,250</span></p>
          <p className="text-gray-300 mb-2">This Month: <span className="font-semibold text-emerald-300">$3,500</span></p>
          <p className="text-gray-300 mb-2">Pending: <span className="font-semibold text-gray-400">3 invoices</span></p>
          <p className="text-gray-300 mb-4">Next Invoice: <span className="font-semibold text-emerald-300">INV-003</span></p>
          <button 
            onClick={() => setShowInvoiceForm(true)}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm"
          >
            + Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700"> {/* Subtle gradient */}
        <h3 className="text-lg font-medium text-gray-100 mb-3">Income Flow</h3> {/* Relatable header */}
        {Object.keys(incomePerMethod).length === 0 ? (
          /* Relatable empty state */
          <p className="text-gray-400">No income recorded yet. Let's change that!</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {Object.entries(incomePerMethod).map(([method, amount]) => (
                <li key={method} className="flex justify-between text-gray-300">
                  <span>{method}:</span>
                  <span className="font-semibold text-emerald-300">${amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <h4 className="text-md font-medium text-gray-200 mb-2">Income Distribution</h4>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                  <XAxis dataKey="name" stroke="#cbd5e0" tick={{ fill: '#cbd5e0', fontSize: 12 }} />
                  <YAxis stroke="#cbd5e0" tick={{ fill: '#cbd5e0', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2d3748', borderColor: '#4a5568', color: '#e2e8f0' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="Income" fill="#047857" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700"> {/* Subtle gradient */}
        <h3 className="text-lg font-medium text-gray-100 mb-3">Your Top Connections</h3> {/* Relatable header */}
        {mostFrequentClients.length === 0 ? (
          /* Relatable empty state */
          <p className="text-gray-400">No completed appointments to determine frequent clients. Go out and connect!</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            {mostFrequentClients.map((clientName, index) => (
              <li key={index}>{clientName}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        <button
          onClick={handleExportData}
          className="w-full bg-purple-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Download size={20} />
          <span>Export All Data (JSON)</span>
        </button>

        <button
          onClick={handleImportButtonClick}
          className="w-full bg-blue-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <Upload size={20} />
          <span>Import Data (JSON)</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
        <button
          className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <History size={20} />
        </button>
        <button
          className="w-full bg-red-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-red-800 transition-colors duration-200 flex items-center justify-center space-x-2 mt-6"
        >
          <RefreshCcw size={20} />
        </button>

      {/* Tax Export Button */}
      <div className="mt-6">
        <button
          onClick={handleExportTaxDocuments}
          className="w-full bg-green-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <FileText size={20} />
          <span>Export Tax Documents</span>
        </button>
      </div>

      {/* Mileage Entry Modal */}
      {showMileageForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg w-full max-w-md modal-content border border-emerald-700 relative">
            <button
              onClick={() => setShowMileageForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition-colors duration-200 p-1 rounded-full bg-gray-700 hover:bg-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Add Mileage Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={mileageDate}
                  onChange={(e) => setMileageDate(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Miles Driven</label>
                <input
                  type="number"
                  value={mileageDistance}
                  onChange={(e) => setMileageDistance(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter miles"
                />
                {mileageDistance && (
                  <p className="text-emerald-400 text-sm mt-1">
                    Tax deduction: ${(parseFloat(mileageDistance) * IRS_MILEAGE_RATE).toFixed(2)} @ ${IRS_MILEAGE_RATE}/mile
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Start location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">To</label>
                  <input
                    type="text"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="End location"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Business Purpose</label>
                <input
                  type="text"
                  value={businessPurpose}
                  onChange={(e) => setBusinessPurpose(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., Client meeting, supply pickup"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleMileageSubmit}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add Mileage
                </button>
                <button
                  onClick={() => setShowMileageForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Entry Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg w-full max-w-md modal-content border border-emerald-700 relative">
            <button
              onClick={() => setShowInvoiceForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition-colors duration-200 p-1 rounded-full bg-gray-700 hover:bg-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Create Invoice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="e.g., Website design, Logo creation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleInvoiceSubmit}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create Invoice
                </button>
                <button
                  onClick={() => setShowInvoiceForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>


      <AlertModal message={alertMessage} onClose={handleAlertClose} />
      <ConfirmModal
        message={confirmMessage}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmMessage('');
          setConfirmAction(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
};


// Main App Component
const SmallEarns = () => {
  const [currentView, setCurrentView] = useState('reports');
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [mileageEntries, setMileageEntries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [preselectedClientIdForAppointment, setPreselectedClientIdForAppointment] = useState(null);
  // Removed intro modal logic
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);


  // Welcome banner logic - show only when app is empty and user hasn't dismissed
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    const isAppEmpty = clients.length === 0 && 
                       appointments.length === 0 && 
                       incomeEntries.length === 0 && 
                       expenses.length === 0;
    
    setShowWelcomeBanner(!hasSeenWelcome && isAppEmpty);
  }, [clients, appointments, incomeEntries, expenses]);

  // Welcome banner handlers
  const handleDismissWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeBanner(false);
  };

  const handleLoadMockDataFromBanner = () => {
    loadMockData();
    handleDismissWelcome(); // Auto-dismiss after loading mock data
  };

  // Clean data loading - only real user data
  useEffect(() => {
    // Load existing data from localStorage if available
    const storedClients = localStorage.getItem('smallearns_clients');
    const storedAppointments = localStorage.getItem('smallearns_appointments');
    const storedIncome = localStorage.getItem('smallearns_income');
    const storedExpenses = localStorage.getItem('smallearns_expenses');
    const storedMileage = localStorage.getItem('smallearns_mileage');

    // Only load if data exists - otherwise start with empty arrays
    if (storedClients) {
      try {
        setClients(JSON.parse(storedClients));
      } catch (e) {
        console.error('Failed to parse clients data:', e);
        setClients([]);
      }
    } else {
      setClients([]);
    }
    
    if (storedAppointments) {
      try {
        setAppointments(JSON.parse(storedAppointments));
      } catch (e) {
        console.error('Failed to parse appointments data:', e);
        setAppointments([]);
      }
    } else {
      setAppointments([]);
    }
    
    if (storedIncome) {
      try {
        setIncomeEntries(JSON.parse(storedIncome));
      } catch (e) {
        console.error('Failed to parse income data:', e);
        setIncomeEntries([]);
      }
    } else {
      setIncomeEntries([]);
    }
    
    if (storedExpenses) {
      try {
        setExpenses(JSON.parse(storedExpenses));
      } catch (e) {
        console.error('Failed to parse expenses data:', e);
        setExpenses([]);
      }
    } else {
      setExpenses([]);
    }
    
    if (storedMileage) {
      try {
        setMileageEntries(JSON.parse(storedMileage));
      } catch (e) {
        console.error('Failed to parse mileage data:', e);
        setMileageEntries([]);
      }
    } else {
      setMileageEntries([]);
    }
  }, []);

  // Effects to save main data to localStorage
  useEffect(() => {
    localStorage.setItem('smallearns_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('smallearns_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('smallearns_income', JSON.stringify(incomeEntries));
  }, [incomeEntries]);

  useEffect(() => {
    localStorage.setItem('smallearns_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('smallearns_mileage', JSON.stringify(mileageEntries));
  }, [mileageEntries]);

  const addClient = (newClient) => {
    setClients((prevClients) => [...prevClients, newClient]);
  };

  const updateClient = (updatedClient) => {
    setClients((prevClients) =>
      prevClients.map((client) =>
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  const deleteClient = (id) => {
    setClients((prevClients) => prevClients.filter((client) => client.id !== id));
    setAppointments((prevAppointments) => prevAppointments.filter((app) => app.clientId !== id));
    setIncomeEntries((prevIncome) => prevIncome.filter((entry) => {
      // Attempt to find the client name to filter income entries
      const clientName = clients.find(c => c.id === id)?.name;
      // Filter out income entries directly linked to the client ID or whose notes contain the client's name
      return !entry.notes.includes(clientName);
    }));
  };

  const addAppointment = (newAppointment) => {
    setAppointments((prevAppointments) => [...prevAppointments, newAppointment]);
  };

  const updateAppointment = (updatedAppointment) => {
    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment.id === updatedAppointment.id ? updatedAppointment : appointment
      )
    );
  };

  const deleteAppointment = (id) => {
    setAppointments((prevAppointments) => prevAppointments.filter((appointment) => appointment.id !== id));
  };

  const addIncomeEntry = (newEntry) => {
    setIncomeEntries((prevEntries) => [...prevEntries, newEntry]);
  };

  const updateIncomeEntry = (updatedEntry) => {
    setIncomeEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
  };

  const deleteIncomeEntry = (id) => {
    setIncomeEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
  };

  const addExpenseEntry = (newEntry) => {
    setExpenses((prevExpenses) => [...prevExpenses, newEntry]);
  };

  const updateExpenseEntry = (updatedEntry) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((entry) =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
  };

  const deleteExpenseEntry = (id) => {
    setExpenses((prevExpenses) => prevExpenses.filter((entry) => entry.id !== id));
  };

  const importData = (data) => {
    setClients(data.clients || []);
    setAppointments(data.appointments || []);
    setIncomeEntries(data.incomeEntries || []);
    setExpenses(data.expenses || []);
  };




  const appContextValue = {
    clients,
    addClient,
    updateClient,
    deleteClient,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    incomeEntries,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    expenses,
    addExpenseEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
    setCurrentView,
    preselectedClientIdForAppointment,
    setPreselectedClientIdForAppointment,
    importData,
  };



  return (
    <AppContext.Provider value={appContextValue}>
      <MainLayout currentView={currentView} setCurrentView={setCurrentView}>
        {currentView === 'clients' && <ClientList />}
        {currentView === 'appointments' && <AppointmentLog />}
        {currentView === 'income' && <IncomeTracker />}
        {currentView === 'expenses' && <ExpenseTracker />}
        {currentView === 'mileage' && (
          <ErrorBoundary fallback={<div>Error loading mileage tracking</div>}>
            <Suspense fallback={<SectionLoader />}>
              <MileageSection 
                mileageEntries={mileageEntries}
                setMileageEntries={setMileageEntries}
              />
            </Suspense>
          </ErrorBoundary>
        )}


        {currentView === 'invoices' && (
          <ErrorBoundary fallback={<div>Error loading invoices</div>}>
            <Suspense fallback={<SectionLoader />}>
              <InvoiceSection 
                clients={clients}
                invoices={invoices}
                setInvoices={setInvoices}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {currentView === 'reports' && (
          <ErrorBoundary fallback={<div>Error loading reports</div>}>
            <Suspense fallback={<SectionLoader />}>
              <ReportsSection 
                clients={clients}
                appointments={appointments}
                incomeEntries={incomeEntries}
                expenses={expenses}
                mileageEntries={mileageEntries}
              />
            </Suspense>
          </ErrorBoundary>
        )}

      </MainLayout>

    </AppContext.Provider>
  );
};



export default SmallEarns;
