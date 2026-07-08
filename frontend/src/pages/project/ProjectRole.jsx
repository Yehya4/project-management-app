import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserCircle, Shield, Award, Terminal } from 'lucide-react';
import { useAuth, useTeam } from '../../context/AppContext';

const ProjectRole = () => {
  const { project } = useOutletContext();
  const { user } = useAuth();
  const { getTeamByProjectId } = useTeam();

  const team = getTeamByProjectId(project.id) || [];
  const myMemberInfo = team.find(m => m.userId.toString() === user.id.toString());
  
  const fonction = myMemberInfo?.user?.fonction || 'Développeur';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mon Rôle</h2>
          <p className="text-slate-500">Détails de vos responsabilités sur le projet {project.nom}.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <UserCircle size={64} className="text-blue-600" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-3xl font-bold text-slate-800 mb-2">{user.prenom} {user.nom}</h3>
          <p className="text-xl text-blue-600 font-semibold mb-6">{fonction}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl text-left">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-emerald-500" size={20} />
                <h4 className="font-bold text-slate-700">Responsabilités</h4>
              </div>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Développement des fonctionnalités liées au {fonction}</li>
                <li>Rédaction des tests unitaires et d'intégration</li>
                <li>Participation aux réunions de conception technique</li>
                <li>Revue de code (Pull Requests)</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-left">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="text-purple-500" size={20} />
                <h4 className="font-bold text-slate-700">Droits d'accès</h4>
              </div>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Accès en lecture et modification aux Tâches</li>
                <li>Accès au code source et environnements de dev</li>
                <li>Modification du statut de ses propres tickets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRole;
