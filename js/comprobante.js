/**
 * COMPROBANTE — Admin crea sin encuesta, Empleado llena solo encuesta
 */
var ACTS = ['Limpieza física Interna','Revisión de pasta térmica','Revisión de cables y conectores','Revisión de estado del SSD','Escaneo de Antivirus Bit Defender','Eliminación de Archivos Temporales','Verificación de Respaldo en NAS'];
var PREGS = ['En general ¿Cómo calificaría el servicio que recibió por parte del departamento de TI?','El tiempo en que se le brindó el servicio fue:','El trato que le brindó el personal que realizó el servicio fue:'];

// ===== LISTADO =====
function rComp() {
  var el = $('sComp'), admin = isAdmin();

  var h = '';
  if (admin) h += '<div style="margin-bottom:14px"><button class="btn btn-p" onclick="oCN()"><i class="fas fa-plus"></i> Nuevo Comprobante</button></div>';

  h += '<div class="tw"><table><thead><tr>';
  h += '<th>ID Equipo</th><th>Usuario</th>';
  if (!admin) h += '<th>Departamento</th>';
  h += '<th>Fecha</th><th>TI</th><th>Encuesta</th><th>Acciones</th></tr></thead><tbody>';

  // Empleado: solo ve comprobantes que coincidan con su nombre o apellido (parcial)
  var compList = D.comp;
  if (!admin && U) {
    var empQ = U.n.toLowerCase().trim();
    var empParts = empQ.split(/\s+/).filter(function(w) { return w.length >= 2; });
    if (!empParts.length) empParts = [empQ];
    compList = D.comp.filter(function(c) {
      var usr = (c.usr || '').toLowerCase();
      return empParts.some(function(part) {
        return usr.indexOf(part) >= 0;
      });
    });
  }

  if (!compList.length) h += '<tr><td colspan="' + (admin ? 6 : 7) + '" style="text-align:center;padding:30px;color:var(--text3)">Sin comprobantes</td></tr>';

  compList.forEach(function(c) {
    // Buscar datos del equipo para mostrar departamento
    var eqData = D.eq.find(function(e) { return e.ide === c.ide; });
    h += '<tr><td><b style="color:var(--deb-teal)">' + E(c.ide) + '</b></td>';
    h += '<td>' + E(c.usr) + '</td>';
    if (!admin) {
      h += '<td><span class="badge b-info">' + E(eqData ? eqData.tip : '—') + '</span></td>';
    }
    h += '<td>' + fd2(c.fch) + '</td><td>' + E(c.ti || '—') + '</td>';
    h += '<td>' + (c.enc ? '<span class="badge b-ok">✅ Llenada</span>' : '<span class="badge b-err">⏳ Pendiente</span>') + '</td>';
    h += '<td style="white-space:nowrap">';

    if (admin) {
      // Admin: ver, editar, PDF, correo, eliminar
      h += '<button class="btn btn-sm btn-s" onclick="vC(\'' + c.id + '\')"><i class="fas fa-eye"></i></button> ';
      h += '<button class="btn btn-sm btn-s" onclick="oCE(\'' + c.id + '\')"><i class="fas fa-pen"></i></button> ';
      h += '<button class="btn btn-sm btn-p" onclick="dlC(\'' + c.id + '\')"><i class="fas fa-file-pdf"></i></button> ';
      h += '<button class="btn btn-sm btn-w" onclick="emC(\'' + c.id + '\')"><i class="fas fa-envelope"></i></button> ';
      h += '<button class="btn btn-sm btn-d" onclick="dC(\'' + c.id + '\')"><i class="fas fa-trash"></i></button>';
    } else {
      // Empleado: ver + encuesta (solo si no está llenada)
      h += '<button class="btn btn-sm btn-s" onclick="vC(\'' + c.id + '\')"><i class="fas fa-eye"></i> Ver</button> ';
      if (c.enc) {
        h += '<button class="btn btn-sm btn-s" disabled style="opacity:.5;cursor:not-allowed"><i class="fas fa-check-circle"></i> Ya llenada</button>';
      } else {
        h += '<button class="btn btn-sm btn-p" onclick="oEncuesta(\'' + c.id + '\')"><i class="fas fa-star"></i> Llenar Encuesta</button>';
      }
    }
    h += '</td></tr>';
  });

  h += '</tbody></table></div>';

  // Empleado: mensaje informativo
  if (!admin) {
    h += '<div style="margin-top:14px;padding:14px;background:rgba(0,131,143,.05);border:1px solid rgba(0,131,143,.15);border-radius:10px;font-size:12px;color:var(--text2)">';
    h += '<i class="fas fa-info-circle" style="color:var(--deb-teal)"></i> <b>' + E(U.n) + '</b> — Selecciona tu equipo y haz clic en <b>"Llenar Encuesta"</b> para completar la encuesta de satisfacción.';
    h += '</div>';
  }

  el.innerHTML = h;
}

