import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useUser, useTeam, useAuth, useCharter, useProjects } from '../../context/AppContext';
import { UserPlus, Shield, Code, X, User } from 'lucide-react';

const ProjectTeam = () => {
  const { project, isPending } = useOutletContext();
  const { users } = useUser();
  const { getTeamByProjectId, addMemberToProject } = useTeam();
  const { user } = useAuth();
  const { getCharterByDemandeId } = useCharter();
  const { updateProject } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Développeur');

  const teamMembers = getTeamByProjectId(project.id) || [];
  const charter = getCharterByDemandeId(project.demandeId);
  const canAddMember = user?.role === 'Project Manager' || user?.role === 'Sponsor' || user?.role === 'Admin';

  
  const availableUsers = users;

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    const userToAdd = users.find(u => u.id === selectedUserId || u.id === parseInt(selectedUserId));
    if (userToAdd) {
      addMemberToProject(project.id, {
        userId: userToAdd.id,
        user: userToAdd,
        role: selectedRole
      });
      setIsModalOpen(false);
      setSelectedUserId('');
    }
  };

  const roleColors = {
    'Sponsor': 'bg-emerald-100 text-emerald-700',
    'Développeur': 'bg-blue-100 text-blue-700',
    'Tech Lead': 'bg-purple-100 text-purple-700',
    'QA / Testeur': 'bg-emerald-100 text-emerald-700',
    'Designer UI/UX': 'bg-pink-100 text-pink-700',
    'Scrum Master': 'bg-amber-100 text-amber-700'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Équipe du projet</h2>
          <p className="text-slate-500">Membres assignés au développement et à la gestion de {project.nom}.</p>
        </div>
        {!isPending && canAddMember && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserPlus size={20} />
            Ajouter un membre
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold uppercase mb-4 shadow-sm">
            {(project.chefProjet !== 'Non assigné' && project.chefProjet) ? project.chefProjet.charAt(0) : (charter?.chefProjetIT ? charter.chefProjetIT.charAt(0) : 'C')}
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {(project.chefProjet !== 'Non assigné' && project.chefProjet) ? project.chefProjet : (charter?.chefProjetIT || 'Non assigné')}
          </h3>
          <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
            <Shield size={14} /> Chef de Projet
          </span>
        </div>

        {}
        {charter?.sponsorMetier && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-900 text-white flex items-center justify-center text-3xl font-bold uppercase mb-4 shadow-sm">
              {charter.sponsorMetier.charAt(0) || 'S'}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{charter.sponsorMetier}</h3>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <Shield size={14} /> Sponsor Métier
            </span>
          </div>
        )}

        {}
        {charter?.sponsorIT && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-900 text-white flex items-center justify-center text-3xl font-bold uppercase mb-4 shadow-sm">
              {charter.sponsorIT.charAt(0) || 'S'}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{charter.sponsorIT}</h3>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <Shield size={14} /> Sponsor IT
            </span>
          </div>
        )}

        {}
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold uppercase mb-4 shadow-sm ${roleColors[member.role] || 'bg-slate-100 text-slate-600'}`}>
              {member.user.nom?.charAt(0) || <User size={32} />}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{member.user.prenom} {member.user.nom}</h3>
            <p className="text-sm text-slate-500">{member.user.email}</p>
            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${roleColors[member.role] || 'bg-slate-100 text-slate-700'}`}>
              {member.role}
            </span>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <UserPlus size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">L'équipe technique n'a pas encore été constituée.</p>
        </div>
      )}

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Ajouter à l'équipe</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sélectionner un utilisateur</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Choisir un collaborateur --</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role})</option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Aucun utilisateur disponible dans l'application.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle dans le projet</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                >
                  <option value="Sponsor">Sponsor</option>
                  <option value="Développeur">Développeur</option>
                  <option value="Tech Lead">Tech Lead</option>
                  <option value="QA / Testeur">QA / Testeur</option>
                  <option value="Designer UI/UX">Designer UI/UX</option>
                  <option value="Scrum Master">Scrum Master</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={!selectedUserId}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Ajouter le membre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTeam;
