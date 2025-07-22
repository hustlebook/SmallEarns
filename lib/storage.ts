// /client/src/lib/storage.ts
// Centralized storage management and reset functionality

export function resetAppData() {
  try {
    console.log('[Reset] Starting complete app data reset...');
    
    // Clear all localStorage data
    localStorage.clear();
    
    // Optional: Clear IndexedDB if it exists and is supported
    if ('indexedDB' in window && indexedDB.databases) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            console.log(`[Reset] Deleting database: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(error => {
        console.warn('[Reset] IndexedDB cleanup failed:', error);
      });
    }
    
    console.log('[Reset] All data cleared successfully');
    
    // Reload the page to start with fresh state
    window.location.reload();
    
  } catch (error) {
    console.error('[Reset] Reset operation failed:', error);
    alert('Reset failed. Please try refreshing the page manually.');
  }
}

// Storage key constants
export const STORAGE_KEYS = {
  clients: 'smallearns_clients',
  appointments: 'smallearns_appointments', 
  income: 'smallearns_income',
  expenses: 'smallearns_expenses',
  mileage: 'smallearns_mileage',
  invoices: 'smallearns_invoices',
  businessGoals: 'smallearns_business_goals',
  servicePackages: 'smallearns_service_packages'
};

// Generic storage functions
export function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, error);
  }
}

export function loadFromStorage(key: string, defaultValue: any = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[Storage] Failed to load ${key}:`, error);
    return defaultValue;
  }
}

// Export all data for backup purposes
export function exportAllData() {
  try {
    const data = {
      clients: loadFromStorage(STORAGE_KEYS.clients, []),
      appointments: loadFromStorage(STORAGE_KEYS.appointments, []),
      income: loadFromStorage(STORAGE_KEYS.income, []),
      expenses: loadFromStorage(STORAGE_KEYS.expenses, []),
      mileage: loadFromStorage(STORAGE_KEYS.mileage, []),
      invoices: loadFromStorage(STORAGE_KEYS.invoices, []),
      businessGoals: loadFromStorage(STORAGE_KEYS.businessGoals, []),
      servicePackages: loadFromStorage(STORAGE_KEYS.servicePackages, []),
      exportDate: new Date().toISOString()
    };
    
    return data;
  } catch (error) {
    console.error('[Storage] Export failed:', error);
    return null;
  }
}