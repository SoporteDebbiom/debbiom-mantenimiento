/**
 * NOTIFICACIONES — Solo admin ve esto
 * Empleados reciben correos automáticos sin ver nada en la app
 */

var NOTIFS = [];
var NOTIF_TIMER = null;

function loadNotifs(){try{NOTIFS=JSON.parse(localStorage.getItem('ti2_notifs')||'[]');}catch(e){NOTIFS=[];}}
function svNotifs(){try{localStorage.setItem('ti2_notifs',JSON.stringify(NOTIFS.slice(0,100)));}catch(e){}updateBell();}

// ===== CREAR NOTIFICACIÓN (solo se muestra al admin) =====
function addNotif(icon, title, body, type) {
  NOTIFS.unshift({ id: gId(), icon: icon, title: title, body: body, type: type||'info', time: new Date().toISOString(), read: false });
  if (NOTIFS.length > 100) NOTIFS = NOTIFS.slice(0, 100);
  svNotifs();
  // Desktop push solo si admin está logueado
  if (isAdmin()) sendDesktopNotif(title, body);
}

// ===== DESKTOP PUSH =====
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}
function sendDesktopNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    var n = new Notification('DEBBIOM TI — ' + title, { body: body, icon: 'assets/logo.png', tag: 'deb-' + Date.now() });
    setTimeout(function() { n.close(); }, 8000);
  } catch(e) {}
}

// ===== BADGE (campana) =====
function updateBell() {
  var badge = $('notifBadge');
  if (!badge) return;
  var unread = NOTIFS.filter(function(n) { return !n.read; }).length;
  badge.textContent = unread > 99 ? '99+' : unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
}

// ===== PANEL DESPLEGABLE =====
function toggleNotifPanel() {
  if (!isAdmin()) return;
  var p = $('notifPanel'); if (!p) return;
  var open = p.style.display === 'block';
  p.style.display = open ? 'none' : 'block';
  if (!open) renderNotifPanel();
}

function renderNotifPanel() {
  var p = $('notifPanel'); if (!p) return;
  var h = '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border)">';
  h += '<span style="font-weight:700;font-size:13px"><i class="fas fa-bell" style="color:var(--deb-teal)"></i> Notificaciones</span>';
  h += '<div style="display:flex;gap:6px">';
  if (NOTIFS.some(function(n){return !n.read;})) h += '<button onclick="markAllRead()" style="font-size:10px;color:var(--deb-teal);background:none;border:none;cursor:pointer;font-weight:600"><i class="fas fa-check-double"></i> Leer todo</button>';
  if (NOTIFS.length) h += '<button onclick="clearNotifs()" style="font-size:10px;color:var(--rose);background:none;border:none;cursor:pointer;font-weight:600"><i class="fas fa-trash"></i></button>';
  h += '</div></div>';

  if (!NOTIFS.length) {
    h += '<div style="text-align:center;padding:40px 20px;color:var(--text3)"><i class="fas fa-bell-slash" style="font-size:24px;opacity:.2;display:block;margin-bottom:8px"></i><div style="font-size:12px">Sin notificaciones</div></div>';
  } else {
    h += '<div style="max-height:380px;overflow-y:auto">';
    NOTIFS.slice(0, 30).forEach(function(n) {
      var bg = n.read ? '' : 'background:rgba(0,131,143,.04);';
      var ic = n.type==='reminder'?'var(--amber)':n.type==='email'?'var(--deb-teal)':n.type==='status'?'var(--emerald)':'var(--text3)';
      h += '<div onclick="markRead(\''+n.id+'\')" style="padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;'+bg+'transition:background .15s">';
      h += '<div style="display:flex;gap:10px;align-items:flex-start"><i class="'+n.icon+'" style="color:'+ic+';margin-top:2px;font-size:13px"></i>';
      h += '<div style="flex:1"><div style="font-size:11px;font-weight:'+(n.read?'400':'700')+'">'+E(n.title)+'</div>';
      h += '<div style="font-size:10px;color:var(--text3);margin-top:2px;white-space:pre-line">'+E(n.body).substring(0,120)+'</div>';
      h += '<div style="font-size:9px;color:var(--text3);margin-top:3px">'+timeAgo(n.time)+'</div></div></div></div>';
    });
    h += '</div>';
  }
  p.innerHTML = h;
}

function markRead(id){var n=NOTIFS.find(function(x){return x.id===id;});if(n){n.read=true;svNotifs();renderNotifPanel();}}
function markAllRead(){NOTIFS.forEach(function(n){n.read=true;});svNotifs();renderNotifPanel();}
function clearNotifs(){NOTIFS=[];svNotifs();renderNotifPanel();}
function timeAgo(iso){var ms=Date.now()-new Date(iso).getTime();var s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
  if(d>0)return'hace '+d+' día'+(d>1?'s':'');if(h>0)return'hace '+h+'h';if(m>0)return'hace '+m+'min';return'ahora';}

