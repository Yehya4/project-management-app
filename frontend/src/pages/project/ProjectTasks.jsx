import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTasks, useTeam, useAuth, useProjects, useDocuments, usePopup } from '../../context/AppContext';
import {
  PlusCircle, MoreHorizontal, X, Clock, CheckCircle, CheckCheck,
  Tag, User, AlertTriangle, FlaskConical, ArrowRight, Lock, Download, Upload, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

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
  const { addDocument } = useDocuments();
  const { user } = useAuth();
  const { showPopup } = usePopup();
  const navigate = useNavigate();

  const handleValidateForTesting = async () => {
    try {
      await updateProject(project.id, { status: 'Testing', progress: 80 });
      showPopup({
        title: "Validation du Développement",
        message: `La phase de développement a été validée avec succès ! Le projet "${project?.nom || ''}" passe en Testing.`,
        type: "success"
      });
      navigate(`/projects/${project.id}/tests`);
    } catch (err) {
      console.error('Erreur validation testing:', err);
    }
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const teamMembers  = getTeamByProjectId(project.id) || [];

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData,     setFormData]     = useState({
    objet: '', description: '', priority: '', assigneeId: '', status: '',
    dateDebutReel: '', dateFinReel: '', dateFin: '', solutionResultat: '', attachment: '', reference: ''
  });

  const dynamicColumns = React.useMemo(() => {
    const existingCols = [...COLUMNS];
    projectTasks.forEach(t => {
      if (t.status && !existingCols.find(c => c.id === t.status)) {
        existingCols.push({ id: t.status, title: t.status, color: 'border-slate-300', dot: 'bg-slate-300' });
      }
    });
    return existingCols;
  }, [projectTasks]);

  const isProjectChef = project?.chefProjet &&
    (`${user?.prenom || ''} ${user?.nom || ''}`.trim() === project.chefProjet);
  const canManageTasks = ['Project Manager', 'Sponsor', 'Admin', 'PM', 'Chef de Projet'].includes(user?.role) || isProjectChef;

  const canMoveTask = (task) => {
    if (canManageTasks) return true;

    return task.assigneeId?.toString() === user?.id?.toString();
  };

  
  const doneTasks  = projectTasks.filter(t => ['Fait', 'Clôturée', 'Clôture', 'Archivée', 'Archive', 'Terminé'].includes(t.status));
  const totalTasks = projectTasks.length;
  const doneCount  = doneTasks.length;
  const progress   = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const allDone    = totalTasks > 0 && doneCount === totalTasks;

  // Transition is now manual via button


  const handleDownloadExcelTemplate = () => {
    // Build the list of team members for the assignee column guide
    const profilesList = teamMembers
      .filter(m => m.user)
      .map(m => `${m.user.prenom} ${m.user.nom} (${m.role || m.user.role})`.trim())
      .join(', ');

    const assigneeNote = profilesList
      ? `Assigné à : écrire le nom du profil. Ex: ${profilesList}`
      : `Assigné à : écrire le prénom et nom d\'un membre de l\'équipe`;

    const ws_data = [
      // Row 1 - Title
      ['MODÈLE D\'IMPORTATION DES TÂCHES DE DÉVELOPPEMENT'],
      // Row 2 - Warning
      ['⚠️  NE PAS MODIFIER les en-têtes. Remplissez à partir de la ligne 7. Sauvegardez en .xlsx avant d\'importer.'],
      // Row 3 - Assignee note
      [`📋  ${assigneeNote}`],
      // Row 4 - Priority note
      ['📌  Priorité : écrire exactement → Basse | Moyenne | Haute | Critique'],
      // Row 5 - Status note
      ['🔖  Statut   : écrire exactement → En cours | Fait | Clôturée | Archivée'],
      // Row 6 - Separator / empty
      [],
      // Row 7 - Headers
      [
        'Objet *',
        'Description *',
        'Priorité *',
        'Statut *',
        'Assigné à *',
        'Date Début Réel (YYYY-MM-DD) *',
        'Date Fin Réel (YYYY-MM-DD) *',
        'Date Fin Prévue (YYYY-MM-DD) *',
        'Solution / Résultat'
      ],
      // Row 8 - Example row
      [
        'Exemple : Développer la page de connexion',
        'Créer le formulaire avec validation des champs email et mot de passe',
        'Haute',
        'En cours',
        teamMembers.length > 0 && teamMembers[0].user
          ? `${teamMembers[0].user.prenom} ${teamMembers[0].user.nom}`
          : 'Prénom Nom',
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        new Date(Date.now() + 10*24*60*60*1000).toISOString().split('T')[0],
        'Formulaire validé, tests unitaires passés'
      ],
      // Rows 9..38 – 30 empty rows for user to fill
      ...Array.from({ length: 30 }, () => ['', '', '', '', '', '', '', '', '']),
    ];


    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Column widths
    ws['!cols'] = [
      { wch: 45 }, // Objet
      { wch: 55 }, // Description
      { wch: 18 }, // Priorité
      { wch: 18 }, // Statut
      { wch: 30 }, // Assigné à
      { wch: 28 }, // Date Début
      { wch: 28 }, // Date Fin Réel
      { wch: 28 }, // Date Fin Prévue
      { wch: 45 }, // Solution
    ];

    // Row heights (instructions + header + example + 30 data rows)
    ws['!rows'] = [
      { hpt: 38 }, // row 1 title
      { hpt: 26 }, // row 2 warning
      { hpt: 26 }, // row 3 assignee
      { hpt: 26 }, // row 4 priority
      { hpt: 26 }, // row 5 status
      { hpt: 12 }, // row 6 separator
      { hpt: 32 }, // row 7 headers
      { hpt: 48 }, // row 8 example
      ...Array.from({ length: 30 }, () => ({ hpt: 22 })), // rows 9-38 data rows
    ];


    // Merge instruction rows across all 9 columns
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
    ];

    // Apply styles cell by cell
    for (let key in ws) {
      if (key[0] === '!') continue;
      const rowNum = parseInt(key.replace(/[a-zA-Z]/g, ''), 10);

      if (rowNum === 1) {
        // Title row
        ws[key].s = {
          font: { name: 'Arial', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1F4E78' } },
          alignment: { vertical: 'center', horizontal: 'center' },
        };
      } else if (rowNum >= 2 && rowNum <= 5) {
        // Instruction rows
        ws[key].s = {
          font: { name: 'Arial', sz: 11, color: { rgb: '1F4E78' }, italic: true },
          fill: { fgColor: { rgb: 'DEEAF1' } },
          alignment: { vertical: 'center', wrapText: true },
        };
      } else if (rowNum === 7) {
        // Header row
        ws[key].s = {
          font: { name: 'Arial', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0070C0' } },
          alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
          border: {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      } else if (rowNum === 8) {
        // Example row
        ws[key].s = {
          font: { name: 'Arial', sz: 10, color: { rgb: '595959' }, italic: true },
          fill: { fgColor: { rgb: 'F2F2F2' } },
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'BFBFBF' } },
            bottom: { style: 'thin', color: { rgb: 'BFBFBF' } },
            left: { style: 'thin', color: { rgb: 'BFBFBF' } },
            right: { style: 'thin', color: { rgb: 'BFBFBF' } },
          },
        };
      } else if (rowNum >= 9) {
        // Empty data rows – alternating colors for readability
        const isEven = rowNum % 2 === 0;
        ws[key].s = {
          font: { name: 'Arial', sz: 11, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: isEven ? 'EBF5FB' : 'FFFFFF' } },
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top:    { style: 'thin', color: { rgb: 'BDC3C7' } },
            bottom: { style: 'thin', color: { rgb: 'BDC3C7' } },
            left:   { style: 'thin', color: { rgb: 'BDC3C7' } },
            right:  { style: 'thin', color: { rgb: 'BDC3C7' } },
          },
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tâches Dev');
    XLSX.writeFile(wb, `Template_Taches_Dev_${project.id || 'Projet'}.xlsx`);
  };


  const excelInputRef = React.useRef(null);

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length === 0) {
          showPopup({ title: 'Erreur', message: 'Le fichier Excel est vide.', type: 'error' });
          return;
        }

        // Helper: strip accents for accent-insensitive comparison
        const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

        let headerRowIndex = -1;
        let headers = [];
        let headersNorm = [];
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
          const rowRaw  = (rows[i] || []).map(h => String(h || '').toLowerCase().trim());
          const rowNorm = rowRaw.map(h => norm(h));
          if (rowNorm.some(h => h.includes('objet')) && rowNorm.some(h => h.includes('statut'))) {
            headerRowIndex = i;
            headers     = rowRaw;
            headersNorm = rowNorm;
            break;
          }
        }

        if (headerRowIndex === -1) {
          showPopup({ title: 'Erreur', message: 'La ligne d\'en-têtes (avec la colonne "Objet") est introuvable.', type: 'error' });
          return;
        }

        const objIdx   = headersNorm.findIndex(h => h.includes('objet') || h.includes('tache'));
        const descIdx  = headersNorm.findIndex(h => h.includes('description'));
        const prioIdx  = headersNorm.findIndex(h => h.includes('priorite'));
        const statIdx  = headersNorm.findIndex(h => h.includes('statut'));
        const asgIdx   = headersNorm.findIndex(h => h.includes('assigne') || h.includes('assignation'));
        const dDebIdx  = headersNorm.findIndex(h => h.includes('debut') && (h.includes('reel') || h.includes('date')));
        const dFinRIdx = headersNorm.findIndex(h => h.includes('fin') && h.includes('reel'));
        const dFinPIdx = headersNorm.findIndex(h => h.includes('fin') && (h.includes('prevue') || h.includes('prevu')));
        const solIdx   = headersNorm.findIndex(h => h.includes('solution') || h.includes('resultat'));


        let importedCount = 0;
        let errors = [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          
          if (row.every(cell => !String(cell || '').trim())) continue;

          const objet = String(row[objIdx] || '').trim();
          const description = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
          const rawPriority = prioIdx !== -1 ? String(row[prioIdx] || '').trim() : '';
          const rawStatus = statIdx !== -1 ? String(row[statIdx] || '').trim() : '';
          
          const asgStr = asgIdx !== -1 ? String(row[asgIdx] || '').trim() : '';
          let assigneeId = '';
          if (asgStr) {
            const asgNorm = norm(asgStr);
            const member = teamMembers.find(m => {
              if (!m.user) return false;
              const fullName    = norm(`${m.user.prenom || ''} ${m.user.nom || ''}`);
              const fullNameAlt = norm(`${m.user.nom || ''} ${m.user.prenom || ''}`);
              const userRole    = norm(m.role || m.user.role || '');
              // Match by full name (exact or partial)
              if (fullName    && (fullName === asgNorm    || fullName.includes(asgNorm)    || asgNorm.includes(fullName)))    return true;
              if (fullNameAlt && (fullNameAlt === asgNorm || fullNameAlt.includes(asgNorm) || asgNorm.includes(fullNameAlt))) return true;
              // Match by role
              if (userRole && (userRole === asgNorm || userRole.includes(asgNorm) || asgNorm.includes(userRole))) return true;
              // Match by ID
              if (m.userId.toString() === asgStr) return true;
              return false;
            });
            if (member) assigneeId = member.userId;
          }


          const parseExcelDate = (val) => {
            if (val == null || val === '') return '';
            // Excel serial number (numeric)
            if (typeof val === 'number') {
              try {
                const dateObj = XLSX.SSF.parse_date_code(val);
                if (dateObj) return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
              } catch (e) { return ''; }
            }
            const str = String(val).trim();
            // DD/MM/YYYY  → YYYY-MM-DD
            const dmyMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
            if (dmyMatch) {
              const [, d, m, y] = dmyMatch;
              return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            // MM/DD/YYYY  → YYYY-MM-DD
            const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (mdyMatch) {
              const [, m, d, y] = mdyMatch;
              // if month > 12 it's actually DD/MM – swap
              const month = parseInt(m, 10);
              const day   = parseInt(d, 10);
              if (month > 12) return `${y}-${d.padStart(2,'0')}-${m.padStart(2,'0')}`;
              return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            }
            // Already YYYY-MM-DD or other ISO
            return str;
          };


          const dateDebutReel = dDebIdx !== -1 ? parseExcelDate(row[dDebIdx]) : '';
          const dateFinReel = dFinRIdx !== -1 ? parseExcelDate(row[dFinRIdx]) : '';
          const dateFin = dFinPIdx !== -1 ? parseExcelDate(row[dFinPIdx]) : '';
          const solutionResultat = solIdx !== -1 ? String(row[solIdx] || '').trim() : '';

          let missingFields = [];
          if (!objet) missingFields.push('Objet');
          if (!description) missingFields.push('Description');
          if (!rawPriority) missingFields.push('Priorité');
          if (!rawStatus) missingFields.push('Statut');
          // assigneeId is optional (Non assigné is acceptable)
          if (!dateDebutReel) missingFields.push('Date Début Réel');
          if (!dateFinReel) missingFields.push('Date Fin Réel');
          if (!dateFin) missingFields.push('Date Fin Prévue');

          if (missingFields.length > 0) {
            errors.push(`Ligne ${i + 1} ignorée (Champs manquants : ${missingFields.join(', ')}).`);
            continue; 
          }

          let priority = rawPriority;
          if (priority) {
            const normalized = priority.toLowerCase().trim();
            if (normalized.includes('bass')) priority = 'Basse';
            else if (normalized.includes('moyen')) priority = 'Moyenne';
            else if (normalized.includes('haut')) priority = 'Haute';
            else if (normalized.includes('criti')) priority = 'Critique';
          }

          let status = rawStatus;
          if (status) {
            const normalized = status.toLowerCase().trim();
            if (normalized.includes('cour')) status = 'En cours';
            else if (normalized.includes('fait')) status = 'Fait';
            else if (normalized.includes('clôtur') || normalized.includes('clotur')) status = 'Clôturée';
            else if (normalized.includes('archiv')) status = 'Archivée';
          }

          await addTask({
            projectId: project.id,
            objet,
            description,
            priority,
            status,
            assigneeId,
            dateDebutReel,
            dateFinReel,
            dateFin,
            solutionResultat
          });
          importedCount++;
        }

        if (errors.length > 0) {
          showPopup({ 
            title: 'Importation terminée avec remarques', 
            message: `${importedCount} tâche(s) importée(s).\n\nAnomalies détectées :\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...et autres erreurs.' : ''}`, 
            type: 'warning' 
          });
        } else if (importedCount > 0) {
          showPopup({ title: 'Succès', message: `${importedCount} tâche(s) importée(s) parfaitement sans erreur !`, type: 'success' });
        } else {
          showPopup({ title: 'Attention', message: "Aucune tâche valide n'a été importée.", type: 'warning' });
        }
      } catch (err) {
        console.error(err);
        showPopup({ title: 'Erreur', message: 'Erreur lors de l\'importation du fichier Excel.', type: 'error' });
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };


  
  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(prev => ({
          ...prev,
          attachment: reader.result,
          attachmentName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    await addTask({ ...formData, projectId: project.id });

    if (formData.attachment && formData.attachment.startsWith('data:')) {
      const fileName = formData.attachmentName || `Pièce jointe - Tâche ${formData.objet || 'Nouvelle'}`;
      let format = 'PDF/Fichier';
      if (formData.attachment.includes('image')) format = 'Image';
      else if (formData.attachment.includes('pdf')) format = 'PDF';
      else if (formData.attachment.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) format = 'Word';
      else if (formData.attachment.includes('sheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) format = 'Excel';

      await addDocument({
        projectId: project.id,
        name: fileName,
        type: 'Pièce jointe',
        format: format,
        module: 'Task',
        content: formData.attachment
      });
    }

    setIsModalOpen(false);
    setFormData({ objet: '', description: '', priority: '', assigneeId: '', status: '', dateDebutReel: '', dateFinReel: '', dateFin: '', solutionResultat: '', attachment: '', attachmentName: '', reference: '' });
  };

  const handleTaskAttachmentUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const fileName = file.name || `Pièce jointe - Tâche ${selectedTask.reference || selectedTask.id}`;
      let format = 'PDF/Fichier';
      if (base64.includes('image')) format = 'Image';
      else if (base64.includes('pdf')) format = 'PDF';
      else if (base64.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) format = 'Word';
      else if (base64.includes('sheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) format = 'Excel';

      await updateTask(selectedTask.id, { attachment: base64 });
      setSelectedTask(prev => prev ? { ...prev, attachment: base64 } : null);

      await addDocument({
        projectId: project.id,
        name: fileName,
        type: 'Pièce jointe',
        format: format,
        module: 'Task',
        content: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const getAssigneeName = (id) => {
    if (!id) return 'Non assigné';
    const member = teamMembers.find(m => m.userId?.toString() === id?.toString());
    return member ? `${member.user.prenom} ${member.user.nom}` : id;
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

  const isTesting = ['Testing', 'Fait'].includes(project?.status);
  const isDev = !isTesting && !['Déploiement', 'Utilisation', 'Clôture', 'Clôturée', 'Archive', 'Archivée', 'Terminé'].includes(project?.status);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      
      {/* ─── Header ─── */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tâches de développement</h2>
          <p className="text-slate-500">Gérez les tâches de {project.nom}.</p>
        </div>
        {!isPending && canManageTasks && (
          <div className="flex items-center gap-2 flex-wrap justify-end">

            {isDev && (
              <button
                onClick={handleValidateForTesting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-sm shrink-0"
                title="Valider le développement et passer au Testing"
              >
                <FlaskConical size={18} /> Valider pour Testing
              </button>
            )}

            {/* Single Import/Export button */}
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition-colors shadow-sm shrink-0"
              title="Import / Export Excel"
            >
              <FileSpreadsheet size={18} /> <span className="hidden lg:inline">Import/Export Excel</span>
            </button>

            <input
              type="file"
              accept=".xlsx,.xls"
              ref={excelInputRef}
              onChange={(e) => { handleImportExcel(e); setIsExcelModalOpen(false); }}
              className="hidden"
            />

            <button
              onClick={() => {
                const nextId = projectTasks.length + 1;
                setFormData(prev => ({ ...prev, reference: `TSK-${String(nextId).padStart(3, '0')}` }));
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PlusCircle size={20} /> Nouvelle tâche
            </button>
          </div>
        )}
      </div>

      {/* Banner & Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0 space-y-3">
        {totalTasks > 0 && (
          <>
            <div className="flex justify-between items-center mb-1">
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
          </>
        )}

        {isDev && canManageTasks && (
          <div className={`flex flex-col md:flex-row items-center justify-between gap-3 text-sm font-semibold p-3.5 rounded-xl shadow-sm border ${
            allDone 
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
              : 'text-blue-800 bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {allDone ? (
                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <Clock size={20} className="text-blue-600 shrink-0" />
              )}
              <span>
                {allDone 
                  ? 'Toutes les tâches de développement sont terminées ! Vous pouvez valider pour passer au Testing.'
                  : `Phase Développement en cours (${doneCount}/${totalTasks} tâches terminées). Vous pouvez valider pour passer au Testing.`}
              </span>
            </div>
            <button
              onClick={handleValidateForTesting}
              className={`px-4 py-2 text-white rounded-xl transition-all whitespace-nowrap flex items-center gap-2 shadow-md font-extrabold text-xs shrink-0 ${
                allDone ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FlaskConical size={16} /> Valider & Passer au Testing <ArrowRight size={16} />
            </button>
          </div>
        )}

        {isTesting && (
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 p-3 rounded-xl">
            <FlaskConical size={18} className="text-violet-600 shrink-0" />
            <span>Le projet est en phase <strong>Testing</strong>. Rendez-vous dans l'onglet Tests.</span>
          </div>
        )}
      </div>


      {}
      <div className="flex-1 flex gap-5 overflow-x-auto pb-4">
          {dynamicColumns.map(column => {
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
                    colTasks.map(task => {
                      let percentage = 0;
                      if (['Fait', 'Clôturée', 'Archivée'].includes(task.status)) {
                        percentage = 100;
                      } else if (task.dateDebutReel && task.dateFinReel) {
                        const start = new Date(task.dateDebutReel).getTime();
                        const end = new Date(task.dateFinReel).getTime();
                        const now = new Date().getTime();
                        if (end > start) {
                          const p = Math.round(((now - start) / (end - start)) * 100);
                          percentage = Math.max(0, Math.min(100, p));
                        }
                      }
                      
                      const isLate = task.dateFinReel && (new Date() > new Date(task.dateFinReel)) && !['Fait', 'Clôturée', 'Archivée'].includes(task.status);

                      return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-white p-4 rounded-xl border ${isLate ? 'border-red-300 shadow-sm shadow-red-100' : 'border-slate-200 shadow-sm'} hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{task.reference || task.id?.split('-')[1]?.slice(-4) || ''}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1 leading-tight group-hover:text-blue-600 transition-colors">
                          {task.objet || task.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                        
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Progression</span>
                            <span className="text-[10px] font-bold text-blue-600">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>

                        {isLate && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mb-2 bg-red-50 p-1 rounded">
                            <AlertTriangle size={12} /> EN RETARD
                          </div>
                        )}

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
                    )})
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

      {/* ─── Import/Export Excel Modal ─── */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-emerald-600" /> Import / Export Excel
              </h3>
              <button onClick={() => setIsExcelModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Options */}
            <div className="p-6 flex flex-col gap-4">
              {/* Download Template */}
              <button
                onClick={() => { handleDownloadExcelTemplate(); setIsExcelModalOpen(false); }}
                className="flex items-center gap-4 p-5 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl hover:bg-emerald-100 hover:border-emerald-400 transition-all group text-left"
              >
                <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                  <Download size={24} />
                </div>
                <div>
                  <p className="font-bold text-base">Télécharger le Modèle</p>
                  <p className="text-sm text-emerald-700 mt-0.5">Fichier Excel pré-rempli avec instructions et exemple. Les explications sont incluses dans le fichier.</p>
                </div>
              </button>

              {/* Import */}
              <button
                onClick={() => { excelInputRef.current?.click(); }}
                className="flex items-center gap-4 p-5 bg-blue-50 border-2 border-blue-200 text-blue-800 rounded-2xl hover:bg-blue-100 hover:border-blue-400 transition-all group text-left"
              >
                <div className="p-3 bg-blue-600 text-white rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <div>
                  <p className="font-bold text-base">Importer un Fichier Excel</p>
                  <p className="text-sm text-blue-700 mt-0.5">Chargez un fichier .xlsx rempli pour ajouter des tâches automatiquement.</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setIsExcelModalOpen(false)}
                className="w-full px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date de création</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 bg-slate-100 rounded-xl p-3 outline-none font-medium text-slate-500"
                      value={new Date().toLocaleDateString('fr-FR')}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Référence</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 bg-slate-100 rounded-xl p-3 outline-none font-medium text-slate-500"
                      value={formData.reference || 'Générée automatiquement'}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Objet <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    placeholder="ex: Implémenter la page de connexion..."
                    value={formData.objet}
                    onChange={e => setFormData({ ...formData, objet: e.target.value })}
                    required
                  />
                </div>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Début Réel</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateDebutReel}
                      onChange={e => setFormData({ ...formData, dateDebutReel: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Fin Réel</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateFinReel}
                      onChange={e => setFormData({ ...formData, dateFinReel: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date Fin Prévue</label>
                    <input
                      type="date"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.dateFin}
                      onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                      required
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
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Solution / Résultat</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-sm"
                    placeholder="Quelle est la solution mise en place ?"
                    value={formData.solutionResultat}
                    onChange={e => setFormData({ ...formData, solutionResultat: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pièces jointes</label>
                  <input
                    type="file"
                    className="w-full border border-slate-300 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => handleFileChange(e, setFormData)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Tag size={15} /> Priorité
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="Basse">⬇️ Basse</option>
                      <option value="Moyenne">⏺️ Moyenne</option>
                      <option value="Haute">⬆️ Haute</option>
                      <option value="Critique">🔥 Critique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assigné à</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.assigneeId}
                      onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                      required
                    >
                      <option value="">Non assigné</option>
                      {teamMembers.map(m => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.prenom} {m.user.nom} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Statut</label>
                    <select
                      className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner</option>
                      {dynamicColumns.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))}
                    </select>
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
                disabled={!formData.objet}
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap min-h-[80px]">
                  {selectedTask.description || <em className="text-slate-400">Aucune description.</em>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Référence</h4>
                  <p className="text-sm font-semibold text-slate-800">{selectedTask.reference || '-'}</p>
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
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Fin Prévue</h4>
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

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Solution / Résultat</h4>
                {canMoveTask(selectedTask) ? (
                  <textarea
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                    value={selectedTask.solutionResultat || ''}
                    onChange={e => updateTask(selectedTask.id, { solutionResultat: e.target.value })}
                  />
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap min-h-[80px]">
                    {selectedTask.solutionResultat || <em className="text-slate-400">Aucun résultat.</em>}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pièces jointes</h4>
                {selectedTask.attachment ? (
                  <div className="mb-2">
                    <a href={selectedTask.attachment} download={`piece-jointe-${selectedTask.id}`} className="text-blue-600 hover:underline text-sm font-semibold inline-flex items-center gap-2">
                      <Download size={16} /> Télécharger la pièce jointe
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mb-2">Aucune pièce jointe.</p>
                )}
                {canMoveTask(selectedTask) && (
                  <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Ajouter / Modifier la pièce jointe</label>
                    <input
                      type="file"
                      className="w-full text-xs border border-slate-300 bg-white rounded-lg p-1.5 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={handleTaskAttachmentUpload}
                    />
                  </div>
                )}
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
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedTask.status || ''}
                      onChange={e => handleStatusChange(selectedTask.id, e.target.value)}
                    >
                      {dynamicColumns.map(col => (
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
