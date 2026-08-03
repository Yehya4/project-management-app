import React, { useState } from 'react';
import { useDemandes, useProjects, useAuth, useTeam, useCharter, useUser } from '../context/AppContext';
import Layout from '../components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Activity, Clock, LayoutDashboard, FileText, LayoutGrid, List } from 'lucide-react';
import { formatUserDisplayName } from '../utils/userUtils';

const Projects = () => {
  const navigate = useNavigate();
  const { demandes } = useDemandes();
  const { projects } = useProjects();
  const { getCharterByDemandeId } = useCharter();
  const { user } = useAuth();
  const { users } = useUser();
  const { teams } = useTeam();
  const [viewMode, setViewMode] = useState('cards');
  const [statusFilter, setStatusFilter] = useState('all');
  
  
  
  const parseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed === '-') return [];
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  const formatDate = (val) => {
    if (!val || val === '-') return '-';
    if (typeof val === 'string' && val.includes('/')) return val;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR');
      }
    } catch (e) {}
    return val;
  };

  const activeDemandeIds = projects.map(p => p.demandeId).filter(Boolean);
  
  const pendingDemandes = demandes.filter(d => 
    ['Acceptée', 'En cours', 'En Développement'].includes(d.statut) && !activeDemandeIds.includes(d.id)
  );

  const unifiedProjects = [
    ...pendingDemandes.map(d => {
      const charter = getCharterByDemandeId(d.id);
      const catList = parseArray(charter?.categoriesProjet || d.categoriesProjet);
      const domList = parseArray(d.domaines || charter?.domaines);
      return {
        id: d.id,
        demandeId: d.id,
        nom: d.titre || `Projet en préparation (${d.id})`,
        description: d.description || 'Aucune description fournie.',
        status: 'En Préparation',
        progress: 0,
        isPending: true,
        nomDemandeur: d.nomDemandeur || charter?.nomDemandeur || '-',
        domaines: domList,
        dateCreation: formatDate(d.dateCreation),
        dateFin: formatDate(charter?.dateFin || d.dateFin || d.delaiSouhaite),
        categoriesProjet: catList,
        service: charter?.service || d.service || '-'
      };
    }),
    ...projects.map(p => {
      const targetDemandeId = p.demandeId || p.id;
      const d = demandes.find(dem => dem.id === targetDemandeId || dem.id === p.demandeId || dem.id === p.id);
      const charter = getCharterByDemandeId(targetDemandeId) || getCharterByDemandeId(p.demandeId) || getCharterByDemandeId(p.id);

      const catList = parseArray(charter?.categoriesProjet || d?.categoriesProjet || p.categoriesProjet);
      const domList = parseArray(d?.domaines || charter?.domaines || p.domaines);

      return {
        ...p,
        isPending: false,
        nomDemandeur: d?.nomDemandeur || charter?.nomDemandeur || p.nomDemandeur || '-',
        domaines: domList,
        dateCreation: formatDate(p.dateCreation || d?.dateCreation),
        dateFin: formatDate(charter?.dateFin || d?.dateFin || d?.delaiSouhaite || p.dateFin),
        categoriesProjet: catList,
        service: charter?.service || d?.service || p.service || '-'
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
      if (d.nomDemandeur !== fn && d.nomDemandeur !== fnAlt) return false;
    }

    if (statusFilter === 'active') {
      if (['Archive', 'Archivée', 'Terminé'].includes(project.status)) return false;
    } else if (statusFilter === 'completed') {
      if (!['Archive', 'Archivée', 'Terminé'].includes(project.status)) return false;
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
            <div className="flex items-center gap-4">
              <div className="bg-blue-800/50 p-1 rounded-xl flex items-center shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                >
                  En cours
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${statusFilter === 'completed' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}
                >
                  Terminés
                </button>
              </div>
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
                  className={`flex flex-col p-5 border border-slate-200/80 rounded-3xl bg-white relative overflow-hidden transition-all duration-300 ${!isRestrictedUser ? 'hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 group cursor-pointer' : 'shadow-sm'}`}
                >
                  {/* Header: Icon + Reference & Demandeur + Status */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-3 rounded-2xl transition-colors shrink-0 ${project.isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} ${!isRestrictedUser && (project.isPending ? 'group-hover:bg-amber-600 group-hover:text-white' : 'group-hover:bg-blue-600 group-hover:text-white')}`}>
                        <FolderKanban size={22} strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 shrink-0 w-fit">
                          {project.id}
                        </span>
                        <span className="text-xs text-slate-500 truncate font-medium mt-1" title={formatUserDisplayName(project.nomDemandeur, 'User', users)}>
                          Par <strong className="text-slate-700 font-semibold">{formatUserDisplayName(project.nomDemandeur, 'User', users)}</strong>
                        </span>
                      </div>
                    </div>

                    {project.isPending ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 flex items-center gap-1">
                        <Clock size={10} /> PRÉPARATION
                      </span>
                    ) : (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                        {project.status}
                      </span>
                    )}
                  </div>
                
                  {/* Project Name */}
                  <h3 className={`font-bold text-slate-800 text-base line-clamp-2 leading-snug mb-3 transition-colors ${!isRestrictedUser ? 'group-hover:text-blue-600' : ''}`} title={project.nom}>
                    {project.nom}
                  </h3>

                  {/* Details Container */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-2 mb-4 flex-1">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200/50">
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">Chef de Projet</span>
                        <span className="font-semibold text-slate-700 truncate block" title={formatUserDisplayName(project.chefProjet, 'PM', users)}>
                          {formatUserDisplayName(project.chefProjet, 'PM', users)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">Service</span>
                        <span className="font-semibold text-slate-700 truncate block" title={project.service}>{project.service}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">Date Création</span>
                        <span className="font-medium text-slate-600 block">{project.dateCreation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-0.5">Catégories</span>
                        <span className="font-semibold text-indigo-600 truncate block" title={project.categoriesProjet?.join(', ') || '-'}>
                          {project.categoriesProjet?.join(', ') || '-'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50">
                      <span className="text-slate-400 block text-[11px] mb-0.5">Domaines</span>
                      <span className="font-semibold text-slate-700 truncate block" title={project.domaines?.join(', ') || '-'}>
                        {project.domaines?.join(', ') || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                        <Activity size={13} className="text-blue-500" /> Progression
                      </span>
                      <span className={project.progress > 0 ? 'text-blue-600 font-extrabold' : 'text-slate-400'}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${project.isPending ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    
                    {isRestrictedUser && (
                      <Link
                        to={`/project-charter?demandeId=${project.demandeId}`}
                        className="mt-3 block w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 text-xs flex items-center justify-center gap-1.5"
                      >
                        <FileText size={14} /> Voir le Project Charter
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
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Projet & Chef</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Demandeur & Service</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaine & Catégorie</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Création</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut (Stage)</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(project => {
                      const isRestrictedUser = user?.role === 'User';
                      const handleRowClick = () => {
                        if (isRestrictedUser) {
                          navigate(`/project-charter?demandeId=${project.demandeId}`);
                        } else {
                          navigate(`/projects/${project.id}/dashboard`);
                        }
                      };
                      return (
                        <tr 
                          key={project.id} 
                          onClick={handleRowClick}
                          className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-700">{project.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${project.isPending ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} shrink-0`}>
                                <FolderKanban size={20} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm truncate max-w-[220px]" title={project.nom}>{project.nom}</span>
                                <span className="text-xs text-slate-500 font-medium">PM: {formatUserDisplayName(project.chefProjet, 'PM', users)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">{formatUserDisplayName(project.nomDemandeur, 'User', users)}</span>
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
