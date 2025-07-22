import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Client, 
  Appointment, 
  IncomeEntry, 
  ExpenseEntry, 
  MileageEntry, 
  InvoiceEntry, 
  BusinessGoal, 
  RecurringAppointment 
} from '../types/Business';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../lib/storage';

interface BusinessState {
  clients: Client[];
  appointments: Appointment[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  mileage: MileageEntry[];
  invoices: InvoiceEntry[];
  goals: BusinessGoal[];
  recurringAppointments: RecurringAppointment[];
  currentSection: string;
  filters: {
    startDate: string;
    endDate: string;
    category: string;
    client: string;
  };
}

type BusinessAction = 
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<BusinessState['filters']> }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'DELETE_APPOINTMENT'; payload: string }
  | { type: 'ADD_INCOME'; payload: IncomeEntry }
  | { type: 'UPDATE_INCOME'; payload: IncomeEntry }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: ExpenseEntry }
  | { type: 'UPDATE_EXPENSE'; payload: ExpenseEntry }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'LOAD_DATA'; payload: Partial<BusinessState> };

const initialState: BusinessState = {
  clients: [],
  appointments: [],
  income: [],
  expenses: [],
  mileage: [],
  invoices: [],
  goals: [],
  recurringAppointments: [],
  currentSection: 'dashboard',
  filters: {
    startDate: '',
    endDate: '',
    category: 'All',
    client: 'All'
  }
};

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, currentSection: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? action.payload : client
        )
      };
    
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter(client => client.id !== action.payload)
      };
    
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(appointment => 
          appointment.id === action.payload.id ? action.payload : appointment
        )
      };
    
    case 'DELETE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter(appointment => appointment.id !== action.payload)
      };
    
    case 'ADD_INCOME':
      return { ...state, income: [...state.income, action.payload] };
    
    case 'UPDATE_INCOME':
      return {
        ...state,
        income: state.income.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        )
      };
    
    case 'DELETE_INCOME':
      return {
        ...state,
        income: state.income.filter(entry => entry.id !== action.payload)
      };
    
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(entry => 
          entry.id === action.payload.id ? action.payload : entry
        )
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(entry => entry.id !== action.payload)
      };
    
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

const BusinessContext = createContext<{
  state: BusinessState;
  dispatch: React.Dispatch<BusinessAction>;
} | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(businessReducer, initialState);

  // Load data from centralized storage on mount
  useEffect(() => {
    const loadedData = {
      clients: loadFromStorage(STORAGE_KEYS.CLIENTS, []),
      appointments: loadFromStorage(STORAGE_KEYS.APPOINTMENTS, []),
      income: loadFromStorage(STORAGE_KEYS.INCOME, []),
      expenses: loadFromStorage(STORAGE_KEYS.EXPENSES, []),
      mileage: loadFromStorage(STORAGE_KEYS.MILEAGE, []),
      invoices: loadFromStorage(STORAGE_KEYS.INVOICES, []),
      goals: loadFromStorage(STORAGE_KEYS.GOALS, []),
      recurringAppointments: loadFromStorage(STORAGE_KEYS.RECURRING_APPOINTMENTS, [])
    };
    
    dispatch({ type: 'LOAD_DATA', payload: loadedData });
  }, []);

  // Save data to centralized storage whenever state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CLIENTS, state.clients);
  }, [state.clients]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, state.appointments);
  }, [state.appointments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INCOME, state.income);
  }, [state.income]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPENSES, state.expenses);
  }, [state.expenses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MILEAGE, state.mileage);
  }, [state.mileage]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVOICES, state.invoices);
  }, [state.invoices]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GOALS, state.goals);
  }, [state.goals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RECURRING_APPOINTMENTS, state.recurringAppointments);
  }, [state.recurringAppointments]);

  return (
    <BusinessContext.Provider value={{ state, dispatch }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}