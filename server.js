// server.js
const express = require('express');
const path = require('path');
const wikipediaService = require('./wikipediaService'); // Importar el servicio

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta POST para crear la página dinámica y guardar los datos
app.post('/api/pagina/crear', async (req, res) => {
    const { pageTitle } = req.body;
    if (!pageTitle) {
        return res.status(400).json({ error: 'El título de la página es requerido.' });
    }

    try {
        // Llama al servicio para obtener el resumen
        const data = await wikipediaService.getArticleSummary(pageTitle);
        
        // Llama al servicio para crear la página HTML
        const cleanPageTitle = pageTitle.replace(/[^a-zA-Z0-9_]/g, '');
        const pageUrl = await wikipediaService.crearPagina(cleanPageTitle, data.title, data.extract);

        // Llama al servicio para guardar los datos en los archivos JSON
        const articuloData = { title: data.title, summary: data.extract };
        await wikipediaService.saveArticleData(articuloData, cleanPageTitle, pageUrl);

        res.status(200).json({
            message: 'Página dinámica creada y artículo guardado en todos los archivos.',
            title: data.title,
            summary: data.extract,
            pageUrl: pageUrl
        });

    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ error: error.message });
        }
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
        console.error('Error en la ruta GET /api/articulo:', error);
        res.status(500).json({ error: error.message || 'No se pudo cargar el artículo.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
