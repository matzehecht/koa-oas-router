import test from 'ava';
import { KoaOasRouter, IRouterOptions } from '../index';
import * as KoaRouter from 'koa-router';

const spec = {
    openapi: '3.0.0',
    info: {
        title: 'Sample API',
        description: 'Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.',
        version: '1'
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Local dev server'
        }
    ],
    paths: {
        '/a': {
            get: {
                operationId: 'get',
                tags: ['a'],
                responses: {
                    200: {
                        description: 'OK'
                    }
                }
            },
            delete: {
                operationId: 'delete',
                tags: ['c'],
                responses: {
                    200: {
                        description: 'OK'
                    }
                }
            }
        },
        '/b': {
            put: {
                operationId: 'put',
                tags: ['b'],
                responses: {
                    200: {
                        description: 'OK'
                    }
                }
            }
        },
        '/post': {
            post: {
                operationId: 'post',
                tags: ['a'],
                responses: {
                    200: {
                        description: 'OK'
                    }
                }
            }
        }
    }
};

test('Initialization without options', t => {
    const router = new KoaOasRouter();
    t.true(router instanceof KoaRouter, 'KoaRouter was constructed incorrect!')
});

test('Initialization with options', t => {
    const opt: IRouterOptions = {sensitive: false};
    const router = new KoaOasRouter(opt);
    t.true(router instanceof KoaRouter, 'KoaRouter was constructed incorrect!')
});

test('Stub of whole tag', async t => {
    const router = new KoaOasRouter();
    await router.addRoutesFromSpecification(spec);
    t.true(true);
});
