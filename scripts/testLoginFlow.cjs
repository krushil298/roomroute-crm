const https = require('https');

// Step 1: Signup
function signup() {
  return new Promise((resolve, reject) => {
    const email = `josh.test${Date.now()}@roomroute.org`;
    const data = JSON.stringify({
      firstName: 'Josh',
      lastName: 'Test',
      email: email,
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

    console.log('Step 1: Signing up...');
    const req = https.request(options, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'] || [];

      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('✅ Signup status:', res.statusCode);
        console.log('✅ Cookies received:', cookies);
        try {
          const user = JSON.parse(body);
          console.log('✅ User created:', user.email);
          resolve({ user, cookies, email });
        } catch (e) {
          reject(new Error('Invalid JSON: ' + body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 2: Get user with session
function getUser(cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'roomroute-crm-production-dd6e.up.railway.app',
      port: 443,
      path: '/api/auth/user',
      method: 'GET',
      headers: {
        'Cookie': cookies.join('; ')
      }
    };

    console.log('\nStep 2: Getting user session...');
    console.log('Using cookies:', cookies);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve(body);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run the flow
signup()
  .then(({ user, cookies, email }) => getUser(cookies))
  .catch(err => console.error('Error:', err));
