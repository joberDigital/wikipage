const express = require('express');
const path = require('path');
const fs = require('fs').promises; 
const fetch = require('node-fetch');

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
        const apiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
        
        // Log del intento de llamada a la API
        console.log(`Llamando a la API de Wikipedia: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                console.log('Error 404: Artículo no encontrado en Wikipedia.');
                return res.status(404).json({ error: 'No se encontró el artículo en Wikipedia.' });
            }
            throw new Error(`Error en la API de Wikipedia. Status: ${response.status}`);
        }

        const data = await response.json();
        const cleanPageTitle = pageTitle.replace(/[^a-zA-Z0-9_]/g, '');
        const pageUrl = await crearPagina(cleanPageTitle, data.title, data.extract);

        // Guardar el artículo en data.json
        console.log('Intentando guardar en data.json...');
        const articuloData = { title: data.title, summary: data.extract };
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(articuloData, null, 2), 'utf8');
        console.log('Artículo guardado en data.json');

        // Guardar el enlace en alojamiento.json (con eliminación de duplicados)
        console.log('Intentando guardar en alojamiento.json...');
        const newLink = {
            title: data.title,
            url: `https://es.wikipedia.org/wiki/${data.title}`,
            summary: data.extract
        };

        const alojamientoData = await fs.readFile(ALOJAMIENTO_FILE, 'utf8').catch(() => '[]');
        let links = JSON.parse(alojamientoData);
        if (!Array.isArray(links)) {
            links = [];
        }
        links.push(newLink);
        const uniqueLinks = eliminarDuplicados(links, 'url');
        await fs.writeFile(ALOJAMIENTO_FILE, JSON.stringify(uniqueLinks, null, 2), 'utf8');
        console.log('Enlace guardado exitosamente en alojamiento.json (sin duplicados)');

        // Actualizar indice.json (con eliminación de duplicados)
        console.log('Intentando actualizar indice.json...');
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
            title: data.title,
            url: pageUrl
        };
        const indiceArray = Object.keys(indice).map(key => ({ key: key, ...indice[key] }));
        const uniqueIndiceArray = eliminarDuplicados(indiceArray, 'key');
        const uniqueIndice = uniqueIndiceArray.reduce((obj, item) => {
            obj[item.key] = { title: item.title, url: item.url };
            return obj;
        }, {});
        await fs.writeFile(INDICE_FILE, JSON.stringify(uniqueIndice, null, 2), 'utf8');
        console.log('Índice actualizado en indice.json (sin duplicados)');

        // Log de respuesta exitosa
        console.log('Respondiendo con éxito a la solicitud.');
        res.status(200).json({
            message: 'Página dinámica creada y artículo guardado en todos los archivos.',
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
app.get('/api/enlaces', (req, res) => {
    console.log('Solicitud GET recibida para /api/enlaces');
    fs.readFile(ALOJAMIENTO_FILE, 'utf8')
      .then(data => {
        try {
          const enlaces = JSON.parse(data);
          if (!Array.isArray(enlaces)) {
            console.log('El archivo de alojamiento no es un array, devolviendo array vacío.');
            return res.json([]);
          }
          console.log(`Se encontraron ${enlaces.length} enlaces.`);
          res.json(enlaces);
        } catch (e) {
          console.error('Error al parsear alojamiento.json:', e);
          res.status(500).json({ error: 'Error en el formato del archivo de datos.' });
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          console.log('Archivo alojamiento.json no encontrado, devolviendo array vacío.');
          return res.json([]);
        }
        console.error('Error al cargar los enlaces:', err);
        res.status(500).json({ error: 'Error al cargar los enlaces.' });
      });
});

// Ruta para cargar el artículo guardado en data.json
app.get('/api/articulo', (req, res) => {
    console.log('Solicitud GET recibida para /api/articulo');
    fs.readFile(DATA_FILE_PATH, 'utf8')
      .then(data => {
        try {
          const jsonData = JSON.parse(data);
          console.log('Artículo cargado de data.json');
          res.json(jsonData);
        } catch (e) {
          console.error('Error al parsear data.json:', e);
          res.status(500).json({ error: 'Formato de archivo JSON incorrecto' });
        }
      })
      .catch(err => {
        if (err.code === 'ENOENT') {
          console.log('Archivo data.json no encontrado.');
          return res.status(404).json({ error: 'El archivo de datos no existe.' });
        }
        console.error('Error al leer data.json:', err);
        res.status(500).json({ error: 'No se pudo cargar el artículo' });
      });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
