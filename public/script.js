document.addEventListener('DOMContentLoaded', () => {
    // Nuevos elementos para la funcionalidad de enlaces
    const loadLinksButton = document.getElementById('load-links-button');
    const linksList = document.getElementById('links-list');
    const linksStatus = document.getElementById('links-status');
  
    // Lógica para cargar todos los enlaces guardados
    if (loadLinksButton) {
        loadLinksButton.addEventListener('click', async () => {
            linksStatus.textContent = 'Cargando enlaces...';
            linksList.innerHTML = '';
            try {
                const response = await fetch('/api/enlaces');
                const enlaces = await response.json();
  
                if (response.ok) {
                    if (enlaces.length > 0) {
                        enlaces.forEach(enlace => {
                            const li = document.createElement('li');
                            const a = document.createElement('a');
                            a.href = enlace.url;
                            a.textContent = enlace.title;
                            a.target = '_blank';
                            li.appendChild(a);
                            linksList.appendChild(li);
                        });
                        linksStatus.textContent = `Se cargaron ${enlaces.length} enlaces.`;
                    } else {
                        linksStatus.textContent = 'No hay enlaces guardados.';
                    }
                } else {
                    linksStatus.textContent = enlaces.error || 'No se pudieron cargar los enlaces.';
                }
            } catch (error) {
                console.error('Error al cargar los enlaces:', error);
                linksStatus.textContent = 'Hubo un problema al cargar los enlaces.';
            }
        });
    }

    // Lógica para el acordeón (desplegar/plegar)
    const accordionHeader = document.getElementById('accordion-header');
    const accordionContent = document.getElementById('accordion-content');

    if (accordionHeader) {
        accordionHeader.addEventListener('click', () => {
            if (accordionContent.style.maxHeight) {
                accordionContent.style.maxHeight = null;
                accordionContent.style.display = 'none';
            } else {
                accordionContent.style.display = 'block';
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            }
        });
    }
});
