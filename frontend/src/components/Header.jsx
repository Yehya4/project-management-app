import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Check, X, Info } from 'lucide-react';
import { useAuth, useNotifications } from '../context/AppContext';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { notifications, markAllAsRead, markAsRead, deleteNotification } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white box-content"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <Check size={14} /> Tout marquer comme lu
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                              {notif.date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.isRead && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1 self-start rounded-md hover:bg-rose-50"
                          title="Supprimer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Bell size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Aucune notification pour le moment</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
                  <button className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