// ===== FORMULARIO ADMIN (sin encuesta) =====
function oCN() {
  if (!isAdmin()) return;
  eId = null;
  var eqO = D.eq.map(function(e) { return '<option value="' + E(e.ide) + '">' + E(e.ide) + ' — ' + E(e.usr) + '</option>'; }).join('');
  var h = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
  h += '<div class="fg"><label>ID Equipo *</label><input list="dl2" id="cEq" placeholder="AI0000XXX" onchange="fillC()"><datalist id="dl2">' + eqO + '</datalist></div>';
  h += '<div class="fg"><label>F. Programación</label><input type="date" id="cFp"></div>';
  h += '<div class="fg"><label>TI</label><input id="cTi" value="' + (U ? U.n : '') + '"></div>';
  h += '<div class="fg"><label>Host del Equipo</label><input id="cHo" placeholder="DESKTOP-XXX"></div>';
  h += '<div class="fg"><label>Usuario</label><input id="cUs" placeholder="Nombre"></div>';
  h += '<div class="fg"><label>Tipo de Equipo</label><select id="cTp"><option>CPU</option><option>Laptop</option></select></div>';
  h += '<div class="fg"><label>F. Recibe Equipo</label><input type="date" id="cFr"></div>';
  h += '<div class="fg"><label>F. Entrega Equipo</label><input type="date" id="cFe"></div></div>';

  h += '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border)">';
  h += '<div class="card-t"><i class="fas fa-clipboard-check" style="color:var(--deb-teal)"></i> Actividades</div>';
  h += '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 14px;align-items:center">';
  ACTS.forEach(function(a, i) {
    h += '<label style="font-size:11px;display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" id="a' + i + '" checked style="width:16px;height:16px;accent-color:var(--deb-teal)"> ' + a + '</label>';
    h += '<input id="ac' + i + '" placeholder="Comentario..." style="padding:8px 10px;border-radius:7px;border:1.5px solid var(--border);background:#fff;font-size:11px">';
  });
  h += '</div></div>';

  h += '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border)">';
  h += '<div class="fg"><label>Comentarios Generales</label><textarea id="cCg" rows="2" placeholder="Estado general..." style="resize:vertical"></textarea></div></div>';

  // NO incluir encuesta — eso es para el empleado
  h += '<div style="margin-top:14px;padding:12px;background:rgba(239,108,0,.06);border:1px solid rgba(239,108,0,.15);border-radius:8px;font-size:11px;color:var(--warning)">';
  h += '<i class="fas fa-info-circle"></i> La encuesta de satisfacción será llenada por el empleado/usuario del equipo.';
  h += '</div>';

  oM('📄 Nuevo Comprobante', h, '<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="sC()">💾 Guardar</button>');
}

function fillC() {
  var eq = $('cEq').value.trim();
  var f = D.eq.find(function(e) { return e.ide === eq; });
  if (f) { $('cHo').value = f.hst || ''; $('cUs').value = f.usr || ''; if (f.tip) $('cTp').value = f.tip; }
  var pr = D.prog.find(function(p) { return p.eq === eq; });
  if (pr) $('cFp').value = pr.fp || '';
}

