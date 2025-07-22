import React from 'react';
import { motion } from 'framer-motion';

const SectionLoader = ({ section = 'content' }) => {
  const getIcon = () => {
    switch (section) {
      case 'dashboard':
        return '📊';
      case 'clients':
        return '👥';
      case 'appointments':
        return '📅';
      case 'income':
        return '💰';
      case 'expenses':
        return '🧾';
      default:
        return '⏳';
    }
  };

  return (
    <div className="flex items-center justify-center p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-4xl mb-4"
        >
          {getIcon()}
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-gray-400"
        >
          Loading {section}...
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SectionLoader;