import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { FormulaireDemandeSI } from '../components/DemandeSI';
import { useDemandes } from '../context/AppContext';
import { FileText } from 'lucide-react';
import Popup from '../components/Popup';

const NouvelleDemandeSI = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { demandes, addDemande, updateDemande } = useDemandes();
  
  const [initialData, setInitialData] = React.useState(null);
  const [showPopup, setShowPopup] = React.useState(false);
  const isEditMode = Boolean(id);

  React.useEffect(() => {
    if (isEditMode && demandes.length > 0) {
      const demandeToEdit = demandes.find(d => d.id === id);
      if (demandeToEdit) {
        
        if (demandeToEdit.statut !== 'Brouillon') {
          navigate(-1);
        } else {
          setInitialData(demandeToEdit);
        }
      } else if (isEditMode && !initialData) {
        
        navigate(-1);
      }
    }
  }, [id, demandes, isEditMode, navigate, initialData]);

  const handleDemandeSubmit = async (formData) => {
    if (isEditMode) {
      await updateDemande(id, { ...formData, statut: 'En attente' });
    } else {
      await addDemande({ ...formData, statut: 'En attente' });
    }
    setShowPopup(true);
  };

  const handleDemandeSave = async (formData) => {
    if (isEditMode) {
      await updateDemande(id, { ...formData, statut: 'Brouillon' });
    } else {
      await addDemande({ ...formData, statut: 'Brouillon' });
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate(-1);
  };

  return (
    <Layout title="Nouvelle Demande SI">
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
              <FileText size={16} />
              <span>Formulaire Standard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              {isEditMode ? "Modification du Brouillon SI" : "Création d'une Demande SI"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isEditMode 
                ? "Modifiez les informations de votre brouillon puis soumettez-le ou enregistrez-le à nouveau." 
                : "Veuillez remplir ce formulaire pour soumettre une nouvelle demande de projet au service SI."}
            </p>
          </div>
        </div>

        
        {(!isEditMode || initialData) ? (
          <FormulaireDemandeSI onSubmit={handleDemandeSubmit} onSave={handleDemandeSave} initialData={initialData} />
        ) : (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <Popup 
          isOpen={showPopup}
          title="Demande Enregistrée"
          message="Votre demande SI a été soumise avec succès. Elle sera traitée dans les plus brefs délais."
          type="success"
          onClose={handlePopupClose}
        />
      </div>
    </Layout>
  );
};

export default NouvelleDemandeSI;
