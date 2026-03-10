// src/pages/Inicio.jsx
import { useNavigate } from 'react-router-dom'
import '../styles/inicio.css'

export default function Inicio() {
  const navigate = useNavigate()

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-inicio">
        <div className="hero-content">
          <h1>Cuidado Veterinario de Excelencia</h1>
          <p>Gestiona citas, historial médico y toda la información de tus mascotas en un solo lugar.</p>

          <div className="hero-btns">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/citas')}
            >
              Agendar cita
            </button>
            <button
              className="btn btn-outline-white btn-lg"
              onClick={() => navigate('/servicios')}
            >
              Ver servicios
            </button>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <h2 className="section-title">Servicios para tu Mascota</h2>
          <div className="cards-grid-3">

            <div className="feature-card card">
              <div className="feature-icon blue">📅</div>
              <h3>Agendar Citas</h3>
              <p>Programa citas veterinarias fácilmente.</p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon green">❤️</div>
              <h3>Servicios Veterinarios</h3>
              <p>Consultas, vacunas y tratamientos completos.</p>
            </div>

            <div className="feature-card card">
              <div className="feature-icon purple">🐾</div>
              <h3>Gestión de Mascotas</h3>
              <p>Administra perfiles e historial médico.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>¿Tu mascota necesita atención?</h2>
        <p>Agenda una cita y dale el mejor cuidado.</p>
      </section>
    </>
  )
}
