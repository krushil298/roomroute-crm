const https = require('https');

const data = JSON.stringify({
  firstName: 'Josh',
  lastName: 'Test',
  email: `josh.test${Date.now()}@roomroute.org`,
  password: 'Test12345678'
});

const options = {
  hostname: 'roomroute-crm-production-dd6e.up.railway.app',
  port: 443,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing signup API...');
console.log('Request:', JSON.parse(data));

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response:', body);
    try {
      const json = JSON.parse(body);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();
