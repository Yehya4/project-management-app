import React, { useState } from 'react';
import { Send, ArrowLeft, Save, X, Calendar, User, Briefcase, FileText, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Popup from './Popup';
import { useConfig } from '../context/AppContext';
import { useAuth } from '../context/AppContext';


export const ChampSaisie = ({ label, id, type = 'text', value, onChange, placeholder, required, readOnly }) => (
  <div className="flex flex-col mb-4">
    <label htmlFor={id} className="mb-2 text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      className={`px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
    />
  </div>
);


export const ChampTexteLong = ({ label, id, value, onChange, placeholder, required, rows = 4 }) => (
  <div className="flex flex-col mb-4">
    <label htmlFor={id} className="mb-2 text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y"
    />
  </div>
);


export const GroupeCasesCocher = ({ label, options, selectedValues, onChange, name }) => {
  const handleCheckboxChange = (optionValue) => {
    let newValues;
    if (selectedValues.includes(optionValue)) {
      newValues = selectedValues.filter(val => val !== optionValue);
    } else {
      newValues = [...selectedValues, optionValue];
    }
    onChange({ target: { name, value: newValues } });
  };

  return (
    <div className="mb-6">
      <label className="block mb-3 text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded hover:border-blue-500 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
              />
              <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};


const INITIAL_STATE = {
  nomDemandeur: '',
  fonction: '',
  domaines: [],
  categoriesProjet: [],
  contexte: '',
  description: '',
  natureBesoin: [],
  benefices: [],
  delaiSouhaite: ''
};


export const FormulaireDemandeSI = ({ onSubmit, onSave, initialData }) => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState(initialData || {
    ...INITIAL_STATE,
    nomDemandeur: user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '',
    fonction: user?.fonction || ''
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  const [showSavePopup, setShowSavePopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log('Demande soumise:', formData);
      alert('Demande SI soumise avec succès !');
      navigate(-1);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    console.log('Demande enregistrée:', formData);
    setShowSavePopup(true);
  };

  const handlePopupClose = () => {
    setShowSavePopup(false);
    navigate(-1);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Entité</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChampSaisie
            label="Nom du demandeur"
            id="nomDemandeur"
            value={formData.nomDemandeur}
            onChange={handleChange}
            placeholder="Nom et prénom"
            required
            readOnly={user?.role === 'User'}
          />
          <ChampSaisie
            label="Fonction"
            id="fonction"
            value={formData.fonction}
            onChange={handleChange}
            placeholder="Ex: Responsable Marketing"
            required
            readOnly={user?.role === 'User'}
          />
        </div>
      </div>

      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
        <GroupeCasesCocher
          label="Domaines concernés"
          name="domaines"
          options={config?.domaines?.length > 0 ? config.domaines : ['Ressources Humaines', 'Finance', 'Logistique', 'Production', 'Commercial']}
          selectedValues={formData.domaines}
          onChange={handleChange}
        />
        <div className="my-6 border-t border-dashed border-slate-200"></div>
        <GroupeCasesCocher
          label="Catégories des projets"
          name="categoriesProjet"
          options={config?.categoriesProjet?.length > 0 ? config.categoriesProjet : ['Nouveau projet', 'Refonte', 'Évolution majeure', 'Maintenance corrective']}
          selectedValues={formData.categoriesProjet}
          onChange={handleChange}
        />
      </div>

      <div className="p-6 md:p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Détails du besoin</h2>
        <ChampTexteLong
          label="Contexte du Projet (Problèmes à résoudre)"
          id="contexte"
          value={formData.contexte}
          onChange={handleChange}
          placeholder="Ex: Développer l’extraction des données relatives aux réclamations..."
          required
        />
        <div className="my-6 border-t border-dashed border-slate-200"></div>
        <ChampTexteLong
          label="Description du besoin (Les exigences)"
          id="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Ex: Dans le cadre de l’amélioration de la satisfaction des clients..."
          required
        />
      </div>

      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
        <GroupeCasesCocher
          label="Nature du besoin"
          name="natureBesoin"
          options={config?.natureBesoin?.length > 0 ? config.natureBesoin : ['Automatisation', 'Amélioration UX/UI', 'Mise en conformité', 'Nouveau service métier']}
          selectedValues={formData.natureBesoin}
          onChange={handleChange}
        />
        <div className="my-6 border-t border-dashed border-slate-200"></div>
        <GroupeCasesCocher
          label="Bénéfices escomptés"
          name="benefices"
          options={config?.benefices?.length > 0 ? config.benefices : ['Gain de temps / Productivité', 'Réduction des coûts', 'Qualité des données', 'Amélioration image de marque']}
          selectedValues={formData.benefices}
          onChange={handleChange}
        />
        <div className="my-6 border-t border-dashed border-slate-200"></div>
        <div className="max-w-md">
          <ChampSaisie
            label="Délai souhaité"
            id="delaiSouhaite"
            type="date"
            value={formData.delaiSouhaite}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="p-6 md:p-8 bg-slate-50 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
          >
            <Save size={18} className="mr-2" />
            Enregistrer
          </button>
          <button
            type="submit"
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all shadow-md"
          >
            <Send size={18} className="mr-2" />
            Soumettre la demande
          </button>
        </div>
      </div>

      <Popup 
        isOpen={showSavePopup}
        title="Brouillon Enregistré"
        message="Votre demande SI a été enregistrée en tant que brouillon."
        type="success"
        onClose={handlePopupClose}
      />
    </form>
  );
};


export const DemandeDetailsModal = ({ isOpen, onClose, demande }) => {
  if (!isOpen || !demande) return null;

  const renderArray = (arr) => {
    if (!arr || arr.length === 0) return <span className="text-slate-400 italic">Non spécifié</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {arr.map((item, idx) => (
          <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium">
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        {}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl sticky top-0 z-10 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-500" />
              Détails de la demande {demande.id}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  demande.statut === 'Acceptée'
                    ? 'bg-emerald-100 text-emerald-700'
                    : demande.statut === 'Refusée'
                      ? 'bg-rose-100 text-rose-700'
                      : demande.statut === 'Brouillon'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-700'
                }`}>
                {demande.statut}
              </span>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar size={14} /> {demande.dateCreation}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {}
        <div className="p-6 md:p-8 space-y-8">
          
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><User size={14} /> Demandeur</p>
              <p className="text-slate-800 font-medium">{demande.nomDemandeur}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1"><Briefcase size={14} /> Fonction</p>
              <p className="text-slate-800 font-medium">{demande.fonction}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Domaines concernés</h3>
              {renderArray(demande.domaines)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Catégories Projet</h3>
              {renderArray(demande.categoriesProjet)}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Contexte du Projet</h3>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
              {demande.contexte || <span className="text-slate-400 italic">Non spécifié</span>}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Description du Besoin</h3>
            <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
              {demande.description || <span className="text-slate-400 italic">Non spécifié</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Nature du Besoin</h3>
              {renderArray(demande.natureBesoin)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Bénéfices escomptés</h3>
              {renderArray(demande.benefices)}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Délai souhaité</h3>
              <p className="text-slate-700 font-medium">{demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-FR') : <span className="text-slate-400 italic">Non spécifié</span>}</p>
            </div>
          </div>

        </div>

        {}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
