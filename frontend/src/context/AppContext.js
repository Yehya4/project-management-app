import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';




const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('autoHallUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('autoHallToken') || null;
  });

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('autoHallUser', JSON.stringify(userData));
    localStorage.setItem('autoHallToken', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('autoHallUser');
    localStorage.removeItem('autoHallToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};





const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      const newSocket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}`, { auth: { token } });
      setSocket(newSocket);

      if (user) {
        newSocket.emit('register_user', {
          userId: user.id,
          role: user.role,
          fullName: `${user.prenom || ''} ${user.nom || ''}`.trim()
        });
      }

      return () => newSocket.close();
    }
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Erreur fetch users', err);
    }
  };

  const addUser = async (newUser) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => [data, ...prev]);
      }
    } catch (err) {
      console.error('Erreur ajout user', err);
    }
  };

  const updateUser = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, ...updatedData } : user
        ));
      }
    } catch (err) {
      console.error('Erreur mise à jour user', err);
    }
  };

  const archiveUser = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/archive`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, archived: true } : user
        ));
      }
    } catch (err) {
      console.error('Erreur archive user', err);
    }
  };

  const restoreUser = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, archived: false } : user
        ));
      }
    } catch (err) {
      console.error('Erreur restore user', err);
    }
  };

  const activeUsers = users.filter(u => !u.archived);
  const archivedUsers = users.filter(u => u.archived);

  return (
    <UserContext.Provider value={{ 
      users: activeUsers, 
      archivedUsers, 
      addUser, 
      updateUser, 
      archiveUser, 
      restoreUser,
      fetchUsers
    }}>
      {children}
    </UserContext.Provider>
  );
};




const ConfigContext = createContext();
export const useConfig = () => useContext(ConfigContext);

const DEFAULT_CONFIG = {
  domaines: [],
  categoriesProjet: [],
  categories: [],
  services: [],
  servicesProjet: [],
  natureBesoin: [],
  benefices: []
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [archivedConfig, setArchivedConfig] = useState(DEFAULT_CONFIG);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/config`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfig(prev => ({ ...prev, ...data.config }));
        setArchivedConfig(prev => ({ ...prev, ...data.archivedConfig }));
      }
    } catch (err) {
      console.error('Erreur fetch config', err);
    }
  };

  const updateConfigApi = async (key, newList, newArchivedList) => {
    try {
      await fetch(`${API_URL}/${key}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ list: newList, archivedList: newArchivedList })
      });
    } catch (err) {
      console.error('Erreur update config', err);
    }
  };

  const updateConfig = (key, newList) => {
    const newArchivedList = archivedConfig[key] || [];
    setConfig(prev => ({ ...prev, [key]: newList }));
    updateConfigApi(key, newList, newArchivedList);
  };

  const archiveConfigItem = (key, item) => {
    const newList = (config[key] || []).filter(i => i !== item);
    const newArchivedList = [...(archivedConfig[key] || []), item];
    
    setConfig(prev => ({ ...prev, [key]: newList }));
    setArchivedConfig(prev => ({ ...prev, [key]: newArchivedList }));
    
    updateConfigApi(key, newList, newArchivedList);
  };

  const restoreConfigItem = (key, item) => {
    const newArchivedList = (archivedConfig[key] || []).filter(i => i !== item);
    const newList = [...(config[key] || []), item];
    
    setArchivedConfig(prev => ({ ...prev, [key]: newArchivedList }));
    setConfig(prev => ({ ...prev, [key]: newList }));
    
    updateConfigApi(key, newList, newArchivedList);
  };

  return (
    <ConfigContext.Provider value={{ config, archivedConfig, updateConfig, archiveConfigItem, restoreConfigItem, fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};




const DemandeContext = createContext();
export const useDemandes = () => useContext(DemandeContext);

export const DemandeProvider = ({ children }) => {
  const [demandes, setDemandes] = useState([]);
  const { token, logout } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/demandes`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchDemandes();
    }
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('demande_created', (newDemande) => {
      setDemandes(prev => {
        if (prev.some(d => d.id === newDemande.id)) {
          return prev;
        }
        return [newDemande, ...prev];
      });
    });
    
    socket.on('demande_updated', (updatedData) => {
      setDemandes(prev => prev.map(d => d.id === updatedData.id ? { ...d, ...updatedData } : d));
    });
    
    socket.on('demande_deleted', ({ id, archived }) => {
      if (archived) {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, is_archived: 1 } : d));
      } else {
        setDemandes(prev => prev.filter(d => d.id !== id));
      }
    });

    socket.on('demande_restored', ({ id }) => {
      setDemandes(prev => prev.map(d => d.id === id ? { ...d, is_archived: 0 } : d));
    });
    
    return () => {
      socket.off('demande_created');
      socket.off('demande_updated');
      socket.off('demande_deleted');
      socket.off('demande_restored');
    };
  }, [socket]);

  const fetchDemandes = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        if (logout) logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDemandes(data);
      }
    } catch (err) {
      console.error('Erreur fetch demandes', err);
    }
  };

  const addDemande = async (nouvelleDemande) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(nouvelleDemande)
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          if (logout) logout();
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      setDemandes(prev => {
        if (prev.some(d => d.id === data.id)) return prev;
        return [data, ...prev];
      });
      return data;
    } catch (err) {
      console.error('Erreur ajout demande', err);
      throw err; // Repropage pour que l'UI puisse afficher l'erreur
    }
  };

  const updateDemande = async (id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          if (logout) logout();
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur (${res.status})`);
      }
      const data = await res.json();
      setDemandes(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      return data;
    } catch (err) {
      console.error('Erreur mise à jour demande', err);
      throw err;
    }
  };

  const updateDemandeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ statut: newStatus })
      });
      if (res.ok) {
        setDemandes(prev => prev.map(d => 
          d.id === id ? { ...d, statut: newStatus } : d
        ));
      }
    } catch (err) {
      console.error('Erreur mise à jour statut demande', err);
    }
  };

  const deleteDemande = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, is_archived: 1 } : d));
      }
    } catch (err) {
      console.error('Erreur suppression demande', err);
    }
  };

  const restoreDemande = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setDemandes(prev => prev.map(d => d.id === id ? { ...d, is_archived: 0 } : d));
      }
    } catch (err) {
      console.error('Erreur restauration demande', err);
    }
  };

  const activeDemandes = demandes.filter(d => !d.is_archived);
  const archivedDemandes = demandes.filter(d => d.is_archived);

  return (
    <DemandeContext.Provider value={{ 
      demandes: activeDemandes, 
      archivedDemandes, 
      addDemande, 
      updateDemande, 
      updateDemandeStatus, 
      deleteDemande, 
      restoreDemande,
      fetchDemandes 
    }}>
      {children}
    </DemandeContext.Provider>
  );
};




