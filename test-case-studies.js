// Simple test script to check case studies endpoint
const https = require('https');

const options = {
  hostname: 'tech-interview-backend.onrender.com',
  port: 443,
  path: '/api/case-studies',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // This will fail without auth, but we can see the response
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end(); 