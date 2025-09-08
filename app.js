// app.js
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "server.json");

// --- Middlewares ---
app.use(cors());                   // habilita CORS si llamas desde otro origen
app.use(express.json());           // parsea JSON de requests
app.use(express.static(path.join(__dirname, "public"))); // sirve /public

// --- Utilidades para leer/escribir server.json ---
async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      const initial = { items: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw err;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Rutas API ---
app.get("/api/saludo", (req, res) => {
  const nombre = req.query.nombre || "mundo";
  res.json({ mensaje: `¡Hola, ${nombre}!` });
});

app.get("/api/items", async (req, res) => {
  try {
    const data = await readData();
    res.json(data.items);
  } catch (e) {
    res.status(500).json({ error: "Error leyendo datos" });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name) return res.status(400).json({ error: "`name` es requerido" });

    const data = await readData();
    const newItem = { id: Date.now(), name, value: value ?? null };
    data.items.push(newItem);
    await writeData(data);

    res.status(201).json(newItem);
  } catch (e) {
    res.status(500).json({ error: "Error guardando datos" });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await readData();
    const idx = data.items.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "No encontrado" });

    const removed = data.items.splice(idx, 1)[0];
    await writeData(data);
    res.json(removed);
  } catch (e) {
    res.status(500).json({ error: "Error eliminando" });
  }
});

// --- Arrancar servidor ---
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