// ===== GUARDAR (Admin) =====
function sC() {
  if (!isAdmin()) return;
  var eq = $('cEq').value.trim();
  if (!eq) { toast('ID equipo obligatorio', 'er'); return; }
  if (!eId) { var ex = D.comp.find(function(c) { return c.ide === eq; }); if (ex) { toast('⚠️ Ya existe comprobante para ' + eq, 'wa'); return; } }
  var al = [];
  ACTS.forEach(function(a, i) { if ($('a' + i).checked) al.push({ n: a, c: $('ac' + i).value.trim() }); });
  var nid = eId || gId();
  var r = { id: nid, ide: eq, fch: new Date().toISOString().split('T')[0], ti: $('cTi').value.trim(), hst: $('cHo').value.trim(), usr: $('cUs').value.trim(), tip: $('cTp').value, frc: $('cFr').value, fen: $('cFe').value, fpr: $('cFp').value, act: al, cg: $('cCg').value.trim(), enc: null };
  // Preservar encuesta existente si estamos editando
  if (eId) {
    var old = D.comp.find(function(c) { return c.id === eId; });
    if (old && old.enc) r.enc = old.enc;
  }
  if (eId) { var i = D.comp.findIndex(function(c) { return c.id === eId; }); if (i >= 0) D.comp[i] = r; log('edit','Comprobante','Editó '+eq); toast('✏️ Actualizado','ok'); }
  else { D.comp.push(r); log('create','Comprobante','Creó '+eq); toast('✅ Guardado','ok'); }

  // Actualizar programación a "proceso" cuando se crea/edita comprobante
  var progMatch = D.prog.find(function(p) { return p.eq === eq && p.st !== 'listo'; });
  if (progMatch) {
    progMatch.st = 'proceso';
    if (!progMatch.fr) progMatch.fr = new Date().toISOString().split('T')[0];
    log('auto','Programación','Auto → proceso: ' + eq + ' (comprobante llenado)');
    if (typeof notifyStatusChange === 'function') notifyStatusChange(progMatch, 'proceso');
  }

  sv(); cM(); R(cSec);
}

// ===== EDITAR (Admin — sin encuesta) =====
function oCE(id) {
  if (!isAdmin()) return;
  oCN();
  setTimeout(function() {
    eId = id;
    var c = D.comp.find(function(x) { return x.id === id; }); if (!c) return;
    $('cEq').value = c.ide; $('cTi').value = c.ti || ''; $('cHo').value = c.hst || '';
    $('cUs').value = c.usr || ''; $('cTp').value = c.tip || 'CPU';
    $('cFr').value = c.frc || ''; $('cFe').value = c.fen || ''; $('cFp').value = c.fpr || '';
    $('cCg').value = c.cg || '';
    if (c.act) ACTS.forEach(function(a, i) { var f = c.act.find(function(x) { return x.n === a; }); $('a'+i).checked = !!f; if (f && $('ac'+i)) $('ac'+i).value = f.c || ''; });
    $('mt').textContent = '✏️ Editar Comprobante';
  }, 80);
}

