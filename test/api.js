
const assert = require('assert');
const { ApiClient } = require('../lib');

describe('ApiClient', function () {
    it('error no executor', function () {
        const client = new ApiClient();
        return client.mutation.execute().then(() => assert.fail()).catch(() => true);
    });
    it('error no query body', function () {
        const client = new ApiClient('http://localhost:41724/graphql');
        return client.mutation.execute().then((r) => assert.equal(400, r.status)).catch((e) => console.log(e));
    });
    it('error invalid field', function () {
        const client = new ApiClient('http://localhost:41724/graphql');
        return client.mutation.quizItemCreate({ fields: 'id nofield' }, { id: 'i1' }).execute().then((r) => assert.equal(400, r.status)).catch((e) => console.log(e));
    });

    it('get entity by id', function () {
        const client = new ApiClient('http://localhost:41724/graphql');
        return client.query.entityGetById({ fields: 'id label', name: 'entity' }, 'Q41').execute().then(r => r.json()).then(result => assert.equal('Q41', result.data.entity.id));
    });
});
