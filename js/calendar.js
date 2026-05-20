/**
 * CALENDARIO — Interactivo para admin, solo vista para empleado
 */
function rCal() {
  var el = $('sCal');
  var d = new Date(cY, cMo, 1);
  var mn = d.toLocaleDateString('es-MX', { month:'long', year:'numeric' });
  var fd = (d.getDay() + 6) % 7;
  var dim = new Date(cY, cMo + 1, 0).getDate();
  var td = new Date();
  var admin = isAdmin();

  var h = '<div class="cal"><div class="cal-h">';
  h += '<button onclick="cMo--;if(cMo<0){cMo=11;cY--;}rCal()"><i class="fas fa-chevron-left"></i></button>';

  // Selectores rápidos de mes y año
  h += '<div style="display:flex;gap:6px;align-items:center">';
  h += '<select onchange="cMo=parseInt(this.value);rCal()" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px;font-weight:700;cursor:pointer">';
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  meses.forEach(function(m, i) {
    h += '<option value="' + i + '"' + (i === cMo ? ' selected' : '') + '>' + m + '</option>';
  });
  h += '</select>';
  h += '<select onchange="cY=parseInt(this.value);rCal()" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px;font-weight:700;cursor:pointer">';
  var thisYr = new Date().getFullYear();
  for (var yr = thisYr - 1; yr <= thisYr + 3; yr++) {
    h += '<option value="' + yr + '"' + (yr === cY ? ' selected' : '') + '>' + yr + '</option>';
  }
  h += '</select>';
  h += '</div>';

  h += '<div style="display:flex;gap:6px">';
  h += '<button onclick="cMo++;if(cMo>11){cMo=0;cY++;}rCal()"><i class="fas fa-chevron-right"></i></button>';
  h += '<button onclick="var t=new Date();cMo=t.getMonth();cY=t.getFullYear();rCal()" style="font-size:10px;width:auto;padding:0 10px">Hoy</button>';
  h += '</div></div><div class="cal-g">';

  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(function(x) { h += '<div class="cal-dh">' + x + '</div>'; });

  var pd = new Date(cY, cMo, 0).getDate();
  for (var i = fd - 1; i >= 0; i--) h += '<div class="cal-d oth"><div class="num">' + (pd - i) + '</div></div>';

  for (var day = 1; day <= dim; day++) {
    var ds = cY + '-' + String(cMo + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var ev = D.prog.filter(function(p) { return p.fp === ds; });
    var dn = ev.filter(function(p) { return p.st === 'listo'; });
    var proc = ev.filter(function(p) { return p.st === 'proceso'; });
    var pend = ev.filter(function(p) { return p.st !== 'listo' && p.st !== 'proceso'; });
    var it = td.getFullYear() === cY && td.getMonth() === cMo && td.getDate() === day;
    var c = 'cal-d' + (it ? ' today' : '') + (ev.length ? ' has-ev-multi' : '');

    // Ambos roles pueden hacer clic en el calendario
    h += '<div class="' + c + '" onclick="calC(\'' + ds + '\')" style="cursor:pointer">';
    h += '<div class="num">' + day + '</div>';
    if (ev.length) {
      h += '<div class="cal-dots">';
      if (pend.length) h += '<span class="cal-dot dot-pend" title="' + pend.length + ' pendiente(s)">' + pend.length + '</span>';
      if (proc.length) h += '<span class="cal-dot dot-proc" title="' + proc.length + ' en proceso">' + proc.length + '</span>';
      if (dn.length) h += '<span class="cal-dot dot-done" title="' + dn.length + ' listo(s)">' + dn.length + '</span>';
      h += '</div>';
    }
    h += '</div>';
  }

  var tc = fd + dim, rm = 7 - (tc % 7);
  if (rm < 7) for (var i = 1; i <= rm; i++) h += '<div class="cal-d oth"><div class="num">' + i + '</div></div>';
  h += '</div></div>';

  // Leyenda de colores
  h += '<div style="display:flex;gap:16px;justify-content:center;margin-top:10px;font-size:11px;color:var(--text2);flex-wrap:wrap">';
  h += '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:var(--rose);display:inline-block"></span> Pendiente</span>';
  h += '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:var(--amber);display:inline-block"></span> En Proceso</span>';
  h += '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:50%;background:var(--emerald);display:inline-block"></span> Listo</span>';
  h += '</div>';

  // Próximos mantenimientos (visible para todos, filtrado por rol)
  var hoy = new Date().toISOString().split('T')[0];
  var mesStr = cY + '-' + String(cMo + 1).padStart(2, '0');
  var up = D.prog.filter(function(p) { return p.fp && p.fp.substring(0, 7) === mesStr; }).sort(function(a, b) { return a.fp.localeCompare(b.fp); });

  // Empleado: solo ver mantenimientos de sus equipos
  if (!admin && U) {
    var misEquipos = buscarEnBD(U.n);
    var misIds = misEquipos.map(function(e) { return e.ide; });
    up = up.filter(function(p) {
      return misIds.indexOf(p.eq) >= 0;
    });
  }
  if (up.length) {
    h += '<div class="card" style="margin-top:14px"><div class="card-t"><i class="fas fa-list-check" style="color:var(--deb-teal)"></i> ' + (admin ? 'Mantenimientos del Mes' : 'Mis Mantenimientos del Mes') + '</div>';
    h += '<div class="tw"><table><thead><tr><th>Equipo</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Realiza</th>' + (!admin ? '<th></th>' : '') + '</tr></thead><tbody>';
    up.forEach(function(p) {
      var bc = p.st === 'listo' ? 'b-ok' : p.st === 'proceso' ? 'b-warn' : 'b-err';
      var hrTxt = p.hr !== undefined && p.hr !== '' ? fmtHrShort(p.hr) : '—';
      h += '<tr><td><b>' + E(p.eq) + '</b></td><td>' + fd2(p.fp) + '</td><td>' + hrTxt + '</td><td><span class="badge ' + bc + '">' + E(p.st || 'pendiente') + '</span></td><td>' + E(p.por || '—') + '</td>';
      // Empleado: puede cancelar solo los pendientes que ÉL apartó
      if (!admin) {
        var esMio = esProgMio(p);
        if (p.st === 'pendiente' && esMio) {
          h += '<td><button class="btn btn-sm btn-d" onclick="cancelarMant(\'' + p.id + '\')" title="Cancelar"><i class="fas fa-times"></i> Cancelar</button></td>';
        } else if (p.st === 'pendiente' && !esMio) {
          h += '<td><span style="font-size:9px;color:var(--text3)">Otro usuario</span></td>';
        } else {
          h += '<td><span style="font-size:10px;color:var(--text3)">—</span></td>';
        }
      }
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';
  }

  // Empleado: mensaje informativo
  if (!admin) {
    h += '<div style="text-align:center;padding:16px;color:var(--text3);font-size:12px"><i class="fas fa-calendar-plus" style="color:var(--deb-teal)"></i> Haz clic en una fecha para <b>apartar tu mantenimiento</b> (solo 1 vez por equipo). Para reagendar, cancela el actual.</div>';
  }

  el.innerHTML = h;
}

function calC(ds) {
  if (isAdmin()) {
    // === ADMIN: comportamiento original ===
    var ev = D.prog.filter(function(p) { return p.fp === ds; });
    if (ev.length) {
      var h = '<p style="margin-bottom:12px;font-weight:600">' + fd2(ds) + ' — ' + ev.length + ' mantenimiento(s)</p>';
      ev.sort(function(a,b){ return (a.hr||0)-(b.hr||0); }).forEach(function(p) {
        var brd = p.st === 'listo' ? 'var(--emerald)' : p.st === 'proceso' ? 'var(--amber)' : 'var(--rose)';
        var bc = p.st === 'listo' ? 'b-ok' : p.st === 'proceso' ? 'b-warn' : 'b-err';
        var hrTxt = p.hr !== undefined && p.hr !== '' ? ' · ' + fmtHrShort(p.hr) : '';
        h += '<div class="card" style="border-left:3px solid ' + brd + '"><div style="display:flex;justify-content:space-between;align-items:center"><b>' + E(p.eq) + hrTxt + '</b><span class="badge ' + bc + '">' + E(p.st || 'pendiente') + '</span></div>';
        h += '<div style="font-size:10px;color:var(--text2);margin-top:4px">' + E(p.por || '—') + ' | ' + E(p.com || '—') + '</div>';
        h += '<div style="margin-top:8px;display:flex;gap:6px"><button class="btn btn-sm btn-s" onclick="cM();oPE(\'' + p.id + '\')"><i class="fas fa-pen"></i> Editar</button><button class="btn btn-sm btn-d" onclick="cM();dP(\'' + p.id + '\')"><i class="fas fa-trash"></i></button></div></div>';
      });
      oM('📅 ' + fd2(ds), h, '');
    } else {
      oM('📅 ' + fd2(ds) + ' — Disponible', '<p style="color:var(--text2);margin-bottom:14px">No hay mantenimientos programados.</p><button class="btn btn-p" onclick="cM();oPN(\'' + ds + '\')"><i class="fas fa-plus"></i> Programar</button>', '');
    }
  } else {
    // === EMPLEADO: apartar fecha de mantenimiento ===
    calCEmp(ds);
  }
}

// ===== EMPLEADO — Apartar mantenimiento desde calendario =====
function calCEmp(ds) {
  // Buscar equipos que coincidan con el nombre del empleado (parcial, flexible)
  var matches = buscarEnBD(U.n);

  var h = '<div style="padding:12px;background:rgba(0,131,143,.04);border-radius:10px;margin-bottom:16px;font-size:12px">';
  h += '<i class="fas fa-calendar-check" style="color:var(--deb-teal)"></i> Fecha seleccionada: <b style="color:var(--deb-teal)">' + fd2(ds) + '</b>';
  h += '</div>';

  h += '<div style="margin-bottom:14px">';
  h += '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px"><i class="fas fa-user"></i> Tu nombre</label>';
  h += '<input id="empBuscar" value="' + E(U.n) + '" placeholder="Escribe tu nombre, apellido o ID de equipo..." oninput="buscarEquiposEmp(\'' + ds + '\')" style="width:100%;padding:10px 14px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text);font-size:13px">';
  h += '<div style="font-size:10px;color:var(--text3);margin-top:4px"><i class="fas fa-info-circle"></i> Puedes buscar por nombre, apellido o código de equipo</div>';
  h += '</div>';

  h += '<div id="empEqResults">';
  h += renderEquiposEmp(matches, ds);
  h += '</div>';

  oM('📅 Apartar Mantenimiento', h, '<button class="btn btn-s" onclick="cM()">Cancelar</button>');
}

// Buscar en BD por nombre o ID de equipo (flexible)
function buscarEnBD(texto) {
  if (!texto || !texto.trim()) return [];
  var q = texto.toLowerCase().trim();
  var parts = q.split(/\s+/).filter(function(w) { return w.length >= 2; });
  if (!parts.length) parts = [q];

  return D.eq.filter(function(e) {
    var usr = (e.usr || '').toLowerCase();
    var ide = (e.ide || '').toLowerCase();
    var hst = (e.hst || '').toLowerCase();
    // Coincide si cualquier palabra aparece en usuario, ID equipo o hostname
    return parts.some(function(part) {
      return usr.indexOf(part) >= 0 || ide.indexOf(part) >= 0 || hst.indexOf(part) >= 0;
    });
  });
}

function buscarEquiposEmp(ds) {
  var q = ($('empBuscar')?.value || '').trim();
  var matches = buscarEnBD(q);
  var el = $('empEqResults');
  if (el) el.innerHTML = renderEquiposEmp(matches, ds);
}

function renderEquiposEmp(matches, ds) {
  var h = '';
  if (!matches.length) {
    h += '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px">';
    h += '<i class="fas fa-search" style="font-size:20px;opacity:.3;display:block;margin-bottom:8px"></i>';
    h += 'No se encontraron equipos. Verifica tu nombre.</div>';
    return h;
  }

  h += '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:8px"><i class="fas fa-laptop"></i> Selecciona tu equipo (' + matches.length + ' encontrado' + (matches.length > 1 ? 's' : '') + ')</label>';
  matches.forEach(function(e) {
    var yaExiste = D.prog.find(function(p) { return p.eq === e.ide && p.st !== 'listo'; });
    if (yaExiste) {
      var bc = yaExiste.st === 'proceso' ? 'b-warn' : 'b-err';
      var hrTxt = yaExiste.hr ? ' a las ' + fmtHr(yaExiste.hr) : '';
      h += '<div class="card" style="border-left:3px solid var(--amber);opacity:.7;margin-bottom:8px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><b style="color:var(--deb-teal)">' + E(e.ide) + '</b> — ' + E(e.usr) + '</div>';
      h += '<span class="badge ' + bc + '">' + E(yaExiste.st) + '</span></div>';
      h += '<div style="font-size:10px;color:var(--text3);margin-top:4px">Agendado el <b>' + fd2(yaExiste.fp) + hrTxt + '</b>. Para reagendar, primero elimínalo.</div></div>';
    } else {
      h += '<div class="card" style="border-left:3px solid var(--deb-teal);cursor:pointer;margin-bottom:8px;transition:all .15s" onmouseover="this.style.background=\'rgba(0,131,143,.06)\'" onmouseout="this.style.background=\'\'" onclick="seleccionarHora(\'' + E(e.ide) + '\',\'' + ds + '\')">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center">';
      h += '<div><b style="color:var(--deb-teal)">' + E(e.ide) + '</b> — ' + E(e.usr) + '</div>';
      h += '<i class="fas fa-clock" style="color:var(--deb-teal)"></i></div>';
      h += '<div style="font-size:10px;color:var(--text3);margin-top:4px">' + E(e.tip || 'CPU') + ' · ' + E(e.hst || '—') + ' · <b>Clic para elegir hora</b></div></div>';
    }
  });
  return h;
}

// ===== HORARIOS DISPONIBLES =====
var HORAS_DISP = [8, 9, 10, 11, 12, 14, 15, 16]; // 13 = comida, no disponible
var MAX_POR_HORA = 3;

function fmtHr(h) {
  if (h === undefined || h === null || h === '') return '';
  var hr = parseInt(h);
  var ampm = hr >= 12 ? 'PM' : 'AM';
  var hr12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
  return hr12 + ':00 ' + ampm + ' — ' + (hr12 === 12 && ampm === 'PM' ? '1' : (hr + 1 > 12 ? hr + 1 - 12 : hr + 1)) + ':00 ' + (hr + 1 >= 12 ? 'PM' : 'AM');
}

function fmtHrShort(h) {
  var hr = parseInt(h);
  var ampm = hr >= 12 ? 'PM' : 'AM';
  var hr12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr);
  return hr12 + ':00 ' + ampm;
}

// Contar equipos agendados en una hora específica de un día
function contarEnHora(ds, hr) {
  return D.prog.filter(function(p) {
    return p.fp === ds && parseInt(p.hr) === hr && p.st !== 'listo';
  }).length;
}

// ===== SELECTOR DE HORA =====
function seleccionarHora(eqId, ds) {
  var e = D.eq.find(function(x) { return x.ide === eqId; });
  if (!e) return;

  // Doble check
  var yaExiste = D.prog.find(function(p) { return p.eq === eqId && p.st !== 'listo'; });
  if (yaExiste) { toast('⚠️ Ya tiene mantenimiento agendado', 'wa'); return; }

  var h = '<div style="padding:12px;background:rgba(0,131,143,.04);border-radius:10px;margin-bottom:14px;font-size:12px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center">';
  h += '<div><i class="fas fa-laptop" style="color:var(--deb-teal)"></i> <b>' + E(eqId) + '</b> — ' + E(e.usr) + '</div>';
  h += '<div><i class="fas fa-calendar" style="color:var(--deb-teal)"></i> ' + fd2(ds) + '</div>';
  h += '</div></div>';

  h += '<div style="margin-bottom:8px;font-size:12px;font-weight:600"><i class="fas fa-clock"></i> Selecciona la hora (máx. ' + MAX_POR_HORA + ' equipos por hora)</div>';
  h += '<div style="font-size:10px;color:var(--text3);margin-bottom:12px"><i class="fas fa-utensils"></i> 1:00 PM — 2:00 PM no disponible (horario de comida)</div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  HORAS_DISP.forEach(function(hr) {
    var ocupados = contarEnHora(ds, hr);
    var lleno = ocupados >= MAX_POR_HORA;
    var disp = MAX_POR_HORA - ocupados;
    var color = lleno ? 'var(--rose)' : (ocupados >= 2 ? 'var(--amber)' : 'var(--emerald)');
    var bgHover = lleno ? '' : 'onmouseover="this.style.background=\'rgba(0,131,143,.08)\'" onmouseout="this.style.background=\'\'"';

    h += '<div style="padding:12px;border-radius:10px;border:1.5px solid ' + (lleno ? 'var(--border)' : 'var(--deb-teal)') + ';' + (lleno ? 'opacity:.4;cursor:not-allowed' : 'cursor:pointer') + ';transition:all .15s;text-align:center" ' + bgHover;
    if (!lleno) h += ' onclick="apartarMant(\'' + E(eqId) + '\',\'' + ds + '\',' + hr + ')"';
    h += '>';
    h += '<div style="font-size:14px;font-weight:700;color:' + (lleno ? 'var(--text3)' : 'var(--deb-teal)') + '">' + fmtHrShort(hr) + '</div>';
    h += '<div style="font-size:10px;margin-top:4px">';
    h += '<span style="color:' + color + ';font-weight:600">' + ocupados + '/' + MAX_POR_HORA + '</span>';
    h += ' · <span style="color:' + (lleno ? 'var(--rose)' : 'var(--text3)') + '">' + (lleno ? 'Lleno' : disp + ' disponible' + (disp > 1 ? 's' : '')) + '</span>';
    h += '</div>';

    // Mostrar quién está agendado
    if (ocupados > 0) {
      var enEstaHora = D.prog.filter(function(p) { return p.fp === ds && parseInt(p.hr) === hr && p.st !== 'listo'; });
      h += '<div style="margin-top:6px;font-size:9px;color:var(--text3)">';
      enEstaHora.forEach(function(p) {
        h += '<div><i class="fas fa-laptop" style="font-size:7px"></i> ' + E(p.eq) + '</div>';
      });
      h += '</div>';
    }

    h += '</div>';
  });
  h += '</div>';

  oM('🕐 Elegir Hora — ' + E(eqId), h, '<button class="btn btn-s" onclick="cM()">Cancelar</button>');
}

