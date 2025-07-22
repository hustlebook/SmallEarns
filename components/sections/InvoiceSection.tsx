import React, { useState, useEffect } from 'react';
import { Plus, FileText, Send, Eye, Download, DollarSign, Calendar, Search, Filter, ChevronDown } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface InvoiceSectionProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  clients: Client[];
}

const InvoiceSection: React.FC<InvoiceSectionProps> = ({
  invoices,
  setInvoices,
  clients
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newInvoice, setNewInvoice] = useState({
    // Business Information
    businessName: '',
    businessAddress: '',
    businessContact: '',
    businessTaxId: '',
    
    // Client Information
    clientId: '',
    clientAddress: '',
    clientContact: '',
    clientTaxId: '',
    
    // Invoice Details
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    serviceDate: '',
    
    // Items and Pricing
    items: [{ description: '', quantity: 1, rate: 0 }],
    tax: 0,
    discountAmount: 0,
    
    // Payment Information
    paymentTerms: '',
    paymentMethods: '',
    paymentInstructions: '',
    latePaymentPolicy: '',
    earlyPaymentDiscount: '',
    
    // Additional Details
    notes: '',
    termsAndConditions: ''
  });

  // Calculate due date (30 days from invoice date)
  useEffect(() => {
    if (newInvoice.date) {
      const invoiceDate = new Date(newInvoice.date);
      invoiceDate.setDate(invoiceDate.getDate() + 30);
      setNewInvoice(prev => ({
        ...prev,
        dueDate: invoiceDate.toISOString().split('T')[0]
      }));
    }
  }, [newInvoice.date]);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const clientName = client?.name || 'Unknown';
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalDraft = invoices.filter(i => i.status === 'draft').reduce((sum, i) => sum + i.total, 0);
  const totalSent = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  const calculateItemTotal = (index: number) => {
    const item = newInvoice.items[index];
    return item.quantity * item.rate;
  };

  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - (newInvoice.discountAmount || 0);
    const taxAmount = afterDiscount * (newInvoice.tax / 100);
    return afterDiscount + taxAmount;
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = invoices.length + 1;
    return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  const addItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const invoice: Invoice = {
      id: `invoice_${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      ...newInvoice,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      status: 'draft',
      items: newInvoice.items.map((item, index) => ({
        id: `item_${index}`,
        ...item,
        amount: item.quantity * item.rate
      }))
    };

    const updatedInvoices = [...invoices, invoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('smallearns_invoices', JSON.stringify(updatedInvoices));

    // Reset form
    setNewInvoice({
      // Business Information
      businessName: '',
      businessAddress: '',
      businessContact: '',
      businessTaxId: '',
      
      // Client Information
      clientId: '',
      clientAddress: '',
      clientContact: '',
      clientTaxId: '',
      
      // Invoice Details
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      serviceDate: '',
      
      // Items and Pricing
      items: [{ description: '', quantity: 1, rate: 0 }],
      tax: 0,
      discountAmount: 0,
      
      // Payment Information
      paymentTerms: '',
      paymentMethods: '',
      paymentInstructions: '',
      latePaymentPolicy: '',
      earlyPaymentDiscount: '',
      
      // Additional Details
      notes: '',
      termsAndConditions: ''
    });
    setShowForm(false);
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    const updatedInvoices = invoices.map(invoice =>
      invoice.id === invoiceId ? { ...invoice, status } : invoice
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('smallearns_invoices', JSON.stringify(updatedInvoices));
  };

  const deleteInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
    setInvoices(updatedInvoices);
    localStorage.setItem('smallearns_invoices', JSON.stringify(updatedInvoices));
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400 bg-gray-600/20';
      case 'sent': return 'text-blue-400 bg-blue-600/20';
      case 'paid': return 'text-green-400 bg-green-600/20';
      case 'overdue': return 'text-red-400 bg-red-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-gray-400">Create and manage professional invoices</p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-600/10 border border-emerald-700 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-yellow-300">${totalDraft.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Draft</div>
          </div>
          <div className="bg-gray-600/10 border border-emerald-700 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-300">${totalSent.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Sent</div>
          </div>
          <div className="bg-gray-600/10 border border-emerald-700 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-emerald-300">${totalPaid.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Paid</div>
          </div>
          <div className="bg-gray-600/10 border border-emerald-700 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-red-300">${totalOverdue.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Overdue</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Mobile: Stack all elements */}
        <div className="flex flex-col lg:hidden gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by client or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.75 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>

        {/* Desktop: Compact layout with search, status filter, and button */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by client or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.75 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.75 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Invoice Form */}
      {showForm && (
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <FileText className="text-emerald-400" size={20} />
            <span>Create New Invoice</span>
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">1</span>
                <span>Your Business Information</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={newInvoice.businessName}
                    onChange={(e) => setNewInvoice({...newInvoice, businessName: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Tax ID/EIN</label>
                  <input
                    type="text"
                    value={newInvoice.businessTaxId}
                    onChange={(e) => setNewInvoice({...newInvoice, businessTaxId: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Address *</label>
                  <textarea
                    required
                    rows={3}
                    value={newInvoice.businessAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, businessAddress: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="123 Business St, City, State ZIP"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Contact Info *</label>
                  <input
                    type="text"
                    required
                    value={newInvoice.businessContact}
                    onChange={(e) => setNewInvoice({...newInvoice, businessContact: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Phone: (555) 123-4567 | Email: business@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Client Information Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">2</span>
                <span>Client Information</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client *</label>
                  <select
                    required
                    value={newInvoice.clientId}
                    onChange={(e) => setNewInvoice({...newInvoice, clientId: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client Tax ID (if applicable)</label>
                  <input
                    type="text"
                    value={newInvoice.clientTaxId}
                    onChange={(e) => setNewInvoice({...newInvoice, clientTaxId: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Client's tax ID"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client Address *</label>
                  <textarea
                    required
                    rows={3}
                    value={newInvoice.clientAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, clientAddress: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="123 Client St, City, State ZIP"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Client Contact Info</label>
                  <input
                    type="text"
                    value={newInvoice.clientContact}
                    onChange={(e) => setNewInvoice({...newInvoice, clientContact: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Phone: (555) 123-4567 | Email: client@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">3</span>
                <span>Invoice Details</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={newInvoice.date}
                    onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Service Date</label>
                  <input
                    type="date"
                    value={newInvoice.serviceDate}
                    onChange={(e) => setNewInvoice({...newInvoice, serviceDate: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Services/Items Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">4</span>
                <span>Services & Items</span>
              </h4>
              
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">Itemized Services</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Add Item</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {newInvoice.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">${calculateItemTotal(index).toFixed(2)}</span>
                      {newInvoice.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Terms Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">5</span>
                <span>Payment & Terms</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payment Terms *</label>
                  <select
                    required
                    value={newInvoice.paymentTerms}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentTerms: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select payment terms</option>
                    <option value="Due upon receipt">Due upon receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Partial upfront">50% upfront, 50% on completion</option>
                    <option value="Custom">Custom terms</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payment Methods</label>
                  <input
                    type="text"
                    value={newInvoice.paymentMethods}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentMethods: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Check, Bank Transfer, Credit Card, PayPal"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payment Instructions</label>
                  <textarea
                    rows={2}
                    value={newInvoice.paymentInstructions}
                    onChange={(e) => setNewInvoice({...newInvoice, paymentInstructions: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Please make checks payable to Business Name. Bank transfers to Account #..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Late Payment Policy</label>
                  <input
                    type="text"
                    value={newInvoice.latePaymentPolicy}
                    onChange={(e) => setNewInvoice({...newInvoice, latePaymentPolicy: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="1.5% per month on overdue amounts"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Early Payment Discount</label>
                  <input
                    type="text"
                    value={newInvoice.earlyPaymentDiscount}
                    onChange={(e) => setNewInvoice({...newInvoice, earlyPaymentDiscount: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="2% discount if paid within 10 days"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details & Legal Section */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs text-white">6</span>
                <span>Financial Details</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={newInvoice.tax}
                    onChange={(e) => setNewInvoice({...newInvoice, tax: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Discount Amount ($)</label>
                  <input
                    type="number"
                    value={newInvoice.discountAmount}
                    onChange={(e) => setNewInvoice({...newInvoice, discountAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
                  <input
                    type="text"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Special instructions..."
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={newInvoice.termsAndConditions}
                    onChange={(e) => setNewInvoice({...newInvoice, termsAndConditions: e.target.value})}
                    className="w-full px-4 py-2.75 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Work is guaranteed for 30 days. Client agrees to these terms upon acceptance of services..."
                  />
                </div>
              </div>
            </div>

            {/* Invoice Total Summary */}
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <DollarSign className="text-emerald-400" size={20} />
                <span>Invoice Summary</span>
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="text-white">${calculateSubtotal().toFixed(2)}</span>
                </div>
                
                {newInvoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Discount:</span>
                    <span className="text-red-400">-${newInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Tax ({newInvoice.tax}%):</span>
                  <span className="text-white">${((calculateSubtotal() - (newInvoice.discountAmount || 0)) * newInvoice.tax / 100).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-lg font-bold border-t border-emerald-700 pt-3 mt-3">
                  <span className="text-white">Total Amount Due:</span>
                  <span className="text-emerald-400">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No invoices yet</h3>
            <p className="text-gray-400 mb-4">Create professional invoices to get paid faster</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200"
            >
              Create Your First Invoice
            </button>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div key={invoice.id} className="bg-gray-800 border border-gray-600 rounded-xl p-6 hover:border-emerald-500/30 transition-colors duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-white font-semibold">{invoice.invoiceNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 mb-1">{getClientName(invoice.clientId)}</div>
                  <div className="text-sm text-gray-400">
                    Issued: {invoice.date} • Due: {invoice.dueDate}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">${invoice.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === 'sent' && (
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                    >
                      Delete
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

export default InvoiceSection;