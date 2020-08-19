import * as path from 'path';
import { IRouterOptions } from 'koa-router';
import * as Router from 'koa-router';

import * as CONST from './const.json';
import * as STRINGS from './strings.json';
import { Context } from 'koa';

const validator = require('oas-validator');

/**
 * A child class of the koa-router. It extends the koa-router by some features that can be used with oas.
 *
 * @export
 * @class KoaOasRouter
 * @extends {Router}
 */
export class KoaOasRouter<StateT = any, CustomT = {}> extends Router {

    /**
     *Creates an instance of KoaOasRouter.
     * @param {IRouterOptions} [opt]
     * @memberof KoaOasRouter
     */
    constructor(opt?: IRouterOptions) {
        super(opt);
    }

    /**
     * Adds the routes from a specification to the router. As implementation it uses the controllers from the opts.controllerBasePath (default = '../controller').
     * The name of the controller file is the first tag of a operation in pascal case.
     * The name of the function in the controller file is the operationId.
     * The specification will be validated by oas-validator. You can opt this out with opts.validateSpecification.
     * If a implementation is not found this function will add a stub for that. You can opt this out with opts.provideStubs.
     *
     * @async
     * @param {Specification} specification
     * @param {AddFromSpecificationOpts} [opts]
     * @returns {Promise<any>}
     * @memberof KoaOasRouter
     */
    public async addRoutesFromSpecification(specification: Specification, opts?: AddFromSpecificationOpts): Promise<any> {
        // Initialize default values
        opts = opts ? opts : {};
        const controllerBasePath = (opts.controllerBasePath) ? opts.controllerBasePath : CONST.addRoutesFromSpecification.CONTROLLER_BASE_PATH;
        const validateSpecification = (opts.validateSpecification) ? opts.validateSpecification : CONST.addRoutesFromSpecification.VALIDATE_SPECIFICATION;
        const provideStubs = (opts.provideStubs) ? opts.provideStubs : CONST.addRoutesFromSpecification.PROVIDE_STUBS;
        const mapControllerBy: mapControllerBy = opts.mapControllerBy || CONST.addRoutesFromSpecification.MAP_CONTROLLER_BY as mapControllerBy;

        if (validateSpecification) {
            if (!(await validator.validate(specification, {}))?.valid) {
                throw new Error(STRINGS.logger.fatal.addRoutesFromSpecification_SPECNOTVALID);
            }
        }

        const importPromises: Array<Promise<void>> = [];

        if (!specification) {
            Promise.reject(STRINGS.logger.error.addRoutesFromSpecification_SPECUNDEFINED);
        }
        if (!specification.paths) {
            Promise.reject(STRINGS.logger.error.addRoutesFromSpecification_PATHUNDEFINED);
        }

        // Get the mapping tag or path -> operation (with operationId) -> {path, operationSpecification}
        let operationControllerMapping: OperationControllerMapping = {};
        switch (mapControllerBy) {
            case 'TAG':
                operationControllerMapping = this.mapOperationsByTag(specification.paths);
                break;
            case 'PATH':
                operationControllerMapping = this.mapOperationsByPath(specification.paths);
                break;
        }

        // For each tag:
        const tags: string[] = Object.keys(operationControllerMapping);
        tags.forEach((controllerName: string) => {
            const operationMapping: OperationMapping = operationControllerMapping[controllerName];

            // Import the controller belonging to it
            importPromises.push(import(path.resolve(path.join(controllerBasePath, controllerName.toPascalCase()))).then((controller) => {
                // For each operation (with operationId)
                const operationIds: string[] = Object.keys(operationMapping);
                operationIds.forEach((operationId: string) => {
                    const operation = operationMapping[operationId];

                    // get the function in controller and check if it is defined.
                    const operationInController = controller[operationId];
                    if (operationInController) {
                        // If it is defined: Map the funcion to the router by the path and the method.
                        this.mapToRouter(operation.path, operation.method, operationInController, controllerName.toPascalCase());
                    } else if (provideStubs) {
                        // If it is not defined: create a stub if the flag is set.
                        this.createStubFromSpec({path: operation.path, method: operation.method});
                    }
                })
            }).catch((error: NodeJS.ErrnoException) => {
                // If the module belonging to a specific tag (controller) isn't found: create a stub if the flag is set.
                if (error.code === 'MODULE_NOT_FOUND' && provideStubs) {
                    this.createStubFromSpec({operationMapping});
                } else {
                    throw error;
                }
            }));
        });

        return Promise.all(importPromises);
    }

