import React, { useState, useEffect } from 'react';
import { Plus, Car, MapPin, Calendar, Search, Filter, ChevronDown, DollarSign, Clock, Trash2, Edit3 } from 'lucide-react';
import DateFilter from '../Shared/DateFilter';
import { Modal } from '../Shared/Modal';

interface MileageEntry {
  id: string;
  tripDate: string;
  startOdometer: number;
  endOdometer: number;
  totalMiles: number;
  startLocation: string;
  endLocation: string;
  businessPurpose: string;
  tripCategory: 'business' | 'personal' | 'commuting';
  tollsCost: number;
  parkingCost: number;
  otherExpenses: number;
  timestamp: string;
  driver: string;
  vehicle: string;
  notes: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
}

interface MileageSectionProps {
  mileageEntries: MileageEntry[];
  setMileageEntries: (entries: MileageEntry[]) => void;
}

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

const MileageSection: React.FC<MileageSectionProps> = ({
  mileageEntries,
  setMileageEntries
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MileageEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [singleExportMileage, setSingleExportMileage] = useState(null);

  // IRS standard mileage rate for 2025
  const IRS_MILEAGE_RATE = 0.67;

  // Form state - comprehensive fields for IRS compliance
  const [formData, setFormData] = useState({
    tripDate: new Date().toISOString().split('T')[0],
    startOdometer: '',
    endOdometer: '',
    startLocation: '',
    endLocation: '',
    businessPurpose: '',
    tripCategory: 'business' as 'business' | 'personal' | 'commuting',
    tollsCost: '',
    parkingCost: '',
    otherExpenses: '',
    driver: '',
    vehicle: '',
    notes: ''
  });

  // Vehicle interface kept for future expansion if needed

  // Calculate miles from odometer readings
  const calculateMiles = () => {
    const start = parseFloat(formData.startOdometer);
    const end = parseFloat(formData.endOdometer);
    return end && start && end > start ? end - start : 0;
  };

  // Calculate tax deduction
  const calculateDeduction = (miles: number, category: string) => {
    return category === 'business' ? miles * IRS_MILEAGE_RATE : 0;
  };

  // Filter entries
  const filteredEntries = mileageEntries.filter(entry => {
    const matchesSearch = entry.businessPurpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.endLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || entry.tripCategory === categoryFilter;
    const matchesDateRange = (!dateRange.start || entry.tripDate >= dateRange.start) &&
                            (!dateRange.end || entry.tripDate <= dateRange.end);
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Calculate totals
  const totalBusinessMiles = mileageEntries
    .filter(entry => entry.tripCategory === 'business')
    .reduce((sum, entry) => sum + entry.totalMiles, 0);
  
  const totalDeduction = totalBusinessMiles * IRS_MILEAGE_RATE;
  
  const totalExpenses = mileageEntries.reduce((sum, entry) => 
    sum + entry.tollsCost + entry.parkingCost + entry.otherExpenses, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalMiles = calculateMiles();
    if (totalMiles <= 0) {
      alert('Please enter valid odometer readings');
      return;
    }

    const entry: MileageEntry = {
      id: editingEntry ? editingEntry.id : `mileage_${Date.now()}`,
      tripDate: formData.tripDate,
      startOdometer: parseFloat(formData.startOdometer),
      endOdometer: parseFloat(formData.endOdometer),
      totalMiles,
      startLocation: formData.startLocation,
      endLocation: formData.endLocation,
      businessPurpose: formData.businessPurpose,
      tripCategory: formData.tripCategory,
      tollsCost: parseFloat(formData.tollsCost) || 0,
      parkingCost: parseFloat(formData.parkingCost) || 0,
      otherExpenses: parseFloat(formData.otherExpenses) || 0,
      timestamp: new Date().toISOString(),
      driver: formData.driver || 'Default Driver',
      vehicle: formData.vehicle,
      notes: formData.notes
    };

    let updatedEntries;
    if (editingEntry) {
      updatedEntries = mileageEntries.map(e => e.id === editingEntry.id ? entry : e);
    } else {
      updatedEntries = [...mileageEntries, entry];
    }
    
    setMileageEntries(updatedEntries);
    localStorage.setItem('smallearns_mileage', JSON.stringify(updatedEntries));

    // Reset form
    setFormData({
      tripDate: new Date().toISOString().split('T')[0],
      startOdometer: '',
      endOdometer: '',
      startLocation: '',
      endLocation: '',
      businessPurpose: '',
      tripCategory: 'business',
      tollsCost: '',
      parkingCost: '',
      otherExpenses: '',
      driver: '',
      vehicle: '',
      notes: ''
    });
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: MileageEntry) => {
    setFormData({
      tripDate: entry.tripDate,
      startOdometer: entry.startOdometer.toString(),
      endOdometer: entry.endOdometer.toString(),
      startLocation: entry.startLocation,
      endLocation: entry.endLocation,
      businessPurpose: entry.businessPurpose,
      tripCategory: entry.tripCategory,
      tollsCost: entry.tollsCost.toString(),
      parkingCost: entry.parkingCost.toString(),
      otherExpenses: entry.otherExpenses.toString(),
      driver: entry.driver,
      vehicle: entry.vehicle,
      notes: entry.notes
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = (entryId: string) => {
    if (confirm('Delete this mileage entry?')) {
      const updatedEntries = mileageEntries.filter(entry => entry.id !== entryId);
      setMileageEntries(updatedEntries);
      localStorage.setItem('smallearns_mileage', JSON.stringify(updatedEntries));
    }
  };

  const currentMiles = calculateMiles();
  const currentDeduction = calculateDeduction(currentMiles, formData.tripCategory);

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 md:max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mileage Tracking</h1>
          <p className="text-gray-400">IRS-compliant mileage logging for business tax deductions</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200 flex items-center space-x-2"
          title="Export filtered mileage logs"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
          <span>Export</span>
        </button>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={(type) => { setShowExportModal(false); /* TODO: implement export logic */ }} sectionName="Mileage Logs" />
      <SingleEntryExportModal isOpen={!!singleExportMileage} onClose={() => setSingleExportMileage(null)} onExport={(type, size) => { setSingleExportMileage(null); /* TODO: implement single export logic */ }} entryType="Mileage Log" />

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Mobile: Stack all elements */}
        <div className="flex flex-col lg:hidden gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by purpose, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.75 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full"
            >
              <option value="">All Categories</option>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
              <option value="commuting">Commuting</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <button
            onClick={() => { setShowForm(true); setEditingEntry(null); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Trip</span>
          </button>
        </div>

        {/* Desktop: Compact single row with search, category, dates, and button */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by purpose, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.75 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[150px]"
              >
                <option value="">All Categories</option>
                <option value="business">Business</option>
                <option value="personal">Personal</option>
                <option value="commuting">Commuting</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>

            <button
              onClick={() => { setShowForm(true); setEditingEntry(null); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>New Trip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Date Filter - Same as Expenses */}
      <div className="block lg:hidden mb-6">
        <DateFilter
          dateFrom={dateRange.start}
          dateTo={dateRange.end}
          onDateFromChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
          onDateToChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
          onClear={() => setDateRange({ start: '', end: '' })}
          label="Trip Date Range"
        />
      </div>

      {/* Mileage Entry Form */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingEntry(null); }} title={editingEntry ? 'Edit Trip Entry' : 'Log New Trip'} maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Information */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Trip Information</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trip Date *</label>
                <input
                  type="date"
                  required
                  value={formData.tripDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripDate: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trip Category *</label>
                <select
                  required
                  value={formData.tripCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripCategory: e.target.value as any }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="business">Business</option>
                  <option value="personal">Personal</option>
                  <option value="commuting">Commuting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle</label>
                <input
                  type="text"
                  value={formData.vehicle}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., 2023 Honda Civic, Company Vehicle #1"
                />
              </div>
            </div>
          </div>

          {/* Odometer & Distance */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Odometer Readings</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Odometer *</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={formData.startOdometer}
                  onChange={(e) => setFormData(prev => ({ ...prev, startOdometer: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Miles at start"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Odometer *</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={formData.endOdometer}
                  onChange={(e) => setFormData(prev => ({ ...prev, endOdometer: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Miles at end"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Miles</label>
                <div className="px-4 py-2.75 bg-gray-600 border border-gray-500 rounded-lg text-white">
                  {currentMiles.toFixed(1)} miles
                </div>
                {formData.tripCategory === 'business' && currentMiles > 0 && (
                  <div className="text-emerald-400 text-sm mt-1">
                    Tax deduction: ${currentDeduction.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Locations & Purpose */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Trip Details</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Location *</label>
                <input
                  type="text"
                  required
                  value={formData.startLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, startLocation: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="123 Start St, City, State"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Location *</label>
                <input
                  type="text"
                  required
                  value={formData.endLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, endLocation: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="456 End Ave, City, State"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Business Purpose *</label>
              <input
                type="text"
                required
                value={formData.businessPurpose}
                onChange={(e) => setFormData(prev => ({ ...prev, businessPurpose: e.target.value }))}
                className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Client meeting, site visit, delivery, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Meeting with John Smith about project update..."
              />
            </div>
          </div>

          {/* Related Expenses */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Related Expenses</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tolls ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tollsCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, tollsCost: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Parking ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.parkingCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, parkingCost: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Other Expenses ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.otherExpenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherExpenses: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Driver</label>
                <input
                  type="text"
                  value={formData.driver}
                  onChange={(e) => setFormData(prev => ({ ...prev, driver: e.target.value }))}
                  className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Driver name"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingEntry(null); }}
              className="px-6 py-2.75 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.75 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200"
            >
              {editingEntry ? 'Update Trip' : 'Log Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mileage Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center">
            <Car className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No mileage entries yet</h3>
            <p className="text-gray-400 mb-4">Start tracking your business trips for tax deductions</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.75 rounded-lg transition-colors duration-200"
            >
              Log Your First Trip
            </button>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:border-emerald-500/30 transition-colors duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-white font-semibold">{entry.tripDate}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.tripCategory === 'business' ? 'bg-emerald-600/20 text-emerald-400' :
                      entry.tripCategory === 'personal' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {entry.tripCategory.charAt(0).toUpperCase() + entry.tripCategory.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 mb-1 flex items-center">
                    <MapPin size={16} className="mr-1 text-gray-400" />
                    {entry.startLocation} → {entry.endLocation}
                  </div>
                  
                  <div className="text-gray-400 text-sm mb-2">{entry.businessPurpose}</div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{entry.totalMiles.toFixed(1)} miles</span>
                    <span>Odometer: {entry.startOdometer} - {entry.endOdometer}</span>
                    {(entry.tollsCost + entry.parkingCost + entry.otherExpenses) > 0 && (
                      <span>Expenses: ${(entry.tollsCost + entry.parkingCost + entry.otherExpenses).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {entry.tripCategory === 'business' && (
                      <div className="text-xl font-bold text-emerald-400">
                        ${(entry.totalMiles * IRS_MILEAGE_RATE).toFixed(2)}
                      </div>
                    )}
                    <div className="text-sm text-gray-400">
                      {entry.tripCategory === 'business' ? 'Tax Deduction' : 'No Deduction'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSingleExportMileage(entry)}
                      className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8" title="Export this mileage log">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MileageSection;