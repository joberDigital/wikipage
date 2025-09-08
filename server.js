const express = require('express');
const path = require('path');
const wikipediaService = require('./wikipediaService'); // Importar el servicio

const app = express();
const PORT = process.env.PORT || 3000;

// Log para indicar que la aplicación está iniciando
console.log('Iniciando el servidor...');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE_PATH = path.join(__dirname, 'data.json');
const ALOJAMIENTO_FILE = path.join(__dirname, 'alojamiento.json');
const INDICE_FILE = path.join(__dirname, 'indice.json');
const PAGES_DIR = path.join(__dirname, 'public', 'paginas');

// Función para crear el archivo HTML de la página dinámica
async function crearPagina(nombre, titulo, contenido) {
    const filePath = path.join(PAGES_DIR, `${nombre}.html`);
    const sanitizedTitulo = titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedContenido = contenido.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Log para el intento de crear la página
    console.log(`Intentando crear página HTML en: ${filePath}`);

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
    
    // Log de confirmación de página creada
    console.log(`Página HTML creada exitosamente: ${filePath}`);
    return `/paginas/${nombre}.html`;
}

// Función auxiliar para eliminar duplicados de un array de objetos
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

// Ruta POST para crear la página dinámica y guardar en data.json, alojamiento.json e indice.json
app.post('/api/pagina/crear', async (req, res) => {
    const { pageTitle } = req.body;
    
    // Log de la solicitud recibida
    console.log(`Solicitud POST recibida para crear página con título: ${pageTitle}`);

    if (!pageTitle) {
        console.log('Error: Título de página no proporcionado.');
        return res.status(400).json({ error: 'El título de la página es requerido.' });
    }

    try {
        // Llama al servicio para obtener el resumen
        const data = await wikipediaService.getArticleSummary(pageTitle);
        
        // Llama al servicio para crear la página HTML
        const cleanPageTitle = pageTitle.replace(/[^a-zA-Z0-9_]/g, '');
        const pageUrl = await crearPagina(cleanPageTitle, data.title, data.extract);

        // Llama al servicio para guardar los datos en los archivos JSON
        const articuloData = { title: data.title, summary: data.extract };
        await wikipediaService.saveArticleData(articuloData, cleanPageTitle, pageUrl);

        res.status(200).json({
            message: 'Página dinámica creada y artículo guardado en la base de datos.',
            title: data.title,
            summary: data.extract,
            pageUrl: pageUrl
        });

    } catch (error) {
        // Log de error detallado
        console.error('Error en la ruta POST /api/pagina/crear:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud para crear la página.' });
    }
});

// Ruta para cargar todos los enlaces guardados
app.get('/api/enlaces', async (req, res) => {
    try {
        // Llama al servicio para cargar los enlaces
        const enlaces = await wikipediaService.loadAllLinks();
        res.json(enlaces);
    } catch (error) {
        console.error('Error en la ruta GET /api/enlaces:', error);
        res.status(500).json({ error: error.message || 'Error al cargar los enlaces.' });
    }
});

// Ruta para cargar el artículo guardado en data.json
app.get('/api/articulo', async (req, res) => {
    try {
        // Llama al servicio para cargar el último artículo
        const jsonData = await wikipediaService.loadLastArticle();
        res.json(jsonData);
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error al leer data.json:', err);
        res.status(500).json({ error: 'No se pudo cargar el artículo' });
      });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