const CharterContext = createContext();
export const useCharter = () => useContext(CharterContext);

export const CharterProvider = ({ children }) => {
  const [charters, setCharters] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/charters`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchCharters();
    }
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('charter_created', (newCharter) => {
      setCharters(prev => {
        if (!prev.find(c => c.demandeId === newCharter.demandeId)) {
          return [newCharter, ...prev];
        }
        return prev;
      });
    });
    
    socket.on('charter_updated', (updatedData) => {
      setCharters(prev => {
        const exists = prev.find(c => c.demandeId === updatedData.demandeId);
        if (exists) {
          return prev.map(c => c.demandeId === updatedData.demandeId ? { ...c, ...updatedData } : c);
        } else {
          return [updatedData, ...prev];
        }
      });
    });
    
    socket.on('charter_deleted', ({ demandeId, archived }) => {
      if (archived) {
        setCharters(prev => prev.map(c => c.demandeId === demandeId ? { ...c, is_archived: 1 } : c));
      } else {
        setCharters(prev => prev.filter(c => c.demandeId !== demandeId));
      }
    });

    socket.on('charter_restored', ({ demandeId }) => {
      setCharters(prev => prev.map(c => c.demandeId === demandeId ? { ...c, is_archived: 0 } : c));
    });
    
    return () => {
      socket.off('charter_created');
      socket.off('charter_updated');
      socket.off('charter_deleted');
      socket.off('charter_restored');
    };
  }, [socket]);

  const fetchCharters = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCharters(data);
      }
    } catch (err) {
      console.error('Erreur fetch charters', err);
    }
  };

  const saveCharter = async (charterData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(charterData)
      });
      if (res.ok) {
        const savedData = await res.json();
        setCharters(prev => {
          const exists = prev.find(c => c.demandeId === savedData.demandeId);
          if (exists) {
            return prev.map(c => c.demandeId === savedData.demandeId ? savedData : c);
          }
          return [...prev, savedData];
        });
        return savedData;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur (${res.status})`);
      }
    } catch (err) {
      console.error('Erreur save charter', err);
      throw err;
    }
  };

  const getCharterByDemandeId = (demandeId) => {
    return charters.find(c => c.demandeId === demandeId) || null;
  };

  const deleteCharter = async (demandeId) => {
    try {
      const res = await fetch(`${API_URL}/${demandeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setCharters(prev => prev.map(c => c.demandeId === demandeId ? { ...c, is_archived: 1 } : c));
      }
    } catch (err) {
      console.error('Erreur suppression charter', err);
    }
  };

  const restoreCharter = async (demandeId) => {
    try {
      const res = await fetch(`${API_URL}/${demandeId}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setCharters(prev => prev.map(c => c.demandeId === demandeId ? { ...c, is_archived: 0 } : c));
      }
    } catch (err) {
      console.error('Erreur restauration charter', err);
    }
  };

  const activeCharters = charters.filter(c => !c.is_archived);
  const archivedCharters = charters.filter(c => c.is_archived);

  return (
    <CharterContext.Provider value={{ 
      charters: activeCharters, 
      archivedCharters, 
      saveCharter, 
      getCharterByDemandeId, 
      fetchCharters, 
      deleteCharter,
      restoreCharter
    }}>
      {children}
    </CharterContext.Provider>
  );
};