// ===== ENCUESTA — Solo Empleado, solo 1 vez =====
function oEncuesta(id) {
  var c = D.comp.find(function(x) { return x.id === id; }); if (!c) return;

  // Bloquear si ya fue llenada
  if (c.enc) {
    toast('⚠️ Esta encuesta ya fue llenada y no se puede modificar', 'wa');
    return;
  }

  var h = '<div style="padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:16px">';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">';
  h += '<div><b style="color:var(--text3)">ID Equipo:</b> <span style="color:var(--deb-teal);font-weight:700">' + E(c.ide) + '</span></div>';
  h += '<div><b style="color:var(--text3)">Usuario:</b> ' + E(c.usr) + '</div>';
  h += '<div><b style="color:var(--text3)">Host:</b> ' + E(c.hst || '—') + '</div>';
  h += '<div><b style="color:var(--text3)">TI:</b> ' + E(c.ti || '—') + '</div>';
  h += '</div></div>';

  h += '<div style="margin-bottom:12px;padding:10px 14px;background:rgba(0,131,143,.04);border-radius:8px;font-size:11px;color:var(--deb-teal)">';
  h += '<i class="fas fa-user"></i> Llenando como: <b>' + E(U.n) + '</b> (' + E(U.d) + ')';
  h += '</div>';

  h += '<div class="card-t"><i class="fas fa-star" style="color:var(--warning)"></i> Encuesta de Satisfacción</div>';
  h += '<div style="font-size:9px;color:var(--text3);margin-bottom:10px">E = Excelente · B = Bueno · R = Regular · M = Malo</div>';

  PREGS.forEach(function(q, i) {
    h += '<div style="margin-bottom:10px;padding:10px 12px;background:var(--bg3);border-radius:8px">';
    h += '<div style="font-size:11px;font-weight:500;margin-bottom:6px">' + (i+1) + '. ' + q + '</div>';
    h += '<div style="display:flex;gap:16px">';
    ['E','B','R','M'].forEach(function(v) {
      h += '<label style="font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;font-weight:600"><input type="radio" name="enc' + i + '" value="' + v + '" style="accent-color:var(--deb-teal)"> ' + v + '</label>';
    });
    h += '</div></div>';
  });

  oM('⭐ Encuesta de Satisfacción — ' + c.ide, h, '<button class="btn btn-s" onclick="cM()">Cancelar</button><button class="btn btn-p" onclick="saveEncuesta(\'' + c.id + '\')">💾 Guardar Encuesta</button>');
}

function saveEncuesta(compId) {
  var c = D.comp.find(function(x) { return x.id === compId; }); if (!c) return;

  // Doble seguridad: bloquear si ya fue llenada
  if (c.enc) {
    toast('⚠️ Esta encuesta ya fue llenada y no se puede modificar', 'wa');
    cM(); return;
  }

  var q1 = document.querySelector('input[name="enc0"]:checked');
  var q2 = document.querySelector('input[name="enc1"]:checked');
  var q3 = document.querySelector('input[name="enc2"]:checked');
  if (!q1 || !q2 || !q3) { toast('Responde las 3 preguntas', 'er'); return; }
  var enc = { q1: q1.value, q2: q2.value, q3: q3.value };
  c.enc = enc;

  // Actualizar o crear indicador (sin duplicar)
  var xi = D.ind.find(function(x) { return x.eid === c.ide; });
  if (xi) {
    xi.q1 = enc.q1; xi.q2 = enc.q2; xi.q3 = enc.q3;
    xi.f = new Date().toISOString(); xi.usr = U.n;
  } else {
    D.ind.push({ id: gId(), eid: c.ide, usr: U.n, f: new Date().toISOString(), q1: enc.q1, q2: enc.q2, q3: enc.q3, cid: compId });
  }

  log('edit', 'Encuesta', U.n + ' llenó encuesta de ' + c.ide);

  // Actualizar programación a "listo" cuando se llena encuesta
  var progMatch = D.prog.find(function(p) { return p.eq === c.ide; });
  if (progMatch) {
    progMatch.st = 'listo';
    if (!progMatch.fe) progMatch.fe = new Date().toISOString().split('T')[0];
    log('auto','Programación','Auto → listo: ' + c.ide + ' (encuesta llenada por ' + U.n + ')');
    if (typeof notifyStatusChange === 'function') notifyStatusChange(progMatch, 'listo');
  }

  sv(); cM(); toast('⭐ Encuesta guardada', 'ok'); R(cSec);
}

