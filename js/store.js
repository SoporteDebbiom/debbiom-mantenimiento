/**
 * STORE — Almacenamiento y persistencia de datos
 * Guarda en localStorage (inmediato) + Supabase (nube, con debounce)
 */

var D = {
  prog: [],    // Programación de mantenimientos
  comp: [],    // Comprobantes de mantenimiento
  eq: [],      // BD de equipos
  pw: [],      // Contraseñas
  ind: [],     // Indicadores (encuestas)
  pap: [],     // Papelera de reciclaje
  logs: [],    // Registro de actividad
  deptos: [    // Departamentos
    'Calidad',
    'Dirección General',
    'Bioestadística',
    'Laboratorio Clínico',
    'Analítica',
    'Gestión de Voluntarios'
  ]
};

var U = null;          // Usuario actual {u, n, r, d}  d=departamento
var cSec = 'cal';      // Sección actual
var cY = new Date().getFullYear();
var cMo = new Date().getMonth();
var eId = null;        // ID en edición

// Usuarios administradores (hashes SHA-256 — no texto plano)
var _UD = 'eyJBZG1pbiI6eyJoIjoiZDg4YzUxYTc2N2ZiYjg5MGM3MjA3M2ZjMjhiNGZlOWExMjU3NWJhMzRiM2M4OTlmNDY1MTdjMzhhNjU4NmI1MCIsIm4iOiJBZG1pbmlzdHJhZG9yIiwiciI6ImFkbWluIn0sIlNHdWVycmVybyI6eyJoIjoiZjE1NDQyOTljNWY4MDZhYjUzMjBjZDEyMDg2YzQ2OGQ1ZjI5M2U2NGRhNGE1ZGY5Mzc4NDg2MjJjYjA1YjJiNyIsIm4iOiJTYW50aWFnbyBHdWVycmVybyIsInIiOiJhZG1pbiJ9LCJBZG1pblRJIjp7ImgiOiJkYWMzZmE1ZjFhNjM2YjU1NWZmZjk2NjBlMmZjYzE1ZDAzOTY4NTllN2M0MGQ3NmM0ZGVkNzJiMTQ4YWUxOTY1IiwibiI6IkFkbWluIFRJIiwiciI6ImFkbWluIn19';
var USERS = JSON.parse(atob(_UD));

var _IPH = 'f1544299c5f806ab5320cd12086c468d5f293e64da4a5df937848622cb05b2b7';
var _EPH = 'f1544299c5f806ab5320cd12086c468d5f293e64da4a5df937848622cb05b2b7';

// SHA-256 hash function
async function sha256(text) {
  var enc = new TextEncoder().encode(text);
  var buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// Validar contraseña de admin (async)
async function validateAdmin(user, pass) {
  var u = USERS[user];
  if (!u) return null;
  var hash = await sha256(pass);
  return hash === u.h ? u : null;
}

// Validar contraseña de empleado (async)
async function validateEmp(pass) {
  var hash = await sha256(pass);
  return hash === _EPH;
}

// Validar contraseña de import/export (async)
async function validateIPW(pass) {
  var hash = await sha256(pass);
  return hash === _IPH;
}

// Cargar datos de localStorage
function ld() {
  try {
    var d = localStorage.getItem('ti2d');
    if (d) D = JSON.parse(d);
  } catch (e) {
    console.warn('Error cargando datos:', e);
  }
  // Asegurar que todos los arrays existan
  'prog comp eq pw ind pap logs'.split(' ').forEach(function(k) {
    if (!Array.isArray(D[k])) D[k] = [];
  });
  // Asegurar departamentos
  if (!Array.isArray(D.deptos) || D.deptos.length === 0) {
    D.deptos = ['Calidad','Dirección General','Bioestadística','Laboratorio Clínico','Analítica','Gestión de Voluntarios'];
  }
}

// Guardar datos en localStorage + sincronizar con Supabase
function sv() {
  try {
    localStorage.setItem('ti2d', JSON.stringify(D));
  } catch (e) {
    console.warn('Error guardando datos:', e);
  }
  if (typeof scheduleSync === 'function') {
    scheduleSync();
  }
}

// Verificar si el usuario actual es administrador
function isAdmin() {
  return U && U.r === 'admin';
}

// ===== PURGAR TODOS LOS DATOS =====
function purgeAllData() {
  if (!isAdmin()) { toast('⛔ Sin permisos', 'er'); return; }

  // Primera confirmación
  if (!confirm('⚠️ ATENCIÓN: Esto eliminará TODOS los registros de la app:\n\n• Programaciones\n• Comprobantes\n• BD Equipos\n• Contraseñas\n• Indicadores\n• Papelera\n• Logs\n\n¿Deseas continuar?')) return;

  // Segunda confirmación con texto
  var c = prompt('Para confirmar, escribe "BORRAR" (en mayúsculas):');
  if (c !== 'BORRAR') { toast('Cancelado — no se escribió "BORRAR"', 'wa'); return; }

  // Contar registros antes de borrar
  var total = D.prog.length + D.comp.length + D.eq.length + D.pw.length + D.ind.length + D.pap.length + D.logs.length;

  // Vaciar todos los arrays
  D.prog = [];
  D.comp = [];
  D.eq = [];
  D.pw = [];
  D.ind = [];
  D.pap = [];
  D.logs = [];

  // Guardar en localStorage y sincronizar con Supabase
  sv();

  // Forzar sync inmediato a la nube
  if (typeof syncToCloud === 'function') {
    syncToCloud();
  }

  log('purge', 'Sistema', 'Purgó TODOS los datos (' + total + ' registros) — ' + (U ? U.n : ''));
  sv(); // Guardar el log de purga

  toast('🗑️ ' + total + ' registros eliminados permanentemente', 'er');
  R(cSec);
}
