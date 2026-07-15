import React from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
  Activity, Target, AlertCircle, FileText,
  Rocket, Code2, PackageCheck, Server, Users2,
  Clock, Zap, CheckCircle2, ChevronRight, Lock,
  CheckCheck, ArrowRight, User, Shield, Briefcase,
  Upload, ClipboardList, Box, FileSpreadsheet,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useCharter, useDemandes, useProjects, useAuth, useTasks } from '../../context/AppContext';

/* ─────────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────────── */

const LIFECYCLE = ['Initiation', 'Développement', 'Testing', 'Déploiement', 'Utilisation'];

const PHASES = [
  { id: 'Initiation',    label: 'Initiation',    icon: Rocket,      color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { id: 'Développement', label: 'Développement', icon: Code2,       color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'Testing',       label: 'Testing',       icon: Activity,    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'Déploiement',     label: 'Déploiement',     icon: PackageCheck, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'Utilisation',   label: 'Utilisation',   icon: Users2,      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
];

const mapStatus = (s) => {
  if (['Atelier de Cadrage'].includes(s)) return 'Initiation';
  if (['In Progress', 'En cours'].includes(s)) return 'Développement';
  if (['Fait'].includes(s)) return 'Testing';
  if (['Clôture', 'Clôturée'].includes(s)) return 'Déploiement';
  if (['Archive', 'Archivée'].includes(s)) return 'Utilisation';
  return s;
};

/* ─────────────────────────────────────────────────────────────────
   Sub-steps for Initiation phase
───────────────────────────────────────────────────────────────── */

const getInitiationSubSteps = (charter, project) => {
  const charterValidated = charter?.statut === 'Validé';
  const atelierValidated = project.atelierCadrage === 'Validé';
  const backlogValidated = project.backlogStatus === 'Validé';
  const archValidated    = project.architectureStatus === 'Validé';

  const charterSentUser = charter?.statut === 'Envoyé au Demandeur';
  const charterSentSponsor = charter?.statut === 'Soumis au Sponsor';

  return [
    {
      key: 'charter-create',
      label: 'PM crée le Project Charter',
      icon: FileText,
      actor: 'PM',
      done: !!charter,
      active: !charter,
    },
    {
      key: 'charter-user',
      label: 'Demandeur accepte la charte',
      icon: User,
      actor: 'Demandeur',
      done: charterSentSponsor || charterValidated,
      active: charterSentUser,
      locked: !charter || charterSentSponsor || charterValidated,
    },
    {
      key: 'charter-sponsor',
      label: 'Sponsor valide la charte',
      icon: Shield,
      actor: 'Sponsor',
      done: charterValidated,
      active: charterSentSponsor,
      locked: !charterSentSponsor && !charterValidated,
    },
    {
      key: 'atelier',
      label: 'PM valide l\'Atelier de Cadrage',
      icon: ClipboardList,
      actor: 'PM',
      done: atelierValidated,
      active: charterValidated && !atelierValidated,
      locked: !charterValidated,
    },
    {
      key: 'backlog',
      label: 'PM importe le Backlog → Sponsor valide',
      icon: FileSpreadsheet,
      actor: 'PM / Sponsor',
      done: backlogValidated,
      active: atelierValidated && !backlogValidated,
      locked: !atelierValidated,
    },
    {
      key: 'arch',
      label: 'PM importe l\'Architecture → Sponsor valide',
      icon: Box,
      actor: 'PM / Sponsor',
      done: archValidated,
      active: backlogValidated && !archValidated,
      locked: !backlogValidated,
    },
  ];
};

const getPhaseSubSteps = (phaseId, project, charter, currentIdx) => {
  const isPast = LIFECYCLE.indexOf(phaseId) < currentIdx;
  const isCurrent = LIFECYCLE.indexOf(phaseId) === currentIdx;

  if (phaseId === 'Initiation') {
    return getInitiationSubSteps(charter, project);
  }

  const createStep = (key, label, icon, actor, order) => {
    let done = isPast;
    let active = false;
    let locked = false;

    if (isCurrent) {
      if (order === 1) {
        done = project.progress >= 20;
        active = project.progress < 20;
      } else if (order === 2) {
        done = project.progress >= 60;
        active = project.progress >= 20 && project.progress < 60;
        locked = project.progress < 20;
      } else {
        done = project.progress >= 90;
        active = project.progress >= 60 && project.progress < 90;
        locked = project.progress < 60;
      }
    } else if (!isPast) {
      locked = true;
    }
    return { key, label, icon, actor, done, active, locked };
  };

  switch(phaseId) {
    case 'Développement':
      return [
        createStep('dev-1', 'Affectation des ressources', Users2, 'PM', 1),
        createStep('dev-2', 'Sprint Planning', Clock, 'Équipe', 2),
        createStep('dev-3', 'Développement des tâches', Code2, 'Développeurs', 3),
      ];
    case 'Testing':
      return [
        createStep('test-1', 'Création du plan de tests', FileText, 'QA', 1),
        createStep('test-2', 'Exécution des tests', Activity, 'QA', 2),
        createStep('test-3', 'Validation des tests', CheckCheck, 'Chef Testeur', 3),
      ];
    case 'Déploiement':
      return [
        createStep('dep-1', 'Préparation de l\'environnement', Server, 'DevOps', 1),
        createStep('dep-2', 'Déploiement en production', Rocket, 'DevOps', 2),
        createStep('dep-3', 'Signature du PV de recette', FileText, 'Sponsor', 3),
      ];
    case 'Utilisation':
      return [
        createStep('use-1', 'Suivi post-déploiement', Activity, 'Support', 1),
        createStep('use-2', 'Clôture du projet', Briefcase, 'PM', 2),
      ];
    default:
      return [];
  }
};

/* ─────────────────────────────────────────────────────────────────
   PHASE STEP (horizontal stepper)
───────────────────────────────────────────────────────────────── */

const PhaseStep = ({ phase, state, isLast }) => {
  const Icon = phase.icon;
  const isDone    = state === 'done';
  const isActive  = state === 'active';
  const isPending = state === 'pending';

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col items-center gap-2 flex-shrink-0 w-24">
        {/* Circle */}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500"
          style={{
            background:    isDone ? phase.color : isActive ? '#fff' : '#f8fafc',
            borderColor:   isDone ? phase.color : isActive ? phase.color : '#e2e8f0',
            color:         isDone ? '#fff'       : isActive ? phase.color : '#94a3b8',
            boxShadow:     isActive ? `0 0 0 4px ${phase.bg}, 0 4px 12px ${phase.color}33` : isDone ? `0 2px 8px ${phase.color}44` : 'none',
          }}
        >
          {isDone ? <CheckCircle2 size={22} /> : <Icon size={20} />}
          {isActive && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white animate-pulse"
              style={{ background: phase.color }}
            />
          )}
        </div>

        {/* Label */}
        <span
          className="text-xs font-bold text-center leading-tight whitespace-nowrap"
          style={{ color: isDone || isActive ? phase.color : '#94a3b8' }}
        >
          {phase.label}
        </span>

        {/* Sub-label */}
        {isDone && (
          <span className="text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
            Terminé ✓
          </span>
        )}
        {isActive && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border"
            style={{ color: phase.color, background: phase.bg, borderColor: phase.border }}
          >
            En cours
          </span>
        )}
        {isPending && (
          <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
            À venir
          </span>
        )}
      </div>

      {/* Connector */}
      {!isLast && (
        <div
          className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-700"
          style={{ background: isDone ? phase.color : '#e2e8f0' }}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   INITIATION SUB-STEP ROW
───────────────────────────────────────────────────────────────── */

const SubStepRow = ({ step, isLast }) => {
  const Icon = step.icon;
  return (
    <div className="flex items-stretch gap-3">
      {/* Left icon + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all"
          style={{
            background: step.done ? '#10b981' : step.active ? '#6366f1' : '#f1f5f9',
            color:      step.done || step.active ? '#fff' : '#94a3b8',
            boxShadow:  step.active ? '0 0 0 3px #e0e7ff' : 'none',
          }}
        >
          {step.done ? <CheckCircle2 size={14} /> : step.locked ? <Lock size={12} /> : <Icon size={14} />}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1"
            style={{ background: step.done ? '#10b981' : '#e2e8f0' }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 transition-opacity ${step.locked ? 'opacity-40' : ''}`}>
        <div className="flex items-center justify-between">
          <p
            className="text-sm font-semibold"
            style={{ color: step.done ? '#059669' : step.active ? '#4338ca' : '#94a3b8' }}
          >
            {step.label}
          </p>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: step.done ? '#dcfce7' : step.active ? '#e0e7ff' : '#f1f5f9',
              color:      step.done ? '#059669' : step.active ? '#4338ca' : '#9ca3af',
            }}
          >
            {step.done ? 'Terminé' : step.active ? 'En cours' : 'À venir'}
          </span>
        </div>
        {step.active && (
          <p className="text-xs text-indigo-500 font-medium mt-0.5 flex items-center gap-1">
            <Zap size={10} /> Action requise
          </p>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */

const ProjectOverview = () => {
  const [expandedPhase, setExpandedPhase] = React.useState('Initiation');
  const { project, isPending } = useOutletContext();
  const { getCharterByDemandeId } = useCharter();
  const { demandes, updateDemandeStatus } = useDemandes();
  const { addProject, updateProject } = useProjects();
  const { getTasksByProjectId } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();

  const charter           = getCharterByDemandeId(project.demandeId);
  const isPM              = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isCharterValidated = charter?.statut === 'Validé';
  const projectTasks      = getTasksByProjectId(project.id);
  const doneTasksCount    = projectTasks.filter(t => ['Fait', 'Clôture', 'Clôturée', 'Archive', 'Archivée'].includes(t.status)).length;
  const pendingTasksCount = projectTasks.filter(t => t.status === 'En cours').length;

  /* Phase state */
  const normalized = mapStatus(project.status);
  const currentIdx = LIFECYCLE.indexOf(normalized);

  const getPhaseState = (phase) => {
    const idx = LIFECYCLE.indexOf(phase.id);
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  const currentPhase = PHASES.find(p => p.id === normalized) || PHASES[0];

  /* Initiation sub-steps */
  const initiationSubSteps = getInitiationSubSteps(charter, project);
  const isInitiation = normalized === 'Initiation';

  /* Progression bar */
  const phaseProgress = Math.round((currentIdx / (LIFECYCLE.length - 1)) * 100);
  const taskProgress  = projectTasks.length > 0 ? Math.round((doneTasksCount / projectTasks.length) * 100) : 0;

  /* Pending Actions logic */
  const pendingActions = [];
  const isStrictPM = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsorRole = user?.role === 'Sponsor' || user?.role === 'Admin';
  
  const originalDemande = project.originalDemande || demandes.find(d => d.id === project.demandeId);
  const _fn = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
  const _fnAlt = `${user?.nom || ''} ${user?.prenom || ''}`.trim();
  const isDemandeur = originalDemande && (
    originalDemande.nomDemandeur === _fn ||
    originalDemande.nomDemandeur === _fnAlt
  );

  if (!charter && isStrictPM) {
    pendingActions.push({ label: 'Créer la Charte de Projet', icon: FileText, link: `/project-charter?demandeId=${project.demandeId}`, color: 'bg-indigo-600 text-white' });
  }
  if (charter?.statut === 'Envoyé au Demandeur' && isDemandeur) {
    pendingActions.push({ label: 'Accepter la Charte (Demandeur)', icon: CheckCircle2, link: `/project-charter?demandeId=${project.demandeId}`, color: 'bg-blue-600 text-white' });
  }
  if (charter?.statut === 'Soumis au Sponsor' && isSponsorRole) {
    pendingActions.push({ label: 'Valider la Charte (Sponsor)', icon: CheckCircle2, link: `/project-charter?demandeId=${project.demandeId}`, color: 'bg-emerald-600 text-white' });
  }
  if (charter?.statut === 'Validé' && project.atelierCadrage !== 'Validé' && isStrictPM) {
    pendingActions.push({ label: "Valider l'Atelier de Cadrage", icon: CheckCircle2, link: `/projects/${project.id}/documents`, color: 'bg-purple-600 text-white' });
  }
  if (project.atelierCadrage === 'Validé' && !project.backlogFile && isStrictPM) {
    pendingActions.push({ label: "Importer le Backlog", icon: Upload, link: `/projects/${project.id}/documents`, color: 'bg-indigo-600 text-white' });
  }
  if (project.backlogStatus === 'Soumis' && isSponsorRole) {
    pendingActions.push({ label: "Valider le Backlog", icon: CheckCircle2, link: `/projects/${project.id}/documents`, color: 'bg-emerald-600 text-white' });
  }
  if (project.backlogStatus === 'Validé' && !project.architectureFile && isStrictPM) {
    pendingActions.push({ label: "Importer l'Architecture", icon: Upload, link: `/projects/${project.id}/documents`, color: 'bg-indigo-600 text-white' });
  }
  if (project.architectureStatus === 'Soumis' && isSponsorRole) {
    pendingActions.push({ label: "Valider l'Architecture", icon: CheckCircle2, link: `/projects/${project.id}/documents`, color: 'bg-emerald-600 text-white' });
  }

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h2>
          <p className="text-slate-500 mt-1">Suivi en temps réel de l'avancement du projet.</p>
        </div>
        {isPending && isPM && (
          <Link
            to={`/project-charter?demandeId=${project.demandeId}`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm"
          >
            <FileText size={16} />
            {charter ? 'Voir / Éditer Charter' : 'Créer le Charter'}
          </Link>
        )}
      </div>

      {/* ── Pending Actions Panel (Dynamic based on Role & Status) ── */}
      {pendingActions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-amber-800 font-bold text-lg mb-4 flex items-center gap-2">
              <Zap size={20} className="text-amber-600" />
              Actions requises pour vous
            </h3>
            <div className="flex flex-wrap gap-4">
              {pendingActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.link}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all ${action.color}`}
                >
                  <action.icon size={18} />
                  {action.label} <ArrowRight size={16} className="ml-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Phase stepper ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header bar */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ background: currentPhase.bg, borderColor: currentPhase.border }}
        >
          <div className="flex items-center gap-2.5">
            <Zap size={18} style={{ color: currentPhase.color }} />
            <h3
              className="font-bold text-sm uppercase tracking-wider"
              style={{ color: currentPhase.color }}
            >
              Phase actuelle
            </h3>
            <span
              className="px-3 py-0.5 rounded-full text-xs font-black text-white"
              style={{ background: currentPhase.color }}
            >
              {currentPhase.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: currentPhase.color }}
            />
            <span className="text-xs font-bold" style={{ color: currentPhase.color }}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-8">
          <div className="flex items-start">
            {PHASES.map((phase, i) => (
              <PhaseStep
                key={phase.id}
                phase={phase}
                state={getPhaseState(phase)}
                isLast={i === PHASES.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Phase progress bar */}
        <div className="px-6 pb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Progression globale du cycle</span>
            <span className="text-xs font-bold text-slate-700">{phaseProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${phaseProgress}%`, background: currentPhase.color }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Progression projet */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20} /></div>
            <h3 className="font-semibold text-slate-700">Progression</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">
            {project.progress}<span className="text-xl text-slate-400">%</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>



        {/* Tâches */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><AlertCircle size={20} /></div>
            <h3 className="font-semibold text-slate-700">Tâches</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">
            {doneTasksCount}<span className="text-xl font-normal text-slate-400">/{projectTasks.length}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {pendingTasksCount} tâche{pendingTasksCount > 1 ? 's' : ''} en cours
          </p>
          {projectTasks.length > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Initiation sub-steps ─────────────────────────── */}
      {isInitiation && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/50 flex items-center gap-3">
            <Rocket size={18} className="text-indigo-600" />
            <h3 className="font-bold text-indigo-800">Étapes de la phase d'Initiation</h3>
            <span className="ml-auto text-xs font-semibold text-indigo-500">
              {initiationSubSteps.filter(s => s.done).length}/{initiationSubSteps.length} complètes
            </span>
          </div>
          <div className="p-5">
            {initiationSubSteps.map((step, i) => (
              <SubStepRow
                key={step.key}
                step={step}
                isLast={i === initiationSubSteps.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Info section ─────────────────────────────────── */}
      <div className={`grid gap-6 ${isPending ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={`${isPending ? 'lg:col-span-2' : ''} space-y-5`}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-600" /> Description du projet
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {project.description || 'Aucune description fournie pour ce projet.'}
            </p>
          </div>


        </div>

        {isPending && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <FileText size={16} className="text-blue-600" /> Statut Charte Projet
              </h3>
              {charter ? (
                <>
                  <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                    style={{
                      background: isCharterValidated ? '#dcfce7' : '#fef3c7',
                      color:      isCharterValidated ? '#059669'  : '#d97706',
                    }}
                  >
                    {charter.statut}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isCharterValidated
                      ? 'Charte validée. En attente des étapes suivantes.'
                      : 'Charte en cours de validation.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 mb-2">
                    À créer
                  </div>
                  <p className="text-xs text-slate-500">Le PM doit rédiger la charte du projet.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
