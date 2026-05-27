<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { clientesAPI, mascotasAPI, serviciosAPI, veterinariosAPI, citasAPI, notificacionesAPI } from '../api.js'

const router = useRouter()
const { usuarioLogueado, cerrarSesion, irALogin, irARegistro, irALoginAdmin } = useAuth()

const clienteActual = ref(null)
const mascotas = ref([])
const servicios = ref([])
const veterinarios = ref([])
const citas = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const servicioVetsMap = {
  'Consulta General': [
    { id: 1, nombre: 'Dra. Laura Gomez' },
    { id: 2, nombre: 'Dr. Andres Torres' }
  ],
  'Vacuna Antirrábica': [
    { id: 3, nombre: 'Dr. Carlos Mendoza' },
    { id: 4, nombre: 'Dra. Maria Rodriguez' }
  ],
  'Cirugía Esterilización': [
    { id: 5, nombre: 'Dr. Roberto Vargas' },
    { id: 6, nombre: 'Dra. Ana Martinez' }
  ],
  'Desparasitación': [
    { id: 7, nombre: 'Dra. Sofia Herrera' },
    { id: 8, nombre: 'Dr. Diego Luna' }
  ],
  'Odontología': [
    { id: 9, nombre: 'Dr. Jorge Rios' },
    { id: 10, nombre: 'Dra. Patricia Navarro' }
  ]
}

const servicioSeleccionado = computed(() => {
  return servicios.value.find(s => s.ID_servicio === Number(form.servicio))
})

const normalize = s => s.toLowerCase().replace(/\s+/g, ' ').trim()
const veterinariosFiltrados = computed(() => {
  const nombreServicio = servicioSeleccionado.value?.Nombre
  if (nombreServicio) {
    const n = normalize(nombreServicio)
    const matchKey = Object.keys(servicioVetsMap).find(key => {
      const kn = normalize(key)
      return n.includes(kn) || kn.includes(n) ||
        n.replace(/s\b/g, '').includes(kn.replace(/s\b/g, '')) ||
        kn.replace(/s\b/g, '').includes(n.replace(/s\b/g, ''))
    })
    if (matchKey) return servicioVetsMap[matchKey]
  }
  return veterinarios.value.length ? veterinarios.value : []
})

const form = reactive({
  mascota: '',
  servicio: '',
  veterinario: '',
  fecha: '',
  hora: '',
  notas: ''
})

const horasDisponibles = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM'
]

const fechaMin = ref(new Date().toISOString().split('T')[0])

async function cargarCliente() {
  if (!usuarioLogueado.value?.ID_usuario) return
  try {
    const clientes = await clientesAPI.obtenerPorUsuario(usuarioLogueado.value.ID_usuario)
    clienteActual.value = clientes[0] || null
  } catch (error) {
    console.error('Error al cargar cliente:', error)
    errorMessage.value = 'No se pudo cargar la información del cliente.'
  }
}

async function crearClienteSiNoExiste() {
  if (!usuarioLogueado.value?.ID_usuario) return
  if (clienteActual.value) return
  try {
    const cliente = await clientesAPI.crear({ ID_usuario: usuarioLogueado.value.ID_usuario, Direccion: '' })
    clienteActual.value = cliente
  } catch (error) {
    console.error('Error creando cliente:', error)
    errorMessage.value = 'No se pudo crear el cliente en la base de datos.'
  }
}

async function cargarMascotas() {
  if (!clienteActual.value?.ID_cliente) return
  try {
    mascotas.value = await mascotasAPI.obtenerPorCliente(clienteActual.value.ID_cliente)
    if (mascotas.value.length) {
      form.mascota = mascotas.value[0].ID_mascota
    }
  } catch (error) {
    console.error('Error al cargar mascotas:', error)
    errorMessage.value = 'Error al cargar tus mascotas.'
  }
}

async function cargarServicios() {
  try {
    servicios.value = await serviciosAPI.obtener()
  } catch (error) {
    console.error('Error al cargar servicios:', error)
    errorMessage.value = 'Error al cargar los servicios.'
  }
}

async function cargarVeterinarios() {
  try {
    veterinarios.value = await veterinariosAPI.obtener()
  } catch (error) {
    console.error('Error al cargar veterinarios:', error)
  }
}

async function cargarCitas() {
  if (!clienteActual.value?.ID_cliente) return
  try {
    const todas = await citasAPI.obtener()
    citas.value = todas.filter(cita => cita.ID_cliente === clienteActual.value.ID_cliente)
  } catch (error) {
    console.error('Error al cargar citas:', error)
  }
}

