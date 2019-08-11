import test from 'ava';
import { KoaOasRouter } from './index';
// import * as KoaRouter from 'koa-router';
import { Logger } from 'logger';

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
    const spec = {
        paths: {
            '/a': {
                get: {
                    operationId: 'get',
                    tags: ['a']
                },
                delete: {
                    operationId: 'delete',
                    tags: ['c']
                }
            },
            '/b': {
                put: {
                    operationId: 'put',
                    tags: ['b']
                }
            },
            '/post': {
                post: {
                    operationId: 'post',
                    tags: ['a']
                }
            }
        }
    };
    const logger = new Logger();
    logger.setLevel('debug');
    const router = new KoaOasRouter({logger});
    await router.addRoutesFromSpecification(spec);
    t.true(true);
})

// let spec: Spec = {
//     paths: {
//         '/a': {
//             get: {
//                 operationId: 'get',
//                 tags: ['a']
//             },
//             delete: {
//                 operationId: 'delete',
//                 tags: ['a']
//             }
//         },
//         '/b': {
//             put: {
//                 operationId: 'put',
//                 tags: ['b']
//             }
//         }
//     }
// };
// let testString: string = 'get';

// const c = new KoaOasRouter();
// c.readSpec(spec);

// console.log("TCL: spec: ", spec);
// console.log("spec.paths: ", spec.paths);
// console.log("spec.paths./a", spec.paths["/a"]);
// console.log("spec.paths./a.get", spec.paths["/a"][testString]);
