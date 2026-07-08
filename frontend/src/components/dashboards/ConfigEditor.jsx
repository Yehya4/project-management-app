import React, { useState } from 'react';
import { useConfig } from '../../context/AppContext';
import { Plus, Trash2, Settings, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react';

const ConfigSection = ({ title, configKey, items, onUpdate, onArchive }) => {
  const [newItem, setNewItem] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onUpdate(configKey, [...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleArchive = (itemToArchive) => {
    onArchive(configKey, itemToArchive);
  };

  const handleEditStart = (idx, value) => {
    setEditingIdx(idx);
    setEditValue(value);
  };

  const handleEditCancel = () => {
    setEditingIdx(null);
    setEditValue('');
  };

  const handleEditSave = (idx) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== items[idx]) {
      if (!items.includes(trimmedValue)) {
        const newItems = [...items];
        newItems[idx] = trimmedValue;
        onUpdate(configKey, newItems);
      }
    }
    setEditingIdx(null);
    setEditValue('');
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="font-semibold text-slate-800">{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
            {items.length} éléments
          </span>
          {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100">
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Ajouter un nouvel élément..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newItem.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Ajouter
            </button>
          </form>

          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all min-h-[3rem]">
                {editingIdx === idx ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(idx)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md transition-colors">
                      <Check size={18} />
                    </button>
                    <button onClick={handleEditCancel} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-700">{item}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                      <button
                        onClick={() => handleEditStart(idx, item)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                        title="Modifier cet élément"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleArchive(item)}
                        className="text-slate-400 hover:text-amber-600 p-1.5 rounded-md hover:bg-amber-50 transition-colors"
                        title="Archiver cet élément"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-center text-slate-500 py-4">Aucun élément configuré.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ConfigEditor = () => {
  const { config, updateConfig, archiveConfigItem } = useConfig();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-blue-600" size={20} />
            Configuration des Formulaires (Demande SI)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les options affichées dans les listes déroulantes et cases à cocher.
          </p>
        </div>
      </div>

      <div className="p-6">
        <ConfigSection 
          title="Domaines concernés" 
          configKey="domaines" 
          items={config.domaines} 
          onUpdate={updateConfig} 
          onArchive={archiveConfigItem}
        />
        <ConfigSection 
          title="Catégories des projets" 
          configKey="categoriesProjet" 
          items={config.categoriesProjet} 
          onUpdate={updateConfig} 
          onArchive={archiveConfigItem}
        />
        <ConfigSection 
          title="Nature du besoin" 
          configKey="natureBesoin" 
          items={config.natureBesoin} 
          onUpdate={updateConfig} 
          onArchive={archiveConfigItem}
        />
        <ConfigSection 
          title="Bénéfices escomptés" 
          configKey="benefices" 
          items={config.benefices} 
          onUpdate={updateConfig} 
          onArchive={archiveConfigItem}
        />
      </div>
    </div>
  );
};

export default ConfigEditor;
