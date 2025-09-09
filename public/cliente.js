document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-button');
    const messageElement = document.getElementById('message');
    const inputElement = document.getElementById('wikipedia-link-input');
    
    // Nuevos elementos para el acordeón
    const accordionHeader = document.getElementById('accordion-header');
    const accordionContent = document.getElementById('accordion-content');
    const accordionSpan = accordionHeader.querySelector('span'); // Selecciona el span dentro del header

    const loadLastArticle = async () => {
        accordionContent.style.maxHeight = '0';
        accordionContent.style.display = 'none';
        accordionSpan.textContent = 'Cargando artículo...';

        try {
            const response = await fetch('/api/articulo'); // Carga el último artículo guardado en data.json
            const result = await response.json();
            
            if (response.ok && result.title && result.summary) {
                // Actualizar el contenido del acordeón
                accordionSpan.textContent = result.title;
                accordionContent.innerHTML = `<p>${result.summary}</p>`;
                accordionContent.style.display = 'block';
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                
                messageElement.textContent = 'Página dinámica creada y contenido cargado.';
            } else {
                messageElement.textContent = result.error || 'No se pudo cargar el artículo.';
                accordionSpan.textContent = 'Error al cargar';
                accordionContent.innerHTML = `<p>${result.error || 'No se pudo cargar el artículo'}</p>`;
            }
        } catch (error) {
            console.error('Error al cargar el último artículo:', error);
            messageElement.textContent = 'Hubo un problema al conectar con el servidor para cargar el artículo.';
            accordionSpan.textContent = 'Error de conexión';
            accordionContent.innerHTML = `<p>Hubo un problema al conectar con el servidor.</p>`;
        }
    };
    
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const pageTitle = inputElement.value.trim();
            if (!pageTitle) {
                messageElement.textContent = 'Por favor, introduce un título de Wikipedia.';
                return;
            }
            messageElement.textContent = 'Guardando resumen del artículo y actualizando vista...';
            try {
                // Llama a la ruta que guarda en alojamiento.json y data.json
                const response = await fetch('/api/pagina/crear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ pageTitle })
                });

                const result = await response.json();

                if (response.ok) {
                    messageElement.textContent = result.message || 'Artículo guardado y actualizado.';
                    // Llama a la función para cargar el artículo después de guardar
                    await loadLastArticle();
                } else {
                    messageElement.textContent = result.error || 'Error al guardar y generar la página.';
                }
            } catch (error) {
                console.error('Error al guardar el artículo:', error);
                messageElement.textContent = 'Error al guardar el artículo.';
            }
            inputElement.value=""
        });

    }

    // El resto de la lógica para el acordeón se maneja en script.js ahora
    // y la lógica de cargar enlaces se mantiene en script.js
});
