/**
 * BD EQUIPOS — Base de datos de equipos
 * CRUD vinculado a Comprobantes y Programación
 */

function rBD() {
  if (!isAdmin()) { $('sBd').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sBd');
  var h = '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">';
  h += '<button class="btn btn-p" onclick="oBN()"><i class="fas fa-plus"></i> Nuevo</button>';
  h += '<input id="bSrch" placeholder="🔍 Buscar..." style="padding:8px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:11px;flex:1;min-width:140px" oninput="rBD()"></div>';

  var q = ($('bSrch')?.value || '').toLowerCase();
  var data = D.eq.filter(function(e) { return !q || e.usr.toLowerCase().includes(q) || e.ide.toLowerCase().includes(q) || e.hst.toLowerCase().includes(q); });

  h += '<div class="tw"><table><thead><tr><th>Usuario</th><th>Host</th><th>Tipo</th><th>ID Equipo</th><th>F. Recibe</th><th>F. Programación</th><th>Acciones</th></tr></thead><tbody>';
  if (!data.length) h += '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3)">Sin equipos registrados</td></tr>';
  data.forEach(function(e) {
    h += '<tr><td><b>' + E(e.usr) + '</b></td><td>' + E(e.hst) + '</td><td>' + E(e.tip) + '</td>';
    h += '<td><code style="background:var(--emerald-l);padding:2px 6px;border-radius:4px;color:var(--emerald);font-size:10px">' + E(e.ide) + '</code></td>';
    h += '<td>' + fd2(e.frc) + '</td><td>' + fd2(e.fpr) + '</td>';
    h += '<td style="white-space:nowrap"><button class="btn btn-sm btn-s" onclick="oBE(\'' + e.id + '\')"><i class="fas fa-pen"></i></button> ';
    h += '<button class="btn btn-sm btn-d" onclick="dB(\'' + e.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function oBN() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  eId = null;
  var h = '<div class="fgrid"><div class="fg"><label>Usuario *</label><input id="bUs"></div><div class="fg"><label>Host *</label><input id="bHs"></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>Tipo</label><select id="bTp"><option>CPU</option><option>Laptop</option></select></div><div class="fg"><label>ID Equipo *</label><input id="bId"></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>F. Recibe</label><input type="date" id="bFr"></div><div class="fg"><label>F. Programación</label><input type="date" id="bFp"></div></div>';
  oM('➕ Nuevo Equipo', h, '<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="sB()">💾 Guardar</button>');
}

function oBE(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  oBN();
  setTimeout(function() {
    eId = id;
    var e = D.eq.find(function(x) { return x.id === id; }); if (!e) return;
    $('bUs').value = e.usr; $('bHs').value = e.hst; $('bTp').value = e.tip || 'CPU';
    $('bId').value = e.ide; $('bFr').value = e.frc || ''; $('bFp').value = e.fpr || '';
    $('mt').textContent = '✏️ Editar Equipo';
  }, 50);
}

function sB() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var us = $('bUs').value.trim(), hs = $('bHs').value.trim(), id = $('bId').value.trim();
  if (!us || !hs || !id) { toast('Campos obligatorios', 'er'); return; }
  // Prevenir duplicados de ID de equipo
  if (!eId) {
    var dup = D.eq.find(function(e) { return e.ide === id; });
    if (dup) { toast('⚠️ Ya existe un equipo con ID ' + id, 'wa'); return; }
  }
  var r = { id: eId || gId(), usr: us, hst: hs, tip: $('bTp').value, ide: id, frc: $('bFr').value, fpr: $('bFp').value };
  if (eId) {
    var i = D.eq.findIndex(function(e) { return e.id === eId; }); if (i >= 0) D.eq[i] = r;
    log('edit', 'BD', 'Editó ' + id); toast('✏️ Actualizado', 'ok');
  } else {
    D.eq.push(r); log('create', 'BD', 'Creó ' + id); toast('✅ Registrado', 'ok');
  }
  sv(); cM(); R(cSec);
}

function dB(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var e = D.eq.find(function(x) { return x.id === id; });
  if (!e || !confirm('¿Eliminar ' + e.ide + '?')) return;
  D.eq = D.eq.filter(function(x) { return x.id !== id; });
  D.pap.push({ o: 'eq', d: e, t: new Date().toISOString() });
  log('delete', 'BD', 'Eliminó ' + e.ide); sv(); toast('🗑️ Eliminado', 'wa'); R(cSec);
}
