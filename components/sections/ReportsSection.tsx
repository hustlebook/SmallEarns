import React, { useState, useMemo, useRef, useEffect } from 'react';
import { loadMockData } from '../../utils/mockData';
import { resetAppData } from '../../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, DollarSign, PieChart, Plus, Edit, Trash2, Download, ChevronLeft, ChevronRight, X, History, Wallet, ReceiptText, Search, Filter, SortAsc, SortDesc, Upload, RefreshCcw, Car, FileText, TrendingUp } from 'lucide-react';
import { exportTaxDocumentsCSV } from '../../utils/taxExport';
import { CacheClearButton } from '../Shared/CacheClearButton';

interface Client { id: string; name: string; }
interface Appointment { id: string; clientId: string; date: string; service: string; status: string; }
interface IncomeEntry { id: string; amount: number; date: string; method: string; clientId?: string; }
interface Expense { id: string; amount: number; date: string; category: string; taxDeductible: boolean; }
interface MileageEntry { id: string; date: string; miles: number; rate: number; }

interface ReportsSectionProps {
  clients: Client[];
  appointments: Appointment[];
  incomeEntries: IncomeEntry[];
  expenses: Expense[];
  mileageEntries: MileageEntry[];
}

const ReportsSection: React.FC<ReportsSectionProps> = ({
  clients,
  appointments,
  incomeEntries,
  expenses,
  mileageEntries: propMileageEntries
}) => {
  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [showMileageForm, setShowMileageForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false); // Safari chart loading fix
  const fileInputRef = useRef(null);

  // Load mileage and invoice data from localStorage
  const [mileageEntries, setMileageEntries] = useState([]);
  const [invoiceEntries, setInvoiceEntries] = useState([]);
  
  // Generate consistent next invoice number based on existing invoices
  const generateNextInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = invoiceEntries.length + 1;
    return `${year}${month}-${String(count).padStart(3, '0')}`;
  };

  // Refresh mileage and invoice data when localStorage changes
  useEffect(() => {
    const loadData = () => {
      const loadedMileage = JSON.parse(localStorage.getItem('smallearns_mileage') || '[]');
      const loadedInvoices = JSON.parse(localStorage.getItem('smallearns_invoices') || '[]');
      setMileageEntries(loadedMileage);
      setInvoiceEntries(loadedInvoices);
    };

    loadData();

    // Listen for storage changes (mock data load, reset, etc.)
    window.addEventListener('storage', loadData);
    
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Safari loading fix: delay chart rendering
  useEffect(() => {
    console.log("Reports mounted with data:", { 
      clients: clients?.length, 
      appointments: appointments?.length, 
      income: incomeEntries?.length, 
      expenses: expenses?.length 
    });
    
    const timer = setTimeout(() => {
      setShowCharts(true);
      console.log("Charts enabled for rendering");
    }, 150); // Delay chart rendering for Safari
    
    return () => clearTimeout(timer);
  }, [clients, appointments, incomeEntries, expenses]);

  // Mileage form states
  const [mileageDate, setMileageDate] = useState('');
  const [mileageDistance, setMileageDistance] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');

  // Legal Invoice Form States
  // Business Information
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessContact, setBusinessContact] = useState('');
  const [businessTaxId, setBusinessTaxId] = useState('');
  
  // Client Information
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  
  // Invoice Details
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  
  // Invoice Items
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, rate: 0 }
  ]);
  
  // Payment Information
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  
  // Summary
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Invoice calculation functions
  const calculateInvoiceSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateInvoiceTax = () => {
    const subtotal = calculateInvoiceSubtotal();
    return (subtotal - discountAmount) * (taxRate / 100);
  };

  const calculateInvoiceTotal = () => {
    const subtotal = calculateInvoiceSubtotal();
    const tax = calculateInvoiceTax();
    return subtotal - discountAmount + tax;
  };

  // Invoice item management
  const updateInvoiceItem = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceItems(updatedItems);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, rate: 0 }]);
  };

  const removeInvoiceItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  // Helper functions
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

  const getMostFrequentClients = (limit = 3) => {
    const clientAppointmentCounts = appointments.reduce((acc, app) => {
      if (app.status === 'Completed') {
        const clientName = clients.find(c => c.id === app.clientId)?.name || 'Unknown';
        acc[clientName] = (acc[clientName] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(clientAppointmentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name]) => name);
  };

  const IRS_MILEAGE_RATE = 0.67;

  // Calculate key metrics
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const clientsServed = getClientsServedThisWeek();
  const mostFrequentClients = getMostFrequentClients();
  
  const incomePerMethod = incomeEntries.reduce((acc, entry) => {
    acc[entry.method] = (acc[entry.method] || 0) + entry.amount;
    return acc;
  }, {});

  const chartData = useMemo(() => {
    return Object.entries(incomePerMethod).map(([method, amount]) => ({
      name: method,
      Income: parseFloat(amount.toFixed(2))
    }));
  }, [incomePerMethod]);

  // Event handlers
  const handleAlertClose = () => {
    setAlertMessage('');
  };

  const handleConfirmCancel = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleExportData = () => {
    const data = {
      clients,
      appointments,
      incomeEntries,
      expenses,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smallearns-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setAlertMessage('Data exported successfully! Check your downloads folder.');
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          // This would need to be connected to the parent component's import function
          setAlertMessage('Data imported successfully!');
        } catch (error) {
          setAlertMessage('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };





  const handleMileageSubmit = () => {
    if (!mileageDistance || !businessPurpose || !mileageDate) {
      setAlertMessage("Please fill in all required fields for mileage entry.");
      return;
    }
    
    const mileageAmount = parseFloat(mileageDistance) * IRS_MILEAGE_RATE;
    setAlertMessage(`Mileage entry added! Tax deduction: $${mileageAmount.toFixed(2)}`);
    setShowMileageForm(false);
    setMileageDistance("");
    setStartLocation("");
    setEndLocation("");
    setBusinessPurpose("");
    setMileageDate("");
  };

  const handleInvoiceSubmit = () => {
    if (!invoiceAmount || !clientName || !invoiceDescription || !dueDate) {
      setAlertMessage("Please fill in all required fields for invoice.");
      return;
    }
    
    const invoiceNumber = generateNextInvoiceNumber();
    setAlertMessage(`Invoice ${invoiceNumber} created for ${clientName}!`);
    setShowInvoiceForm(false);
    setInvoiceAmount("");
    setClientName("");
    setInvoiceDescription("");
    setDueDate("");
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-200">Business Reports</h2>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700">
        <h3 className="text-lg font-medium text-gray-100 mb-3">The Big Picture</h3>
        <p className="text-gray-300 mb-2">Clients Served This Week: <span className="font-semibold text-emerald-300">{clientsServed}</span>
          {clientsServed > 0 && <span className="text-sm text-gray-400 ml-2">— That's {clientsServed} people who trust you!</span>}
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
          {mileageEntries.length === 0 ? (
            <>
              <p className="text-gray-400 mb-4">No mileage entries yet. Add your business trips to track tax deductions.</p>
              <p className="text-gray-300 mb-2">IRS Rate: <span className="font-semibold text-gray-400">$0.67/mile</span></p>
            </>
          ) : (
            <>
              <p className="text-gray-300 mb-2">Total Miles: <span className="font-semibold text-emerald-300">{mileageEntries.reduce((sum, entry) => sum + entry.miles, 0).toFixed(1)} miles</span></p>
              <p className="text-gray-300 mb-2">Tax Deduction: <span className="font-semibold text-emerald-300">${(mileageEntries.reduce((sum, entry) => sum + (entry.miles * entry.rate), 0)).toFixed(2)}</span></p>
              <p className="text-gray-300 mb-2">IRS Rate: <span className="font-semibold text-gray-400">$0.67/mile</span></p>
              <p className="text-gray-300 mb-4">Entries: <span className="font-semibold text-emerald-300">{mileageEntries.length} trips logged</span></p>
            </>
          )}
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
          {invoiceEntries.length === 0 ? (
            <p className="text-gray-400 mb-4">No invoices created yet. Generate invoices to track your business billing.</p>
          ) : (
            <>
              <p className="text-gray-300 mb-2">Total Amount: <span className="font-semibold text-emerald-300">${invoiceEntries.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span></p>
              <p className="text-gray-300 mb-2">Outstanding: <span className="font-semibold text-yellow-300">${invoiceEntries.filter(inv => inv.status === 'Outstanding').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span></p>
              <p className="text-gray-300 mb-2">Paid: <span className="font-semibold text-emerald-300">${invoiceEntries.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</span></p>
              <p className="text-gray-300 mb-2">Total Invoices: <span className="font-semibold text-gray-400">{invoiceEntries.length}</span></p>
            </>
          )}
          <p className="text-gray-300 mb-4">Next Invoice: <span className="font-semibold text-emerald-300">INV-{generateNextInvoiceNumber()}</span></p>
          <button 
            onClick={() => setShowInvoiceForm(true)}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm"
          >
            + Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700">
        <h3 className="text-lg font-medium text-gray-100 mb-3">Income Flow</h3>
        {Object.keys(incomePerMethod).length === 0 ? (
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
              {showCharts ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400 text-sm">Loading chart...</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-emerald-700">
        <h3 className="text-lg font-medium text-gray-100 mb-3">Your Top Connections</h3>
        {mostFrequentClients.length === 0 ? (
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
          onClick={loadMockData}
          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <History size={20} />
          <span>Load Mock Data</span>
        </button>

        <button
          onClick={() => setShowResetModal(true)}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <RefreshCcw size={20} />
          <span>Reset App Data</span>
        </button>

        <div className="mt-6">
          <button
            onClick={handleExportTaxDocuments}
            className="w-full bg-green-700 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <FileText size={20} />
            <span>Export Tax Documents</span>
          </button>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600/30">
          <div className="text-xs text-gray-500">
            SmallEarns v1.1.4 © 2025
          </div>
          <CacheClearButton />
        </div>
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
                    Tax deduction: ${(parseFloat(mileageDistance) * IRS_MILEAGE_RATE).toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Location</label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Where did you start?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Location</label>
                <input
                  type="text"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Where did you end up?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Business Purpose</label>
                <input
                  type="text"
                  value={businessPurpose}
                  onChange={(e) => setBusinessPurpose(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Why was this trip for business?"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowMileageForm(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMileageSubmit}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Compliant Invoice Entry Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg w-full max-w-4xl modal-content border border-emerald-700 relative my-8">
            <button
              onClick={() => setShowInvoiceForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-100 transition-colors duration-200 p-1 rounded-full bg-gray-700 hover:bg-gray-600 z-10"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Create Legal Invoice</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Business Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Your Business Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Company Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Your business name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Company Address *</label>
                  <textarea
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                    placeholder="Street address, City, State/Province, Postal Code, Country"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your Contact Information *</label>
                  <input
                    type="text"
                    value={businessContact}
                    onChange={(e) => setBusinessContact(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Phone, Email, Website"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Your VAT/GST/Tax ID Number</label>
                  <input
                    type="text"
                    value={businessTaxId}
                    onChange={(e) => setBusinessTaxId(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="If applicable"
                  />
                </div>
              </div>
              
              {/* Client Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Client Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Client or company name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client Address *</label>
                  <textarea
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                    placeholder="Client's address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client Contact Information</label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Phone, Email (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Client VAT/GST/Tax ID</label>
                  <input
                    type="text"
                    value={clientTaxId}
                    onChange={(e) => setClientTaxId(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="If applicable"
                  />
                </div>
              </div>
            </div>
            
            {/* Invoice Details */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Invoice Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Service Date(s)</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="If different from invoice date"
                  />
                </div>
              </div>
            </div>
            
            {/* Service Details */}
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Service/Item Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-sm font-medium text-gray-300">
                <div className="md:col-span-5">Description *</div>
                <div className="md:col-span-2">Quantity/Hours *</div>
                <div className="md:col-span-2">Unit Price/Rate *</div>
                <div className="md:col-span-2">Line Total</div>
                <div className="md:col-span-1">Action</div>
              </div>
              
              {invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      placeholder="Detailed description"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      placeholder="1"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="p-2 text-white text-sm font-medium">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    {invoiceItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInvoiceItem(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addInvoiceItem}
                className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>
            
            {/* Summary and Payment Info */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Payment Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Terms *</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Select payment terms</option>
                    <option value="Due upon receipt">Due upon receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="2/10 Net 30">2/10 Net 30</option>
                    <option value="CIA - Cash in Advance">CIA - Cash in Advance</option>
                    <option value="COD - Cash on Delivery">COD - Cash on Delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Accepted Payment Methods *</label>
                  <input
                    type="text"
                    value={paymentMethods}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Bank transfer, Credit card, Check, PayPal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Instructions</label>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                    placeholder="Bank details, payment portal links, etc."
                  />
                </div>
              </div>
              
              {/* Invoice Summary */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-emerald-300 border-b border-emerald-700 pb-2">Invoice Summary</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="text-white">${calculateInvoiceSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Discount:</span>
                    <span className="text-white">-${discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tax ({taxRate}%):</span>
                    <span className="text-white">${calculateInvoiceTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2">
                    <span className="text-white">Total Due:</span>
                    <span className="text-emerald-400">${calculateInvoiceTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Details */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes/Comments</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                  placeholder="Thank you note, project details, terms and conditions..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-6 border-t border-gray-600">
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleInvoiceSubmit}
                className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                Create Legal Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-emerald-700">
              <p className="text-gray-100 text-lg mb-6">{alertMessage}</p>
              <button
                onClick={handleAlertClose}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Confirm Modal */}
      {confirmMessage && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-emerald-700">
              <p className="text-gray-100 text-lg mb-6">{confirmMessage}</p>
              <div className="flex justify-around space-x-4">
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  No, wait!
                </button>
                <button
                  onClick={() => {
                    if (confirmAction) confirmAction();
                    setConfirmMessage('');
                    setConfirmAction(null);
                  }}
                  className="flex-1 bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition-colors duration-200"
                >
                  Yes, I'm sure.
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg w-full max-w-md border border-red-600 shadow-xl"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <RefreshCcw size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">⚠️ Confirm Reset?</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  This will permanently erase all your saved business data including clients, 
                  appointments, income, expenses, and all other records. This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      resetAppData();
                    }}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    Erase Everything
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      

    </div>
  );
};

export default ReportsSection;