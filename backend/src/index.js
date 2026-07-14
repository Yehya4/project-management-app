require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

const messageService = require('./services/messageService');
const userService = require('./services/userService');
const notificationService = require('./services/notificationService');
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_super_securise', (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
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
                                role: 'Admin', // Example, this would be better to send separately for Admin and Sponsor
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

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api', routes);

server.listen(port, () => {
    console.log(`Backend server démarré sur le port ${port}`);
});
