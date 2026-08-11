import React from 'react';
import { useAuth, useProjects } from '../../context/AppContext';
import { Server, ShieldCheck, Activity, FolderKanban, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InfraDashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();

  // Metrics
  const totalProjects = projects.length;
  const inDeployment = projects.filter(p => p.status === 'Déploiement').length;
  const inProduction = projects.filter(p => p.status === 'Terminé' || p.status === 'Utilisation').length;
  
  // Projects pending infra action
  const pendingDeploymentProjects = projects.filter(p => p.status === 'Déploiement');

  return (
    <div className="space-y-8 pb-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Server size={14} /> Espace Infrastructure & Déploiement
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bonjour, {user?.prenom || 'Responsable Infra'}
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
            Supervisez les mises en production, validez les déploiements et assurez la stabilité de l'infrastructure pour l'ensemble des projets.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group cursor-default">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">Portefeuille Global</p>
              <p className="text-3xl font-black text-slate-800">{totalProjects}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FolderKanban size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">Projets gérés par le système</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all group cursor-default">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">En Attente de Validation</p>
              <p className="text-3xl font-black text-amber-600">{inDeployment}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">Projets en phase de déploiement</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group cursor-default">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">En Production (Actifs)</p>
              <p className="text-3xl font-black text-emerald-600">{inProduction}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">Projets validés et déployés avec succès</p>
        </div>
      </div>

      {/* Actionable List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Projets à Déployer</h2>
              <p className="text-sm text-slate-500">Liste des projets nécessitant votre validation pour passer en production.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            {pendingDeploymentProjects.length} action(s) requise(s)
          </span>
        </div>

        <div className="p-0 overflow-x-auto">
          {pendingDeploymentProjects.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Projet</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Chef de Projet</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Avancement</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDeploymentProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{project.nom}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {project.chefProjet || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${project.progress || 90}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{project.progress || 90}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/projects/${project.id}?tab=Deploiement`)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                      >
                        Valider Déploiement <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} />
              </div>
              <p className="text-slate-800 font-bold text-lg">Aucun projet en attente</p>
              <p className="text-slate-500 mt-1 text-sm max-w-sm">Tous les projets ont été traités. Il n'y a actuellement aucun projet en phase de déploiement nécessitant votre validation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfraDashboard;