function apartarMant(eqId, ds, hr) {
  var e = D.eq.find(function(x) { return x.ide === eqId; });
  if (!e) return;

  // Bloquear si ya tiene mantenimiento activo
  var yaExiste = D.prog.find(function(p) { return p.eq === eqId && p.st !== 'listo'; });
  if (yaExiste) {
    toast('⚠️ Este equipo ya tiene mantenimiento agendado', 'wa');
    return;
  }

  // Verificar capacidad de la hora
  var ocupados = contarEnHora(ds, hr);
  if (ocupados >= MAX_POR_HORA) {
    toast('⚠️ Esta hora ya tiene ' + MAX_POR_HORA + ' equipos. Elige otra.', 'wa');
    return;
  }

  // Confirmar
  if (!confirm('¿Apartar mantenimiento?\n\nEquipo: ' + eqId + '\nUsuario: ' + e.usr + '\nFecha: ' + ds + '\nHora: ' + fmtHr(hr))) return;

  // Crear programación
  var r = {
    id: gId(),
    eq: eqId,
    fp: ds,
    hr: hr,
    fr: '',
    por: '',
    st: 'pendiente',
    com: 'Apartado por ' + U.n + ' (' + U.d + ')',
    fe: '',
    creadoPor: U.n
  };

  D.prog.push(r);
  log('create', 'Programación', U.n + ' apartó mantenimiento: ' + eqId + ' para ' + ds + ' ' + fmtHrShort(hr));

  if (typeof addNotif === 'function') {
    addNotif('fas fa-user-clock', '👤 Mantenimiento apartado', U.n + ' apartó ' + eqId + ' para ' + fd2(ds) + ' ' + fmtHrShort(hr), 'status');
  }
  if (typeof autoEmailProgramado === 'function') {
    autoEmailProgramado(r);
  }

  sv();
  cM();
  toast('📅 Apartado: ' + fd2(ds) + ' a las ' + fmtHrShort(hr), 'ok');
  R(cSec);
}

