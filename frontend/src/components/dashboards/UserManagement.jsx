import React, { useState } from 'react';
import { useUser } from '../../context/AppContext';
import { Plus, Trash2, Edit2, Users, Check, X } from 'lucide-react';

const ROLES = ['User', 'Developer', 'Tester', 'Chef Testeur', 'Project Manager', 'Sponsor'];

const UserManagement = ({ isModal = true, onClose }) => {
  const { users, addUser, updateUser, archiveUser } = useUser();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialFormState = { matricule: '', nom: '', prenom: '', fonction: '', telephone: '', emailPersonnelle: '', email: '', role: 'User', password: '' };
  const [formData, setFormData] = useState(initialFormState);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (formData.nom && formData.prenom && formData.email && formData.password) {
      addUser(formData);
      setFormData(initialFormState);
      setIsAdding(false);
    }
  };

  const handleEditStart = (user) => {
    setEditingId(user.id);
    setFormData({ 
      matricule: user.matricule || '', 
      nom: user.nom || '', 
      prenom: user.prenom || '', 
      fonction: user.fonction || '', 
      telephone: user.telephone || '', 
      emailPersonnelle: user.emailPersonnelle || '', 
      email: user.email || '', 
      role: user.role || 'User' 
    });
  };

  const handleEditSave = (id) => {
    if (formData.nom && formData.prenom && formData.email) {
      updateUser(id, formData);
      setEditingId(null);
      setFormData(initialFormState);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const content = (
      <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden w-full flex flex-col ${isModal ? 'shadow-2xl max-w-5xl max-h-[90vh]' : 'shadow-sm h-full mt-8'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              Gestion des Utilisateurs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gérez les comptes, les emails et les rôles (User, PM, Sponsor).
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isAdding && !editingId && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Plus size={18} />
                Nouvel Utilisateur
              </button>
            )}
            {isModal && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                title="Fermer"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="pb-3 font-semibold px-4">Matricule</th>
                <th className="pb-3 font-semibold px-4">Nom complet</th>
                <th className="pb-3 font-semibold px-4">Fonction</th>
                <th className="pb-3 font-semibold px-4">Contacts</th>
                <th className="pb-3 font-semibold px-4">Rôle</th>
                <th className="pb-3 font-semibold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  <td className="p-4 align-top">
                    <input type="text" placeholder="Matricule" value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                  </td>
                  <td className="p-4 align-top">
                    <input type="text" placeholder="Nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                    <input type="text" placeholder="Prénom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                  </td>
                  <td className="p-4 align-top">
                    <input type="text" placeholder="Fonction" value={formData.fonction} onChange={(e) => setFormData({ ...formData, fonction: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                  </td>
                  <td className="p-4 align-top">
                    <input type="email" placeholder="Email pro" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                    <input type="email" placeholder="Email perso" value={formData.emailPersonnelle} onChange={(e) => setFormData({ ...formData, emailPersonnelle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                    <input type="text" placeholder="Téléphone" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                  </td>
                  <td className="p-4 align-top">
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-xs mb-2">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="password" placeholder="Mot de passe" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" required />
                  </td>
                  <td className="p-4 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleAddSubmit} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Valider">
                        <Check size={18} />
                      </button>
                      <button onClick={handleCancel} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title="Annuler">
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {[...users].sort((a, b) => a.role === 'Admin' ? 1 : b.role === 'Admin' ? -1 : 0).map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  {editingId === user.id ? (
                    <>
                      <td className="p-4 align-top">
                        <input type="text" placeholder="Matricule" value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                      </td>
                      <td className="p-4 align-top">
                        <input type="text" placeholder="Nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                        <input type="text" placeholder="Prénom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                      </td>
                      <td className="p-4 align-top">
                        <input type="text" placeholder="Fonction" value={formData.fonction} onChange={(e) => setFormData({ ...formData, fonction: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                      </td>
                      <td className="p-4 align-top">
                        <input type="email" placeholder="Email pro" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                        <input type="email" placeholder="Email perso" value={formData.emailPersonnelle} onChange={(e) => setFormData({ ...formData, emailPersonnelle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                        <input type="text" placeholder="Téléphone" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs mb-2" />
                      </td>
                      <td className="p-4 align-top">
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white text-xs mb-2">
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditSave(user.id)} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Enregistrer">
                            <Check size={18} />
                          </button>
                          <button onClick={handleCancel} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title="Annuler">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 align-top font-medium text-slate-600">{user.matricule || '-'}</td>
                      <td className="p-4 align-top">
                        <p className="font-medium text-slate-800">{user.nom} {user.prenom}</p>
                      </td>
                      <td className="p-4 align-top text-slate-600">{user.fonction || '-'}</td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1 text-xs text-slate-600">
                          {user.email && <span>Pro: <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline">{user.email}</a></span>}
                          {user.emailPersonnelle && <span>Perso: {user.emailPersonnelle}</span>}
                          {user.telephone && <span>Tél: {user.telephone}</span>}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'Sponsor' ? 'bg-amber-100 text-amber-700' :
                          user.role === 'Project Manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-right align-top">
                        {user.role !== 'Admin' && (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditStart(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => archiveUser(user.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Archiver">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              
              {users.length === 0 && !isAdding && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default UserManagement;
