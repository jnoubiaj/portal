// ── FIREBASE CONFIG ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAlNWS38LA53121Bm0K2QaAKO-TGv3pNI4",
  authDomain: "capitalquest-portal.firebaseapp.com",
  projectId: "capitalquest-portal",
  storageBucket: "capitalquest-portal.firebasestorage.app",
  messagingSenderId: "552458271401",
  appId: "1:552458271401:web:ed1cced7b9792061c5c7b8"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ── FIRESTORE HELPERS ─────────────────────────────────────────────────────

// Encode email for use as Firestore document ID
function emailToDocId(email) {
  return (email || '').toLowerCase().replace(/\./g, ',');
}

// ── CLIENTS ───────────────────────────────────────────────────────────────
async function fsGetClients() {
  try {
    const snap = await db.collection('clients').get();
    return snap.docs.map(d => d.data());
  } catch(e) { return null; }
}

async function fsSaveClient(client) {
  try {
    await db.collection('clients').doc(client.id).set(client);
  } catch(e) {}
}

async function fsDeleteClient(clientId) {
  try {
    await db.collection('clients').doc(clientId).delete();
  } catch(e) {}
}

// ── CREDENTIALS ───────────────────────────────────────────────────────────
async function fsGetCred(email) {
  try {
    const doc = await db.collection('credentials').doc(emailToDocId(email)).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function fsSetCred(email, cred) {
  try {
    await db.collection('credentials').doc(emailToDocId(email)).set(cred);
  } catch(e) {}
}

async function fsDeleteCred(email) {
  try {
    await db.collection('credentials').doc(emailToDocId(email)).delete();
  } catch(e) {}
}

// Returns all credentials as { emailDocId: credData }
async function fsGetAllCreds() {
  try {
    const snap = await db.collection('credentials').get();
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    return result;
  } catch(e) { return null; }
}

// ── DASHBOARD DATA ────────────────────────────────────────────────────────
async function fsGetDash(clientId) {
  try {
    const doc = await db.collection('dashboards').doc(clientId).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function fsSetDash(clientId, data) {
  try {
    await db.collection('dashboards').doc(clientId).set(data, { merge: true });
  } catch(e) {}
}

// ── FILE STORAGE ──────────────────────────────────────────────────────────
// Upload a file to Firebase Storage and return its permanent download URL.
// Returns null if Storage SDK isn't loaded or upload fails.
async function fsUploadFile(path, file) {
  try {
    if (typeof firebase.storage !== 'function') return null;
    const ref = firebase.storage().ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  } catch(e) { return null; }
}

// Real-time listener for dashboard — calls callback whenever data changes
function fsListenDash(clientId, callback) {
  return db.collection('dashboards').doc(clientId).onSnapshot(snap => {
    if (snap.exists) callback(snap.data());
  });
}

// ── ONBOARDING DATA ───────────────────────────────────────────────────────
async function fsGetOnboarding(clientId) {
  try {
    const doc = await db.collection('onboarding').doc(clientId).get();
    return doc.exists ? doc.data() : null;
  } catch(e) { return null; }
}

async function fsSetOnboarding(clientId, data) {
  try {
    await db.collection('onboarding').doc(clientId).set(data);
  } catch(e) {}
}

async function fsGetAllOnboarding() {
  try {
    const snap = await db.collection('onboarding').get();
    return snap.docs.map(d => ({ ...d.data(), _clientId: d.id }));
  } catch(e) { return null; }
}

function fsListenOnboarding(clientId, callback) {
  return db.collection('onboarding').doc(clientId).onSnapshot(snap => {
    if (snap.exists) callback(snap.data());
  });
}
