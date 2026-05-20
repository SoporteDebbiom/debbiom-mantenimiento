/**
 * APP — Controlador principal
 * Inicialización con sincronización de Supabase
 */

// Navegar entre secciones
function nav(s) {
  // === SEGURIDAD: Validar permisos de sección ===
  var empAllowed = ['cal', 'comp'];
  if (!isAdmin() && empAllowed.indexOf(s) < 0) {
    toast('⛔ Sin permisos para esta sección', 'er');
    log('security', 'Sistema', 'Acceso denegado a "' + s + '" por ' + (U ? U.n : 'desconocido'));
    s = 'cal'; // Redirigir a calendario
  }
  cSec = s;
  document.querySelectorAll('.sec').forEach(function(e) { e.classList.remove('on'); });
  document.querySelectorAll('.sb-i').forEach(function(i) { i.classList.toggle('on', i.dataset.s === s); });

  var t = {
    cal: '📅 Calendario', prog: '🔧 Programación', comp: '📄 Comprobantes',
    ind: '📊 Indicadores', bd: '🗄️ BD Equipos', pw: '🔑 Contraseñas',
    notif: '🔔 Notificaciones', deptos: '🏢 Departamentos', pap: '🗑️ Papelera', log: '📋 Logs'
  };
  $('pt').textContent = t[s] || s;

  var m = { cal: 'sCal', prog: 'sProg', comp: 'sComp', ind: 'sInd', bd: 'sBd', pw: 'sPw', notif: 'sNotif', deptos: 'sDeptos', pap: 'sPap', log: 'sLog' };
  var el = $(m[s]);
  if (el) el.classList.add('on');

  R(s);
  log('view', s, 'Visualizó sección');
}

// Router de renderizado
function R(s) {
  var routes = { cal: rCal, prog: rProg, comp: rComp, ind: rInd, bd: rBD, pw: rPW, notif: rNotif, deptos: rDeptos, pap: rPap, log: rLog };
  if (routes[s]) routes[s]();
}

// Inicialización: cargar localStorage → luego Supabase → luego sesión
function init() {
  ld(); // Cargar datos locales primero (inmediato)

  // Intentar cargar de Supabase (puede tener datos más recientes)
  if (typeof syncFromCloud === 'function') {
    syncFromCloud(function() {
      // Después de sync, verificar sesión
      checkSession();
    });
  } else {
    checkSession();
  }
}

function checkSession() {
  var s = localStorage.getItem('ti2s');
  if (s) {
    try {
      U = JSON.parse(s);
      showApp();
    } catch (e) {
      showL();
    }
  } else {
    showL();
  }
}

// Evento de inicio
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { cM(); var np=$('notifPanel'); if(np) np.style.display='none'; } });
// Cerrar panel de notificaciones al hacer clic fuera
document.addEventListener('click', function(e) {
  var panel = $('notifPanel');
  if (!panel || panel.style.display === 'none') return;
  if (!e.target.closest('#notifPanel') && !e.target.closest('[onclick*="toggleNotifPanel"]')) {
    panel.style.display = 'none';
  }
});
