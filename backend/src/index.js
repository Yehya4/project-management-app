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
        
        const savedMessage = messageService.addMessage(messageData);
        
        
        io.emit('new_message', savedMessage);
        
        
        if (messageData.mentions && messageData.mentions.length > 0) {
            for (const mentionId of messageData.mentions) {
                try {
                    const mentionedUser = await userService.getById(mentionId);
                    if (mentionedUser) {
                        const mentionedName = `${mentionedUser.prenom || ''} ${mentionedUser.nom || ''}`.trim();
                        
                        
                        const notificationForMentioned = {
                            id: Date.now().toString() + Math.random().toString(36).substring(7),
                            type: 'mention',
                            title: 'Mention dans le chat',
                            message: `${messageData.senderName} vous a mentionné dans le chat`,
                            createdAt: new Date().toISOString(),
                            read: false,
                            userId: mentionId,
                            link: `/projects/${messageData.projectId}/messages`
                        };
                        io.to(`user_${mentionId}`).emit('new_notification', notificationForMentioned);

                        
                        const notificationForSponsorAdmin = {
                            id: Date.now().toString() + Math.random().toString(36).substring(7),
                            type: 'mention',
                            title: 'Mention dans le chat',
                            message: `${messageData.senderName} a mentionné ${mentionedName} dans le chat`,
                            createdAt: new Date().toISOString(),
                            read: false,
                            link: `/projects/${messageData.projectId}/messages`
                        };
                        io.to('role_Sponsor').to('role_Admin').emit('new_notification', notificationForSponsorAdmin);
                    }
                } catch (error) {
                    console.error('Erreur lors du traitement de la mention :', error);
                }
            }
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
