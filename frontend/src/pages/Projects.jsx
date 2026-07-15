import React, { useState } from 'react';
import { useDemandes, useProjects, useAuth, useTeam } from '../context/AppContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { FolderKanban, Activity, Clock, LayoutDashboard, FileText, LayoutGrid, List } from 'lucide-react';

const Projects = () => {
  const { demandes } = useDemandes();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { teams } = useTeam();
  const [viewMode, setViewMode] = useState('cards');
  
  
  
  const activeDemandeIds = projects.map(p => p.demandeId).filter(Boolean);
  
  
  
  const pendingDemandes = demandes.filter(d => 
    d.statut === 'Acceptée' && !activeDemandeIds.includes(d.id)
  );

  const unifiedProjects = [
    ...pendingDemandes.map(d => ({
      id: d.id,
      demandeId: d.id,
      nom: d.titre || `Projet en préparation (${d.id})`,
      description: d.description || 'Aucune description fournie.',
      status: 'En Préparation',
      progress: 0,
      isPending: true,
      nomDemandeur: d.nomDemandeur,
      domaines: d.domaines,
      dateCreation: d.dateCreation,
      categoriesProjet: d.categoriesProjet,
      service: d.service || '-'
    })),
    ...projects.map(p => {
      const d = demandes.find(dem => dem.id === p.demandeId);
      return {
        ...p,
        isPending: false,
        nomDemandeur: d?.nomDemandeur || '-',
        domaines: d?.domaines || [],
        dateCreation: d?.dateCreation || '-',
        categoriesProjet: d?.categoriesProjet || [],
        service: d?.service || '-'
      };
    })
  ];

  
  const filteredProjects = unifiedProjects.filter(project => {
    if (user?.role === 'Developer' || user?.role === 'Tester') {
      return teams.find(t => t.projectId === project.id)?.members.some(m => m.userId.toString() === user.id.toString());
    }
    if (user?.role === 'User') {
      const d = demandes.find(dem => dem.id === project.demandeId);
      if (!d) return false;
      const fn = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
      const fnAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim();
      return d.nomDemandeur === fn || d.nomDemandeur === fnAlt;
    }
    return true;
  });

  return (
    <Layout title="Espace Projets">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-8 rounded-3xl shadow-lg text-white">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard size={32} className="text-blue-300" />
            <h1 className="text-3xl font-bold">Tous les Projets</h1>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-blue-100 max-w-2xl mt-2">
              Gérez l'ensemble de vos projets en un seul endroit. De la préparation initiale avec la charte projet jusqu'au développement et le déploiement final.
            </p>
            <div className="bg-blue-800/50 p-1 rounded-xl flex items-center shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'cards' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                title="Vue en cartes"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg flex items-center transition-all ${viewMode === 'table' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                title="Vue en tableau"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map(project => {
              const isRestrictedUser = user?.role === 'User';
              const CardWrapper = isRestrictedUser ? 'div' : Link;
              const wrapperProps = isRestrictedUser ? {} : { to: `/projects/${project.id}/dashboard` };
              
              return (
                <CardWrapper 
                  key={project.id} 
                  {...wrapperProps}
                  className={`flex flex-col p-6 border border-slate-200 rounded-3xl bg-white relative overflow-hidden transition-all duration-300 ${!isRestrictedUser ? 'hover:border-blue-500 hover:shadow-xl group cursor-pointer' : 'shadow-sm'}`}
                >
                  {project.isPending && (
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1">
                      <Clock size={10} /> EN PRÉPARATION
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl transition-colors ${project.isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} ${!isRestrictedUser && (project.isPending ? 'group-hover:bg-amber-600 group-hover:text-white' : 'group-hover:bg-blue-600 group-hover:text-white')}`}>
                      <FolderKanban size={32} strokeWidth={1.5} />
                    </div>
                    {isRestrictedUser && !project.isPending && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {project.status}
                      </span>
                    )}
                  </div>
                
                <div className="mb-6 flex-1">
                  <h3 className={`font-bold text-slate-800 text-xl line-clamp-2 leading-tight mb-3 transition-colors ${!isRestrictedUser ? 'group-hover:text-blue-600' : ''}`}>
                    {project.nom}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><span className="text-slate-400 block mb-0.5">Référence</span><span className="font-semibold">{project.id}</span></div>
                    <div><span className="text-slate-400 block mb-0.5">Date Création</span><span className="font-semibold">{project.dateCreation}</span></div>
                    <div><span className="text-slate-400 block mb-0.5">Demandeur</span><span className="font-semibold truncate block" title={project.nomDemandeur}>{project.nomDemandeur}</span></div>
                    <div><span className="text-slate-400 block mb-0.5">Service</span><span className="font-semibold truncate block" title={project.service}>{project.service}</span></div>
                    <div className="col-span-2"><span className="text-slate-400 block mb-0.5">Domaines</span><span className="font-semibold">{project.domaines?.join(', ') || '-'}</span></div>
                    <div className="col-span-2"><span className="text-slate-400 block mb-0.5">Catégories</span><span className="font-semibold">{project.categoriesProjet?.join(', ') || '-'}</span></div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Activity size={14} /> Progression
                    </span>
                    <span className={project.progress > 0 ? 'text-blue-600' : 'text-slate-400'}>
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${project.isPending ? 'bg-amber-400' : 'bg-blue-600'}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  
                  {isRestrictedUser && (
                    <Link
                      to={`/project-charter?demandeId=${project.demandeId}`}
                      className="block w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 text-sm flex items-center justify-center gap-2"
                    >
                      <FileText size={16} /> Voir le Project Charter
                    </Link>
                  )}
                </div>
              </CardWrapper>
            );
          })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Référence</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Projet</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Demandeur & Service</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaine & Catégorie</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Création</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut (Stage)</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Progression</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(project => {
                      const isRestrictedUser = user?.role === 'User';
                      return (
                        <tr key={project.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-700">{project.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${project.isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} shrink-0`}>
                                <FolderKanban size={20} />
                              </div>
                              <div className="flex flex-col max-w-[200px]">
                                <span className="font-bold text-slate-800 text-base truncate" title={project.nom}>{project.nom}</span>
                                <span className="text-xs text-slate-500 truncate" title={project.description}>{project.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">{project.nomDemandeur}</span>
                              <span className="text-xs text-slate-500">{project.service}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col max-w-[150px]">
                              <span className="text-xs font-semibold text-slate-700 truncate" title={project.domaines?.join(', ')}>{project.domaines?.join(', ') || '-'}</span>
                              <span className="text-xs text-slate-500 truncate" title={project.categoriesProjet?.join(', ')}>{project.categoriesProjet?.join(', ') || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {project.dateCreation}
                          </td>
                          <td className="px-6 py-4">
                            {project.isPending ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                <Clock size={12} /> EN PRÉPARATION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                {project.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[120px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${project.isPending ? 'bg-amber-400' : 'bg-blue-600'}`}
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 w-8">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isRestrictedUser ? (
                              <Link
                                to={`/project-charter?demandeId=${project.demandeId}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors border border-slate-200 text-xs"
                              >
                                <FileText size={14} /> Voir Charter
                              </Link>
                            ) : (
                              <Link
                                to={`/projects/${project.id}/dashboard`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-colors border border-blue-100 text-xs"
                              >
                                <LayoutDashboard size={14} /> Gérer le projet
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <FolderKanban size={64} className="mx-auto text-slate-300 mb-4" strokeWidth={1} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun projet trouvé</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Acceptez des demandes SI pour les voir apparaître ici et commencer leur cycle de vie.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Projects;
