import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, PlusCircle, Download, Bell, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AppContext';
import { useDemandes } from '../../context/AppContext';
import { useCharter } from '../../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import Popup from '../Popup';
import { generateDemandePDF } from '../../utils/pdfGenerator';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { demandes } = useDemandes();
  const { charters } = useCharter();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  /* ── My demandes ──────────────────────────────────────────── */
  const myDemandes = demandes.filter(d =>
    d.nomDemandeur === user?.name ||
    d.nomDemandeur === `${user?.prenom} ${user?.nom}`.trim() ||
    d.nomDemandeur === `${user?.nom} ${user?.prenom}`.trim()
  );

  /* ── Chartes envoyées au demandeur ───────────────────────── */
  const myChartersPendingAction = charters.filter(c => {
    if (c.statut !== 'Envoyé au Demandeur') return false;
    const relatedDemande = demandes.find(d => d.id === c.demandeId);
    if (!relatedDemande) return false;
    return (
      relatedDemande.nomDemandeur === user?.name ||
      relatedDemande.nomDemandeur === `${user?.prenom} ${user?.nom}`.trim() ||
      relatedDemande.nomDemandeur === `${user?.nom} ${user?.prenom}`.trim()
    );
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

  const enCoursDemandes  = myDemandes.filter(d => d.statut.includes('En cours')).length;
  const valideeDemandes  = myDemandes.filter(d => d.statut === 'Validée' || d.statut === 'Acceptée').length;
  const refuseeDemandes  = myDemandes.filter(d => d.statut === 'Refusée').length;
  const totalDemandes    = myDemandes.length;

  const statusColor = (statut) => {
    if (statut === 'Acceptée') return 'bg-emerald-100 text-emerald-700';
    if (statut === 'Refusée')  return 'bg-rose-100 text-rose-700';
    if (statut === 'Validée')  return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-8">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <p className="text-sm text-blue-100 mb-2">Tableau de bord utilisateur</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bienvenue, {user?.name}
          </h1>
          <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
            Suivez rapidement l'état de vos Demandes SI, vos chartes en attente et vos travaux récents.
          </p>
        </div>
        <div className="mt-6 md:mt-0">
          <Link
            to="/demande-si/nouvelle"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-orange-500/30"
          >
            <PlusCircle size={20} />
            Nouvelle Demande SI
          </Link>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Total Demandes</p>
              <p className="text-3xl font-bold text-slate-800">{totalDemandes}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <FileText size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">En Cours</p>
              <p className="text-3xl font-bold text-slate-800">{enCoursDemandes}</p>
            </div>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Validées</p>
              <p className="text-3xl font-bold text-slate-800">{valideeDemandes}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle size={26} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Refusées</p>
              <p className="text-3xl font-bold text-slate-800">{refuseeDemandes}</p>
            </div>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <XCircle size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* ── ⚡ Chartes en attente de validation ────────────────── */}
      {myChartersPendingAction.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-indigo-300">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-indigo-900">
                Charte(s) en attente de votre validation
              </h2>
              <p className="text-xs text-indigo-600 mt-0.5">
                Le PM vous a envoyé une charte de projet. Veuillez la lire et l'accepter ou la retourner.
              </p>
            </div>
            <span className="ml-auto bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
              {myChartersPendingAction.length}
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
                        {relatedDemande && ` · ${relatedDemande.domaines?.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      En attente de votre validation
                    </span>
                    <Link
                      to={`/project-charter?demandeId=${charter.demandeId}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Voir la charte <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mes Demandes SI ────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Mes Demandes SI</h2>
            <p className="text-sm text-slate-500 mt-1">
              Liste de vos demandes avec leur statut et domaines.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Total : <span className="font-semibold text-slate-700">{myDemandes.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Référence</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Fonction Profil</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaines</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Création</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Soumission</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myDemandes.length > 0 ? (
                myDemandes.map(demande => (
                  <tr
                    key={demande.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{demande.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.fonction || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.domaines.join(', ')}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.dateCreation}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{demande.dateSoumission || (demande.statut !== 'Brouillon' ? demande.dateCreation : '-')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor(demande.statut)}`}>
                        {demande.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {demande.statut !== 'Brouillon' && (
                        <button
                          onClick={() => handleExportPDF(demande)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 text-xs font-semibold"
                          title="Exporter la demande en PDF"
                        >
                          <Download size={14} /> Exporter PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <AlertCircle size={34} className="mb-3 text-slate-300" />
                      <p className="font-medium text-slate-600">Aucune demande SI trouvée</p>
                      <p className="text-sm text-slate-400 mt-1">Vos demandes apparaîtront ici.</p>
                    </div>
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

export default UserDashboard;