// ===== VERIFICAR RECORDATORIOS AUTOMÁTICOS =====
function checkReminders() {
  if (!D.prog.length) return;
  var cfg = {}; try { cfg = JSON.parse(localStorage.getItem('ti2_emailcfg') || '{}'); } catch(e) {}
  var diasCfg = cfg.dias || [3, 1, 0];
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var hoyStr = hoy.toISOString().split('T')[0];
  var sent = {}; try { sent = JSON.parse(localStorage.getItem('ti2_rem_sent') || '{}'); } catch(e) {}

  D.prog.forEach(function(p) {
    if (p.st === 'listo' || !p.fp) return;
    var fp = new Date(p.fp + 'T00:00:00');
    var diff = Math.round((fp - hoy) / (86400000));

    diasCfg.forEach(function(dias) {
      if (diff !== dias) return;
      var key = p.id + '_' + dias + '_' + hoyStr;
      if (sent[key]) return;

      var eq = D.eq.find(function(e) { return e.ide === p.eq; });
      var usr = eq ? eq.usr : p.eq;
      var email = eq ? findEmailByName(eq.usr) : null;

      // Notificación in-app (admin)
      var tt = dias === 0 ? '⚡ Mantenimiento HOY' : '🔔 Mantenimiento en ' + dias + 'd';
      addNotif('fas fa-wrench', tt, usr + ' — ' + p.eq + ' | ' + p.fp, 'reminder');

      // Email automático
      if (email && typeof autoEmailRecordatorio === 'function') {
        autoEmailRecordatorio(p, dias);
        addNotif('fas fa-envelope', '📧 Recordatorio enviado', email + ' → ' + p.eq, 'email');
      }

      sent[key] = true;
    });
  });

  // Limpiar viejos
  var cut = new Date(); cut.setDate(cut.getDate() - 30); var cutS = cut.toISOString().split('T')[0];
  var clean = {}; for (var k in sent) { if (k.split('_').pop() >= cutS) clean[k] = true; }
  localStorage.setItem('ti2_rem_sent', JSON.stringify(clean));
}

// ===== ENVIAR ALERTA MANUAL (admin) =====
function sendManualAlert(progId) {
  if (!isAdmin()) { toast('⛔', 'er'); return; }
  var p = D.prog.find(function(x) { return x.id === progId; });
  if (!p) return;
  var eq = D.eq.find(function(e) { return e.ide === p.eq; });
  var usr = eq ? eq.usr : p.eq;
  var email = eq ? findEmailByName(eq.usr) : null;

  if (!email) { toast('⚠️ Sin correo para ' + usr, 'wa'); return; }
  if (!confirm('¿Enviar recordatorio?\n\n👤 ' + usr + '\n📧 ' + email + '\n💻 ' + p.eq + '\n📅 ' + p.fp)) return;

  autoEmailRecordatorio(p, -1);
  addNotif('fas fa-paper-plane', '📧 Manual → ' + usr, email + ' | ' + p.eq, 'email');
  toast('📧 Enviado a ' + email, 'ok');
}

// ===== NOTIFICAR CAMBIO DE ESTADO (se llama desde comprobante.js) =====
function notifyStatusChange(prog, newSt) {
  var eq = D.eq.find(function(e) { return e.ide === prog.eq; });
  var usr = eq ? eq.usr : prog.eq;

  if (newSt === 'proceso') {
    addNotif('fas fa-cogs', '🔧 En proceso', usr + ' — ' + prog.eq, 'status');
    if (typeof autoEmailEnProceso === 'function') autoEmailEnProceso(prog);
  } else if (newSt === 'listo') {
    addNotif('fas fa-check-circle', '✅ Completado', usr + ' — ' + prog.eq, 'status');
    if (typeof autoEmailCompletado === 'function') autoEmailCompletado(prog);
  }
}

