/**
 * EMAILS — Vinculación automática nombre/ID → correo → envío
 * TODO es automático: el admin programa, el sistema detecta y envía
 * El empleado NO ve nada de esto
 */

// ===== DIRECTORIO MAESTRO (codificado) =====
var _ED = 'eyJzYW50aWFnbyBndWVycmVybyI6InNvcG9ydGVAZGViYmlvbS5jb20iLCJtYXJnYXJpdGEgYmFycmVyYSI6InZvbHVudGFyaW9zQGRlYmJpb20uY29tIiwiZ2lsYmVydG8gcmFtaXJleiI6InZvbHVudGFyaW9zQGRlYmJpb20uY29tIiwiZGF2aWQgdmlsbGFycmVhbCI6ImZhcm1hY292aWdpbGFuY2lhQGRlYmJpb20uY29tIiwiYWxmb25zbyBhcmF1am8iOiJzZ3NpLnNvcG9ydGVAZGViYmlvbS5jb20iLCJoaWxkYSByYW1pcmV6IjoiaHJhbWlyZXpAZGViYmlvbS5jb20iLCJqb25hdGhhbiByYW1vcyI6ImNhbGlkYWQuY2xpbmljb0BkZWJiaW9tLmNvbSIsInJvYmVydG8gb3J0aXoiOiJhc2VndXJhbWllbnRvLmNhbGlkYWRAZGViYmlvbS5jb20iLCJkaWFuYSBwYWxhY2lvcyI6ImRpYW5hLnBhbGFjaW9zQGRlYmJpb20uY29tIiwicmVjZXBjaW9uIGxhYi4gY2xpbmljbyI6ImxhYm9yYXRvcmlvQGRlYmJpb20uY29tIiwiZ2FicmllbGEgZnJhbmNvIjoiZ2ZyYW5jb0BkZWJiaW9tLmNvbSIsImNhcmxvcyB2aWxsYXJyZWFsIjoibGFib3JhdG9yaW9AZGViYmlvbS5jb20iLCJ2ZXJvbmljYSByYW1vcyI6ImNhbGlkYWQuYW5hbGl0aWNhQGRlYmJpb20uY29tIiwiZWR1YXJkbyB6dWwiOiJlenVsQGRlYmJpb20uY29tIiwiYW1iZXIgc2FuY2hleiI6InJlcXVpc2ljaW9uZXNhbmFsaXRpY2FAZGViYmlvbS5jb20iLCJ5b2F0emluIHZhbGRleiI6Inl2YWxkZXpAZGViYmlvbS5jb20iLCJqb25hdGhhbiBnb256YWxleiI6ImpvbmF0aGFuLmdvbnphbGV6QGRlYmJpb20uY29tIiwicm9jaW8gY2VwZWRhIjoibGFib3JhdG9yaW8uYW5hbGl0aWNhQGRlYmJpb20uY29tIiwiZGVubmlzZSBhZ3VpbGFyIjoiZGFndWlsYXJAZGViYmlvbS5jb20iLCJyYXF1ZWwgcm9kcmlndWV6IjoicnJvZHJpZ3VlekBkZWJiaW9tLmNvbSIsIm1vbmljYSByZXllcyI6Im1yZXllc0BkZWJiaW9tLmNvbSIsImNsYXVkaWEgZ3VldmFyYSI6ImNndWV2YXJhQGRlYmJpb20uY29tIiwidGhlbG1hIGxvcGV6IjoidGxvcGV6QGRlYmJpb20uY29tIiwiYWRyaWFuIGdhcnphIjoicmhAZGViYmlvbS5jb20iLCJyb3NhIG5lbGx5IjoiYWRtaW5pc3RyYWNpb25AZGViYmlvbS5jb20iLCJsaXogbWVkZWxsaW4iOiJsbWVkZWxsaW5AZGViYmlvbS5jb20iLCJwYXRyaWNpbyB2YXpxdWV6IjoicHZhenF1ZXpAZGViYmlvbS5jb20iLCJhbGV4IHRvcnJlcyI6ImFsZWphbmRyby50b3JyZXNAZGViYmlvbS5jb20ifQ==';
var EMAIL_DIR = JSON.parse(atob(_ED));

var EMAILJS_PK = atob('dnFpSFZkR1BDUkMtVmEzZmE='), EMAILJS_SVC = '', EMAILJS_TPL = '';

