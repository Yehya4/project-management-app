require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 5000;

const server = http.createServer(app);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ─── Socket.io ─────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

const messageService = require('./services/messageService');
const userService = require('./services/userService');
const notificationService = require('./services/notificationService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger.error('ERREUR CRITIQUE : JWT_SECRET non défini dans .env. Arrêt du serveur.');
    process.exit(1);
}

// Authentification Socket.io
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: token manquant'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error: token invalide'));
        socket.user = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    logger.debug(`Client connecté : ${socket.id}`);

    socket.on('register_user', ({ userId, role, fullName }) => {
        socket.userId = userId;
        socket.role = role;
        socket.fullName = fullName;

        socket.join(`user_${userId}`);
        socket.join(`role_${role}`);
        if (fullName) {
            socket.join(`name_${fullName}`);
        }
        logger.debug(`Socket ${socket.id} enregistré : user ${userId} (${role})`);
    });

    socket.on('send_message', async (messageData) => {
        try {
            const savedMessage = await messageService.addMessage(messageData);

            if (messageData.recipientId) {
                io.to(`user_${messageData.senderId}`).to(`user_${messageData.recipientId}`).emit('new_message', savedMessage);
            } else {
                io.emit('new_message', savedMessage);
            }

            if (messageData.mentions && messageData.mentions.length > 0) {
                for (const mentionId of messageData.mentions) {
                    try {
                        const mentionedUser = await userService.getById(mentionId);
                        if (mentionedUser) {
                            const mentionedName = `${mentionedUser.prenom || ''} ${mentionedUser.nom || ''}`.trim();

                            const notificationForMentionedData = {
                                id: Date.now().toString() + Math.random().toString(36).substring(7),
                                type: 'mention',
                                title: 'Mention dans le chat',
                                message: `${messageData.senderName} vous a mentionné dans le chat`,
                                userId: mentionId,
                                link: `/projects/${messageData.projectId}/messages`
                            };
                            const savedNotifForMentioned = await notificationService.addNotification(notificationForMentionedData);
                            io.to(`user_${mentionId}`).emit('new_notification', savedNotifForMentioned);

                            const notificationForSponsorAdminData = {
                                id: Date.now().toString() + Math.random().toString(36).substring(7),
                                type: 'mention',
                                title: 'Mention dans le chat',
                                message: `${messageData.senderName} a mentionné ${mentionedName} dans le chat`,
                                role: 'Admin',
                                link: `/projects/${messageData.projectId}/messages`
                            };
                            const savedNotifForAdmin = await notificationService.addNotification(notificationForSponsorAdminData);
                            io.to('role_Admin').emit('new_notification', savedNotifForAdmin);

                            const notificationForSponsorData = { ...notificationForSponsorAdminData, role: 'Sponsor', id: Date.now().toString() + Math.random().toString(36).substring(7) };
                            const savedNotifForSponsor = await notificationService.addNotification(notificationForSponsorData);
                            io.to('role_Sponsor').emit('new_notification', savedNotifForSponsor);

                            const notificationForInfraData = { ...notificationForSponsorAdminData, role: 'Responsable Infra', id: Date.now().toString() + Math.random().toString(36).substring(7) };
                            const savedNotifForInfra = await notificationService.addNotification(notificationForInfraData);
                            io.to('role_Responsable Infra').emit('new_notification', savedNotifForInfra);
                        }
                    } catch (error) {
                        logger.error('Erreur lors du traitement de la mention', { error: error.message });
                    }
                }
            }
        } catch (error) {
            logger.error('Erreur envoi message Socket.io', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        logger.debug(`Client déconnecté : ${socket.id}`);
    });
});

// ─── Middleware de sécurité ─────────────────────────────────────────────────

// Helmet : sécurise automatiquement ~15 headers HTTP
app.use(helmet({
    crossOriginEmbedderPolicy: false, // Permet les ressources cross-origin (images, iframes)
    contentSecurityPolicy: false,     // Désactivé : le frontend React gère sa propre CSP
}));

// Headers de sécurité supplémentaires
app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// CORS
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────

// Limiter global : 200 requêtes / 15 min par IP (protection DDoS légère)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
});

// Limiter strict sur le login : max 10 tentatives / 15 min par IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
    skipSuccessfulRequests: true, // Ne compte pas les connexions réussies
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', loginLimiter);

// ─── Logger des requêtes HTTP ────────────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger[level](`${req.method} ${req.originalUrl} — ${res.statusCode} (${duration}ms)`, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        });
    });
    next();
});

// ─── Health check endpoint ───────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── Routes API ──────────────────────────────────────────────────────────────
const routes = require('./routes/routes');
app.use('/api', routes);

// ─── Gestion des erreurs 404 ─────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: 'Route introuvable.' });
});

// ─── Gestion globale des erreurs ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    logger.error('Erreur non gérée', { error: err.message, stack: err.stack });
    res.status(500).json({ message: 'Erreur interne du serveur.' });
});

// ─── Démarrage ───────────────────────────────────────────────────────────────
server.listen(port, () => {
    logger.info(`✅ Backend Auto Project démarré sur le port ${port}`);
    logger.info(`   Environnement : ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   CORS origin   : ${CORS_ORIGIN}`);
});

// ─── Arrêt propre (graceful shutdown) ────────────────────────────────────────
process.on('SIGTERM', () => {
    logger.info('SIGTERM reçu — Arrêt propre du serveur...');
    server.close(() => {
        logger.info('Serveur arrêté proprement.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT reçu — Arrêt propre du serveur...');
    server.close(() => {
        logger.info('Serveur arrêté proprement.');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    logger.error('Exception non capturée', { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Promise rejetée non gérée', { reason });
});