const ProjectContext = createContext();
export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/projects`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.on('project_updated', (updatedProject) => {
        setProjects(prev => {
          const exists = prev.find(p => p.id === updatedProject.id);
          if (exists) {
            return prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
          } else {
            return [updatedProject, ...prev];
          }
        });
      });
      socket.on('project_deleted', ({ id, archived }) => {
        if (archived) {
          setProjects(prev => prev.map(p => p.id === id ? { ...p, is_archived: 1 } : p));
        } else {
          setProjects(prev => prev.filter(p => p.id !== id));
        }
      });
      socket.on('project_restored', ({ id }) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, is_archived: 0 } : p));
      });
      return () => {
        socket.off('project_updated');
        socket.off('project_deleted');
        socket.off('project_restored');
      };
    }
  }, [socket]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Erreur fetch projects', err);
    }
  };

  const addProject = async (nouveauProject) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(nouveauProject)
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(prev => {
          if (prev.some(p => p.id === data.id)) return prev;
          return [data, ...prev];
        });
      }
    } catch (err) {
      console.error('Erreur ajout project', err);
    }
  };

  const updateProjectStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => 
          p.id === id ? { ...p, status: newStatus } : p
        ));
      }
    } catch (err) {
      console.error('Erreur mise à jour statut projet', err);
    }
  };

  const updateProject = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ));
      }
    } catch (err) {
      console.error('Erreur mise à jour projet', err);
    }
  };

  const updateProjectProgress = async (id, manualProgress) => {
    try {
      const res = await fetch(`${API_URL}/${id}/progress`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ manualProgress })
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(prev => prev.map(p =>
          p.id === id ? { ...p, ...updated } : p
        ));
        return updated;
      }
    } catch (err) {
      console.error('Erreur mise à jour progression', err);
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, is_archived: 1 } : p));
      }
    } catch (err) {
      console.error('Erreur suppression projet', err);
    }
  };

  const restoreProject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, is_archived: 0 } : p));
      }
    } catch (err) {
      console.error('Erreur restauration projet', err);
    }
  };

  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);

  return (
    <ProjectContext.Provider value={{ 
      projects: activeProjects, 
      archivedProjects, 
      addProject, 
      updateProjectStatus, 
      updateProject, 
      updateProjectProgress, 
      deleteProject, 
      restoreProject,
      fetchProjects 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};




const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {
      console.log('AudioContext not supported');
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (data) => {
        setNotifications(prev => [data, ...prev]);
        playNotificationSound();
      };
      socket.on('new_notification', handleNewNotification);
      return () => socket.off('new_notification', handleNewNotification);
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Erreur fetch notifications', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/mark-all`, { method: 'PUT', headers: getHeaders() });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Erreur mark all as read', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/read`, { method: 'PUT', headers: getHeaders() });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Erreur mark as read', err);
    }
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAllAsRead, markAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};




