// test.js
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const wikipediaService = require('./wikipediaService');

describe('WikipediaService', () => {
    // This example assumes you have a mock database client
    let mockSql;

    beforeEach(() => {
        // You would typically mock your database connection here.
        // For example, using sinon to create a stub.
        mockSql = sinon.stub();
    });

    afterEach(() => {
        // Restore the original stubs after each test
        sinon.restore();
    });

    it('should be able to load all links from the database', async () => {
        // Mock the database call to return a specific set of data
        const expectedLinks = [{ title: 'Link 1', url: 'url1' }];
        mockSql.returns(expectedLinks);
        
        // Temporarily replace the real `sql` function with our mock
        sinon.stub(wikipediaService, 'loadAllLinks').returns(Promise.resolve(expectedLinks));
        
        // Call the function being tested
        const links = await wikipediaService.loadAllLinks();
        
        // Assert that the function returned the expected data
        expect(links).to.deep.equal(expectedLinks);
    });

    // You can add more tests for other functions like saveArticle, loadLastArticle, etc.
});
