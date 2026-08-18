import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth, useUser, useDemandes, useProjects, useCharter, usePopup } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, PlusCircle, FileText, Check, X, Send, Eye, Edit2, Trash2, Download, LayoutDashboard } from 'lucide-react';
import { DemandeDetailsModal } from '../components/DemandeSI';
import { generateDemandePDF } from '../utils/pdfGenerator';
import { formatUserDisplayName } from '../utils/userUtils';

const ListeDemandesSI = () => {
  const { user } = useAuth();
  const { users } = useUser();
  const { demandes, addDemande, updateDemandeStatus, deleteDemande, updateDemande } = useDemandes();
  const { projects } = useProjects();
  const { showPopup, showConfirm } = usePopup();
  const [selectedDemande, setSelectedDemande] = useState(null);

  const handleExportPDF = async (demande) => {
    try {
      await generateDemandePDF(demande);
    } catch (err) {
      showPopup({ title: 'Erreur', message: 'Erreur lors de la génération du PDF.', type: 'error' });
    }
  };

  const isReviewer = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';

  const handleAccept = async (id) => {
    try {
      await updateDemandeStatus(id, 'Acceptée');
      showPopup({ title: 'Succès', message: 'Demande acceptée avec succès.', type: 'success' });
    } catch (error) {
      showPopup({ title: 'Erreur', message: error.message || 'Une erreur est survenue.', type: 'error' });
    }
  };

  const handleRefuse = async (id) => {
    try {
      await updateDemandeStatus(id, 'Refusée');
      showPopup({ title: 'Succès', message: 'Demande refusée.', type: 'success' });
    } catch (error) {
      showPopup({ title: 'Erreur', message: error.message || 'Une erreur est survenue.', type: 'error' });
    }
  };

  const handleSubmitDraft = async (demande) => {
    try {
      const today = new Date().toLocaleDateString('fr-FR');
      await updateDemande(demande.id, { ...demande, statut: 'En cours', dateSoumission: today });
      showPopup({ title: 'Succès', message: 'Brouillon soumis avec succès.', type: 'success' });
    } catch (error) {
      showPopup({ title: 'Erreur', message: error.message || 'Une erreur est survenue.', type: 'error' });
    }
  };

  const handleDeleteDraft = (demandeId) => {
    showConfirm({
      title: "Supprimer le brouillon ?",
      message: "Êtes-vous sûr de vouloir supprimer ce brouillon ? Cette action est irréversible.",
      type: "error",
      onConfirm: () => {
        deleteDemande(demandeId);
      }
    });
  };

  const handleSaveInfosComplementaires = async (demandeId, updatedDemande) => {
    try {
      await updateDemande(demandeId, updatedDemande);
      showPopup({ title: 'Succès', message: 'Informations complémentaires enregistrées avec succès.', type: 'success' });
    } catch (err) {
      showPopup({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement des informations.', type: 'error' });
    }
  };

  const currentUserFullName = user
    ? `${user.prenom || ''} ${user.nom || ''}`.trim()
    : '';
  const currentUserFullNameAlt = user
    ? `${user.nom || ''} ${user.prenom || ''}`.trim()
    : '';

  const filteredDemandes = isReviewer
    ? demandes.filter(d => 
        d.statut !== 'Brouillon' || 
        d.nomDemandeur === currentUserFullName || 
        d.nomDemandeur === currentUserFullNameAlt
      )
    : demandes.filter(d =>
        d.nomDemandeur === currentUserFullName ||
        d.nomDemandeur === currentUserFullNameAlt
      );


  const enCoursDemandes   = filteredDemandes.filter(d => d.statut === 'En cours' && !projects.some(p => p.demandeId === d.id || p.id === d.id)).length;
  const valideeDemandes   = filteredDemandes.filter(d => d.statut === 'Acceptée' || projects.some(p => p.demandeId === d.id || p.id === d.id)).length;
  const refuseeDemandes   = filteredDemandes.filter(d => d.statut === 'Refusée').length;
  const totalDemandes     = filteredDemandes.length;


  const safeDisplayArray = (arr) => {
    if (!arr) return '-';
    if (Array.isArray(arr)) return arr.join(', ') || '-';
    if (typeof arr === 'string') {
      try { return JSON.parse(arr).join(', ') || '-'; } catch { return arr; }
    }
    return '-';
  };

  return (
    <Layout title={isReviewer ? "Demandes SI" : "Mes Demandes SI"}>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Gestion des Demandes SI
            </h1>
            <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
              {isReviewer 
                ? "Gérez l'historique de toutes les demandes et évaluez celles en attente."
                : "Retrouvez l'historique de toutes vos demandes et leur statut d'avancement."}
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-3">

            <Link
              to="/demande-si/nouvelle"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-orange-500/30"
            >
              <PlusCircle size={20} />
              Nouvelle Demande SI
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">En Cours</p>
                <p className="text-3xl font-bold text-slate-800">{enCoursDemandes}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Clock size={26} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Acceptées</p>
                <p className="text-3xl font-bold text-slate-800">{valideeDemandes}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle size={26} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">Refusées</p>
                <p className="text-3xl font-bold text-slate-800">{refuseeDemandes}</p>
              </div>
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                <X size={26} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/80">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Historique des demandes</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Titre / Demandeur</th>
                  <th className="px-6 py-4">Domaines / Service</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => {
                    const demandeurFormatted = formatUserDisplayName(demande.nomDemandeur, 'User', users);
                    const linkedProj = projects.find(p => p.demandeId === demande.id || p.id === demande.id);
                    const displayStatut = linkedProj ? 'Acceptée' : demande.statut;
                    return (
                      <tr key={demande.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{demande.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{demande.titre || `Demande ${demande.id}`}</p>
                            <p className="text-[11px] text-slate-400">Demandeur : {demandeurFormatted}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-700 text-xs">{safeDisplayArray(demande.domaines)}</p>
                            <p className="text-[11px] text-slate-400">{demande.service || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                              displayStatut === 'Acceptée'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs'
                                : displayStatut === 'Refusée'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/70 shadow-xs'
                                  : displayStatut === 'En cours'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/70 shadow-xs'
                                    : displayStatut === 'Brouillon'
                                      ? 'bg-slate-100 text-slate-600 border border-slate-200 shadow-xs'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200/70 shadow-xs'
                            }`}>
                            {displayStatut}
                          </span>
                        </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {demande.statut === 'Brouillon' ? (
                            <>
                              <button
                                onClick={() => setSelectedDemande(demande)}
                                className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm border border-slate-100"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleSubmitDraft(demande)}
                                className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 text-xs font-semibold mr-1"
                                title="Soumettre la demande"
                              >
                                <Send size={14} /> Soumettre
                              </button>
                              <Link
                                to={`/demande-si/edit/${demande.id}`}
                                className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors shadow-sm border border-amber-100 mr-1"
                                title="Modifier le brouillon"
                              >
                                <Edit2 size={16} />
                              </Link>
                              <button
                                onClick={() => handleDeleteDraft(demande.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors shadow-sm border border-rose-100"
                                title="Supprimer le brouillon"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : isReviewer ? (
                            <>
                              <button
                                onClick={() => setSelectedDemande(demande)}
                                className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm border border-slate-100"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                              {demande.statut === 'En cours' && !linkedProj && (
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
                              {(() => {
                                const targetUrl = linkedProj ? `/projects/${linkedProj.id}/charter` : `/project-charter?demandeId=${demande.id}`;
                                return (
                                  <>
                                    <button
                                      onClick={() => handleExportPDF(demande)}
                                      className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 text-xs font-semibold"
                                      title="Exporter la demande en PDF"
                                    >
                                      <Download size={14} /> PDF
                                    </button>
                                    {linkedProj && (
                                      <Link
                                        to={`/projects/${linkedProj.id}`}
                                        className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 text-xs font-semibold ml-1"
                                        title="Accéder au tableau de bord du projet"
                                      >
                                        <LayoutDashboard size={14} /> Dashboard
                                      </Link>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedDemande(demande)}
                                className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm border border-slate-100 mr-1"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                              {linkedProj && user?.role !== 'User' && (
                                <Link
                                  to={`/projects/${linkedProj.id}`}
                                  className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 text-xs font-semibold ml-1"
                                  title="Accéder au tableau de bord du projet"
                                >
                                  <LayoutDashboard size={14} /> Dashboard
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isReviewer ? "8" : "7"} className="py-12 text-center text-slate-500">
                      Aucune demande SI trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <DemandeDetailsModal 
        isOpen={!!selectedDemande} 
        onClose={() => setSelectedDemande(null)} 
        demande={selectedDemande} 
      />
    </Layout>
  );
};

export default ListeDemandesSI;
