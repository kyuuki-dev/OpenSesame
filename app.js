import { createAuth0Client } from '@auth0/auth0-spa-js';
import { config } from './config.js';

let auth0Client = null;
let accessToken = null;

async function initAuth0() {
  auth0Client = await createAuth0Client({
    domain: config.auth0Domain,
    client_id: config.auth0ClientId,
    redirect_uri: window.location.origin
  });

  if (window.location.search.includes('code=')) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, '/');
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    accessToken = await auth0Client.getTokenSilently();
    document.getElementById('login').style.display = 'none';
    document.getElementById('logout').style.display = 'inline';
    document.getElementById('app').style.display = 'block';
    loadDevices();
  }
}

async function login() {
  await auth0Client.loginWithRedirect();
}

async function logout() {
  auth0Client.logout({ returnTo: window.location.origin });
}

async function loadDevices() {
  const res = await fetch(`${config.apiBaseUrl}/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const devices = await res.json();
  const container = document.getElementById('devices');
  container.innerHTML = '';
  devices.forEach(device => {
    const div = document.createElement('div');
    div.textContent = `${device.friendlyName} - ${device.state}`;
    container.appendChild(div);
  });
}

async function createDevice() {
  const name = document.getElementById('newDeviceName').value;
  const type = document.getElementById('newDeviceType').value;
  await fetch(`${config.apiBaseUrl}/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      friendlyName: name,
      deviceType: type
    })
  });
  loadDevices();
}

window.onload = initAuth0;
window.login = login;
window.logout = logout;
window.createDevice = createDevice;
