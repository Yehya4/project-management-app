import React, { useState } from 'react';
import { Archive, Users, Settings, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { useUser } from '../../context/AppContext';
import { useConfig } from '../../context/AppContext';

const ArchiveManager = () => {
  const { archivedUsers, restoreUser } = useUser();
  const { archivedConfig, restoreConfigItem } = useConfig();
  const [activeTab, setActiveTab] = useState('users');

  const configCategories = [
    { key: 'domaines', label: 'Domaines' },
    { key: 'categoriesProjet', label: 'Catégories Projets' },
    { key: 'natureBesoin', label: 'Natures Besoin' },
    { key: 'benefices', label: 'Bénéfices' },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Archive className="text-amber-500" size={20} />
            Gestion des Archives (Soft Delete)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visualisez et restaurez les éléments et utilisateurs supprimés pour éviter la perte de données.
          </p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>Utilisateurs ({archivedUsers.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'config' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>Configuration</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500">
                  <th className="pb-3 font-semibold px-4">Utilisateur</th>
                  <th className="pb-3 font-semibold px-4">Rôle</th>
                  <th className="pb-3 font-semibold px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {archivedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">
                      Aucun utilisateur dans les archives.
                    </td>
                  </tr>
                ) : (
                  archivedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="p-4 align-top">
                        <p className="font-medium text-slate-800">{user.nom} {user.prenom}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="p-4 align-top">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold inline-block bg-slate-100 text-slate-600">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-right align-top">
                        <button
                          onClick={() => restoreUser(user.id)}
                          className="flex items-center gap-1 px-3 py-1.5 ml-auto text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium text-xs"
                        >
                          <RefreshCw size={14} />
                          Restaurer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configCategories.map(cat => {
              const items = archivedConfig[cat.key] || [];
              return (
                <div key={cat.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{cat.label}</span>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {items.length === 0 ? (
                      <li className="p-4 text-center text-slate-500 text-sm">Vide</li>
                    ) : (
                      items.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                          <span className="text-sm text-slate-700">{item}</span>
                          <button
                            onClick={() => restoreConfigItem(cat.key, item)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Restaurer cet élément"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveManager;
