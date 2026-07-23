import * as XLSX from 'xlsx';

/**
 * Génère et télécharge un fichier Excel (.xlsx) pour un cas de test individuel.
 * Si shouldSave est false, renvoie une URL data: base64 du fichier Excel.
 */
export const generateTestCaseExcel = (tc, projectName = '', shouldSave = true) => {
  const testCase = tc || {};
  const titleRow = [`Fiche Cas de Test - ${testCase.testCaseId || testCase.id || 'TC'} (${projectName || 'Projet'})`, '', '', '', '', '', '', '', '', '', ''];
  const headerRow = [
    "ID Cas de Test",
    "Nom du Test",
    "Description",
    "Résultat Attendu",
    "Résultat Réel",
    "Statut",
    "Commentaire",
    "Affecté à",
    "Profil",
    "Rubrique",
    "Pièce Jointe"
  ];

  const dataRow = [
    testCase.testCaseId || testCase.id || 'TC',
    testCase.testName || testCase.name || 'Cas de Test',
    testCase.description || '',
    testCase.expectedResult || '',
    testCase.actualResult || '',
    testCase.status || 'En attente',
    testCase.comment || '',
    testCase.assignedTo || '',
    testCase.profile || '',
    testCase.rubrique || '',
    testCase.attachment ? 'Présente' : 'Aucune'
  ];

  const aoa = [titleRow, headerRow, dataRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

  ws['!cols'] = [
    { wch: 18 }, // ID
    { wch: 30 }, // Nom du test
    { wch: 40 }, // Description
    { wch: 30 }, // Résultat attendu
    { wch: 30 }, // Résultat réel
    { wch: 15 }, // Statut
    { wch: 25 }, // Commentaire
    { wch: 20 }, // Affecté à
    { wch: 20 }, // Profil
    { wch: 20 }, // Rubrique
    { wch: 15 }  // Pièce jointe
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cas de Test");

  const fileName = `Cas_De_Test_${testCase.testCaseId || testCase.id || 'export'}.xlsx`;

  if (shouldSave) {
    XLSX.writeFile(wb, fileName);
    return true;
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
  }
};

/**
 * Génère et télécharge un fichier Excel (.xlsx) contenant l'ensemble des cas de test du projet.
 */
export const generateAllTestCasesExcel = (testCases = [], projectName = '', shouldSave = true) => {
  const titleRow = [`Cas de Test du Projet - ${projectName || 'Projet'}`, '', '', '', '', '', '', '', '', '', ''];
  const headerRow = [
    "ID Cas de Test",
    "Nom du Test",
    "Description",
    "Résultat Attendu",
    "Résultat Réel",
    "Statut",
    "Commentaire",
    "Affecté à",
    "Profil",
    "Rubrique",
    "Pièce Jointe"
  ];

  const dataRows = (testCases || []).map(tc => [
    tc.testCaseId || tc.id || '',
    tc.testName || tc.name || '',
    tc.description || '',
    tc.expectedResult || '',
    tc.actualResult || '',
    tc.status || 'En attente',
    tc.comment || '',
    tc.assignedTo || '',
    tc.profile || '',
    tc.rubrique || '',
    tc.attachment ? 'Oui' : 'Non'
  ]);

  const aoa = [titleRow, headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });

  ws['!cols'] = [
    { wch: 18 },
    { wch: 30 },
    { wch: 40 },
    { wch: 30 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tous les Cas de Test");

  const fileName = `Cas_De_Test_${projectName || 'Projet'}.xlsx`;

  if (shouldSave) {
    XLSX.writeFile(wb, fileName);
    return true;
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    return 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
  }
};