    private createStubFromSpec(toStub: {operationMapping: OperationMapping} | {path: string, method: string}) {
        const dummyFunction = (ctx: Context, next: () => void) => {
            ctx.body = {code: 501, message: 'Not Implemented'};
            ctx.status = 501;
        }
        if (!toStub) {
            throw new Error('Specification cannot be undefined');
        }
        if ('path' in toStub) {
            this.mapToRouter(toStub.path, toStub.method, dummyFunction, 'Stub');
        } else {
            const opertionIds = Object.keys(toStub.operationMapping);
            opertionIds.forEach((operationId) => {
                this.createStubFromSpec({path: toStub.operationMapping[operationId].path, method: toStub.operationMapping[operationId].method})
            });
        }
    }

    private mapToRouter(pathToMap: string, method: string, controllerFunction: (ctx: Context, next: () => void) => void, controllerName: string): void {
        pathToMap = pathToMap.replace(/{/g, ':').replace(/}/g, '');
        controllerName = controllerName ? controllerName : '';
        this.register(pathToMap, [method], controllerFunction);
        return;
    }

    private mapOperationsByTag(paths: Paths): OperationControllerMapping {
        const mapping: OperationControllerMapping = {};
        const pathKeys = Object.keys(paths);
        pathKeys.forEach((pathKey) => {
            const apiPath = paths[pathKey];
            const methods = Object.keys(apiPath);
            methods.forEach((methodName) => {
                const operation = apiPath[methodName] as Operation;

                if (!operation.tags || !operation.tags[0]) {
                    throw new Error('Method ' + methodName + ' in path ' + pathKey + ' has no tags!');
                }

                const tag = operation.tags[0];
                if (mapping[tag]) {
                    // If tag is already mapped:
                    if (mapping[tag][operation.operationId]) {
                        // Throw error if operationId is already used (shouldn't be possible in valid oas document!)
                        throw new Error('OperationId in specification isn\'t used uniquely! ' + operation.operationId);
                    } else {
                        // Add the operation by it's Id to the tag in the mapping. As values add the path and the specification.
                        mapping[tag][operation.operationId] = {
                            path: pathKey,
                            method: methodName,
                            operationSpec: operation
                        };
                    }
                } else {
                    mapping[tag] = {};
                    mapping[tag][operation.operationId] = {
                        path: pathKey,
                        method: methodName,
                        operationSpec: operation
                    };
                }
            });
        });
        return mapping;
    }

    private mapOperationsByPath(paths: Paths): OperationControllerMapping {
        const mapping: OperationControllerMapping = {};
        Object.entries(paths).forEach(([path, operations]) => {
            const mappedPath = path.replace(/[{}]/gi, '').replace('/', '_');
            Object.entries(operations).forEach(([method, operation]) => {
                if (mapping[mappedPath]) {
                    // If path is already mapped:
                    if (mapping[mappedPath][operation.operationId]) {
                        // Throw error if operationId is already used (shouldn't be possible in valid oas document!)
                        throw new Error('OperationId in specification isn\'t used uniquely! ' + operation.operationId);                            
                    } else {
                        // Add the operation by it's Id to the tag in the mapping. As values add the path and the specification.
                        mapping[mappedPath][operation.operationId] = {
                            path,
                            method,
                            operationSpec: operation
                        };
                    }
                } else {
                    mapping[mappedPath] = {};
                    mapping[mappedPath][operation.operationId] = {
                        path,
                        method,
                        operationSpec: operation
                    };
                }
            })
        })
        return mapping;
    }
}

