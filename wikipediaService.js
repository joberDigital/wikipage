// wikipediaService.js
require('dotenv').config({ path: '.env.local.example' });
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { neon } = require('@neondatabase/serverless');

// La variable DATABASE_URL se carga automáticamente de .env.local
const sql = neon(process.env.DATABASE_URL);

// Función para obtener el resumen de un artículo de Wikipedia
async function getArticleSummary(pageTitle) {
    try {
        const response = await axios.get('https://es.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(pageTitle));
        if (response.data.type === 'disambiguation') {
            throw new Error(`La página "${pageTitle}" es una desambiguación. Por favor, sé más específico.`, { status: 404 });
        }
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`La página "${pageTitle}" no fue encontrada en Wikipedia.`, { status: 404 });
        }
        console.error('Error al obtener el resumen del artículo:', error);
        throw new Error('Error de conexión con la API de Wikipedia.');
    }
}

// Función para crear la página HTML
async function crearPagina(fileName, title, summary) {
    const pageUrl = `/paginas/${fileName}.html`;
    const filePath = path.join(__dirname, 'public', 'paginas', `${fileName}.html`);

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/estilos.css">
</head>
<body>
    <header>
        <nav>
            <a href="/" class="button">Inicio</a>
        </nav>
    </header>
    <main class="container">
        <h1>${title}</h1>
        <p>${summary}</p>
    </main>
</body>
</html>`;

    await fs.writeFile(filePath, htmlContent, 'utf-8');
    return pageUrl;
}

// --- Lógica de Base de Datos ---

// Función para guardar el artículo en la base de datos
async function saveArticle(title, summary, pageUrl) {
    try {
        await sql`
            INSERT INTO articles (title, summary, page_url)
            VALUES (${title}, ${summary}, ${pageUrl})
            ON CONFLICT (title) DO UPDATE SET
            summary = EXCLUDED.summary,
            page_url = EXCLUDED.page_url;
        `;
        console.log('Artículo guardado/actualizado en la base de datos.');
    } catch (error) {
        console.error('Error al guardar el artículo en la base de datos:', error);
        throw error;
    }
}

// Función para guardar el enlace en la base de datos
async function saveLink(title, url, summary) {
    try {
        await sql`
            INSERT INTO links (title, url, summary)
            VALUES (${title}, ${url}, ${summary})
            ON CONFLICT (url) DO NOTHING;
        `;
        console.log('Enlace guardado en la base de datos.');
    } catch (error) {
        console.error('Error al guardar el enlace en la base de datos:', error);
        throw error;
    }
}

// Función para actualizar el índice en la base de datos
async function updateIndex(key, title, url) {
    try {
        await sql`
            INSERT INTO indices (key, title, url)
            VALUES (${key}, ${title}, ${url})
            ON CONFLICT (key) DO UPDATE SET
            title = EXCLUDED.title,
            url = EXCLUDED.url;
        `;
        console.log('Índice actualizado en la base de datos.');
    } catch (error) {
        console.error('Error al actualizar el índice:', error);
        throw error;
    }
}

// Función para obtener todos los enlaces de la base de datos
async function loadAllLinks() {
    try {
        const links = await sql`SELECT title, url, summary FROM links;`;
        console.log('Enlaces cargados de la base de datos.');
        return links;
    } catch (error) {
        console.error('Error al cargar los enlaces de la base de datos:', error);
        return [];
    }
}

// Función para obtener el último artículo de la base de datos
async function loadLastArticle() {
    try {
        const result = await sql`
            SELECT title, summary FROM articles
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        console.log('Último artículo cargado de la base de datos.');
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error al cargar el artículo de la base de datos:', error);
        return null;
    }
}

module.exports = {
    getArticleSummary,
    crearPagina,
    saveArticle,
    saveLink,
    updateIndex,
    loadAllLinks,
    loadLastArticle
};