function resetForm() {
  form.mascota = mascotas.value[0]?.ID_mascota || ''
  form.servicio = servicios.value[0]?.ID_servicio || ''
  form.veterinario = veterinariosFiltrados.value[0]?.id || ''
  form.fecha = ''
  form.hora = ''
  form.notas = ''
}

function validateForm() {
  if (!clienteActual.value) {
    errorMessage.value = 'No se encontró información de cliente.'
    return false
  }
  if (!form.mascota || !form.servicio || !form.veterinario || !form.fecha || !form.hora) {
    errorMessage.value = 'Completa todos los campos obligatorios.'
    return false
  }
  return true
}

async function agendarCita() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) return

  isLoading.value = true

  try {
    function convertirHora12a24(hora12) {
      const [hora, min, ampm] = hora12.match(/(\d+):(\d+)\s*(AM|PM)/i).slice(1)
      let h = Number(hora)
      if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
      return String(h).padStart(2, '0') + ':' + min + ':00'
    }
    const nuevaCita = {
      ID_cliente: clienteActual.value.ID_cliente,
      ID_mascota: Number(form.mascota),
      ID_servicio: Number(form.servicio),
      ID_veterinario: Number(form.veterinario),
      Fecha: form.fecha,
      Hora: convertirHora12a24(form.hora),
      Motivo: servicioSeleccionado.value?.Nombre || 'Cita veterinaria',
      Observaciones: form.notas || ''
    }

    await citasAPI.crear(nuevaCita)
    const nomMascota = mascotas.value.find(m => m.ID_mascota === Number(form.mascota))?.Nombre || 'Mascota'
    const nomServicio = servicioSeleccionado.value?.Nombre || 'Cita'
    const fechaForm = form.fecha.split('-').reverse().join('/')
    notificacionesAPI.crear({
      ID_usuario: usuarioLogueado.value.ID_usuario,
      Mensaje: `${nomServicio} agendada para ${nomMascota} el ${fechaForm} a las ${form.hora}`,
      Tipo: 'cita',
      Canal: 'App'
    }).catch(e => console.error('Error notif:', e))
    successMessage.value = 'Cita registrada con éxito en la base de datos.'
    await cargarCitas()
    resetForm()
    setTimeout(() => { successMessage.value = '' }, 5000)
  } catch (error) {
    console.error('Error al agendar cita:', error)
    errorMessage.value = error.message || 'Error al registrar la cita.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!usuarioLogueado.value) {
    router.push('/login-usuario')
    return
  }

  await cargarCliente()
  if (!clienteActual.value) {
    await crearClienteSiNoExiste()
  }
  await cargarMascotas()
  await cargarServicios()
  await cargarVeterinarios()
  await cargarCitas()
  resetForm()
})
</script>

