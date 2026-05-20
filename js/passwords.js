/**
 * CONTRASEÑAS — Gestión de credenciales de equipos
 * CRUD con buscador
 */

function rPW() {
  if (!isAdmin()) { $('sPw').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sPw');
  var h = '<div style="display:flex;gap:8px;margin-bottom:14px">';
  h += '<button class="btn btn-p" onclick="oPn()"><i class="fas fa-plus"></i> Nuevo</button>';
  h += '<input id="wSrch" placeholder="🔍 Buscar..." style="padding:8px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:11px;flex:1;min-width:140px" oninput="rPW()"></div>';

  var q = ($('wSrch')?.value || '').toLowerCase();
  var data = D.pw.filter(function(p) { return !q || p.hst.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q) || p.cod.toLowerCase().includes(q); });

  h += '<div class="tw"><table><thead><tr><th>Hostname</th><th>Código Inventario</th><th>Nombre</th><th>Contraseña</th><th>Acciones</th></tr></thead><tbody>';
  if (!data.length) h += '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text3)">Sin registros</td></tr>';
  data.forEach(function(p) {
    h += '<tr><td><b>' + E(p.hst) + '</b></td><td>' + E(p.cod) + '</td><td>' + E(p.nom) + '</td>';
    h += '<td><code id="pw_' + p.id + '" style="background:var(--bg3);padding:3px 8px;border-radius:4px;font-size:10px">••••••••</code> ';
    h += '<button class="btn btn-sm btn-s" onclick="togglePw(\'' + p.id + '\',\'' + E(p.pas).replace(/'/g,'&#39;') + '\')" title="Mostrar/Ocultar"><i class="fas fa-eye"></i></button></td>';
    h += '<td style="white-space:nowrap"><button class="btn btn-sm btn-s" onclick="oPe(\'' + p.id + '\')"><i class="fas fa-pen"></i></button> ';
    h += '<button class="btn btn-sm btn-d" onclick="dW(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function togglePw(id, pw) {
  var el = $('pw_' + id);
  if (!el) return;
  if (el.textContent === '••••••••') { el.textContent = pw; } else { el.textContent = '••••••••'; }
}

function oPn() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  eId = null;
  var h = '<div class="fg"><label>Hostname *</label><input id="wHs"></div>';
  h += '<div class="fgrid"><div class="fg"><label>Código Inventario *</label><input id="wCd"></div><div class="fg"><label>Nombre *</label><input id="wNm"></div></div>';
  h += '<div class="fg"><label>Contraseña *</label><input id="wPs"></div>';
  oM('🔑 Nueva Contraseña', h, '<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="sW()">💾 Guardar</button>');
}

function oPe(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  oPn();
  setTimeout(function() {
    eId = id;
    var p = D.pw.find(function(x) { return x.id === id; }); if (!p) return;
    $('wHs').value = p.hst; $('wCd').value = p.cod; $('wNm').value = p.nom; $('wPs').value = p.pas;
    $('mt').textContent = '✏️ Editar';
  }, 50);
}

function sW() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var hs = $('wHs').value.trim(), cd = $('wCd').value.trim(), nm = $('wNm').value.trim(), ps = $('wPs').value.trim();
  if (!hs || !cd || !nm || !ps) { toast('Todos obligatorios', 'er'); return; }
  // Prevenir duplicados
  if (!eId) {
    var dup = D.pw.find(function(p) { return p.cod === cd; });
    if (dup) { toast('⚠️ Ya existe un registro con código ' + cd, 'wa'); return; }
  }
  var r = { id: eId || gId(), hst: hs, cod: cd, nom: nm, pas: ps };
  if (eId) {
    var i = D.pw.findIndex(function(p) { return p.id === eId; }); if (i >= 0) D.pw[i] = r;
    log('edit', 'Contraseñas', 'Editó ' + hs); toast('✏️ Actualizado', 'ok');
  } else {
    D.pw.push(r); log('create', 'Contraseñas', 'Creó ' + hs); toast('✅ Registrado', 'ok');
  }
  sv(); cM(); R(cSec);
}

function dW(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var p = D.pw.find(function(x) { return x.id === id; });
  if (!p || !confirm('¿Eliminar ' + p.hst + '?')) return;
  D.pw = D.pw.filter(function(x) { return x.id !== id; });
  D.pap.push({ o: 'pw', d: p, t: new Date().toISOString() });
  log('delete', 'Contraseñas', 'Eliminó ' + p.hst); sv(); toast('🗑️', 'wa'); R(cSec);
}
