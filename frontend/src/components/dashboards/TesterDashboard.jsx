import React from 'react';
import { useProjects, useTeam, useTasks, useAuth, useTestCases } from '../../context/AppContext';
import { LayoutDashboard, CheckSquare, FolderKanban, ClipboardCheck, AlertCircle, ShieldAlert, Bug, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TesterDashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { teams } = useTeam();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const { testCases } = useTestCases();

  const myProjectsIds = teams.filter(t => t.members.find(m => m.userId.toString() === user.id.toString())).map(t => t.projectId);
  const myProjects = projects.filter(p => myProjectsIds.includes(p.id));
  
  const myTests = testCases.filter(t => myProjectsIds.includes(t.projectId));
  const pendingTests = myTests.filter(t => t.status === 'Draft' || t.status === 'En cours' || !t.status);
  const passedTests = myTests.filter(t => t.status === 'Passed');
  const failedTests = myTests.filter(t => t.status === 'Failed');
  
  const successRate = myTests.length > 0 ? Math.round((passedTests.length / myTests.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-8">
      {}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-purple-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} /> Espace Qualité (QA)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bonjour, {user?.prenom || 'Testeur'}
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
            Validez la qualité des livrables, exécutez vos scénarios de test et signalez les anomalies.
          </p>
        </div>
        
        {}
        <div className="mt-6 md:mt-0 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 relative z-10">
          <div className="text-center px-2">
            <p className="text-2xl font-black text-purple-300">{myProjects.length}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Projets</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center px-2">
            <p className="text-2xl font-black text-emerald-400">{successRate}%</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Taux Succès</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => navigate('/projects')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FolderKanban size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-purple-600 transition-colors">Mes Projets</p>
              <p className="text-3xl font-black text-slate-800">{myProjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">Tests en attente</p>
              <p className="text-3xl font-black text-slate-800">{pendingTests.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-rose-500 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <Bug size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-rose-600 transition-colors">Bugs / Échecs</p>
              <p className="text-3xl font-black text-rose-600">{failedTests.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="text-purple-600" size={24} />
            <h2 className="text-lg font-bold text-slate-800">Mes Projets Actifs</h2>
          </div>
          <div className="space-y-4 flex-1">
            {myProjects.length > 0 ? myProjects.map(project => (
              <div key={project.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-white hover:border-purple-200 transition-all shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 truncate pr-2">{project.nom}</h3>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0">
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{project.progress}%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-right">
                  <Link to={`/projects/${project.id}/dashboard`} className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
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
              <ClipboardCheck className="text-amber-600" size={24} />
              <h2 className="text-lg font-bold text-slate-800">Tests en attente</h2>
            </div>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">{pendingTests.length} à valider</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {pendingTests.length > 0 ? pendingTests.map(test => {
              const project = projects.find(p => p.id === test.projectId);
              return (
                <div key={test.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-white hover:border-amber-200 transition-all group">
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{test.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{project?.nom || 'Projet Inconnu'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                      {test.status || 'Draft'}
                    </span>
                    <Link to={`/projects/${test.projectId}/tests`} className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold hover:bg-amber-100 transition-colors opacity-0 group-hover:opacity-100">
                      Exécuter
                    </Link>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <CheckCircle2 className="text-emerald-400 mb-2" size={32} />
                <p className="text-slate-600 font-bold text-sm">Aucun test en attente !</p>
                <p className="text-slate-400 text-xs mt-1">Tous les livrables sont validés.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TesterDashboard;
