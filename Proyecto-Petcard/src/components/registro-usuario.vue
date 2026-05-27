<script setup>
import { useRouter } from 'vue-router'
import { ref, reactive } from 'vue'
import { usuariosAPI, clientesAPI } from '../api.js'

const router = useRouter()

const formData = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirm: '',
  terminos: false
})

const errors = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  contrasena: '',
  confirm: '',
  terminos: ''
})

const successMessage = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

const clearErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  successMessage.value = ''
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const validatePhone = (phone) => {
  return /^\d{7,15}$/.test(phone.replace(/\s/g, ''))
}

const handleRegistro = async () => {
  console.log('📝 handleRegistro llamado')
  clearErrors()
  let valid = true

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
    valid = false
  }
  if (!formData.correo.trim() || !validateEmail(formData.correo)) {
    errors.correo = 'Ingresa un correo válido.'
    valid = false
  }
  if (!formData.telefono.trim() || !validatePhone(formData.telefono)) {
    errors.telefono = 'Ingresa un teléfono válido (solo números).'
    valid = false
  }
  if (!formData.contrasena || formData.contrasena.length < 6) {
    errors.contrasena = 'La contraseña debe tener al menos 6 caracteres.'
    valid = false
  }
  if (formData.contrasena !== formData.confirm) {
    errors.confirm = 'Las contraseñas no coinciden.'
    valid = false
  }
  if (!formData.terminos) {
    errors.terminos = 'Debes aceptar los términos y condiciones.'
    valid = false
  }

  if (!valid) {
    console.log('❌ Validación fallida')
    return
  }

  isLoading.value = true
  console.log('⏳ Iniciando registro...')

  try {
    console.log('🔗 Creando usuario via API')
    const data = await usuariosAPI.crear({
      Nombre: formData.nombre.trim(),
      Correo: formData.correo.trim(),
      Telefono: formData.telefono.trim(),
      Contrasena: formData.contrasena,
      Rol: 'cliente'
    })

    if (data.ID_usuario) {
      try {
        await clientesAPI.crear({ Direccion: '', ID_usuario: data.ID_usuario })
      } catch (clienteError) {
        console.warn('No se pudo crear el cliente automáticamente:', clienteError)
      }

      successMessage.value = '¡Cuenta creada exitosamente! Redirigiendo...'
      localStorage.setItem('petcard_usuario_actual', JSON.stringify(data))
      console.log('✅ Registro exitoso')

      setTimeout(() => {
        router.push('/inicio')
      }, 1800)
    } else {
      errors.correo = data.error || 'Error al crear la cuenta, intenta de nuevo.'
      console.log('❌ Error:', data.error)
    }
  } catch (error) {
    errors.correo = error.message || 'Error al conectar con el servidor'
    console.error('🔴 Error:', error)
  } finally {
    isLoading.value = false
  }
}

const irAlLogin = () => {
  router.push('/login-usuario')
}

const irAlInicio = () => {
  router.push('/inicio')
}

const irALoginAdmin = () => {
  router.push('/login-admin')
}
</script>

<template>
<nav class="navbar">
  <a href="javascript:void(0)" @click="irAlInicio" class="nav-logo">PETCARD</a>
</nav>

<main class="registro-wrapper">
  <div class="registro-box">
    <h1>Crear Cuenta</h1>
    <p class="subtitle">Completa tus datos para registrarte</p>

    <div class="success-banner" v-if="successMessage">{{ successMessage }}</div>

    <div class="form-group input-wrapper">
      <input type="text" v-model="formData.nombre" placeholder="Nombre completo *" />
      <button class="input-icon" aria-label="Usuario">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
      <div class="error" v-if="errors.nombre">{{ errors.nombre }}</div>
    </div>

    <div class="form-group input-wrapper">
      <input type="email" v-model="formData.correo" placeholder="Correo electrónico *" />
      <button class="input-icon" aria-label="Correo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </button>
      <div class="error" v-if="errors.correo">{{ errors.correo }}</div>
    </div>

    <div class="form-group input-wrapper">
      <input type="tel" v-model="formData.telefono" placeholder="Teléfono *" />
      <button class="input-icon" aria-label="Teléfono">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </button>
      <div class="error" v-if="errors.telefono">{{ errors.telefono }}</div>
    </div>

    <div class="form-group input-wrapper">
      <input :type="showPassword ? 'text' : 'password'" v-model="formData.contrasena" placeholder="Contraseña *" />
      <button class="input-icon" @click="showPassword = !showPassword" aria-label="Mostrar contraseña">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <div class="error" v-if="errors.contrasena">{{ errors.contrasena }}</div>
    </div>

    <div class="form-group input-wrapper">
      <input :type="showConfirm ? 'text' : 'password'" v-model="formData.confirm" placeholder="Confirmar contraseña *" />
      <button class="input-icon" @click="showConfirm = !showConfirm" aria-label="Mostrar contraseña">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
      <div class="error" v-if="errors.confirm">{{ errors.confirm }}</div>
    </div>

    <div class="checkbox-group">
      <label class="checkbox-label">
        <input type="checkbox" v-model="formData.terminos">
        Acepto términos y condiciones
      </label>
      <div class="error" v-if="errors.terminos">{{ errors.terminos }}</div>
    </div>

    <button class="btn-ingresar" @click="handleRegistro" :disabled="isLoading">
      {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
    </button>

    <p class="auth-footer">
      ¿Ya tienes cuenta? <a href="javascript:void(0)" @click="irAlLogin">Iniciar sesión</a>
    </p>

    <p style="margin-top: 1rem; text-align: center; font-size: 0.9rem;">
      <a href="javascript:void(0)" @click="irALoginAdmin" style="color: #764ba2; font-weight: 600; text-decoration: none;">👨‍💼 Acceso de Administrador</a>
    </p>
  </div>
</main>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.nav-logo:hover {
  opacity: 0.8;
}

.registro-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.registro-box {
  width: 100%;
  max-width: 420px;
}

h1 {
  font-size: 2.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 16px;
  position: relative;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 16px 48px 16px 18px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif;
  color: #333;
  background: #fafafa;
  outline: none;
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #667eea;
  display: flex;
  align-items: center;
  padding: 4px;
}

.input-icon:hover { color: #764ba2; }

.checkbox-group {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  gap: 0.5rem;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
  accent-color: #667eea;
}

.error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.success-banner {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border-left: 4px solid #155724;
}

.btn-ingresar {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.25s, transform 0.1s;
  letter-spacing: 0.02em;
}

.btn-ingresar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-ingresar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: #555;
}

.auth-footer a {
  color: #667eea;
  font-weight: 700;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

::placeholder { color: #aaa; }

@media (max-width: 768px) {
  .registro-wrapper { padding: 30px 16px; }
}
</style>