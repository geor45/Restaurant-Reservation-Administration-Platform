import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZnoGbQ3LtPJSi9fm8h1hAXRMzqmsYsSg",
  authDomain: "vythos.firebaseapp.com",
  projectId: "vythos",
  storageBucket: "vythos.firebasestorage.app",
  messagingSenderId: "866948522913",
  appId: "1:866948522913:web:d601ca585aedfe7486a1e0",
  measurementId: "G-S49LYZVZ9T"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const body = document.getElementById('reservationsBody');
const totalCount = document.getElementById('totalCount');
const newCount = document.getElementById('newCount');
const todayCount = document.getElementById('todayCount');
const statusText = document.getElementById('statusText');
const refreshBtn = document.getElementById('refreshBtn');

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('el-GR');
}

function render(rows) {
  body.innerHTML = '';
  totalCount.textContent = rows.length;
  newCount.textContent = rows.filter(r => r.status === 'new').length;

  const today = new Date().toDateString();
  todayCount.textContent = rows.filter(r => new Date(r.createdAt).toDateString() === today).length;

  if (!rows.length) {
    body.innerHTML = '<tr><td class="empty" colspan="5">Δεν υπάρχουν κρατήσεις ακόμη.</td></tr>';
    return;
  }

  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.time || '-'}</td>
      <td>${row.people || '-'}</td>
      <td>${row.details || '-'}</td>
      <td><span class="badge ${row.status || 'new'}">${row.status || 'new'}</span></td>
      <td>${formatDate(row.createdAt)}</td>
    `;
    body.appendChild(tr);
  });
}

onValue(ref(db, 'reservations'), snapshot => {
  const data = snapshot.val() || {};
  const rows = Object.entries(data)
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  render(rows);
  statusText.textContent = 'Συνδεδεμένο';
}, () => {
  statusText.textContent = 'Σφάλμα σύνδεσης';
});

refreshBtn.addEventListener('click', () => window.location.reload());