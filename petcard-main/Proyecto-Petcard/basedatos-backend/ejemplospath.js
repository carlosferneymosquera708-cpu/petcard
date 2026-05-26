const mysql = require("mysql2");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petcard'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos PetCard');
});

// ==========================================
// EJEMPLO 1 — GET /api/usuarios/:id
// Buscar un usuario específico por su ID
// Uso: GET http://localhost:3001/api/usuarios/5
// ==========================================
app.get('/api/usuarios/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El ID del usuario debe ser un número entero positivo' });
    }
    db.query('SELECT ID_usuario, Nombre, Correo, Telefono, Rol FROM usuario WHERE ID_usuario = ?', [id], (err, result) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(result[0]);
    });
});

// ==========================================
// EJEMPLO 2 — GET /api/mascotas/cliente/:id_cliente
// Obtener todas las mascotas de un cliente específico
// Uso: GET http://localhost:3001/api/mascotas/cliente/3
// ==========================================
app.get('/api/mascotas/cliente/:id_cliente', (req, res) => {
    const id_cliente = Number(req.params.id_cliente);
    if (!Number.isInteger(id_cliente) || id_cliente <= 0) {
        return res.status(400).json({ error: 'El ID del cliente debe ser un número entero positivo' });
    }
    db.query('SELECT * FROM mascota WHERE ID_cliente = ?', [id_cliente], (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las mascotas del cliente' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron mascotas para este cliente' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 3 — GET /api/vacunas/mascota/:id_mascota
// Obtener el carnet de vacunas de una mascota específica
// Uso: GET http://localhost:3001/api/vacunas/mascota/7
// ==========================================
app.get('/api/vacunas/mascota/:id_mascota', (req, res) => {
    const id_mascota = Number(req.params.id_mascota);
    if (!Number.isInteger(id_mascota) || id_mascota <= 0) {
        return res.status(400).json({ error: 'El ID de la mascota debe ser un número entero positivo' });
    }
    db.query('SELECT * FROM carnetvacunas WHERE ID_mascota = ?', [id_mascota], (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las vacunas de la mascota' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron vacunas para esta mascota' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 4 — DELETE /api/citas/:id
// Eliminar una cita específica por su ID
// Uso: DELETE http://localhost:3001/api/citas/12
// ==========================================
app.delete('/api/citas/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El ID de la cita debe ser un número entero positivo' });
    }
    db.query('DELETE FROM cita WHERE ID_cita = ?', [id], (err, result) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al eliminar la cita' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        return res.json({ message: 'Cita eliminada correctamente' });
    });
});

// ==========================================
// EJEMPLO 5 — GET /api/alimentacion/mascota/:id_mascota
// Obtener el plan de alimentación de una mascota específica
// Uso: GET http://localhost:3001/api/alimentacion/mascota/4
// ==========================================
app.get('/api/alimentacion/mascota/:id_mascota', (req, res) => {
    const id_mascota = Number(req.params.id_mascota);
    if (!Number.isInteger(id_mascota) || id_mascota <= 0) {
        return res.status(400).json({ error: 'El ID de la mascota debe ser un número entero positivo' });
    }
    db.query('SELECT * FROM planalimentacion WHERE ID_mascota = ?', [id_mascota], (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener el plan de alimentación' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontró plan de alimentación para esta mascota' });
        }
        return res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