// ===== SECCIÓN NOTIFICACIONES (solo admin) =====
function rNotif() {
  if (!isAdmin()) { $('sNotif').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sNotif');
  var total = NOTIFS.length, unread = NOTIFS.filter(function(n){return !n.read;}).length;
  var emails = NOTIFS.filter(function(n){return n.type==='email';}).length;
  var ok = EMAILJS_PK && EMAILJS_SVC && EMAILJS_TPL;

  var h = '<div class="stats-r">';
  h += '<div class="stat"><div class="stat-n" style="color:var(--teal)">' + total + '</div><div class="stat-l">Total</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--amber)">' + unread + '</div><div class="stat-l">Sin leer</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--deb-teal)">' + emails + '</div><div class="stat-l">Emails</div></div>';
  var partial = EMAILJS_PK && (!EMAILJS_SVC || !EMAILJS_TPL);
  var stClr = ok ? 'var(--emerald)' : (partial ? 'var(--amber)' : 'var(--rose)');
  var stTxt = ok ? 'Activo' : (partial ? 'Casi listo' : 'Sin config');
  var stIco = ok ? '✅' : (partial ? '🔑' : '⚠️');
  h += '<div class="stat"><div class="stat-n" style="color:' + stClr + '">' + stIco + '</div><div class="stat-l">' + stTxt + '</div></div></div>';

  h += '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">';
  h += '<button class="btn btn-p" onclick="openEmailConfig()"><i class="fas fa-cog"></i> Config EmailJS</button>';
  h += '<button class="btn btn-s" onclick="openEmailDir()"><i class="fas fa-address-book"></i> Directorio</button>';
  h += '<button class="btn btn-s" onclick="checkReminders();toast(\'🔔 Verificado\',\'ok\');rNotif()"><i class="fas fa-sync"></i> Verificar ahora</button>';
  h += '<button class="btn btn-s" onclick="requestNotifPermission();toast(\'🔔 Permiso solicitado\',\'ok\')"><i class="fas fa-desktop"></i> Notif. escritorio</button>';
  h += '</div>';

  // Info de cómo funciona
  h += '<div class="card" style="margin-bottom:14px;border-left:3px solid var(--deb-teal)">';
  h += '<div style="font-size:12px;line-height:1.7">';
  h += '<b style="color:var(--deb-teal)"><i class="fas fa-magic"></i> ¿Cómo funciona?</b><br>';
  h += '• Al <b>programar</b> un mantenimiento → correo automático al usuario<br>';
  h += '• Al llenar el <b>comprobante</b> → correo "tu equipo está en proceso"<br>';
  h += '• Al llenar la <b>encuesta</b> → correo "completado"<br>';
  h += '• <b>Recordatorios</b> automáticos 3 días antes, 1 día antes y el mismo día<br>';
  h += '• El sistema detecta el correo por nombre, apellido o ID de equipo</div></div>';

  // Próximos 14 días
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var prox = D.prog.filter(function(p) {
    if (p.st === 'listo' || !p.fp) return false;
    return (new Date(p.fp+'T00:00:00') - hoy) / 86400000 <= 14 && (new Date(p.fp+'T00:00:00') - hoy) / 86400000 >= 0;
  }).sort(function(a,b){return a.fp.localeCompare(b.fp);});

  if (prox.length) {
    h += '<div class="card"><div class="card-t"><i class="fas fa-clock" style="color:var(--amber)"></i> Próximos 14 días — Enviar alerta manual</div>';
    h += '<div class="tw"><table><thead><tr><th>Equipo</th><th>Usuario</th><th>Email</th><th>Fecha</th><th></th></tr></thead><tbody>';
    prox.forEach(function(p) {
      var eq = D.eq.find(function(e){return e.ide===p.eq;});
      var usr = eq ? eq.usr : '—';
      var em = eq ? findEmailByName(eq.usr) : null;
      var emH = em ? '<span style="color:var(--emerald);font-size:10px" title="'+E(em)+'"><i class="fas fa-check-circle"></i> '+E(em)+'</span>' : '<span style="color:var(--rose);font-size:10px"><i class="fas fa-times-circle"></i></span>';
      h += '<tr><td><b>'+E(p.eq)+'</b></td><td>'+E(usr)+'</td><td>'+emH+'</td><td>'+fd2(p.fp)+'</td>';
      h += '<td><button class="btn btn-sm btn-p" onclick="sendManualAlert(\''+p.id+'\')" '+(em?'':'disabled style="opacity:.4"')+'><i class="fas fa-paper-plane"></i></button></td></tr>';
    });
    h += '</tbody></table></div></div>';
  }

  // Historial
  h += '<div class="card" style="margin-top:14px"><div class="card-t"><i class="fas fa-history" style="color:var(--text3)"></i> Historial</div>';
  if (!NOTIFS.length) {
    h += '<p style="text-align:center;padding:20px;color:var(--text3);font-size:12px">Sin notificaciones aún</p>';
  } else {
    h += '<div class="tw"><table><thead><tr><th></th><th>Título</th><th>Detalle</th><th>Fecha</th></tr></thead><tbody>';
    NOTIFS.slice(0,50).forEach(function(n) {
      var c = n.type==='email'?'var(--deb-teal)':n.type==='reminder'?'var(--amber)':n.type==='status'?'var(--emerald)':'var(--text3)';
      h += '<tr><td><i class="'+n.icon+'" style="color:'+c+'"></i></td><td><b>'+E(n.title)+'</b></td>';
      h += '<td style="font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis">'+E(n.body).substring(0,60)+'</td>';
      h += '<td style="font-size:10px">'+fdt(n.time)+'</td></tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div>';
  el.innerHTML = h;
}

// ===== INICIAR =====
function initNotifs() {
  loadNotifs();
  loadEmailConfig();
  updateBell();
  // Admin: pedir permiso de notificaciones de escritorio
  if (isAdmin()) requestNotifPermission();
  // Verificar recordatorios al iniciar y cada 30 min
  setTimeout(checkReminders, 3000);
  NOTIF_TIMER = setInterval(checkReminders, 30 * 60 * 1000);
}
