
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
    {
      "id": 7,
      "name": "Call Bomb - Service 2",
      "type": "Call",
      "method": "POST",
      "url": "https://callapi2.com/voice",
      "headers": {},
      "body": "number={phone}",
      "count": 1
    },
