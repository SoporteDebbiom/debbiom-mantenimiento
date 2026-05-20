/**
 * AUTH — Login con roles estrictos
 * Admin: acceso total (sin llenar encuesta)
 * Empleado: solo ver calendario + llenar encuesta en comprobante
 */

function switchLoginTab(tab) {
  var btnA = $('tabAdmin'), btnE = $('tabEmp');
  var frmA = $('loginAdmin'), frmE = $('loginEmp');
  $('le').textContent = '';
  if (tab === 'admin') {
    btnA.style.background = 'var(--deb-teal)'; btnA.style.color = '#fff';
    btnE.style.background = 'var(--bg3)'; btnE.style.color = 'var(--text2)';
    frmA.style.display = 'block'; frmE.style.display = 'none';
  } else {
    btnE.style.background = 'var(--deb-teal)'; btnE.style.color = '#fff';
    btnA.style.background = 'var(--bg3)'; btnA.style.color = 'var(--text2)';
    frmA.style.display = 'none'; frmE.style.display = 'block';
    fillDeptoSelect('empDepto');
  }
}

function fillDeptoSelect(selectId) {
  var sel = $(selectId); if (!sel) return;
  var val = sel.value;
  sel.innerHTML = '<option value="">🏢 Selecciona tu departamento</option>';
  D.deptos.forEach(function(d) { sel.innerHTML += '<option value="' + E(d) + '">' + E(d) + '</option>'; });
  sel.value = val;
}

// ===== LOGIN ADMIN =====
async function doLogin() {
  var u = $('lu').value.trim(), p = $('lp').value;
  var result = await validateAdmin(u, p);
  if (result) {
    U = { u: u, n: result.n, r: 'admin', d: 'TI' };
    localStorage.setItem('ti2s', JSON.stringify(U));
    log('login', 'Sistema', 'Admin: ' + U.n);
    showApp();
  } else { $('le').textContent = 'Usuario o contraseña incorrectos'; }
}

// ===== LOGIN EMPLEADO (con contraseña) =====
async function doLoginEmp() {
  var nombre = $('empNombre').value.trim();
  var depto = $('empDepto').value;
  var pass = $('empPass').value;
  if (!nombre) { $('le').textContent = 'Escribe tu nombre'; return; }
  if (!depto) { $('le').textContent = 'Selecciona tu departamento'; return; }
  if (!pass) { $('le').textContent = 'Ingresa la contraseña'; return; }
  var ok = await validateEmp(pass);
  if (!ok) { $('le').textContent = 'Contraseña incorrecta'; return; }
  U = { u: 'emp_' + nombre.replace(/\s/g, '_'), n: nombre, r: 'empleado', d: depto };
  localStorage.setItem('ti2s', JSON.stringify(U));
  log('login', 'Sistema', 'Empleado: ' + nombre + ' (' + depto + ')');
  showApp();
}

function showL() {
  $('loginScr').style.display = 'flex';
  $('app').style.display = 'none';
  if (typeof fetchOnlineForLogin === 'function') fetchOnlineForLogin();
}

function showApp() {
  $('loginScr').style.display = 'none';
  $('app').style.display = 'flex';
  $('un').textContent = U.n;
  $('ur').textContent = isAdmin() ? '🛡️ Administrador' : '👤 ' + U.d;
  $('av').textContent = U.n.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2);

  // Clase CSS según rol
  document.body.classList.remove('rol-empleado', 'rol-admin');
  document.body.classList.add(isAdmin() ? 'rol-admin' : 'rol-empleado');

  applyPermissions();
  applyToolbarPermissions();
  if (typeof initNotifs === 'function') initNotifs();

  document.querySelectorAll('.sb-i').forEach(function(i) {
    i.onclick = function() { nav(i.dataset.s); };
  });

  // Presencia multiusuario
  if (typeof startPresence === 'function') startPresence();

  nav('cal');
}

// ===== PERMISOS ESTRICTOS =====
function applyPermissions() {
  // Empleado solo ve: calendario + comprobante
  var empAllowed = ['cal', 'comp'];
  // Admin: todo excepto llenar encuesta (eso es del empleado)
  var adminHidden = [];

  document.querySelectorAll('.sb-i').forEach(function(item) {
    var sec = item.dataset.s;
    if (!isAdmin() && empAllowed.indexOf(sec) < 0) {
      item.style.display = 'none';
    } else if (isAdmin() && adminHidden.indexOf(sec) >= 0) {
      item.style.display = 'none';
    } else {
      item.style.display = '';
    }
  });
}

// ===== PERMISOS DE TOOLBAR =====
function applyToolbarPermissions() {
  var tbr = document.querySelector('.tb-r');
  if (!tbr) return;
  if (!isAdmin()) {
    // Empleado: ocultar export, import, sync
    tbr.style.display = 'none';
  } else {
    tbr.style.display = '';
  }
}

function doLogout() {
  if (typeof stopPresence === 'function') stopPresence();
  log('logout', 'Sistema', U ? U.n : '');
  U = null;
  localStorage.removeItem('ti2s');
  document.body.classList.remove('rol-empleado', 'rol-admin');
  showL();
}

// ===== DEPARTAMENTOS (solo Admin) =====
function rDeptos() {
  var el = $('sDeptos'); if (!el) return;
  if (!isAdmin()) { el.innerHTML = '<p style="color:var(--text3);padding:20px">Sin permisos</p>'; return; }
  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;align-items:end">';
  h += '<div class="fg" style="flex:1;margin:0"><label>Agregar departamento</label>';
  h += '<input id="newDepto" placeholder="Nombre del departamento..." style="padding:10px 14px;border-radius:8px;border:1.5px solid var(--border);background:#fff;font-size:13px;width:100%"></div>';
  h += '<button class="btn btn-p" onclick="addDepto()" style="height:42px"><i class="fas fa-plus"></i> Agregar</button></div>';
  h += '<div class="tw"><table><thead><tr><th style="width:60px">#</th><th>Departamento</th><th style="width:100px">Acciones</th></tr></thead><tbody>';
  if (!D.deptos.length) h += '<tr><td colspan="3" style="text-align:center;padding:30px;color:var(--text3)">Sin departamentos</td></tr>';
  D.deptos.forEach(function(d, i) {
    h += '<tr><td style="text-align:center;font-weight:700;color:var(--text3)">' + (i+1) + '</td><td><b>' + E(d) + '</b></td>';
    h += '<td><button class="btn btn-sm btn-d" onclick="removeDepto(' + i + ')"><i class="fas fa-trash"></i></button></td></tr>';
  });
  h += '</tbody></table></div>';
  el.innerHTML = h;
}

function addDepto() {
  var name = $('newDepto').value.trim();
  if (!name) { toast('Escribe el nombre', 'er'); return; }
  if (D.deptos.indexOf(name) >= 0) { toast('Ya existe', 'wa'); return; }
  D.deptos.push(name);
  log('create', 'Departamentos', 'Agregó: ' + name);
  sv(); toast('✅ Agregado', 'ok'); rDeptos();
}

function removeDepto(i) {
  var name = D.deptos[i];
  if (!confirm('¿Eliminar "' + name + '"?')) return;
  D.deptos.splice(i, 1);
  log('delete', 'Departamentos', 'Eliminó: ' + name);
  sv(); toast('🗑️ Eliminado', 'wa'); rDeptos();
}
