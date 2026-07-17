import React from 'react';
import {
  BarChart3, PieChart, Activity, TrendingUp, Check, X,
  FolderKanban, CheckCircle, Clock, AlertCircle, FileText,
  Building, Target, Bell, ArrowRight, Shield, FileSpreadsheet,
  Box, Eye, RefreshCw, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import { useDemandes } from '../../context/AppContext';
import { useProjects } from '../../context/AppContext';
import { useCharter } from '../../context/AppContext';

const SponsorDashboard = () => {
  const { demandes, updateDemandeStatus } = useDemandes();
  const { projects, updateProject } = useProjects();
  const { charters } = useCharter();
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');

  const handleAccept = (demandeId) => updateDemandeStatus(demandeId, 'Acceptée');
  const handleRefuse = (demandeId) => updateDemandeStatus(demandeId, 'Refusée');


  const chartersToValidate = charters.filter(c => c.statut === 'Soumis au Sponsor');


  const myChartersPendingAction = charters.filter(c => {
    if (c.statut !== 'Envoyé au Demandeur') return false;
    const relatedDemande = demandes.find(d => d.id === c.demandeId);
    if (!relatedDemande) return false;
    const fn = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
    const fnAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim();
    return (
      relatedDemande.nomDemandeur === fn ||
      relatedDemande.nomDemandeur === fnAlt
    );
  });


  const backlogsToValidate = projects.filter(p =>
    p.backlogStatus === 'Soumis' && p.backlogFile
  );


  const archsToValidate = projects.filter(p =>
    p.architectureStatus === 'Soumis' && p.architectureFile
  );

  const totalPendingActions = chartersToValidate.length + backlogsToValidate.length + archsToValidate.length;

  
  const validatedProjects = projects.filter(p =>
    ['Utilisation', 'Archive', 'Archivée'].includes(p.status)
  ).length;

  const totalBudget    = '0M MAD';
  const consumedBudget = '0k MAD';

  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress   = projects.length ? Math.round(totalProgress / projects.length) : 0;

  
  const handleValidateCharter = (charter) => {

    navigate(`/project-charter?demandeId=${charter.demandeId}`);
  };

  const handleValidateBacklog = (project) => {
    updateProject(project.id, { backlogStatus: 'Validé', sponsorComment: null });
  };

  const handleValidateArchitecture = async (project) => {
    await updateProject(project.id, { architectureStatus: 'Validé', status: 'Développement', sponsorComment: null });
  };

  const statusColor = (status) => {
    if (status === 'Initiation')    return 'bg-blue-100 text-blue-700';
    if (['Développement', 'En cours', 'In Progress'].includes(status)) return 'bg-indigo-100 text-indigo-700';
    if (['Testing', 'Fait'].includes(status))     return 'bg-violet-100 text-violet-700';
    if (['Déploiement', 'Clôture', 'Clôturée'].includes(status)) return 'bg-amber-100 text-amber-700';
    if (['Utilisation', 'Archive', 'Archivée'].includes(status)) return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-8">

      {}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <p className="text-sm text-emerald-100 mb-2">Vision sponsor</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tableau de bord stratégique
        </h1>
        <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
          Suivez les indicateurs d'investissement, la performance projetée et l'évolution de vos projets financés.
        </p>
      </div>

      {}
      {totalPendingActions > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-amber-100 bg-amber-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm shadow-amber-300">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-900">
                Actions requises de votre part
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Des validations sont en attente sur les projets en cours d'initiation.
              </p>
            </div>
            <span className="ml-auto bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
              {totalPendingActions}
            </span>
          </div>

          <div className="p-5 space-y-3">

            {}
            {myChartersPendingAction.map(charter => {
              const relatedDemande = demandes.find(d => d.id === charter.demandeId);
              return (
                <div
                  key={`demandeur-${charter.demandeId}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        🔔 Accepter la charte (En tant que Demandeur)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {charter.titre || charter.demandeId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      Demandeur
                    </span>
                    <button
                      onClick={() => handleValidateCharter(charter)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Accepter <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {}
            {chartersToValidate.map(charter => {
              const relatedDemande = demandes.find(d => d.id === charter.demandeId);
              return (
                <div
                  key={charter.demandeId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        ✅ Valider le Project Charter
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {charter.titre || charter.demandeId}
                        {relatedDemande && ` · Demandeur : ${relatedDemande.nomDemandeur}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      Charter
                    </span>
                    <button
                      onClick={() => handleValidateCharter(charter)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Valider <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {}
            {backlogsToValidate.map(project => (
              <div
                key={`backlog-${project.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-orange-50/60 border border-orange-100 rounded-2xl hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      📋 Valider le Backlog
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.nom} · Fichier : <span className="font-semibold">{project.backlogFile}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    Backlog
                  </span>
                  <button
                    onClick={() => handleValidateBacklog(project)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircle size={14} /> Valider
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${project.id}/documents`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Eye size={14} /> Voir
                  </button>
                </div>
              </div>
            ))}

            {}
            {archsToValidate.map(project => (
              <div
                key={`arch-${project.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Box size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      🏗️ Valider l'Architecture Technique
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.nom} · Fichier : <span className="font-semibold">{project.architectureFile}</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      ⚡ La validation lance automatiquement la phase Développement
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    Architecture
                  </span>
                  <button
                    onClick={() => handleValidateArchitecture(project)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircle size={14} /> Valider → Développement
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${project.id}/documents`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Eye size={14} /> Voir
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-emerald-50 font-medium mb-1">Budget Total Alloué</p>
              <p className="text-3xl font-bold">{totalBudget}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><PieChart size={24} className="text-white" /></div>
          </div>
          <p className="text-sm text-emerald-100">Consommé : {consumedBudget} (45%)</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-50 font-medium mb-1">ROI Projeté</p>
              <p className="text-3xl font-bold">+18.5%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><TrendingUp size={24} className="text-white" /></div>
          </div>
          <p className="text-sm text-blue-100">Sur les 2 prochains trimestres</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-300 font-medium mb-1">Projets Validés</p>
              <p className="text-3xl font-bold">{validatedProjects}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><Activity size={24} className="text-white" /></div>
          </div>
          <p className="text-sm text-slate-300">Sur {projects.length} projets totaux</p>
          <div className="mt-3">
            <span className="text-4xl font-black text-white">{avgProgress}%</span>
            <p className="text-sm text-slate-300">Avancement moyen</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={20} />
            Synthèse Stratégique des Projets
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aperçu consolidé de vos projets sponsorisés et de leur évolution.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {projects.length > 0 ? projects.map(project => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-base">{project.nom}</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-0.5 rounded">{project.id}</span>
                </div>
                <p className="text-sm text-slate-500">Sponsorisé par vous</p>
                {}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-32 h-1.5 bg-slate-200 rounded-full">
                    <div
                      className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{project.progress || 0}%</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(project.status)}`}>
                  {project.status}
                </span>
                <button
                  onClick={() => navigate(`/projects/${project.id}/documents`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <Eye size={14} /> Documents
                </button>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center text-slate-400">
              <FolderKanban size={36} className="mx-auto mb-3 text-slate-300" />
              <p>Aucun projet pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Demandes SI Utilisateurs</h2>
            <p className="text-sm text-slate-500 mt-1">
              Liste de toutes les Demandes SI soumises par les utilisateurs.
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{demande.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.nomDemandeur} ({demande.fonction})</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.domaines.join(', ')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        demande.statut === 'Acceptée' ? 'bg-emerald-100 text-emerald-700' :
                        demande.statut === 'Refusée'  ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
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
                            ><Check size={16} /></button>
                            <button
                              onClick={() => handleRefuse(demande.id)}
                              className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm border border-rose-100"
                              title="Refuser"
                            ><X size={16} /></button>
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
                      <p className="text-sm text-slate-400 mt-1">Les demandes SI apparaîtront ici.</p>
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