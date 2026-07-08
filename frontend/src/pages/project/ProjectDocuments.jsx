import React, { useState, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Eye, Upload, CheckCircle, XCircle,
  AlertTriangle, FileSpreadsheet, Box, MessageSquare, X,
  ClipboardList, Edit2
} from 'lucide-react';
import { useAuth, useProjects, useCharter, useDemandes } from '../../context/AppContext';
import { generateDemandePDF, generateCharterPDF } from '../../utils/pdfGenerator';

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
  const isPM = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsor = user?.role === 'Sponsor' || user?.role === 'Admin';

  const [viewingDoc, setViewingDoc] = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [comment, setComment] = useState('');

  const backlogInputRef = useRef(null);
  const architectureInputRef = useRef(null);

  const STATUS_ORDER = [
    'Initiation', 'Développement', 'Testing', 'Livraison', 'Utilisation'
  ];
  const isAfter = (s, pivot) => STATUS_ORDER.indexOf(s) > STATUS_ORDER.indexOf(pivot);

  const canImportBacklog = isPM && !project.backlogFile;
  const canImportArchitecture = isPM && !project.architectureFile;

  const handleUploadBacklog = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateProject(project.id, { backlogStatus: 'Soumis', backlogFile: file.name, sponsorComment: null });
  };
  const handleValidateBacklog = () => updateProject(project.id, { backlogStatus: 'Validé', sponsorComment: null });
  const handleRejectBacklog = () => {
    if (!comment.trim()) return;
    updateProject(project.id, { backlogStatus: 'Rejeté', backlogFile: null, sponsorComment: comment });
    setRejectingDoc(null); setComment('');
  };
  const handleUploadArchitecture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    updateProject(project.id, { architectureStatus: 'Soumis', architectureFile: file.name, sponsorComment: null });
  };
  const handleValidateArchitecture = () => updateProject(project.id, { architectureStatus: 'Validé', sponsorComment: null });
  const handleRejectArchitecture = () => {
    if (!comment.trim()) return;
    updateProject(project.id, { architectureStatus: 'Rejeté', architectureFile: null, sponsorComment: comment });
    setRejectingDoc(null); setComment('');
  };

  const StatusBadge = ({ statusKey }) => {
    if (project[statusKey] === 'Validé')
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Validé</span>;
    if (project[statusKey] === 'Soumis')
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En Validation</span>;
    if (project[statusKey] === 'Rejeté')
      return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Rejeté</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">En Attente</span>;
  };

  const isInitiationDone = project.status !== 'Initiation';

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestionnaire de Documents</h2>
        <p className="text-slate-500">Centralisation de tous les fichiers et de leurs validations (Workflow d'Initiation).</p>
      </div>

      {project.sponsorComment && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start shadow-sm">
          <MessageSquare size={24} className="text-red-500 shrink-0 mt-1" />
          <div>
            <p className="font-bold text-lg">Retour du Sponsor</p>
            <p className="text-slate-700 mt-1">{project.sponsorComment}</p>
          </div>
        </div>
      )}

      {isInitiationDone && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl flex gap-4 items-center shadow-sm">
          <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20"><CheckCircle size={24} /></div>
          <div>
            <p className="font-bold text-lg text-emerald-900">Initiation Terminée avec Succès !</p>
            <p className="text-emerald-700 text-sm mt-0.5">Toutes les étapes (Charte, Cadrage, Backlog et Architecture) ont été validées. Le projet est prêt pour le développement.</p>
          </div>
        </div>
      )}

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

            {/* 1. Project Request */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><ClipboardList size={20} /></div><div><p className="font-bold text-slate-800">Project Request</p><p className="text-xs text-slate-500">Demande initiale</p></div></div></td>
              <td className="p-4 text-sm text-slate-600">Digital</td>
              <td className="p-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Validé</span></td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setViewingDoc(viewingDoc === 'request' ? null : 'request')} disabled={!originalDemande} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40" title="Consulter"><Eye size={18} /></button>
                  <button onClick={() => originalDemande && generateDemandePDF(originalDemande)} disabled={!originalDemande} className="p-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 text-purple-600 disabled:opacity-40" title="Télécharger PDF"><Download size={18} /></button>
                </div>
              </td>
            </tr>

            {/* 2. Project Charter */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FileText size={20} /></div><div><p className="font-bold text-slate-800">Project Charter</p><p className="text-xs text-slate-500">Charte de projet rédigée par le PM</p></div></div></td>
              <td className="p-4 text-sm text-slate-600">Digital</td>
              <td className="p-4">
                {charter ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${charter.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' : charter.statut === 'Brouillon' ? 'bg-slate-100 text-slate-700' : charter.statut?.includes('Retourné') ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{charter.statut}</span>
                ) : <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">Manquant</span>}
              </td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  {isPM && <button onClick={() => navigate(`/project-charter?demandeId=${project.demandeId}`)} className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-600" title="Éditer"><Edit2 size={18} /></button>}
                  <button disabled={!charter} onClick={() => setViewingDoc(viewingDoc === 'charter' ? null : 'charter')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40" title="Consulter"><Eye size={18} /></button>
                  <button disabled={!charter} onClick={() => charter && generateCharterPDF(charter, project.originalDemande)} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 text-emerald-600 disabled:opacity-40" title="PDF"><Download size={18} /></button>
                </div>
              </td>
            </tr>

            {/* 3. Atelier de Cadrage */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CheckCircle size={20} /></div><div><p className="font-bold text-slate-800">Atelier de Cadrage</p><p className="text-xs text-slate-500">Validation du cadrage par le PM</p></div></div></td>
              <td className="p-4 text-sm text-slate-600">—</td>
              <td className="p-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Validé</span>
              </td>
              <td className="p-4 text-right">
              </td>
            </tr>

            {/* 4. Backlog */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FileSpreadsheet size={20} /></div><div><p className="font-bold text-slate-800">Backlog</p><p className="text-xs text-slate-500">{project.backlogFile ? `Fichier : ${project.backlogFile}` : 'Fichier PDF/Word attendu'}</p></div></div></td>
              <td className="p-4 text-sm text-slate-600">.pdf / .docx</td>
              <td className="p-4"><StatusBadge statusKey="backlogStatus" /></td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  {canImportBacklog && (
                    <>
                      <input type="file" className="hidden" ref={backlogInputRef} onChange={handleUploadBacklog} onClick={(e) => { e.target.value = null; }} />
                      <button onClick={() => backlogInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100">
                        <Upload size={16} /> Importer le Backlog
                      </button>
                    </>
                  )}
                  {project.backlogFile && (
                    <>
                      <button onClick={() => setViewingDoc(viewingDoc === 'backlog' ? null : 'backlog')} className="p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-blue-600" title="Consulter"><Eye size={18} /></button>
                      <button onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = project.backlogFile; a.click(); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Télécharger"><Download size={18} /></button>
                    </>
                  )}
                  {project.backlogStatus === 'Soumis' && isSponsor && (
                    <div className="flex gap-2 ml-1 pl-2 border-l border-slate-200">
                      <button onClick={handleValidateBacklog} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Valider"><CheckCircle size={18} /></button>
                      <button onClick={() => setRejectingDoc('backlog')} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Refuser"><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </td>
            </tr>

            {/* 5. Architecture Technique */}
            <tr className="hover:bg-slate-50 transition-colors">
              <td className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Box size={20} /></div><div><p className="font-bold text-slate-800">Architecture Technique</p><p className="text-xs text-slate-500">{project.architectureFile ? `Fichier : ${project.architectureFile}` : 'Document PDF/Word attendu'}</p></div></div></td>
              <td className="p-4 text-sm text-slate-600">.pdf / .docx</td>
              <td className="p-4"><StatusBadge statusKey="architectureStatus" /></td>
              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  {canImportArchitecture && (
                    <>
                      <input type="file" className="hidden" ref={architectureInputRef} onChange={handleUploadArchitecture} onClick={(e) => { e.target.value = null; }} />
                      <button onClick={() => architectureInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100">
                        <Upload size={16} /> Importer l'Architecture
                      </button>
                    </>
                  )}
                  {project.architectureFile && (
                    <>
                      <button onClick={() => setViewingDoc(viewingDoc === 'architecture' ? null : 'architecture')} className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-indigo-600" title="Consulter"><Eye size={18} /></button>
                      <button onClick={() => { const a = document.createElement('a'); a.href = '#'; a.download = project.architectureFile; a.click(); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Télécharger"><Download size={18} /></button>
                    </>
                  )}
                  {project.architectureStatus === 'Soumis' && isSponsor && (
                    <div className="flex gap-2 ml-1 pl-2 border-l border-slate-200">
                      <button onClick={handleValidateArchitecture} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Valider"><CheckCircle size={18} /></button>
                      <button onClick={() => setRejectingDoc('architecture')} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Refuser"><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {rejectingDoc && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
          <div className="space-y-3">
            <h4 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={20} /> Refuser — {rejectingDoc === 'backlog' ? 'Backlog' : 'Architecture Technique'}</h4>
            <textarea className="w-full p-3 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500" rows="3" placeholder="Veuillez expliquer les raisons de ce refus..." value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={rejectingDoc === 'backlog' ? handleRejectBacklog : handleRejectArchitecture} disabled={!comment.trim()} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">Confirmer le Refus</button>
              <button onClick={() => { setRejectingDoc(null); setComment(''); }} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-bold">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {viewingDoc === 'request' && originalDemande && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-inner">
          <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200"><X size={20} /></button>
          <h3 className="font-bold text-xl mb-4 text-purple-800 flex items-center gap-2"><ClipboardList size={24} /> Détails de la Demande Initiale</h3>
          <div className="space-y-3 text-slate-700">
            <div><span className="font-semibold">Demandeur :</span> {originalDemande.nomDemandeur} ({originalDemande.fonction})</div>
            <div><span className="font-semibold">Contexte :</span> {originalDemande.contexte}</div>
            <div><span className="font-semibold">Description du besoin :</span> {originalDemande.description}</div>
            <div><span className="font-semibold">Bénéfices escomptés :</span> {originalDemande.benefices?.join(', ') || 'N/A'}</div>
          </div>
        </div>
      )}

      {viewingDoc === 'charter' && charter && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-inner">
          <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200"><X size={20} /></button>
          <h3 className="font-bold text-xl mb-4 text-emerald-800 flex items-center gap-2"><FileText size={24} /> Détails de la Charte de Projet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-700">
            <div><h4 className="font-bold mb-2 text-slate-800">Contexte et Justification</h4><p className="text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">{charter.contexte || 'N/A'}</p></div>
            <div><h4 className="font-bold mb-2 text-slate-800">Objectifs du Projet</h4><p className="text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">{charter.objectifs || 'N/A'}</p></div>
            <div><h4 className="font-bold mb-2 text-slate-800">Périmètre Inclus</h4><p className="text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">{charter.perimetreInclus || 'N/A'}</p></div>
            <div><h4 className="font-bold mb-2 text-slate-800">Périmètre Exclu</h4><p className="text-sm bg-white p-3 rounded border border-slate-200 shadow-sm">{charter.perimetreExclu || 'N/A'}</p></div>
          </div>
        </div>
      )}

      {viewingDoc === 'backlog' && project.backlogFile && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-inner">
          <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200"><X size={20} /></button>
          <h3 className="font-bold text-xl mb-4 text-blue-800 flex items-center gap-2"><FileSpreadsheet size={24} /> Consultation du Backlog</h3>
          <div className="bg-white p-8 rounded-xl border border-slate-100 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4"><FileSpreadsheet size={40} /></div>
            <h4 className="font-bold text-slate-800 text-lg mb-1">{project.backlogFile}</h4>
            <p className="text-slate-500 text-sm mb-5">Le Backlog du projet contient toutes les spécifications fonctionnelles et techniques.</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm shadow-blue-200"><Download size={16} /> Télécharger</button>
          </div>
        </div>
      )}

      {viewingDoc === 'architecture' && project.architectureFile && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative shadow-inner">
          <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200"><X size={20} /></button>
          <h3 className="font-bold text-xl mb-4 text-indigo-800 flex items-center gap-2"><Box size={24} /> Consultation de l'Architecture Technique</h3>
          <div className="bg-white p-8 rounded-xl border border-slate-100 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4"><Box size={40} /></div>
            <h4 className="font-bold text-slate-800 text-lg mb-1">{project.architectureFile}</h4>
            <p className="text-slate-500 text-sm mb-5">Le document d'architecture technique détaille l'infrastructure, la modélisation des données et la sécurité.</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow-sm shadow-indigo-200"><Download size={16} /> Télécharger</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDocuments;
