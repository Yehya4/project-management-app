import React from 'react';
import {
  BarChart3, PieChart, Activity, TrendingUp, Check, X,
  FolderKanban, CheckCircle, Clock, AlertCircle, FileText,
  Building, Target, Bell, ArrowRight, Shield, FileSpreadsheet,
  Box, Eye, RefreshCw, Zap, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useDemandes, useProjects, useCharter, useUser } from '../../context/AppContext';
import { formatUserDisplayName } from '../../utils/userUtils';

const SponsorDashboard = () => {
  const { demandes, updateDemandeStatus } = useDemandes();
  const { projects, updateProject } = useProjects();
  const { charters } = useCharter();
  const { user } = useAuth();
  const { users } = useUser();
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

  const initiationCount = projects.filter(p => p.status === 'Initiation' || p.status === 'En Préparation').length;
  const devCount        = projects.filter(p => ['Développement', 'En cours', 'In Progress'].includes(p.status)).length;
  const testCount       = projects.filter(p => p.status === 'Testing').length;
  const deployCount     = projects.filter(p => ['Déploiement', 'Clôture', 'Clôturée'].includes(p.status)).length;
  const utilCount       = projects.filter(p => ['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;

  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress   = projects.length ? Math.round(totalProgress / projects.length) : 0;

  // Demandes SI Stats
  const pendingDemandesCount = filteredDemandes.filter(d => d.statut === 'En attente').length;
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
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Shield size={16} /> Vision & Governance Sponsor
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tableau de Bord Stratégique
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
            Suivi analytique du portefeuille, avancement des projets financés et gouvernance des validations.
          </p>
        </div>

        {/* Header Stats Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/10 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-400">{projects.length}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Projets</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-black text-teal-300">{avgProgress}%</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">Avancement</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-2xl font-black text-amber-400">{totalPendingActions}</p>
            <p className="text-[10px] text-slate-300 uppercase font-bold">À Valider</p>
          </div>
        </div>
      </div>

      {/* Pending Actions Notification Section */}
      {totalPendingActions > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm shadow-amber-300">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  Validations Requises en Attente
                </h2>
                <p className="text-xs text-amber-700">
                  Des actions administratives et techniques nécessitent votre approbation.
                </p>
              </div>
            </div>
            <span className="bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
              {totalPendingActions} action(s)
            </span>
          </div>

          <div className="p-5 space-y-3">
            {/* Charters Demandeur */}
            {myChartersPendingAction.map(charter => (
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
            ))}

            {/* Charters Sponsor */}
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
                        {relatedDemande && ` · Demandeur : ${formatUserDisplayName(relatedDemande.nomDemandeur, 'User', users)}`}
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

            {/* Backlogs */}
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

            {/* Architectures */}
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

      {/* Main KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">Portefeuille Projets</p>
              <p className="text-3xl font-black text-slate-800">{projects.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FolderKanban size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>En cours : <strong className="text-blue-600 font-bold">{projects.length - utilCount}</strong></span>
            <span>Terminés : <strong className="text-emerald-600 font-bold">{utilCount}</strong></span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-teal-600 transition-colors">Avancement Moyen</p>
              <p className="text-3xl font-black text-teal-600">{avgProgress}%</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">Validations Requis</p>
              <p className="text-3xl font-black text-amber-600">{totalPendingActions}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Zap size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>Action requise</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">Demandes SI Registre</p>
              <p className="text-3xl font-black text-slate-800">{filteredDemandes.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Approbation : <strong className="text-indigo-600 font-bold">{approvalRate}%</strong></span>
            <ArrowUpRight size={14} className="text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Visual Statistics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Donut Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <PieChart className="text-emerald-600" size={18} />
              Distribution du Portefeuille par Phase
            </h3>
            <p className="text-xs text-slate-400 mb-4">Répartition des projets par étapes du cycle de vie</p>

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
            <span className="text-emerald-600 font-bold">{utilCount} terminés</span>
          </div>
        </div>

        {/* Demandes SI Approval Stats Grid */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" size={18} />
              Gouvernance & Métriques Demandes SI
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
                <span className="font-extrabold text-emerald-600">{approvalRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Registre des demandes SI</span>
            <span className="font-bold text-slate-700">{filteredDemandes.length} soumissions</span>
          </div>
        </div>
      </div>

      {/* Sponsored Projects Quick Overview List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Projets du Portefeuille Sponsorisé
              </h3>
              <p className="text-xs text-slate-400">Vue synthétique et état d'avancement des projets financés</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-xl transition-all border border-emerald-200/50"
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
                          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm">
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
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
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
                          className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold text-xs inline-flex items-center gap-1.5 shadow-sm group-hover:shadow-emerald-500/20"
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
                    Aucun projet sponsorisé trouvé dans le portefeuille
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