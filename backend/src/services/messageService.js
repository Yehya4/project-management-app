const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/messages.json');


if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
}
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
}

const getMessages = () => {
    const data = fs.readFileSync(dataPath);
    return JSON.parse(data);
};

const saveMessages = (messages) => {
    fs.writeFileSync(dataPath, JSON.stringify(messages, null, 2));
};

exports.getAllMessages = () => {
    return getMessages();
};

exports.addMessage = (messageData) => {
    const messages = getMessages();
    const newMessage = {
        id: Date.now().toString(),
        ...messageData,
        createdAt: new Date().toISOString()
    };
    messages.push(newMessage);
    saveMessages(messages);
    return newMessage;
};
