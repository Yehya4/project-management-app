import React from 'react';
import { BarChart3, PieChart, Activity, TrendingUp, Check, X, FolderKanban, CheckCircle, Clock, AlertCircle, FileText, Building, Target } from 'lucide-react';
import { useAuth } from '../../context/AppContext';
import { useDemandes } from '../../context/AppContext';
import { useProjects } from '../../context/AppContext';

const SponsorDashboard = () => {
  const { demandes, updateDemandeStatus } = useDemandes();
  const { projects } = useProjects();

  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');

  const handleAccept = (demandeId) => {
    updateDemandeStatus(demandeId, 'Acceptée');
  };

  const handleRefuse = (demandeId) => {
    updateDemandeStatus(demandeId, 'Refusée');
  };

  const validatedProjects = projects.filter(p => ['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const delayedProjects = 0;
  const totalBudget = '1.2M MAD';
  const consumedBudget = '850K MAD';

  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <p className="text-sm text-emerald-100 mb-2">Vision sponsor</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tableau de bord stratégique
        </h1>
        <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
          Suivez les indicateurs d’investissement, la performance projetée et l’évolution de vos projets financés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-emerald-50 font-medium mb-1">Budget Total Alloué</p>
              <p className="text-3xl font-bold">{totalBudget}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <PieChart size={24} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-emerald-100">Consommé : {consumedBudget} (45%)</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-50 font-medium mb-1">ROI Projeté</p>
              <p className="text-3xl font-bold">+18.5%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-blue-100">Sur les 2 prochains trimestres</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-300 font-medium mb-1">Projets Validés</p>
              <p className="text-3xl font-bold">{validatedProjects}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Activity size={24} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-300">Sur {projects.length} projets totaux</p>
          <div className="mt-4">
            <span className="text-5xl font-black text-white">{avgProgress}%</span>
            <p className="text-sm text-slate-300">Avancement moyen</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={20} />
            Synthèse Stratégique
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aperçu consolidé de vos projets sponsorisés et de leur évolution récente.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {projects.map(project => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-300"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-base">{project.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Sponsorisé par vous</p>
              </div>

              <div className="text-left md:text-right">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-2 ${
                    project.status === 'Initiation' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'Développement' || project.status === 'En cours' || project.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                    project.status === 'Testing' || project.status === 'Fait' ? 'bg-purple-100 text-purple-700' :
                    project.status === 'Livraison' || ['Clôture', 'Clôturée'].includes(project.status) ? 'bg-amber-100 text-amber-700' :
                    project.status === 'Utilisation' || ['Archive', 'Archivée'].includes(project.status) ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  Statut : {project.status}
                </span>
                <div>
                  <span className="inline-flex text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600">
                    Dernier point : {project.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Demandes SI Utilisateurs</h2>
            <p className="text-sm text-slate-500 mt-1">
              Liste de toutes les Demandes SI soumises par les utilisateurs à évaluer.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Total : <span className="font-semibold text-slate-700">{filteredDemandes.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Référence</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Demandeur</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaines</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemandes.length > 0 ? (
                filteredDemandes.map(demande => (
                  <tr
                    key={demande.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {demande.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {demande.demandeur} ({demande.fonction})
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {demande.domaines.join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            demande.statut === 'Acceptée'
                              ? 'bg-emerald-100 text-emerald-700'
                              : demande.statut === 'Refusée'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                      >
                        {demande.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {demande.statut === 'En attente' && (
                          <>
                            <button
                              onClick={() => handleAccept(demande.id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100"
                              title="Accepter"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRefuse(demande.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm border border-rose-100"
                              title="Refuser"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {demande.statut !== 'En attente' && (
                          <span className="text-slate-400 text-xs italic">Traité</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <p className="font-medium text-slate-600">Aucune demande SI</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Les demandes SI apparaîtront ici.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SponsorDashboard;