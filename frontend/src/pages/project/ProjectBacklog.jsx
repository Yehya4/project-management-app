import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';

const ProjectBacklog = () => {
  const { project } = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Backlog Produit</h2>
          <p className="text-slate-500">Document de backlog pour le projet {project.nom}.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        {project.backlogFile ? (
          <>
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{project.backlogFile}</h3>
            <p className="text-slate-500 mb-8 max-w-md">Ce document contient l'ensemble des user stories, fonctionnalités et spécifications techniques du projet.</p>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm shadow-blue-200 transition-all">
              <Download size={20} /> Télécharger le Document
            </button>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun Backlog Importé</h3>
            <p className="text-slate-500 max-w-md">Le Project Manager n'a pas encore importé le document de backlog pour ce projet.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectBacklog;