const TaskContext = createContext();
export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      const handleTaskUpdated = (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      };
      const handleTaskCreated = (newTask) => {
        setTasks(prev => {
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      };
      const handleTaskDeleted = ({ id, archived }) => {
        if (archived) {
          setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: 1 } : t));
        } else {
          setTasks(prev => prev.filter(t => t.id !== id));
        }
      };
      const handleTaskRestored = ({ id }) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: 0 } : t));
      };

      socket.on('task_updated', handleTaskUpdated);
      socket.on('task_created', handleTaskCreated);
      socket.on('task_deleted', handleTaskDeleted);
      socket.on('task_restored', handleTaskRestored);

      return () => {
        socket.off('task_updated', handleTaskUpdated);
        socket.off('task_created', handleTaskCreated);
        socket.off('task_deleted', handleTaskDeleted);
        socket.off('task_restored', handleTaskRestored);
      };
    }
  }, [socket]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Erreur fetch tasks', err);
    }
  };

  const addTask = async (task) => {
    try {
      const taskId = `TASK-${Date.now()}`;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...task, id: taskId })
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => {
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    } catch (err) {
      console.error('Erreur ajout tâche', err);
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Erreur mise à jour statut tâche', err);
    }
  };

  const updateTask = async (id, updatedFields) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
      }
    } catch (err) {
      console.error('Erreur mise à jour tâche', err);
    }
  };

  const getTasksByProjectId = (projectId) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: 1 } : t));
      }
    } catch (err) {
      console.error('Erreur suppression tâche', err);
    }
  };

  const restoreTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_archived: 0 } : t));
      }
    } catch (err) {
      console.error('Erreur restauration tâche', err);
    }
  };

  const activeTasks = tasks.filter(t => !t.is_archived);
  const archivedTasks = tasks.filter(t => t.is_archived);

  return (
    <TaskContext.Provider value={{ 
      tasks: activeTasks, 
      archivedTasks, 
      addTask, 
      updateTaskStatus, 
      updateTask, 
      getTasksByProjectId, 
      fetchTasks, 
      deleteTask,
      restoreTask
    }}>
      {children}
    </TaskContext.Provider>
  );
};




