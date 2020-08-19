import test from 'ava';
import { KoaOasRouter, IRouterOptions } from '../index';
import * as KoaRouter from 'koa-router';

import * as SPEC_WITH_TAG_AND_OPERATION_ID from './spec-with-tag-operationId.json';
import * as SPEC_WITH_OPERATION_ID_WITHOUT_TAG from './spec-with-operationId-without-tag.json';
import * as SPEC_WITH_TAG_WITHOUT_OPERATION_ID from './spec-with-tag-without-operationId.json';
import * as SPEC_WITHOUT_TAG_AND_OPERATION_ID from './spec-without-tag-operationId.json';

// TODO: Find a way to test the dependency injection and the mapping to the right controller

test('Initialization', t => {
    const router = new KoaOasRouter();
    t.true(router instanceof KoaRouter, 'KoaRouter should be instance of koa-router');
});

test('Initialization without options', t => {
    const router = new KoaOasRouter();
    router.get('/a');
    t.true(router.match('/a', 'get').path.length > 0, 'KoaRouter should not have a prefix');
});

test('Initialization with options', t => {
    const opt: IRouterOptions = {prefix: '/b'};
    const router = new KoaOasRouter(opt);
    router.get('/a');
    t.true(router.match('/b/a', 'get').path.length > 0, 'KoaRouter should have a prefix');
});

test('Add routes by TAG and operationId', async t => {
    const router = new KoaOasRouter();
    await t.notThrowsAsync(router.addRoutesFromSpecification(SPEC_WITH_TAG_AND_OPERATION_ID), 'Should not throw');
    t.truthy(router.match('/a', 'get').path.find(p => p.methods.includes('GET')), 'GET /a should be included');
    t.truthy(router.match('/a', 'delete').path.find(p => p.methods.includes('DELETE')), 'DELETE /a should be included');
    t.truthy(router.match('/b', 'put').path.find(p => p.methods.includes('PUT')), 'PUT /b should be included');
    t.truthy(router.match('/post', 'post').path.find(p => p.methods.includes('POST')), 'POST /post should be included');

    await t.throwsAsync(router.addRoutesFromSpecification(SPEC_WITH_OPERATION_ID_WITHOUT_TAG), { message: /^Method.*in path.*has no tags!$/}, 'Should throw that a method has no tags');
    await t.throwsAsync(router.addRoutesFromSpecification(SPEC_WITH_TAG_WITHOUT_OPERATION_ID), { message: /^Method.*in path.*has no operationId!$/}, 'Should throw that a method has no operationId');
    await t.throwsAsync(router.addRoutesFromSpecification(SPEC_WITHOUT_TAG_AND_OPERATION_ID), { message: /^Method.*in path.*has no tags!$/}, 'Should throw that a method has no tags');
});

test('Add routes by PATH and operationId', async t => {
    const router = new KoaOasRouter();
    await t.notThrowsAsync(router.addRoutesFromSpecification(SPEC_WITH_OPERATION_ID_WITHOUT_TAG, {mapControllerBy: 'PATH'}), 'Should not throw');
    t.truthy(router.match('/a', 'get').path.find(p => p.methods.includes('GET')), 'GET /a should be included');
    t.truthy(router.match('/a', 'delete').path.find(p => p.methods.includes('DELETE')), 'DELETE /a should be included');
    t.truthy(router.match('/b', 'put').path.find(p => p.methods.includes('PUT')), 'PUT /b should be included');
    t.truthy(router.match('/post', 'post').path.find(p => p.methods.includes('POST')), 'POST /post should be included');

    await t.notThrowsAsync(router.addRoutesFromSpecification(SPEC_WITH_TAG_AND_OPERATION_ID, {mapControllerBy: 'PATH'}), 'Should throw that a method has no tags');
    await t.throwsAsync(router.addRoutesFromSpecification(SPEC_WITH_TAG_WITHOUT_OPERATION_ID, {mapControllerBy: 'PATH'}), { message: /^Method.*in path.*has no operationId!$/}, 'Should throw that a method has no operationId');
    await t.throwsAsync(router.addRoutesFromSpecification(SPEC_WITHOUT_TAG_AND_OPERATION_ID, {mapControllerBy: 'PATH'}), { message: /^Method.*in path.*has no operationId!$/}, 'Should throw that a method has no operationId');
});