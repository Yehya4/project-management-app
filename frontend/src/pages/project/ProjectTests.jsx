import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useTestCases, useTeam, useAuth, useProjects, useDocuments, usePopup } from '../../context/AppContext';
import {
  Plus,
  FlaskConical,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Edit2,
  Trash2,
  Play,
  X,
  MessageSquare,
  User,
  Calendar,
  Download,
  Upload
} from 'lucide-react';

const ProjectTests = () => {
  const { project, isPending } = useOutletContext();
  const { user } = useAuth();
  const { getTeamByProjectId } = useTeam();
  const { updateProject } = useProjects();
  const { addDocument } = useDocuments();
  const { showPopup, showConfirm } = usePopup();
  const {
    testCases,
    fetchTestCases,
    addTestCase,
    updateTestCase,
    updateTestCaseStatus,
    deleteTestCase
  } = useTestCases();

  const teamMembers = getTeamByProjectId(project?.id) || [];


  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRunOpen, setIsRunOpen] = useState(false);

  const fileInputRef = useRef(null);

  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [formData, setFormData] = useState({
    testCaseId: '',
    testName: '',
    description: '',
    expectedResult: '',
    actualResult: '',
    profile: '',
    rubrique: '',
    assignedTo: '',
    attachment: ''
  });

  const [runData, setRunData] = useState({
    status: 'Réussite',
    comment: '',
    actualResult: ''
  });


  useEffect(() => {
    if (project?.id) {
      fetchTestCases(project.id);
    }
  }, [project?.id]);


  const isAdmin = user?.role === 'Admin';
  const isPM = user?.role === 'Project Manager';
  const isSponsor = user?.role === 'Sponsor';
  const isProjectChef = project?.chefProjet &&
    (`${user?.prenom || ''} ${user?.nom || ''}`.trim() === project.chefProjet);

  const isAssignedDev = teamMembers.some(
    m => m.userId.toString() === user?.id?.toString() &&
      (m.role === 'Développeur' || m.role === 'Tech Lead')
  );

  const isAssignedTester = teamMembers.some(
    m => m.userId.toString() === user?.id?.toString() &&
      m.role === 'QA / Testeur'
  );

  const isChefTesteur = user?.role === 'Chef Testeur' || teamMembers.some(
    m => m.userId.toString() === user?.id?.toString() && m.role === 'Chef Testeur'
  );


  const canCreateTest = isAdmin || isPM || isSponsor || isProjectChef || isAssignedDev || isChefTesteur;

  const canRunTest = isAssignedTester || isAdmin || isPM || isSponsor || isProjectChef || isChefTesteur;


  const allTestsPassed = testCases.length > 0 && testCases.every(t => t.status === 'Réussite');


  const filteredTests = testCases.filter(t => {
    const matchesSearch =
      t.testCaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.testName && t.testName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.expectedResult.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'Tous') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });


  const totalCount = testCases.length;
  const pendingCount = testCases.filter(t => t.status === 'En attente').length;
  const successCount = testCases.filter(t => t.status === 'Réussite').length;
  const failCount = testCases.filter(t => t.status === 'Non Réussite').length;
  const executionRate = totalCount > 0 ? Math.round(((totalCount - pendingCount) / totalCount) * 100) : 0;
  const successRate = (totalCount - pendingCount) > 0 ? Math.round((successCount / (totalCount - pendingCount)) * 100) : 0;


  const handleOpenCreateForm = () => {

    const nextNumber = testCases.length + 1;
    const suggestedId = `TC-${String(nextNumber).padStart(3, '0')}`;

    setSelectedTestCase(null);
    setFormData({
      testCaseId: suggestedId,
      testName: '',
      description: '',
      expectedResult: '',
      actualResult: '',
      profile: '',
      rubrique: '',
      assignedTo: '',
      attachment: ''
    });
    setIsFormOpen(true);
  };

  const handleExportExcel = () => {

    const titleRow = [`Cas de test - ${project?.nom || 'Projet'}`, '', '', '', '', '', '', '', '', '', ''];
    const headerRow = ["ID", "Cas de test", "Description", "Résultat attendu", "Résultat réel", "Statut", "Commentaire", "Affecté à", "Profil", "Rubrique", "Pièce jointe"];


    const dataRows = testCases.map(tc => [
      tc.testCaseId,
      tc.testName,
      tc.description,
      tc.expectedResult,
      tc.actualResult || '',
      tc.status,
      tc.comment || '',
      tc.assignedTo || '',
      tc.profile || '',
      tc.rubrique || '',
      tc.attachment ? 'Fichier joint' : ''
    ]);


    const aoa = [titleRow, headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);


    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } });


    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 30 }, // Cas de test
      { wch: 40 }, // Description
      { wch: 30 }, // Résultat attendu
      { wch: 30 }, // Résultat réel
      { wch: 15 }, // Statut
      { wch: 25 }, // commentaire
      { wch: 20 }, // Affecté à
      { wch: 20 }, // Profil
      { wch: 20 }, // Rubrique
      { wch: 15 }  // Pièce jointe
    ];


    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cas de Test");
    
    // Save to documents before writing file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const contentStr = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
    addDocument({
      projectId: project.id,
      name: `Tests_${project?.nom || 'Projet'}.xlsx`,
      type: 'Export',
      format: 'Excel',
      module: 'TestCase',
      content: contentStr
    });

    XLSX.writeFile(wb, `Tests_${project?.nom || 'Projet'}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Convert to base64 to save as project document
    const base64Reader = new FileReader();
    base64Reader.onloadend = () => {
      addDocument({
        projectId: project.id,
        name: `Import_${file.name}`,
        type: 'Import',
        format: 'Excel',
        module: 'TestCase',
        content: base64Reader.result
      });
    };
    base64Reader.readAsDataURL(file);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        let totalImportedCount = 0;


        for (const wsname of wb.SheetNames) {
          const ws = wb.Sheets[wsname];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

          if (rows.length === 0) continue;

          let headerRowIndex = -1;
          let colMap = {};


          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;

            const rowStr = row.map(cell => String(cell || '').toLowerCase().trim());

            if (rowStr.includes('description') || rowStr.includes('cas de test') || rowStr.includes('nom du test')) {
              headerRowIndex = i;
              rowStr.forEach((colName, index) => {
                if (colName === 'id' || colName === 'id du cas') colMap.id = index;
                if (colName === 'cas de test' || colName === 'objet' || colName === 'nom' || colName === 'nom cas de test') colMap.name = index;
                if (colName === 'profil' || colName === 'profile') colMap.profile = index;
                if (colName === 'description') colMap.description = index;
                if (colName === 'résultat attendu' || colName === 'resultat attendu') colMap.expected = index;
                if (colName === 'résultat réel' || colName === 'resultat reel') colMap.actual = index;
                if (colName === 'statut' || colName === 'status') colMap.status = index;
                if (colName === 'rubrique') colMap.rubrique = index;
                if (colName === 'commentaire' || colName === 'comment') colMap.comment = index;
                if (colName === 'testeur' || colName === 'tester') colMap.tester = index;
                if (colName === 'pièce jointe' || colName === 'piece jointe') colMap.attachment = index;
                if (colName === 'affecté à' || colName === 'affecte a' || colName === 'assigned to') colMap.assignedTo = index;
              });
              break;
            }
          }

          if (headerRowIndex === -1 || (colMap.description === undefined && colMap.name === undefined)) {
            continue; // Passer à la feuille suivante si aucun en-tête trouvé
          }


          let currentProfile = wsname;
          let currentRubrique = '';

          for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row) || row.length === 0) continue;

            const idVal = colMap.id !== undefined ? String(row[colMap.id] || '').trim() : '';
            const nameVal = colMap.name !== undefined ? String(row[colMap.name] || '').trim() : '';
            const descVal = colMap.description !== undefined ? String(row[colMap.description] || '').trim() : '';

            // Détecter une ligne de "Rubrique" (titre fusionné ou une seule cellule remplie sur toute la ligne)
            const allVals = row.map(cell => String(cell || '').trim()).filter(Boolean);
            if (allVals.length === 1) {
              currentRubrique = allVals[0];
              continue; // On ne crée pas de cas de test pour cette ligne
            }

            if (nameVal || descVal) {
              const explicitProfile = colMap.profile !== undefined ? String(row[colMap.profile] || '').trim() : '';
              const explicitRubrique = colMap.rubrique !== undefined ? String(row[colMap.rubrique] || '').trim() : '';

              await addTestCase({
                projectId: project.id,
                testCaseId: idVal || `TC-${Date.now()}-${totalImportedCount}`,
                testName: nameVal || 'Test importé',
                description: descVal || 'Aucune description fournie',
                expectedResult: colMap.expected !== undefined ? String(row[colMap.expected] || '').trim() : '',
                actualResult: colMap.actual !== undefined ? String(row[colMap.actual] || '').trim() : '',
                status: colMap.status !== undefined && row[colMap.status] ? String(row[colMap.status]).trim() : 'En attente',
                comment: colMap.comment !== undefined ? String(row[colMap.comment] || '').trim() : '',
                profile: explicitProfile || currentProfile,
                rubrique: explicitRubrique || currentRubrique,
                assignedTo: colMap.assignedTo !== undefined ? String(row[colMap.assignedTo] || '').trim() : ''
              });
              totalImportedCount++;
            }
          }
        }

        if (totalImportedCount === 0) {
          showPopup({
            title: "Importation échouée",
            message: "Aucun cas de test valide trouvé. Vérifiez que votre fichier contient au moins les colonnes 'Cas de test', 'Nom du test' ou 'Description' dans l'une de ses feuilles.",
            type: "warning"
          });
        } else {
          showPopup({
            title: "Succès",
            message: `${totalImportedCount} cas de test importé(s) avec succès.`,
            type: "success"
          });
        }
      } catch (error) {
        console.error('Erreur import Excel:', error);
        showPopup({
          title: "Erreur",
          message: "Impossible de lire ce fichier Excel. Veuillez vérifier qu'il n'est pas corrompu et qu'il correspond au format attendu.",
          type: "error"
        });
      } finally {
        e.target.value = null; // reset
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleOpenEditForm = (tc) => {
    setSelectedTestCase(tc);
    setFormData({
      testCaseId: tc.testCaseId,
      testName: tc.testName || '',
      description: tc.description,
      expectedResult: tc.expectedResult,
      actualResult: tc.actualResult || '',
      profile: tc.profile || '',
      rubrique: tc.rubrique || '',
      assignedTo: tc.assignedTo || '',
      attachment: tc.attachment || '',
      attachmentName: ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.testCaseId || !formData.testName || !formData.description || !formData.expectedResult) return;

    if (selectedTestCase) {
      await updateTestCase(selectedTestCase.id, formData);
    } else {
      await addTestCase({
        ...formData,
        projectId: project.id
      });
    }

    if (formData.attachment && formData.attachment.startsWith('data:')) {
      const fileName = formData.attachmentName || `Pièce jointe - Cas de test ${formData.testCaseId}`;
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
        module: 'TestCase',
        content: formData.attachment
      });
    }

    setIsFormOpen(false);
  };

  const handleOpenRunDialog = (tc) => {
    setSelectedTestCase(tc);
    setRunData({
      status: tc.status === 'En attente' ? 'Réussite' : tc.status,
      comment: tc.comment || '',
      actualResult: tc.actualResult || ''
    });
    setIsRunOpen(true);
  };

  const handleRunSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTestCase) return;

    if (runData.status === 'Non Réussite' && !runData.comment.trim()) {
      showPopup({
        title: "Commentaire requis",
        message: "Un commentaire est obligatoire lorsque le test échoue.",
        type: "warning"
      });
      return;
    }

    const testerId = user.id;
    const testerName = `${user.prenom || ''} ${user.nom || ''}`.trim();

    await updateTestCaseStatus(
      selectedTestCase.id,
      runData.status,
      runData.comment,
      testerId,
      testerName,
      runData.actualResult
    );

    setIsRunOpen(false);
  };

  const handleDeleteClick = async (id) => {
    showConfirm({
      title: "Supprimer le cas de test ?",
      message: "Êtes-vous sûr de vouloir supprimer ce cas de test ? Cette action est irréversible.",
      type: "error",
      onConfirm: async () => {
        await deleteTestCase(id);
      }
    });
  };

  return (
    <div className="space-y-6">
      { }
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-blue-600" size={24} />
            Cas de Test du Projet
          </h2>
          <p className="text-slate-500">Définissez et validez la qualité technique de {project?.nom}.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
          >
            <Upload size={18} />
            <span className="hidden md:inline">Importer</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
          >
            <Download size={18} />
            <span className="hidden md:inline">Exporter</span>
          </button>
          {!isPending && canCreateTest && (
            <button
              onClick={handleOpenCreateForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Créer</span>
            </button>
          )}
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        { }
        {allTestsPassed && project?.status === 'Testing' && (
          <div className="md:col-span-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0"><CheckCircle2 size={20} /></div>
              <div>
                <p className="font-bold text-emerald-900">Tous les tests sont réussis !</p>
                <p className="text-emerald-700 text-sm">En attente de la validation du Chef Testeur pour passer au Déploiement.</p>
              </div>
            </div>
            {isChefTesteur && (
              <button
                onClick={() => updateProject(project.id, { status: 'Déploiement', progress: 90 })}
                className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-sm whitespace-nowrap"
              >
                Valider pour Déploiement
              </button>
            )}
          </div>
        )}

        { }
        {failCount > 0 && (
          <div className="md:col-span-4 bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3">
            <XCircle size={20} className="text-rose-600 shrink-0" />
            <p className="text-rose-800 text-sm font-semibold">
              {failCount} test(s) en échec — Les testeurs doivent corriger et relancer les tests.
            </p>
          </div>
        )}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total cas de test</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalCount}</span>
            <span className="text-slate-400 text-xs">sur le projet</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">En Attente</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-extrabold text-amber-500">{pendingCount}</span>
            <span className="text-slate-400 text-xs">{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}% du total</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Réussite</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{successCount}</span>
            <span className="text-slate-400 text-xs">{successRate}% de réussite</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider font-semibold">Non Réussite / Échecs</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-extrabold text-rose-600">{failCount}</span>
            <span className="text-slate-400 text-xs">Exécutés : {executionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (failCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      { }
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par ID, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['Tous', 'En attente', 'Réussite', 'Non Réussite'].map((filter) => {
            const getButtonClass = (isActive) => {
              if (isActive) {
                switch (filter) {
                  case 'Réussite': return 'bg-emerald-600 text-white shadow-sm';
                  case 'Non Réussite': return 'bg-rose-600 text-white shadow-sm';
                  case 'En attente': return 'bg-amber-500 text-white shadow-sm';
                  default: return 'bg-blue-600 text-white shadow-sm';
                }
              }
              return 'bg-slate-100 hover:bg-slate-200 text-slate-600';
            };

            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${getButtonClass(statusFilter === filter)}`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      { }
      <div className="space-y-4">
        {filteredTests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
            <FlaskConical className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700">Aucun cas de test trouvé</h3>
            <p className="text-slate-400 mt-1">Modifiez les filtres de recherche ou créez un nouveau cas de test.</p>
            {canCreateTest && (
              <button
                onClick={handleOpenCreateForm}
                className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-bold rounded-xl text-sm"
              >
                Créer mon premier test
              </button>
            )}
          </div>
        ) : (
          filteredTests.map((tc) => {
            const getStatusStyle = (status) => {
              switch (status) {
                case 'Réussite':
                  return {
                    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
                    cardBorder: 'border-l-4 border-l-emerald-500 border-y-slate-200 border-r-slate-200',
                    icon: <CheckCircle2 size={16} className="text-emerald-500" />
                  };
                case 'Non Réussite':
                  return {
                    badge: 'bg-rose-100 text-rose-700 border border-rose-200',
                    cardBorder: 'border-l-4 border-l-rose-500 border-y-slate-200 border-r-slate-200',
                    icon: <XCircle size={16} className="text-rose-500" />
                  };
                default:
                  return {
                    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
                    cardBorder: 'border-l-4 border-l-slate-400 border-y-slate-200 border-r-slate-200',
                    icon: <HelpCircle size={16} className="text-slate-500" />
                  };
              }
            };

            const styles = getStatusStyle(tc.status);

            return (
              <div
                key={tc.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6 ${styles.cardBorder}`}
              >
                <div className="flex-1 space-y-4">
                  { }
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg shadow-sm">
                      {tc.testCaseId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${styles.badge}`}>
                      {styles.icon}
                      {tc.status}
                    </span>
                  </div>

                  {/* Test Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cas de test</h4>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed">{tc.testName || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profil</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{tc.profile || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rubrique</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{tc.rubrique || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{tc.description || <span className="italic text-slate-400">Non renseignée</span>}</p>
                    </div>
                    <div className="md:col-span-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Résultat attendu</h4>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{tc.expectedResult || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    </div>
                    <div className="md:col-span-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Résultat Réel</h4>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{tc.actualResult || <span className="italic text-slate-400">Non renseigné</span>}</p>
                    </div>
                  </div>

                  { }
                  {tc.status !== 'En attente' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 space-y-2">
                      <div className="flex items-center gap-6 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          Testeur : <strong className="text-slate-700">{tc.testerName || 'Inconnu'}</strong>
                        </span>
                        {tc.updatedAt && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            Date : <strong className="text-slate-700">{new Date(tc.updatedAt).toLocaleDateString('fr-FR')} {new Date(tc.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>
                          </span>
                        )}
                        {tc.assignedTo && (
                          <span className="flex items-center gap-1.5">
                            <User size={14} className="text-blue-400" />
                            Affecté à : <strong className="text-slate-700">{tc.assignedTo}</strong>
                          </span>
                        )}
                        {tc.attachment && (
                          <span className="flex items-center gap-1.5 cursor-pointer text-blue-600 hover:underline" onClick={() => {
                            const newWindow = window.open();
                            newWindow.document.write(`<iframe src="${tc.attachment}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                          }}>
                            Fichier joint
                          </span>
                        )}
                      </div>
                      {tc.comment && (
                        <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                          <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <span>
                            Commentaire : <span className="italic text-slate-700 font-medium">"{tc.comment}"</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                { }
                <div className="flex md:flex-col justify-end items-center gap-2 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 shrink-0">
                  {canRunTest && (
                    <button
                      onClick={() => handleOpenRunDialog(tc)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition-colors shadow-sm w-full md:w-auto"
                    >
                      <Play size={12} fill="white" />
                      Lancer le test
                    </button>
                  )}

                  <div className="flex gap-1.5 w-full md:w-auto justify-end">
                    {canCreateTest && (
                      <>
                        <button
                          onClick={() => handleOpenEditForm(tc)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tc.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      { }
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            { }
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedTestCase ? 'Modifier le cas de test' : 'Créer un cas de test'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            { }
            <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">

                {/* Section Informations générales */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    Informations générales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        ID du cas *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: TC-001"
                        value={formData.testCaseId}
                        onChange={(e) => setFormData(prev => ({ ...prev, testCaseId: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Cas de test *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Connexion OAuth2"
                        value={formData.testName}
                        onChange={(e) => setFormData(prev => ({ ...prev, testName: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Profil
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Smoke, Régression"
                        value={formData.profile}
                        onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Rubrique
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Authentification"
                        value={formData.rubrique}
                        onChange={(e) => setFormData(prev => ({ ...prev, rubrique: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Description & Résultats */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    Détails et Résultats
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Décrivez les étapes ou conditions du test..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Résultat attendu *
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Quel est le comportement attendu en cas de succès ?"
                      value={formData.expectedResult}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedResult: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-emerald-50/30 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Résultat Réel
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Quel a été le comportement observé ?"
                      value={formData.actualResult}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualResult: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Section Pièce Jointe */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    Pièces jointes
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pièce jointe (Optionnel)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData(prev => ({
                                ...prev,
                                attachment: reader.result,
                                attachmentName: file.name
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {formData.attachment && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, attachment: '' }))}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors border border-rose-100"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
                >
                  {selectedTestCase ? 'Enregistrer les modifications' : 'Créer le test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      { }
      {isRunOpen && selectedTestCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            { }
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Exécuter le test</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedTestCase.testCaseId} - {selectedTestCase.testName}</p>
              </div>
              <button
                onClick={() => setIsRunOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            { }
            <form onSubmit={handleRunSubmit} className="p-6 space-y-5">
              { }
              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-100">
                <p className="text-slate-700">
                  <strong className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Description</strong>
                  {selectedTestCase.description}
                </p>
                <p className="text-slate-700">
                  <strong className="text-slate-500 font-bold uppercase tracking-wider block text-[10px] mb-0.5">Résultat attendu</strong>
                  {selectedTestCase.expectedResult}
                </p>
              </div>

              { }
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Résultat de l'exécution *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRunData(prev => ({ ...prev, status: 'Réussite' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${runData.status === 'Réussite'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <CheckCircle2 size={18} className={runData.status === 'Réussite' ? 'text-emerald-600' : 'text-slate-400'} />
                    Réussite
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunData(prev => ({ ...prev, status: 'Non Réussite' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${runData.status === 'Non Réussite'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm ring-1 ring-rose-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <XCircle size={18} className={runData.status === 'Non Réussite' ? 'text-rose-600' : 'text-slate-400'} />
                    Non Réussite
                  </button>
                </div>
              </div>

              { }
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Résultat Réel
                </label>
                <textarea
                  rows={2}
                  placeholder="Quel a été le comportement observé lors du test ?"
                  value={runData.actualResult}
                  onChange={(e) => setRunData(prev => ({ ...prev, actualResult: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Commentaires / Détails {runData.status === 'Non Réussite' ? '*' : '(Optionnel)'}
                </label>
                <textarea
                  required={runData.status === 'Non Réussite'}
                  rows={3}
                  placeholder={runData.status === 'Non Réussite' ? "Expliquez obligatoirement pourquoi le test a échoué..." : "Expliquez pourquoi le test a réussi (optionnel)..."}
                  value={runData.comment}
                  onChange={(e) => setRunData(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                />
              </div>

              { }
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRunOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold transition-colors text-sm shadow-sm ${runData.status === 'Réussite'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTests;