<template>
  <nav class="navbar">
    <router-link to="/citas" class="nav-logo">PETCARD</router-link>
    <ul class="nav-links">
      <li><router-link to="/inicio">Inicio</router-link></li>
      <li><router-link to="/servicios">Servicios</router-link></li>
      <li><router-link to="/citas" class="active">Citas</router-link></li>
      <li><router-link to="/alimentacion">Alimentación</router-link></li>
      <li><router-link to="/carnet">Carnet</router-link></li>
      <li><router-link to="/perfil">Mi Perfil</router-link></li>
      <li><router-link to="/notificaciones">Notificaciones</router-link></li>
      <li><router-link to="/mis-mascotas">Mis Mascotas</router-link></li>
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
      <button class="btn-auth btn-admin" @click="irALoginAdmin" title="Acceso para administradores">👨‍💼 Admin</button>
    </div>
  </nav>

  <div class="hero"><h1>Agendamiento de Citas</h1><p>Programa tu atención veterinaria que tu mascota necesita</p></div>

  <div class="page-wrapper" style="margin-top:2rem;">
    <div class="two-col">
      <div class="card">
        <div class="card-title" style="color:var(--purple);">Agendar Nueva Cita</div>

        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <div class="form-row">
          <div class="form-group">
            <label>Seleccionar Mascota <span class="req">*</span></label>
            <select class="form-control" v-model="form.mascota">
              <option value="" disabled>Selecciona mascota</option>
              <option v-for="mascota in mascotas" :key="mascota.ID_mascota" :value="mascota.ID_mascota">{{ mascota.Nombre }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Servicio <span class="req">*</span></label>
            <select class="form-control" v-model="form.servicio">
              <option value="" disabled>Seleccionar servicio</option>
              <option v-for="servicio in servicios" :key="servicio.ID_servicio" :value="servicio.ID_servicio">{{ servicio.Nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Fecha <span class="req">*</span></label>
            <input type="date" class="form-control" v-model="form.fecha" :min="fechaMin" />
          </div>
          <div class="form-group">
            <label>Hora <span class="req">*</span></label>
            <select class="form-control" v-model="form.hora">
              <option value="" disabled>Seleccionar hora</option>
              <option v-for="hora in horasDisponibles" :key="hora" :value="hora">{{ hora }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Veterinario <span class="req">*</span></label>
            <select class="form-control" v-model="form.veterinario">
              <option value="" disabled>Seleccionar veterinario</option>
              <option v-for="vet in veterinariosFiltrados" :key="vet.id" :value="vet.id">{{ vet.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Notas adicionales</label>
          <textarea class="form-control" v-model="form.notas" placeholder="Describe los síntomas o información relevante para el veterinario..."></textarea>
        </div>

        <div style="display:flex; gap:1rem; margin-top:1rem;">
          <button class="btn btn-primary btn-full" @click="agendarCita" :disabled="isLoading">{{ isLoading ? 'Guardando...' : 'Agendar Cita' }}</button>
          <router-link to="/perfil" class="btn btn-outline-primary" style="display:inline-block;text-align:center;text-decoration:none;">Ver Perfil</router-link>
        </div>
      </div>

      <div class="sidebar">
        <div class="card">
          <div class="card-title" style="color:var(--orange);">Próximas Citas</div>
          <div v-if="citas.length === 0" style="padding:.75rem 0; color: var(--muted);">No hay citas registradas aún.</div>
          <div v-for="cita in citas.slice(0, 3)" :key="cita.ID_cita" style="padding:.65rem 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:.2rem;"><span style="font-weight:700; font-size:.9rem;">{{ cita.Nombre_servicio }}</span><span class="badge badge-yellow">Pendiente</span></div>
            <div style="font-size:.8rem; color:var(--muted);">{{ cita.Fecha }} · {{ cita.Hora }}</div>
            <div style="font-size:.8rem; color:var(--muted);">Mascota: <strong>{{ cita.Nombre_mascota }}</strong></div>
          </div>
          <a href="#" class="ver-todas">Ver todas las Citas</a>
        </div>

        <div class="card">
          <div class="card-title" style="color:var(--green);">Contacto</div>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:.5rem;">
            <li style="font-size:.83rem; color:var(--muted);">+1 234 567 8901</li>
            <li style="font-size:.83rem; color:var(--muted);">info@petcard.com</li>
            <li style="font-size:.83rem; color:var(--muted);">Lun – Vie: 8:00 AM – 6:00 PM</li>
          </ul>
          <p style="color:var(--red); font-weight:700; font-size:.83rem; margin-top:.5rem;">🔴 Emergencias 24/7</p>
        </div>

        <div class="card">
          <div class="card-title" style="color:var(--purple);">Servicios Populares</div>
          <div class="servicio-pop"><div><div class="sp-nombre">Consulta General</div><div class="sp-dur">30 min</div></div><strong>$50</strong></div>
          <div class="servicio-pop"><div><div class="sp-nombre">Vacunación</div><div class="sp-dur">15 min</div></div><strong>$35</strong></div>
          <div class="servicio-pop"><div><div class="sp-nombre">Cirugía</div><div class="sp-dur">2-4 horas</div></div><strong>$200+</strong></div>
          <div class="servicio-pop"><div><div class="sp-nombre">Emergencia</div><div class="sp-dur">Variable</div></div><strong>$100+</strong></div>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer" style="margin-top:2rem;">
    <div class="footer-grid"><div class="footer-brand"><span class="nav-logo" style="color:#fff;display:flex;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C17.5 22.15 21 17.25 21 12V6l-9-4z" fill="white" opacity=".2"/></svg>PetCard</span><p>Comprometidos con brindar toda la atención profesional que tu mascota.</p></div><div class="footer-col"><h4>Servicios</h4><ul><li><a href="#">Consulta Generales</a></li><li><a href="#">Vacunación</a></li><li><a href="#">Cirugías</a></li><li><a href="#">Emergencias</a></li></ul></div><div class="footer-col"><h4>Contacto</h4><p>+1 234 567 8901</p><p>info@petcard.com</p><p>Calle Principal 123, Ciudad</p></div><div class="footer-col"><h4>Horarios</h4><p>Lunes - Viernes: 8:00 AM - 7:00 PM</p><p>Sábados: 9:00 AM - 6:00 PM</p><p>Domingos: 10:00 AM - 4:00 PM</p><p class="footer-emergency">Emergencias 24/7</p></div></div>
    <div class="footer-bottom">© 2024 PetCard. Todos los derechos reservados.</div>
  </footer>
</template>

<style>
</style>
