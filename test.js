const { expect } = require('chai');
const sinon = require('sinon'); // Para simular dependencias
const fs = require('fs').promises;
const WikipediaService = require('./wikipediaService');

// Simula el comportamiento de fs.writeFile para no escribir en archivos reales
const fsStub = sinon.stub(fs, 'writeFile').resolves();

describe('WikipediaService', () => {
    let service;

    beforeEach(() => {
        // Crea una nueva instancia del servicio antes de cada prueba
        service = new WikipediaService();
    });

    afterEach(() => {
        // Limpia el stub después de cada prueba
        fsStub.reset();
    });

    it('should call fs.writeFile when saving an article', async () => {
        const mockArticle = { title: 'Test', summary: 'Mock summary.' };
        await service.saveArticle(mockArticle);

        // Verifica que la función stub fue llamada
        expect(fsStub.called).to.be.true;
    });

    // Puedes agregar más pruebas aquí
});