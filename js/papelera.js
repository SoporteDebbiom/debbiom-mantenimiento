/**
 * PAPELERA — Papelera de reciclaje
 * Restaurar o eliminar permanentemente
 */

function rPap() {
  if (!isAdmin()) { $('sPap').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sPap');
  var h = '<div class="tw"><table><thead><tr><th>Origen</th><th>Detalle</th><th>Eliminado</th><th>Acciones</th></tr></thead><tbody>';

  if (!D.pap.length) {
    h += '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text3)">';
    h += '<i class="fas fa-trash-can" style="font-size:28px;opacity:.2;display:block;margin-bottom:8px"></i>Papelera vacía</td></tr>';
  }

  D.pap.forEach(function(p, i) {
    var det = p.d.eq || p.d.ide || p.d.usr || p.d.hst || p.d.nom || '—';
    h += '<tr><td><span class="badge b-warn">' + E(p.o) + '</span></td>';
    h += '<td><b>' + E(det) + '</b></td>';
    h += '<td style="font-size:10px;color:var(--text3)">' + fd2(p.t) + '</td>';
    h += '<td><button class="btn btn-sm btn-p" onclick="rI(' + i + ')"><i class="fas fa-rotate-left"></i> Restaurar</button> ';
    h += '<button class="btn btn-sm btn-d" onclick="pD(' + i + ')"><i class="fas fa-xmark"></i> Eliminar</button></td></tr>';
  });

  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function rI(i) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var it = D.pap[i]; if (!it) return;
  var k = { prog: 'prog', comp: 'comp', eq: 'eq', pw: 'pw' }[it.o] || it.o;
  if (!D[k]) D[k] = [];
  D[k].push(it.d);
  D.pap.splice(i, 1);
  log('restore', 'Papelera', 'Restauró de ' + it.o);
  sv(); toast('♻️ Restaurado', 'ok'); R(cSec);
}

function pD(i) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  if (!confirm('¿Eliminar permanentemente? No se puede deshacer.')) return;
  log('permDelete', 'Papelera', 'Eliminó permanente');
  D.pap.splice(i, 1);
  sv(); toast('🗑️ Eliminado permanentemente', 'er'); R(cSec);
}
