const crypto = require('crypto');
const fs = require('fs');

// Load database
let database = { users: [], keys: [] };
try {
  if (fs.existsSync('./database.json')) {
    database = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
  }
} catch (error) {
  console.log('Creating new database');
}

// Generate test keys
const testKeys = [
  { plan: 'basic', duration: 30, count: 5 },
  { plan: 'premium', duration: 30, count: 3 },
  { plan: 'vip', duration: 30, count: 2 }
];

testKeys.forEach(({ plan, duration, count }) => {
  for (let i = 0; i < count; i++) {
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
    console.log(`✅ Generated ${plan.toUpperCase()} key: ${key}`);
  }
});

// Save database
fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
console.log(`\n✅ Total keys in database: ${database.keys.length}`);