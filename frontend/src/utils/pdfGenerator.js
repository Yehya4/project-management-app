import { jsPDF } from 'jspdf';

export const generateDemandePDF = (demande, shouldSave = true) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const startX = 20;
      let y = 20;
      
      
      const drawCheckbox = (text, isChecked, x, currentY) => {
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.text(text, x, currentY);
        const textWidth = doc.getTextWidth(text);
        const boxX = x + textWidth + 2;
        const boxY = currentY - 3;
        const boxSize = 4;
        
        doc.setLineWidth(0.2);
        doc.rect(boxX, boxY, boxSize, boxSize);
        if (isChecked) {
          doc.setLineWidth(0.4);
          doc.line(boxX + 0.5, boxY + 0.5, boxX + boxSize - 0.5, boxY + boxSize - 0.5);
          doc.line(boxX + boxSize - 0.5, boxY + 0.5, boxX + 0.5, boxY + boxSize - 0.5);
        }
        return boxX + boxSize + 5; 
      };

      const checkPageBreak = (requiredSpace) => {
        if (y + requiredSpace > 280) {
          doc.addPage();
          y = 20;
        }
      };

      
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      
      
      doc.text('Demande de Projet', startX, y);
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(`Date : ${demande.dateCreation || new Date().toLocaleDateString('fr-FR')}`, 140, y);
      
      y += 15;
      
      
      doc.setFont('times', 'bold');
      doc.text('Entité:', startX, y);
      y += 7;
      doc.setFont('times', 'normal');
      doc.text(`- Nom du demandeur: ${demande.nomDemandeur || 'Non spécifié'}`, startX + 5, y);
      y += 6;
      doc.text(`- Fonction: ${demande.fonction || ''}`, startX + 5, y);
      
      y += 12;
      
      
      doc.setFont('times', 'bold');
      doc.text('Domaines concernés: (cochez les cases concernées)', startX, y);
      y += 6;
      
      const allDomaines = [
        'Commercial', 'Atelier', 'Magasin', 'Gestion', 
        'Marketing', 'Logistique', 'Finance', 'Audit/Contrôle', 'Ressources Humaines'
      ];
      
      let currentX = startX;
      allDomaines.forEach((domaine, index) => {
        const isChecked = Array.isArray(demande.domaines) && demande.domaines.includes(domaine);
        
        if (currentX > 150) {
          y += 6;
          currentX = startX;
        }
        currentX = drawCheckbox(domaine, isChecked, currentX, y);
        currentX += 5; 
      });
      
      y += 12;
      checkPageBreak(30);
      
      
      doc.setFont('times', 'bold');
      doc.text('Contexte du Projet (Problèmes à résoudre)', startX, y);
      y += 3;
      doc.setLineWidth(0.5);
      doc.line(startX, y, 190, y);
      y += 8;
      
      doc.setFont('times', 'normal');
      const contexteLines = doc.splitTextToSize(demande.contexte || 'Non spécifié', 160);
      doc.text(contexteLines, startX + 10, y);
      y += (contexteLines.length * 6) + 4;
      doc.line(startX, y, 190, y);
      
      y += 12;
      checkPageBreak(30);
      
      
      doc.setFont('times', 'bold');
      doc.text('Description du besoin (Les exigences)', startX, y);
      y += 3;
      doc.line(startX, y, 190, y);
      y += 8;
      
      doc.setFont('times', 'normal');
      const descLines = doc.splitTextToSize(demande.description || 'Non spécifié', 160);
      doc.text(descLines, startX + 10, y);
      y += (descLines.length * 6) + 4;
      doc.line(startX, y, 190, y);
      
      y += 12;
      checkPageBreak(20);
      
      
      doc.setFont('times', 'bold');
      doc.text('Nature du besoin: (cochez les cases concernées)', startX, y);
      y += 6;
      
      const allNatures = ['Réglementaire', 'Amélioration satisfaction client', 'Amélioration fonctionnement'];
      currentX = startX;
      allNatures.forEach((nature) => {
        const isChecked = Array.isArray(demande.natureBesoin) && demande.natureBesoin.includes(nature);
        if (currentX > 140) {
          y += 6;
          currentX = startX;
        }
        currentX = drawCheckbox(nature, isChecked, currentX, y);
        currentX += 8;
      });
      
      y += 12;
      checkPageBreak(20);
      
      
      doc.setFont('times', 'bold');
      doc.text('Bénéfices escomptés: (cochez les cases concernées)', startX, y);
      y += 6;
      
      const allBenefices = ['Diminution des Coûts', 'Améliorations des Performances', 'Réduction des Risques', 'Conformité'];
      currentX = startX;
      allBenefices.forEach((benefice) => {
        const isChecked = Array.isArray(demande.benefices) && demande.benefices.includes(benefice);
        if (currentX > 150) {
          y += 6;
          currentX = startX;
        }
        currentX = drawCheckbox(benefice, isChecked, currentX, y);
        currentX += 8;
      });
      
      y += 15;
      checkPageBreak(20);
      
      
      doc.setFont('times', 'bold');
      doc.text('Délai souhaité:', startX, y);
      doc.setFont('times', 'normal');
      const delai = demande.delaiSouhaite ? new Date(demande.delaiSouhaite).toLocaleDateString('fr-FR') : 'Non spécifié';
      doc.text(delai, startX + 30, y);
      
      y += 15;
      checkPageBreak(15);
      
      
      doc.setFont('times', 'bold');
      doc.text('Demande révisée et validée par responsable de l\'entité?: ', startX, y);
      
      
      const isValidee = demande.statut === 'Validée' || demande.statut === 'Acceptée';
      const isRefusee = demande.statut === 'Refusée';
      
      let validateX = startX + 115;
      validateX = drawCheckbox('Oui', isValidee, validateX, y);
      validateX += 10;
      drawCheckbox('Non', isRefusee, validateX, y);
      
      
      if (shouldSave) {
        doc.save(`Demande_SI_${demande.id}.pdf`);
        resolve();
      } else {
        resolve(doc.output('bloburl'));
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      reject(error);
    }
  });
};

