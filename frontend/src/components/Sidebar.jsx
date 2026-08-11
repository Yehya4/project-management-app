import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Settings,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles,
  Layers
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

  const getMainLinks = () => {
    const dashboardLink = { path: '/', name: 'Tableau de bord', icon: <LayoutDashboard size={20} /> };
    const projectsLink = { path: '/projects', name: 'Projets', icon: <FolderKanban size={20} /> };
    const messagesLink = { path: '/messages', name: 'Messagerie', icon: <MessageSquare size={20} /> };

    switch (user?.role) {
      case 'User':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Mes Demandes SI', icon: <FileText size={20} /> },
          projectsLink,
          messagesLink
        ];
      case 'Project Manager':
      case 'Sponsor':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Demandes SI', icon: <FileText size={20} /> },
          projectsLink,
          messagesLink
        ];
      case 'Developer':
      case 'Tester':
      case 'Chef Testeur':
        return [
          dashboardLink,
          projectsLink,
          messagesLink
        ];
      case 'Admin':
        return [
          dashboardLink,
          { path: '/demande-si', name: 'Demandes SI', icon: <FileText size={20} /> },
          projectsLink,
          messagesLink
        ];
      case 'Responsable Infra':
      default:
        return [dashboardLink, projectsLink, messagesLink];
    }
  };

  const getAdminLinks = () => {
    if (user?.role === 'Admin') {
      return [
        { path: '/users', name: 'Utilisateurs', icon: <Users size={20} /> },
        { path: '/settings', name: 'Paramètres', icon: <Settings size={20} /> }
      ];
    }
    return [];
  };

  const mainLinks = getMainLinks();
  const adminLinks = getAdminLinks();

  if (!user) return null;

  return (
    <aside
      className={`h-screen bg-slate-900 text-slate-300 flex flex-col sticky top-0 z-40 shadow-2xl transition-all duration-300 relative border-r border-slate-800 ${
        isOpen ? 'w-72' : 'w-20'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3.5 top-7 bg-slate-800 border border-slate-700 text-slate-300 rounded-full p-1.5 hover:bg-blue-600 hover:text-white shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center"
        title={isOpen ? "Réduire le menu" : "Agrandir le menu"}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Brand Header */}
      <div className="h-20 flex items-center px-4 border-b border-slate-800/80 overflow-hidden shrink-0">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 text-lg font-black shrink-0 relative group">
            AP
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div className={`flex flex-col whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
            <div className="flex items-center gap-1.5">
              <h1 className="text-white font-extrabold text-lg tracking-tight">Auto Project</h1>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Enterprise Workspace</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Main Section */}
        <div>
          {isOpen && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Navigation
            </p>
          )}
          <nav className="space-y-1">
            {mainLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === '/'}
                title={!isOpen ? link.name : ''}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isOpen ? 'px-3.5 py-3' : 'px-0 py-3 justify-center w-11 mx-auto'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                      {link.icon}
                    </span>
                    <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                      {link.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Administration Section (if Admin) */}
        {adminLinks.length > 0 && (
          <div>
            {isOpen && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Shield size={12} className="text-blue-400" /> Administration
              </p>
            )}
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  title={!isOpen ? link.name : ''}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isOpen ? 'px-3.5 py-3' : 'px-0 py-3 justify-center w-11 mx-auto'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                        {link.icon}
                      </span>
                      <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                        {link.name}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Profile Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className={`flex items-center gap-3 transition-all duration-300 ${isOpen ? 'mb-3' : 'mb-2 justify-center'}`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
            {(user.prenom || user.nom || user.name)?.charAt(0)}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {user.prenom ? `${user.prenom} ${user.nom}` : user.name}
              </span>
              <span className="text-[11px] font-semibold text-blue-400 truncate">
                {user.role}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={!isOpen ? "Déconnexion" : ""}
          className={`flex items-center justify-center gap-2 text-xs font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-600 hover:text-white border border-rose-900/50 rounded-xl transition-all duration-200 ${
            isOpen ? 'w-full py-2.5 px-3' : 'w-10 h-10 p-0 mx-auto'
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {isOpen && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;