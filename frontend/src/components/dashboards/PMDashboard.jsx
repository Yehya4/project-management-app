import React from 'react';
import {
  FolderKanban, Users, TrendingUp, Check, X, BarChart3, PieChart, Activity,
  CheckCircle, Clock, AlertCircle, FileText, ArrowRight, Shield, Zap,
  ArrowUpRight, ChevronRight, Eye, Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../Popup';
import { generateDemandePDF } from '../../utils/pdfGenerator';
import { useAuth, useDemandes, useProjects, useUser, useCharter } from '../../context/AppContext';
import { formatUserDisplayName } from '../../utils/userUtils';

const PMDashboard = () => {
  const navigate = useNavigate();
  const { demandes, updateDemandeStatus } = useDemandes();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });
  const { projects } = useProjects();
  const { users } = useUser();
  const { charters } = useCharter();
  const { user } = useAuth();

  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');

  const handleExportPDF = async (demande) => {
    try {
      setPopup({ isOpen: true, title: 'Exportation en cours', message: 'Veuillez patienter pendant la génération du PDF...', type: 'info' });
      await generateDemandePDF(demande);
      setPopup({ isOpen: true, title: 'Succès', message: `Le PDF de la demande ${demande.id} a été exporté avec succès.`, type: 'success' });
    } catch (error) {
      setPopup({ isOpen: true, title: 'Erreur', message: 'Une erreur est survenue lors de l\'exportation du PDF.', type: 'error' });
    }
  };

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

  const activeProjects   = projects.filter(p => !['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const utilCount        = projects.filter(p => ['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const initiationCount  = projects.filter(p => p.status === 'Initiation' || p.status === 'En Préparation').length;
  const devCount         = projects.filter(p => ['Développement', 'En cours', 'In Progress'].includes(p.status)).length;
  const testCount        = projects.filter(p => p.status === 'Testing').length;
  const deployCount      = projects.filter(p => ['Déploiement', 'Clôture', 'Clôturée'].includes(p.status)).length;

  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress   = projects.length ? Math.round(totalProgress / projects.length) : 0;

  // Demandes SI Stats
  const pendingDemandesCount  = filteredDemandes.filter(d => d.statut === 'En attente').length;
  const acceptedDemandesCount = filteredDemandes.filter(d => d.statut === 'Acceptée').length;
  const enCoursDemandesCount  = filteredDemandes.filter(d => d.statut === 'En cours' || d.statut === 'En Développement').length;
  const refusedDemandesCount  = filteredDemandes.filter(d => d.statut === 'Refusée').length;
  const approvalRate = filteredDemandes.length
    ? Math.round(((acceptedDemandesCount + enCoursDemandesCount) / filteredDemandes.length) * 100)
    : 0;

  // Donut chart calculations
  const phasesData = [
    { name: 'Initiation', count: initiationCount, color: '#3b82f6' },
    { name: 'Développement', count: devCount, color: '#6366f1' },
    { name: 'Testing', count: testCount, color: '#a855f7' },
    { name: 'Déploiement', count: deployCount, color: '#f59e0b' },
    { name: 'Terminé / Utilisation', count: utilCount, color: '#10b981' }
  ];

  const circumference = 2 * Math.PI * 42;
  let accumPct = 0;
  const donutSlices = phasesData.map(p => {
    const pct = projects.length ? p.count / projects.length : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumPct * circumference;
    accumPct += pct;
    return { ...p, pct, strokeDasharray, strokeDashoffset };
  });

  const statusColor = (status) => {
    if (status === 'Initiation')    return 'bg-blue-50 text-blue-700 border-blue-200/70 shadow-xs';
    if (['Développement', 'En cours', 'In Progress'].includes(status)) return 'bg-indigo-50 text-indigo-700 border-indigo-200/70 shadow-xs';
    if (['Testing', 'Fait'].includes(status))     return 'bg-purple-50 text-purple-700 border-purple-200/70 shadow-xs';
    if (['Déploiement', 'Clôture', 'Clôturée'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-200/70 shadow-xs';
    if (['Utilisation', 'Archive', 'Archivée'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200/70 shadow-xs';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-8">
      {/* Strategic Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Briefcase size={16} /> Operations & Project Management
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tableau de Bord Project Manager
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl font-medium">
            Pilotage opérationnel du portefeuille, avancement des projets et gestion des ressources IT.
          </p>
        </div>

        {/* Header Stats Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/10 shrink-0 relative z-10">
          <div className="text-center">
            <p className="text-2xl font-black text-indigo-400">{activeProjects}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Actifs</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-black text-blue-300">{avgProgress}%</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Avancement</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-black text-teal-400">{users.length}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Équipe</p>
          </div>
        </div>
      </div>

      {/* Action Notification Box */}
      {myChartersPendingAction.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-indigo-900">
                  Charte(s) en attente de votre validation
                </h2>
                <p className="text-xs text-indigo-700">
                  En tant que demandeur, veuillez examiner et accepter vos chartes de projets.
                </p>
              </div>
            </div>
            <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
              {myChartersPendingAction.length} action(s)
            </span>
          </div>

          <div className="p-5 space-y-3">
            {myChartersPendingAction.map(charter => (
              <div key={charter.demandeId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800">{charter.titre || `Projet — ${charter.demandeId}`}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Demande : <span className="font-semibold">{charter.demandeId}</span></p>
                </div>
                <Link
                  to={`/project-charter?demandeId=${charter.demandeId}`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                >
                  Accepter la charte <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">Projets sous Gestion</p>
              <p className="text-3xl font-black text-slate-800">{projects.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FolderKanban size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Actifs : <strong className="text-indigo-600 font-bold">{activeProjects}</strong></span>
            <span>Terminés : <strong className="text-emerald-600 font-bold">{utilCount}</strong></span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Avancement Global</p>
              <p className="text-3xl font-black text-blue-600">{avgProgress}%</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/users')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-teal-600 transition-colors">Membres Équipe IT</p>
              <p className="text-3xl font-black text-slate-800">{users.length}</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-600 font-semibold">
            <span>Gérer l'équipe</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">Demandes SI Soumises</p>
              <p className="text-3xl font-black text-slate-800">{filteredDemandes.length}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Taux d'approbation : <strong className="text-amber-600 font-bold">{approvalRate}%</strong></span>
            <ArrowUpRight size={14} className="text-amber-600" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Donut Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <PieChart className="text-indigo-600" size={18} />
              Distribution des Projets par Phase
            </h3>
            <p className="text-xs text-slate-400 mb-4">Répartition des projets par étape de développement</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-2">
              {/* Donut SVG */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {projects.length > 0 && donutSlices.map((slice, idx) => slice.count > 0 && (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="12"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-700 ease-out hover:opacity-80"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">{projects.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projets</span>
                </div>
              </div>

              {/* Legend & Percentages */}
              <div className="w-full space-y-1.5 text-xs">
                {phasesData.map(phase => {
                  const pct = projects.length ? Math.round((phase.count / projects.length) * 100) : 0;
                  return (
                    <div key={phase.name} className="flex items-center justify-between p-1 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: phase.color }} />
                        <span className="font-semibold text-slate-700 text-[11px] truncate">{phase.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-slate-800 text-xs">{phase.count}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total Projets : <strong className="text-slate-800 font-bold">{projects.length}</strong></span>
            <span className="text-indigo-600 font-bold">{activeProjects} projets actifs</span>
          </div>
        </div>

        {/* Demandes SI Approval Stats Grid */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={18} />
              Gouvernance & Santé des Demandes SI
            </h3>
            <p className="text-xs text-slate-400 mb-4">État des soumissions et taux d'approbation</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Acceptées</span>
                <span className="text-xl font-black text-emerald-700">{acceptedDemandesCount}</span>
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">En Cours</span>
                <span className="text-xl font-black text-blue-700">{enCoursDemandesCount}</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">En Attente</span>
                <span className="text-xl font-black text-amber-700">{pendingDemandesCount}</span>
              </div>
              <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Refusées</span>
                <span className="text-xl font-black text-rose-700">{refusedDemandesCount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Taux d'Approbation Global</span>
                <span className="font-extrabold text-blue-600">{approvalRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Registre des demandes SI</span>
            <span className="font-bold text-slate-700">{filteredDemandes.length} soumissions</span>
          </div>
        </div>
      </div>

      {/* Projects Overview List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Aperçu du Portefeuille de Projets
              </h3>
              <p className="text-xs text-slate-400">Vue synthétique et accès direct aux espaces de travail</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition-all border border-indigo-200/50"
          >
            Voir tous ({projects.length}) <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nom du Projet</th>
                <th className="px-6 py-4">Chef de Projet</th>
                <th className="px-6 py-4">Phase Actuelle</th>
                <th className="px-6 py-4">Progression</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {projects.length > 0 ? (
                projects.slice(0, 6).map(project => {
                  const initial = (project.nom || 'P').charAt(0).toUpperCase();
                  const pmDisplayName = formatUserDisplayName(project.chefProjet, 'PM', users);
                  const initialPM = pmDisplayName ? pmDisplayName.charAt(0).toUpperCase() : 'N';
                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                              {project.nom}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">Ref : {project.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100/80 text-slate-700 rounded-lg text-xs font-semibold">
                          <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            {initialPM}
                          </div>
                          <span>{pmDisplayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border shadow-xs ${statusColor(project.status)}`}>
                          {project.status || 'Initiation'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-700 text-xs px-2 py-0.5 bg-slate-100 rounded-md">
                            {project.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl transition-all font-bold text-xs inline-flex items-center gap-1.5 shadow-sm group-hover:shadow-indigo-500/20"
                        >
                          Workspace <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-medium">
                    Aucun projet sous gestion trouvé dans le portefeuille
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Popup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};

export default PMDashboard;