/**
 * PROGRAMACIÓN — CRUD de mantenimientos programados
 * Vinculado al calendario, sin duplicados
 */

function rProg() {
  if (!isAdmin()) { $('sProg').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sProg');
  var t = D.prog.length;
  var ok = D.prog.filter(function(p) { return p.st === 'listo'; }).length;
  var pr = D.prog.filter(function(p) { return p.st === 'proceso'; }).length;
  var pe = t - ok - pr;

  var h = '<div class="stats-r">';
  h += '<div class="stat"><div class="stat-n" style="color:var(--teal)">' + t + '</div><div class="stat-l">Total</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--emerald)">' + ok + '</div><div class="stat-l">Listos</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--amber)">' + pr + '</div><div class="stat-l">En Proceso</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--rose)">' + pe + '</div><div class="stat-l">Pendientes</div></div></div>';

  h += '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">';
  h += '<button class="btn btn-p" onclick="oPN()"><i class="fas fa-plus"></i> Nuevo</button>';
  h += '<input id="pSrch" placeholder="🔍 Buscar equipo..." style="padding:8px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:11px;flex:1;min-width:140px" oninput="rProg()"></div>';

  var q = ($('pSrch')?.value || '').toLowerCase();
  var data = D.prog.filter(function(p) {
    return !q || p.eq.toLowerCase().includes(q) || (p.por || '').toLowerCase().includes(q);
  });

  h += '<div class="tw"><table><thead><tr><th>Código</th><th>F. Programada</th><th>Hora</th><th>F. Realizado</th><th>Realizado Por</th><th>Estado</th><th>Comentarios</th><th>F. Entrega</th><th>Acciones</th></tr></thead><tbody>';
  if (!data.length) h += '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text3)">Sin registros</td></tr>';
  data.forEach(function(p) {
    var bc = p.st === 'listo' ? 'b-ok' : p.st === 'proceso' ? 'b-warn' : 'b-err';
    h += '<tr><td><b>' + E(p.eq) + '</b></td><td>' + fd2(p.fp) + '</td><td>' + (p.hr !== undefined && p.hr !== '' && typeof fmtHrShort === 'function' ? fmtHrShort(p.hr) : '—') + '</td><td>' + fd2(p.fr) + '</td>';
    h += '<td>' + E(p.por || '—') + '</td><td><span class="badge ' + bc + '">' + E(p.st || 'pendiente') + '</span></td>';
    h += '<td style="max-width:130px;overflow:hidden;text-overflow:ellipsis" title="' + E(p.com) + '">' + E(p.com || '—') + '</td>';
    h += '<td>' + fd2(p.fe) + '</td>';
    h += '<td style="white-space:nowrap">';
    h += '<button class="btn btn-sm btn-s" onclick="vP(\'' + p.id + '\')"><i class="fas fa-eye"></i></button> ';
    h += '<button class="btn btn-sm btn-s" onclick="if(typeof sendManualAlert===\'function\')sendManualAlert(\'' + p.id + '\')" title="Enviar recordatorio"><i class="fas fa-paper-plane"></i></button> ';
    h += '<button class="btn btn-sm btn-s" onclick="oPE(\'' + p.id + '\')"><i class="fas fa-pen"></i></button> ';
    h += '<button class="btn btn-sm btn-d" onclick="dP(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function oPN(dt) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  eId = null;
  var eqO = D.eq.map(function(e) { return '<option value="' + E(e.ide) + '">' + E(e.ide) + ' — ' + E(e.usr) + '</option>'; }).join('');
  var h = '<div class="fgrid"><div class="fg"><label>Código Equipo *</label><input list="dl1" id="fEq" placeholder="AI0000XXX"><datalist id="dl1">' + eqO + '</datalist></div>';
  h += '<div class="fg"><label>F. Programada *</label><input type="date" id="fFp" value="' + (dt || '') + '"></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>Hora *</label><select id="fHr"><option value="">— Seleccionar —</option><option value="8">8:00 AM</option><option value="9">9:00 AM</option><option value="10">10:00 AM</option><option value="11">11:00 AM</option><option value="12">12:00 PM</option><option value="14">2:00 PM</option><option value="15">3:00 PM</option><option value="16">4:00 PM</option></select></div>';
  h += '<div class="fg"><label>Realizado Por</label><input id="fPor" value="' + (U ? U.n : '') + '"></div></div>';
  h += '<div class="fg"><label>Estado</label><select id="fSt"><option value="pendiente">Pendiente</option><option value="proceso">En proceso</option><option value="listo">Equipo Listo</option></select></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>F. Realizado</label><input type="date" id="fFr"></div>';
  h += '<div class="fg"><label>F. Entrega</label><input type="date" id="fFe"></div></div>';
  h += '<div class="fg"><label>Comentarios</label><textarea id="fCom" rows="2"></textarea></div>';
  oM('➕ Programar Mantenimiento', h, '<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="sP()">💾 Guardar</button>');
}

function oPE(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var p = D.prog.find(function(x) { return x.id === id; });
  if (!p) return;
  oPN();
  setTimeout(function() {
    eId = id;
    $('fEq').value = p.eq; $('fFp').value = p.fp; $('fHr').value = p.hr || ''; $('fPor').value = p.por || '';
    $('fSt').value = p.st || 'pendiente'; $('fFr').value = p.fr || '';
    $('fFe').value = p.fe || ''; $('fCom').value = p.com || '';
    $('mt').textContent = '✏️ Editar Programación';
  }, 50);
}

function sP() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var eq = $('fEq').value.trim(), fp = $('fFp').value, hr = $('fHr').value;
  if (!eq || !fp) { toast('Equipo y fecha son obligatorios', 'er'); return; }
  if (!hr) { toast('Selecciona una hora', 'er'); return; }
  hr = parseInt(hr);

  // Validar duplicados
  var dup = D.prog.find(function(p) { return p.eq === eq && p.fp === fp && p.id !== eId; });
  if (dup) { toast('Ya existe mantenimiento para ese equipo en esa fecha', 'wa'); return; }

  // Validar capacidad (máx 3 por hora)
  var enHora = D.prog.filter(function(p) { return p.fp === fp && parseInt(p.hr) === hr && p.st !== 'listo' && p.id !== eId; }).length;
  if (enHora >= 3) { toast('⚠️ Esa hora ya tiene 3 equipos. Elige otra.', 'wa'); return; }

  var r = { id: eId || gId(), eq: eq, fp: fp, hr: hr, fr: $('fFr').value || '', por: $('fPor').value.trim(), st: $('fSt').value, com: $('fCom').value.trim(), fe: $('fFe').value || '' };

  if (eId) {
    var i = D.prog.findIndex(function(p) { return p.id === eId; });
    if (i >= 0) D.prog[i] = r;
    log('edit', 'Programación', 'Editó ' + eq);
    toast('✏️ Actualizado', 'ok');
  } else {
    D.prog.push(r);
    log('create', 'Programación', 'Programó ' + eq);
    toast('✅ Programado', 'ok');
    // Notificación + correo automático
    if (typeof addNotif === 'function') {
      addNotif('fas fa-calendar-plus', '📅 Nuevo mantenimiento', eq + ' programado para ' + fp, 'status');
    }
    if (typeof autoEmailProgramado === 'function') {
      autoEmailProgramado(r);
    }
  }
  sv(); cM(); R(cSec);
}

function dP(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var p = D.prog.find(function(x) { return x.id === id; });
  if (!p || !confirm('¿Eliminar programación de ' + p.eq + '?')) return;
  D.prog = D.prog.filter(function(x) { return x.id !== id; });
  D.pap.push({ o: 'prog', d: p, t: new Date().toISOString() });
  log('delete', 'Programación', 'Eliminó ' + p.eq);
  sv(); toast('🗑️ Eliminado', 'wa'); R(cSec);
}

function vP(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var p = D.prog.find(function(x) { return x.id === id; });
  if (!p) return;
  log('view', 'Programación', 'Visualizó ' + p.eq);
  var bc = p.st === 'listo' ? 'b-ok' : p.st === 'proceso' ? 'b-warn' : 'b-err';
  var h = '<div class="fgrid"><div class="fg"><label>Equipo</label><div style="padding:9px;background:var(--bg3);border-radius:7px;font-weight:700">' + E(p.eq) + '</div></div>';
  h += '<div class="fg"><label>Estado</label><div><span class="badge ' + bc + '" style="font-size:12px">' + E(p.st) + '</span></div></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>F. Programada</label><div style="padding:9px;background:var(--bg3);border-radius:7px">' + fd2(p.fp) + '</div></div>';
  h += '<div class="fg"><label>Hora</label><div style="padding:9px;background:var(--bg3);border-radius:7px">' + (p.hr !== undefined && p.hr !== '' && typeof fmtHrShort === 'function' ? fmtHrShort(p.hr) : '—') + '</div></div></div>';
  h += '<div class="fgrid"><div class="fg"><label>F. Realizado</label><div style="padding:9px;background:var(--bg3);border-radius:7px">' + fd2(p.fr) + '</div></div>';
  h += '<div class="fgrid"><div class="fg"><label>Realizado Por</label><div style="padding:9px;background:var(--bg3);border-radius:7px">' + E(p.por || '—') + '</div></div>';
  h += '<div class="fg"><label>F. Entrega</label><div style="padding:9px;background:var(--bg3);border-radius:7px">' + fd2(p.fe) + '</div></div></div>';
  h += '<div class="fg"><label>Comentarios</label><div style="padding:9px;background:var(--bg3);border-radius:7px;white-space:pre-wrap">' + E(p.com || '—') + '</div></div>';
  oM('👁️ ' + p.eq, h, '<button class="btn btn-s" onclick="cM()">Cerrar</button>');
}
