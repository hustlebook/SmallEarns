import { useState } from 'react';

/**
 * Custom hook for managing modal state and messages
 * @returns Object with modal state and control functions
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  const showAlert = (message: string) => {
    setAlertMessage(message);
  };

  const closeAlert = () => {
    setAlertMessage('');
  };

  const showConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
  };

  const closeConfirm = () => {
    setConfirmMessage('');
    setConfirmAction(null);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    closeConfirm();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    alertMessage,
    showAlert,
    closeAlert,
    confirmMessage,
    showConfirm,
    closeConfirm,
    handleConfirm,
  };
}

/**
 * Custom hook for managing add/edit modal state
 * @returns Object with add/edit modal state and control functions
 */
export function useEditModal<T = any>() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  const startAdding = () => {
    setIsAdding(true);
    setEditingItem(null);
  };

  const startEditing = (item: T) => {
    setEditingItem(item);
    setIsAdding(false);
  };

  const stopEditing = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  const isEditing = editingItem !== null;

  return {
    isAdding,
    isEditing,
    editingItem,
    startAdding,
    startEditing,
    stopEditing,
  };
}