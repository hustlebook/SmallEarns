/**
 * Centralized Tailwind CSS style constants for SmallEarns
 * Ensures consistent styling across all components
 */

// Base component styles
export const buttonBase = "px-4 py-2 rounded-lg font-medium transition-colors duration-200";

// Button variants
export const primaryButton = `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900`;
export const secondaryButton = `${buttonBase} bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900`;
export const dangerButton = `${buttonBase} bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900`;
export const successButton = `${buttonBase} bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900`;

// Modal styles
export const modalBackdrop = "fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm";
export const modalContainer = "bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full border border-emerald-700";
export const modalHeader = "text-xl font-semibold text-gray-100 mb-4";
export const modalContent = "space-y-4";

// Form styles
export const inputBase = "w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
export const selectBase = "w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none";
export const textareaBase = "w-full bg-gray-700 border border-gray-600 text-white p-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none";
export const labelBase = "block text-sm font-medium text-gray-300 mb-1";

// Date input specific styles (mobile optimized)
export const dateInputBase = `${inputBase} min-h-[2.75rem] text-base`;

// Card styles
export const cardBase = "bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg border border-emerald-700";
export const cardHeader = "flex justify-between items-center mb-4";
export const cardTitle = "text-xl font-semibold text-gray-100";

// Table styles
export const tableContainer = "overflow-x-auto";
export const tableBase = "w-full text-left";
export const tableHeader = "bg-gray-700 border-b border-gray-600";
export const tableHeaderCell = "px-4 py-3 text-sm font-medium text-gray-300 uppercase tracking-wider";
export const tableRow = "border-b border-gray-700 hover:bg-gray-700 transition-colors";
export const tableCell = "px-4 py-3 text-sm text-gray-300";

// Status styles
export const statusCompleted = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
export const statusPending = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800";
export const statusCancelled = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";

// Utility styles
export const flexCenter = "flex items-center justify-center";
export const flexBetween = "flex items-center justify-between";
export const textSuccess = "text-emerald-300";
export const textDanger = "text-red-400";
export const textMuted = "text-gray-500";
export const spacingY = "space-y-4";
export const spacingX = "space-x-4";