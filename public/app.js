// Archivo app.js - para usar en el lado del cliente (navegador)

document.addEventListener('DOMContentLoaded', () => {
    // Definimos el nombre de la página de Wikipedia que queremos obtener
    const pageTitle = '';
    
    // Construimos la URL para la API de resumen
    const apiUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${pageTitle}`;
    
    // Referencias a los elementos del DOM donde mostraremos el resultado
    // Asegúrate de que estos elementos existan en tu archivo index.html
    const headingElement = document.getElementById('article-heading');
    const contentElement = document.getElementById('article-content');
    const statusElement = document.getElementById('status-message');

    // Usamos fetch para hacer la llamada a la API
    async function fetchArticleSummary() {
        if (statusElement) {
            statusElement.textContent = 'Cargando resumen del artículo...';
        }
        
        try {
            const response = await fetch(apiUrl);
            
            // Verificamos si la respuesta fue exitosa
            if (!response.ok) {
                if (statusElement) {
                    statusElement.textContent = 'Error al cargar el artículo.';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parseamos la respuesta a JSON
            const data = await response.json();
            
            // Extraemos el resumen del objeto JSON
            const summary = data.extract;
            
            // Actualizamos los elementos de la página con los datos obtenidos
            if (headingElement) {
                headingElement.textContent = data.title;
            }
            if (contentElement) {
                contentElement.textContent = summary;
            }
            if (statusElement) {
                statusElement.textContent = ''; // Limpiamos el mensaje de estado
            }
            
            console.log('Resumen del artículo obtenido:', summary);

        } catch (error) {
            console.error('Error al obtener el resumen:', error);
            if (statusElement) {
                statusElement.textContent = 'Hubo un problema al conectar con la API de Wikipedia.';
            }
        }
    }

    // Llamamos a la función para ejecutarla
    fetchArticleSummary();
});
