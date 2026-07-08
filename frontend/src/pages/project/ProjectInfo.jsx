import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCharter } from '../../context/AppContext';
import { FileText, Target, Info, CheckCircle } from 'lucide-react';

const ProjectInfo = () => {
  const { project } = useOutletContext();
  const { getCharterByDemandeId } = useCharter();

  const charter = getCharterByDemandeId(project.demandeId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Le Projet</h2>
          <p className="text-slate-500">Informations générales et objectifs du projet.</p>
        </div>
      </div>

      {!charter ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-6 rounded-2xl flex items-center gap-3">
          <Info size={24} />
          <p>Le Project Charter n'est pas encore disponible ou validé pour ce projet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={20} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">Contexte</h3>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{charter.contexte || 'Non défini'}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-lg">Objectifs</h3>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{charter.objectifs || 'Non défini'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-purple-600" />
                <h3 className="font-bold text-slate-800 text-lg">Critères de Succès</h3>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{charter.criteresSucces || 'Non défini'}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info size={20} className="text-amber-600" />
                <h3 className="font-bold text-slate-800 text-lg">Périmètre Inclus</h3>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap">{charter.perimetreInclus || 'Non défini'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInfo;
