const testCaseService = require('../services/testCaseService');

class TestCaseController {
    async getByProject(req, res) {
        try {
            const { projectId } = req.params;
            if (!projectId) {
                return res.status(400).json({ message: 'L\'ID du projet est requis.' });
            }
            const testCases = await testCaseService.getByProjectId(projectId);
            return res.json(testCases);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des cas de test.' });
        }
    }

    async create(req, res) {
        try {
            const { projectId, testCaseId, testName, description, expectedResult, actualResult, status, comment, assignedTo, attachment, profile, rubrique } = req.body;
            if (!projectId || !testCaseId || !testName || !description || !expectedResult) {
                return res.status(400).json({ message: 'Champs obligatoires manquants.' });
            }

            const io = req.app.get('io');
            const testCase = await testCaseService.create({
                projectId,
                testCaseId,
                testName,
                description,
                expectedResult,
                actualResult,
                status,
                comment,
                assignedTo,
                attachment,
                profile,
                rubrique
            }, io);

            return res.status(201).json(testCase);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la création du cas de test.' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { testCaseId, testName, description, expectedResult, actualResult, assignedTo, attachment, profile, rubrique } = req.body;
            if (!testCaseId || !testName || !description || !expectedResult) {
                return res.status(400).json({ message: 'Champs obligatoires manquants.' });
            }

            const io = req.app.get('io');
            const testCase = await testCaseService.update(id, { testCaseId, testName, description, expectedResult, actualResult, assignedTo, attachment, profile, rubrique }, io);
            return res.json(testCase);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la mise à jour du cas de test.' });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, comment, actualResult } = req.body;
            const testerId = req.user?.id || req.body.testerId;
            let testerName = '';

            if (req.user && (req.user.prenom || req.user.nom)) {
                testerName = `${req.user.prenom || ''} ${req.user.nom || ''}`.trim();
            } else if (req.body.testerName) {
                testerName = req.body.testerName;
            } else if (req.user?.id) {
                try {
                    const userService = require('../services/userService');
                    const dbUser = await userService.getById(req.user.id);
                    if (dbUser) {
                        testerName = `${dbUser.prenom || ''} ${dbUser.nom || ''}`.trim();
                    }
                } catch (dbErr) {
                    console.error(dbErr);
                }
            }

            if (!status) {
                return res.status(400).json({ message: 'Le statut est requis.' });
            }

            const io = req.app.get('io');
            const testCase = await testCaseService.updateStatus(id, status, comment, testerId, testerName, io, actualResult);
            return res.json(testCase);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de l\'enregistrement du résultat du test.' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            await testCaseService.delete(id, io);
            return res.json({ message: 'Cas de test supprimé avec succès.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la suppression du cas de test.' });
        }
    }

    async restore(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('io');
            await testCaseService.restore(id, io);
            return res.json({ message: 'Cas de test restauré avec succès.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur lors de la restauration du cas de test.' });
        }
    }
}

module.exports = new TestCaseController();
