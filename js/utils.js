/**
 * UTILS — Funciones de utilidad
 */
function $(id) { return document.getElementById(id); }
function gId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function E(t) { return t ? String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function fd2(d) { if (!d || d === '—') return '—'; try { var dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'2-digit'}); } catch(e) { return d; } }
function fdt(d) { if (!d) return '—'; try { return new Date(d).toLocaleString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'}); } catch(e) { return d; } }
function toast(m, t) { var e = document.createElement('div'); e.className = 'toast t-' + (t||'ok'); e.innerHTML = '<span>' + ({ok:'✅',er:'❌',wa:'⚠️'}[t]||'ℹ️') + '</span><span>' + m + '</span>'; $('toasts').appendChild(e); setTimeout(function(){e.remove();}, 3500); }
function oM(t, b, f) { $('mt').textContent = t; $('mb').innerHTML = b; $('mf').innerHTML = f; $('mo').classList.add('on'); }
function cM() { $('mo').classList.remove('on'); eId = null; }

/**
 * printPDF — Abre ventana nueva con contenido VISIBLE + logo BASE64
 * Descarga PDF automáticamente con html2pdf.js (funciona porque no hay canvas taint)
 * También tiene botón de imprimir como respaldo
 */
function printPDF(html, title) {
  var w = window.open('', '_blank');
  if (!w) { toast('Permite ventanas emergentes', 'er'); return; }
  var fname = (title || 'DEBBIOM') + '.pdf';

  var d = [];
  d.push('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  d.push('<title>' + E(title) + '</title>');
  // Cargar html2pdf en ESTA ventana (donde el contenido sí es visible)
  d.push('<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>');
  d.push('<style>');
  d.push('*{margin:0;padding:0;box-sizing:border-box}');
  d.push('body{font-family:Helvetica,Arial,sans-serif;background:#555;color:#000;font-size:11px}');
  // Hoja carta centrada
  d.push('#hoja{width:730px;margin:50px auto 30px;background:#fff;padding:32px 38px;box-shadow:0 2px 20px rgba(0,0,0,.4)}');
  d.push('table{width:100%;border-collapse:collapse;margin-bottom:5px;table-layout:fixed}');
  d.push('th,td{border:1px solid #333;padding:5px 7px;font-size:10px;vertical-align:top;word-wrap:break-word;overflow-wrap:break-word}');
  d.push('th{background:#d5d5d5;font-weight:700;font-size:9px}');
  d.push('.hdr{border:2px solid #111;margin-bottom:6px}.hdr td{border:none}');
  d.push('.lbl{font-weight:700;background:#ebebeb}');
  d.push('.cm{font-style:italic;white-space:normal;word-break:break-word}');
  d.push('.sig-row{display:flex;gap:30px;margin-top:30px}');
  d.push('.sig-box{flex:1;height:75px;border:1.5px solid #333;position:relative}');
  d.push('.sig-box span{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:9px;font-weight:700;border-top:1.5px solid #333;padding:3px 0;background:#f5f5f5}');
  d.push('.ft{text-align:center;font-size:8px;color:#fff;padding:4px;background:#00838f;margin-top:8px}');
  // Barra superior
  d.push('.bar{position:fixed;top:0;left:0;right:0;background:#00838f;color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:99;box-shadow:0 2px 10px rgba(0,0,0,.3)}');
  d.push('.bar button{padding:8px 20px;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;margin-left:8px}');
  d.push('.b1{background:#fff;color:#00838f}.b2{background:rgba(255,255,255,.2);color:#fff}');
  // Imprimir: ocultar barra, hoja completa
  d.push('@media print{.bar{display:none!important}body{background:#fff}#hoja{width:100%;margin:0;padding:28px 34px;box-shadow:none}}');
  d.push('@page{size:letter;margin:10mm 12mm 8mm 12mm}');
  d.push('</style></head><body>');

  // Barra
  d.push('<div class="bar">');
  d.push('<div style="display:flex;align-items:center;gap:8px"><span id="ic">⏳</span><span id="ms">Cargando...</span></div>');
  d.push('<div><button class="b1" id="bd" disabled onclick="descargar()">⬇ Descargar PDF</button>');
  d.push('<button class="b2" onclick="window.print()">🖨 Imprimir</button></div></div>');

  // Contenido
  d.push('<div id="hoja">' + html + '</div>');

  // Script de descarga
  d.push('<script>');
  d.push('function descargar(){');
  d.push('  var h=document.getElementById("hoja"),b=document.getElementById("bd");');
  d.push('  b.textContent="⏳ Generando...";b.disabled=true;');
  d.push('  document.getElementById("ic").textContent="⏳";');
  d.push('  document.getElementById("ms").textContent="Generando PDF...";');
  d.push('  html2pdf().set({');
  d.push('    margin:[10,12,8,12],');
  d.push('    filename:"' + fname + '",');
  d.push('    image:{type:"jpeg",quality:0.95},');
  d.push('    html2canvas:{scale:2,useCORS:true,scrollX:0,scrollY:0},');
  d.push('    jsPDF:{unit:"mm",format:"letter",orientation:"portrait"},');
  d.push('    pagebreak:{mode:["avoid-all"]}');
  d.push('  }).from(h).save().then(function(){');
  d.push('    b.textContent="✅ Descargado";b.disabled=false;');
  d.push('    document.getElementById("ic").textContent="✅";');
  d.push('    document.getElementById("ms").textContent="PDF guardado";');
  d.push('  }).catch(function(err){');
  d.push('    b.textContent="❌ Error";b.disabled=false;');
  d.push('    document.getElementById("ic").textContent="❌";');
  d.push('    document.getElementById("ms").textContent="Error: "+err;');
  d.push('    console.error(err);');
  d.push('  });');
  d.push('}');
  // Cuando cargue html2pdf, habilitar botón y descargar automáticamente
  d.push('window.onload=function(){');
  d.push('  document.getElementById("bd").disabled=false;');
  d.push('  document.getElementById("ic").textContent="📄";');
  d.push('  document.getElementById("ms").textContent="Listo";');
  d.push('  setTimeout(descargar,800);');
  d.push('};');
  d.push('<\/script>');
  d.push('</body></html>');

  w.document.write(d.join('\n'));
  w.document.close();
}