// ===== VERIFICAR SI UN MANTENIMIENTO ES DEL USUARIO ACTUAL =====
function esProgMio(p) {
  if (!U || !U.n) return false;
  var miNombre = U.n.toLowerCase().trim();
  var partes = miNombre.split(/\s+/).filter(function(w) { return w.length >= 2; });

  // 1) Campo creadoPor (registros nuevos)
  if (p.creadoPor) {
    var creador = p.creadoPor.toLowerCase().trim();
    if (creador === miNombre) return true;
    if (partes.some(function(pt) { return creador.indexOf(pt) >= 0; })) return true;
  }

  // 2) Campo com "Apartado por ..."
  if (p.com) {
    var com = p.com.toLowerCase();
    if (partes.some(function(pt) { return com.indexOf(pt) >= 0; })) return true;
  }

  // 3) Verificar si el equipo está asignado a este usuario en la BD
  var eq = D.eq.find(function(e) { return e.ide === p.eq; });
  if (eq && eq.usr) {
    var usrEq = eq.usr.toLowerCase().trim();
    if (partes.some(function(pt) { return usrEq.indexOf(pt) >= 0; })) return true;
  }

  return false;
}

// ===== EMPLEADO — Cancelar mantenimiento pendiente (solo el suyo) =====
function cancelarMant(progId) {
  var p = D.prog.find(function(x) { return x.id === progId; });
  if (!p) return;

  // Solo puede cancelar pendientes
  if (p.st !== 'pendiente') {
    toast('⚠️ Solo puedes cancelar mantenimientos pendientes', 'wa');
    return;
  }

  // Verificar que sea suyo
  if (!esProgMio(p)) {
    toast('⛔ No puedes cancelar mantenimientos de otros usuarios', 'er');
    return;
  }

  if (!confirm('¿Cancelar mantenimiento?\n\nEquipo: ' + p.eq + '\nFecha: ' + fd2(p.fp) + '\n\nPodrás volver a agendar después.')) return;

  // Eliminar
  var idx = D.prog.indexOf(p);
  if (idx >= 0) D.prog.splice(idx, 1);

  log('delete', 'Programación', U.n + ' canceló mantenimiento: ' + p.eq + ' del ' + p.fp);

  if (typeof addNotif === 'function') {
    addNotif('fas fa-calendar-times', '❌ Mantenimiento cancelado', U.n + ' canceló ' + p.eq + ' del ' + fd2(p.fp), 'status');
  }

  sv();
  toast('❌ Mantenimiento cancelado — puedes reagendar', 'ok');
  R(cSec);
}
