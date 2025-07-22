import { z } from 'zod';

// Client validation schema
export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  totalRevenue: z.number().min(0).default(0),
  lastVisit: z.string().optional().or(z.literal('')),
  createdAt: z.string().optional()
});

// Appointment validation schema
export const appointmentSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  clientName: z.string().min(1, 'Client name is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  service: z.string().min(1, 'Service is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  price: z.number().min(0, 'Price must be positive'),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional().or(z.literal('')),
  createdAt: z.string().optional()
});

// Income validation schema
export const incomeSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional().or(z.literal('')),
  clientName: z.string().min(1, 'Client name is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  service: z.string().min(1, 'Service is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional().or(z.literal('')),
  createdAt: z.string().optional()
});

// Expense validation schema
export const expenseSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional().or(z.literal('')),
  createdAt: z.string().optional()
});

// Mileage validation schema
export const mileageSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  miles: z.number().min(0.1, 'Miles must be greater than 0'),
  purpose: z.string().min(1, 'Purpose is required'),
  createdAt: z.string().optional()
});

// Invoice validation schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
  amount: z.number().min(0, 'Amount must be positive')
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().optional().or(z.literal('')),
  clientName: z.string().min(1, 'Client name is required'),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional().or(z.literal('')),
  createdAt: z.string().optional()
});

// Business goal validation schema
export const businessGoalSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['revenue', 'clients', 'appointments']),
  target: z.number().min(1, 'Target must be greater than 0'),
  current: z.number().min(0).default(0),
  period: z.enum(['monthly', 'yearly']),
  createdAt: z.string().optional()
});

// Recurring appointment validation schema
export const recurringAppointmentSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  clientName: z.string().min(1, 'Client name is required'),
  service: z.string().min(1, 'Service is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  price: z.number().min(0, 'Price must be positive'),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().min(1, 'Time is required'),
  nextDate: z.string().min(1, 'Next date is required'),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional()
});

// Type exports
export type ClientFormData = z.infer<typeof clientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type MileageFormData = z.infer<typeof mileageSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type BusinessGoalFormData = z.infer<typeof businessGoalSchema>;
export type RecurringAppointmentFormData = z.infer<typeof recurringAppointmentSchema>;