import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Eye, Upload, CheckCircle, XCircle,
  AlertTriangle, FileSpreadsheet, Box, MessageSquare, X,
  ClipboardList, Edit2, Lock, Zap, CheckCheck,
  Clock, RefreshCw, ArrowRight, Search, File, Image as ImageIcon
} from 'lucide-react';
import { useAuth, useProjects, useCharter, useDemandes, useDocuments, useTasks, useTestCases } from '../../context/AppContext';
import { generateDemandePDF, generateCharterPDF, generateFilePreviewPDF, generateTaskPDF } from '../../utils/pdfGenerator';
import { generateTestCaseExcel } from '../../utils/excelGenerator';

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

const ProjectDocuments = () => {
  const { project } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProject } = useProjects();
  const { getCharterByDemandeId } = useCharter();
  const { demandes } = useDemandes();
  const { documents, fetchDocuments, addDocument } = useDocuments();
  const { tasks, fetchTasks } = useTasks();
  const { testCases, fetchTestCases } = useTestCases();

  useEffect(() => {
    if (project?.id) {
      fetchDocuments(project.id);
      if (fetchTasks) fetchTasks();
      if (fetchTestCases) fetchTestCases(project.id);
    }
  }, [project?.id]);

  const originalDemande = project.originalDemande
    || demandes.find(d => d.id === project.demandeId)
    || null;

  const charter = getCharterByDemandeId(project.demandeId);

  const isPM       = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isStrictPM = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsor  = user?.role === 'Sponsor'         || user?.role === 'Admin';

  const [viewingDoc,       setViewingDoc]       = useState(null);
  const [selectedDocObj,   setSelectedDocObj]   = useState(null);
  const [rejectingDoc,     setRejectingDoc]     = useState(null);
  const [comment,          setComment]          = useState('');
  const [pdfUrl,           setPdfUrl]           = useState(null);
  const [backlogFileBlobUrl, setBacklogFileBlobUrl] = useState(null);
  const [architectureFileBlobUrl, setArchitectureFileBlobUrl] = useState(null);

  const [activeTab,    setActiveTab]    = useState('Tous');
  const [searchQuery,  setSearchQuery]  = useState('');

  const backlogInputRef      = useRef(null);
  const architectureInputRef = useRef(null);

  const handleUploadBacklog = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      addDocument({
        projectId: project.id,
        name: file.name,
        type: 'Backlog',
        format: file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'PDF' : 'Word',
        module: 'Initiation',
        content: reader.result
      });
    };
    reader.readAsDataURL(file);

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

    const reader = new FileReader();
    reader.onloadend = () => {
      addDocument({
        projectId: project.id,
        name: file.name,
        type: 'Architecture Technique',
        format: file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'PDF' : 'Word',
        module: 'Initiation',
        content: reader.result
      });
    };
    reader.readAsDataURL(file);

    updateProject(project.id, { architectureStatus: 'Soumis', architectureFile: file.name, sponsorComment: null });
    if (file.type === 'application/pdf') {
      setArchitectureFileBlobUrl(URL.createObjectURL(file));
    } else {
      setArchitectureFileBlobUrl(null);
    }
  };

  const handleValidateArchitecture = async () => {
    await updateProject(project.id, { architectureStatus: 'Validé', status: 'Développement', sponsorComment: null });
  };

  const handleRejectArchitecture = () => {
    if (!comment.trim()) return;
    updateProject(project.id, { architectureStatus: 'Rejeté', architectureFile: null, sponsorComment: comment });
    setRejectingDoc(null); setComment('');
  };

  const handleViewDoc = async (docType, customDoc = null) => {
    if (viewingDoc === docType && (!customDoc || selectedDocObj?.id === customDoc?.id)) {
      setViewingDoc(null);
      setPdfUrl(null);
      setSelectedDocObj(null);
      return;
    }
    
    setViewingDoc(docType);
    setSelectedDocObj(customDoc);
    setPdfUrl(null);
    
    try {
      let url = null;
      if (docType === 'request' && originalDemande) {
        url = await generateDemandePDF(originalDemande, false);
      } else if (docType === 'charter' && charter) {
        url = await generateCharterPDF(charter, originalDemande, false);
      } else if (docType === 'backlog' && project.backlogFile) {
        const doc = documents.find(d => d.name === project.backlogFile);
        url = backlogFileBlobUrl || (doc && doc.content?.startsWith('data:') ? doc.content : null) || generateFilePreviewPDF(project.backlogFile, 'Backlog du Projet', project.nom);
      } else if (docType === 'architecture' && project.architectureFile) {
        const doc = documents.find(d => d.name === project.architectureFile);
        url = architectureFileBlobUrl || (doc && doc.content?.startsWith('data:') ? doc.content : null) || generateFilePreviewPDF(project.architectureFile, 'Architecture Technique', project.nom);
      } else if (docType === 'custom' && customDoc) {
        const isTC = customDoc.isCreatedTestCase || customDoc.type === 'Cas de Test' || (customDoc.module === 'TestCase' && customDoc.type !== 'Pièce jointe');
        if (customDoc.isCreatedTask && customDoc.rawTask) {
          url = await generateTaskPDF(customDoc.rawTask, project.nom, false);
        } else if (isTC) {
          const rawTC = customDoc.rawTestCase || projectTests.find(t => customDoc.name?.includes(t.testCaseId)) || {
            testCaseId: customDoc.id || 'TC',
            testName: customDoc.name || 'Cas de Test',
            description: customDoc.type || 'Cas de Test',
            status: 'En attente'
          };
          url = generateTestCaseExcel(rawTC, project.nom, false);
        } else if (customDoc.content && customDoc.content.startsWith('data:')) {
          url = customDoc.content;
        } else {
          url = generateFilePreviewPDF(customDoc.name, customDoc.type || 'Document', project.nom);
        }
      }
      setPdfUrl(url || generateFilePreviewPDF(customDoc?.name || 'Document', customDoc?.type || 'Document', project.nom));
    } catch (err) {
      console.error("Erreur lors de la génération de l'aperçu PDF/Excel", err);
      setPdfUrl(generateFilePreviewPDF(customDoc?.name || 'Document', customDoc?.type || 'Document', project.nom));
    }
  };

  const handleValidateAtelier = () =>
    updateProject(project.id, { atelierCadrage: 'Validé' });

  const handleRefuseAtelier = () =>
    updateProject(project.id, { atelierCadrage: 'Refusé' });

  const charterStatut     = charter?.statut || null;
  const charterValidated  = charterStatut === 'Validé';
  const atelierStatut     = project.atelierCadrage || null;
  const atelierValidated  = atelierStatut === 'Validé';
  const backlogStatut     = project.backlogStatus  || null;
  const backlogValidated  = backlogStatut === 'Validé';
  const archStatut        = project.architectureStatus || null;
  const archValidated     = archStatut === 'Validé';
  const isDev             = project.status === 'Développement' || ['Développement', 'Testing', 'Déploiement', 'Utilisation'].includes(project.status);

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

  const rowClass = (isLocked) =>
    `transition-all duration-200 ${isLocked ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50/80'}`;

  const iconWrap = (color, Icon) => (
    <div className={`p-2 rounded-xl ${color}`}><Icon size={20} /></div>
  );

  // Filter tasks & testCases by current project
  const projectTasks = tasks ? tasks.filter(t => String(t.projectId) === String(project?.id)) : [];
  const projectTests = testCases ? testCases.filter(t => String(t.projectId) === String(project?.id)) : [];

  // Generate doc items for all created tasks
  const createdTaskDocs = projectTasks.map(t => ({
    id: `created-task-${t.id}`,
    name: `Fiche Tâche (${t.reference || t.id}) : ${t.objet || t.title || 'Sans titre'}`,
    type: 'Tâche de développement',
    format: 'PDF',
    module: 'Task',
    isCreatedTask: true,
    rawTask: t
  }));

  // Generate doc items for all created test cases
  const createdTestCaseDocs = projectTests.map(tc => ({
    id: `created-testcase-${tc.id}`,
    name: `Fiche Cas de Test (${tc.testCaseId}) : ${tc.testName || 'Sans titre'}`,
    type: 'Cas de Test',
    format: 'Excel',
    module: 'TestCase',
    isCreatedTestCase: true,
    rawTestCase: tc
  }));

  // Gather additional attachments from tasks and testCases if not already present in documents
  const extraTaskDocs = projectTasks
    .filter(t => t.attachment && !documents.some(d => d.content === t.attachment))
    .map(t => ({
      id: `task-attachment-${t.id}`,
      name: t.reference ? `Pièce jointe - Tâche ${t.reference}` : `Pièce jointe - Tâche ${t.objet || t.id}`,
      type: 'Pièce jointe',
      format: 'PDF',
      module: 'Task',
      content: t.attachment,
      createdAt: t.createdAt
    }));

  const extraTestDocs = projectTests
    .filter(t => t.attachment && !documents.some(d => d.content === t.attachment))
    .map(t => ({
      id: `test-attachment-${t.id}`,
      name: `Pièce jointe - Test ${t.testCaseId}`,
      type: 'Pièce jointe',
      format: 'PDF',
      module: 'TestCase',
      content: t.attachment,
      createdAt: t.createdAt
    }));

  const rawDocumentsList = [
    ...(originalDemande ? [{
      id: 'doc-demande',
      name: `Demande de Projet (${project.demandeId})`,
      type: 'Initialisation',
      format: 'PDF',
      module: 'Initiation',
      isSystem: true,
      sysType: 'request'
    }] : []),
    ...(charter ? [{
      id: 'doc-charter',
      name: 'Project Charter',
      type: 'Cadrage',
      format: 'PDF',
      module: 'Initiation',
      isSystem: true,
      sysType: 'charter'
    }] : []),
    ...(project.backlogFile && !documents.some(d => d.name === project.backlogFile) ? [{
      id: 'doc-backlog-sys',
      name: `Backlog - ${project.backlogFile}`,
      type: 'Backlog',
      format: 'PDF',
      module: 'Initiation',
      isSystem: true,
      sysType: 'backlog'
    }] : []),
    ...(project.architectureFile && !documents.some(d => d.name === project.architectureFile) ? [{
      id: 'doc-arch-sys',
      name: `Architecture Technique - ${project.architectureFile}`,
      type: 'Architecture Technique',
      format: 'PDF',
      module: 'Initiation',
      isSystem: true,
      sysType: 'architecture'
    }] : []),
    ...documents,
    ...createdTaskDocs,
    ...createdTestCaseDocs,
    ...extraTaskDocs,
    ...extraTestDocs
  ];

  // Enforce PDF format for all attachments/docs EXCEPT Test Cases which use Excel
  const allDocumentsList = rawDocumentsList.map(doc => {
    const isTC = doc.isCreatedTestCase || doc.type === 'Cas de Test' || (doc.module === 'TestCase' && doc.type !== 'Pièce jointe');
    return {
      ...doc,
      format: isTC ? 'Excel' : 'PDF'
    };
  });

  const filteredDocuments = allDocumentsList.filter(doc => {
    if (activeTab === 'Initiation' && doc.module !== 'Initiation' && !['Initialisation', 'Cadrage', 'Backlog', 'Architecture Technique'].includes(doc.type)) return false;
    if (activeTab === 'Tâches' && doc.module !== 'Task' && doc.type !== 'Tâche de développement') return false;
    if (activeTab === 'Cas de Test' && doc.module !== 'TestCase' && doc.type !== 'Cas de Test') return false;
    if (activeTab === 'Imports / Exports' && doc.type !== 'Import' && doc.type !== 'Export') return false;
    if (activeTab === 'Pièces Jointes' && doc.type !== 'Pièce jointe') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name?.toLowerCase().includes(q);
      const matchType = doc.type?.toLowerCase().includes(q);
      const matchFormat = doc.format?.toLowerCase().includes(q);
      const matchModule = doc.module?.toLowerCase().includes(q);
      return matchName || matchType || matchFormat || matchModule;
    }

    return true;
  });

  const isDocBeingViewed = (docType, customDoc = null) => {
    if (!viewingDoc) return false;
    if (docType === 'custom') {
      return viewingDoc === 'custom' && selectedDocObj?.id === customDoc?.id;
    }
    return viewingDoc === docType;
  };

  const renderDocPreviewRow = (colSpan = 5) => {
    if (!viewingDoc) return null;

    const isTestCaseDoc = selectedDocObj?.isCreatedTestCase || selectedDocObj?.type === 'Cas de Test' || (selectedDocObj?.module === 'TestCase' && selectedDocObj?.type !== 'Pièce jointe') || selectedDocObj?.format === 'Excel';
    const activeTestCase = selectedDocObj?.rawTestCase || (
      isTestCaseDoc
        ? projectTests.find(t => selectedDocObj?.name?.includes(t.testCaseId)) || {
            testCaseId: selectedDocObj?.id || 'TC',
            testName: selectedDocObj?.name || 'Cas de Test',
            description: selectedDocObj?.type || 'Cas de Test',
            status: 'En attente'
          }
        : null
    );

    return (
      <tr key={`preview-row-${selectedDocObj?.id || viewingDoc}`}>
        <td colSpan={colSpan} className="p-4 bg-slate-100/80 border-y-2 border-blue-400 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl flex flex-col min-h-[480px] max-h-[80vh] h-[620px]">
            <div className="flex items-center justify-between mb-3 shrink-0 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600 shrink-0" size={20} /> 
                Visualisation : {
                  viewingDoc === 'request' ? 'Demande de Projet' :
                  viewingDoc === 'charter' ? 'Project Charter' :
                  viewingDoc === 'backlog' ? 'Backlog du Projet' :
                  viewingDoc === 'architecture' ? 'Architecture Technique' :
                  selectedDocObj?.name || 'Document'
                }
              </h3>
              <button 
                onClick={() => { setViewingDoc(null); setPdfUrl(null); setSelectedDocObj(null); }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner flex flex-col items-center justify-center p-3 overflow-y-auto">
              {isTestCaseDoc ? (
                <div className="w-full h-full flex flex-col justify-between space-y-4 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                        <FileSpreadsheet size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{selectedDocObj?.name || 'Cas de Test Excel'}</h4>
                        <p className="text-xs text-emerald-700 font-semibold">Format : Microsoft Excel (.xlsx)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (activeTestCase) {
                          generateTestCaseExcel(activeTestCase, project.nom, true);
                        } else if (pdfUrl) {
                          const a = document.createElement('a');
                          a.href = pdfUrl;
                          a.download = selectedDocObj?.name || 'Cas_de_test.xlsx';
                          a.click();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all text-xs"
                    >
                      <Download size={16} /> Télécharger en Excel (.xlsx)
                    </button>
                  </div>

                  {activeTestCase ? (
                    <div className="flex-1 overflow-x-auto bg-white rounded-xl border border-slate-200 p-4 text-sm shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500 w-1/4">ID Cas de Test</td>
                            <td className="p-2.5 font-bold text-slate-800">{activeTestCase.testCaseId || activeTestCase.id || 'TC'}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="p-2.5 font-bold text-slate-500">Nom du Test</td>
                            <td className="p-2.5 text-slate-800 font-medium">{activeTestCase.testName || activeTestCase.name || selectedDocObj?.name}</td>
                          </tr>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">Statut</td>
                            <td className="p-2.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                activeTestCase.status === 'Réussite' ? 'bg-emerald-100 text-emerald-800' :
                                activeTestCase.status === 'Échec' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {activeTestCase.status || 'En attente'}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="p-2.5 font-bold text-slate-500">Priorité / Profil</td>
                            <td className="p-2.5 text-slate-700">{activeTestCase.priority || 'Moyenne'} — {activeTestCase.profile || 'Non spécifié'}</td>
                          </tr>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">Description</td>
                            <td className="p-2.5 text-slate-700 whitespace-pre-wrap">{activeTestCase.description || '-'}</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="p-2.5 font-bold text-slate-500">Résultat Attendu</td>
                            <td className="p-2.5 text-slate-700 whitespace-pre-wrap">{activeTestCase.expectedResult || '-'}</td>
                          </tr>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">Résultat Réel</td>
                            <td className="p-2.5 text-slate-700 whitespace-pre-wrap">{activeTestCase.actualResult || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-slate-200">
                      <FileSpreadsheet size={48} className="text-emerald-500 mb-2" />
                      <p className="font-bold text-slate-800">Fichier Excel prêt au téléchargement</p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">Ce fichier contient la structure de données au format Microsoft Excel.</p>
                    </div>
                  )}
                </div>
              ) : pdfUrl ? (
                pdfUrl.startsWith('data:image/') ? (
                  <img src={pdfUrl} alt="Aperçu Document" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                ) : pdfUrl.startsWith('data:application/pdf') || pdfUrl.startsWith('blob:') ? (
                  <iframe 
                    src={pdfUrl} 
                    title="Aperçu Document" 
                    className="w-full h-full border-none rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-sm">
                      <FileText size={48} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{selectedDocObj?.name || 'Fichier'}</h4>
                    <p className="text-sm text-slate-500 mb-4">
                      Ce fichier de format <strong>PDF</strong> peut être téléchargé et consulté directement.
                    </p>
                    <a
                      href={pdfUrl}
                      download={selectedDocObj?.name || 'document'}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all text-sm"
                    >
                      <Download size={18} /> Télécharger le fichier
                    </a>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  Chargement de l'aperçu...
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestionnaire de Documents</h2>
        <p className="text-slate-500 mt-1">
          Workflow d'initiation séquentiel — chaque étape se débloque après validation de la précédente.
        </p>
      </div>

      {project.sponsorComment && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
          <MessageSquare size={22} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Retour du Sponsor</p>
            <p className="text-slate-700 mt-1 text-sm">{project.sponsorComment}</p>
          </div>
        </div>
      )}

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
            {isDocBeingViewed('request') && renderDocPreviewRow(4)}

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
            {isDocBeingViewed('charter') && renderDocPreviewRow(4)}

            <tr className={rowClass(!charterValidated)}>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {iconWrap('bg-blue-100 text-blue-600', CheckCircle)}
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      Atelier de Cadrage
                      {!charterValidated && <Lock size={12} className="text-slate-400" />}
                    </p>
                    <p className="text-xs text-slate-500">Validation par le PM après approbation Sponsor</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-sm text-slate-600">—</td>
              <td className="p-4"><StepBadge status={stepStatus('atelier')} /></td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  {charterValidated && isStrictPM && atelierStatut !== 'Validé' && (
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

            <React.Fragment>
              <tr className={rowClass(!atelierValidated)}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {iconWrap('bg-orange-100 text-orange-600', FileSpreadsheet)}
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        Backlog
                        {!atelierValidated && <Lock size={12} className="text-slate-400" />}
                      </p>
                      <p className="text-xs text-slate-500">
                        {project.backlogFile ? `Fichier : ${project.backlogFile}` : 'Fichier PDF/Word attendu'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-600">.pdf / .docx</td>
                <td className="p-4"><StepBadge status={!atelierValidated ? 'locked' : stepStatus('backlog')} /></td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {atelierValidated && isStrictPM && (!project.backlogFile || backlogStatut === 'Rejeté') && (
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
                          {backlogStatut === 'Rejeté' ? 'Réimporter le Backlog' : 'Importer le Backlog'}
                        </button>
                      </>
                    )}
                    {project.backlogFile && (
                      <>
                        <button
                          onClick={() => handleViewDoc('backlog')}
                          className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Consulter"
                        ><Eye size={16} /></button>
                        <button
                          onClick={() => { const a = document.createElement('a'); a.href = documents.find(d => d.name === project.backlogFile)?.content || '#'; a.download = project.backlogFile; a.click(); }}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Télécharger"
                        ><Download size={16} /></button>
                      </>
                    )}
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
              {isDocBeingViewed('backlog') && renderDocPreviewRow(4)}
            </React.Fragment>

            <React.Fragment>
              <tr className={rowClass(!backlogValidated)}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {iconWrap('bg-indigo-100 text-indigo-600', Box)}
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        Architecture Technique
                        {!backlogValidated && <Lock size={12} className="text-slate-400" />}
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
                    !backlogValidated ? 'locked' :
                    archValidated ? 'Validé' :
                    archStatut === 'Rejeté' ? 'Rejeté' :
                    archStatut === 'Soumis' ? 'Soumis' :
                    'active'
                  } />
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {backlogValidated && isStrictPM && (!project.architectureFile || archStatut === 'Rejeté') && (
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
                          {archStatut === 'Rejeté' ? "Réimporter l'Architecture" : "Importer l'Architecture"}
                        </button>
                      </>
                    )}
                    {project.architectureFile && (
                      <>
                        <button
                          onClick={() => handleViewDoc('architecture')}
                          className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                          title="Consulter"
                        ><Eye size={16} /></button>
                        <button
                          onClick={() => { const a = document.createElement('a'); a.href = documents.find(d => d.name === project.architectureFile)?.content || '#'; a.download = project.architectureFile; a.click(); }}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Télécharger"
                        ><Download size={16} /></button>
                      </>
                    )}
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
              {isDocBeingViewed('architecture') && renderDocPreviewRow(4)}
            </React.Fragment>
          </tbody>
        </table>
      </div>

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

      {/* SECTION CENTRALISÉE: Tous les documents du projet avec filtres et recherche */}
      <div className="mt-12 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="text-blue-600" /> Tous les documents du projet
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Accès centralisé à l'ensemble des documents, fiches de tâches, fiches de test et fichiers importés/exportés ({allDocumentsList.length}).
            </p>
          </div>

          <div className="relative min-w-[280px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-sm">
          {['Tous', 'Initiation', 'Tâches', 'Cas de Test'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Nom du Document</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Module</th>
                <th className="p-4 font-semibold text-center">Format</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map((doc, idx) => {
                const isBeingViewed = isDocBeingViewed(doc.isSystem ? doc.sysType : 'custom', doc);
                return (
                  <React.Fragment key={doc.id || idx}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${isBeingViewed ? 'bg-blue-50/60 font-semibold' : ''}`}>
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          {doc.format === 'PDF' ? <FileText size={18} className="text-rose-500 shrink-0" /> :
                           doc.format === 'Word' ? <FileText size={18} className="text-blue-500 shrink-0" /> :
                           doc.format === 'Excel' ? <FileSpreadsheet size={18} className="text-emerald-500 shrink-0" /> :
                           doc.format === 'Image' ? <ImageIcon size={18} className="text-purple-500 shrink-0" /> :
                           <File size={18} className="text-slate-400 shrink-0" />}
                          <span>{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          doc.type === 'Import' ? 'bg-amber-100 text-amber-800' :
                          doc.type === 'Export' ? 'bg-blue-100 text-blue-800' :
                          doc.type === 'Pièce jointe' ? 'bg-indigo-100 text-indigo-800' :
                          doc.isCreatedTask || doc.isCreatedTestCase ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium">
                        {doc.module || 'Général'}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{doc.format}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              if (doc.isSystem) {
                                handleViewDoc(doc.sysType);
                              } else {
                                handleViewDoc('custom', doc);
                              }
                            }}
                            className={`p-2 border rounded-lg transition-colors shadow-sm ${
                              isBeingViewed 
                                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                            title="Consulter"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (doc.sysType === 'request' && originalDemande) {
                                generateDemandePDF(originalDemande, true);
                              } else if (doc.sysType === 'charter' && charter) {
                                generateCharterPDF(charter, originalDemande, true);
                              } else if (doc.sysType === 'backlog' && project.backlogFile) {
                                const d = documents.find(x => x.name === project.backlogFile);
                                if (d && d.content && d.content.startsWith('data:')) {
                                  const a = document.createElement('a'); a.href = d.content; a.download = project.backlogFile; a.click();
                                } else if (backlogFileBlobUrl) {
                                  const a = document.createElement('a'); a.href = backlogFileBlobUrl; a.download = project.backlogFile; a.click();
                                } else {
                                  const url = generateFilePreviewPDF(project.backlogFile, 'Backlog du Projet', project.nom);
                                  const a = document.createElement('a'); a.href = url; a.download = project.backlogFile.endsWith('.pdf') ? project.backlogFile : `${project.backlogFile}.pdf`; a.click();
                                }
                              } else if (doc.sysType === 'architecture' && project.architectureFile) {
                                const d = documents.find(x => x.name === project.architectureFile);
                                if (d && d.content && d.content.startsWith('data:')) {
                                  const a = document.createElement('a'); a.href = d.content; a.download = project.architectureFile; a.click();
                                } else if (architectureFileBlobUrl) {
                                  const a = document.createElement('a'); a.href = architectureFileBlobUrl; a.download = project.architectureFile; a.click();
                                } else {
                                  const url = generateFilePreviewPDF(project.architectureFile, 'Architecture Technique', project.nom);
                                  const a = document.createElement('a'); a.href = url; a.download = project.architectureFile.endsWith('.pdf') ? project.architectureFile : `${project.architectureFile}.pdf`; a.click();
                                }
                              } else if (doc.isCreatedTask && doc.rawTask) {
                                generateTaskPDF(doc.rawTask, project.nom, true);
                              } else if (doc.isCreatedTestCase && doc.rawTestCase) {
                                generateTestCaseExcel(doc.rawTestCase, project.nom, true);
                              } else if (doc.content && doc.content.startsWith('data:')) {
                                const a = document.createElement('a');
                                a.href = doc.content;
                                a.download = doc.name;
                                a.click();
                              } else {
                                const url = generateFilePreviewPDF(doc.name, doc.type || 'Document', project.nom);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
                                a.click();
                              }
                            }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shadow-sm"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isBeingViewed && renderDocPreviewRow(5)}
                  </React.Fragment>
                );
              })}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    Aucun document trouvé correspondant à vos critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectDocuments;
