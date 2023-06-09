"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const message_1 = require("./types/message");
const conversation_1 = require("./types/conversation");
const user_1 = require("./types/user");
const query_1 = require("./types/query");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
dotenv_1.default.config();
const certPath = process.env.CERT;
const keyPath = process.env.KEY;
// Check if the required environment variables are defined
if (!certPath || !keyPath) {
    console.error('Missing or invalid environment variables.');
    process.exit(1);
}
// Read the certificate and key files
const cert = fs_1.default.readFileSync(certPath);
const key = fs_1.default.readFileSync(keyPath);
// Create an HTTPS server
const server = https_1.default.createServer({ cert, key });
const wss = new ws_1.default.Server({ server });
// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Handle WebSocket connection logic here
});
const record = []; // list of all users, conversations and messages
const clients = [];
console.log(`-> WebSocket server listening on ${process.env.HOST}:${process.env.PORT}.`);
const send_ws = (client, content, type, action = "default") => {
    const msg = JSON.stringify({
        type: type,
        content: content,
        action: action,
        sender: "server",
        recipient: "client",
    });
    logger_1.default.info("Sending message to client: " + msg);
    client.send(msg);
};
const auth_handler = (ws, query) => {
    const user = (0, user_1.transform_user)(query.content);
    var stop = false;
    for (let i = 0; i < record.length; i++)
        if (record[i].user.id === user.id) {
            stop = true;
            break;
        }
    if (!stop) {
        record.push({
            user: user,
            conversation: { id: null, edition_date: new Date(), creation_date: new Date(), name: "", admin_id: -1 },
            messages: []
        });
        clients.push(ws);
    }
    logger_1.default.info(`User ${user.username} authenticated.`);
};
const logout_handler = (ws, query) => {
    const user = (0, user_1.transform_user)(query.content);
    for (let i = 0; i < record.length; i++)
        if (record[i].user.id === user.id) {
            record.splice(i, 1);
            clients.splice(i, 1);
            break;
        }
    logger_1.default.info(`User ${user.username} logout.`);
};
const message_handler = (ws, query) => {
    const message = (0, message_1.transform_message)(query.content);
    const user = query.user;
    if (query.action === "deleted") {
        logger_1.default.info(`Message ${message.id} deleted.`);
        // Remove message from current messages
        for (let i = 0; i < record.length; i++)
            if (record[i].user.id === user.id && record[i].conversation.id === message.conversation_id) {
                record[i].messages.splice(record[i].messages.indexOf(message), 1);
                break;
            }
        // Send notification deleted message to all clients
        for (let i = 0; i < record.length; i++) {
            if (record[i].conversation.id === message.conversation_id && record[i].user.id !== user.id && clients[i].readyState == ws_1.default.OPEN)
                send_ws(clients[i], message, "message", "deleted");
        }
    }
    else if (query.action === "updated") {
        logger_1.default.info(`Message ${message.id} updated.`);
        // Update message from current messages
        for (let i = 0; i < record.length; i++)
            if (record[i].user.id === user.id && record[i].conversation.id === message.conversation_id)
                for (let j = 0; j < record[i].messages.length; j++)
                    if (record[i].messages[j].id === message.id) {
                        record[i].messages[j] = message;
                        break;
                    }
        // Send notification updated message to all clients
        for (let i = 0; i < record.length; i++)
            if (record[i].conversation.id === message.conversation_id && record[i].user.id !== user.id && clients[i].readyState == ws_1.default.OPEN)
                send_ws(clients[i], message, "message", "updated");
    }
    else if (query.action === "created") {
        logger_1.default.info(`Message ${message.id} created.`);
        // Add message to current messages
        for (let i = 0; i < record.length; i++)
            if (record[i].user.id === message.user_id && record[i].conversation.id === message.conversation_id) {
                record[i].messages.push(message);
                break;
            }
        // Send notification created message to all clients
        for (let i = 0; i < record.length; i++) {
            if (record[i].conversation.id === message.conversation_id && record[i].user.id !== user.id && clients[i].readyState == ws_1.default.OPEN)
                send_ws(clients[i], message, "message", "created");
        }
    }
};
const conversation_handler = (ws, query) => {
    const conversation = (0, conversation_1.transform_conversation)(query.content);
    console.log(conversation);
    const user = query.user;
    if (query.action === "created") {
        logger_1.default.info(`Conversation ${conversation.id} created.`);
        // Update conversation from current conversations
        for (let i = 0; i < record.length; i++)
            if (record[i].conversation.id === conversation.id && record[i].user.id == user.id) {
                record[i].conversation = conversation;
                break;
            }
        // Send notification created conversation to all clients
        for (let i = 0; i < record.length; i++)
            if (clients[i].readyState == ws_1.default.OPEN) // TODO: check condition
                send_ws(clients[i], conversation, "conversation", "created");
    }
    else if (query.action === "updated") {
        logger_1.default.info(`Conversation ${conversation.id} updated.`);
        // Update conversation from current conversations
        for (let i = 0; i < record.length; i++) {
            if (record[i].user.id == user.id) {
                record[i].messages = []; // TODO : retrieve last messages of conversation on API
                record[i].conversation = conversation;
                break;
            }
        }
        console.log(record);
    }
    else if (query.action === "deleted") {
        logger_1.default.info(`Conversation ${conversation.id} deleted.`);
        // Send notification deleted conversation to all clients
        for (let i = 0; i < record.length; i++)
            if (record[i].conversation.id === conversation.id && clients[i].readyState == ws_1.default.OPEN) // TODO: check conditions
                send_ws(clients[i], conversation, "conversation", "deleted");
        // Update conversation from current conversations
        for (let i = 0; i < record.length; i++)
            if (record[i].conversation.id === conversation.id && record[i].user.id == user.id) {
                record[i].messages = [];
                break;
            }
    }
};
wss.on('connection', (ws) => {
    logger_1.default.info('WebSocket connection established.');
    send_ws(ws, null, "default", "connected");
    ws.on('message', (message) => {
        const receivedMessage = JSON.parse(message.toString());
        logger_1.default.info(`Received message: ${message.toString()}`);
        const query = (0, query_1.transform_query)(receivedMessage);
        if (receivedMessage.type === "auth")
            auth_handler(ws, query);
        else if (receivedMessage.type === "logout")
            logout_handler(ws, query);
        else if (receivedMessage.type === 'message')
            message_handler(ws, query);
        else if (receivedMessage.type === 'conversation')
            conversation_handler(ws, query);
    });
    ws.on('close', () => console.log('WebSocket connection closed.'));
    ws.on('error', (error) => console.error('WebSocket error:', error));
});
// Specify the port and host to listen on
const port = process.env.PORT || 8080;
// Start the server listening for incoming connections
server.listen(port, () => {
    console.log(`WebSocket server is running on localhost:${port}`);
});
//# sourceMappingURL=ws.js.map