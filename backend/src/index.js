require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

const server = http.createServer(app);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

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
    console.error('ERREUR CRITIQUE : JWT_SECRET non défini dans .env. Arrêt du serveur.');
    process.exit(1);
}

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
    console.log('Un client est connecté :', socket.id);

        socket.on('register_user', ({ userId, role, fullName }) => {
        socket.userId = userId;
        socket.role = role;
        socket.fullName = fullName;

                socket.join(`user_${userId}`);
        socket.join(`role_${role}`);
        if (fullName) {
            socket.join(`name_${fullName}`);
        }
        console.log(`Socket ${socket.id} enregistré pour l'utilisateur ${userId} (${role}, ${fullName})`);
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
                        }
                    } catch (error) {
                        console.error('Erreur lors du traitement de la mention :', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté :', socket.id);
    });
});

const routes = require('./routes/routes');

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', routes);

server.listen(port, () => {
    console.log(`Backend server démarré sur le port ${port}`);
});