export const generateCharterPDF = (charter, demande, shouldSave = true) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      let y = 20;
      const startX = 20;

      const checkPageBreak = (requiredSpace) => {
        if (y + requiredSpace > 280) {
          doc.addPage();
          y = 20;
        }
      };

      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.text('Project Charter', startX, y);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(`Projet : ${charter.titre || demande.nomProjet || 'Non spécifié'}`, startX, y + 10);
      doc.text(`Statut : ${charter.statut || 'Brouillon'}`, startX, y + 16);
      
      y += 30;

      const sections = [
        { title: 'Contexte et Justification', content: charter.contexte },
        { title: 'Objectifs du Projet', content: charter.objectifs },
        { title: 'Périmètre Inclus', content: charter.perimetreInclus },
        { title: 'Périmètre Exclu', content: charter.perimetreExclu },
        { title: 'Principaux Risques', content: charter.risques },
        { title: 'Critères de Succès', content: charter.criteresSucces }
      ];

      sections.forEach(sec => {
        checkPageBreak(30);
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text(sec.title, startX, y);
        y += 6;
        
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(sec.content || 'Non spécifié', 170);
        doc.text(lines, startX + 5, y);
        y += (lines.length * 6) + 6;
      });

      checkPageBreak(40);
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('Organisation et Acteurs', startX, y);
      y += 8;

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(`Sponsor Métier : ${charter.sponsorMetier || ''}`, startX + 5, y);
      y += 6;
      doc.text(`Chef de Projet Métier : ${charter.chefProjetMetier || ''}`, startX + 5, y);
      y += 6;
      doc.text(`Sponsor IT : ${charter.sponsorIT || ''}`, startX + 5, y);
      y += 6;
      doc.text(`Chef de Projet IT : ${charter.chefProjetIT || ''}`, startX + 5, y);
      
      if (shouldSave) {
        doc.save(`Project_Charter_${demande?.id || 'doc'}.pdf`);
        resolve();
      } else {
        resolve(doc.output('bloburl'));
      }
    } catch (error) {
      console.error('Erreur génération charte PDF:', error);
      reject(error);
    }
  });
};

export const generateFilePreviewPDF = (fileName, docType, projectName) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(`Aperçu : ${docType}`, 20, 20);
  doc.setFontSize(12);
  doc.text(`Projet : ${projectName}`, 20, 30);
  doc.text(`Fichier d'origine : ${fileName}`, 20, 38);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(`Ceci est un aperçu généré du document "${fileName}".`, 20, 55);
  doc.text(`Dans un environnement réel, ce document serait stocké de manière sécurisée`, 20, 62);
  doc.text(`sur le serveur et son contenu réel serait affiché ici.`, 20, 69);
  
  return doc.output('bloburl');
};
