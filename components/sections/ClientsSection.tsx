import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';

// This will be moved from the main component
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

const ClientsSection = ({ clients, addClient, updateClient, deleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [singleExportClient, setSingleExportClient] = useState(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Clients</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors duration-200 flex items-center space-x-2"
            title="Export filtered clients"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
            <span>Export</span>
          </button>
        </div>
      </div>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={(type) => { setShowExportModal(false); /* TODO: implement export logic */ }} sectionName="Clients" />
      <SingleEntryExportModal isOpen={!!singleExportClient} onClose={() => setSingleExportClient(null)} onExport={(type, size) => { setSingleExportClient(null); /* TODO: implement single export logic */ }} entryType="Client" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input w-full pl-10 pr-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-2 sm:p-3 md:p-6 rounded-lg border border-gray-700 hover:border-emerald-600 transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-gray-100">{client.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingClient(client)}
                  className="p-3 sm:p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px]"
                  aria-label="Edit client"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-3 sm:p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px]"
                  aria-label="Delete client"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSingleExportClient(client)} className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8" title="Export this client">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-gray-400">Email:</span> {client.email}</p>
              <p><span className="text-gray-400">Phone:</span> {client.phone}</p>
              <p><span className="text-gray-400">Service:</span> {client.serviceType}</p>
              {client.notes && <p><span className="text-gray-400">Notes:</span> {client.notes}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Add your first client to get started!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsSection;