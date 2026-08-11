import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Rocket, Upload, FileText, CheckCircle2, AlertTriangle, Eye, Download, Server, FileSpreadsheet, Check, ShieldCheck, X
} from 'lucide-react';
import { useAuth, useProjects, useDocuments } from '../../context/AppContext';
import { generateFilePreviewPDF } from '../../utils/pdfGenerator';
import Popup from '../../components/Popup';

const ProjectDeployment = () => {
  const { project, isPending } = useOutletContext();
  const { user } = useAuth();
  const { updateProject } = useProjects();
  const { documents, addDocument } = useDocuments();

  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewingDoc, setIsViewingDoc] = useState(false);
  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const fileInputRef = useRef(null);

  const isAdmin = user?.role === 'Admin';
  const isPM = user?.role === 'Project Manager';
  const isSponsor = user?.role === 'Sponsor';
  const isDev = user?.role === 'Developer';
  const isResponsableInfra = user?.role === 'Responsable Infra';

  // Allowed to upload plan de déploiement: Admin, PM, Sponsor, Developer, Responsable Infra
  const canUploadPlan = isAdmin || isPM || isSponsor || isDev || isResponsableInfra;

  // Allowed to validate deployment: Responsable Infra ONLY
  const canValidateDeployment = isResponsableInfra;

  const handleUploadPlan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const format = file.name.endsWith('.pdf') ? 'PDF' :
                   (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) ? 'Excel' :
                   (file.name.endsWith('.doc') || file.name.endsWith('.docx')) ? 'Word' : 'Autre';

    const reader = new FileReader();
    reader.onloadend = async () => {
      await addDocument({
        projectId: project.id,
        name: `Plan_Deploiement_${file.name}`,
        type: 'Plan de Déploiement',
        format,
        module: 'Deployment',
        content: reader.result
      });

      await updateProject(project.id, {
        deploymentPlanFile: file.name,
        deploymentPlanStatus: 'Soumis',
        sponsorComment: null
      });

      setPopup({
        isOpen: true,
        title: 'Plan de Déploiement Importé',
        message: `Le fichier "${file.name}" a été importé avec succès.`,
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleViewPlan = () => {
    const doc = documents.find(d => d.name?.includes(project.deploymentPlanFile) || d.type === 'Plan de Déploiement');
    if (doc && doc.content?.startsWith('data:')) {
      setPdfUrl(doc.content);
    } else {
      setPdfUrl(generateFilePreviewPDF(project.deploymentPlanFile || 'Plan_de_déploiement.pdf', 'Plan de Déploiement', project.nom));
    }
    setIsViewingDoc(true);
  };

  const handleDownloadPlan = () => {
    const doc = documents.find(d => d.name?.includes(project.deploymentPlanFile) || d.type === 'Plan de Déploiement');
    if (doc && doc.content && doc.content.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.content;
      a.download = project.deploymentPlanFile || 'Plan_de_déploiement.pdf';
      a.click();
    } else if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = project.deploymentPlanFile || 'Plan_de_déploiement.pdf';
      a.click();
    } else {
      const url = generateFilePreviewPDF(project.deploymentPlanFile || 'Plan_de_déploiement.pdf', 'Plan de Déploiement', project.nom);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.deploymentPlanFile || 'Plan_de_déploiement'}.pdf`;
      a.click();
    }
  };

  const handleDirectValidateDeployment = async () => {
    try {
      const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.role;
      const formattedDate = new Date().toLocaleString('fr-FR');

      // Update project status to Utilisation (Deployment validated) + force 100%
      await updateProject(project.id, {
        status: 'Utilisation',
        deploymentPlanStatus: 'Validé',
        deploymentValidatedBy: userName,
        deploymentValidatedAt: formattedDate,
        progress: 100
      });

      setPopup({
        isOpen: true,
        title: 'Déploiement Validé avec Succès !',
        message: `Le déploiement du projet "${project.nom}" a été validé et le projet est maintenant en phase "Utilisation".`,
        type: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isDeploymentPhase = project?.status === 'Déploiement';
  const isCompletedPhase = project?.status === 'Utilisation';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Rocket className="text-amber-500" size={26} />
            Module de Déploiement du Projet
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Importation du Plan de Déploiement et mise en production du projet ({project?.nom}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isCompletedPhase ? 'bg-emerald-100 text-emerald-800' :
            isDeploymentPhase ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' :
            'bg-slate-100 text-slate-600'
          }`}>
            <Server size={14} />
            Phase actuelle : {project?.status || 'Initiation'}
          </span>
        </div>
      </div>

      {/* PHASE BANNER ALERT */}
      {!isDeploymentPhase && !isCompletedPhase && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl flex gap-3 items-start shadow-sm">
          <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-base">Projet en phase {project?.status}</p>
            <p className="text-sm text-amber-800 mt-1">
              Le passage à la phase <strong>Déploiement</strong> s'effectue dès que les cas de test sont validés par le <strong>Chef Testeur</strong>.
            </p>
          </div>
        </div>
      )}

      {isCompletedPhase && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-2xl flex gap-4 items-center shadow-sm">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="font-bold text-lg text-emerald-900">Déploiement Effectué et Validé !</p>
            <p className="text-emerald-700 text-sm mt-0.5">
              Le projet a été déployé en production avec succès par <strong>{project.deploymentValidatedBy || 'Responsable Infra'}</strong> le {project.deploymentValidatedAt || 'récemment'}.
            </p>
          </div>
        </div>
      )}

      {/* UPLOAD & PLAN DE DÉPLOIEMENT CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={22} />
              Plan de Déploiement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Le PM, Sponsor, Admin, Responsable Infra ou Développeur importe le plan de déploiement.
            </p>
          </div>

          {canUploadPlan && (!project.deploymentPlanFile || isDeploymentPhase) && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadPlan}
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all text-sm"
              >
                <Upload size={18} />
                {project.deploymentPlanFile ? 'Réimporter le Plan' : 'Importer le Plan de Déploiement'}
              </button>
            </div>
          )}
        </div>

        {/* DISPLAY CURRENT DEPLOYMENT PLAN */}
        {project.deploymentPlanFile ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl shadow-sm">
                {project.deploymentPlanFile.endsWith('.xlsx') || project.deploymentPlanFile.endsWith('.xls') ? (
                  <FileSpreadsheet size={28} />
                ) : (
                  <FileText size={28} />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{project.deploymentPlanFile}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    project.deploymentPlanStatus === 'Validé' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    Statut : {project.deploymentPlanStatus || 'Soumis'}
                  </span>
                  <span className="text-xs text-slate-400">Module Déploiement</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleViewPlan}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                <Eye size={16} /> Consulter
              </button>
              <button
                onClick={handleDownloadPlan}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                <Download size={16} /> Télécharger
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <Rocket size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">Aucun plan de déploiement importé</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Veuillez déposer le plan déploiement avant de procéder à la mise en production.
            </p>
            {canUploadPlan && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-sm transition-all"
              >
                <Upload size={16} /> Importer le fichier
              </button>
            )}
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {isViewingDoc && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              Aperçu : {project.deploymentPlanFile || 'Plan de Déploiement'}
            </h3>
            <button
              onClick={() => setIsViewingDoc(false)}
              className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
          <div className="h-[500px] w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-2">
            {pdfUrl ? (
              pdfUrl.startsWith('data:application/pdf') || pdfUrl.startsWith('blob:') ? (
                <iframe src={pdfUrl} title="Aperçu Plan" className="w-full h-full border-none rounded-lg" />
              ) : (
                <div className="text-center p-6">
                  <FileText size={48} className="mx-auto text-blue-600 mb-2" />
                  <p className="font-bold text-slate-800 mb-2">{project.deploymentPlanFile}</p>
                  <button onClick={handleDownloadPlan} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs">
                    Télécharger le document
                  </button>
                </div>
              )
            ) : (
              <div className="text-slate-400 text-sm">Chargement du document...</div>
            )}
          </div>
        </div>
      )}

      {/* VALIDATE DEPLOYMENT ACTION SECTION - RESPONSABLE INFRA ONLY */}
      {isDeploymentPhase && canValidateDeployment && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-200 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck size={18} /> Validation du Déploiement
            </div>
            <h3 className="text-xl font-bold">Effectuer et Valider le Déploiement</h3>
            <p className="text-amber-100 text-sm mt-1 max-w-xl">
              Une fois le déploiement exécuté conformément au plan, validez pour passer le projet à l'étape finale <strong>Utilisation</strong>.
            </p>
          </div>

          <button
            onClick={handleDirectValidateDeployment}
            className="w-full md:w-auto px-6 py-3.5 bg-white text-orange-600 font-extrabold rounded-2xl hover:bg-amber-50 transition-all shadow-lg text-sm shrink-0 flex items-center justify-center gap-2"
          >
            <Check size={20} /> Valider le Déploiement
          </button>
        </div>
      )}

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

export default ProjectDeployment;
