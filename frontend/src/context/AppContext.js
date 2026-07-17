import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';




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




const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const { token } = useAuth();

  const API_URL = 'http://localhost:5000/api/users';

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
  natureBesoin: [],
  benefices: []
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [archivedConfig, setArchivedConfig] = useState(DEFAULT_CONFIG);
  const { token } = useAuth();

  const API_URL = 'http://localhost:5000/api/config';

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

  const API_URL = 'http://localhost:5000/api/demandes';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchDemandes();
    }
  }, [token]);

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
      setDemandes(prev => [data, ...prev]);
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
        setDemandes(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Erreur suppression demande', err);
    }
  };

  return (
    <DemandeContext.Provider value={{ demandes, addDemande, updateDemande, updateDemandeStatus, deleteDemande, fetchDemandes }}>
      {children}
    </DemandeContext.Provider>
  );
};




const CharterContext = createContext();
export const useCharter = () => useContext(CharterContext);

export const CharterProvider = ({ children }) => {
  const [charters, setCharters] = useState([]);
  const { token } = useAuth();

  const API_URL = 'http://localhost:5000/api/charters';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchCharters();
    }
  }, [token]);

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
      }
    } catch (err) {
      console.error('Erreur save charter', err);
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
        setCharters(prev => prev.filter(c => c.demandeId !== demandeId));
      }
    } catch (err) {
      console.error('Erreur suppression charter', err);
    }
  };

  return (
    <CharterContext.Provider value={{ charters, saveCharter, getCharterByDemandeId, fetchCharters, deleteCharter }}>
      {children}
    </CharterContext.Provider>
  );
};




const ProjectContext = createContext();
export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const { token } = useAuth();

  const API_URL = 'http://localhost:5000/api/projects';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchProjects();
      const socket = io('http://localhost:5000', { auth: { token } });
      socket.on('project_updated', (updatedProject) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
      });
      return () => socket.close();
    }
  }, [token]);

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
        setProjects(prev => [data, ...prev]);
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

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Erreur suppression projet', err);
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProjectStatus, updateProject, deleteProject, fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};




const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  const API_URL = 'http://localhost:5000/api/notifications';

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
      const newSocket = io('http://localhost:5000', { auth: { token } });
      setSocket(newSocket);

      if (user) {
        newSocket.emit('register_user', {
          userId: user.id,
          role: user.role,
          fullName: `${user.prenom || ''} ${user.nom || ''}`.trim()
        });
      }

      newSocket.on('new_notification', (data) => {
        setNotifications(prev => [data, ...prev]);
        playNotificationSound();
      });

      return () => newSocket.close();
    }
  }, [token, user]);

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

  const API_URL = 'http://localhost:5000/api/tasks';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchTasks();
      const socket = io('http://localhost:5000', { auth: { token } });
      socket.on('task_updated', (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      });
      socket.on('task_created', (newTask) => {
        setTasks(prev => {
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      });
      socket.on('task_deleted', ({ id }) => {
        setTasks(prev => prev.filter(t => t.id !== id));
      });
      return () => socket.close();
    }
  }, [token]);

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

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, updateTask, getTasksByProjectId, fetchTasks }}>
      {children}
    </TaskContext.Provider>
  );
};




const TeamContext = createContext();
export const useTeam = () => useContext(TeamContext);

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]); 
  const { token } = useAuth();
  const { users } = useUser();
  const API_URL = 'http://localhost:5000/api/projects';

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
  const [socket, setSocket] = useState(null);
  const { token, user } = useAuth();
  
  const API_URL = 'http://localhost:5000/api/messages';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      fetchMessages();
      
      const newSocket = io('http://localhost:5000', { auth: { token } });
      setSocket(newSocket);

      newSocket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => newSocket.close();
    }
  }, [token]);

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

  const API_URL = 'http://localhost:5000/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  useEffect(() => {
    if (token) {
      const socketConnection = io('http://localhost:5000', { auth: { token } });
      socketConnection.on('test_case_created', (newTestCase) => {
        setTestCases(prev => {
          if (prev.some(t => t.id === newTestCase.id)) return prev;
          return [newTestCase, ...prev];
        });
      });
      socketConnection.on('test_case_updated', (updatedTestCase) => {
        setTestCases(prev => prev.map(t => t.id === updatedTestCase.id ? updatedTestCase : t));
      });
      socketConnection.on('test_case_deleted', ({ id }) => {
        setTestCases(prev => prev.filter(t => t.id !== id));
      });
      return () => socketConnection.close();
    }
  }, [token]);

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

  const updateTestCaseStatus = async (id, status, comment, testerId, testerName) => {
    try {
      const res = await fetch(`${API_URL}/test-cases/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, comment, testerId, testerName })
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
        setTestCases(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Erreur suppression cas de test', err);
    }
  };

  return (
    <TestCaseContext.Provider value={{ testCases, fetchTestCases, addTestCase, updateTestCase, updateTestCaseStatus, deleteTestCase }}>
      {children}
    </TestCaseContext.Provider>
  );
};


export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
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
                          {children}
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
    </AuthProvider>
  );
};
