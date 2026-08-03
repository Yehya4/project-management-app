import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useCharter, useAuth, useDemandes, useProjects } from '../../context/AppContext';
import {
  FileText, Flag, Activity, Users, Briefcase,
  CheckCircle, AlertTriangle, MessageSquare, Edit3,
  Info, Shield, Target, Download, Upload, Save, X,
  Gauge, Sliders, TrendingUp, CheckCircle2, Code2, PackageCheck, Rocket
} from 'lucide-react';
import mammoth from 'mammoth';
import { generateCharterPDF } from '../../utils/pdfGenerator';

// Config des phases de progression
const PHASE_PROGRESS_CONFIG = {
  'Développement': { min: 20, max: 80, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Développement' },
  'Testing':       { min: 80, max: 90, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Testing' },
  'Déploiement':   { min: 90, max: 100, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Déploiement' },
};

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

  const { updateProjectProgress } = useProjects();
  const charter = getCharterByDemandeId(project.demandeId);
  const demande = demandes.find(d => d.id === project.demandeId);
  const isPMOrAdmin = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';

  const phaseConfig = PHASE_PROGRESS_CONFIG[project.status] || null;
  const [sliderValue, setSliderValue] = React.useState(
    Math.min(
      phaseConfig?.max ?? 100,
      Math.max(phaseConfig?.min ?? 0, project.progress || 20)
    )
  );
  const [isSavingProgress, setIsSavingProgress] = React.useState(false);
  const [progressSaved, setProgressSaved] = React.useState(false);

  React.useEffect(() => {
    if (phaseConfig) {
      setSliderValue(Math.min(phaseConfig.max, Math.max(phaseConfig.min, project.progress || phaseConfig.min)));
    }
  }, [project.progress, project.status]);

  const handleProgressUpdate = async () => {
    if (!phaseConfig) return;
    setIsSavingProgress(true);
    try {
      await updateProjectProgress(project.id, sliderValue);
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 2500);
    } finally {
      setIsSavingProgress(false);
    }
  };

  const getProgressColor = (val) => {
    if (val <= 30) return '#6366f1';
    if (val <= 60) return '#8b5cf6';
    if (val <= 80) return '#3b82f6';
    if (val <= 90) return '#f59e0b';
    return '#10b981';
  };

  const [isEditingInfos, setIsEditingInfos] = React.useState(false);
  const [infosFormData, setInfosFormData] = React.useState({});

  React.useEffect(() => {
    if (charter) {
      setInfosFormData({
        categoriesProjet: charter.categoriesProjet || '',
        service: charter.service || '',
        dateFin: charter.dateFin ? new Date(charter.dateFin).toISOString().split('T')[0] : ''
      });
    }
  }, [charter, isEditingInfos]);

  const handleInfosChange = (e) => {
    setInfosFormData({ ...infosFormData, [e.target.name]: e.target.value });
  };

  const handleSaveInfos = async () => {
    const updatedCharter = { ...charter, ...infosFormData };
    await saveCharter(updatedCharter);
    setIsEditingInfos(false);
  };

  const fileInputRef = React.useRef(null);


  const handleExportPDF = async () => {
    if (!charter || !demande) return;
    try {
      await generateCharterPDF(charter, demande);
    } catch (error) {
      alert("Erreur lors de l'exportation PDF");
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Service" value={charter.service || demande?.service} />
              <Field 
                label="Date Fin Prévue" 
                value={charter.dateFin ? (typeof charter.dateFin === 'string' && charter.dateFin.includes('/') ? charter.dateFin : new Date(charter.dateFin).toLocaleDateString('fr-FR')) : (demande?.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-FR') : null)} 
              />
            </div>
            <Field 
              label="Catégories du Projet" 
              value={Array.isArray(charter.categoriesProjet) ? charter.categoriesProjet.join(', ') : charter.categoriesProjet || (Array.isArray(demande?.categoriesProjet) ? demande.categoriesProjet.join(', ') : demande?.categoriesProjet)} 
            />
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

      {/* ──────────────────────────────────────────────────────────────
          SECTION CONTRÔLE DE PROGRESSION (PM / Admin / Sponsor)
      ────────────────────────────────────────────────────────────── */}
      {isPMOrAdmin && (
        <div
          className="rounded-3xl p-6 shadow-sm border"
          style={{
            background: phaseConfig ? `linear-gradient(135deg, ${phaseConfig.bg} 0%, #fff 100%)` : '#f8fafc',
            borderColor: phaseConfig ? phaseConfig.border : '#e2e8f0',
          }}
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ background: phaseConfig ? phaseConfig.color + '20' : '#f1f5f9' }}>
              <Gauge size={22} style={{ color: phaseConfig ? phaseConfig.color : '#94a3b8' }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Contrôle de Progression
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: phaseConfig ? phaseConfig.color + '20' : '#f1f5f9', color: phaseConfig ? phaseConfig.color : '#94a3b8' }}
                >
                  {project.status}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {phaseConfig
                  ? `Ajustez la progression manuellement (${phaseConfig.min}% – ${phaseConfig.max}%). Le système calcule aussi automatiquement selon les tâches/tests.`
                  : `La progression est gérée automatiquement en phase ${project.status}.`
                }
              </p>
            </div>
          </div>

          {/* Barre de progression actuelle */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600">Progression actuelle</span>
              <span className="text-2xl font-black tabular-nums" style={{ color: getProgressColor(project.progress) }}>
                {project.progress}<span className="text-base text-slate-400 font-medium">%</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${project.progress}%`,
                  background: `linear-gradient(90deg, ${getProgressColor(project.progress)}, ${getProgressColor(project.progress)}cc)`,
                  boxShadow: `0 0 8px ${getProgressColor(project.progress)}55`,
                }}
              />
            </div>
            {/* Jalons */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
              <span>0%</span>
              <span className={project.progress >= 20 ? 'text-indigo-500 font-bold' : ''}>Initiation 20%</span>
              <span className={project.progress >= 80 ? 'text-purple-500 font-bold' : ''}>Dev 80%</span>
              <span className={project.progress >= 90 ? 'text-blue-500 font-bold' : ''}>Test 90%</span>
              <span className={project.progress >= 100 ? 'text-emerald-500 font-bold' : ''}>100%</span>
            </div>
          </div>

          {/* Slider de contrôle manuel */}
          {phaseConfig ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={16} style={{ color: phaseConfig.color }} />
                  <span className="text-sm font-bold text-slate-700">Ajustement manuel</span>
                </div>
                <span
                  className="text-sm font-black tabular-nums px-3 py-1 rounded-full"
                  style={{ background: phaseConfig.color + '15', color: phaseConfig.color }}
                >
                  {sliderValue}%
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type="range"
                  min={phaseConfig.min}
                  max={phaseConfig.max}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full outline-none cursor-pointer"
                  style={{
                    accentColor: phaseConfig.color,
                    background: `linear-gradient(to right, ${phaseConfig.color} 0%, ${phaseConfig.color} ${((sliderValue - phaseConfig.min) / (phaseConfig.max - phaseConfig.min)) * 100}%, #e2e8f0 ${((sliderValue - phaseConfig.min) / (phaseConfig.max - phaseConfig.min)) * 100}%, #e2e8f0 100%)`
                  }}
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span className="font-semibold" style={{ color: phaseConfig.color }}>{phaseConfig.min}%</span>
                  <span className="font-semibold" style={{ color: phaseConfig.color }}>{phaseConfig.max}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                <Info size={12} className="text-blue-400 shrink-0" />
                La valeur affichée = max(votre saisie, calcul automatique système). Elle ne peut jamais descendre en dessous du calcul système.
              </p>

              <button
                onClick={handleProgressUpdate}
                disabled={isSavingProgress}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: phaseConfig.color, color: '#fff' }}
              >
                {isSavingProgress ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Mise à jour…</>
                ) : progressSaved ? (
                  <><CheckCircle2 size={18} /> Progression mise à jour !</>
                ) : (
                  <><TrendingUp size={18} /> Mettre à jour la progression ({sliderValue}%)</>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              {project.status === 'Initiation' && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Rocket size={18} />
                  <p className="text-sm font-semibold">Phase Initiation — Progression fixe à 15% (automatique)</p>
                </div>
              )}
              {project.status === 'Utilisation' && (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 size={18} />
                  <p className="text-sm font-semibold">Projet terminé — Progression à 100%</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {renderCharterContent()}

      {}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 px-8 py-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Info size={28} className="text-teal-300" />
              Informations Complémentaires
            </h2>
            <p className="text-teal-100 mt-2">Détails complétés lors de la charte de projet.</p>
          </div>
          {isPMOrAdmin && charter && !isEditingInfos && (
            <button 
              onClick={() => setIsEditingInfos(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors border border-white/20 text-sm"
            >
              <Edit3 size={16} /> Modifier
            </button>
          )}
          {isEditingInfos && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditingInfos(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors border border-white/20 text-sm"
              >
                <X size={16} /> Annuler
              </button>
              <button 
                onClick={handleSaveInfos}
                className="flex items-center gap-2 px-4 py-2 bg-teal-400 text-teal-950 rounded-xl font-bold hover:bg-teal-300 transition-colors shadow-sm text-sm"
              >
                <Save size={16} /> Enregistrer
              </button>
            </div>
          )}
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {isEditingInfos ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Catégories du Projet</label>
                <input type="text" name="categoriesProjet" value={infosFormData.categoriesProjet} onChange={handleInfosChange} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-slate-50" placeholder="Ex: Technique, Métier..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Service</label>
                <input type="text" name="service" value={infosFormData.service} onChange={handleInfosChange} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-slate-50" placeholder="Ex: IT, RH, Finance..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Date Fin Prévue</label>
                <input type="date" name="dateFin" value={infosFormData.dateFin} onChange={handleInfosChange} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-slate-50" />
              </div>
            </>
          ) : (
            <>
              <Field label="Catégories du Projet" value={charter?.categoriesProjet || '-'} />
              <Field label="Service" value={charter?.service || '-'} />
              <Field label="Date Fin Prévue" value={charter?.dateFin ? new Date(charter.dateFin).toLocaleDateString('fr-FR') : '-'} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCharterView;
