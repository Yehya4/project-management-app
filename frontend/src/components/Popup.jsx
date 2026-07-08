import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Popup = ({ isOpen, title, message, type = 'success', onClose, onConfirm }) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="text-emerald-500 w-12 h-12" />,
    error: <XCircle className="text-rose-500 w-12 h-12" />,
    info: <Info className="text-blue-500 w-12 h-12" />,
    warning: <AlertTriangle className="text-amber-500 w-12 h-12" />
  };

  const bgColors = {
    success: 'bg-emerald-50',
    error: 'bg-rose-50',
    info: 'bg-blue-50',
    warning: 'bg-amber-50'
  };

  const buttonColors = {
    success: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    error: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className={`mx-auto w-20 h-20 rounded-full ${bgColors[type]} flex items-center justify-center mb-6`}>
            {icons[type]}
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {title}
          </h3>
          
          <p className="text-slate-500 text-sm mb-8">
            {message}
          </p>

          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            className={`w-full py-3 px-4 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColors[type]}`}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
