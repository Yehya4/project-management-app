import React from 'react';
import { useProjects, useTeam, useTasks, useAuth } from '../../context/AppContext';
import { LayoutDashboard, CheckSquare, FolderKanban, ClipboardCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TesterDashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { teams } = useTeam();
  const { tasks } = useTasks();

  const myProjectsIds = teams.filter(t => t.members.find(m => m.userId.toString() === user.id.toString())).map(t => t.projectId);
  const myProjects = projects.filter(p => myProjectsIds.includes(p.id));
  
  
  const myTasks = tasks.filter(t => t.assigneeId?.toString() === user.id.toString() && t.status !== 'Archivée' && t.status !== 'Clôturée');
  
  
  const testingTasks = tasks.filter(t => myProjectsIds.includes(t.projectId) && t.status === 'Fait');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <FolderKanban size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Mes Projets</p>
            <p className="text-3xl font-bold text-slate-800">{myProjects.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CheckSquare size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Mes Tests Assignés</p>
            <p className="text-3xl font-bold text-slate-800">{myTasks.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">À Tester (Phase Testing)</p>
            <p className="text-3xl font-bold text-slate-800">{testingTasks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="text-slate-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Projets Actifs</h2>
          </div>
          <div className="space-y-4">
            {myProjects.length > 0 ? myProjects.map(project => (
              <div key={project.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800">{project.nom}</h3>
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{project.status}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="w-2/3 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <Link to={`/projects/${project.id}/dashboard`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Ouvrir →
                  </Link>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-sm">Vous n'êtes assigné à aucun projet pour le moment.</p>
            )}
          </div>
        </div>

        {/* Right Side: Tasks Ready for testing */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardCheck className="text-slate-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Tâches en attente de Test</h2>
          </div>
          <div className="space-y-4">
            {testingTasks.length > 0 ? testingTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div key={task.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-100/50 transition-colors">
                  <div>
                    <h3 className="font-semibold text-slate-800">{task.title}</h3>
                    <p className="text-xs text-slate-500">{project?.nom || 'Projet Inconnu'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.priority === 'Haute' || task.priority === 'Critique' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                      {task.priority}
                    </span>
                    <Link 
                      to={`/projects/${task.projectId}/tasks`}
                      className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                      Voir le Kanban
                    </Link>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">Aucune tâche en attente de test dans vos projets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesterDashboard;
