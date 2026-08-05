import React, { useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, ArrowLeft, FileText, ListTodo, Box, UserCircle, ScrollText, MessageSquare, Calendar, FlaskConical, Rocket, CheckCircle2 } from 'lucide-react';
import { useProjects, useDemandes, useAuth, useCharter, useUser, useTasks, useTeam } from '../context/AppContext';

const ProjectWorkspaceLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, addProject, updateProject } = useProjects();
  const { demandes, updateDemandeStatus } = useDemandes();
  const { user } = useAuth();
  const { charters } = useCharter();
  const { users } = useUser();
  const { tasks } = useTasks();
  const { teams, addMemberToProject, getTeamByProjectId } = useTeam();

  useEffect(() => {
    const linkedProject = projects.find(p => p.id === id || p.demandeId === id);
    if (!linkedProject) {
      const demande = demandes.find(d => d.id === id);
      if (demande && (demande.statut === 'Acceptée' || demande.statut === 'En Développement')) {
        const charter = charters.find(c => c.demandeId === id);
        if (charter && charter.statut === 'Validé') {
          addProject({
            nom: demande.nomDemandeur ? `Projet ${demande.nomDemandeur}` : (demande.titre || `Projet issu de la demande ${id}`),
            chefProjet: charter.chefProjetIT || 'Non assigné',
            status: 'Initiation',
            description: demande.description || '',
            demandeId: id,
            progress: 0
          });
        }
      }
    }
  }, [id, projects, demandes, charters, addProject]);

  useEffect(() => {
    const linkedProject = projects.find(p => p.id === id || p.demandeId === id);
    if (linkedProject && (!linkedProject.chefProjet || linkedProject.chefProjet === 'Non assigné' || linkedProject.chefProjet === 'Project Manager' || !linkedProject.chefProjet.includes('('))) {
      const pmUser = (user?.role === 'Project Manager' ? user : null) || users.find(u => u.role === 'Project Manager');
      if (pmUser) {
        const pmName = `${pmUser.prenom || ''} ${pmUser.nom || ''}`.trim();
        const formattedPm = pmName ? `${pmName} (PM)` : 'Project Manager (PM)';
        if (linkedProject.chefProjet !== formattedPm) {
          updateProject(linkedProject.id, { chefProjet: formattedPm });
        }
      }
    }
  }, [id, projects, users, user, updateProject]);


  useEffect(() => {
    const linkedProject = projects.find(p => p.id === id || p.demandeId === id);
    if (!linkedProject) return;

    const teamMembers = getTeamByProjectId(linkedProject.id) || [];
    const teamUserIds = teamMembers.map(m => m.userId?.toString());


    const privilegedUsers = users.filter(u =>
      ['Project Manager', 'Sponsor', 'Admin'].includes(u.role)
    );

    privilegedUsers.forEach(u => {
      if (!teamUserIds.includes(u.id?.toString())) {
        addMemberToProject(linkedProject.id, {
          userId: u.id,
          nom: u.nom,
          prenom: u.prenom,
          role: u.role,
          email: u.email
        });
      }
    });
  }, [id, projects, users, getTeamByProjectId, addMemberToProject]);


  let project = projects.find(p => p.id === id || p.demandeId === id);
  let isPending = false;

  if (!project) {
    const demande = demandes.find(d => d.id === id);
    if (demande && (demande.statut === 'Acceptée' || demande.statut === 'En Développement')) {
      isPending = true;
      project = {
        id: demande.id,
        demandeId: demande.id,
        nom: demande.titre || `Projet en préparation (${demande.id})`,
        chefProjet: 'Non assigné',
        description: demande.description || '',
        status: 'Initiation',
        phase: 'Initiation',
        progress: 0,
        originalDemande: demande
      };
    }
  }

  const isAssignedDev = (user?.role === 'Developer' || user?.role === 'Tester')
    ? teams.find(t => t.projectId === project?.id)?.members.some(m => m.userId.toString() === user.id.toString())
    : true;

  const isRequestOwner = user?.role === 'User'
    ? (() => {
        const d = demandes.find(dem => dem.id === project?.demandeId);
        if (!d) return false;
        const fn = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
        const fnAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim();
        return d.nomDemandeur === fn || d.nomDemandeur === fnAlt;
      })()
    : true;

  if (!project || !isAssignedDev || !isRequestOwner) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Accès interdit</h2>
          <p className="text-slate-500 mb-4">Vous n'êtes pas assigné à ce projet ou n'avez pas les droits requis.</p>
          <button 
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  const myTasksCount = tasks.filter(t => 
    t.projectId === project.id && 
    t.assigneeId?.toString() === user?.id?.toString()
  ).length;

  const devLinks = [
    { path: `/projects/${id}/dashboard`, name: user?.role === 'Tester' ? 'Dashboard Testeur' : 'Dashboard Développeur', icon: <LayoutDashboard size={20} /> },
    { path: `/projects/${id}/tasks`, name: 'Tâches', icon: <CheckSquare size={20} />, badge: myTasksCount > 0 ? myTasksCount : null },
    { path: `/projects/${id}/tests`, name: 'Tests', icon: <FlaskConical size={20} /> },
    { path: `/projects/${id}/deployment`, name: 'Déploiement', icon: <Rocket size={20} /> },
    { path: `/projects/${id}/chat`, name: 'Messagerie', icon: <MessageSquare size={20} /> },
    { path: `/projects/${id}/calendar`, name: 'Calendrier', icon: <Calendar size={20} /> },
    { path: `/projects/${id}/utilisation`, name: 'Utilisation', icon: <CheckCircle2 size={20} /> },
    { path: `/projects/${id}/role`, name: 'Mon Rôle', icon: <UserCircle size={20} /> }
  ];

  const defaultLinks = [
    { path: `/projects/${id}/dashboard`, name: 'Vue d\'ensemble', icon: <LayoutDashboard size={20} /> },
    { path: `/projects/${id}/charter`, name: 'Fiche de Projet', icon: <ScrollText size={20} /> },
    { path: `/projects/${id}/tasks`, name: 'Tâches', icon: <CheckSquare size={20} />, badge: myTasksCount > 0 ? myTasksCount : null },
    { path: `/projects/${id}/tests`, name: 'Tests', icon: <FlaskConical size={20} /> },
    { path: `/projects/${id}/deployment`, name: 'Déploiement', icon: <Rocket size={20} /> },
    { path: `/projects/${id}/chat`, name: 'Messagerie', icon: <MessageSquare size={20} /> },
    { path: `/projects/${id}/calendar`, name: 'Calendrier', icon: <Calendar size={20} /> },
    { path: `/projects/${id}/documents`, name: 'Documents', icon: <Box size={20} /> },
    { path: `/projects/${id}/utilisation`, name: 'Utilisation', icon: <CheckCircle2 size={20} /> },
    { path: `/projects/${id}/team`, name: 'Équipe', icon: <Users size={20} /> }
  ];

  const links = (user?.role === 'Developer' || user?.role === 'Tester') ? devLinks : defaultLinks;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Retour aux projets
          </button>
          
          <h1 className="text-white font-bold text-lg leading-tight mb-1">{project.nom}</h1>
          <p className="text-xs font-mono text-slate-500 bg-slate-800 inline-block px-2 py-0.5 rounded">{project.id}</p>
          {}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              {project.status}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(link => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                  window.location.pathname.includes(link.path) ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                }`}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white uppercase">
              {project.chefProjet?.charAt(0) || 'CP'}
            </div>
            <div>
              <p className="text-xs text-slate-500">Chef de Projet</p>
              <p className="text-sm font-semibold text-white">Project Manager</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet context={{ project, isPending }} />
        </div>
      </main>
    </div>
  );
};

export default ProjectWorkspaceLayout;
