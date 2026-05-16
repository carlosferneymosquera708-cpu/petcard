<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const { usuarioLogueado, cerrarSesion } = useAuth()
const API = 'http://localhost:3001/api/vacunas'
const API_MASCOTAS = 'http://localhost:3001/api/mascotas'
const API_SERVICIOS = 'http://localhost:3001/api/servicios'

const vacunas = ref([])
const mascotas = ref([])
const servicios = ref([])
const busqueda = ref('')
const filtroEstado = ref('Todos')
const cargando = ref(false)
const error = ref('')
const mostrarModalNuevo = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const vacunaSeleccionada = ref(null)
const vacunaAEliminar = ref(null)

const nuevaVacuna = ref({
  ID_mascota: '', ID_servicio: '', Nombre_vacuna: '', Lote: '',
  Fecha_aplicacion: '', Proxima_dosis: '', Estado: 'Pendiente', Observaciones: ''
})

onMounted(async () => {
  await cargarVacunas()
  await cargarMascotas()
  await cargarServicios()
})

async function cargarVacunas() {
  cargando.value = true
  error.value = ''
  try {
    const res = await fetch(API)
    if (!res.ok) throw new Error()
    vacunas.value = await res.json()
  } catch {
    error.value = 'No se pudo conectar con el servidor.'
  } finally {
    cargando.value = false
  }
}

async function cargarMascotas() {
  try { const res = await fetch(API_MASCOTAS); mascotas.value = await res.json() } catch {}
}
async function cargarServicios() {
  try { const res = await fetch(API_SERVICIOS); servicios.value = await res.json() } catch {}
}

const vacunasFiltradas = computed(() =>
  vacunas.value.filter(v => {
    const texto = `${v.Nombre_mascota} ${v.Nombre_vacuna}`.toLowerCase()
    const coincide = texto.includes(busqueda.value.toLowerCase())
    const coincideEstado = filtroEstado.value === 'Todos' || v.Estado === filtroEstado.value
    return coincide && coincideEstado
  })
)

function badgeClass(estado) {
  if (estado === 'Completada') return 'badge badge-green'
  if (estado === 'Pendiente') return 'badge badge-yellow'
  return 'badge badge-gray'
}

function abrirEditar(v) { vacunaSeleccionada.value = { ...v }; mostrarModalEditar.value = true }

async function guardarEdicion() {
  try {
    const res = await fetch(`${API}/${vacunaSeleccionada.value.ID_carnetVacunas}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacunaSeleccionada.value)
    })
    if (!res.ok) throw new Error()
    await cargarVacunas()
    mostrarModalEditar.value = false
  } catch { alert('Error al guardar.') }
}

function confirmarEliminar(v) { vacunaAEliminar.value = v; mostrarModalEliminar.value = true }

async function eliminarVacuna() {
  try {
    const res = await fetch(`${API}/${vacunaAEliminar.value.ID_carnetVacunas}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    await cargarVacunas()
    mostrarModalEliminar.value = false
  } catch { alert('Error al eliminar.') }
}

async function crearVacuna() {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaVacuna.value)
    })
    if (!res.ok) throw new Error()
    await cargarVacunas()
    nuevaVacuna.value = { ID_mascota: '', ID_servicio: '', Nombre_vacuna: '', Lote: '', Fecha_aplicacion: '', Proxima_dosis: '', Estado: 'Pendiente', Observaciones: '' }
    mostrarModalNuevo.value = false
  } catch { alert('Error al crear el registro.') }
}
</script>

