import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, Clock, DollarSign, Users } from 'lucide-react';
import { generateId } from '../utils/idGenerator';

const ServicePackages = ({ clients, addIncome, addAppointment }) => {
  const [servicePackages, setServicePackages] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Load service packages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('smallearns_service_packages');
    if (stored) {
      setServicePackages(JSON.parse(stored));
    }
    // Start with empty packages - user will create their own
  }, []);

  // Save service packages to localStorage
  useEffect(() => {
    localStorage.setItem('smallearns_service_packages', JSON.stringify(servicePackages));
  }, [servicePackages]);

  const addServicePackage = (packageData) => {
    const newPackage = {
      ...packageData,
      id: generateId(),
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0]
    };
    setServicePackages(prev => [...prev, newPackage]);
    setShowAddModal(false);
  };

  const updateServicePackage = (updatedPackage) => {
    setServicePackages(prev =>
      prev.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg)
    );
    setEditingPackage(null);
  };

  const deleteServicePackage = (id) => {
    setServicePackages(prev => prev.filter(pkg => pkg.id !== id));
  };

  const togglePackageStatus = (id) => {
    setServicePackages(prev =>
      prev.map(pkg => 
        pkg.id === id 
          ? { ...pkg, isActive: !pkg.isActive }
          : pkg
      )
    );
  };

  const bookPackage = (clientId, packageId, bookingData) => {
    const servicePackage = servicePackages.find(pkg => pkg.id === packageId);
    const client = clients.find(c => c.id === clientId);
    
    if (servicePackage && client) {
      // Create appointment
      const newAppointment = {
        id: generateId(),
        clientId: clientId,
        date: bookingData.date,
        time: bookingData.time,
        service: servicePackage.name,
        status: 'confirmed',
        notes: `${servicePackage.description} - ${servicePackage.duration} minutes`,
        packageId: packageId
      };
      
      addAppointment(newAppointment);
      
      // Create income entry
      const newIncome = {
        id: generateId(),
        amount: servicePackage.price,
        date: bookingData.date,
        method: bookingData.paymentMethod,
        notes: `${servicePackage.name} - ${client.name}`,
        packageId: packageId
      };
      
      addIncome(newIncome);
    }
    
    setShowBookingModal(false);
    setSelectedPackage(null);
  };

  // Group packages by category
  const groupedPackages = servicePackages.reduce((acc, pkg) => {
    const category = pkg.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(pkg);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Package className="w-8 h-8 text-emerald-500" />
          <h2 className="text-2xl font-bold text-gray-100">Service Packages</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </button>
      </div>

      {/* Package Categories */}
      <div className="space-y-8">
        {Object.entries(groupedPackages).map(([category, packages]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center space-x-2">
              <span>{category}</span>
              <span className="text-sm text-gray-400">({packages.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((servicePackage) => (
                <motion.div
                  key={servicePackage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gray-800 p-6 rounded-lg border transition-colors duration-200 ${
                    servicePackage.isActive ? 'border-emerald-600' : 'border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-100 mb-2">
                        {servicePackage.name}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {servicePackage.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      servicePackage.isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      {servicePackage.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>Price</span>
                      </div>
                      <span className="font-semibold text-emerald-400">
                        ${servicePackage.price}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span>Duration</span>
                      </div>
                      <span className="text-gray-300">
                        {Math.floor(servicePackage.duration / 60)}h {servicePackage.duration % 60}m
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPackage(servicePackage);
                        setShowBookingModal(true);
                      }}
                      disabled={!servicePackage.isActive}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors duration-200 ${
                        servicePackage.isActive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Book Now
                    </button>
                    
                    <button
                      onClick={() => togglePackageStatus(servicePackage.id)}
                      className="p-2 text-yellow-500 hover:text-yellow-400 transition-colors duration-200"
                      title={servicePackage.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setEditingPackage(servicePackage)}
                      className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteServicePackage(servicePackage.id)}
                      className="p-2 text-red-500 hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {servicePackages.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            No service packages created yet.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Create packages to streamline your booking and pricing!
          </p>
        </div>
      )}

      {/* Add/Edit Package Modal */}
      {showAddModal && (
        <ServicePackageModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addServicePackage}
        />
      )}
      
      {editingPackage && (
        <ServicePackageModal
          isOpen={!!editingPackage}
          onClose={() => setEditingPackage(null)}
          onSave={updateServicePackage}
          initialData={editingPackage}
        />
      )}
      
      {/* Booking Modal */}
      {showBookingModal && selectedPackage && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedPackage(null);
          }}
          onBook={bookPackage}
          servicePackage={selectedPackage}
          clients={clients}
        />
      )}
    </div>
  );
};

// Modal for adding/editing service packages
const ServicePackageModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 100,
    category: 'Consultation',
    ...initialData
  });

  const categories = ['Consultation', 'Design', 'Development', 'Maintenance', 'Marketing', 'Other'];

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
          {initialData ? 'Edit Service Package' : 'Add Service Package'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Package Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              placeholder="e.g., Basic Consultation"
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
              placeholder="Brief description of the service"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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

// Modal for booking a service package
const BookingModal = ({ isOpen, onClose, onBook, servicePackage, clients }) => {
  const [bookingData, setBookingData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    paymentMethod: 'Cash'
  });

  const paymentMethods = ['Cash', 'Bank Transfer', 'PayPal', 'Venmo', 'Zelle', 'Check', 'Credit Card'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onBook(bookingData.clientId, servicePackage.id, bookingData);
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
          Book: {servicePackage.name}
        </h3>
        
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-gray-300 text-sm">{servicePackage.description}</p>
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-400">Duration: {Math.floor(servicePackage.duration / 60)}h {servicePackage.duration % 60}m</span>
            <span className="text-emerald-400 font-semibold">${servicePackage.price}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Client</label>
            <select
              value={bookingData.clientId}
              onChange={(e) => setBookingData({...bookingData, clientId: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={bookingData.date}
                onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
              <input
                type="time"
                value={bookingData.time}
                onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
            <select
              value={bookingData.paymentMethod}
              onChange={(e) => setBookingData({...bookingData, paymentMethod: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
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
              Book & Pay
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ServicePackages;