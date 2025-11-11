const https = require('https');

// Step 1: Signup
function signup() {
  return new Promise((resolve, reject) => {
    const email = `logout.test${Date.now()}@roomroute.org`;
    const data = JSON.stringify({
      firstName: 'Logout',
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
        const user = JSON.parse(body);
        console.log('✅ User created:', user.email);
        resolve({ cookies });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 2: Verify session works
function verifySession(cookies) {
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

    console.log('\nStep 2: Verifying session...');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
          console.log('✅ Session is valid');
        } else {
          console.log('❌ Session not valid:', body);
        }
        resolve({ cookies });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 3: Logout
function logout(cookies) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'roomroute-crm-production-dd6e.up.railway.app',
      port: 443,
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Cookie': cookies.join('; ')
      }
    };

    console.log('\nStep 3: Logging out...');
    const req = https.request(options, (res) => {
      let body = '';
      const newCookies = res.headers['set-cookie'] || [];

      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        console.log('New cookies:', newCookies);

        if (res.statusCode === 200) {
          console.log('✅ Logout successful');
        } else {
          console.log('❌ Logout failed');
        }
        resolve({ cookies: newCookies.length > 0 ? newCookies : cookies });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 4: Try to access session after logout
function verifyLogout(cookies) {
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

    console.log('\nStep 4: Verifying logout (should fail)...');
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);

        if (res.statusCode === 401) {
          console.log('✅ Logout verified - session destroyed');
        } else {
          console.log('❌ Logout failed - session still active');
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run the flow
signup()
  .then(({ cookies }) => verifySession(cookies))
  .then(({ cookies }) => logout(cookies))
  .then(({ cookies }) => verifyLogout(cookies))
  .catch(err => console.error('Error:', err));
