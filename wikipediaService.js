// wikipediaService.js
// ... (imports) ...
const sql = neon(process.env.DATABASE_URL); // Conexión a Neon

// 1. Lógica para la API de Wikipedia
async function getArticleSummary(pageTitle) {
  // ... (código que ya tienes) ...
}

// 2. Lógica para guardar en la base de datos (con ON CONFLICT)
async function saveArticle(title, summary, pageUrl) {
  // ... (código que ya tienes) ...
}

async function saveLink(title, url, summary) {
  // ... (código que ya tienes) ...
}

async function updateIndex(key, title, url) {
  // ... (código que ya tienes) ...
}

// 3. Lógica para cargar desde la base de datos
async function loadAllLinks() {
  // ... (código que ya tienes) ...
}

async function loadLastArticle() {
  // ... (código que ya tienes) ...
}

// 4. Exportar las funciones para que server.js pueda usarlas
module.exports = {
  getArticleSummary,
  crearPagina, // Mantén esta función aquí, ya que genera un archivo local
  saveArticle,
  saveLink,
  updateIndex,
  loadAllLinks,
  loadLastArticle
};
