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
        sinon.restore();
    });

    describe('Funciones de guardado en la base de datos', () => {

        it('should call the database client with the correct query to save an article', async () => {
            // Configura el mock para que no haga nada cuando se llame
            mockSql.returns([]);

            const title = 'Test Article';
            const summary = 'A test summary.';
            const pageUrl = 'http://example.com/test-article';

            await wikipediaService.saveArticle(title, summary, pageUrl);

            // Verifica que mockSql fue llamado una vez
            expect(mockSql.calledOnce).to.be.true;
            
            // Verifica que la consulta SQL contiene la cláusula INSERT INTO
            const query = mockSql.firstCall.args[0][0];
            expect(query).to.include('INSERT INTO articles');
        });

        it('should call the database client with the correct query to save a link', async () => {
            mockSql.returns([]);
            const title = 'Test Link';
            const url = 'http://example.com/test-link';
            const summary = 'Test summary.';
            
            await wikipediaService.saveLink(title, url, summary);

            expect(mockSql.calledOnce).to.be.true;
            const query = mockSql.firstCall.args[0][0];
            expect(query).to.include('INSERT INTO links');
        });

        it('should call the database client with the correct query to update the index', async () => {
            mockSql.returns([]);
            const key = 'testkey';
            const title = 'Test Title';
            const url = 'http://example.com/test-title';
            
            await wikipediaService.updateIndex(key, title, url);

            expect(mockSql.calledOnce).to.be.true;
            const query = mockSql.firstCall.args[0][0];
            expect(query).to.include('INSERT INTO indices');
        });
    });

    describe('Funciones de lectura de la base de datos', () => {

        it('should return all links from the database', async () => {
            // Mock de los datos que la base de datos devolvería
            const mockLinks = [{ title: 'Link 1', url: 'url1' }, { title: 'Link 2', url: 'url2' }];
            mockSql.returns(mockLinks);

            const links = await wikipediaService.loadAllLinks();

            // Verifica que la función devuelva los datos del mock
            expect(links).to.deep.equal(mockLinks);
            expect(mockSql.calledOnce).to.be.true;
            const query = mockSql.firstCall.args[0][0];
            expect(query).to.include('SELECT title, url, summary FROM links');
        });

        it('should return the last article from the database', async () => {
            const mockArticle = [{ title: 'Last Article', summary: 'The last article.' }];
            mockSql.returns(mockArticle);

            const article = await wikipediaService.loadLastArticle();

            expect(article).to.deep.equal(mockArticle[0]);
            expect(mockSql.calledOnce).to.be.true;
            const query = mockSql.firstCall.args[0][0];
            expect(query).to.include('SELECT title, summary FROM articles');
        });

        it('should return null if no articles are found', async () => {
            // Mock para devolver un array vacío
            mockSql.returns([]);

            const article = await wikipediaService.loadLastArticle();

            expect(article).to.be.null;
        });
    });
});
