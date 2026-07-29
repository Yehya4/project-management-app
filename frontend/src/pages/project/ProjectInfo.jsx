import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useCharter, useAuth, useProjects } from '../../context/AppContext';
import {
  FileText, Target, Info, CheckCircle, Edit3, Save, X,
  AlertTriangle, ListX, TrendingUp, Gauge, Sliders, CheckCircle2,
  Rocket, Code2, Activity, PackageCheck
} from 'lucide-react';

// Config des phases de progression
const PHASE_PROGRESS_CONFIG = {
  'Développement': { min: 20, max: 80, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Développement', icon: Code2 },
  'Testing':       { min: 80, max: 90, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Testing',       icon: Activity },
  'Déploiement':   { min: 90, max: 100, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Déploiement', icon: PackageCheck },
};

const ProjectInfo = () => {
  const { project } = useOutletContext();
  const { getCharterByDemandeId, saveCharter } = useCharter();
  const { updateProjectProgress } = useProjects();
  const { user } = useAuth();
  
  const charter = getCharterByDemandeId(project.demandeId);
  
  const isEditable = user && ['Project Manager', 'Sponsor', 'Admin'].includes(user.role);
  const canControlProgress = user && ['Project Manager', 'Sponsor', 'Admin'].includes(user.role);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [sliderValue, setSliderValue] = useState(project.progress || 20);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  const phaseConfig = PHASE_PROGRESS_CONFIG[project.status] || null;

  useEffect(() => {
    if (charter) {
      setFormData({
        contexte: charter.contexte || '',
        objectifs: charter.objectifs || '',
        criteresSucces: charter.criteresSucces || '',
        perimetreInclus: charter.perimetreInclus || '',
        perimetreExclu: charter.perimetreExclu || '',
        risques: charter.risques || ''
      });
    }
  }, [charter, isEditing]);

  useEffect(() => {
    if (phaseConfig) {
      setSliderValue(Math.min(phaseConfig.max, Math.max(phaseConfig.min, project.progress || phaseConfig.min)));
    }
  }, [project.progress, project.status]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const updatedCharter = { ...charter, ...formData };
    await saveCharter(updatedCharter);
    setIsEditing(false);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fiche de Projet</h2>
          <p className="text-slate-500">Informations générales, objectifs et compléments.</p>
        </div>
        {charter && isEditable && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
          >
            <Edit3 size={16} /> Modifier les informations
          </button>
        )}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
            >
              <X size={16} /> Annuler
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm"
            >
              <Save size={16} /> Enregistrer
            </button>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────
          SECTION CONTRÔLE DE PROGRESSION (PM / Admin / Sponsor)
      ────────────────────────────────────────────────────────────── */}
      {canControlProgress && (
        <div
          className="rounded-3xl p-6 shadow-sm border"
          style={{
            background: phaseConfig ? `linear-gradient(135deg, ${phaseConfig.bg} 0%, #fff 100%)` : '#f8fafc',
            borderColor: phaseConfig ? phaseConfig.border : '#e2e8f0',
          }}
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: phaseConfig ? phaseConfig.color + '20' : '#f1f5f9' }}
            >
              <Gauge size={22} style={{ color: phaseConfig ? phaseConfig.color : '#94a3b8' }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                Contrôle de Progression
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: phaseConfig ? phaseConfig.color + '20' : '#f1f5f9',
                    color: phaseConfig ? phaseConfig.color : '#94a3b8',
                  }}
                >
                  {project.status}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {phaseConfig
                  ? `Ajustez la progression manuellement (${phaseConfig.min}% – ${phaseConfig.max}%). La valeur système est prise en compte automatiquement.`
                  : `La progression est gérée automatiquement en phase ${project.status}.`
                }
              </p>
            </div>
          </div>

          {/* Progression actuelle (affichage) */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600">Progression actuelle</span>
              <span
                className="text-2xl font-black tabular-nums"
                style={{ color: getProgressColor(project.progress) }}
              >
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

              {/* Slider */}
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

              {/* Info */}
              <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                <Info size={12} className="text-blue-400 shrink-0" />
                La progression affichée est le maximum entre votre saisie et le calcul automatique du système (tâches/tests complétés).
              </p>

              {/* Bouton Mettre à jour */}
              <button
                onClick={handleProgressUpdate}
                disabled={isSavingProgress}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: phaseConfig.color, color: '#fff' }}
              >
                {isSavingProgress ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Mise à jour…
                  </>
                ) : progressSaved ? (
                  <>
                    <CheckCircle2 size={18} /> Progression mise à jour !
                  </>
                ) : (
                  <>
                    <TrendingUp size={18} /> Mettre à jour la progression ({sliderValue}%)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Phases sans contrôle manuel */
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              {project.status === 'Initiation' && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Rocket size={18} />
                  <p className="text-sm font-semibold">Phase d'Initiation — Progression fixe à 20% (gérée par le système)</p>
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

      {!charter ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
          <Info size={32} className="text-amber-500" />
          <div>
            <h3 className="font-bold text-lg mb-1">Aucune Charte de Projet</h3>
            <p className="text-sm">La fiche de projet s'appuie sur le Project Charter, qui n'est pas encore créé.</p>
          </div>
          {isEditable && (
            <Link
              to={`/project-charter?demandeId=${project.demandeId}`}
              className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <Edit3 size={16} /> Créer la Charte
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Contexte</h3>
              </div>
              {isEditing ? (
                <textarea name="contexte" value={formData.contexte} onChange={handleChange} rows="4" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Décrivez le contexte..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.contexte || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-lg">Objectifs</h3>
              </div>
              {isEditing ? (
                <textarea name="objectifs" value={formData.objectifs} onChange={handleChange} rows="4" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Définissez les objectifs..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.objectifs || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-purple-600" />
                <h3 className="font-bold text-slate-800 text-lg">Critères de Succès</h3>
              </div>
              {isEditing ? (
                <textarea name="criteresSucces" value={formData.criteresSucces} onChange={handleChange} rows="3" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Critères de succès..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.criteresSucces || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-800 text-lg">Périmètre Inclus</h3>
              </div>
              {isEditing ? (
                <textarea name="perimetreInclus" value={formData.perimetreInclus} onChange={handleChange} rows="3" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Ce qui est inclus..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.perimetreInclus || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListX size={20} className="text-rose-500" />
                <h3 className="font-bold text-slate-800 text-lg">Hors Périmètre (Exclu)</h3>
              </div>
              {isEditing ? (
                <textarea name="perimetreExclu" value={formData.perimetreExclu} onChange={handleChange} rows="3" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Ce qui est exclu..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.perimetreExclu || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} className="text-orange-500" />
                <h3 className="font-bold text-slate-800 text-lg">Risques Identifiés</h3>
              </div>
              {isEditing ? (
                <textarea name="risques" value={formData.risques} onChange={handleChange} rows="3" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50" placeholder="Risques potentiels..."></textarea>
              ) : (
                <p className="text-slate-600 whitespace-pre-wrap">{charter.risques || <span className="text-slate-400 italic">Non défini</span>}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInfo;
