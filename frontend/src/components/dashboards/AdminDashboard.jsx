import React from 'react';
import { Server, Settings, ShieldCheck, FolderKanban, Users, TrendingUp, Activity, Check, X, PieChart, FileText, Download } from 'lucide-react';
import { useUser, useAuth } from '../../context/AppContext';
import { useDemandes } from '../../context/AppContext';
import { useProjects } from '../../context/AppContext';
import { useCharter } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../Popup';
import { generateDemandePDF } from '../../utils/pdfGenerator';
import ConfigEditor from './ConfigEditor';
import ArchiveManager from './ArchiveManager';

const AdminDashboard = () => {
  const { users } = useUser();
  const { user } = useAuth();
  const { demandes, updateDemandeStatus } = useDemandes();
  const { projects } = useProjects();
  const { charters } = useCharter();
  const navigate = useNavigate();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  const activeProjects = projects.filter(p => p.status !== 'Utilisation').length;
  const delayedProjects = 0;
  const validatedProjects = projects.filter(p => ['Utilisation', 'Archive', 'Archivée'].includes(p.status)).length;
  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');
  const pendingDemandes = filteredDemandes.filter(d => d.statut === 'En attente').length;
  
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

  const totalBudget = '1.2M MAD';
  const consumedBudget = '850K MAD';
  const totalProgress = projects.reduce((acc, p) => acc + (p.progress || 0), 0);
  const avgProgress = projects.length ? Math.round(totalProgress / projects.length) : 0;

  const handleAcceptDemande = (demandeId) => {
    updateDemandeStatus(demandeId, 'Acceptée');
  };

  const handleRefuseDemande = (demandeId) => {
    updateDemandeStatus(demandeId, 'Refusée');
  };

  const handleExportPDF = async (demande) => {
    try {
      setPopup({ isOpen: true, title: 'Exportation en cours', message: 'Veuillez patienter pendant la génération du PDF...', type: 'info' });
      await generateDemandePDF(demande);
      setPopup({ isOpen: true, title: 'Succès', message: `Le PDF de la demande ${demande.id} a été exporté avec succès.`, type: 'success' });
    } catch (error) {
      setPopup({ isOpen: true, title: 'Erreur', message: 'Une erreur est survenue lors de l\'exportation du PDF.', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <p className="text-sm text-blue-100 mb-2">Administration système & Supervision globale</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tour de Contrôle Administrateur
        </h1>
        <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
          Supervisez l’intégralité de la plateforme : état du système, avancement des projets, utilisateurs et configuration.
        </p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Système</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-emerald-600">Opérationnel</p>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
            </div>
            <div className="bg-slate-100 p-3 rounded-2xl">
              <Server size={24} className="text-slate-700" />
            </div>
          </div>
        </div>

        <div onClick={() => navigate('/users')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 group transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1 group-hover:text-blue-600 transition-colors">Comptes Utilisateurs</p>
              <p className="text-3xl font-bold text-slate-800">{users.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-600 transition-colors">
              <Users size={24} className="text-blue-600 group-hover:text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Avancement Global</p>
              <p className="text-3xl font-bold text-slate-800">{avgProgress}%</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-2xl">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Sur {projects.length} projets</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">Demandes en attente</p>
              <p className="text-3xl font-bold text-amber-600">{pendingDemandes}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl">
              <Activity size={24} className="text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-slate-500">Total : {filteredDemandes.length} demandes</p>
        </div>
      </div>

      {myChartersPendingAction.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="font-bold">!</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-indigo-900">Charte(s) en attente de votre validation (en tant que Demandeur)</h2>
              <p className="text-xs text-indigo-600 mt-0.5">Veuillez lire et accepter vos propres chartes.</p>
            </div>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Accepter la charte
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-4 text-sm">Répartition des Projets</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>En Cours</span>
              <span className="font-semibold text-slate-800">{activeProjects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Validés</span>
              <span className="font-semibold text-slate-800">{validatedProjects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span>En Retard</span>
              <span className="font-semibold text-slate-800">{delayedProjects}</span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="text-indigo-600" size={20} />
            Vue d'ensemble des Projets
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {projects.map(project => (
            <div key={project.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-300">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-slate-800 text-base">{project.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    project.status === 'Initiation' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'Développement' || project.status === 'En cours' || project.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                    project.status === 'Testing' || project.status === 'Fait' ? 'bg-purple-100 text-purple-700' :
                    project.status === 'Déploiement' || ['Clôture', 'Clôturée'].includes(project.status) ? 'bg-amber-100 text-amber-700' :
                    project.status === 'Utilisation' || ['Archive', 'Archivée'].includes(project.status) ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{project.description}</p>
              </div>
              <div className="w-full md:w-64 shrink-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-slate-500">Progression</span>
                  <span className="text-xs font-bold text-slate-700">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Toutes les Demandes SI</h2>
            <p className="text-sm text-slate-500 mt-1">Supervision des demandes de tous les utilisateurs.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Référence</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Demandeur</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDemandes.map(demande => (
                <tr key={demande.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{demande.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{demande.nomDemandeur}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${demande.statut === 'Acceptée' ? 'bg-emerald-100 text-emerald-700' : demande.statut === 'Refusée' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {demande.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {demande.statut === 'En attente' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleAcceptDemande(demande.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Check size={18} /></button>
                        <button onClick={() => handleRefuseDemande(demande.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><X size={18} /></button>
                      </div>
                    )}
                    {demande.statut !== 'Brouillon' && (
                      <button
                        onClick={() => handleExportPDF(demande)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 text-xs font-semibold"
                        title="Exporter la demande en PDF"
                      >
                        <Download size={14} /> Exporter PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      <ConfigEditor />
      <ArchiveManager />
      
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