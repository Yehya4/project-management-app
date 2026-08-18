import React, { useState } from 'react';
import { Archive, Users, Settings, RefreshCw, ShieldAlert, FolderKanban, CheckSquare, FileText, FileSignature, AlertCircle, History, X } from 'lucide-react';
import { useUser, useConfig, useDemandes, useProjects, useTasks, useTestCases, useDocuments, useCharter } from '../../context/AppContext';

const ArchiveManager = () => {
  const { archivedUsers, restoreUser } = useUser();
  const { archivedConfig, restoreConfigItem } = useConfig();
  const { archivedDemandes, restoreDemande } = useDemandes();
  const { archivedProjects, restoreProject } = useProjects();
  const { archivedTasks, restoreTask } = useTasks();
  const { archivedTestCases, restoreTestCase } = useTestCases();
  const { archivedDocuments, restoreDocument } = useDocuments();
  const { archivedCharters, restoreCharter } = useCharter();
  
  const [activeTab, setActiveTab] = useState('users');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  const configCategories = [
    { key: 'domaines', label: 'Domaines' },
    { key: 'categoriesProjet', label: 'Catégories Projets' },
    { key: 'natureBesoin', label: 'Natures Besoin' },
    { key: 'benefices', label: 'Bénéfices' },
  ];

  const tabs = [
    { id: 'users', icon: Users, label: `Utilisateurs`, count: archivedUsers?.length || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'demandes', icon: ShieldAlert, label: `Demandes`, count: archivedDemandes?.length || 0, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'projects', icon: FolderKanban, label: `Projets`, count: archivedProjects?.length || 0, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'tasks', icon: CheckSquare, label: `Tâches`, count: archivedTasks?.length || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'testCases', icon: AlertCircle, label: `Cas de Test`, count: archivedTestCases?.length || 0, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { id: 'documents', icon: FileText, label: `Documents`, count: archivedDocuments?.length || 0, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'charters', icon: FileSignature, label: `Chartes`, count: archivedCharters?.length || 0, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { id: 'config', icon: Settings, label: 'Configuration', count: Object.values(archivedConfig || {}).flat().length, color: 'text-slate-500', bg: 'bg-slate-500/10' }
  ];

  const EmptyState = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-100">
        <Icon size={32} className="text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucune archive</h3>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
    </div>
  );

  const RestoreButton = ({ onClick }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }} 
      className="group flex items-center gap-2 px-4 py-2 ml-auto text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 z-10"
    >
      <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
      Restaurer
    </button>
  );

  const ListItem = ({ icon: Icon, title, subtitle, badge, onRestore, onView, iconColor = "text-slate-500", iconBg = "bg-slate-100" }) => (
    <div 
      onClick={onView}
      className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all duration-300 mb-3 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-inner`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800">{title}</h4>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </div>
      <RestoreButton onClick={onRestore} />
    </div>
  );

  const ItemDetailsModal = () => {
    if (!selectedItem) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setSelectedItem(null)} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Archive className="text-blue-500" size={20} />
              Détails : {modalTitle}
            </h3>
            <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {Object.entries(selectedItem).map(([key, value]) => {
                if (key === 'is_archived' || typeof value === 'object') return null;
                return (
                  <div key={key} className="flex flex-col border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{key}</span>
                    <span className="text-sm text-slate-800 font-medium break-words">
                      {value === null || value === undefined || value === '' ? (
                        <span className="text-slate-300 italic">Non renseigné</span>
                      ) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
             <button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors">
               Fermer
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto mt-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl shadow-xl border border-slate-800 mb-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
              <Archive size={14} />
              <span>Centre de Restauration</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Archives de l'Application
            </h2>
            <p className="text-slate-400 text-lg max-w-xl">
              Consultez et restaurez facilement les éléments supprimés. Rien n'est jamais vraiment perdu.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 font-medium ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm border border-slate-200 text-slate-800 scale-[1.02]' 
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === tab.id ? tab.bg : 'bg-slate-100'} ${activeTab === tab.id ? tab.color : 'text-slate-400'}`}>
                  <tab.icon size={16} />
                </div>
                <span>{tab.label}</span>
              </div>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {}
        <div className="lg:col-span-3">
          <div className="bg-slate-50/50 rounded-3xl p-6 min-h-[500px] border border-slate-100">
            <div className="mb-6 flex items-center gap-2">
              <History className="text-slate-400" size={20} />
              <h3 className="text-xl font-bold text-slate-800">
                {tabs.find(t => t.id === activeTab)?.label} Archivés
              </h3>
            </div>

            {activeTab === 'users' && (
              <div className="space-y-1">
                {archivedUsers.length === 0 ? (
                  <EmptyState icon={Users} message="Aucun utilisateur n'a été archivé." />
                ) : (
                  archivedUsers.map(user => (
                    <ListItem 
                      key={user.id} 
                      icon={Users} 
                      iconColor="text-blue-500"
                      iconBg="bg-blue-50"
                      title={`${user.nom} ${user.prenom}`} 
                      subtitle={user.email} 
                      badge={user.role} 
                      onRestore={() => restoreUser(user.id)} 
                      onView={() => { setSelectedItem(user); setModalTitle('Utilisateur'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'demandes' && (
              <div className="space-y-1">
                {archivedDemandes.length === 0 ? (
                  <EmptyState icon={ShieldAlert} message="Aucune demande de projet archivée." />
                ) : (
                  archivedDemandes.map(item => (
                    <ListItem 
                      key={item.id} 
                      icon={ShieldAlert} 
                      iconColor="text-amber-500"
                      iconBg="bg-amber-50"
                      title={item.titre} 
                      subtitle={`Demande ID: ${item.id}`} 
                      onRestore={() => restoreDemande(item.id)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Demande de projet'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-1">
                {archivedProjects.length === 0 ? (
                  <EmptyState icon={FolderKanban} message="Aucun projet archivé." />
                ) : (
                  archivedProjects.map(item => (
                    <ListItem 
                      key={item.id} 
                      icon={FolderKanban} 
                      iconColor="text-indigo-500"
                      iconBg="bg-indigo-50"
                      title={item.nom} 
                      subtitle={`Projet ID: ${item.id}`} 
                      onRestore={() => restoreProject(item.id)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Projet'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-1">
                {archivedTasks.length === 0 ? (
                  <EmptyState icon={CheckSquare} message="Aucune tâche archivée." />
                ) : (
                  archivedTasks.map(item => (
                    <ListItem 
                      key={item.id} 
                      icon={CheckSquare} 
                      iconColor="text-emerald-500"
                      iconBg="bg-emerald-50"
                      title={item.title} 
                      subtitle={`Projet ID: ${item.projectId}`} 
                      onRestore={() => restoreTask(item.id)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Tâche'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'testCases' && (
              <div className="space-y-1">
                {archivedTestCases.length === 0 ? (
                  <EmptyState icon={AlertCircle} message="Aucun cas de test archivé." />
                ) : (
                  archivedTestCases.map(item => (
                    <ListItem 
                      key={item.id} 
                      icon={AlertCircle} 
                      iconColor="text-rose-500"
                      iconBg="bg-rose-50"
                      title={item.title} 
                      subtitle={`Projet ID: ${item.projectId}`} 
                      onRestore={() => restoreTestCase(item.id)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Cas de Test'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-1">
                {archivedDocuments.length === 0 ? (
                  <EmptyState icon={FileText} message="Aucun document archivé." />
                ) : (
                  archivedDocuments.map(item => (
                    <ListItem 
                      key={item.id} 
                      icon={FileText} 
                      iconColor="text-cyan-500"
                      iconBg="bg-cyan-50"
                      title={item.name} 
                      subtitle={`Type: ${item.type}`} 
                      onRestore={() => restoreDocument(item.id)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Document'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'charters' && (
              <div className="space-y-1">
                {archivedCharters.length === 0 ? (
                  <EmptyState icon={FileSignature} message="Aucune charte de projet archivée." />
                ) : (
                  archivedCharters.map(item => (
                    <ListItem 
                      key={item.demandeId} 
                      icon={FileSignature} 
                      iconColor="text-violet-500"
                      iconBg="bg-violet-50"
                      title={`Charte du projet (Demande #${item.demandeId})`} 
                      subtitle={`Créée par: ${item.createdBy}`} 
                      onRestore={() => restoreCharter(item.demandeId)} 
                      onView={() => { setSelectedItem(item); setModalTitle('Charte de Projet'); }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'config' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {configCategories.map(cat => {
                  const items = archivedConfig[cat.key] || [];
                  return (
                    <div key={cat.key} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-800">{cat.label}</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-semibold">{items.length}</span>
                      </div>
                      <div className="p-2 max-h-60 overflow-y-auto">
                        {items.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm italic">Vide</div>
                        ) : (
                          items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                              <span className="text-sm font-medium text-slate-700">{item}</span>
                              <button
                                onClick={() => restoreConfigItem(cat.key, item)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                title="Restaurer cet élément"
                              >
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
      <ItemDetailsModal />
    </div>
  );
};

export default ArchiveManager;
