import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useCharter, useAuth, useDemandes } from '../../context/AppContext';
import {
  FileText, Flag, Activity, Users, Briefcase,
  CheckCircle, AlertTriangle, MessageSquare, Edit3,
  Info, Shield, Target, Download, Upload
} from 'lucide-react';
import mammoth from 'mammoth';
import { generateCharterPDF } from '../../utils/pdfGenerator';

const Section = ({ icon, color, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
      {value || <span className="italic text-slate-400">Non renseigné</span>}
    </p>
  </div>
);

const StatusBadge = ({ statut }) => {
  const colors = {
    'Validé': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Brouillon': 'bg-slate-100 text-slate-600 border-slate-200',
    'Envoyé au Demandeur': 'bg-blue-100 text-blue-700 border-blue-200',
    'Soumis au Sponsor': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Retourné par le Demandeur': 'bg-orange-100 text-orange-700 border-orange-200',
    'Retourné par le Sponsor': 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const cls = colors[statut] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cls}`}>
      {statut === 'Validé' ? '✓ Validé — Accepté par Demandeur & Sponsor' : statut}
    </span>
  );
};

const ProjectCharterView = () => {
  const { project } = useOutletContext();
  const { getCharterByDemandeId, saveCharter } = useCharter();
  const { demandes } = useDemandes();
  const { user } = useAuth();

  const charter = getCharterByDemandeId(project.demandeId);
  const demande = demandes.find(d => d.id === project.demandeId);
  const isPMOrAdmin = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';

  const fileInputRef = React.useRef(null);


  const handleExportPDF = async () => {
    if (!charter || !demande) return;
    try {
      await generateCharterPDF(charter, demande);
    } catch (error) {
      alert("Erreur lors de l'exportation PDF");
    }
  };

  const handleImportWord = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        const extractField = (prefix) => {
          const regex = new RegExp(`${prefix}\\s*:\\s*(.*)`, 'i');
          const match = text.match(regex);
          return match ? match[1].trim() : '';
        };

        const importedCharter = {
          demandeId: project.demandeId,
          titre: extractField('Titre du Projet'),
          contexte: extractField('Contexte'),
          objectifs: extractField('Objectifs du Projet'),
          perimetreInclus: extractField('Inclus dans le périmètre'),
          perimetreExclu: extractField('Hors périmètre'),
          equipeIT: extractField('Équipe IT'),
          equipeMetier: extractField('Équipe Métier'),
          utilisateursFinaux: extractField('Utilisateurs Finaux'),
          planCom: extractField('Plan de Communication'),
          risques: extractField('Risques Identifiés'),
          criteresSucces: extractField('Critères de Succès'),
          statut: 'Brouillon',
          lastUpdated: new Date().toISOString()
        };
        
        await saveCharter(importedCharter);
        alert('Project Charter importé avec succès.');
      } catch (err) {
        alert('Erreur lors de l\'importation du fichier Word.');
      }
      e.target.value = null;
    };
    reader.readAsArrayBuffer(file);
  };

  const renderCharterContent = () => {
    if (!charter) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Fiche de Projet — Project Charter</h2>
            <p className="text-slate-500 mt-1">Document de cadrage officiel du projet.</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 bg-amber-100 rounded-2xl">
              <FileText size={32} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Aucune Charte de Projet disponible</h3>
              <p className="text-sm text-amber-700">
                La charte de projet n'a pas encore été créée ou n'est pas encore validée pour ce projet.
              </p>
            </div>
            {isPMOrAdmin && project.demandeId && (
              <div className="flex flex-col gap-3 mt-2">
                <Link
                  to={`/project-charter?demandeId=${project.demandeId}`}
                  className="flex justify-center items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  <Edit3 size={16} /> Créer la Charte manuellement
                </Link>
                <div className="flex gap-2 justify-center">
                  <input 
                    type="file" 
                    accept=".docx" 
                    ref={fileInputRef} 
                    onChange={handleImportWord} 
                    className="hidden" 
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl font-semibold transition-all shadow-sm"
                  >
                    <Upload size={16} /> Importer depuis Word
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} /> Project Charter
              </span>
              <StatusBadge statut={charter.statut} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Fiche de Projet</h2>
            <p className="text-slate-500 mt-1">
              {charter.titre || project.nom}
            </p>
          </div>
          {isPMOrAdmin && project.demandeId && (
            <div className="flex items-center gap-2">
              {charter.statut !== 'Validé' && (
                <>
                  <input 
                    type="file" 
                    accept=".docx" 
                    ref={fileInputRef} 
                    onChange={handleImportWord} 
                    className="hidden" 
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm shrink-0"
                    title="Importer depuis Word"
                  >
                    <Upload size={16} /> <span className="hidden md:inline">Importer</span>
                  </button>
                </>
              )}

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm shrink-0"
                title="Exporter en PDF"
              >
                <Download size={16} /> <span className="hidden md:inline">PDF</span>
              </button>
              {charter.statut !== 'Validé' && (
                <Link
                  to={`/project-charter?demandeId=${project.demandeId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-sm shrink-0"
                >
                  <Edit3 size={16} /> Éditer la Charte
                </Link>
              )}
            </div>
          )}
        </div>

        { }
        {charter.lastUpdated && (
          <p className="text-xs text-slate-400">
            Dernière mise à jour : {new Date(charter.lastUpdated).toLocaleString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}

        { }
        <Section
          icon={<Flag size={16} className="text-blue-600" />}
          color="bg-blue-100"
          title="1. Informations Générales"
        >
          <div className="space-y-5">
            <Field label="Titre du Projet" value={charter.titre} />
            <Field label="Contexte" value={charter.contexte} />
            <Field label="Objectifs du Projet" value={charter.objectifs} />
          </div>
        </Section>

        { }
        <Section
          icon={<Activity size={16} className="text-emerald-600" />}
          color="bg-emerald-100"
          title="2. Périmètre du Projet (Scope)"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} /> Inclus dans le périmètre
              </p>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {charter.perimetreInclus || <span className="italic text-slate-400">Non renseigné</span>}
              </p>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Hors périmètre
              </p>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {charter.perimetreExclu || <span className="italic text-slate-400">Non renseigné</span>}
              </p>
            </div>
          </div>
        </Section>

        { }
        <Section
          icon={<Users size={16} className="text-purple-600" />}
          color="bg-purple-100"
          title="3. Parties Prenantes"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            { }
            <div>
              <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <Shield size={15} className="text-blue-500" /> Équipe IT
              </h4>
              <div className="space-y-4">
                <Field label="Sponsor" value={charter.equipeITSponsor} />
                <Field label="Chef de Projet" value={charter.equipeITChef} />
                <Field label="Développement" value={charter.equipeITDev} />
                <Field label="Test" value={charter.equipeITTest} />
              </div>
            </div>
            { }
            <div>
              <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                <Briefcase size={15} className="text-indigo-500" /> Équipe Métier
              </h4>
              <div className="space-y-4">
                <Field label="Sponsor" value={charter.equipeMetierSponsor} />
                <Field label="Chef de Projet" value={charter.equipeMetierChef} />
                <Field label="Équipe" value={charter.equipeMetierEquipe} />
                <div className="pt-2 border-t border-slate-100">
                  <Field label="Utilisateurs Finaux" value={charter.utilisateursFinaux} />
                </div>
              </div>
            </div>
          </div>
        </Section>

        { }
        <Section
          icon={<Briefcase size={16} className="text-amber-600" />}
          color="bg-amber-100"
          title="4. Gouvernance & Déroulement"
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} className="text-blue-500" /> Plan de Communication
              </p>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {charter.planCom || <span className="italic text-slate-400">Non renseigné</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-orange-500" /> Risques Identifiés
              </p>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {charter.risques || <span className="italic text-slate-400">Non renseigné</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target size={12} className="text-emerald-500" /> Critères de Succès
              </p>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {charter.criteresSucces || <span className="italic text-slate-400">Non renseigné</span>}
              </p>
            </div>
          </div>
        </Section>



        { }
        {charter.commentaires && charter.commentaires.length > 0 && (
          <Section
            icon={<MessageSquare size={16} className="text-blue-600" />}
            color="bg-blue-100"
            title={`5. Commentaires & Échanges (${charter.commentaires.length})`}
          >
            <div className="space-y-3">
              {charter.commentaires.map((comment, index) => (
                <div key={index} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                        {(comment.auteur || 'U').charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm">{comment.auteur}</span>
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
                          {comment.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(comment.date).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap pl-9">{comment.texte}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        { }
        {charter.statut === 'Validé' && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 text-base">Charte officiellement validée</h4>
              <p className="text-sm text-emerald-700 mt-0.5">
                Ce document a été accepté par le Demandeur et validé par le Sponsor du projet.
                {charter.lastUpdated && ` — ${new Date(charter.lastUpdated).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Contenu Project Charter */}
      {renderCharterContent()}

      {/* Informations Complémentaires Indépendantes (En bas) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Info size={28} className="text-teal-300" />
            Informations Complémentaires
          </h2>
          <p className="text-teal-100 mt-2">Détails complétés lors de la charte de projet.</p>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Field label="Catégories du Projet" value={charter?.categoriesProjet || '-'} />
          <Field label="Service" value={charter?.service || '-'} />
          <Field label="Date Fin Prévue" value={charter?.dateFin ? new Date(charter.dateFin).toLocaleDateString('fr-FR') : '-'} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCharterView;
