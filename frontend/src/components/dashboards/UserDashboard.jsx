import React from 'react';
import {
  FileText, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle, Download,
  Bell, ArrowRight, ExternalLink, BarChart3, PieChart, Activity, TrendingUp,
  Shield, Zap, ArrowUpRight, ChevronRight, Eye, Briefcase
} from 'lucide-react';
import { useAuth, useDemandes, useProjects, useCharter, useUser } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../Popup';
import { generateDemandePDF } from '../../utils/pdfGenerator';
import { formatUserDisplayName } from '../../utils/userUtils';

const UserDashboard = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const navigate = useNavigate();
  const { demandes } = useDemandes();
  const { projects } = useProjects();
  const { charters } = useCharter();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  const userFullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim().toLowerCase();
  const userFullNameAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim().toLowerCase();

  const myDemandes = demandes.filter(d => {
    if (d.statut === 'Brouillon') return false;
    const name = (d.nomDemandeur || '').trim().toLowerCase();
    if (!name) return true;
    return name === userFullName || name === userFullNameAlt || (user?.nom && name.includes(user.nom.toLowerCase()));
  });

  const myChartersPendingAction = charters.filter(c => {
    if (c.statut !== 'Envoyé au Demandeur') return false;
    const relatedDemande = demandes.find(d => d.id === c.demandeId);
    if (!relatedDemande) return false;
    const name = (relatedDemande.nomDemandeur || '').trim().toLowerCase();
    return name === userFullName || name === userFullNameAlt || (user?.nom && name.includes(user.nom.toLowerCase()));
  });

  const myProjects = projects.filter(p => {
    const d = demandes.find(dem => dem.id === (p.demandeId || p.id));
    if (!d) return false; // Fixed: only include projects linked to user's demandes
    const name = (d.nomDemandeur || '').trim().toLowerCase();
    return name === userFullName || name === userFullNameAlt || (user?.nom && name.includes(user.nom.toLowerCase()));
  });

  const handleExportPDF = async (demande) => {
    try {
      setPopup({ isOpen: true, title: 'Exportation en cours', message: 'Veuillez patienter...', type: 'info' });
      await generateDemandePDF(demande);
      setPopup({ isOpen: true, title: 'Succès', message: `Le PDF de la demande ${demande.id} a été exporté.`, type: 'success' });
    } catch {
      setPopup({ isOpen: true, title: 'Erreur', message: 'Erreur lors de l\'exportation.', type: 'error' });
    }
  };

  const totalDemandes    = myDemandes.length;
  const acceptedDemandes = myDemandes.filter(d => d.statut === 'Acceptée').length;
  const enCoursDemandes  = myDemandes.filter(d => d.statut === 'En cours').length;
  const refusedDemandes  = myDemandes.filter(d => d.statut === 'Refusée').length;
  const approvalRate     = totalDemandes ? Math.round((acceptedDemandes / totalDemandes) * 100) : 0;
  const totalMyProjProgress = myProjects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgMyProjProgress   = myProjects.length ? Math.round(totalMyProjProgress / myProjects.length) : 0;

  // Donut chart calculations
  const statusData = [
    { name: 'Acceptées', count: acceptedDemandes, color: '#10b981' },
    { name: 'En cours', count: enCoursDemandes, color: '#3b82f6' },
    { name: 'Refusées', count: refusedDemandes, color: '#f43f5e' }
  ];

  const circumference = 2 * Math.PI * 42;
  let accumPct = 0;
  const donutSlices = statusData.map(s => {
    const pct = totalDemandes ? s.count / totalDemandes : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumPct * circumference;
    accumPct += pct;
    return { ...s, pct, strokeDasharray, strokeDashoffset };
  });

  const statusColor = (statut) => {
    if (statut === 'Acceptée') return 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs';
    if (statut === 'Refusée')  return 'bg-rose-50 text-rose-700 border border-rose-200/70 shadow-xs';
    if (['En cours', 'En Développement', 'Validée'].includes(statut))  return 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-xs';
    return 'bg-amber-50 text-amber-700 border border-amber-200/70 shadow-xs';
  };

  return (
    <div className="space-y-8">
      {/* Strategic Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
            <Shield size={16} /> Espace Demandeur SI
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bienvenue, {`${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email}
          </h1>
          <p className="text-slate-300 mt-2 text-sm md:text-base max-w-2xl font-medium">
            Suivez l'état de vos demandes SI, validez vos chartes de projets et consultez vos travaux en cours.
          </p>
        </div>

        {/* Header Stats & Action Pill */}
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-400">{totalDemandes}</p>
              <p className="text-[10px] text-slate-300 uppercase font-bold">Demandes</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-amber-400">{enCoursDemandes}</p>
              <p className="text-[10px] text-slate-300 uppercase font-bold">En Cours</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400">{approvalRate}%</p>
              <p className="text-[10px] text-slate-300 uppercase font-bold">Approbation</p>
            </div>
          </div>

          <Link
            to="/demande-si"
            className="flex items-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-900/40 transition-all border border-blue-400/30 shrink-0"
          >
            <PlusCircle size={16} /> Nouvelle Demande SI
          </Link>
        </div>
      </div>

      {/* Action Required Callout Banner */}
      {myChartersPendingAction.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-indigo-300">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-indigo-900">
                  Charte(s) en attente de votre validation
                </h2>
                <p className="text-xs text-indigo-700">
                  Le PM vous a soumis une charte de projet. Veuillez la relire et l'accepter.
                </p>
              </div>
            </div>
            <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
              {myChartersPendingAction.length} action(s)
            </span>
          </div>

          <div className="p-5 space-y-3">
            {myChartersPendingAction.map(charter => {
              const relatedDemande = demandes.find(d => d.id === charter.demandeId);
              return (
                <div
                  key={charter.demandeId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{charter.titre || `Projet — ${charter.demandeId}`}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Demande : <span className="font-semibold">{charter.demandeId}</span>
                        {relatedDemande && ` · ${relatedDemande.service || ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      Validation Requise
                    </span>
                    <Link
                      to={`/project-charter?demandeId=${charter.demandeId}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Examiner la charte <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Mes Demandes SI</p>
              <p className="text-3xl font-black text-slate-800">{totalDemandes}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Accéder au registre</span>
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">En Cours d'Instruction</p>
              <p className="text-3xl font-black text-amber-600">{enCoursDemandes}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>En cours : <strong className="text-blue-600 font-bold">{enCoursDemandes}</strong></span>
          </div>
        </div>

        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-emerald-600 transition-colors">Demandes Acceptées</p>
              <p className="text-3xl font-black text-emerald-600">{acceptedDemandes}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Soumissions validées</span>
            <ArrowUpRight size={14} className="text-emerald-600" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/demande-si')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-purple-600 transition-colors">Taux de Faisabilité SI</p>
              <p className="text-3xl font-black text-purple-600">{approvalRate}%</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold">
            <span>{acceptedDemandes} sur {totalDemandes} retenue(s)</span>
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Donut Chart Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
              <PieChart className="text-blue-600" size={18} />
              Répartition de mes Demandes SI par Statut
            </h3>
            <p className="text-xs text-slate-400 mb-4">Statistiques d'avancement de vos soumissions</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-2">
              {/* Donut SVG */}
              <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {totalDemandes > 0 && donutSlices.map((slice, idx) => slice.count > 0 && (
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
                  <span className="text-2xl font-black text-slate-800 tracking-tight">{totalDemandes}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demandes</span>
                </div>
              </div>

              {/* Legend & Percentages */}
              <div className="w-full space-y-1.5 text-xs">
                {statusData.map(st => {
                  const pct = totalDemandes ? Math.round((st.count / totalDemandes) * 100) : 0;
                  return (
                    <div key={st.name} className="flex items-center justify-between p-1 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: st.color }} />
                        <span className="font-semibold text-slate-700 text-[11px] truncate">{st.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-slate-800 text-xs">{st.count}</span>
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
            <span className="text-slate-500">Taux d'Approbation Global : <strong className="text-emerald-600 font-bold">{approvalRate}%</strong></span>
            <span className="text-blue-600 font-bold">{totalDemandes} enregistrées</span>
          </div>
        </div>

        {/* Gouvernance & Suivi du Portefeuille Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Activity className="text-indigo-600" size={18} />
                Avancement de mes Projets SI
              </h3>
              <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {myProjects.length} projet(s)
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Progression des projets créés à partir de vos demandes</p>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/60 rounded-2xl border border-indigo-100/70">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-slate-700">Progression moyenne des travaux</span>
                  <span className="font-black text-indigo-600 text-sm">{avgMyProjProgress}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 shadow-inner overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${avgMyProjProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">Demandes SI Soumises</span>
                  <span className="font-black text-slate-800 text-base">{totalDemandes}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-600 block text-[10px] font-bold uppercase mb-0.5">Demandes Acceptées</span>
                  <span className="font-black text-emerald-700 text-base">{acceptedDemandes}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Demandes en cours : <strong className="text-amber-600 font-bold">{enCoursDemandes}</strong></span>
            <Link
              to="/demande-si"
              className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              Mes Demandes <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mes Projets List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Mes Projets en Cours d'Exécution</h2>
        </div>
        <div className="space-y-4">
          {myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProjects.map(project => (
                <div key={project.id} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate(`/projects/${project.id}/dashboard`)}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-800 truncate pr-2">{project.nom}</h3>
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0">
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">{project.progress || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
              <Briefcase className="text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 text-sm font-medium">Vous n'avez aucun projet en cours d'exécution.</p>
              <p className="text-slate-400 text-xs mt-1">Les projets apparaîtront ici une fois vos demandes SI validées et planifiées.</p>
            </div>
          )}
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

export default UserDashboard;