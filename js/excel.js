/**
 * EXCEL — Importar y Exportar
 * Importar: SIN contraseña, detecta columnas automáticamente
 * Exportar: CON contraseña
 */

async function doExport() {
  if (!isAdmin()) { toast('⛔ Sin permisos para exportar', 'er'); return; }
  var pw = prompt('Contraseña para exportar:');
  if (!pw) return;
  var ok = await validateIPW(pw);
  if (!ok) { toast('Contraseña incorrecta', 'er'); return; }
  var wb = XLSX.utils.book_new();
  // BD Equipos con nombres legibles
  if (D.eq.length) {
    var eqData = D.eq.map(function(e) {
      return { Usuario: e.usr, 'Host del equipo': e.hst, 'Tipo de Equipo': e.tip, 'ID del Equipo': e.ide, 'Fecha Recibe': e.frc, 'Fecha Programación': e.fpr };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eqData), 'BD_Equipos');
  }
  if (D.pw.length) {
    var pwData = D.pw.map(function(p) {
      return { 'Hostname del Equipo': p.hst, 'Código de Inventario': p.cod, Nombre: p.nom, 'Contraseña': p.pas };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pwData), 'Contraseñas');
  }
  if (D.prog.length) {
    var prData = D.prog.map(function(p) {
      return { 'Código de Equipo': p.eq, 'Fecha Programada': p.fp, 'Hora': p.hr !== undefined && p.hr !== '' ? p.hr + ':00' : '', 'Fecha Realizado': p.fr, 'Realizado Por': p.por, Estado: p.st, Comentarios: p.com, 'Fecha Entrega': p.fe };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prData), 'Programacion');
  }
  if (D.ind.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(D.ind), 'Indicadores');
  XLSX.writeFile(wb, 'DEBBIOM_TI_' + new Date().toISOString().split('T')[0] + '.xlsx');
  log('export', 'Sistema', 'Exportó Excel'); toast('📊 Excel exportado', 'ok');
}

// ===== IMPORTAR — Sin contraseña, detección inteligente =====
function doImport(e) {
  if (!isAdmin()) { toast('⛔ Sin permisos para importar', 'er'); e.target.value = ''; return; }
  var f = e.target.files[0]; if (!f) return;
  toast('📂 Leyendo archivo...', 'ok');
  var rd = new FileReader();

  rd.onload = function(ev) {
    try {
      var wb = XLSX.read(ev.target.result, { type: 'binary' });
      var totalImported = 0;
      var importLog = [];

      wb.SheetNames.forEach(function(sheetName) {
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
        if (!rows.length) return;

        // Detectar tipo de datos por las columnas
        var cols = Object.keys(rows[0]).map(function(c) { return c.toLowerCase().trim(); });
        var type = detectSheetType(cols, sheetName);

        if (type === 'equipos') {
          var count = importEquipos(rows);
          totalImported += count;
          importLog.push('BD Equipos: ' + count + ' registros');
        } else if (type === 'passwords') {
          var count = importPasswords(rows);
          totalImported += count;
          importLog.push('Contraseñas: ' + count + ' registros');
        } else if (type === 'programacion') {
          var count = importProgramacion(rows);
          totalImported += count;
          importLog.push('Programación: ' + count + ' registros');
        } else if (type === 'indicadores') {
          var count = importIndicadores(rows);
          totalImported += count;
          importLog.push('Indicadores: ' + count + ' registros');
        } else {
          // Intentar como equipos si tiene al menos Usuario/Host/ID
          var count = importEquipos(rows);
          if (count > 0) {
            totalImported += count;
            importLog.push('Hoja "' + sheetName + '": ' + count + ' equipos');
          }
        }
      });

      if (totalImported > 0) {
        sv();
        log('import', 'Sistema', 'Importó ' + totalImported + ' registros: ' + importLog.join(', '));
        toast('✅ ' + totalImported + ' registros importados', 'ok');
        R(cSec);
      } else {
        toast('⚠️ No se encontraron datos reconocibles en el archivo', 'wa');
      }
    } catch (err) {
      console.error('Error importando:', err);
      toast('❌ Error al leer el archivo: ' + err.message, 'er');
    }
  };

  rd.readAsBinaryString(f);
  e.target.value = '';
}

// ===== DETECTAR TIPO DE HOJA POR COLUMNAS =====
function detectSheetType(cols, sheetName) {
  var colStr = cols.join(' ');
  var sn = sheetName.toLowerCase();

  // BD Equipos: tiene usuario + host + ID equipo
  if (colStr.match(/usuario|user/) && colStr.match(/host|hostname/) && colStr.match(/id.*equipo|equipo.*id|código.*barras|codigo.*barras|inventario|ai0/i)) return 'equipos';
  if (sn.match(/equipo|bd|inventario/)) return 'equipos';

  // Contraseñas: tiene hostname + contraseña/password
  if (colStr.match(/hostname|host.*equipo/) && colStr.match(/contraseña|password|clave/)) return 'passwords';
  if (sn.match(/contraseña|password/)) return 'passwords';

  // Programación: tiene fecha programada + código equipo
  if (colStr.match(/fecha.*programa|programada/) && colStr.match(/código.*equipo|equipo/)) return 'programacion';
  if (sn.match(/programa/)) return 'programacion';

  // Indicadores
  if (sn.match(/indicador/)) return 'indicadores';

  return 'unknown';
}

