const express = require('express');
const path = require('path');
const wikipediaService = require('./wikipediaService');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config({ path: '.env.local' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ruta POST para crear la página dinámica y guardar los datos
app.post('/api/pagina/crear', async (req, res) => {
    const { pageTitle } = req.body;
    if (!pageTitle) {
        return res.status(400).json({ error: 'El título de la página es requerido.' });
    }

    try {
        const data = await wikipediaService.getArticleSummary(pageTitle);
        
        const cleanPageTitle = pageTitle.replace(/[^a-zA-Z0-9_]/g, '');
        const pageUrl = await wikipediaService.crearPagina(cleanPageTitle, data.title, data.extract);

        await wikipediaService.saveArticle(data.title, data.extract, pageUrl);
        await wikipediaService.saveLink(data.title, pageUrl, data.extract);
        await wikipediaService.updateIndex(cleanPageTitle, data.title, pageUrl);

        res.status(200).json({
            message: 'Página dinámica creada y artículo guardado en la base de datos.',
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
        const enlaces = await wikipediaService.loadAllLinks();
        res.json(enlaces);
    } catch (error) {
        console.error('Error en la ruta GET /api/enlaces:', error);
        res.status(500).json({ error: error.message || 'Error al cargar los enlaces.' });
    }
});

// Ruta para cargar el artículo guardado
app.get('/api/articulo', async (req, res) => {
    try {
        const jsonData = await wikipediaService.loadLastArticle();
        res.json(jsonData);
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error en la ruta GET /api/articulo:', error);
        res.status(500).json({ error: 'No se pudo cargar el artículo.' });
    }
});
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
