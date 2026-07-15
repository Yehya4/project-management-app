import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AppContext';
import { useDemandes } from '../context/AppContext';
import { useCharter } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, PlusCircle, FileText, Check, X, Send, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { DemandeDetailsModal } from '../components/DemandeSI';
import Popup from '../components/Popup';
import { generateDemandePDF } from '../utils/pdfGenerator';
import mammoth from 'mammoth';

const ListeDemandesSI = () => {
  const { user } = useAuth();
  const { demandes, addDemande, updateDemandeStatus, deleteDemande, updateDemande } = useDemandes();
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleExportPDF = async (demande) => {
    try {
      setPopup({ isOpen: true, title: 'Exportation en cours', message: 'Veuillez patienter pendant la génération du PDF...', type: 'info' });
      await generateDemandePDF(demande);
      setPopup({ isOpen: true, title: 'Succès', message: `Le PDF de la demande ${demande.id} a été exporté avec succès.`, type: 'success' });
    } catch (error) {
      setPopup({ isOpen: true, title: 'Erreur', message: 'Une erreur est survenue lors de l\'exportation du PDF.', type: 'error' });
    }
  };

  const fileInputRef = React.useRef(null);

  const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // ─── Import fichier (Word / PDF) ──────────────────────────────────────────────
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const processText = async (text) => {
      try {
        const allPrefixes = [
          'Entité', 'Nom du demandeur', 'Fonction',
          'Domaines concernés', 'Domaines',
          'Contexte du Projet', 'Contexte',
          'Description du besoin', 'Description',
          'Nature du besoin', 'Nature',
          'Bénéfices escomptés', 'Bénéfices',
          'Délai souhaité', 'Délai',
          'Demande révisée et validée'
        ];
        const nextPrefixesPattern = allPrefixes.join('|');

        const extractField = (prefixRegexStr, isMultiline = false) => {
          const regex = new RegExp(
            `(?:${prefixRegexStr})\\s*[:\\?]?\\s*([\\s\\S]*?)(?:\\n\\s*(?:${nextPrefixesPattern})\\s*[:\\?]|$)`,
            'i'
          );
          const match = text.match(regex);
          if (match) {
            let val = match[1].trim();
            if (!isMultiline) {
              val = val.split('\n')[0].trim();
            }
            return val;
          }
          return '';
        };

        const extractCheckboxes = (textBlock, options) => {
          if (!textBlock) return [];
          const selected = [];
          options.forEach(opt => {
            // Cherche le nom de l'option suivi de ☒, x ou X (ignorant la casse et les espaces)
            const regex = new RegExp(`${opt}\\s*[\\[\\(]?[☒xX][\\]\\)]?`, 'i');
            if (regex.test(textBlock)) {
              selected.push(opt);
            }
          });
          return selected;
        };

        const domainesBlock = extractField('Domaines concernés|Domaines', true);
        const natureBlock = extractField('Nature du besoin|Nature', true);
        const beneficesBlock = extractField('Bénéfices escomptés|Bénéfices', true);
        const validationBlock = extractField('Demande révisée et validée par responsable.*', false);

        const valideeResponsable = /Oui.*?[☒xX]/i.test(validationBlock);

        // ─── Mapping vers le schéma de la base de données ────────────────────
        const nouvelleDemande = {
          nomDemandeur:     extractField('Nom du demandeur|Demandeur').replace(/^- /g, '').trim(),
          fonction:         extractField('Fonction').replace(/^- /g, '').trim(),
          domaines:         extractCheckboxes(domainesBlock, ['Commercial', 'Atelier', 'Magasin', 'Gestion', 'Marketing', 'Logistique', 'Finance', 'Audit/Contrôle', 'Ressources Humaines']),
          categoriesProjet: [], // OBSOLETE
          contexte:         extractField('Contexte du Projet \\(Problèmes à résoudre\\)|Contexte', true),
          description:      extractField('Description du besoin \\(Les exigences\\)|Description', true),
          natureBesoin:     extractCheckboxes(natureBlock, ['Réglementaire', 'Amélioration satisfaction client', 'Amélioration fonctionnement']),
          benefices:        extractCheckboxes(beneficesBlock, ['Diminution des Coûts', 'Améliorations des Performances', 'Réduction des Risques', 'Conformité']),
          delaiSouhaite:    extractField('Délai souhaité|Délai'),
          valideeResponsable: valideeResponsable,
          statut:           'En attente',
          dateCreation:     new Date().toLocaleDateString('fr-FR'),
          dateSoumission:   new Date().toLocaleDateString('fr-FR')
        };

        // Vérification minimale : au moins un champ principal doit être renseigné
        if (!nouvelleDemande.nomDemandeur && !nouvelleDemande.contexte && !nouvelleDemande.description) {
          setPopup({
            isOpen: true,
            title: 'Avertissement',
            message: 'Aucune donnée reconnue dans ce fichier. Vérifiez que le document utilise le bon format (exporté depuis cette application).',
            type: 'error'
          });
          e.target.value = null;
          return;
        }

        await addDemande(nouvelleDemande);
        setPopup({ isOpen: true, title: 'Succès', message: 'Demande importée avec succès.', type: 'success' });
      } catch (err) {
        console.error('Erreur import:', err);
        setPopup({ isOpen: true, title: 'Erreur', message: 'Le format du fichier est invalide ou une erreur serveur s\'est produite.', type: 'error' });
      }
      e.target.value = null;
    };

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const pdfjsLib = await loadPdfJs();
          const typedarray = new Uint8Array(event.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = -1;
            let pageText = '';
            textContent.items.forEach(item => {
              if (lastY !== item.transform[5] && lastY !== -1) {
                pageText += '\n';
              }
              pageText += item.str;
              lastY = item.transform[5];
            });
            fullText += pageText + '\n';
          }
          // Forcer les sauts de ligne avant chaque préfixe au cas où le PDF aurait
          // perdu la mise en forme
          const prefixes = [
            'Demandeur', 'Nom du demandeur', 'Fonction',
            'Domaines concernés', 'Catégories des projets',
            'Contexte du projet', 'Description du besoin',
            'Nature du besoin', 'Bénéfices escomptés', 'Délai souhaité'
          ];
          prefixes.forEach(p => {
            const regex = new RegExp(`(${p}\\s*:)`, 'gi');
            fullText = fullText.replace(regex, '\n$1');
          });
          processText(fullText);
        } else {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          processText(result.value);
        }
      } catch (err) {
        console.error('Erreur lecture fichier:', err);
        setPopup({ isOpen: true, title: 'Erreur', message: 'Erreur lors de la lecture du fichier.', type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isReviewer = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';

  const handleAccept = (demandeId) => {
    updateDemandeStatus(demandeId, 'Acceptée');
  };

  const handleRefuse = (demandeId) => {
    updateDemandeStatus(demandeId, 'Refusée');
  };

  const handleSubmitDraft = (demande) => {
    const today = new Date().toLocaleDateString('fr-FR');
    updateDemande(demande.id, { ...demande, statut: 'En attente', dateSoumission: today });
  };

  const handleDeleteDraft = (demandeId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce brouillon ?")) {
      deleteDemande(demandeId);
    }
  };

  // ─── Filtrage des demandes ────────────────────────────────────────────────────
  // Utilise prenom + nom (champs réels) et non user.name (inexistant)
  const currentUserFullName = user
    ? `${user.prenom || ''} ${user.nom || ''}`.trim()
    : '';
  const currentUserFullNameAlt = user
    ? `${user.nom || ''} ${user.prenom || ''}`.trim()
    : '';

  const filteredDemandes = isReviewer
    ? demandes.filter(d => d.statut !== 'Brouillon')
    : demandes.filter(d =>
        d.nomDemandeur === currentUserFullName ||
        d.nomDemandeur === currentUserFullNameAlt
      );

  // ─── Statistiques ─────────────────────────────────────────────────────────────
  const enCoursDemandes   = filteredDemandes.filter(d => d.statut && d.statut.includes('En')).length;
  const valideeDemandes   = filteredDemandes.filter(d => d.statut === 'Acceptée' || d.statut === 'Validée').length;
  const refuseeDemandes   = filteredDemandes.filter(d => d.statut === 'Refusée').length;
  const totalDemandes     = filteredDemandes.length;

  // Helper sécurisé pour afficher les tableaux (évite le crash si domaines est null)
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
            <input 
              type="file" 
              accept=".docx,.pdf" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm md:text-base"
            >
              <Download size={18} />
              <span className="hidden md:inline">Importer (.docx / .pdf)</span>
              <span className="md:hidden">Importer</span>
            </button>
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
                <p className="text-sm font-medium text-slate-500 mb-2">En Attente / En Cours</p>
                <p className="text-3xl font-bold text-slate-800">{enCoursDemandes}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
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
              <thead className="bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Référence</th>
                  {isReviewer && <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Demandeur</th>}
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Fonction Profil</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Domaines</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Création</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date Soumission</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Statut</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length > 0 ? (
                  filteredDemandes.map(demande => (
                    <tr key={demande.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{demande.id}</td>
                      {isReviewer && (
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {demande.nomDemandeur}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-500">{demande.fonction || '-'}</td>
                      {/* safeDisplayArray protège contre domaines null/non-tableau */}
                      <td className="px-6 py-4 text-sm text-slate-500">{safeDisplayArray(demande.domaines)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{demande.dateCreation}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{demande.dateSoumission || (demande.statut !== 'Brouillon' ? demande.dateCreation : '-')}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            demande.statut === 'Acceptée'
                              ? 'bg-emerald-100 text-emerald-700'
                              : demande.statut === 'Refusée'
                                ? 'bg-rose-100 text-rose-700'
                                : demande.statut === 'Brouillon'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-100 text-amber-700'
                          }`}>
                          {demande.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isReviewer ? (
                            <>
                              <button
                                onClick={() => setSelectedDemande(demande)}
                                className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shadow-sm border border-slate-100"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
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
                                <>
                                  <button
                                    onClick={() => handleExportPDF(demande)}
                                    className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 text-xs font-semibold"
                                    title="Exporter la demande en PDF"
                                  >
                                    <Download size={14} /> PDF
                                  </button>

                                </>
                              )}
                              {demande.statut !== 'En attente' && demande.statut !== 'Brouillon' && (
                                <span className="text-slate-400 text-xs italic ml-2">Traité</span>
                              )}
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
                              {demande.statut === 'Brouillon' && (
                                <>
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
                              )}
                              {demande.statut !== 'Brouillon' && (
                                <>
                                  <button
                                    onClick={() => handleExportPDF(demande)}
                                    className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100 text-xs font-semibold"
                                    title="Exporter la demande en PDF"
                                  >
                                    <Download size={14} /> PDF
                                  </button>

                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
      
      <Popup
        isOpen={popup.isOpen}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup(p => ({ ...p, isOpen: false }))}
      />
    </Layout>
  );
};

export default ListeDemandesSI;
