import React from 'react';
import { FolderKanban, Users, TrendingUp, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import Popup from '../Popup';
import { generateDemandePDF } from '../../utils/pdfGenerator';
import { useDemandes } from '../../context/AppContext';
import { useProjects } from '../../context/AppContext';
import { useUser } from '../../context/AppContext';
import { useCharter } from '../../context/AppContext';

const PMDashboard = () => {
  const { demandes, updateDemandeStatus } = useDemandes();
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });
  const { projects } = useProjects();
  const { users } = useUser();
  const { charters } = useCharter();
  const { user } = useAuth();

  const filteredDemandes = demandes.filter(d => d.statut !== 'Brouillon');

  const handleAccept = (demandeId) => {
    updateDemandeStatus(demandeId, 'Acceptée');
  };

  const handleRefuse = (demandeId) => {
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

  const activeProjects = projects.filter(p => p.status !== 'Utilisation').length;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <p className="text-sm text-indigo-100 mb-2">Gestion de projets</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Tableau de bord Project Manager
        </h1>
        <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
          Gardez une vue claire sur les projets actifs, les équipes mobilisées et l’avancement global.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-2">Projets Actifs</p>
              <p className="text-3xl font-bold text-slate-800">{activeProjects}</p>
            </div>
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <FolderKanban size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-2">Membres Équipe</p>
              <p className="text-3xl font-bold text-slate-800">{users.length}</p>
            </div>
            <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
              <Users size={26} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium mb-2">Avancement Global</p>
              <p className="text-3xl font-bold text-slate-800">0%</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={26} />
            </div>
          </div>
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800">Vue d'ensemble des Projets</h2>
          <p className="text-sm text-slate-500 mt-1">
            Suivi global des projets, de leur statut et de leur niveau d’avancement.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {projects.map(project => (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all duration-300 bg-white"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">
                    {project.name}
                    <span className="text-sm text-slate-500 font-normal ml-2">
                      ({project.code})
                    </span>
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold w-fit ${
                    project.status === 'Initiation' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'Développement' || project.status === 'En cours' || project.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                    project.status === 'Testing' || project.status === 'Fait' ? 'bg-purple-100 text-purple-700' :
                    project.status === 'Déploiement' || ['Clôture', 'Clôturée'].includes(project.status) ? 'bg-amber-100 text-amber-700' :
                    project.status === 'Utilisation' || ['Archive', 'Archivée'].includes(project.status) ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-slate-500">Progression</p>
                  <p className="text-xs font-semibold text-slate-700">{project.progress}%</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">
                  {project.progress}% complété
                </p>
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {demande.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {demande.nomDemandeur} ({demande.fonction})
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
                        {demande.statut !== 'Brouillon' && (
                          <button
                            onClick={() => handleExportPDF(demande)}
                            className="inline-flex items-center gap-1 p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 text-xs font-semibold"
                            title="Exporter la demande en PDF"
                          >
                            Exporter PDF
                          </button>
                        )}
                        {demande.statut !== 'En attente' && (
                          <span className="text-slate-400 text-xs italic ml-1">Traité</span>
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