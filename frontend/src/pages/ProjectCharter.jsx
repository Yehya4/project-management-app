import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDemandes, useCharter, useAuth, useProjects, useUser } from '../context/AppContext';
import { FileText, Save, Send, Users, Activity, Flag, AlertTriangle, MessageSquare, Briefcase, CheckCircle, Trash2, ClipboardList, Zap, Download, Upload, Info } from 'lucide-react';
import Popup from '../components/Popup';
import mammoth from 'mammoth';
import { generateCharterPDF } from '../utils/pdfGenerator';

const ProjectCharter = () => {
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get('demandeId');
  const navigate = useNavigate();
  
  const { demandes, updateDemandeStatus } = useDemandes();
  const { getCharterByDemandeId, saveCharter, deleteCharter } = useCharter();
  const { user } = useAuth();
  const { projects, updateProject, addProject } = useProjects();
  const { users } = useUser();
  const [popupState, setPopupState] = useState({ isOpen: false, title: '', message: '' });

  const isPMOrAdmin = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsor   = user?.role === 'Sponsor' || user?.role === 'Admin';
  const demande = demandes.find(d => d.id === demandeId);
  const linkedProject = projects.find(p => p.demandeId === demandeId);
  
  const [formData, setFormData] = useState({
    titre: '',
    contexte: '',
    objectifs: '',
    perimetreInclus: '',
    perimetreExclu: '',
    equipeITSponsor: '',
    equipeITChef: '',
    equipeITDev: '',
    equipeITTest: '',
    equipeMetierSponsor: '',
    equipeMetierChef: '',
    equipeMetierEquipe: '',
    utilisateursFinaux: '',
    planCom: '',
    risques: '',
    criteresSucces: '',
    statut: 'Brouillon',
    commentaires: []
  });

  const isEditable = isPMOrAdmin && formData.statut !== 'Validé';

  const [nouveauCommentaire, setNouveauCommentaire] = useState('');

  const userFullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
  const userFullNameAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim();
  const isDemandeur = demande?.nomDemandeur === userFullName ||
                      demande?.nomDemandeur === userFullNameAlt;

  const isDemandeurActionable = isDemandeur && formData.statut === 'Envoyé au Demandeur';
  const isSponsorActionable   = isSponsor && formData.statut === 'Soumis au Sponsor';
  const isCharterValidated    = formData.statut === 'Validé';
  const isStrictPM            = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const canValidateAtelier    = isStrictPM && isCharterValidated && linkedProject && linkedProject.atelierCadrage !== 'Validé';

  useEffect(() => {
    if (!demande) {
      navigate(-1);
      return;
    }

    const existingCharter = getCharterByDemandeId(demandeId);
    if (existingCharter) {
      setFormData(existingCharter);
    } else {
      setFormData(prev => ({
        ...prev,
        titre: demande.titre || `Projet issu de la demande ${demande.id}`,
        contexte: demande.contexte || '',
        objectifs: demande.description || '',
        chefProjetIT: user?.role === 'Project Manager' ? `${user.prenom || ''} ${user.nom || ''}`.trim() : (users.find(u => u.role === 'Project Manager') ? `${users.find(u => u.role === 'Project Manager').prenom || ''} ${users.find(u => u.role === 'Project Manager').nom || ''}`.trim() : ''),
        equipeITChef: user?.role === 'Project Manager' ? `${user.prenom || ''} ${user.nom || ''}`.trim() : (users.find(u => u.role === 'Project Manager') ? `${users.find(u => u.role === 'Project Manager').prenom || ''} ${users.find(u => u.role === 'Project Manager').nom || ''}`.trim() : '')
      }));
    }
  }, [demande, demandeId, getCharterByDemandeId, navigate, user, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAction = async (action) => {
    let newStatut = 'Brouillon';
    if (action === 'sendUser') newStatut = 'Envoyé au Demandeur';
    if (action === 'sendSponsor') newStatut = 'Soumis au Sponsor';
    if (action === 'acceptDemandeur') newStatut = 'Soumis au Sponsor';
    if (action === 'returnDemandeur') {
      if (!nouveauCommentaire.trim()) {
        alert("Veuillez ajouter un commentaire expliquant pourquoi vous retournez la charte.");
        return;
      }
      newStatut = 'Retourné par le Demandeur';
    }
    if (action === 'acceptSponsor') {
      newStatut = 'Validé';
      // Create/update the project with Initiation status
      if (linkedProject) {
        await updateProject(linkedProject.id, { status: 'Initiation', charterValidated: true });
      } else {
        await updateDemandeStatus(demandeId, 'En Développement');
        await addProject({
          nom: demande?.nomDemandeur ? `Projet ${demande.nomDemandeur}` : (demande?.titre || `Projet issu de la demande ${demandeId}`),
          chefProjet: formData.chefProjetIT || 'Non assigné',
          status: 'Initiation',
          description: demande?.description || '',
          demandeId: demandeId,
          progress: 0
        });
      }
    }
    if (action === 'returnSponsor') {
      if (!nouveauCommentaire.trim()) {
        alert("Veuillez ajouter un commentaire expliquant pourquoi vous retournez la charte.");
        return;
      }
      newStatut = 'Retourné par le Sponsor';
    }

    let updatedCommentaires = formData.commentaires || [];
    if (action === 'returnDemandeur' || action === 'returnSponsor') {
      const newComment = {
        auteur: userFullName || (action === 'returnSponsor' ? 'Sponsor' : 'Demandeur'),
        role: user?.role || (action === 'returnSponsor' ? 'Sponsor' : 'User'),
        date: new Date().toISOString(),
        texte: nouveauCommentaire
      };
      updatedCommentaires = [...updatedCommentaires, newComment];
      setNouveauCommentaire('');
    }

    const charterData = {
      ...formData,
      commentaires: updatedCommentaires,
      demandeId,
      statut: newStatut,
      lastUpdated: new Date().toISOString()
    };

    saveCharter(charterData);

    let message = '';
    let title = 'Charte Envoyée';
    if (action === 'save') { title = 'Brouillon Enregistré'; message = 'Charte de projet enregistrée en brouillon.'; }
    else if (action === 'sendUser') { message = 'Charte envoyée au demandeur pour revue.'; }
    else if (action === 'sendSponsor') { message = 'Charte envoyée au Sponsor pour validation finale.'; }
    else if (action === 'acceptDemandeur') { title = 'Charte Acceptée'; message = 'Vous avez accepté la charte. Elle est envoyée au Sponsor.'; }
    else if (action === 'returnDemandeur') { title = 'Charte Retournée'; message = 'Charte retournée au Project Manager avec votre commentaire.'; }
    else if (action === 'acceptSponsor') { title = 'Charte Validée'; message = 'Vous avez validé la charte de projet.'; }
    else if (action === 'returnSponsor') { title = 'Charte Retournée'; message = 'Charte retournée au Project Manager avec votre commentaire.'; }

    setPopupState({
      isOpen: true,
      title: title,
      message: message
    });
  };

  const handlePopupClose = () => {
    setPopupState({ ...popupState, isOpen: false });
    navigate(-1);
  };

  const fileInputRef = React.useRef(null);

  const handleExportPDF = async () => {
    try {
      await generateCharterPDF(formData, demande);
    } catch (error) {
      alert("Erreur lors de l'exportation PDF");
    }
  };


  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette charte de projet en brouillon ?")) {
      await deleteCharter(demandeId);
      navigate(-1);
    }
  };

  const handleAddComment = () => {
    if (!nouveauCommentaire.trim()) return;

    const newComment = {
      auteur: userFullName || 'Utilisateur',
      role: user?.role || 'User',
      date: new Date().toISOString(),
      texte: nouveauCommentaire
    };

    const updatedCommentaires = [...(formData.commentaires || []), newComment];
    setFormData(prev => ({ ...prev, commentaires: updatedCommentaires }));
    setNouveauCommentaire('');
    
    const charterData = {
      ...formData,
      commentaires: updatedCommentaires,
      demandeId,
      lastUpdated: new Date().toISOString()
    };
    saveCharter(charterData);
  };

  if (!demande) return null;

  return (
    <Layout title="Charte de Projet">
      <div className="max-w-5xl mx-auto pb-24">
        
        {/* ── Atelier de Cadrage banner (PM only, after Sponsor validation) ── */}
        {canValidateAtelier && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-5 mb-6 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-300">
                <ClipboardList size={22} />
              </div>
              <div>
                <p className="font-bold text-indigo-900">La charte est validée par le Sponsor ✓</p>
                <p className="text-sm text-indigo-700 mt-0.5">
                  Vous devez maintenant valider l'<strong>Atelier de Cadrage</strong> pour débloquer l'import du Backlog.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                updateProject(linkedProject.id, { atelierCadrage: 'Validé' });
                setPopupState({ isOpen: true, title: 'Atelier de Cadrage Validé', message: 'L\'atelier de cadrage a été validé. Le Backlog peut maintenant être importé.' });
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
            >
              <Zap size={18} /> Valider l'Atelier de Cadrage
            </button>
          </div>
        )}

        {/* Atelier already validated banner */}
        {isCharterValidated && linkedProject?.atelierCadrage === 'Validé' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 mt-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <p className="text-emerald-800 font-semibold text-sm">
              Charte validée ✓ · Atelier de Cadrage validé ✓ — Le Backlog peut être importé dans la section Documents.
            </p>
          </div>
        )}

        
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>

            <div className="flex items-center gap-3 mb-3">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Project Charter
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                formData.statut === 'Brouillon' ? 'bg-slate-100 text-slate-600' :
                formData.statut === 'Envoyé au Demandeur' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {formData.statut === 'Validé' ? 'Validé (Accepté par Demandeur et Sponsor)' : formData.statut}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              Charte de Projet
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Réf Demande : <span className="text-slate-700 font-bold">{demande?.id}</span> - Demandeur : {demande?.nomDemandeur}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">


            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl font-semibold transition-all shadow-sm"
              title="Exporter en PDF"
            >
              <Download size={18} /> <span className="hidden xl:inline">PDF</span>
            </button>
            <button onClick={() => navigate(-1)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors hidden md:block">
              Retour
            </button>
            {isPMOrAdmin && formData.statut === 'Brouillon' && (
              <button onClick={handleDelete} className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl font-semibold transition-all shadow-sm" title="Supprimer">
                <Trash2 size={18} />
              </button>
            )}
            {isEditable && (
              <button onClick={() => handleAction('save')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-semibold transition-all shadow-sm">
                <Save size={18} /> <span className="hidden md:inline">Enregistrer</span>
              </button>
            )}
          </div>
        </div>

        
        <div className="space-y-6">
          
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Flag size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">1. Informations Générales</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Titre du Projet</label>
                <input 
                  type="text" name="titre" value={formData.titre} onChange={handleChange} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all font-medium text-slate-800 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Ex: Digitalisation des Reportings Qualité"
                />
              </div>


              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contexte</label>
                <textarea 
                  name="contexte" value={formData.contexte} onChange={handleChange} rows={4} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Décrivez les défis et la situation actuelle..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Objectif du Projet</label>
                <textarea 
                  name="objectifs" value={formData.objectifs} onChange={handleChange} rows={4} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Quels sont les objectifs clairs et mesurables ?"
                />
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Activity size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">2. Périmètre du Projet (Scope)</h2>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 text-emerald-700">Inclus dans le périmètre</label>
                <textarea 
                  name="perimetreInclus" value={formData.perimetreInclus} onChange={handleChange} rows={5} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-emerald-200 rounded-xl transition-all text-slate-700 ${isEditable ? 'bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500' : 'bg-emerald-50/50 outline-none'}`}
                  placeholder="Lister ce qui fait partie du projet..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 text-rose-700">Hors périmètre</label>
                <textarea 
                  name="perimetreExclu" value={formData.perimetreExclu} onChange={handleChange} rows={5} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-rose-200 rounded-xl transition-all text-slate-700 ${isEditable ? 'bg-rose-50/30 focus:ring-2 focus:ring-rose-500' : 'bg-rose-50/50 outline-none'}`}
                  placeholder="Lister ce qui est explicitement exclu..."
                />
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">3. Parties Prenantes</h2>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Équipe IT</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Sponsor IT</label>
                  <input type="text" name="equipeITSponsor" value={formData.equipeITSponsor} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Chef de Projet IT</label>
                  <input type="text" name="equipeITChef" value={formData.equipeITChef} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Équipe de développement</label>
                  <input type="text" name="equipeITDev" value={formData.equipeITDev} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Équipe de Test</label>
                  <input type="text" name="equipeITTest" value={formData.equipeITTest} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Équipe Métier</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Sponsor Métier</label>
                  <input type="text" name="equipeMetierSponsor" value={formData.equipeMetierSponsor} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Chef de Projet Métier</label>
                  <input type="text" name="equipeMetierChef" value={formData.equipeMetierChef} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Équipe Métier</label>
                  <input type="text" name="equipeMetierEquipe" value={formData.equipeMetierEquipe} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Utilisateurs Finaux</label>
                  <input type="text" name="utilisateursFinaux" value={formData.utilisateursFinaux} onChange={handleChange} readOnly={!isEditable} className={`w-full px-3 py-2 border border-slate-300 rounded-lg transition-all ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`} />
                </div>
              </div>

            </div>
          </div>

          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">4. Gouvernance & Déroulement</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <MessageSquare size={16} className="text-blue-500"/> Plan de Communication
                </label>
                <textarea 
                  name="planCom" value={formData.planCom} onChange={handleChange} rows={3} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Ex: Réunions hebdos, comités de pilotage mensuels..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <AlertTriangle size={16} className="text-orange-500"/> Risques Identifiés
                </label>
                <textarea 
                  name="risques" value={formData.risques} onChange={handleChange} rows={3} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Lister les risques et plans de mitigation..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <CheckCircle size={16} className="text-emerald-500"/> Critères de Succès
                </label>
                <textarea 
                  name="criteresSucces" value={formData.criteresSucces} onChange={handleChange} rows={3} readOnly={!isEditable}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 ${isEditable ? 'focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 outline-none'}`}
                  placeholder="Comment mesurera-t-on la réussite de ce projet ?"
                />
              </div>
            </div>
          </div>

          {/* Commentaires & Échanges */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">5. Commentaires & Échanges</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {formData.commentaires && formData.commentaires.length > 0 ? (
                  formData.commentaires.map((comment, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold text-slate-800">{comment.auteur}</span>
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                            {comment.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(comment.date).toLocaleString('fr-FR', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.texte}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4">Aucun commentaire pour le moment.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ajouter un commentaire</label>
                <div className="flex flex-col gap-3">
                  <textarea 
                    value={nouveauCommentaire}
                    onChange={(e) => setNouveauCommentaire(e.target.value)}
                    rows={3} 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl transition-all text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Écrivez votre commentaire ici..."
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddComment}
                      disabled={!nouveauCommentaire.trim()}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                    >
                      <Send size={16} /> Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      
      {(isPMOrAdmin || isDemandeurActionable || isSponsorActionable) && (
        <div className="fixed bottom-0 left-0 right-0 md:left-72 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-medium text-slate-500 hidden md:block">
              {isPMOrAdmin 
                ? "Assurez-vous d'avoir rempli toutes les sections obligatoires avant validation." 
                : "Veuillez lire attentivement la charte avant de l'accepter ou de la retourner."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
              {isEditable && (
                <>
                  <button 
                    onClick={() => handleAction('save')} 
                    className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <Save size={18} /> Enregistrer
                  </button>
                  <button 
                    onClick={() => handleAction('sendUser')} 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <Send size={18} /> Envoyer au Demandeur
                  </button>
                  <button 
                    onClick={() => handleAction('sendSponsor')} 
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <Send size={18} /> Envoyer au Sponsor
                  </button>
                </>
              )}
              {isDemandeurActionable && (
                <>
                  <button 
                    onClick={() => handleAction('returnDemandeur')} 
                    className="flex items-center gap-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <AlertTriangle size={18} /> Retourner au PM
                  </button>
                  <button 
                    onClick={() => handleAction('acceptDemandeur')} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <CheckCircle size={18} /> Accepter la Charte
                  </button>
                </>
              )}
              {isSponsorActionable && (
                <>
                  <button 
                    onClick={() => handleAction('returnSponsor')} 
                    className="flex items-center gap-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <AlertTriangle size={18} /> Retourner au PM
                  </button>
                  <button 
                    onClick={() => handleAction('acceptSponsor')} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <CheckCircle size={18} /> Valider la Charte
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Popup 
        isOpen={popupState.isOpen}
        title={popupState.title}
        message={popupState.message}
        type="success"
        onClose={handlePopupClose}
      />
    </Layout>
  );
};

export default ProjectCharter;
