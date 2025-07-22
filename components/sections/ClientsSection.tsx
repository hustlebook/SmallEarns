import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';

// This will be moved from the main component
const ClientsSection = ({ clients, addClient, updateClient, deleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

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
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

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
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-emerald-600 transition-colors duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-gray-100">{client.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingClient(client)}
                  className="p-2 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                  aria-label="Edit client"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-2 rounded-full bg-red-700 text-red-100 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                  aria-label="Delete client"
                >
                  <Trash2 className="w-4 h-4" />
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