/**
 * SYNC — Sincronización + Presencia multiusuario
 * Soporta 50+ usuarios simultáneos
 */
var syncStatus = 'offline';
var syncTimer = null;
var presenceInterval = null;
var onlineCount = 0;
var onlineUsers = [];

function updateSyncBadge() {
  var el = $('syncBadge');
  if (el) {
    var icons = { offline:'⚫', syncing:'🔄', synced:'🟢', error:'🔴' };
    el.innerHTML = '<span style="font-size:10px" title="' + syncStatus + '">' + (icons[syncStatus]||'⚫') + '</span>';
  }
}

function updateOnlineCounter() {
  var el = $('onlineCount');
  if (el) el.textContent = onlineCount;
  var el2 = $('onlineCountLogin');
  if (el2) el2.textContent = onlineCount;
  var el3 = $('onlineList');
  if (el3 && onlineUsers.length) {
    el3.title = onlineUsers.map(function(u) { return u.name + ' (' + u.role + ')'; }).join('\n');
  }
}

// ===== GUARDAR EN SUPABASE =====
function syncToCloud() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  syncStatus = 'syncing'; updateSyncBadge();
  fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY, 'Prefer':'resolution=merge-duplicates' },
    body: JSON.stringify({ id:'main', data:JSON.stringify(D), updated_at:new Date().toISOString() })
  }).then(function(r) {
    syncStatus = (r.ok || r.status===201 || r.status===204) ? 'synced' : 'error';
    updateSyncBadge();
  }).catch(function() { syncStatus='error'; updateSyncBadge(); });
}

// ===== CARGAR DE SUPABASE =====
function syncFromCloud(callback) {
  if (!SUPABASE_URL || !SUPABASE_KEY) { if (callback) callback(); return; }
  syncStatus = 'syncing'; updateSyncBadge();
  fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE + '?id=eq.main&select=data,updated_at', {
    headers: { 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY }
  }).then(function(r) { return r.json(); }).then(function(rows) {
    if (rows && rows.length > 0 && rows[0].data) {
      var cloud = JSON.parse(rows[0].data);
      var localStr = localStorage.getItem('ti2d');
      if (JSON.stringify(cloud).length >= (localStr ? localStr.length : 0)) {
        D = cloud;
        'prog comp eq pw ind pap logs'.split(' ').forEach(function(k) { if (!Array.isArray(D[k])) D[k]=[]; });
        if (!Array.isArray(D.deptos) || !D.deptos.length) D.deptos = ['Calidad','Dirección General','Bioestadística','Laboratorio Clínico','Analítica','Gestión de Voluntarios'];
        localStorage.setItem('ti2d', JSON.stringify(D));
      }
      syncStatus = 'synced';
    } else {
      syncStatus = 'synced';
      if (D.prog.length || D.comp.length || D.eq.length) syncToCloud();
    }
    updateSyncBadge(); if (callback) callback();
  }).catch(function() { syncStatus='error'; updateSyncBadge(); if (callback) callback(); });
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToCloud, 2000);
}

// ===== PRESENCIA — Heartbeat cada 30 seg =====
function presenceHeartbeat() {
  if (!U || !SUPABASE_URL) return;
  var uid = U.u + '_' + Math.random().toString(36).substr(2,4);
  if (!U._pid) U._pid = uid;
  fetch(SUPABASE_URL + '/rest/v1/ti_presence', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY, 'Prefer':'resolution=merge-duplicates' },
    body: JSON.stringify({ id:U._pid, name:U.n, role:U.r, depto:U.d||'', last_seen:new Date().toISOString() })
  }).catch(function() {});
}

function presenceRemove() {
  if (!U || !U._pid || !SUPABASE_URL) return;
  fetch(SUPABASE_URL + '/rest/v1/ti_presence?id=eq.' + U._pid, {
    method: 'DELETE',
    headers: { 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY }
  }).catch(function() {});
}

function fetchOnlineUsers() {
  if (!SUPABASE_URL) return;
  // Usuarios con heartbeat en los últimos 60 seg
  var since = new Date(Date.now() - 60000).toISOString();
  fetch(SUPABASE_URL + '/rest/v1/ti_presence?last_seen=gte.' + since + '&select=id,name,role,depto', {
    headers: { 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY }
  }).then(function(r) { return r.json(); }).then(function(rows) {
    if (Array.isArray(rows)) {
      onlineCount = rows.length;
      onlineUsers = rows;
      updateOnlineCounter();
    }
  }).catch(function() {});
}

function startPresence() {
  presenceHeartbeat();
  fetchOnlineUsers();
  if (presenceInterval) clearInterval(presenceInterval);
  presenceInterval = setInterval(function() {
    presenceHeartbeat();
    fetchOnlineUsers();
  }, 30000);
}

function stopPresence() {
  presenceRemove();
  if (presenceInterval) clearInterval(presenceInterval);
}

// Fetch online count for login screen
function fetchOnlineForLogin() {
  fetchOnlineUsers();
  setInterval(fetchOnlineUsers, 15000);
}
