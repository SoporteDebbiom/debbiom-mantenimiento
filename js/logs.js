/**
 * LOGS — Registro de toda la actividad del sistema
 * Cada acción (crear, editar, ver, eliminar, exportar, importar, PDF, correo)
 * se registra con fecha/hora exacta, usuario, sección y detalle
 */

// Agregar entrada al log
function log(a, s, dt) {
  D.logs.unshift({
    id: gId(),
    ts: new Date().toISOString(),
    u: U ? U.n : 'Sistema',
    s: s,
    a: a,
    dt: dt || ''
  });
  // Limitar a 2000 registros
  if (D.logs.length > 2000) D.logs = D.logs.slice(0, 2000);
  sv();
}

// Renderizar sección de Logs
function rLog() {
  if (!isAdmin()) { $('sLog').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sLog');
  var h = '<div class="tw" style="max-height:calc(100vh - 160px);overflow-y:auto">';
  h += '<table><thead><tr>';
  h += '<th>Fecha/Hora</th><th>Usuario</th><th>Sección</th><th>Acción</th><th>Detalle</th>';
  h += '</tr></thead><tbody>';

  if (!D.logs.length) {
    h += '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text3)">Sin actividad registrada</td></tr>';
  }

  D.logs.slice(0, 500).forEach(function(l) {
    h += '<tr>';
    h += '<td style="font-family:IBM Plex Mono,monospace;font-size:10px">' + fdt(l.ts) + '</td>';
    h += '<td>' + E(l.u) + '</td>';
    h += '<td><span class="badge b-info">' + E(l.s) + '</span></td>';
    h += '<td>' + E(l.a) + '</td>';
    h += '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis" title="' + E(l.dt) + '">' + E(l.dt) + '</td>';
    h += '</tr>';
  });

  h += '</tbody></table></div>';
  el.innerHTML = h;
}
