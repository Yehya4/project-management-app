import React from 'react';
import { Server, ShieldCheck, FolderKanban, Users, TrendingUp, Activity, PieChart, FileText, CheckCircle2, Clock, XCircle, ArrowUpRight, BarChart2, Shield } from 'lucide-react';
import { useUser, useAuth, useDemandes, useProjects, useCharter } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../Popup';

const AdminDashboard = () => {
  const { users } = useUser();
  const { user } = useAuth();
  const { demandes } = useDemandes();
  const { projects } = useProjects();
  const { charters } = useCharter();
  const navigate = useNavigate();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  const activeProjects = projects.filter(p => !['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const validatedProjects = projects.filter(p => ['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');
  const enCoursDemandes = filteredDemandes.filter(d => d.statut === 'En cours').length;
  const acceptedDemandes = filteredDemandes.filter(d => d.statut === 'Acceptée').length;
  const refusedDemandes = filteredDemandes.filter(d => d.statut === 'Refusée').length;
  
  const approvalRate = filteredDemandes.length ? Math.round((acceptedDemandes / filteredDemandes.length) * 100) : 0;

  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;

  // Role Breakdown
  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // Project Stages Breakdown
  const initiationCount = projects.filter(p => p.status === 'Initiation' || p.status === 'En Préparation').length;
  const devCount = projects.filter(p => ['Développement', 'En cours', 'In Progress'].includes(p.status)).length;
  const testingCount = projects.filter(p => ['Testing', 'Fait'].includes(p.status)).length;
  const deployCount = projects.filter(p => ['Déploiement', 'Clôture'].includes(p.status)).length;

  const phasesData = [
    { name: 'Initiation', count: initiationCount, color: '#3b82f6' },
    { name: 'Développement', count: devCount, color: '#6366f1' },
    { name: 'Testing', count: testingCount, color: '#a855f7' },
    { name: 'Déploiement', count: deployCount, color: '#f59e0b' },
    { name: 'Terminé / Utilisation', count: validatedProjects, color: '#10b981' }
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

  return (
    <div className="space-y-8 pb-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Système 100% Opérationnel
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Tour de Contrôle Administrateur
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl">
            Supervision analytique globale : santé du système, indicateurs de performance des projets et statistiques des utilisateurs.
          </p>
        </div>
      </div>

      {/* Main KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => navigate('/projects')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
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
            <span>Actifs : <strong className="text-emerald-600 font-bold">{activeProjects}</strong></span>
            <span>Terminés : <strong className="text-slate-700 font-semibold">{validatedProjects}</strong></span>
          </div>
        </div>

        <div onClick={() => navigate('/users')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Comptes Utilisateurs</p>
              <p className="text-3xl font-black text-slate-800">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Gérer les accès</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div onClick={() => navigate('/projects')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600 transition-colors">Avancement Global</p>
              <p className="text-3xl font-black text-indigo-600">{avgProgress}%</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }}></div>
          </div>
        </div>

        <div onClick={() => navigate('/demande-si')} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">Demandes SI Soumises</p>
              <p className="text-3xl font-black text-slate-800">{filteredDemandes.length}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>{enCoursDemandes} en cours</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {myChartersPendingAction.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">!</div>
            <div>
              <h2 className="text-sm font-bold text-indigo-900">Charte(s) en attente de votre validation (Demandeur)</h2>
              <p className="text-xs text-indigo-600">Action requise sur votre charte personnelle.</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {myChartersPendingAction.map(charter => (
              <div key={charter.demandeId} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs">
                <span className="font-bold text-slate-800">{charter.titre || `Projet — ${charter.demandeId}`}</span>
                <Link to={`/project-charter?demandeId=${charter.demandeId}`} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                  Voir la charte
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Statistics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Stage Distribution - SVG Donut Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <PieChart className="text-blue-600" size={18} />
              Distribution des Projets par Phase
            </h3>
            <p className="text-xs text-slate-400 mb-4">Statistiques d'avancement du portefeuille</p>

            {/* Donut Chart Container */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-2">
              {/* SVG Donut */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                  />
                  {/* Phase Slices */}
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
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">{projects.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projets</span>
                </div>
              </div>

              {/* Legend & Stats */}
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
            <span className="text-emerald-600 font-bold">{validatedProjects} terminés</span>
          </div>
        </div>

        {/* Demandes SI Approval Stats */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <BarChart2 className="text-emerald-600" size={18} />
              Métriques des Demandes SI
            </h3>
            <p className="text-xs text-slate-400 mb-4">Taux d'approbation et état des flux</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Acceptées</span>
                <span className="text-xl font-black text-emerald-700">{acceptedDemandes}</span>
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Total</span>
                <span className="text-xl font-bold text-blue-800 leading-tight">{filteredDemandes.length}</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">En Cours</span>
                <span className="text-xl font-bold text-amber-800 leading-tight">{enCoursDemandes}</span>
              </div>
              <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Refusées</span>
                <span className="text-xl font-black text-rose-700">{refusedDemandes}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Taux d'Approbation</span>
                <span className="font-extrabold text-emerald-600">{approvalRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Registre global SI</span>
            <span className="font-bold text-slate-700">{filteredDemandes.length} soumissions</span>
          </div>
        </div>

        {/* User Role Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <Shield className="text-indigo-600" size={18} />
              Répartition des Rôles Utilisateurs
            </h3>
            <p className="text-xs text-slate-400 mb-5">Vue des privilèges et des comptes activés</p>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Administrateurs</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-md">{roleCounts['Admin'] || 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Project Managers (PM)</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-md">{roleCounts['Project Manager'] || 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Développeurs & Testeurs</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-md">
                  {(roleCounts['Developer'] || 0) + (roleCounts['Tester'] || 0) + (roleCounts['Chef Testeur'] || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Sponsors & Demandeurs</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-md">
                  {(roleCounts['Sponsor'] || 0) + (roleCounts['User'] || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Comptes au total</span>
            <span className="font-bold text-slate-800">{users.length} comptes</span>
          </div>
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

export default AdminDashboard;