// ===== VISTA PREVIA =====
function vC(id) {
  var c = D.comp.find(function(x) { return x.id === id; }); if (!c) return;
  log('view','Comprobante','Visualizó ' + c.ide);
  var h = gPrt(c);
  var css = '<style>.pv table{width:100%;border-collapse:collapse;margin-bottom:5px;table-layout:fixed}.pv th,.pv td{border:1px solid #333;padding:4px 6px;font-size:9px;vertical-align:top;word-wrap:break-word}.pv th{background:#d5d5d5;font-weight:700;font-size:8px}.pv .hdr{border:2px solid #111;margin-bottom:6px}.pv .hdr td{border:none}.pv .lbl{font-weight:700;background:#ebebeb}.pv .cm{font-style:italic;white-space:normal;word-break:break-word}.pv .sig-row{display:flex;gap:20px;margin-top:16px}.pv .sig-box{flex:1;height:55px;border:1.5px solid #333;position:relative}.pv .sig-box span{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:7px;font-weight:700;border-top:1px solid #333;padding:2px 0;background:#f5f5f5}.pv .ft{text-align:center;font-size:7px;color:#fff;padding:3px;background:#00838f;margin-top:6px}</style>';
  var ftr = '<button class="btn btn-s" onclick="cM()">Cerrar</button>';
  if (isAdmin()) ftr += '<button class="btn btn-p" onclick="dlC(\'' + c.id + '\')"><i class="fas fa-file-pdf"></i> PDF</button>';
  oM('👁️ ' + c.ide, css + '<div class="pv" style="background:#fff;color:#000;border:1px solid var(--border);border-radius:8px;padding:16px;max-height:62vh;overflow-y:auto;font-family:Helvetica,Arial,sans-serif;font-size:9px">' + h + '</div>', ftr);
}

// ===== ELIMINAR + encuesta =====
function dC(id) {
  if (!isAdmin()) return;
  var c = D.comp.find(function(x) { return x.id === id; });
  if (!c || !confirm('¿Eliminar comprobante de ' + c.ide + '?\n\nTambién se eliminará su encuesta.')) return;
  D.comp = D.comp.filter(function(x) { return x.id !== id; });
  var ib = D.ind.length;
  D.ind = D.ind.filter(function(x) { return x.eid !== c.ide; });
  D.pap.push({ o:'comp', d:c, t:new Date().toISOString() });
  log('delete','Comprobante','Eliminó ' + c.ide + ' + ' + (ib - D.ind.length) + ' encuesta(s)');
  sv(); toast('🗑️ Eliminado','wa'); R(cSec);
}

