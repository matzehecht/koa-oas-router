import { spec } from './testhelper';
import test from 'ava';
import { KoaOasRouter } from './index';
// import { Logger } from 'logger';
// import * as jsyaml from 'js-yaml';
// import * as fs from 'fs';

// test('Initialization without options', t => {
//     const router = JSON.parse(JSON.stringify(new KoaOasRouter()));
//     // t.deepEqual(router, JSON.parse(JSON.stringify(new KoaRouter())), c);
//     t.true(router instanceof KoaRouter, 'KoaRouter was constructed incorrect!')
// });

// test('Initialization with options', t => {
//     const opt: IRouterOptions = {sensitive: false};
//     const router = JSON.parse(JSON.stringify(new KoaOasRouter(opt)));
//     // t.deepEqual(router, JSON.parse(JSON.stringify(new KoaRouter(opt))), 'KoaRouter was constructed incorrect!');
//     t.true(router instanceof KoaRouter, 'KoaRouter was constructed incorrect!')
// });

test('Stub of whole tag', async t => {
    // const spec = jsyaml.safeLoad(fs.readFileSync('./tmp/oas.yaml', 'utf8'));
    const router = new KoaOasRouter();
    await router.addRoutesFromSpecification(spec);
    t.true(true);
});