<template>
  <nav class="navbar">
    <router-link to="/admin-inicio" class="nav-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C17.5 22.15 21 17.25 21 12V6l-9-4z" fill="currentColor" opacity=".15"/><circle cx="9" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none"/><path d="M9 14s1 1.5 3 1.5 3-1.5 3-1.5" stroke-linecap="round"/></svg>
      PETCARD
    </router-link>
    <ul class="nav-links" style="margin-left:1.5rem;">
      <li><router-link to="/admin-alimentacion">Alimentación</router-link></li>
      <li><router-link to="/admin-carnet" class="active">Carnet de Vacunas</router-link></li>
      <li><router-link to="/admin-notificaciones">Notificaciones</router-link></li>
      <li><router-link to="/admin-servicios">Servicios</router-link></li>
      <li><router-link to="/admin-citas">Citas</router-link></li>
    </ul>
    <div class="nav-actions">
      <span style="color:white;margin-right:1rem;font-weight:500;">{{ usuarioLogueado?.Nombre || 'Admin' }}</span>
      <router-link to="/admin-perfil" class="btn btn-outline-white btn-sm" style="text-decoration:none;display:inline-block;">👤</router-link>
      <button class="btn btn-danger btn-sm" @click="cerrarSesion">Cerrar Sesión</button>
    </div>
  </nav>

  <div class="page-wrapper">
    <div class="gestion-header">
      <div>
        <div class="gestion-title">Carnet de Vacunas</div>
        <div class="gestion-sub">Administra los registros de vacunación de las mascotas</div>
      </div>
      <div class="gestion-btns">
        <button class="btn btn-success btn-sm" @click="mostrarModalNuevo = true">+ Nuevo Registro</button>
      </div>
    </div>

    <div v-if="error" style="background:#fee2e2;color:#dc2626;padding:.75rem 1rem;border-radius:8px;margin-bottom:1rem;">⚠️ {{ error }}</div>

    <div class="search-filter" style="margin-bottom:1.25rem;">
      <div class="search-wrap">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Buscar mascota o vacuna..." v-model="busqueda"/>
      </div>
      <select class="filter-select" v-model="filtroEstado">
        <option>Todos</option>
        <option>Pendiente</option>
        <option>Completada</option>
      </select>
    </div>

    <div v-if="cargando" style="text-align:center;padding:2rem;color:#888;">Cargando registros...</div>
    <div v-else-if="vacunasFiltradas.length === 0" style="text-align:center;padding:2rem;color:#888;">No se encontraron registros.</div>

    <div v-else class="cards-grid-2">
      <div class="admin-card" v-for="v in vacunasFiltradas" :key="v.ID_carnetVacunas">
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title">{{ v.Nombre_mascota }}</div>
            <div class="admin-card-tipo">{{ v.Nombre_servicio }}</div>
          </div>
          <span :class="badgeClass(v.Estado)">{{ (v.Estado || 'Pendiente').toUpperCase() }}</span>
        </div>
        <div class="admin-card-body">
          <div class="detail">{{ v.Nombre_vacuna }}</div>
          <div class="admin-card-meta" v-if="v.Lote">Lote: {{ v.Lote }}</div>
          <div class="admin-card-meta" v-if="v.Fecha_aplicacion">Aplicada: {{ v.Fecha_aplicacion?.slice(0,10) }}</div>
          <div class="admin-card-meta" v-if="v.Proxima_dosis">Próxima: {{ v.Proxima_dosis?.slice(0,10) }}</div>
          <div class="admin-card-meta" v-if="v.Observaciones">{{ v.Observaciones }}</div>
        </div>
        <div class="admin-card-actions">
          <button class="btn btn-secondary btn-sm" @click="abrirEditar(v)">Editar</button>
          <button class="btn btn-danger btn-sm" @click="confirmarEliminar(v)">Eliminar</button>
        </div>
      </div>
    </div>

    <footer class="footer" style="margin-top:2rem;">
      <div class="footer-grid">
        <div class="footer-brand"><span class="nav-logo" style="color:#fff;display:flex;">PetCard</span><p>Comprometidos con brindar toda la atención profesional.</p></div>
        <div class="footer-col"><h4>Contacto</h4><p>+1 234 567 8901</p></div>
        <div class="footer-col"><h4>Horarios</h4><p>Lun - Vie: 8:00 AM - 7:00 PM</p></div>
      </div>
      <div class="footer-bottom">© 2024 PetCard. Todos los derechos reservados.</div>
    </footer>
  </div>

  <!-- Modal Nuevo Registro -->
  <div v-if="mostrarModalNuevo" class="modal-overlay" @click.self="mostrarModalNuevo = false">
    <div class="modal">
      <h3>Nuevo Registro de Vacuna</h3>
      <div class="modal-body">
        <label>Mascota</label>
        <select v-model="nuevaVacuna.ID_mascota">
          <option value="" disabled>Selecciona mascota</option>
          <option v-for="m in mascotas" :key="m.ID_mascota" :value="m.ID_mascota">{{ m.Nombre }} ({{ m.Especie }})</option>
        </select>
        <label>Servicio</label>
        <select v-model="nuevaVacuna.ID_servicio">
          <option value="" disabled>Selecciona servicio</option>
          <option v-for="s in servicios" :key="s.ID_servicio" :value="s.ID_servicio">{{ s.Nombre }}</option>
        </select>
        <label>Nombre de la vacuna</label>
        <input v-model="nuevaVacuna.Nombre_vacuna" placeholder="Ej: Antirrábica" />
        <label>Lote</label>
        <input v-model="nuevaVacuna.Lote" placeholder="Ej: ABC123" />
        <label>Fecha de aplicación</label>
        <input type="date" v-model="nuevaVacuna.Fecha_aplicacion" />
        <label>Próxima dosis</label>
        <input type="date" v-model="nuevaVacuna.Proxima_dosis" />
        <label>Estado</label>
        <select v-model="nuevaVacuna.Estado">
          <option>Pendiente</option>
          <option>Completada</option>
        </select>
        <label>Observaciones</label>
        <textarea v-model="nuevaVacuna.Observaciones" rows="2"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" @click="mostrarModalNuevo = false">Cancelar</button>
        <button class="btn btn-success btn-sm" @click="crearVacuna">Crear</button>
      </div>
    </div>
  </div>

  <!-- Modal Editar -->
  <div v-if="mostrarModalEditar" class="modal-overlay" @click.self="mostrarModalEditar = false">
    <div class="modal">
      <h3>Editar Vacuna — {{ vacunaSeleccionada.Nombre_mascota }}</h3>
      <div class="modal-body">
        <label>Nombre de la vacuna</label>
        <input v-model="vacunaSeleccionada.Nombre_vacuna" />
        <label>Lote</label>
        <input v-model="vacunaSeleccionada.Lote" />
        <label>Fecha de aplicación</label>
        <input type="date" v-model="vacunaSeleccionada.Fecha_aplicacion" />
        <label>Próxima dosis</label>
        <input type="date" v-model="vacunaSeleccionada.Proxima_dosis" />
        <label>Estado</label>
        <select v-model="vacunaSeleccionada.Estado">
          <option>Pendiente</option>
          <option>Completada</option>
        </select>
        <label>Observaciones</label>
        <textarea v-model="vacunaSeleccionada.Observaciones" rows="2"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" @click="mostrarModalEditar = false">Cancelar</button>
        <button class="btn btn-success btn-sm" @click="guardarEdicion">Guardar</button>
      </div>
    </div>
  </div>

  <!-- Modal Eliminar -->
  <div v-if="mostrarModalEliminar" class="modal-overlay" @click.self="mostrarModalEliminar = false">
    <div class="modal">
      <h3>¿Eliminar registro?</h3>
      <p>¿Eliminar la vacuna <strong>{{ vacunaAEliminar?.Nombre_vacuna }}</strong> de <strong>{{ vacunaAEliminar?.Nombre_mascota }}</strong>?</p>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" @click="mostrarModalEliminar = false">Cancelar</button>
        <button class="btn btn-danger btn-sm" @click="eliminarVacuna">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000; }
.modal { background:white;border-radius:12px;padding:2rem;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2); }
.modal h3 { margin:0 0 1rem;font-size:1.2rem;font-weight:700; }
.modal-body { display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.5rem; }
.modal-body label { font-weight:600;font-size:.85rem;color:#555;margin-top:.25rem; }
.modal-body input,.modal-body select,.modal-body textarea { padding:.5rem .75rem;border:1px solid #ddd;border-radius:6px;font-size:.95rem;width:100%;box-sizing:border-box; }
.modal-footer { display:flex;gap:.75rem;justify-content:flex-end; }
</style>