import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTasks, useTeam, useAuth, useProjects } from '../../context/AppContext';
import {
  PlusCircle, MoreHorizontal, X, Clock, CheckCircle, CheckCheck,
  Tag, User, AlertTriangle, FlaskConical, ArrowRight, Lock, Download, Upload
} from 'lucide-react';
import mammoth from 'mammoth';



const COLUMNS = [
  { id: 'En cours',  title: 'En cours',  color: 'border-blue-400',   dot: 'bg-blue-400'   },
  { id: 'Fait',      title: 'Fait',      color: 'border-emerald-400', dot: 'bg-emerald-400' },
  { id: 'Clôturée',  title: 'Clôturée',  color: 'border-purple-400',  dot: 'bg-purple-400'  },
  { id: 'Archivée',  title: 'Archivée',  color: 'border-slate-300',   dot: 'bg-slate-300'   },
];

const getPriorityStyle = (p) => ({
  Basse:    'bg-slate-100 text-slate-600',
  Moyenne:  'bg-blue-100  text-blue-700',
  Haute:    'bg-amber-100 text-amber-700',
  Critique: 'bg-red-100   text-red-700',
}[p] || 'bg-slate-100 text-slate-600');



const ProjectTasks = () => {
  const { project, isPending } = useOutletContext();
  const { tasks, addTask, updateTaskStatus, updateTask } = useTasks();
  const { getTeamByProjectId } = useTeam();
  const { updateProject } = useProjects();
  const { user } = useAuth();

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const teamMembers  = getTeamByProjectId(project.id) || [];

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData,     setFormData]     = useState({
    title: '', description: '', priority: 'Moyenne', assigneeId: '', status: 'En cours',
    reference: '', objet: '', dateDebutReel: '', dateFinReel: '', dateFin: ''
  });

  
  const canManageTasks = ['Project Manager', 'Sponsor', 'Admin'].includes(user?.role);

  const canMoveTask = (task) => {
    if (canManageTasks) return true;

    return task.assigneeId?.toString() === user?.id?.toString();
  };

  
  const doneTasks  = projectTasks.filter(t => ['Fait', 'Clôturée', 'Archivée'].includes(t.status));
  const totalTasks = projectTasks.length;
  const doneCount  = doneTasks.length;
  const progress   = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const allDone    = totalTasks > 0 && doneCount === totalTasks;

  const fileInputRef = React.useRef(null);


  const handleImportWord = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;


        const lines = text.split('\n');
        let currentTask = null;

        for (const line of lines) {
          if (line.toLowerCase().startsWith('titre:')) {
            if (currentTask && currentTask.title) {
              await addTask(currentTask);
            }
            currentTask = {
              projectId: project.id,
              title: line.substring(6).trim(),
              reference: '',
              objet: '',
              description: '',
              priority: 'Moyenne',
              status: 'En cours',
              dateDebutReel: '',
              dateFinReel: '',
              dateFin: '',
              assigneeId: ''
            };
          } else if (currentTask && line.toLowerCase().startsWith('référence:')) {
            currentTask.reference = line.substring(10).trim();
          } else if (currentTask && line.toLowerCase().startsWith('objet:')) {
            currentTask.objet = line.substring(6).trim();
          } else if (currentTask && line.toLowerCase().startsWith('description:')) {
            currentTask.description = line.substring(12).trim();
          } else if (currentTask && line.toLowerCase().startsWith('priorité:')) {
            currentTask.priority = line.substring(9).trim() || 'Moyenne';
          } else if (currentTask && line.toLowerCase().startsWith('statut:')) {
            currentTask.status = line.substring(7).trim() || 'En cours';
          } else if (currentTask && line.toLowerCase().startsWith('date début réel:')) {
            currentTask.dateDebutReel = line.substring(16).trim();
          } else if (currentTask && line.toLowerCase().startsWith('date fin réel:')) {
            currentTask.dateFinReel = line.substring(14).trim();
          } else if (currentTask && line.toLowerCase().startsWith('date fin:')) {
            currentTask.dateFin = line.substring(9).trim();
          }
        }
        if (currentTask && currentTask.title) {
          await addTask(currentTask);
        }
        
        alert('Tâches importées avec succès.');
      } catch (err) {
        alert('Erreur lors de l\'importation du fichier Word.');
      }
      e.target.value = null;
    };
    reader.readAsArrayBuffer(file);
  };

  

  
  const handleAddTask = (e) => {
    e.preventDefault();
    addTask({ ...formData, projectId: project.id });
    setIsModalOpen(false);
    setFormData({ title: '', description: '', priority: 'Moyenne', assigneeId: '', status: 'En cours', reference: '', objet: '', dateDebutReel: '', dateFinReel: '', dateFin: '' });
  };

  const getAssigneeName = (id) => {
    if (!id) return 'Non assigné';
    const member = teamMembers.find(m => m.userId?.toString() === id?.toString());
    return member ? `${member.user.prenom} ${member.user.nom}` : 'Inconnu';
  };

  const handleDragStart = (e, taskId) => {
    const task = projectTasks.find(t => t.id === taskId);
    if (!task || !canMoveTask(task)) { e.preventDefault(); return; }
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task   = projectTasks.find(t => t.id === taskId);
    if (task && canMoveTask(task)) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateTaskStatus(taskId, newStatus);
    setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const isDev = project.status === 'Développement';
  const isTesting = project.status === 'Testing';

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      
      {}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tâches de développement</h2>
          <p className="text-slate-500">Gérez les tâches de {project.nom}.</p>
        </div>
        {!isPending && canManageTasks && project.status !== 'Initiation' && (
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".docx" 
              ref={fileInputRef} 
              onChange={handleImportWord} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors shadow-sm shrink-0"
              title="Importer depuis Word"
            >
              <Upload size={18} /> <span className="hidden md:inline">Importer</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle size={20} /> Nouvelle tâche
            </button>
          </div>
        )}
      </div>

      {}
      {totalTasks > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <CheckCheck size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">
                {doneCount}/{totalTasks} tâches terminées
              </span>
            </div>
            <span className="text-sm font-bold text-slate-700">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: allDone ? '#10b981' : '#3b82f6'
              }}
            />
          </div>
          {allDone && isDev && (
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
              <FlaskConical size={16} />
              Toutes les tâches sont terminées — Passage automatique à la phase <strong>Testing</strong> en cours…
            </div>
          )}
          {isTesting && (
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 p-2.5 rounded-xl">
              <FlaskConical size={16} />
              Le projet est en phase <strong>Testing</strong>. Rendez-vous dans l'onglet Tests.
            </div>
          )}
        </div>
      )}


      {}
      <div className="flex-1 flex gap-5 overflow-x-auto pb-4">
          {COLUMNS.map(column => {
            const colTasks = projectTasks.filter(t => t.status === column.id);
            return (
              <div
                key={column.id}
                className={`flex flex-col bg-slate-50 rounded-2xl w-72 shrink-0 border-t-4 border border-slate-200 ${column.color}`}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragOver={(e) => e.preventDefault()}
              >
                {}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                    <h3 className="font-bold text-slate-700 text-sm">{column.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{colTasks.length}</span>
                  </div>
                </div>

                {}
                <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                  {colTasks.length > 0 ? (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{task.id?.split('-')[1]?.slice(-4)}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5">
                            {task.assigneeId ? (
                              <div
                                className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm"
                                title={getAssigneeName(task.assigneeId)}
                              >
                                {getAssigneeName(task.assigneeId).charAt(0)}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-2 border-white">
                                <User size={12} />
                              </div>
                            )}
                          </div>
                          {column.id === 'En cours'  && <Clock       size={14} className="text-blue-500 animate-pulse" />}
                          {column.id === 'Fait'      && <CheckCircle size={14} className="text-emerald-500" />}
                          {column.id === 'Clôturée'  && <CheckCircle size={14} className="text-purple-500" />}
                          {column.id === 'Archivée'  && <Tag         size={14} className="text-slate-400" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center border-2 border-dashed border-slate-200 rounded-xl opacity-60">
                      <p>Déposez des tâches ici</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      {}
      {projectTasks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center p-8">
          <PlusCircle size={40} className="text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-600 text-lg mb-1">Aucune tâche</h3>
          <p className="text-slate-400 text-sm">
            {canManageTasks
              ? 'Créez la première tâche de développement pour commencer.'
              : 'Aucune tâche ne vous a encore été assignée.'}
          </p>
        </div>
      )}

      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PlusCircle className="text-blue-600" /> Créer une nouvelle tâche
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              <form id="task-form" onSubmit={handleAddTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Titre <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    placeholder="ex: Implémenter la page de connexion..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Référence</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      placeholder="ex: REF-123"
                      value={formData.reference}
                      onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Objet</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      placeholder="ex: Module de login"
                      value={formData.objet}
                      onChange={e => setFormData({ ...formData, objet: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Début Réel</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateDebutReel}
                      onChange={e => setFormData({ ...formData, dateDebutReel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Fin Réel</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateFinReel}
                      onChange={e => setFormData({ ...formData, dateFinReel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Fin (Prévue)</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateFin}
                      onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-sm"
                    placeholder="Décrivez la tâche et les critères d'acceptation..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Tag size={15} /> Priorité
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="Basse">⬇️ Basse</option>
                      <option value="Moyenne">⏺️ Moyenne</option>
                      <option value="Haute">⬆️ Haute</option>
                      <option value="Critique">🔥 Critique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assigner à</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.assigneeId}
                      onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                    >
                      <option value="">Non assigné</option>
                      {teamMembers.map(m => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.prenom} {m.user.nom} ({m.role})
                        </option>
                      ))}
                    </select>
                    {teamMembers.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        L'équipe est vide. Allez dans "Équipe" pour ajouter des membres.
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="task-form"
                disabled={!formData.title}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                Créer la tâche
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">{selectedTask.id}</span>
                <h3 className="text-xl font-bold text-slate-800">Détails de la tâche</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Titre</h4>
                <p className="text-lg font-bold text-slate-800">{selectedTask.title}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap min-h-[80px]">
                  {selectedTask.description || <em className="text-slate-400">Aucune description.</em>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Référence</h4>
                  {canMoveTask(selectedTask) ? (
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.reference || ''}
                      onChange={e => updateTask(selectedTask.id, { reference: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{selectedTask.reference || '-'}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Objet</h4>
                  {canMoveTask(selectedTask) ? (
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.objet || ''}
                      onChange={e => updateTask(selectedTask.id, { objet: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{selectedTask.objet || '-'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Début Réel</h4>
                  {canMoveTask(selectedTask) ? (
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.dateDebutReel ? selectedTask.dateDebutReel.split('T')[0] : ''}
                      onChange={e => updateTask(selectedTask.id, { dateDebutReel: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedTask.dateDebutReel ? new Date(selectedTask.dateDebutReel).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Fin Réel</h4>
                  {canMoveTask(selectedTask) ? (
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.dateFinReel ? selectedTask.dateFinReel.split('T')[0] : ''}
                      onChange={e => updateTask(selectedTask.id, { dateFinReel: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedTask.dateFinReel ? new Date(selectedTask.dateFinReel).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Fin (Prévue)</h4>
                  {canMoveTask(selectedTask) ? (
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.dateFin ? selectedTask.dateFin.split('T')[0] : ''}
                      onChange={e => updateTask(selectedTask.id, { dateFin: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedTask.dateFin ? new Date(selectedTask.dateFin).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priorité</h4>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getPriorityStyle(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statut</h4>
                  {canMoveTask(selectedTask) ? (
                    <select
                      className="border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.status}
                      onChange={e => handleStatusChange(selectedTask.id, e.target.value)}
                    >
                      {COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedTask.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigné à</h4>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedTask.assigneeId ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                            {getAssigneeName(selectedTask.assigneeId).charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{getAssigneeName(selectedTask.assigneeId)}</p>
                            <p className="text-xs text-slate-400">Membre de l'équipe</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <User size={18} />
                          </div>
                          <p className="font-semibold text-slate-500 text-sm">Non assigné</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Date Création</h4>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-6 py-2.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;
