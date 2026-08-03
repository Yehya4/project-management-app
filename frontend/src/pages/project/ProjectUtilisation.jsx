import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useProjects, useAuth } from '../../context/AppContext';
import { CheckCircle2, Briefcase, Activity, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import Popup from '../../components/Popup';

const ProjectUtilisation = () => {
  const { project, isPending } = useOutletContext();
  const { updateProject } = useProjects();
  const { user } = useAuth();
  const [popup, setPopup] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  
  // States for the two steps in Utilisation
  const [suiviCompleted, setSuiviCompleted] = useState(project?.suiviPostDeploiement || false);

  if (!project) return null;

  const isCompletedPhase = project.status === 'Archivée' || project.status === 'Archive' || project.status === 'Terminé';
  const isUtilisationPhase = project.status === 'Utilisation' || isCompletedPhase;

  const handleCompleteSuivi = async () => {
    try {
      await updateProject(project.id, {
        suiviPostDeploiement: true,
        suiviPostDeploiementBy: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.role,
        suiviPostDeploiementAt: new Date().toLocaleString('fr-FR')
      });
      setSuiviCompleted(true);
      setPopup({
        isOpen: true,
        title: 'Suivi Post-Déploiement Validé',
        message: 'Le suivi post-déploiement a été enregistré avec succès.',
        type: 'success'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseProject = async () => {
    try {
      await updateProject(project.id, {
        status: 'Terminé',
        clotureBy: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.role,
        clotureAt: new Date().toLocaleString('fr-FR'),
        progress: 100
      });
      setPopup({
        isOpen: true,
        title: 'Projet Clôturé',
        message: `Le projet "${project.nom}" a été clôturé et archivé avec succès.`,
        type: 'success'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={26} />
            Phase d'Utilisation & Clôture
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Validation du suivi post-déploiement et clôture définitive du projet ({project.nom}).
          </p>
        </div>
      </div>

      {!isUtilisationPhase ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <AlertCircle size={28} className="text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold">Phase non active</h3>
            <p className="text-sm">Le projet doit d'abord passer la phase de déploiement avant d'atteindre l'étape d'utilisation.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          
          {/* Étape 1 : Suivi Post-Déploiement */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${suiviCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                <Activity size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-slate-800">1. Suivi post-déploiement</h3>
                  {suiviCompleted && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <ShieldCheck size={14} /> Validé
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Surveillez la stabilité du projet en production, assurez-vous que les utilisateurs finaux ont accès au système et qu'aucun bug critique n'a été signalé après le déploiement.
                </p>
                
                {suiviCompleted ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-600">
                      Validé par <strong className="text-slate-800">{project.suiviPostDeploiementBy}</strong> le {project.suiviPostDeploiementAt}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleCompleteSuivi}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <CheckCircle2 size={18} /> Confirmer le suivi post-déploiement
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Étape 2 : Clôture du Projet */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            {!suiviCompleted && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3 text-slate-600 font-semibold">
                  <Lock size={18} /> Validez le suivi post-déploiement pour débloquer la clôture
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isCompletedPhase ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                <Briefcase size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-slate-800">2. Clôture du projet</h3>
                  {isCompletedPhase && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 size={14} /> Clôturé
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  C'est la dernière étape du cycle de vie du projet. La clôture verrouillera le projet en lecture seule et le marquera comme archivé.
                </p>

                {isCompletedPhase ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <div>
                      <p className="font-bold">Projet officiellement terminé</p>
                      <p className="text-xs mt-0.5">
                        Clôturé par {project.clotureBy} le {project.clotureAt}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleCloseProject}
                    disabled={!suiviCompleted}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Briefcase size={18} /> Clôturer et Archiver le Projet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {popup.isOpen && (
        <Popup
          type={popup.type}
          title={popup.title}
          message={popup.message}
          onClose={() => setPopup({ ...popup, isOpen: false })}
        />
      )}
    </div>
  );
};

export default ProjectUtilisation;
