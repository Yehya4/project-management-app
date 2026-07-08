import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, PlusCircle, LayoutDashboard, Calendar, Download } from 'lucide-react';
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
  const [popup, setPopup] = React.useState({ isOpen: false, title: '', message: '', type: 'success' });

  const myDemandes = demandes.filter(d => d.demandeur === user?.nomDemandeur || d.demandeur === user?.name || d.demandeur === `${user?.nom} ${user?.prenom}`);

  const handleExportPDF = async (demande) => {
    try {
      setPopup({ isOpen: true, title: 'Exportation en cours', message: 'Veuillez patienter pendant la génération du PDF...', type: 'info' });
      await generateDemandePDF(demande);
      setPopup({ isOpen: true, title: 'Succès', message: `Le PDF de la demande ${demande.id} a été exporté avec succès.`, type: 'success' });
    } catch (error) {
      setPopup({ isOpen: true, title: 'Erreur', message: 'Une erreur est survenue lors de l\'exportation du PDF.', type: 'error' });
    }
  };

  const enCoursDemandes = myDemandes.filter(d => d.statut.includes('En cours')).length;
  const valideeDemandes = myDemandes.filter(d => d.statut === 'Validée').length;
  const totalDemandes = myDemandes.length;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <p className="text-sm text-blue-100 mb-2">Tableau de bord utilisateur</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bienvenue, {user?.name}
          </h1>
          <p className="text-slate-200 mt-3 text-sm md:text-base max-w-2xl">
            Suivez rapidement l’état de vos Demandes SI, vos priorités et vos travaux récents.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

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
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaines</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Création</th>
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {demande.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {demande.domaines.join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {demande.dateCreation}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700`}
                      >
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
                  <td colSpan="4" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <AlertCircle size={34} className="mb-3 text-slate-300" />
                      <p className="font-medium text-slate-600">Aucune demande SI trouvée</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Vos demandes apparaîtront ici.
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

export default UserDashboard;