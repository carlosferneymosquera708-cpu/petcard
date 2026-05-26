const mysql = require("mysql2");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3002;

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
// EJEMPLO 1 — GET /api/mascotas?especie=&sexo=
// Filtrar mascotas por especie y/o sexo
// Uso: GET http://localhost:3002/api/mascotas?especie=Perro
//      GET http://localhost:3002/api/mascotas?especie=Gato&sexo=Macho
// ==========================================
app.get('/api/mascotas', (req, res) => {
    const especie = req.query.especie || null;
    const sexo = req.query.sexo || null;

    let query = "SELECT * FROM mascota";
    const params = [];
    const condiciones = [];

    if (especie) {
        condiciones.push("Especie = ?");
        params.push(especie);
    }
    if (sexo) {
        condiciones.push("Sexo = ?");
        params.push(sexo);
    }
    if (condiciones.length > 0) {
        query += " WHERE " + condiciones.join(" AND ");
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las mascotas' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 2 — GET /api/citas?fecha=&id_veterinario=
// Filtrar citas por fecha y/o veterinario
// Uso: GET http://localhost:3002/api/citas?fecha=2025-06-15
//      GET http://localhost:3002/api/citas?fecha=2025-06-15&id_veterinario=2
// ==========================================
app.get('/api/citas', (req, res) => {
    const fecha = req.query.fecha || null;
    const id_veterinario = req.query.id_veterinario ? Number(req.query.id_veterinario) : null;

    if (id_veterinario !== null && (!Number.isInteger(id_veterinario) || id_veterinario <= 0)) {
        return res.status(400).json({ error: 'El ID del veterinario debe ser un número entero positivo' });
    }

    let query = "SELECT * FROM cita";
    const params = [];
    const condiciones = [];

    if (fecha) {
        condiciones.push("Fecha = ?");
        params.push(fecha);
    }
    if (id_veterinario) {
        condiciones.push("ID_veterinario = ?");
        params.push(id_veterinario);
    }
    if (condiciones.length > 0) {
        query += " WHERE " + condiciones.join(" AND ");
    }

    query += " ORDER BY Fecha ASC, Hora ASC";

    db.query(query, params, (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las citas' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 3 — GET /api/servicios?categoria=&precio_max=
// Filtrar servicios por categoría y/o precio máximo
// Uso: GET http://localhost:3002/api/servicios?categoria=Consulta
//      GET http://localhost:3002/api/servicios?precio_max=80000
// ==========================================
app.get('/api/servicios', (req, res) => {
    const categoria = req.query.categoria || null;
    const precio_max = req.query.precio_max ? Number(req.query.precio_max) : null;

    if (precio_max !== null && (isNaN(precio_max) || precio_max < 0)) {
        return res.status(400).json({ error: 'El precio máximo debe ser un número positivo' });
    }

    let query = "SELECT * FROM servicio";
    const params = [];
    const condiciones = [];

    if (categoria) {
        condiciones.push("Categoria = ?");
        params.push(categoria);
    }
    if (precio_max !== null) {
        condiciones.push("Precio <= ?");
        params.push(precio_max);
    }
    if (condiciones.length > 0) {
        query += " WHERE " + condiciones.join(" AND ");
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener los servicios' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 4 — GET /api/vacunas?estado=&limit=
// Filtrar vacunas por estado (Vigente/Vencida) con límite de resultados
// Uso: GET http://localhost:3002/api/vacunas?estado=Vencida
//      GET http://localhost:3002/api/vacunas?estado=Vigente&limit=5
// ==========================================
app.get('/api/vacunas', (req, res) => {
    const estado = req.query.estado || null;
    const limitNumber = Number(req.query.limit) || 20;

    if (!Number.isInteger(limitNumber)) {
        return res.status(400).json({ error: 'El límite debe ser un número entero' });
    }
    if (limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({ error: 'El límite debe estar entre 1 y 100' });
    }

    let query = "SELECT * FROM carnetvacunas";
    const params = [];

    if (estado) {
        query += " WHERE Estado = ?";
        params.push(estado);
    }

    query += " LIMIT ?";
    params.push(limitNumber);

    db.query(query, params, (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las vacunas' });
        }
        return res.json(results);
    });
});

// ==========================================
// EJEMPLO 5 — GET /api/notificaciones?id_usuario=&leida=
// Filtrar notificaciones de un usuario, opcionalmente por si fueron leídas
// Uso: GET http://localhost:3002/api/notificaciones?id_usuario=1
//      GET http://localhost:3002/api/notificaciones?id_usuario=1&leida=0
// ==========================================
app.get('/api/notificaciones', (req, res) => {
    const id_usuario = req.query.id_usuario ? Number(req.query.id_usuario) : null;
    const leida = req.query.leida !== undefined ? Number(req.query.leida) : null;

    if (!id_usuario) {
        return res.status(400).json({ error: 'Debes proporcionar un id_usuario' });
    }
    if (!Number.isInteger(id_usuario) || id_usuario <= 0) {
        return res.status(400).json({ error: 'El ID del usuario debe ser un número entero positivo' });
    }
    if (leida !== null && leida !== 0 && leida !== 1) {
        return res.status(400).json({ error: 'El campo leida debe ser 0 (no leída) o 1 (leída)' });
    }

    let query = "SELECT * FROM notificacion WHERE ID_usuario = ?";
    const params = [id_usuario];

    if (leida !== null) {
        query += " AND Leida = ?";
        params.push(leida);
    }

    query += " ORDER BY Fecha DESC";

    db.query(query, params, (err, results) => {
        if (err) {
            console.log("Error en la consulta", err);
            return res.status(500).json({ error: 'Error al obtener las notificaciones' });
        }
        return res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
