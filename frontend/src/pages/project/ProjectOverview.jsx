import React from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
  Activity, Target, AlertCircle, FileText, PlayCircle,
  Rocket, Code2, PackageCheck, Server, Users2, CheckCircle2,
  Clock, Zap
} from 'lucide-react';
import { useCharter, useDemandes, useProjects, useAuth, useTasks } from '../../context/AppContext';




const STATUS_ORDER = [
  'Initiation', 'Développement', 'Testing', 'Livraison', 'Utilisation'
];

const PHASES = [
  {
    id: 'initiation',
    label: 'Initiation',
    icon: Rocket,
    color: 'blue',
    statuses: ['Initiation'],
    subLabels: { 'Initiation': '📋 Cadrage et initialisation du projet' },
  },
  {
    id: 'developpement',
    label: 'Développement',
    icon: Code2,
    color: 'indigo',
    statuses: ['Développement', 'In Progress', 'En cours'],
    subLabels: { 'Développement': '⚡ Développement et réalisation en cours' },
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: Activity,
    color: 'violet',
    statuses: ['Testing', 'Fait'],
    subLabels: { 'Testing': '🔍 Tests et recette utilisateur' },
  },
  {
    id: 'livraison',
    label: 'Livraison',
    icon: PackageCheck,
    color: 'emerald',
    statuses: ['Livraison', 'Clôture', 'Clôturée'],
    subLabels: { 'Livraison': '📦 Déploiement et livraison finale' },
  },
  {
    id: 'utilisation',
    label: 'Utilisation',
    icon: Users2,
    color: 'teal',
    statuses: ['Utilisation', 'Archive', 'Archivée'],
    subLabels: { 'Utilisation': '🎯 En production et utilisation active' },
  },
];

const PHASE_COLORS = {
  blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   ring: 'ring-blue-400',  dot: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', ring: 'ring-indigo-400',dot: 'bg-indigo-500' },
  violet: { bg: 'bg-violet-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', ring: 'ring-violet-400',dot: 'bg-violet-500' },
  emerald:{ bg: 'bg-emerald-600',light: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',ring: 'ring-emerald-400',dot: 'bg-emerald-500' },
  teal:   { bg: 'bg-teal-600',   light: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   ring: 'ring-teal-400',  dot: 'bg-teal-500' },
};

const getPhaseState = (phase, currentStatus) => {
  let mappedStatus = currentStatus;
  if (currentStatus === 'In Progress' || currentStatus === 'En cours') mappedStatus = 'Développement';
  if (currentStatus === 'Fait') mappedStatus = 'Testing';
  if (currentStatus === 'Clôture' || currentStatus === 'Clôturée') mappedStatus = 'Livraison';
  if (currentStatus === 'Archive' || currentStatus === 'Archivée') mappedStatus = 'Utilisation';
  
  const currentIdx  = STATUS_ORDER.indexOf(mappedStatus);
  const phaseFirst  = STATUS_ORDER.indexOf(phase.statuses[0]);
  const phaseLast   = STATUS_ORDER.indexOf(phase.statuses[phase.statuses.length - 1]);
  if (currentIdx > phaseLast)  return 'done';
  if (currentIdx >= phaseFirst) return 'active';
  return 'pending';
};




const PhaseStep = ({ phase, state, isLast, currentStatus }) => {
  const c    = PHASE_COLORS[phase.color];
  const Icon = phase.icon;
  const subLabel = phase.subLabels[currentStatus] || '';

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        {}
        <div className={`
          relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500
          ${state === 'done'   ? `${c.bg} border-transparent text-white shadow-lg` : ''}
          ${state === 'active' ? `bg-white ${c.border} ${c.text} ring-4 ${c.ring}/30 shadow-lg` : ''}
          ${state === 'pending'? 'bg-slate-100 border-slate-200 text-slate-400' : ''}
        `}>
          {state === 'done' ? (
            <CheckCircle2 size={22} />
          ) : state === 'active' ? (
            <>
              <Icon size={20} />
              {}
              <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${c.dot} ring-2 ring-white animate-pulse`} />
            </>
          ) : (
            <Icon size={20} />
          )}
        </div>
        {}
        <span className={`text-xs font-bold text-center leading-tight whitespace-nowrap ${
          state === 'done'    ? c.text :
          state === 'active'  ? `${c.text} font-extrabold` :
          'text-slate-400'
        }`}>
          {phase.label}
        </span>
        {}
        {state === 'active' && subLabel && (
          <span className={`text-[10px] font-semibold ${c.text} bg-white border ${c.border} px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5`}>
            {subLabel}
          </span>
        )}
        {state === 'done' && (
          <span className="text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
            Complété ✓
          </span>
        )}
      </div>

      {}
      {!isLast && (
        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
          state === 'done' ? 'bg-emerald-400' : 'bg-slate-200'
        }`} />
      )}
    </div>
  );
};




