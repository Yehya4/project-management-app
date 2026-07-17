import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useCharter, useAuth } from '../../context/AppContext';
import { FileText, Target, Info, CheckCircle, Edit3, Save, X, AlertTriangle, ListX } from 'lucide-react';

const ProjectInfo = () => {
  const { project } = useOutletContext();
  const { getCharterByDemandeId, saveCharter } = useCharter();
  const { user } = useAuth();
  
  const charter = getCharterByDemandeId(project.demandeId);
  
  const isEditable = user && ['Project Manager', 'Sponsor', 'Admin'].includes(user.role);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const updatedCharter = { ...charter, ...formData };
    await saveCharter(updatedCharter);
    setIsEditing(false);
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
