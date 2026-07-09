import React from 'react';
import { useDemandes, useProjects, useAuth, useTeam } from '../context/AppContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { FolderKanban, Activity, Clock, LayoutDashboard, FileText } from 'lucide-react';

const Projects = () => {
  const { demandes } = useDemandes();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { teams } = useTeam();
  
  
  
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
      isPending: true
    })),
    ...projects.map(p => ({
      ...p,
      isPending: false
    }))
  ];

  
  const filteredProjects = unifiedProjects.filter(project => {
    if (user?.role === 'Developer' || user?.role === 'Tester') {
      return teams.find(t => t.projectId === project.id)?.members.some(m => m.userId.toString() === user.id.toString());
    }
    if (user?.role === 'User') {
      const d = demandes.find(dem => dem.id === project.demandeId);
      if (!d) return false;
      return d.nomDemandeur === user?.name || 
             d.nomDemandeur === `${user?.prenom} ${user?.nom}`.trim() || 
             d.nomDemandeur === `${user?.nom} ${user?.prenom}`.trim();
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
          <p className="text-blue-100 max-w-2xl mt-2">
            Gérez l'ensemble de vos projets en un seul endroit. De la préparation initiale avec la charte projet jusqu'au développement et le déploiement final.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => {
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
                  <h3 className={`font-bold text-slate-800 text-xl line-clamp-2 leading-tight mb-2 transition-colors ${!isRestrictedUser ? 'group-hover:text-blue-600' : ''}`}>
                    {project.nom}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
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
          })
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
      </div>
    </Layout>
  );
};

export default Projects;
