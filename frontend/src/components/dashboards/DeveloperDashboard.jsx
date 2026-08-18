import React from 'react';
import { useProjects, useTeam, useTasks, useAuth } from '../../context/AppContext';
import { LayoutDashboard, CheckSquare, FolderKanban, Activity, Code2, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { teams } = useTeam();
  const { tasks } = useTasks();

  const navigate = useNavigate();

  const myProjectsIds = teams.filter(t => t.members.find(m => m.userId.toString() === user.id.toString())).map(t => t.projectId);
  const myProjects = projects.filter(p => myProjectsIds.includes(p.id));
  
  const myTasks = tasks.filter(t => t.assigneeId?.toString() === user.id.toString() && t.status !== 'Archivée' && t.status !== 'Clôturée');
  const myDoneTasks = myTasks.filter(t => t.status === 'Fait' || t.status === 'Done');
  const myPendingTasks = myTasks.filter(t => t.status !== 'Fait' && t.status !== 'Done');
  
  const myProgress = myTasks.length > 0 ? Math.round((myDoneTasks.length / myTasks.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-8">
      {}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Code2 size={16} /> Espace Développeur
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bonjour, {user?.prenom || 'Développeur'}
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
            Retrouvez vos tâches assignées, l'avancement de vos projets et vos objectifs quotidiens.
          </p>
        </div>
        
        {}
        <div className="mt-6 md:mt-0 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 relative z-10">
          <div className="text-center px-2">
            <p className="text-2xl font-black text-blue-300">{myProjects.length}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Projets</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center px-2">
            <p className="text-2xl font-black text-emerald-400">{myProgress}%</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Complétion</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => navigate('/projects')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FolderKanban size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Mes Projets</p>
              <p className="text-3xl font-black text-slate-800">{myProjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">À Faire</p>
              <p className="text-3xl font-black text-slate-800">{myPendingTasks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">Terminées</p>
              <p className="text-3xl font-black text-slate-800">{myDoneTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-slate-800">Mes Projets Actifs</h2>
          </div>
          <div className="space-y-4 flex-1">
            {myProjects.length > 0 ? myProjects.map(project => (
              <div key={project.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 truncate pr-2">{project.nom}</h3>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0">
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                  <Link to={`/projects/${project.id}/dashboard`} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    Ouvrir l'espace <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-500 text-sm font-medium">Vous n'êtes assigné à aucun projet pour le moment.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="text-amber-600" size={24} />
              <h2 className="text-lg font-bold text-slate-800">Mon Backlog (Tâches)</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">{myPendingTasks.length} en attente</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {myPendingTasks.length > 0 ? myPendingTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div key={task.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-white hover:border-amber-200 transition-all group">
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{task.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{project?.nom || 'Projet Inconnu'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${task.priority === 'Haute' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                      {task.priority || 'Normale'}
                    </span>
                    <Link to={`/projects/${task.projectId}/tasks`} className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold hover:bg-amber-100 transition-colors opacity-0 group-hover:opacity-100">
                      Ouvrir Kanban
                    </Link>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <CheckCircle2 className="text-emerald-400 mb-2" size={32} />
                <p className="text-slate-600 font-bold text-sm">Toutes les tâches sont terminées !</p>
                <p className="text-slate-400 text-xs mt-1">Excellent travail.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
