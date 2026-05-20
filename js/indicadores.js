/**
 * INDICADORES — Resultados de encuestas de satisfacción
 * Porcentajes globales + listado por equipo/usuario
 */

function rInd() {
  if (!isAdmin()) { $('sInd').innerHTML = '<p style="color:var(--text3);padding:20px">⛔ Sin permisos</p>'; return; }
  var el = $('sInd'), data = D.ind;
  var ct = { E: 0, B: 0, R: 0, M: 0 };
  data.forEach(function(d) { ['q1', 'q2', 'q3'].forEach(function(q) { if (d[q]) ct[d[q]]++; }); });
  var tt = ct.E + ct.B + ct.R + ct.M;

  var h = '<div class="stats-r">';
  h += '<div class="stat"><div class="stat-n" style="color:var(--emerald)">' + (tt ? Math.round(ct.E / tt * 100) : 0) + '%</div><div class="stat-l">Excelente</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--teal)">' + (tt ? Math.round(ct.B / tt * 100) : 0) + '%</div><div class="stat-l">Bueno</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--amber)">' + (tt ? Math.round(ct.R / tt * 100) : 0) + '%</div><div class="stat-l">Regular</div></div>';
  h += '<div class="stat"><div class="stat-n" style="color:var(--rose)">' + (tt ? Math.round(ct.M / tt * 100) : 0) + '%</div><div class="stat-l">Malo</div></div></div>';

  h += '<div style="display:flex;gap:8px;margin-bottom:14px">';
  h += '<button class="btn btn-p btn-sm" onclick="dlInd()"><i class="fas fa-file-pdf"></i> PDF</button>';
  h += '<button class="btn btn-w btn-sm" onclick="emInd()"><i class="fas fa-envelope"></i> Correo</button></div>';

  h += '<div class="tw"><table><thead><tr><th>ID Equipo</th><th>Usuario</th><th>Fecha</th><th>Q1</th><th>Q2</th><th>Q3</th><th style="width:80px">Acciones</th></tr></thead><tbody>';
  if (!data.length) h += '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text3)">Sin encuestas registradas</td></tr>';
  data.forEach(function(d, i) {
    h += '<tr><td><b>' + E(d.eid) + '</b></td><td>' + E(d.usr || '—') + '</td><td>' + fd2(d.f) + '</td>';
    h += '<td>' + E(d.q1) + '</td><td>' + E(d.q2) + '</td><td>' + E(d.q3) + '</td>';
    h += '<td><button class="btn btn-sm btn-d" onclick="dInd(\'' + d.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function dInd(id) {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var ind = D.ind.find(function(x) { return x.id === id; });
  if (!ind || !confirm('¿Eliminar encuesta de ' + (ind.eid || '—') + '?')) return;
  D.ind = D.ind.filter(function(x) { return x.id !== id; });
  D.pap.push({ o: 'ind', d: ind, t: new Date().toISOString() });
  log('delete', 'Indicadores', 'Eliminó encuesta de ' + ind.eid);
  sv(); toast('🗑️ Encuesta eliminada', 'wa'); R(cSec);
}

function dlInd() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var h = '<div style="text-align:center;margin-bottom:6px"><img src="' + LOGO_B64 + '" style="height:34px"></div>';
  h += '<h2 style="text-align:center;font-size:14px;font-weight:800;margin-bottom:4px">DEBBIOM — Indicadores de Satisfacción</h2>';
  h += '<p style="text-align:center;font-size:9px;margin-bottom:16px;color:#666">' + new Date().toLocaleDateString('es-MX') + '</p>';
  h += '<table><thead><tr><th>ID Equipo</th><th>Usuario</th><th>Fecha</th><th style="width:40px;text-align:center">Q1</th><th style="width:40px;text-align:center">Q2</th><th style="width:40px;text-align:center">Q3</th></tr></thead><tbody>';
  D.ind.forEach(function(d) {
    h += '<tr><td>' + E(d.eid) + '</td><td>' + E(d.usr) + '</td><td>' + fd2(d.f) + '</td>';
    h += '<td style="text-align:center">' + d.q1 + '</td><td style="text-align:center">' + d.q2 + '</td><td style="text-align:center">' + d.q3 + '</td></tr>';
  });
  h += '</tbody></table>';

  printPDF(h, 'Indicadores_DEBBIOM');
  log('download', 'Indicadores', 'PDF');
  toast('📥 Abriendo PDF...', 'ok');
}

function emInd() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }
  var b = 'DEBBIOM — Indicadores\n\nTotal: ' + D.ind.length + '\n\n';
  D.ind.forEach(function(d) { b += d.eid + ' | ' + (d.usr || '') + ' | Q1:' + d.q1 + ' Q2:' + d.q2 + ' Q3:' + d.q3 + '\n'; });
  window.open('mailto:?subject=' + encodeURIComponent('DEBBIOM TI — Indicadores') + '&body=' + encodeURIComponent(b));
  log('email', 'Indicadores', 'Correo');
}