// ===== BUSCAR CORREO — nombre, apellido, ID equipo o hostname =====
function findEmailByName(nombre) {
  if (!nombre) return null;
  var q = nombre.toLowerCase().trim();
  // Custom dir
  try {
    var cu = JSON.parse(localStorage.getItem('ti2_emaildir') || '{}');
    for (var k in cu) { if (k.toLowerCase() === q) return cu[k]; }
    var pp = q.split(/\s+/).filter(function(w){ return w.length>=2; });
    for (var k in cu) { var kl=k.toLowerCase(); if(pp.some(function(p){return kl.indexOf(p)>=0;})) return cu[k]; }
  } catch(e){}
  // Base dir exacto
  if (EMAIL_DIR[q]) return EMAIL_DIR[q];
  // Base dir parcial
  var parts = q.split(/\s+/).filter(function(w){ return w.length>=2; });
  for (var key in EMAIL_DIR) {
    if (parts.some(function(p){ return key.indexOf(p)>=0; })) return EMAIL_DIR[key];
  }
  return null;
}

// Buscar por ID de equipo → nombre → correo
function findEmailByEquipo(eqId) {
  if (!eqId || !D.eq) return null;
  var eq = D.eq.find(function(e){ return e.ide === eqId; });
  return eq ? findEmailByName(eq.usr) : null;
}

// Nombre completo desde directorio
function findFullName(nombre) {
  if (!nombre) return nombre;
  var q = nombre.toLowerCase().trim();
  for (var key in EMAIL_DIR) {
    if (key === q) return key.replace(/\b\w/g, function(c){return c.toUpperCase();});
  }
  var parts = q.split(/\s+/).filter(function(w){return w.length>=2;});
  for (var key in EMAIL_DIR) {
    if (parts.some(function(p){return key.indexOf(p)>=0;})) return key.replace(/\b\w/g,function(c){return c.toUpperCase();});
  }
  return nombre;
}

// ===== ENVÍO AUTOMÁTICO =====
function sendEmailAlert(toEmail, toName, subject, body) {
  if (!toEmail) return Promise.resolve(false);
  if (!EMAILJS_PK || !EMAILJS_SVC || !EMAILJS_TPL) {
    console.log('[AUTO-EMAIL] Config pendiente →', toEmail, subject);
    if (typeof log==='function') log('email','Sistema','⏳ Email pendiente config → '+toEmail);
    return Promise.resolve(false);
  }
  return emailjs.send(EMAILJS_SVC, EMAILJS_TPL, {
    to_email: toEmail, to_name: toName||'Usuario', subject: subject, message: body
  }).then(function(){
    console.log('[AUTO-EMAIL] ✅', toEmail);
    if(typeof log==='function') log('email','Sistema','✅ Enviado → '+toEmail+' | '+subject);
    return true;
  }).catch(function(err){
    console.warn('[AUTO-EMAIL] ❌', err);
    if(typeof log==='function') log('email','Sistema','❌ Error → '+toEmail+' | '+err);
    return false;
  });
}

// ===== CORREOS AUTOMÁTICOS POR EVENTO =====

function autoEmailProgramado(prog) {
  var eq = D.eq.find(function(e){return e.ide===prog.eq;});
  if (!eq) return; var email = findEmailByName(eq.usr); if (!email) return;
  var n = findFullName(eq.usr);
  sendEmailAlert(email, n,
    'DEBBIOM TI — Mantenimiento programado',
    'Hola '+n+',\n\nSe programó mantenimiento para tu equipo:\n\n💻 Equipo: '+prog.eq+'\n📅 Fecha: '+prog.fp+(prog.hr!==undefined&&prog.hr!==''?'\n🕐 Hora: '+prog.hr+':00':'')+'\n\nTen tu equipo disponible en la fecha indicada.\nSi necesitas reagendar, comunícate con TI.\n\n— DEBBIOM TI');
}

function autoEmailRecordatorio(prog, dias) {
  var eq = D.eq.find(function(e){return e.ide===prog.eq;});
  if (!eq) return; var email = findEmailByName(eq.usr); if (!email) return;
  var n = findFullName(eq.usr);
  var esHoy = dias===0;
  sendEmailAlert(email, n,
    'DEBBIOM TI — '+(esHoy?'⚡ Mantenimiento HOY':'Recordatorio: mantenimiento en '+dias+' día(s)'),
    'Hola '+n+',\n\n'+(esHoy?'⚡ Tu mantenimiento es HOY.\n\n':'Recordatorio: en '+dias+' día(s) tienes mantenimiento.\n\n')+'💻 Equipo: '+prog.eq+'\n📅 Fecha: '+prog.fp+(prog.hr!==undefined&&prog.hr!==''?'\n🕐 Hora: '+prog.hr+':00':'')+'\n\nTen tu equipo disponible.\n\n— DEBBIOM TI');
}

