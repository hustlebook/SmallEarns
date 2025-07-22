import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Enhanced schema for business features
export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  serviceNotes: text("service_notes"),
  lastVisitDate: text("last_visit_date"),
});

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  clientId: text("client_id"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  service: text("service").notNull(),
  status: text("status").notNull(),
  duration: integer("duration"), // in minutes
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  notes: text("notes"),
});

export const incomeEntries = pgTable("income_entries", {
  id: text("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  method: text("method").notNull(),
  notes: text("notes"),
  clientId: text("client_id"),
  appointmentId: text("appointment_id"),
  taxable: boolean("taxable").default(true),
});

export const expenses = pgTable("expenses", {
  id: text("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  taxDeductible: boolean("tax_deductible").default(true),
  mileage: decimal("mileage", { precision: 8, scale: 2 }), // for mileage expenses
});

export const mileageEntries = pgTable("mileage_entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  miles: decimal("miles", { precision: 8, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  clientId: text("client_id"),
  rate: decimal("rate", { precision: 5, scale: 3 }).default("0.670"), // IRS 2024 rate
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: text("client_id").notNull(),
  date: text("date").notNull(),
  dueDate: text("due_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // draft, sent, paid, overdue
  notes: text("notes"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
});

// Zod schemas for validation
export const insertClientSchema = createInsertSchema(clients);
export const insertAppointmentSchema = createInsertSchema(appointments);
export const insertIncomeEntrySchema = createInsertSchema(incomeEntries);
export const insertExpenseSchema = createInsertSchema(expenses);
export const insertMileageEntrySchema = createInsertSchema(mileageEntries);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems);

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type InsertIncomeEntry = z.infer<typeof insertIncomeEntrySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type MileageEntry = typeof mileageEntries.$inferSelect;
export type InsertMileageEntry = z.infer<typeof insertMileageEntrySchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Common expense categories for consistency
export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Software & Tools',
  'Travel & Mileage',
  'Professional Services',
  'Marketing & Advertising',
  'Equipment',
  'Phone & Internet',
  'Rent & Utilities',
  'Meals & Entertainment',
  'Other'
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Bank Transfer',
  'PayPal',
  'Venmo',
  'Zelle',
  'Credit Card',
  'Other'
] as const;