export { IRouterOptions } from 'koa-router';

/**
 * Options for adding the routes from a oas specification.
 *
 * @export
 * @interface AddFromSpecificationOpts
 * @property {string} [controllerBasePath = '../controller'] The base path in which the controllers can be found.
 * @property {boolean} [validateSpecification = true] Specifies if the oas-validator should be used.
 * @property {boolean} [provideStubs = true] Specifies if stubs should be provided.
 */
export interface AddFromSpecificationOpts {
    /**
     * The base path in which the controllers can be found.
     * It is relative to your project root.
     * 
     * @type {string}
     * @default '../controller'
     */
    controllerBasePath?: string;
    /**
     * Specifies if the oas-validator should be used.
     * 
     * @type {boolean}
     * @default true
     */
    validateSpecification?: boolean;
    /**
     * Specifies if stubs should be provided.
     * 
     * @type {boolean}
     * @default true
     */
    provideStubs?: boolean;
    /**
     * Specifies how to map the controller
     * 
     * @type {mapControllerBy}
     * @default 'TAG'
     */
    mapControllerBy?: mapControllerBy;
};

/**
 * Possible ways to map the controller
 * 
 * @export
 * @enum {string}
 */
export enum mapControllerBy {
    /**
     * Maps the controller by the operation tag.
     * 
     * @type {string}
     * @default
     */
    TAG = "TAG",
    /**
     * Maps the controller by the operation path.
     * 
     * @type {string}
     */
    PATH = "PATH"
}

interface OperationControllerMapping {
    [tagOrPath: string]: OperationMapping;
};

interface OperationMapping {
    [operationId: string]: {
        path: string;
        method: string;
        operationSpec: Operation;
    };
};

/**
 * The oas specification as js object. (Convert it via js-yaml)
 *
 * @export
 * @interface Specification
 * @property {Paths} paths Object that hold all the paths.
 * @property {any} [x] Different other values.
 */
export interface Specification {
    paths: Paths;
    [x: string]: any;
};

/**
 * Representation of the oas paths.
 *
 * @export
 * @interface Paths
 * @property {Path} pathName Index type! Specifies one path object of oas. PathName is a string that specifies the path.
 */
export interface Paths {
    [path: string]: {
        [method: string]: Operation;
    };
};

/**
 * Representation of the oas path.
 *
 * @export
 * @interface Path
 * @property {Operation} [get] Specifies the get operation of the oas path.
 * @property {Operation} [post] Specifies the post operation of the oas path.
 * @property {Operation} [put] Specifies the put operation of the oas path.
 * @property {Operation} [patch] Specifies the patch operation of the oas path.
 * @property {Operation} [delete] Specifies the delete operation of the oas path.
 */
export interface Path {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    patch?: Operation;
    delete?: Operation;
};

/**
 * Representation of one operation.
 *
 * @export
 * @interface Operation
 * @property {string} operationId Specifies the oas operationId.
 * @property {string[]} tags Specifies an array of oas tags.
 * @property {string} [x] Additional values.
 */
export interface Operation {
    operationId: string;
    tags?: string[];
    [x: string]: any;
};

declare global {
    interface String {
        toPascalCase(): string;
    }
};

/**
 * Convert a string to Pascal Case (removing non alphabetic characters).
 *
 * @example
 * 'hello_world'.toPascalCase() // Will return `HelloWorld`.
 * 'fOO BAR'.toPascalCase() // Will return `FooBar`.
 *
 * @returns {string}
 *   The Pascal Cased string.
 */
String.prototype.toPascalCase = function (): string {
    const begins = this.toString().match(/[a-z]+/gi);
    return (!begins) ? this.toString() : begins.map((word) => {
        return word.charAt(0).toLocaleUpperCase() + word.substr(1).toLowerCase();
    }).join('');
};