function autoEmailEnProceso(prog) {
  var eq = D.eq.find(function(e){return e.ide===prog.eq;});
  if (!eq) return; var email = findEmailByName(eq.usr); if (!email) return;
  var n = findFullName(eq.usr);
  sendEmailAlert(email, n,
    'DEBBIOM TI — Tu equipo está en mantenimiento',
    'Hola '+n+',\n\nTu equipo está siendo atendido:\n\n💻 Equipo: '+prog.eq+'\n🔧 Atendido por: '+(prog.por||'TI')+'\n\nTe notificaremos cuando esté listo.\n\n— DEBBIOM TI');
}

function autoEmailCompletado(prog) {
  var eq = D.eq.find(function(e){return e.ide===prog.eq;});
  if (!eq) return; var email = findEmailByName(eq.usr); if (!email) return;
  var n = findFullName(eq.usr);
  sendEmailAlert(email, n,
    'DEBBIOM TI — ✅ Mantenimiento completado',
    'Hola '+n+',\n\nTu mantenimiento fue completado:\n\n💻 Equipo: '+prog.eq+'\n📅 Fecha: '+prog.fp+'\n👨‍💻 Realizó: '+(prog.por||'TI')+'\n\nPor favor llena la encuesta de satisfacción desde la app.\n\n— DEBBIOM TI');
}

// ===== CONFIG (solo admin, 1 vez) =====
function openEmailConfig() {
  if(!isAdmin()){toast('⛔','er');return;}
  var s={}; try{s=JSON.parse(localStorage.getItem('ti2_emailcfg')||'{}');}catch(e){}
  var h='<div style="padding:12px;margin-bottom:14px;background:rgba(0,131,143,.05);border-radius:10px;font-size:11px;line-height:1.6">';
  h+='<b style="color:var(--deb-teal)"><i class="fas fa-info-circle"></i> Tu Public Key ya está configurada ✅</b><br>';
  h+='Solo faltan 2 pasos en <a href="https://dashboard.emailjs.com" target="_blank" style="color:var(--deb-teal);font-weight:700">dashboard.emailjs.com</a>:<br>';
  h+='<b>1.</b> Ve a <b>Email Services</b> → Add New Service → conecta Gmail/Outlook → copia el <b>Service ID</b><br>';
  h+='<b>2.</b> Ve a <b>Email Templates</b> → Create New Template → pon estas variables en el cuerpo:<br>';
  h+='<code style="background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:10px">Asunto: {{subject}}</code> <code style="background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:10px">Para: {{to_email}}</code> <code style="background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:10px">Nombre: {{to_name}}</code> <code style="background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:10px">Mensaje: {{message}}</code><br>';
  h+='→ copia el <b>Template ID</b> y pégalo aquí abajo</div>';
  h+='<div class="fgrid"><div class="fg"><label>Public Key ✅</label><input id="ejs_pk" value="'+E(s.pk||EMAILJS_PK||'')+'" style="background:rgba(67,160,71,.06);border-color:var(--emerald)"></div>';
  h+='<div class="fg"><label>Service ID *</label><input id="ejs_svc" value="'+E(s.svc||'')+'" placeholder="ej: service_xxxxxxxx"></div></div>';
  h+='<div class="fg"><label>Template ID *</label><input id="ejs_tpl" value="'+E(s.tpl||'')+'" placeholder="ej: template_xxxxxxxx"></div>';
  h+='<div style="margin-top:14px"><label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px"><i class="fas fa-clock"></i> Recordatorios automáticos</label>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap">';
  var dias=s.dias||[3,1,0];
  [7,3,1,0].forEach(function(d){var chk=dias.indexOf(d)>=0?' checked':'';var l=d===0?'Mismo día':d+' día'+(d>1?'s':'')+' antes';
    h+='<label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer"><input type="checkbox" class="ejsDia" value="'+d+'"'+chk+'> '+l+'</label>';});
  h+='</div></div>';
  var ok=EMAILJS_PK&&EMAILJS_SVC&&EMAILJS_TPL;
  var partial=EMAILJS_PK&&(!EMAILJS_SVC||!EMAILJS_TPL);
  var statusMsg=ok?'✅ Listo — correos automáticos activos':(partial?'🔑 Public Key OK — falta Service ID y Template ID':'⚠️ Sin configurar');
  var statusClr=ok?'var(--emerald)':(partial?'var(--amber)':'var(--rose)');
  h+='<div style="margin-top:14px;padding:10px;border-radius:8px;font-size:11px;font-weight:600;color:'+statusClr+'"><i class="fas fa-circle" style="font-size:7px"></i> '+statusMsg+'</div>';
  h+='<div style="margin-top:10px"><button class="btn btn-s btn-sm" onclick="testEmailSend()"><i class="fas fa-paper-plane"></i> Prueba</button></div>';
  oM('📧 Config Correo Automático',h,'<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="saveEmailConfig()">💾 Guardar</button>');
}
function saveEmailConfig(){
  var dias=[];document.querySelectorAll('.ejsDia:checked').forEach(function(c){dias.push(parseInt(c.value));});
  var pk=$('ejs_pk').value.trim()||EMAILJS_PK;
  localStorage.setItem('ti2_emailcfg',JSON.stringify({pk:pk,svc:$('ejs_svc').value.trim(),tpl:$('ejs_tpl').value.trim(),dias:dias}));
  loadEmailConfig();toast('📧 Guardado','ok');cM();
}
function loadEmailConfig(){
  try{var c=JSON.parse(localStorage.getItem('ti2_emailcfg')||'{}');
  EMAILJS_SVC=c.svc||'';EMAILJS_TPL=c.tpl||'';
  // PK: usar guardada o la hardcodeada
  if(c.pk) EMAILJS_PK=c.pk; 
  if(EMAILJS_PK&&typeof emailjs!=='undefined')emailjs.init(EMAILJS_PK);}catch(e){}
}
function testEmailSend(){
  if(!U)return;saveEmailConfig();
  var email=findEmailByName(U.n)||prompt('Tu correo:');if(!email){toast('Sin correo','wa');return;}
  sendEmailAlert(email,U.n,'🧪 Prueba DEBBIOM TI','Si recibes esto, los correos automáticos funcionan.\n\n— DEBBIOM TI')
    .then(function(ok){toast(ok?'📧 Enviado a '+email:'⚠️ Error — revisa config',ok?'ok':'er');});
}