const TeamContext = createContext();
export const useTeam = () => useContext(TeamContext);

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]); 
  const { token } = useAuth();
  const { socket } = useSocket();
  const { users } = useUser();
  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/projects`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchTeams();
    }
  }, [token]);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/members`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Erreur fetch teams', err);
    }
  };

  const addMemberToProject = async (projectId, member) => {
    try {
      const res = await fetch(`${API_URL}/${projectId}/members`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId: member.userId, role: member.role })
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeams(prev => {
          const projectTeam = prev.find(t => t.projectId === projectId);
          if (projectTeam) {
            const exists = projectTeam.members.find(m => m.userId === newMember.userId);
            let updatedMembers;
            if (exists) {
              updatedMembers = projectTeam.members.map(m => m.userId === newMember.userId ? newMember : m);
            } else {
              updatedMembers = [...projectTeam.members, newMember];
            }
            return prev.map(t => t.projectId === projectId ? { ...t, members: updatedMembers } : t);
          } else {
            return [...prev, { projectId, members: [newMember] }];
          }
        });
      }
    } catch (err) {
      console.error('Erreur ajout membre', err);
    }
  };

  const getTeamByProjectId = (projectId) => {
    const projectTeam = teams.find(t => t.projectId === projectId);
    const manualMembers = projectTeam ? projectTeam.members : [];

    if (!users || users.length === 0) return manualMembers;

    const autoMembers = users
      .filter(u => ['Project Manager', 'Sponsor', 'Admin'].includes(u.role))
      .map(u => ({
        userId: u.id,
        user: u,
        role: u.role === 'Project Manager' ? 'Chef de Projet' : u.role === 'Admin' ? 'Admin' : 'Sponsor',
        isAuto: true
      }));

    const finalManualMembers = manualMembers.filter(mm => !autoMembers.some(am => am.userId === mm.userId));

    return [...autoMembers, ...finalManualMembers];
  };

  return (
    <TeamContext.Provider value={{ teams, addMemberToProject, getTeamByProjectId, fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
};




const MessageContext = createContext();
export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const { token, user } = useAuth();
  const { socket } = useSocket();
  
  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/messages`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchMessages();
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };
      socket.on('new_message', handleNewMessage);
      return () => socket.off('new_message', handleNewMessage);
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Erreur fetch messages', err);
    }
  };

  const sendMessage = (content, mentions = [], projectId = null, recipientId = null) => {
    if (socket && user) {
      const messageData = {
        content,
        senderId: user.id,

        senderName: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
        senderRole: user.role,
        mentions,
        projectId,
        recipientId
      };
      socket.emit('send_message', messageData);
    }
  };

  return (
    <MessageContext.Provider value={{ messages, sendMessage }}>
      {children}
    </MessageContext.Provider>
  );
};


const TestCaseContext = createContext();
export const useTestCases = () => useContext(TestCaseContext);

export const TestCaseProvider = ({ children }) => {
  const [testCases, setTestCases] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (socket) {
      const handleTestCaseCreated = (newTestCase) => {
        setTestCases(prev => {
          if (prev.some(t => t.id === newTestCase.id)) return prev;
          return [newTestCase, ...prev];
        });
      };
      const handleTestCaseUpdated = (updatedTestCase) => {
        setTestCases(prev => prev.map(t => t.id === updatedTestCase.id ? updatedTestCase : t));
      };
      const handleTestCaseDeleted = ({ id, archived }) => {
        if (archived) {
          setTestCases(prev => prev.map(t => t.id === id ? { ...t, is_archived: 1 } : t));
        } else {
          setTestCases(prev => prev.filter(t => t.id !== id));
        }
      };
      const handleTestCaseRestored = ({ id }) => {
        setTestCases(prev => prev.map(t => t.id === id ? { ...t, is_archived: 0 } : t));
      };

      socket.on('test_case_created', handleTestCaseCreated);
      socket.on('test_case_updated', handleTestCaseUpdated);
      socket.on('test_case_deleted', handleTestCaseDeleted);
      socket.on('test_case_restored', handleTestCaseRestored);

      return () => {
        socket.off('test_case_created', handleTestCaseCreated);
        socket.off('test_case_updated', handleTestCaseUpdated);
        socket.off('test_case_deleted', handleTestCaseDeleted);
        socket.off('test_case_restored', handleTestCaseRestored);
      };
    }
  }, [socket]);

  const fetchTestCases = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/test-cases`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTestCases(data);
      }
    } catch (err) {
      console.error('Erreur fetch test cases', err);
    }
  };

  const addTestCase = async (testCase) => {
    try {
      const res = await fetch(`${API_URL}/test-cases`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(testCase)
      });
      if (res.ok) {
        const newTestCase = await res.json();
        setTestCases(prev => {
          if (prev.some(t => t.id === newTestCase.id)) return prev;
          return [newTestCase, ...prev];
        });
        return newTestCase;
      }
    } catch (err) {
      console.error('Erreur ajout cas de test', err);
    }
  };

  const updateTestCase = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/test-cases/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updatedTestCase = await res.json();
        setTestCases(prev => prev.map(t => t.id === id ? updatedTestCase : t));
        return updatedTestCase;
      }
    } catch (err) {
      console.error('Erreur mise à jour cas de test', err);
    }
  };

  const updateTestCaseStatus = async (id, status, comment, testerId, testerName, actualResult) => {
    try {
      const res = await fetch(`${API_URL}/test-cases/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, comment, testerId, testerName, actualResult })
      });
      if (res.ok) {
        const updatedTestCase = await res.json();
        setTestCases(prev => prev.map(t => t.id === id ? updatedTestCase : t));
        return updatedTestCase;
      }
    } catch (err) {
      console.error('Erreur mise à jour statut cas de test', err);
    }
  };

  const deleteTestCase = async (id) => {
    try {
      const res = await fetch(`${API_URL}/test-cases/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setTestCases(prev => prev.map(t => t.id === id ? { ...t, is_archived: 1 } : t));
      }
    } catch (err) {
      console.error('Erreur suppression cas de test', err);
    }
  };

  const restoreTestCase = async (id) => {
    try {
      const res = await fetch(`${API_URL}/test-cases/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setTestCases(prev => prev.map(t => t.id === id ? { ...t, is_archived: 0 } : t));
      }
    } catch (err) {
      console.error('Erreur restauration cas de test', err);
    }
  };

  const activeTestCases = testCases.filter(t => !t.is_archived);
  const archivedTestCases = testCases.filter(t => t.is_archived);

  return (
    <TestCaseContext.Provider value={{ 
      testCases: activeTestCases, 
      archivedTestCases, 
      fetchTestCases, 
      addTestCase, 
      updateTestCase, 
      updateTestCaseStatus, 
      deleteTestCase,
      restoreTestCase 
    }}>
      {children}
    </TestCaseContext.Provider>
  );
};


const DocumentContext = createContext();
export const useDocuments = () => useContext(DocumentContext);

export const DocumentProvider = ({ children }) => {
  const [documents, setDocuments] = useState([]);
  const { token } = useAuth();
  const { socket } = useSocket();

  const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents`;

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (socket) {
      const handleDocumentCreated = (newDoc) => {
        setDocuments(prev => {
          if (prev.some(d => d.id === newDoc.id)) return prev;
          return [newDoc, ...prev];
        });
      };
      const handleDocumentDeleted = ({ id, archived }) => {
        if (archived) {
          setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_archived: 1 } : d));
        } else {
          setDocuments(prev => prev.filter(d => d.id !== id));
        }
      };
      const handleDocumentRestored = ({ id }) => {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_archived: 0 } : d));
      };

      socket.on('document_created', handleDocumentCreated);
      socket.on('document_deleted', handleDocumentDeleted);
      socket.on('document_restored', handleDocumentRestored);

      return () => {
        socket.off('document_created', handleDocumentCreated);
        socket.off('document_deleted', handleDocumentDeleted);
        socket.off('document_restored', handleDocumentRestored);
      };
    }
  }, [socket]);

  const fetchDocuments = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/${projectId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Erreur fetch documents', err);
    }
  };

  const addDocument = async (docData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => {
          if (prev.some(d => d.id === newDoc.id)) return prev;
          return [newDoc, ...prev];
        });
        return newDoc;
      }
    } catch (err) {
      console.error('Erreur ajout document', err);
    }
  };

  const deleteDocument = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_archived: 1 } : d));
      }
    } catch (err) {
      console.error('Erreur suppression document', err);
    }
  };

  const restoreDocument = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_archived: 0 } : d));
      }
    } catch (err) {
      console.error('Erreur restauration document', err);
    }
  };

  const activeDocuments = documents.filter(d => !d.is_archived);
  const archivedDocuments = documents.filter(d => d.is_archived);

  return (
    <DocumentContext.Provider value={{ 
      documents: activeDocuments, 
      archivedDocuments, 
      fetchDocuments, 
      addDocument, 
      deleteDocument,
      restoreDocument 
    }}>
      {children}
    </DocumentContext.Provider>
  );
};


