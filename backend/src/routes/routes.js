const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const demandeController = require('../controllers/demandeController');
const projectController = require('../controllers/projectController');
const charterController = require('../controllers/charterController');
const userController = require('../controllers/userController');
const configController = require('../controllers/configController');
const messageController = require('../controllers/messageController');
const teamController = require('../controllers/teamController');
const taskController = require('../controllers/taskController');
const eventController = require('../controllers/eventController');
const testCaseController = require('../controllers/testCaseController');
const notificationController = require('../controllers/notificationController');

const authenticateToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/roleMiddleware');

router.post('/auth/login', authController.login);

router.use(authenticateToken);

router.get('/demandes/', demandeController.getAll);
router.get('/demandes/:id', demandeController.getById);
router.post('/demandes/', demandeController.create);
router.put('/demandes/:id', demandeController.update);
router.put('/demandes/:id/status', demandeController.updateStatus);
router.delete('/demandes/:id', demandeController.delete);

router.get('/projects/', projectController.getAll);
router.post('/projects/', projectController.create);
router.get('/projects/members', teamController.getAllMembers);
router.put('/projects/:id/status', projectController.updateStatus);
router.put('/projects/:id', projectController.update);
router.delete('/projects/:id', projectController.delete);

router.get('/projects/:projectId/members', teamController.getMembers);
router.post('/projects/:projectId/members', teamController.addOrUpdateMember);
router.delete('/projects/:projectId/members/:userId', teamController.removeMember);


router.get('/tasks/', taskController.getAll);
router.post('/tasks/', taskController.create);
router.put('/tasks/:id', taskController.update);
router.put('/tasks/:id/status', taskController.updateStatus);
router.delete('/tasks/:id', taskController.delete);

router.get('/projects/:projectId/test-cases', testCaseController.getByProject);
router.post('/test-cases', testCaseController.create);
router.put('/test-cases/:id', testCaseController.update);
router.put('/test-cases/:id/status', testCaseController.updateStatus);
router.delete('/test-cases/:id', testCaseController.delete);

router.get('/projects/:projectId/events', eventController.getEventsByProject);
router.post('/projects/:projectId/events', eventController.createEvent);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);

router.get('/charters/', charterController.getAll);
router.post('/charters/', charterController.save);
router.delete('/charters/:demandeId', charterController.delete);

router.get('/messages/', messageController.getAll);

router.get('/notifications/', notificationController.getAll);
router.put('/notifications/mark-all', notificationController.markAllAsRead);
router.put('/notifications/:id/read', notificationController.markAsRead);

router.use('/config', requireAdmin);
router.get('/config/', configController.getAll);
router.put('/config/:key', configController.update);

router.get('/users/', userController.getAll);
router.post('/users/', requireAdmin, userController.create);
router.put('/users/:id', requireAdmin, userController.update);
router.put('/users/:id/archive', requireAdmin, userController.archive);
router.put('/users/:id/restore', requireAdmin, userController.restore);

module.exports = router;
