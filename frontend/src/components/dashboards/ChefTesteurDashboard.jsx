import React, { useEffect, useState } from 'react';
import { useProjects, useTeam, useAuth } from '../../context/AppContext';
import { FolderKanban, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectTestingCard = ({ project }) => {
  const { token } = useAuth();
  const [testCases, setTestCases] = useState([]);
  const { updateProject } = useProjects();
  
  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${project.id}/test-cases`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setTestCases(data))
      .catch(e => console.error(e));
  }, [project.id, token]);
  
  const totalCount = testCases.length;
  const successCount = testCases.filter(t => t.status === 'Réussite').length;
  const allTestsPassed = totalCount > 0 && successCount === totalCount;
  
  return (
    <div className={`p-5 border rounded-2xl transition-colors shadow-sm ${allTestsPassed ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-800 text-lg">{project.nom}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-black ${allTestsPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {totalCount === 0 ? 'Aucun test' : `${successCount}/${totalCount} réussis`}
        </span>
      </div>
      
      {allTestsPassed ? (
        <div className="flex items-start gap-2 mb-4 bg-emerald-100/50 p-3 rounded-xl border border-emerald-200/50">
          <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800 font-semibold">Tous les cas de test sont valides. Vous pouvez valider le total et passer à la phase de Déploiement.</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 mb-4 bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-semibold">Le projet ne peut pas passer au déploiement tant que tous les cas de test ne sont pas validés par les testeurs.</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        <Link to={`/projects/${project.id}/tests`} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm w-full sm:w-auto text-center ${allTestsPassed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}>
          Voir les tests
        </Link>
        {allTestsPassed && (
           <button 
             onClick={() => updateProject(project.id, { status: 'Déploiement' })}
             className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
           >
             Valider le total & Déployer
           </button>
        )}
      </div>
    </div>
  );
};

const ChefTesteurDashboard = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { teams } = useTeam();

  const myProjectsIds = teams.filter(t => t.members.find(m => m.userId.toString() === user.id.toString())).map(t => t.projectId);
  const myProjects = projects.filter(p => myProjectsIds.includes(p.id));
  
  const projectsInTesting = myProjects.filter(p => p.status === 'Testing');

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <FolderKanban size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Mes Projets (Chef de Test)</p>
            <p className="text-3xl font-bold text-slate-800">{myProjects.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Projets en phase Testing</p>
            <p className="text-3xl font-bold text-slate-800">{projectsInTesting.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Validation Requise (Testing)</h2>
          </div>
          <div className="space-y-4">
            {projectsInTesting.length > 0 ? projectsInTesting.map(project => (
              <ProjectTestingCard key={project.id} project={project} />
            )) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 font-medium">Aucun projet n'est actuellement en phase de test.</p>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="text-slate-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Tous mes projets</h2>
          </div>
          <div className="space-y-4">
            {myProjects.length > 0 ? myProjects.map(project => (
              <div key={project.id} className="p-5 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-slate-100 hover:shadow-sm transition-all">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{project.nom}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black">{project.status}</span>
                </div>
                <div className="flex items-center justify-between mt-5">
                  <div className="w-2/3 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                  </div>
                  <Link to={`/projects/${project.id}/dashboard`} className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    Aperçu <Play size={12} />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <FolderKanban className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 font-medium">Vous n'êtes assigné à aucun projet pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefTesteurDashboard;