// ===== DIRECTORIO EDITABLE (admin) =====
function openEmailDir(){
  if(!isAdmin()){toast('⛔','er');return;}
  var cu={};try{cu=JSON.parse(localStorage.getItem('ti2_emaildir')||'{}');}catch(e){}
  var h='<div style="font-size:11px;color:var(--text3);margin-bottom:10px"><i class="fas fa-info-circle"></i> El sistema vincula automáticamente cada nombre con su correo. Edita si alguno cambió.</div>';
  h+='<div style="max-height:400px;overflow-y:auto"><table style="width:100%;font-size:11px"><thead><tr><th style="text-align:left">Nombre (BD)</th><th style="text-align:left">Correo vinculado</th><th></th></tr></thead><tbody>';
  var seen={};
  D.eq.forEach(function(e){
    if(e.usr&&!seen[e.usr.toLowerCase()]){seen[e.usr.toLowerCase()]=true;
      var em=cu[e.usr]||findEmailByName(e.usr);
      var ico=em?'<i class="fas fa-check-circle" style="color:var(--emerald)"></i>':'<i class="fas fa-times-circle" style="color:var(--rose)"></i>';
      h+='<tr><td><b>'+E(e.usr)+'</b></td><td><input class="dirEmail" data-usr="'+E(e.usr)+'" value="'+E(em||'')+'" placeholder="correo@empresa.com" style="width:100%;padding:4px 8px;border-radius:5px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:10px"></td><td>'+ico+'</td></tr>';}
  });
  h+='</tbody></table></div>';
  oM('📋 Directorio de Correos',h,'<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="saveEmailDir()">💾 Guardar</button>');
}
function saveEmailDir(){
  var cu={};document.querySelectorAll('.dirEmail').forEach(function(i){var u=i.dataset.usr,e=i.value.trim();if(u&&e)cu[u]=e;});
  localStorage.setItem('ti2_emaildir',JSON.stringify(cu));toast('📋 Actualizado','ok');cM();
}
