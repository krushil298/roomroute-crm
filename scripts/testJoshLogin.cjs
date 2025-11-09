const https = require('https');

function testLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'josh.gaddis@roomroute.org',
      password: 'RoomRoute2025!'
    });

    const options = {
      hostname: 'roomroute-crm-production-dd6e.up.railway.app',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log('🔐 Testing Josh\'s login credentials...\n');

    const req = https.request(options, (res) => {
      let body = '';
      const cookies = res.headers['set-cookie'] || [];

      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);

        if (res.statusCode === 200) {
          const user = JSON.parse(body);
          console.log('\n✅ LOGIN SUCCESSFUL!');
          console.log('\nUser Details:');
          console.log('  Email:', user.email);
          console.log('  Name:', user.firstName, user.lastName);
          console.log('  Role:', user.role);
          console.log('  User ID:', user.id);
          console.log('\nSession Cookie:', cookies.length > 0 ? '✅ Set' : '❌ Not set');
        } else {
          console.log('\n❌ LOGIN FAILED');
          console.log('Response:', body);
        }

        resolve();
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

testLogin().catch(err => console.error('Error:', err));
