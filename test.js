const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const wikipediaService = require('./wikipediaService');
const { neon } = require('@neondatabase/serverless');

// Mock del cliente de base de datos de Neon
const mockSql = sinon.stub();
sinon.stub(require('@neondatabase/serverless'), 'neon').returns(mockSql);

describe('WikipediaService', () => {
    // Restaura los stubs después de cada prueba
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