import React, { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Eye, Upload, CheckCircle, XCircle,
  AlertTriangle, FileSpreadsheet, Box, MessageSquare, X,
  ClipboardList, Edit2, Lock, ChevronRight, Zap, CheckCheck,
  Clock, RefreshCw, ArrowRight
} from 'lucide-react';
import { useAuth, useProjects, useCharter, useDemandes } from '../../context/AppContext';
import { generateDemandePDF, generateCharterPDF, generateFilePreviewPDF } from '../../utils/pdfGenerator';

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */

const StepBadge = ({ status }) => {
  if (status === 'Validé' || status === 'done')
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold"><CheckCircle size={12} /> Validé</span>;
  if (status === 'Soumis' || status === 'pending-validation')
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold"><Clock size={12} /> En Validation</span>;
  if (status === 'Rejeté' || status === 'rejected')
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold"><XCircle size={12} /> Rejeté</span>;
  if (status === 'active')
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"><Zap size={12} /> En cours</span>;
  if (status === 'locked')
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-xs font-bold"><Lock size={12} /> En attente</span>;
  return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold"><Clock size={12} /> En Attente</span>;
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */

const ProjectDocuments = () => {
  const { project } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProject } = useProjects();
  const { getCharterByDemandeId } = useCharter();
  const { demandes } = useDemandes();

  const originalDemande = project.originalDemande
    || demandes.find(d => d.id === project.demandeId)
    || null;

  const charter = getCharterByDemandeId(project.demandeId);

  const isPM      = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isStrictPM = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsor = user?.role === 'Sponsor'         || user?.role === 'Admin';

  const [viewingDoc,   setViewingDoc]   = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [comment,      setComment]      = useState('');
  const [pdfUrl,       setPdfUrl]       = useState(null);
  const [backlogFileBlobUrl, setBacklogFileBlobUrl] = useState(null);
  const [architectureFileBlobUrl, setArchitectureFileBlobUrl] = useState(null);

  const backlogInputRef      = useRef(null);
  const architectureInputRef = useRef(null);

  /* ── Upload / action handlers ─────────────────────────────── */
  const handleUploadBacklog = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateProject(project.id, { backlogStatus: 'Soumis', backlogFile: file.name, sponsorComment: null });
    if (file.type === 'application/pdf') {
      setBacklogFileBlobUrl(URL.createObjectURL(file));
    } else {
      setBacklogFileBlobUrl(null);
    }
  };

  const handleValidateBacklog = () =>
    updateProject(project.id, { backlogStatus: 'Validé', sponsorComment: null });

  const handleRejectBacklog = () => {
    if (!comment.trim()) return;
    updateProject(project.id, { backlogStatus: 'Rejeté', backlogFile: null, sponsorComment: comment });
    setRejectingDoc(null); setComment('');
  };

  const handleUploadArchitecture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateProject(project.id, { architectureStatus: 'Soumis', architectureFile: file.name, sponsorComment: null });
    if (file.type === 'application/pdf') {
      setArchitectureFileBlobUrl(URL.createObjectURL(file));
    } else {
      setArchitectureFileBlobUrl(null);
    }
  };

  const handleValidateArchitecture = async () => {
    // Architecture validée → passage automatique à Développement
    await updateProject(project.id, { architectureStatus: 'Validé', status: 'Développement', sponsorComment: null });
  };

  const handleRejectArchitecture = () => {
    if (!comment.trim()) return;
    updateProject(project.id, { architectureStatus: 'Rejeté', architectureFile: null, sponsorComment: comment });
    setRejectingDoc(null); setComment('');
  };

  const handleViewDoc = async (docType) => {
    if (viewingDoc === docType) {
      setViewingDoc(null);
      setPdfUrl(null);
      return;
    }
    
    setViewingDoc(docType);
    setPdfUrl(null);
    
    try {
      let url = null;
      if (docType === 'request' && originalDemande) {
        url = await generateDemandePDF(originalDemande, false);
      } else if (docType === 'charter' && charter) {
        url = await generateCharterPDF(charter, originalDemande, false);
      } else if (docType === 'backlog' && project.backlogFile) {
        url = backlogFileBlobUrl || generateFilePreviewPDF(project.backlogFile, 'Backlog du Projet', project.nom);
      } else if (docType === 'architecture' && project.architectureFile) {
        url = architectureFileBlobUrl || generateFilePreviewPDF(project.architectureFile, 'Architecture Technique', project.nom);
      }
      setPdfUrl(url);
    } catch (err) {
      console.error("Erreur lors de la génération de l'aperçu PDF", err);
    }
  };

  const handleValidateAtelier = () =>
    updateProject(project.id, { atelierCadrage: 'Validé' });

  const handleRefuseAtelier = () =>
    updateProject(project.id, { atelierCadrage: 'Refusé' });

  /* ── Séquençage du workflow ───────────────────────────────── */
  const charterStatut     = charter?.statut || null;
  const charterValidated  = charterStatut === 'Validé';
  const atelierStatut     = project.atelierCadrage || null;
  const atelierValidated  = atelierStatut === 'Validé';
  const backlogStatut     = project.backlogStatus  || null;
  const backlogValidated  = backlogStatut === 'Validé';
  const archStatut        = project.architectureStatus || null;
  const archValidated     = archStatut === 'Validé';
  const isDev             = project.status === 'Développement' || ['Développement', 'Testing', 'Déploiement', 'Utilisation'].includes(project.status);

  // Étape active dans la séquence
  const activeStep =
    !charterValidated                              ? 'charter'
    : !atelierValidated                            ? 'atelier'
    : !backlogValidated && backlogStatut !== 'Soumis' ? 'backlog-upload'
    : backlogStatut === 'Soumis'                   ? 'backlog-validate'
    : !archValidated && archStatut !== 'Soumis'   ? 'arch-upload'
    : archStatut === 'Soumis'                      ? 'arch-validate'
    : 'done';

  const stepStatus = (stepKey) => {
    switch (stepKey) {
      case 'request':   return 'Validé';
      case 'charter':   return charterValidated ? 'Validé' : (charterStatut ? 'active' : 'active');
      case 'atelier':   return !charterValidated ? 'locked' : atelierValidated ? 'Validé' : atelierStatut === 'Refusé' ? 'Rejeté' : (activeStep === 'atelier' ? 'active' : 'locked');
      case 'backlog':   return !atelierValidated ? 'locked' : backlogValidated ? 'Validé' : backlogStatut === 'Rejeté' ? 'Rejeté' : backlogStatut === 'Soumis' ? 'Soumis' : (activeStep === 'backlog-upload' ? 'active' : 'locked');
      case 'arch':      return !backlogValidated ? 'locked' : archValidated ? 'Validé' : archStatut === 'Rejeté' ? 'Rejeté' : archStatut === 'Soumis' ? 'Soumis' : (activeStep === 'arch-upload' ? 'active' : 'locked');
      default: return 'locked';
    }
  };

  /* ── Render helpers ──────────────────────────────────────── */
  const rowClass = (isLocked) =>
    `transition-all duration-200 ${isLocked ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50/80'}`;

  const iconWrap = (color, Icon) => (
    <div className={`p-2 rounded-xl ${color}`}><Icon size={20} /></div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestionnaire de Documents</h2>
        <p className="text-slate-500 mt-1">
          Workflow d'initiation séquentiel — chaque étape se débloque après validation de la précédente.
        </p>
      </div>

      {/* Sponsor comment banner */}
      {project.sponsorComment && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
          <MessageSquare size={22} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Retour du Sponsor</p>
            <p className="text-slate-700 mt-1 text-sm">{project.sponsorComment}</p>
          </div>
        </div>
      )}

      {/* Initiation terminée */}
      {isDev && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl flex gap-4 items-center shadow-sm">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
            <CheckCheck size={24} />
          </div>
          <div>
            <p className="font-bold text-lg text-emerald-900">Initiation terminée avec succès !</p>
            <p className="text-emerald-700 text-sm mt-0.5">
              Toutes les étapes ont été validées. Le projet est maintenant en phase <strong>Développement</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Progression du workflow d'initiation</p>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { key: 'request', label: 'Demande SI' },
            { key: 'charter', label: 'Project Charter' },
            { key: 'atelier', label: 'Atelier de Cadrage' },
            { key: 'backlog', label: 'Backlog' },
            { key: 'arch',    label: 'Architecture' },
          ].map((s, i) => {
            const st = stepStatus(s.key);
            const isActive = ['active', 'Soumis'].includes(st);
            const isDone   = st === 'Validé';
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    isDone    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'  :
                    isActive  ? 'bg-blue-600  text-white shadow-sm shadow-blue-200 ring-4 ring-blue-100' :
                    st === 'Rejeté' ? 'bg-rose-400 text-white' :
                    'bg-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold text-center max-w-[70px] leading-tight ${
                    isDone ? 'text-emerald-600' : isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}>{s.label}</span>
                </div>
                {i < 4 && (
                  <div className={`flex-1 min-w-[20px] h-0.5 rounded-full mb-4 transition-all duration-500 ${
                    isDone ? 'bg-emerald-400' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Document table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="p-4 font-semibold">Document</th>
              <th className="p-4 font-semibold">Format</th>
              <th className="p-4 font-semibold">Statut</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">

            {/* ── 1. Project Request ─────────────────────────────── */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {iconWrap('bg-purple-100 text-purple-600', ClipboardList)}
                  <div>
                    <p className="font-bold text-slate-800">Project Request</p>
                    <p className="text-xs text-slate-500">Demande initiale</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-sm text-slate-600">Digital</td>
              <td className="p-4"><StepBadge status="Validé" /></td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleViewDoc('request')}
                    disabled={!originalDemande}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                    title="Consulter"
                  ><Eye size={16} /></button>
                  <button
                    onClick={() => originalDemande && generateDemandePDF(originalDemande)}
                    disabled={!originalDemande}
                    className="p-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 text-purple-600 disabled:opacity-40 transition-colors"
                    title="Télécharger PDF"
                  ><Download size={16} /></button>
                </div>
              </td>
            </tr>

            {/* ── 2. Project Charter ─────────────────────────────── */}
            <tr className="hover:bg-slate-50/80 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {iconWrap('bg-emerald-100 text-emerald-600', FileText)}
                  <div>
                    <p className="font-bold text-slate-800">Project Charter</p>
                    <p className="text-xs text-slate-500">Charte rédigée par le PM → Demandeur → Sponsor</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-sm text-slate-600">Digital</td>
              <td className="p-4">
                {charter ? (
                  <StepBadge status={
                    charterValidated ? 'Validé' :
                    charterStatut?.includes('Retourné') ? 'Rejeté' :
                    charterStatut === 'Envoyé au Demandeur' || charterStatut === 'Soumis au Sponsor' ? 'Soumis' :
                    'active'
                  } />
                ) : (
                  <StepBadge status="active" />
                )}
                {charter && !charterValidated && (
                  <p className="text-xs text-slate-400 mt-1">{charterStatut}</p>
                )}
              </td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  {isPM && (
                    <button
                      onClick={() => navigate(`/project-charter?demandeId=${project.demandeId}`)}
                      className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                      title="Éditer / Voir"
                    ><Edit2 size={16} /></button>
                  )}
                  <button
                    disabled={!charter}
                    onClick={() => handleViewDoc('charter')}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                    title="Consulter"
                  ><Eye size={16} /></button>
                  <button
                    disabled={!charter}
                    onClick={() => charter && generateCharterPDF(charter, originalDemande)}
                    className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-emerald-600 disabled:opacity-40 transition-colors"
                    title="PDF"
                  ><Download size={16} /></button>
                </div>
              </td>
            </tr>

            {/* ── 3. Atelier de Cadrage ──────────────────────────── */}
            {(() => {
              const locked = !charterValidated;
              const st = stepStatus('atelier');
              return (
                <tr className={rowClass(locked)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {iconWrap('bg-blue-100 text-blue-600', CheckCircle)}
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          Atelier de Cadrage
                          {locked && <Lock size={12} className="text-slate-400" />}
                        </p>
                        <p className="text-xs text-slate-500">Validation par le PM après approbation Sponsor</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">—</td>
                  <td className="p-4"><StepBadge status={st} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {!locked && isStrictPM && atelierStatut !== 'Validé' && (
                        <>
                          <button
                            onClick={handleValidateAtelier}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <CheckCircle size={14} /> Valider l'Atelier
                          </button>
                          <button
                            onClick={handleRefuseAtelier}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            <XCircle size={14} /> Refuser
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })()}

            {/* ── 4. Backlog ──────────────────────────────────────── */}
            {(() => {
              const locked = !atelierValidated;
              const st = stepStatus('backlog');
              const canImport = !locked && isStrictPM && !project.backlogFile;
              const canReimport = !locked && isStrictPM && backlogStatut === 'Rejeté';
              return (
                <tr className={rowClass(locked)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {iconWrap('bg-orange-100 text-orange-600', FileSpreadsheet)}
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          Backlog
                          {locked && <Lock size={12} className="text-slate-400" />}
                        </p>
                        <p className="text-xs text-slate-500">
                          {project.backlogFile ? `Fichier : ${project.backlogFile}` : 'Fichier PDF/Word attendu'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">.pdf / .docx</td>
                  <td className="p-4"><StepBadge status={locked ? 'locked' : st} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* PM peut importer */}
                      {(canImport || canReimport) && (
                        <>
                          <input type="file" className="hidden" ref={backlogInputRef}
                            onChange={handleUploadBacklog}
                            onClick={(e) => { e.target.value = null; }}
                            accept=".pdf,.doc,.docx"
                          />
                          <button
                            onClick={() => backlogInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
                          >
                            <Upload size={14} />
                            {canReimport ? 'Réimporter le Backlog' : 'Importer le Backlog'}
                          </button>
                        </>
                      )}
                      {/* Consulter / télécharger si fichier */}
                      {project.backlogFile && (
                        <>
                          <button
                            onClick={() => handleViewDoc('backlog')}
                            className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                            title="Consulter"
                          ><Eye size={16} /></button>
                          <button
                            onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = project.backlogFile; a.click(); }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Télécharger"
                          ><Download size={16} /></button>
                        </>
                      )}
                      {/* Sponsor valide ou rejette */}
                      {backlogStatut === 'Soumis' && isSponsor && (
                        <div className="flex gap-2 pl-2 border-l border-slate-200">
                          <button
                            onClick={handleValidateBacklog}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                            title="Valider"
                          ><CheckCircle size={14} /> Valider</button>
                          <button
                            onClick={() => setRejectingDoc('backlog')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors"
                            title="Retourner"
                          ><RefreshCw size={14} /> Retourner</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })()}

            {/* ── 5. Architecture Technique ───────────────────────── */}
            {(() => {
              const locked = !backlogValidated;
              const st = stepStatus('arch');
              const canImport = !locked && isStrictPM && !project.architectureFile;
              const canReimport = !locked && isStrictPM && archStatut === 'Rejeté';
              return (
                <tr className={rowClass(locked)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {iconWrap('bg-indigo-100 text-indigo-600', Box)}
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          Architecture Technique
                          {locked && <Lock size={12} className="text-slate-400" />}
                        </p>
                        <p className="text-xs text-slate-500">
                          {project.architectureFile ? `Fichier : ${project.architectureFile}` : 'Document PDF/Word attendu'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">.pdf / .docx</td>
                  <td className="p-4">
                    <StepBadge status={
                      locked ? 'locked' :
                      archValidated ? 'Validé' :
                      archStatut === 'Rejeté' ? 'Rejeté' :
                      archStatut === 'Soumis' ? 'Soumis' :
                      'active'
                    } />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* PM peut importer */}
                      {(canImport || canReimport) && (
                        <>
                          <input type="file" className="hidden" ref={architectureInputRef}
                            onChange={handleUploadArchitecture}
                            onClick={(e) => { e.target.value = null; }}
                            accept=".pdf,.doc,.docx"
                          />
                          <button
                            onClick={() => architectureInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            <Upload size={14} />
                            {canReimport ? "Réimporter l'Architecture" : "Importer l'Architecture"}
                          </button>
                        </>
                      )}
                      {/* Consulter / télécharger si fichier */}
                      {project.architectureFile && (
                        <>
                          <button
                            onClick={() => handleViewDoc('architecture')}
                            className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                            title="Consulter"
                  ><Eye size={16} /></button>
                          <button
                            onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = project.architectureFile; a.click(); }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                            title="Télécharger"
                          ><Download size={16} /></button>
                        </>
                      )}
                      {/* Sponsor valide ou rejette */}
                      {archStatut === 'Soumis' && isSponsor && (
                        <div className="flex gap-2 pl-2 border-l border-slate-200">
                          <button
                            onClick={handleValidateArchitecture}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors"
                            title="Valider → passage Développement"
                          ><CheckCircle size={14} /> Valider</button>
                          <button
                            onClick={() => setRejectingDoc('architecture')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors"
                            title="Retourner"
                          ><RefreshCw size={14} /> Retourner</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })()}

          </tbody>
        </table>
      </div>

      {/* Reject form */}
      {rejectingDoc && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl animate-fadeIn">
          <div className="space-y-3">
            <h4 className="font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle size={18} />
              Retourner — {rejectingDoc === 'backlog' ? 'Backlog' : 'Architecture Technique'}
            </h4>
            <p className="text-sm text-rose-700">Le PM devra soumettre un nouveau fichier après correction.</p>
            <textarea
              className="w-full p-3 border border-rose-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 bg-white text-sm"
              rows="3"
              placeholder="Expliquez les raisons du retour..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={rejectingDoc === 'backlog' ? handleRejectBacklog : handleRejectArchitecture}
                disabled={!comment.trim()}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors text-sm"
              >Confirmer le Retour</button>
              <button
                onClick={() => { setRejectingDoc(null); setComment(''); }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-bold transition-colors text-sm"
              >Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline viewers ──────────────────────────────────── */}

      {viewingDoc && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-inner animate-fadeIn flex flex-col h-[650px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" /> 
              Visualisation du document : {
                viewingDoc === 'request' ? 'Demande de Projet' :
                viewingDoc === 'charter' ? 'Project Charter' :
                viewingDoc === 'backlog' ? 'Backlog du Projet' :
                'Architecture Technique'
              }
            </h3>
            <button 
              onClick={() => { setViewingDoc(null); setPdfUrl(null); }} 
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                title="Aperçu PDF" 
                className="w-full h-full border-none"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
                <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                Génération de l'aperçu PDF...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info guide */}
      {!isDev && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
            <ArrowRight size={16} />
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Prochaine action requise :</p>
            {activeStep === 'charter' && <p>Le <strong>PM ou le Sponsor</strong> doit créer et envoyer le Project Charter au Demandeur.</p>}
            {activeStep === 'atelier' && <p>Le <strong>PM ou le Sponsor</strong> doit valider l'Atelier de Cadrage (la charte a été approuvée par le Sponsor).</p>}
            {activeStep === 'backlog-upload' && <p>Le <strong>PM ou le Sponsor</strong> doit importer le fichier Backlog (.pdf / .docx).</p>}
            {activeStep === 'backlog-validate' && <p>Le <strong>Sponsor</strong> doit valider ou retourner le Backlog soumis.</p>}
            {activeStep === 'arch-upload' && <p>Le <strong>PM ou le Sponsor</strong> doit importer le document Architecture Technique.</p>}
            {activeStep === 'arch-validate' && <p>Le <strong>Sponsor</strong> doit valider l'Architecture → passage automatique en <strong>Développement</strong>.</p>}
            {activeStep === 'done' && <p>Toutes les étapes sont complètes. Le projet passe en <strong>Développement</strong>.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;
