<template>
    <nav class="navbar">
     <router-link to="/inicio" class="nav-logo">PETCARD</router-link>

  <ul class="nav-links">
    <li><router-link to="/inicio">Inicio</router-link></li>
    <li><router-link to="/servicios">Servicios</router-link></li>
    <li><router-link to="/citas">Citas</router-link></li>
    <li><router-link to="/alimentacion">Alimentación</router-link></li>
    <li><router-link to="/carnet">Carnet</router-link></li>
    <li><router-link to="/perfil">Mi Perfil</router-link></li>
    <li><router-link to="/notificaciones">Notificaciones</router-link></li>
    <li><router-link to="/mis-mascotas" class="active">Mis Mascotas</router-link></li>
  </ul>
  <div id="auth-section" class="auth-section">
    <template v-if="usuarioLogueado">
      <span class="usuario-nombre">{{ usuarioLogueado.Nombre }}</span>
      <button class="btn-auth btn-logout" @click="cerrarSesion">Cerrar sesión</button>
    </template>
    <template v-else>
      <button class="btn-auth" @click="irALogin">Iniciar sesión</button>
      <button class="btn-auth" @click="irARegistro">Registrarse</button>
    </template>
  </div>
</nav>

  <div class="hero"><h1>Mis Mascotas</h1><p>Administra los datos de tus mascotas</p></div>

  <div class="page-wrapper">
    <div v-if="isLoading" class="loading">Cargando mascotas...</div>
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <div class="mascotas-grid">
      <div
        v-for="pet in pets"
        :key="pet.ID_mascota"
        class="mascota-card card"
        style="cursor:pointer"
        @click.self="openDetail(pet)"
      >
        <div class="mascota-top">
          <div class="mascota-avatar" style="background:#fef3c7;">🐾</div>
          <div class="mascota-info">
            <div class="mascota-nombre">{{ pet.Nombre }}</div>
            <div class="mascota-tipo">{{ pet.Especie }} - {{ pet.Raza }}</div>
          </div>
          <div class="mascota-actions">
            <button class="btn-icon" title="Editar" @click.stop="openEditForm(pet)">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon" title="Eliminar" @click.stop="deletePet(pet.ID_mascota)">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mascota-datos" @click="openDetail(pet)">
          <div class="dato-item">Peso: <strong>{{ pet.Peso }} kg</strong></div>
          <div class="dato-item">Sexo: <strong>{{ pet.Sexo }}</strong></div>
          <div class="dato-item">Fecha nacimiento: <strong>{{ pet.Fecha_nacimiento }}</strong></div>
        </div>

        <div class="mascota-btns">
          <button class="btn btn-secondary btn-sm" @click.stop="openVaccineEditor(pet)">Vacunas</button>
          <button class="btn btn-primary btn-sm" @click.stop="goToCita(pet.ID_mascota)">Cita</button>
        </div>
      </div>
    </div>

    <!-- Botón agregar -->
    <button id="btn-agregar-mascota" class="btn btn-primary" @click="openAddForm">
      Agregar mascota
    </button>

    <!-- ── MODAL: detalle ── -->
    <div v-if="detailPet" class="modal-overlay" @click.self="detailPet = null">
      <div class="modal-box" style="width:520px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;">
          <h2 style="margin:0">{{ detailPet.Nombre }}</h2>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn-outline-primary" @click="printDetail">Imprimir</button>
            <button class="btn btn-primary" @click="downloadPdf(detailPet)">Descargar PDF</button>
            <button class="btn btn-outline-primary" @click="detailPet = null">Cerrar</button>
          </div>
        </div>
        <div style="display:flex;gap:1rem;">
          <div style="flex:1">
            <div v-for="(label, key) in detailFields" :key="key" style="margin-bottom:.5rem;">
              <div style="font-weight:700;margin-bottom:.25rem">{{ label }}</div>
              <div>{{ detailPet[key] || 'No especificado' }}</div>
            </div>
            <div style="margin-bottom:.5rem;">
              <div style="font-weight:700;margin-bottom:.25rem">Dueño</div>
              <div>{{ detailPet.Nombre_dueno || 'No disponible' }}</div>
            </div>
          </div>
          <div style="width:140px;text-align:center;">
            <div v-if="detailPet.Foto" style="width:120px;height:120px;border-radius:8px;background-size:cover;background-position:center;margin:0 auto;" :style="{ backgroundImage: `url(${detailPet.Foto})` }"></div>
            <div v-else style="font-size:48px">🐾</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODAL: agregar / editar ── -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-box" style="width:420px;">
        <h3 style="margin-top:0;margin-bottom:1rem;">{{ isEditing ? 'Editar Mascota' : 'Agregar Mascota' }}</h3>

        <div style="display:flex;flex-direction:column;gap:.75rem;">
          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Nombre</label>
            <input class="form-control" placeholder="Nombre de la mascota" v-model="formData.Nombre" />
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Especie</label>
            <select class="form-control" v-model="formData.Especie">
              <option value="">Selecciona especie</option>
              <option>Perro</option>
              <option>Gato</option>
              <option>Ave</option>
              <option>Conejo</option>
              <option>Hamster</option>
              <option>Pez</option>
            </select>
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Raza</label>
            <input class="form-control" placeholder="Raza de la mascota" v-model="formData.Raza" />
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Sexo</label>
            <select class="form-control" v-model="formData.Sexo">
              <option>Macho</option>
              <option>Hembra</option>
            </select>
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Fecha de nacimiento</label>
            <input class="form-control" type="date" v-model="formData.Fecha_nacimiento" />
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Peso (kg)</label>
            <input class="form-control" type="number" step="0.1" placeholder="Peso en kg" v-model="formData.Peso" />
          </div>

          <div>
            <label style="display:block;font-weight:700;margin-bottom:.5rem;">Foto (URL opcional)</label>
            <input class="form-control" placeholder="URL de la foto" v-model="formData.Foto" />
          </div>
        </div>

        <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:1rem;">
          <button class="btn btn-outline-primary" @click="showForm = false">Cancelar</button>
          <button class="btn btn-primary" @click="savePet" :disabled="isLoading">
            {{ isLoading ? 'Guardando...' : (isEditing ? 'Guardar' : 'Agregar') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL: vacunas ── -->
    <div v-if="vacPet" class="modal-overlay" @click.self="vacPet = null">
      <div class="modal-box modal-vacunas">
        <div class="vac-header">
          <div class="vac-header-left">
            <span class="vac-icon">💉</span>
            <div>
              <h3 class="vac-title">Vacunas</h3>
              <p class="vac-subtitle">{{ vacPet.nombre }}</p>
            </div>
          </div>
          <button class="btn btn-outline-primary" @click="vacPet = null">Cerrar</button>
        </div>

        <div v-if="!vacPet.vacunas || vacPet.vacunas.length === 0" class="vac-empty">
          <span class="vac-empty-icon">📋</span>
          <p>No hay vacunas registradas para esta mascota.</p>
          <p style="font-size:.8rem;color:var(--muted);">Agrega la primera vacuna usando el formulario de abajo.</p>
        </div>

        <div v-else class="vac-table-wrap">
          <table class="vac-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Vacuna</th>
                <th>Programada</th>
                <th>Aplicada</th>
                <th>Lote</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, idx) in vacPet.vacunas" :key="idx">
                <td>
                  <span class="vac-badge" :class="'vac-badge--' + v.estado">
                    {{ v.estado === 'aplicada' ? 'Aplicada' : v.estado === 'atrasada' ? 'Atrasada' : 'Pendiente' }}
                  </span>
                </td>
                <td><input class="form-control form-control--vac" v-model="v.nombre" /></td>
                <td><input class="form-control form-control--vac" type="date" v-model="v.fechaProgramada" /></td>
                <td><input class="form-control form-control--vac" type="date" v-model="v.fechaAplicada" @change="recalcEstado(v)" /></td>
                <td><input class="form-control form-control--vac" v-model="v.lote" /></td>
                <td><input class="form-control form-control--vac" v-model="v.observaciones" placeholder="—" /></td>
                <td>
                  <div class="vac-actions">
                    <button class="vac-btn vac-btn--save" title="Guardar cambios" @click="saveVac(idx)">💾</button>
                    <button class="vac-btn" :class="v.estado === 'aplicada' ? 'vac-btn--undo' : 'vac-btn--check'" :title="v.estado === 'aplicada' ? 'Desmarcar' : 'Marcar aplicada'" @click="toggleVac(idx)">
                      {{ v.estado === 'aplicada' ? '↩' : '✓' }}
                    </button>
                    <button class="vac-btn vac-btn--delete" title="Eliminar" @click="deleteVac(idx)">🗑</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="vac-divider"></div>

        <div class="vac-add">
          <div class="vac-add-title">Agregar nueva vacuna</div>
          <div class="vac-add-form">
            <input class="form-control" placeholder="Nombre de la vacuna" v-model="newVac.nombre" />
            <div class="vac-add-field">
              <label>Programada</label>
              <input class="form-control" type="date" v-model="newVac.fechaProgramada" />
            </div>
            <div class="vac-add-field">
              <label>Aplicada</label>
              <input class="form-control" type="date" v-model="newVac.fechaAplicada" />
            </div>
            <div class="vac-add-field">
              <label>Lote</label>
              <input class="form-control" placeholder="Lote" v-model="newVac.lote" />
            </div>
            <button class="btn btn-primary vac-add-btn" @click="addVac">+ Agregar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { mascotasAPI, clientesAPI, vacunasAPI, notificacionesAPI } from '../api.js'

const router = useRouter()
const { usuarioLogueado, cerrarSesion, irALogin, irARegistro } = useAuth()

// ── Estado reactivo ─────────────────────────────────────────
const pets = ref([])
const clienteActual = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

// Modal detalle
const detailPet = ref(null)

// Modal formulario
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formData = reactive({
  Nombre: '',
  Especie: '',
  Raza: '',
  Sexo: 'Macho',
  Fecha_nacimiento: '',
  Peso: '',
  Foto: ''
})

// Modal vacunas
const vacPet = ref(null)
const newVac = reactive({ nombre: '', fechaProgramada: '', fechaAplicada: '', lote: '' })

// ── Constantes ──────────────────────────────────────────────
const avatarOptions = [
  '🐶', '🐱', '🦜', '🐰', '🐹', '🐢', '🐠'
]

const defaultVacunaServicioId = 2

const detailFields = {
  Especie: 'Especie',
  Sexo: 'Sexo',
  Peso: 'Peso',
  Raza: 'Raza',
  Fecha_nacimiento: 'Fecha de Nacimiento'
}

// ── Funciones de carga ──────────────────────────────────────
async function cargarCliente() {
  if (!usuarioLogueado.value) {
    errorMessage.value = 'Por favor inicia sesión para ver tus mascotas.'
    return
  }

  try {
    const clientes = await clientesAPI.obtenerPorUsuario(usuarioLogueado.value.ID_usuario)
    clienteActual.value = Array.isArray(clientes) ? clientes[0] : clientes

    if (!clienteActual.value) {
      // Crear la fila de cliente si no existe
      clienteActual.value = await clientesAPI.crear({
        Direccion: '',
        ID_usuario: usuarioLogueado.value.ID_usuario
      })
    }
  } catch (error) {
    console.error('Error al cargar cliente:', error)
    errorMessage.value = 'No se pudo identificar al cliente.'
  }
}

async function cargarMascotas() {
  if (!clienteActual.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    pets.value = await mascotasAPI.obtenerPorCliente(clienteActual.value.ID_cliente)
  } catch (error) {
    errorMessage.value = 'Error al cargar mascotas: ' + error.message
    console.error('Error al cargar mascotas:', error)
  } finally {
    isLoading.value = false
  }
}

// ── CRUD mascotas ────────────────────────────────────────────
function openAddForm() {
  isEditing.value = false
  editingId.value = null
  Object.assign(formData, {
    Nombre: '',
    Especie: '',
    Raza: '',
    Sexo: 'Macho',
    Fecha_nacimiento: '',
    Peso: '',
    Foto: ''
  })
  showForm.value = true
}

function openEditForm(pet) {
  isEditing.value = true
  editingId.value = pet.ID_mascota
  Object.assign(formData, { ...pet })
  showForm.value = true
}

async function savePet() {
  if (!formData.Nombre.trim()) {
    alert('Nombre es requerido')
    return
  }

  if (!clienteActual.value) {
    await cargarCliente()
    if (!clienteActual.value) {
      alert('No se pudo identificar al cliente')
      return
    }
  }

  try {
    const datosMascota = {
      ID_cliente: clienteActual.value.ID_cliente,
      ...formData
    }

    if (isEditing.value) {
      await mascotasAPI.actualizar(editingId.value, formData)
    } else {
      await mascotasAPI.crear(datosMascota)
    }

    showForm.value = false
    await cargarMascotas() // Recargar la lista
  } catch (error) {
    alert('Error al guardar mascota: ' + error.message)
    console.error('Error al guardar mascota:', error)
  }
}

async function deletePet(id) {
  if (!confirm('¿Eliminar esta mascota?')) return

  try {
    await mascotasAPI.eliminar(id)
    await cargarMascotas() // Recargar la lista
  } catch (error) {
    alert('Error al eliminar mascota: ' + error.message)
    console.error('Error al eliminar mascota:', error)
  }
}

// ── Detalle / navegación ─────────────────────────────────────
function openDetail(pet) {
  detailPet.value = { ...pet }
}

function goToCita(id) {
  router.push({ path: '/citas', query: { mascota: id } })
}

// ── Vacunas ──────────────────────────────────────────────────
async function openVaccineEditor(pet) {
  const mascotaId = pet.ID_mascota || pet.id || pet.id_mascota || pet.ID
  vacPet.value = reactive({ ...pet, ID_mascota: mascotaId, vacunas: [] })
  Object.assign(newVac, { nombre:'', fechaProgramada:'', fechaAplicada:'', lote:'' })

  try {
    if (!mascotaId) throw new Error('ID de mascota no disponible')
    const vacunas = await vacunasAPI.obtenerPorMascota(mascotaId)
    vacPet.value.vacunas = vacunas.map(v => ({
      id: v.ID_carnetVacunas,
      nombre: v.Nombre_vacuna,
      fechaProgramada: v.Proxima_dosis,
      fechaAplicada: v.Fecha_aplicacion,
      lote: v.Lote,
      observaciones: v.Observaciones || '',
      estado: v.Estado || (v.Fecha_aplicacion ? 'aplicada' : 'proxima')
    }))
  } catch (error) {
    console.error('Error al cargar vacunas:', error, { pet })
    vacPet.value.vacunas = []
  }
}

function calcEstado(v) {
  if (v.fechaAplicada) return 'aplicada'
  if (v.fechaProgramada && new Date(v.fechaProgramada) < new Date()) return 'atrasada'
  return 'proxima'
}

function recalcEstado(v) {
  v.estado = calcEstado(v)
}

async function saveVac(idx) {
  const v = vacPet.value.vacunas[idx]
  recalcEstado(v)
  const mascotaId = vacPet.value.ID_mascota || vacPet.value.id || vacPet.value.id_mascota || vacPet.value.ID

  const payload = {
    ID_mascota: mascotaId,
    ID_servicio: v.ID_servicio || defaultVacunaServicioId,
    Nombre_vacuna: v.nombre,
    Lote: v.lote || '',
    Fecha_aplicacion: v.fechaAplicada || null,
    Proxima_dosis: v.fechaProgramada || null,
    Estado: v.estado || 'proxima',
    Observaciones: v.observaciones || ''
  }

  try {
    if (!mascotaId) throw new Error('ID de mascota no disponible para guardar vacuna')

    if (v.id) {
      await vacunasAPI.actualizar(v.id, payload)
    } else {
      const created = await vacunasAPI.crear(payload)
      v.id = created.ID_carnetVacunas
    }
    const petName = vacPet.value.nombre || vacPet.value.Nombre || 'Mascota'
    notificacionesAPI.crear({
      ID_usuario: usuarioLogueado.value.ID_usuario,
      Mensaje: `Vacuna "${v.nombre}" actualizada para ${petName}`,
      Tipo: 'vacuna',
      Canal: 'App'
    }).catch(e => console.error('Error notif:', e))
    alert('Vacuna guardada en el carnet correctamente.')
  } catch (error) {
    console.error('Error al guardar vacuna:', error, { payload, vacPet: vacPet.value })
    alert('No se pudo guardar la vacuna en el carnet. ' + (error.message || ''))
  }
}

function toggleVac(idx) {
  const v = vacPet.value.vacunas[idx]
  if (v.estado === 'aplicada') {
    v.estado = 'proxima'
  } else {
    v.estado = 'aplicada'
    if (!v.fechaAplicada) v.fechaAplicada = new Date().toISOString().slice(0, 10)
  }
}

async function deleteVac(idx) {
  const v = vacPet.value.vacunas[idx]
  if (!confirm('¿Eliminar vacuna?')) return

  try {
    if (v.id) {
      await vacunasAPI.eliminar(v.id)
    }
    vacPet.value.vacunas.splice(idx, 1)
  } catch (error) {
    console.error('Error al eliminar vacuna:', error)
    alert('No se pudo eliminar la vacuna del carnet.')
  }
}

async function addVac() {
  if (!newVac.nombre.trim()) {
    alert('Nombre de vacuna requerido')
    return
  }
  if (!vacPet.value.vacunas) vacPet.value.vacunas = []
  const mascotaId = vacPet.value.ID_mascota || vacPet.value.id || vacPet.value.id_mascota || vacPet.value.ID
  if (!mascotaId) {
    alert('No se pudo identificar la mascota para el carnet.')
    return
  }

  const nuevaVacuna = {
    nombre: newVac.nombre,
    fechaProgramada: newVac.fechaProgramada,
    fechaAplicada: newVac.fechaAplicada,
    lote: newVac.lote,
    observaciones: '',
    estado: calcEstado(newVac)
  }

  try {
    const payload = {
      ID_mascota: mascotaId,
      ID_servicio: defaultVacunaServicioId,
      Nombre_vacuna: nuevaVacuna.nombre,
      Lote: nuevaVacuna.lote,
      Fecha_aplicacion: nuevaVacuna.fechaAplicada || null,
      Proxima_dosis: nuevaVacuna.fechaProgramada || null,
      Estado: nuevaVacuna.estado,
      Observaciones: nuevaVacuna.observaciones
    }

    const created = await vacunasAPI.crear(payload)
    nuevaVacuna.id = created.ID_carnetVacunas
    vacPet.value.vacunas.push(nuevaVacuna)
    const petName = vacPet.value.nombre || vacPet.value.Nombre || 'Mascota'
    notificacionesAPI.crear({
      ID_usuario: usuarioLogueado.value.ID_usuario,
      Mensaje: `Nueva vacuna "${nuevaVacuna.nombre}" agregada para ${petName}`,
      Tipo: 'vacuna',
      Canal: 'App'
    }).catch(e => console.error('Error notif:', e))
    Object.assign(newVac, { nombre:'', fechaProgramada:'', fechaAplicada:'', lote:'' })
  } catch (error) {
    console.error('Error al crear vacuna:', error, { payload: { mascotaId, ...newVac } })
    alert('No se pudo agregar la vacuna al carnet. ' + (error.message || ''))
  }
}

// ── Imprimir / PDF ───────────────────────────────────────────
function printDetail() {
  if (!detailPet.value) return
  const w = window.open('', '_blank')
  if (!w) { alert('El navegador bloqueó la ventana de impresión.'); return }
  const pet = detailPet.value
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${pet.Nombre}</title></head><body>
    <h1>${pet.Nombre}</h1>
    <p>Especie: ${pet.Especie}</p><p>Raza: ${pet.Raza}</p><p>Sexo: ${pet.Sexo}</p>
    <p>Peso: ${pet.Peso}</p><p>Fecha de nacimiento: ${pet.Fecha_nacimiento}</p>
  </body></html>`)
  w.document.close()
  setTimeout(() => w.print(), 300)
}

async function downloadPdf(pet) {
  try {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    let y = 40
    doc.setFontSize(18); doc.text(pet.Nombre || 'Mascota', 40, y); y += 28
    doc.setFontSize(12)
    doc.text('Especie: '        + (pet.Especie    || ''), 40, y); y += 18
    doc.text('Raza: '           + (pet.Raza       || ''), 40, y); y += 18
    doc.text('Sexo: '           + (pet.Sexo       || ''), 40, y); y += 18
    doc.text('Peso: '           + (pet.Peso       || ''), 40, y); y += 18
    doc.text('Fecha nacimiento: ' + (pet.Fecha_nacimiento || ''), 40, y)
    doc.save((pet.Nombre || 'mascota') + '.pdf')
  } catch (err) {
    console.error(err)
    alert('No se pudo generar el PDF. Usa Imprimir para guardar como PDF.')
  }
}

// ── Inicialización ───────────────────────────────────────────
onMounted(async () => {
  await cargarCliente()
  await cargarMascotas()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-box {
  max-width: 95%;
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}
.mascota-top {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: .5rem;
}
.mascota-actions {
  margin-left: auto;
  display: flex;
  gap: .25rem;
}
.mascota-datos {
  display: flex;
  flex-direction: column;
  gap: .25rem;
  font-size: .875rem;
  margin-bottom: .5rem;
}
.mascota-btns {
  display: flex;
  gap: .5rem;
  margin-top: .75rem;
}
table th, table td {
  padding: .3rem .4rem;
  vertical-align: middle;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.error {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
}

.mascotas-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
  gap:1rem;
  margin-bottom: 1.2rem;
}

.mascota-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.06);
  transition: transform .2s ease, box-shadow .2s ease;
}

.mascota-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.15);
}

.mascota-top {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: .8rem;
}

.mascota-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #fef3c7;
}

.mascota-info {
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.mascota-nombre {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.mascota-tipo {
  color: #64748b;
  font-size: .85rem;
}

.mascota-actions {
  margin-left: auto;
  display: flex;
  gap: .25rem;
}

.btn-icon {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.microchip-tag {
  margin: .6rem 0;
  color: #334155;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: .4rem .6rem;
  border-radius: 8px;
  font-size: .85rem;
}

.mascota-btns {
  display: flex;
  gap: .5rem;
  margin-top: .75rem;
}

#btn-agregar-mascota {
  margin-top: 1rem;
  width: 250px;
}

.modal-box {
  max-width: 95%;
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.25);
}

.form-control {
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: .55rem .7rem;
  background: white;
  color: #0f172a;
  width: 100%;
}

.form-control:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, .15);
}

/* ── Modal Vacunas ── */
.modal-vacunas {
  width: 840px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem 1.8rem;
}

.vac-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.vac-header-left {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.vac-icon {
  font-size: 1.6rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border-radius: 12px;
}

.vac-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.vac-subtitle {
  margin: .15rem 0 0;
  font-size: .82rem;
  color: #64748b;
}

.vac-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #f8fafc;
  border-radius: 12px;
  margin: 1rem 0;
}

.vac-empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: .5rem;
}

.vac-empty p {
  margin: .3rem 0;
  color: #64748b;
}

.vac-table-wrap {
  overflow-x: auto;
  margin: 0 -.3rem;
}

.vac-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .82rem;
}

.vac-table th {
  text-align: left;
  padding: .6rem .5rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.vac-table td {
  padding: .5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.vac-table tbody tr:hover {
  background: #f8fafc;
}

.form-control--vac {
  padding: .4rem .5rem;
  font-size: .82rem;
  min-width: 80px;
  max-width: 130px;
}

.vac-badge {
  display: inline-block;
  padding: .25rem .6rem;
  border-radius: 20px;
  font-size: .72rem;
  font-weight: 600;
  white-space: nowrap;
}

.vac-badge--aplicada {
  background: #dcfce7;
  color: #166534;
}

.vac-badge--pendiente {
  background: #fef9c3;
  color: #854d0e;
}

.vac-badge--atrasada {
  background: #fee2e2;
  color: #991b1b;
}

.vac-actions {
  display: flex;
  gap: .3rem;
  white-space: nowrap;
}

.vac-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: .82rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s ease;
  background: #f1f5f9;
  color: #334155;
}

.vac-btn:hover {
  transform: scale(1.1);
}

.vac-btn--save:hover { background: #dbeafe; color: #1d4ed8; }
.vac-btn--check:hover { background: #dcfce7; color: #15803d; }
.vac-btn--undo:hover { background: #fef9c3; color: #a16207; }
.vac-btn--delete:hover { background: #fee2e2; color: #dc2626; }

.vac-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1.25rem 0;
}

.vac-add {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.vac-add-title {
  font-weight: 700;
  font-size: .9rem;
  margin-bottom: .75rem;
  color: #0f172a;
}

.vac-add-form {
  display: flex;
  gap: .6rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.vac-add-field {
  display: flex;
  flex-direction: column;
  gap: .25rem;
}

.vac-add-field label {
  font-size: .72rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: .03em;
}

.vac-add-field .form-control,
.vac-add-form > .form-control {
  width: auto;
  min-width: 130px;
}

.vac-add-btn {
  padding: .55rem 1.2rem;
  white-space: nowrap;
}

</style>