const PopupComponent = ({ popupState, onClose }) => {
  const { title, message, type, onConfirm, onCancel, confirmText, cancelText, isConfirm } = popupState;

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={() => {
          if (onCancel) onCancel();
          onClose();
        }}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
        <button 
          onClick={() => {
            if (onCancel) onCancel();
            onClose();
          }}
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
          
          <p className="text-slate-500 text-sm mb-8 whitespace-pre-wrap">
            {message}
          </p>

          <div className="flex gap-3">
            {isConfirm && (
              <button
                onClick={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {cancelText || 'Annuler'}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 px-4 text-white rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonColors[type]}`}
            >
              {confirmText || 'Continuer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PopupContext = createContext();
export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    onConfirm: null,
    onCancel: null,
    confirmText: '',
    cancelText: '',
    isConfirm: false
  });

  const showPopup = ({ title, message, type = 'success', onConfirm = null }) => {
    setPopupState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      onCancel: null,
      confirmText: 'Continuer',
      cancelText: '',
      isConfirm: false
    });
  };

  const showConfirm = ({ title, message, type = 'warning', onConfirm, onCancel = null, confirmText = 'Confirmer', cancelText = 'Annuler' }) => {
    setPopupState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
      isConfirm: true
    });
  };

  const closePopup = () => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, closePopup }}>
      {children}
      {popupState.isOpen && (
        <PopupComponent popupState={popupState} onClose={closePopup} />
      )}
    </PopupContext.Provider>
  );
};

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <SocketProvider>
      <UserProvider>
        <ConfigProvider>
          <NotificationProvider>
            <DemandeProvider>
              <CharterProvider>
                <ProjectProvider>
                  <TaskProvider>
                    <TeamProvider>
                      <TestCaseProvider>
                        <MessageProvider>
                          <DocumentProvider>
                            <PopupProvider>
                              {children}
                            </PopupProvider>
                          </DocumentProvider>
                        </MessageProvider>
                      </TestCaseProvider>
                    </TeamProvider>
                  </TaskProvider>
                </ProjectProvider>
              </CharterProvider>
            </DemandeProvider>
          </NotificationProvider>
        </ConfigProvider>
      </UserProvider>
      </SocketProvider>
    </AuthProvider>
  );
};