// ===== GENERAR HTML IMPRESIÓN =====
function gPrt(c) {
  var al = c.act || [];
  var h = '';
  h += '<table class="hdr"><colgroup><col style="width:70px"><col><col style="width:85px"></colgroup><tr>';
  h += '<td style="padding:6px;text-align:center;vertical-align:middle"><img src="' + LOGO_B64 + '" style="height:40px"><div style="font-size:6.5px;font-weight:800;color:#00838f;margin-top:1px">DEBBIOM</div></td>';
  h += '<td style="text-align:center;padding:4px;border-left:2px solid #111;border-right:2px solid #111;vertical-align:middle"><div style="font-size:11px;font-weight:800;line-height:1.25">DESARROLLOS BIOMÉDICOS Y BIOTECNOLÓGICOS<br>DE MÉXICO S.A. DE C.V.</div><div style="font-size:8.5px;margin-top:2px">Tecnología de la Información</div><div style="font-size:9.5px;font-weight:700;margin-top:3px">Comprobante de Mantenimiento Realizado</div></td>';
  h += '<td style="padding:4px 5px;font-size:8px;line-height:1.4;vertical-align:middle">Código:<br><b>F1/TI-P01</b><br>Versión:<br><b>002/Oct-25</b><br>Página 1 de 1</td></tr></table>';
  h += '<table><colgroup><col style="width:22%"><col style="width:28%"><col style="width:22%"><col style="width:28%"></colgroup>';
  h += '<tr><td class="lbl">Fecha<br>programación</td><td>' + E(c.fpr||'') + '</td><td class="lbl">TI</td><td>' + E(c.ti||'') + '</td></tr>';
  h += '<tr><td class="lbl">Usuario</td><td>' + E(c.usr||'') + '</td><td class="lbl">Host del equipo</td><td>' + E(c.hst||'') + '</td></tr>';
  h += '<tr><td class="lbl">Tipo de Equipo</td><td>' + E(c.tip||'') + '</td><td class="lbl">ID del Equipo</td><td>' + E(c.ide||'') + '</td></tr>';
  h += '<tr><td class="lbl">Fecha en que se<br>recibe el equipo</td><td>' + E(c.frc||'') + '</td><td class="lbl">Fecha en que se<br>entrega el equipo</td><td>' + E(c.fen||'') + '</td></tr></table>';
  h += '<table><colgroup><col style="width:35%"><col style="width:12%"><col style="width:53%"></colgroup>';
  h += '<tr><th style="text-align:left">Actividad</th><th style="text-align:center">Realizado (X)</th><th style="text-align:left">Comentarios</th></tr>';
  al.forEach(function(a) { h += '<tr><td style="font-weight:600;font-size:9px">' + E(a.n) + '</td><td style="text-align:center;font-weight:700">X</td><td class="cm">' + E(a.c||'') + '</td></tr>'; });
  h += '</table>';
  h += '<table><tr><td style="background:#ebebeb;padding:4px 6px"><b style="font-size:9px">Comentarios Generales</b></td></tr><tr><td class="cm" style="padding:4px 6px;min-height:22px">' + E(c.cg||'') + '</td></tr></table>';
  if (c.enc) {
    h += '<div style="margin-top:4px"><b style="font-size:9px">Encuesta de satisfacción</b> <span style="font-size:7px;color:#555">E=Excelente B=Bueno R=Regular M=Malo</span>';
    h += '<table style="margin-top:3px"><colgroup><col><col style="width:26px"><col style="width:26px"><col style="width:26px"><col style="width:26px"></colgroup>';
    h += '<tr><th style="text-align:left">Preguntas</th><th>E</th><th>B</th><th>R</th><th>M</th></tr>';
    PREGS.forEach(function(q, i) { var v = c.enc['q'+(i+1)]; h += '<tr><td>' + (i+1) + '. ' + q + '</td>'; ['E','B','R','M'].forEach(function(o) { h += '<td style="text-align:center;font-size:12px">' + (v===o?'✔':'') + '</td>'; }); h += '</tr>'; });
    h += '</table></div>';
  }
  h += '<div class="sig-row"><div class="sig-box"><span>Firma del TI</span></div><div class="sig-box"><span>Nombre y Firma</span></div></div>';
  h += '<div class="ft">Desarrollos Biomédicos y Biotecnológicos de México, S.A. de C.V.</div>';
  return h;
}

function dlC(id) {
  if (!isAdmin()) return;
  var c = D.comp.find(function(x) { return x.id === id; }); if (!c) return;
  printPDF(gPrt(c), 'Comprobante_' + c.ide + '_' + c.fch);
  log('download','Comprobante','PDF '+c.ide); toast('📄 Generando PDF...','ok');
}

function emC(id) {
  if (!isAdmin()) return;
  var c = D.comp.find(function(x) { return x.id === id; }); if (!c) return;
  var b = 'Comprobante de Mantenimiento\n\nEquipo: ' + c.ide + '\nUsuario: ' + (c.usr||'') + '\nHost: ' + (c.hst||'') + '\nFecha: ' + c.fch + '\nTI: ' + (c.ti||'') + '\n\nDEBBIOM S.A. de C.V.';
  window.open('mailto:?subject=' + encodeURIComponent('DEBBIOM — Comprobante ' + c.ide) + '&body=' + encodeURIComponent(b));
  log('email','Comprobante','Correo '+c.ide);
}
