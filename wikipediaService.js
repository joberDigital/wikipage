// wikipediaService.js
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

// Ubicaciones de archivos (pueden ser inyectadas o definidas aquí)
const DATA_FILE_PATH = path.join(__dirname, 'data.json');
const ALOJAMIENTO_FILE = path.join(__dirname, 'alojamiento.json');
const INDICE_FILE = path.join(__dirname, 'indice.json');
const PAGES_DIR = path.join(__dirname, 'public', 'paginas');

// Función auxiliar para eliminar duplicados (se mantiene aquí)
function eliminarDuplicados(arr, key) {
    const seen = new Set();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        } else {
            seen.add(value);
            return true;
        }
    });
}

/**
 * Servicio para manejar la lógica de la integración con Wikipedia.
 */
class WikipediaService {
    /**
     * Obtiene el resumen de un artículo de Wikipedia.
     * @param {string} pageTitle - El título del artículo.
     * @returns {Promise<object>} El resumen del artículo.
     * @throws {Error} Si el artículo no se encuentra o hay un error en la API.
     */
    async getArticleSummary(pageTitle) {
        const apiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                const error = new Error('No se encontró el artículo en Wikipedia.');
                error.status = 404; // Agregamos el status al error para manejarlo en la ruta
                throw error;
            }
            throw new Error(`Error en la API de Wikipedia. Status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Crea un archivo HTML estático para el artículo.
     * @param {string} nombre - El nombre del archivo.
     * @param {string} titulo - El título del artículo.
     * @param {string} contenido - El contenido del resumen.
     * @returns {Promise<string>} La URL de la página creada.
     */
    async crearPagina(nombre, titulo, contenido) {
        const filePath = path.join(PAGES_DIR, `${nombre}.html`);
        const sanitizedTitulo = titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const sanitizedContenido = contenido.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const html = `
<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${sanitizedTitulo}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
        .container { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
        h1 { color: #333; }
        a { text-decoration: none; color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${sanitizedTitulo}</h1>
        <p>${sanitizedContenido}</p>
        <a href="/">⬅️ Volver al inicio</a>
    </div>
</body>
</html>`;

        await fs.mkdir(PAGES_DIR, { recursive: true });
        await fs.writeFile(filePath, html, 'utf8');
        return `/paginas/${nombre}.html`;
    }

    /**
     * Guarda el artículo en data.json, alojamiento.json e indice.json.
     * @param {object} articleData - Los datos del artículo.
     * @param {string} cleanPageTitle - El título del artículo sanitizado.
     * @param {string} pageUrl - La URL de la página creada.
     */
    async saveArticleData(articleData, cleanPageTitle, pageUrl) {
        // Lógica para guardar en data.json
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(articleData, null, 2), 'utf8');

        // Lógica para guardar en alojamiento.json
        const newLink = {
            title: articleData.title,
            url: `https://es.wikipedia.org/wiki/${articleData.title}`,
            summary: articleData.summary
        };
        const alojamientoData = await fs.readFile(ALOJAMIENTO_FILE, 'utf8').catch(() => '[]');
        let links = JSON.parse(alojamientoData);
        if (!Array.isArray(links)) {
            links = [];
        }
        links.push(newLink);
        const uniqueLinks = eliminarDuplicados(links, 'url');
        await fs.writeFile(ALOJAMIENTO_FILE, JSON.stringify(uniqueLinks, null, 2), 'utf8');

        // Lógica para actualizar indice.json
        let indice = {};
        try {
            const indiceData = await fs.readFile(INDICE_FILE, 'utf8');
            indice = JSON.parse(indiceData);
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.log('El archivo indice.json no existe. Creando uno nuevo.');
            } else {
                console.error('Error al leer indice.json:', e);
            }
        }
        
        indice[cleanPageTitle] = {
            title: articleData.title,
            url: pageUrl
        };
        const indiceArray = Object.keys(indice).map(key => ({ key: key, ...indice[key] }));
        const uniqueIndiceArray = eliminarDuplicados(indiceArray, 'key');
        const uniqueIndice = uniqueIndiceArray.reduce((obj, item) => {
            obj[item.key] = { title: item.title, url: item.url };
            return obj;
        }, {});
        await fs.writeFile(INDICE_FILE, JSON.stringify(uniqueIndice, null, 2), 'utf8');
    }

    /**
     * Carga todos los enlaces desde alojamiento.json.
     * @returns {Promise<Array>} Un array de enlaces.
     */
    async loadAllLinks() {
        try {
            const data = await fs.readFile(ALOJAMIENTO_FILE, 'utf8');
            const enlaces = JSON.parse(data);
            if (!Array.isArray(enlaces)) {
                return [];
            }
            return enlaces;
        } catch (err) {
            if (err.code === 'ENOENT') {
                return [];
            }
            throw new Error('Error al cargar los enlaces.');
        }
    }

    /**
     * Carga el último artículo guardado desde data.json.
     * @returns {Promise<object>} El artículo guardado.
     * @throws {Error} Si el archivo no existe o tiene un formato incorrecto.
     */
    async loadLastArticle() {
        try {
            const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                const error = new Error('El archivo de datos no existe.');
                error.status = 404;
                throw error;
            }
            throw new Error('Formato de archivo JSON incorrecto');
        }
    }
}

// Exportar una instancia del servicio para ser usada en otros módulos
module.exports = WikipediaService;

