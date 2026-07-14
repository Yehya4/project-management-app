import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  GitMerge,
  PieChart,
  LogOut,
  Settings,
  MessageSquare,
  Files,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AppContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    const dashboardLink = {
      path: '/',
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />
    };

    const commonLinks = [
      { path: '/messages', name: 'Messagerie', icon: <MessageSquare size={20} /> },
      { path: '/projects', name: 'Projets', icon: <FolderKanban size={20} /> }
    ];

    switch (user?.role) {
      case 'Developer':
      case 'Tester':
      case 'Chef Testeur':
        return [
          dashboardLink,
          ...commonLinks
        ];

      case 'User':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Mes Demandes SI', icon: <FileText size={20} /> },
          ...commonLinks
        ];

      case 'Project Manager':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Demandes SI', icon: <FileText size={20} /> },
          ...commonLinks,
        ];

      case 'Sponsor':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Demandes SI', icon: <FileText size={20} /> },
          ...commonLinks,
          { path: '/reports', name: 'Rapports Stratégiques', icon: <PieChart size={20} /> }
        ];

      case 'Admin':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Demandes SI', icon: <FileText size={20} /> },
          ...commonLinks,
          { path: '/reports', name: 'Rapports Stratégiques', icon: <PieChart size={20} /> },
          { path: '/users', name: 'Utilisateurs', icon: <Users size={20} /> },
          { path: '/workflow', name: 'Workflows', icon: <GitMerge size={20} /> },
          { path: '/settings', name: 'Paramètres', icon: <Settings size={20} /> }
        ];

      default:
        return [dashboardLink, ...commonLinks];
    }
  };

  const links = getLinks();

  if (!user) return null;

  return (
    <aside
      className={`h-screen bg-white/95 backdrop-blur-sm border-r border-slate-200 flex flex-col sticky top-0 z-40 shadow-sm transition-all duration-300 relative ${isOpen ? 'w-72' : 'w-20'}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3.5 top-8 bg-white border border-slate-200 text-slate-600 rounded-full p-1.5 hover:bg-blue-50 hover:text-blue-600 shadow-sm transition-all hover:scale-110 z-50 flex items-center justify-center"
      >
        {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      <div className="h-20 flex items-center px-4 border-b border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 text-lg font-black tracking-tighter shrink-0 mx-auto">
            AH
          </div>
          <div className={`flex flex-col whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-40' : 'opacity-0 w-0'}`}>
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-600 font-black text-xl tracking-tight leading-tight">Auto Hall</h1>
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Workspace</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-3">
        <div className={`rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-sm flex items-center transition-all duration-300 overflow-hidden mx-auto ${isOpen ? 'p-4 w-full h-auto' : 'p-0 w-11 h-11 justify-center'}`}>
          {isOpen ? (
            <div className="whitespace-nowrap flex-1">
              <p className="text-xs text-slate-300 mb-0.5">Session active</p>
              <p className="font-semibold text-sm truncate">{user.nom ? `${user.nom} ${user.prenom}` : user.name}</p>
            </div>
          ) : (
            <p className="font-semibold text-sm">{(user.nom || user.name)?.charAt(0)}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/'}
            title={!isOpen ? link.name : ''}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl text-sm font-medium transition-all duration-300 ${isOpen ? 'px-4 py-3' : 'px-0 py-3 justify-center w-11 mx-auto'} ${isActive
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`
            }
          >
            <span className="transition-transform duration-300 group-hover:scale-110 shrink-0">
              {link.icon}
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
              {link.name}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className={`flex items-center gap-3 rounded-2xl transition-all duration-300 overflow-hidden mx-auto ${isOpen ? 'p-3 w-full bg-white border border-slate-200 mb-4' : 'p-0 w-11 bg-transparent border-none mb-3'}`}>
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0 mx-auto uppercase">
            {(user.nom || user.name)?.charAt(0)}
          </div>
          <div className={`flex flex-col min-w-0 whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-32' : 'opacity-0 w-0'}`}>
            <span className="text-sm font-semibold text-slate-900 truncate">{user.nom ? `${user.nom} ${user.prenom}` : user.name}</span>
            <span className="text-xs text-slate-500 truncate">{user.role}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title={!isOpen ? "Déconnexion" : ""}
          className={`flex items-center justify-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all duration-300 mx-auto ${isOpen ? 'w-full px-4 py-3' : 'w-11 h-11 p-0'}`}
        >
          <LogOut size={17} className="shrink-0" />
          <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}`}>
            Déconnexion
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;