const ProjectOverview = () => {
  const { project, isPending } = useOutletContext();
  const { getCharterByDemandeId } = useCharter();
  const { updateDemandeStatus } = useDemandes();
  const { addProject, updateProject } = useProjects();
  const { getTasksByProjectId } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();

  const charter          = getCharterByDemandeId(project.demandeId);
  const isPM             = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';
  const isSponsor        = user?.role === 'Sponsor' || user?.role === 'Admin';
  const isCharterValidated = charter && charter.statut === 'Validé';
  const projectTasks     = getTasksByProjectId(project.id);
  const pendingTasksCount= projectTasks.filter(t => t.status === 'En cours').length;
  const doneTasksCount   = projectTasks.filter(t => ['Fait', 'Clôture', 'Clôturée', 'Archive', 'Archivée'].includes(t.status)).length;

  const currentPhase = PHASES.find(p => p.statuses.includes(project.status)) || PHASES[0];
  const currentPhaseColors = PHASE_COLORS[currentPhase.color] || PHASE_COLORS.blue;

  const handleStartDevelopment = async () => {
    await updateDemandeStatus(project.originalDemande.id, 'En Développement');
    await addProject({
      nom: project.nom,
      chefProjet: user?.name || `${user?.nom} ${user?.prenom}`,
      status: 'Atelier de Cadrage',
      description: project.description,
      demandeId: project.originalDemande.id,
      progress: 0,
    });
    alert('Le développement a démarré avec succès !');
    navigate('/projects');
  };

  return (
    <div className="space-y-6 pb-6">

      {}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vue d'ensemble</h2>
          <p className="text-slate-500">Suivi en temps réel de l'avancement du projet.</p>
        </div>
        {isPending && (
          <div className="flex gap-3">
            <Link
              to={`/project-charter?demandeId=${project.demandeId}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FileText size={18} />
              {charter ? 'Voir / Éditer Charter' : 'Créer Charter'}
            </Link>
            {isCharterValidated && (
              <button
                onClick={handleStartDevelopment}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
              >
                <PlayCircle size={18} /> Commencer Développement
              </button>
            )}
          </div>
        )}
      </div>

      {}
      {}
      {}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {}
        <div className={`px-6 py-4 ${currentPhaseColors.light} border-b ${currentPhaseColors.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Zap size={18} className={currentPhaseColors.text} />
            <h3 className={`font-bold text-sm ${currentPhaseColors.text} uppercase tracking-wider`}>
              Phase actuelle
            </h3>
            <span className={`px-3 py-0.5 rounded-full text-xs font-black ${currentPhaseColors.bg} text-white`}>
              {currentPhase.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${currentPhaseColors.dot} animate-pulse`} />
            <span className={`text-xs font-bold ${currentPhaseColors.text}`}>
              {project.status}
            </span>
          </div>
        </div>

        {}
        <div className="px-6 py-8">
          <div className="flex items-start">
            {PHASES.map((phase, i) => (
              <PhaseStep
                key={phase.id}
                phase={phase}
                state={getPhaseState(phase, project.status)}
                isLast={i === PHASES.length - 1}
                currentStatus={project.status}
              />
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Activity size={22} /></div>
            <h3 className="font-semibold text-slate-700">Progression</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">{project.progress}<span className="text-xl text-slate-400">%</span></p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {}
        <div className={`p-6 rounded-2xl border shadow-sm ${currentPhaseColors.light} ${currentPhaseColors.border}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${currentPhaseColors.bg} text-white`}>
              <Target size={22} />
            </div>
            <h3 className={`font-semibold ${currentPhaseColors.text}`}>Statut actuel</h3>
          </div>
          <p className={`text-lg font-black ${currentPhaseColors.text} leading-tight`}>
            {project.status}
          </p>
          <p className={`text-xs font-semibold ${currentPhaseColors.text} opacity-60 mt-2`}>
            Phase : {currentPhase.label}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${currentPhaseColors.dot} animate-pulse`} />
            <span className={`text-xs font-bold ${currentPhaseColors.text} opacity-70`}>Mis à jour en temps réel</span>
          </div>
        </div>

        {}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><AlertCircle size={22} /></div>
            <h3 className="font-semibold text-slate-700">Tâches</h3>
          </div>
          <p className="text-4xl font-black text-slate-800">
            {doneTasksCount}<span className="text-xl font-normal text-slate-400">/{projectTasks.length}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{pendingTasksCount} tâche{pendingTasksCount > 1 ? 's' : ''} en attente</p>
          {projectTasks.length > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.round((doneTasksCount / projectTasks.length) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {}
      <div className={isPending ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-6"}>
        <div className={isPending ? "lg:col-span-2 space-y-5" : "space-y-5"}>

          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Target size={18} className="text-blue-600" /> État du Projet
            </h3>
            <p className="text-sm text-slate-600">
              Le statut de ce projet est mis à jour automatiquement en temps réel : <span className="font-bold text-blue-600">{project.status}</span>.
            </p>
          </div>

          {}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-3">Description du projet</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{project.description || 'Aucune description fournie pour ce projet.'}</p>
          </div>
        </div>

        {}
        {isPending && (
          <div className="space-y-5">
            {}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <FileText size={16} className="text-blue-600" /> Statut Charte Projet
              </h3>
              {charter ? (
                <>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${isCharterValidated ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {charter.statut}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isCharterValidated ? 'La charte est validée. Vous pouvez commencer le développement.' : 'En cours de validation.'}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 mb-2">À créer</div>
                  <p className="text-xs text-slate-500">La charte du projet doit être rédigée par le Chef de Projet.</p>
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