// ===== IMPORTAR BD EQUIPOS =====
function importEquipos(rows) {
  var count = 0;
  rows.forEach(function(row) {
    var r = mapRow(row, {
      usr: ['usuario', 'user', 'nombre', 'name'],
      hst: ['host', 'hostname', 'host del equipo', 'hostname del equipo', 'host_equipo'],
      tip: ['tipo', 'tipo de equipo', 'tipo_equipo', 'type'],
      ide: ['id del equipo', 'id equipo', 'id_equipo', 'código de barras', 'codigo de barras', 'código de barras del inventario', 'codigo', 'equipo_id', 'idequipo', 'id'],
      frc: ['fecha recibe', 'fecha en que se recibe el equipo', 'fecha_recibe', 'f. recibe'],
      fpr: ['fecha programacion', 'fecha de programacion', 'fecha_programacion', 'f. programación', 'f. programacion']
    });

    // Necesita al menos usuario o ID para ser válido
    if (!r.usr && !r.ide) return;
    if (!r.ide) r.ide = 'EQ-' + gId();
    if (!r.tip) r.tip = 'CPU';

    // No duplicar por ID de equipo
    var exists = D.eq.find(function(e) { return e.ide === r.ide; });
    if (exists) return;

    r.id = gId();
    D.eq.push(r);
    count++;
  });
  return count;
}

// ===== IMPORTAR CONTRASEÑAS =====
function importPasswords(rows) {
  var count = 0;
  rows.forEach(function(row) {
    var r = mapRow(row, {
      hst: ['hostname', 'host', 'hostname del equipo', 'host del equipo'],
      cod: ['código', 'codigo', 'código de barras', 'codigo de barras', 'código de barras del inventario', 'codigo inventario', 'código inventario', 'id'],
      nom: ['nombre', 'name', 'usuario'],
      pas: ['contraseña', 'password', 'clave', 'pass']
    });
    if (!r.hst && !r.cod) return;
    var exists = D.pw.find(function(p) { return p.cod === r.cod && r.cod; });
    if (exists) return;
    r.id = gId();
    D.pw.push(r);
    count++;
  });
  return count;
}

// ===== IMPORTAR PROGRAMACIÓN =====
function importProgramacion(rows) {
  var count = 0;
  rows.forEach(function(row) {
    var r = mapRow(row, {
      eq: ['código de equipo', 'codigo de equipo', 'código equipo', 'codigo equipo', 'equipo', 'id equipo'],
      fp: ['fecha programada', 'fecha programada de mantenimiento', 'f. programada'],
      fr: ['fecha realizado', 'fecha de mantenimiento realizado', 'f. realizado'],
      por: ['realizado por', 'realiza', 'técnico', 'tecnico'],
      st: ['estado', 'progreso', 'status'],
      com: ['comentarios', 'comentario', 'notas'],
      fe: ['fecha entrega', 'f. entrega']
    });
    if (!r.eq) return;
    if (!r.st) r.st = 'pendiente';
    var exists = D.prog.find(function(p) { return p.eq === r.eq && p.fp === r.fp; });
    if (exists) return;
    r.id = gId();
    D.prog.push(r);
    count++;
  });
  return count;
}

// ===== IMPORTAR INDICADORES =====
function importIndicadores(rows) {
  var count = 0;
  rows.forEach(function(row) {
    var r = mapRow(row, {
      eid: ['id equipo', 'equipo', 'id'],
      usr: ['usuario', 'nombre'],
      f: ['fecha'],
      q1: ['q1'], q2: ['q2'], q3: ['q3']
    });
    if (!r.eid) return;
    r.id = gId();
    D.ind.push(r);
    count++;
  });
  return count;
}

// ===== MAPEAR FILA: busca la columna por múltiples nombres posibles =====
function mapRow(row, mapping) {
  var result = {};
  var rowKeys = {};
  // Crear mapa de keys normalizados
  Object.keys(row).forEach(function(k) {
    rowKeys[k.toLowerCase().trim()] = k;
  });

  Object.keys(mapping).forEach(function(field) {
    var aliases = mapping[field];
    var val = '';
    for (var i = 0; i < aliases.length; i++) {
      var alias = aliases[i].toLowerCase();
      if (rowKeys[alias] !== undefined) {
        val = String(row[rowKeys[alias]] || '').trim();
        break;
      }
    }
    // Si no encontró por nombre exacto, buscar parcial
    if (!val) {
      var keys = Object.keys(rowKeys);
      for (var i = 0; i < aliases.length; i++) {
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf(aliases[i].toLowerCase()) >= 0 || aliases[i].toLowerCase().indexOf(keys[j]) >= 0) {
            val = String(row[rowKeys[keys[j]]] || '').trim();
            if (val) break;
          }
        }
        if (val) break;
      }
    }
    result[field] = val;
  });
  return result;
}
