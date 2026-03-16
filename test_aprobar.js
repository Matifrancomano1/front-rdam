const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.data.tokens.accessToken;
    console.log('Got token!');

    console.log('Sending approve request...');
    const approveRes = await axios.post('http://localhost:3000/v1/expedientes/b8e3b2d7-0372-4c96-ad1a-484a8eebde13/aprobar', {
      observaciones: 'Test'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Approve Success:', approveRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Approve Server Error:', err.response.status, err.response.data);
    } else {
      console.error('Approve Network Error:', err.message);
    }
  }
}

run();
