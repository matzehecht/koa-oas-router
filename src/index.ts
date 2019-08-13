import * as path from 'path';
import * as Router from 'koa-router';
import { Logger } from 'logger';

import * as CONST from './const.json';
import * as STRINGS from './strings.json';

/**
 * A child class of the koa-router. It extends the koa-router by some features that can be used with oas.
 *
 * @export
 * @class KoaOasRouter
 * @extends {Router}
 */
export class KoaOasRouter<StateT = any, CustomT = {}> extends Router {

    private logger: Logger;

    /**
     * Creates an instance of KoaOasRouter.
     * @param {IRouterOptions} [opt]
     * @memberof KoaOasRouter
     */
    constructor(opt?: IRouterOptions) {
        super(opt);
        if (opt && opt.logger) {
            this.logger = opt.logger;
        } else {
            this.logger = new Logger();
            this.logger.setLevel('error');
        }
    }

    /**
     * Adds the routes from a specification to the router. As implementation it uses the controllers from the opts.controllerBasePath (default = '../controller').
     * The name of the controller file is the first tag of a operation in pascal case.
     * The name of the function in the controller file is the operationId.
     * The specification will be validated by oas-validator. You can opt this out with opts.validateSpecification.
     * If a implementation is not found this function will add a stub for that. You can opt this out with opts.provideStubs.
     *
     * @param {Specification} specification
     * @param {AddFromSpecificationOpts} [opts]
     * @returns {Promise<any>}
     * @memberof KoaOasRouter
     */
    public addRoutesFromSpecification(specification: Specification, opts?: AddFromSpecificationOpts): Promise<any> {
        const importPromises: Array<Promise<void>> = [];
        // TODO use oas-validator (opt-out?)
        if (!specification) {
            this.logger.error(STRINGS.logger.error.addRoutesFromSpecification_SPECUNDEFINED);
            Promise.reject(STRINGS.logger.error.addRoutesFromSpecification_SPECUNDEFINED);
        }
        if (!specification.paths) {
            this.logger.error(STRINGS.logger.error.addRoutesFromSpecification_PATHUNDEFINED);
            Promise.reject(STRINGS.logger.error.addRoutesFromSpecification_PATHUNDEFINED);
        }

        // Initialize default values
        opts = opts ? opts : {};
        const controllerBasePath = (opts.controllerBasePath) ? opts.controllerBasePath : CONST.addRoutesFromSpecification.CONTROLLER_BASE_PATH;
        const validateSpecification = (opts.validateSpecification) ? opts.validateSpecification : CONST.addRoutesFromSpecification.VALIDATE_SPECIFICATION;
        const provideStubs = (opts.provideStubs) ? opts.provideStubs : CONST.addRoutesFromSpecification.PROVIDE_STUBS;
        this.logger.info(STRINGS.logger.info.addRoutesFromSpecification_INITCONTROLLERBASEPATH, controllerBasePath);
        this.logger.info(STRINGS.logger.info.addRoutesFromSpecification_INITVALIDATESPEC, validateSpecification.toString());
        this.logger.info(STRINGS.logger.info.addRoutesFromSpecification_INITPROVIDESTUBS, provideStubs.toString());

        // Get the mapping tag -> operation (with operationId) -> {path, operationSpecification}
        const operationTagMapping: OperationTagMapping = this.mapOperationsByTag(specification.paths);

        // For each tag:
        const tags: string[] = Object.keys(operationTagMapping);
        this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_LOOPTAGS, tags.toString())
        tags.forEach((tagName: string) => {
            const operationMapping: OperationMapping = operationTagMapping[tagName];

            this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_TRYTOIMPORTCONTROLLER, path.join(controllerBasePath, tagName.toPascalCase()));
            // Import the controller belonging to it
            importPromises.push(import(path.join(controllerBasePath, tagName.toPascalCase())).then((controller) => {
                this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_IMPORTCONTROLLER, tagName.toPascalCase());

                // For each operation (with operationId)
                const operationIds: string[] = Object.keys(operationMapping);
                this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_LOOPOPERATIONS, operationIds.toString());
                operationIds.forEach((operationId: string) => {
                    const operation = operationMapping[operationId];

                    // get the function in controller and check if it is defined.
                    const operationInController = controller[operationId];
                    if (operationInController) {
                        this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_CONTROLLERFUNCTIONFOUND, operationId);
                        // If it is defined: Map the funcion to the router by the path and the method.
                        this.mapToRouter(operation.path, operation.method, operationInController, tagName.toPascalCase());
                    } else {
                        this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND, operationId);
                        // If it is not defined: create a stub if the flag is set.
                        if (provideStubs) {
                            this.createStubFromSpec({path: operation.path, method: operation.method});
                        } else {
                            this.logger.warn(STRINGS.logger.warn.addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND, operationId);
                        }
                    }
                })
            }).catch((error: NodeJS.ErrnoException) => {
                // If the module belonging to a specific tag (controller) isn't found: create a stub if the flag is set.
                if (error.code === 'MODULE_NOT_FOUND') {
                    this.logger.debug(STRINGS.logger.debug.addRoutesFromSpecification_IMPORTMODULENOTFOUND, tagName.toPascalCase());
                    if (provideStubs) {
                        this.createStubFromSpec(operationMapping);
                    } else {
                        this.logger.warn(STRINGS.logger.warn.addRoutesFromSpecification_IMPORTMODULENOTFOUND, tagName.toPascalCase());
                    }
                } else {
                    this.logger.error(STRINGS.logger.error.addRoutesFromSpecification_IMPORTERROR, error.message)
                    throw error;
                }
            }));
        });

        return Promise.all(importPromises);
    }

    private createStubFromSpec(toStub: OperationMapping | {path: string, method: PossibleMethod}) {
        if (!toStub) {
            throw new Error('Specification cannot be undefined');
        }
        // TODO call routes mapping function
        // this.mapToRouter(path, method, dummyFunction, 'Stub');
        if ('path' in toStub) {
            // If only single operation
        } else {
            // If whole controller
            // recursive?
        }
    }

    private mapToRouter(pathToMap: string, method: PossibleMethod, controllerFunction: () => void, controllerName: string): void {
        pathToMap = pathToMap.replace(/{/g, ':').replace(/}/g, '');
        controllerName = controllerName ? controllerName : '';
        switch (method) {
            case 'get': {
                this.get(pathToMap, controllerFunction);
                this.logger.info(STRINGS.logger.info.mapToRouter_MAPPED, method, pathToMap, controllerName);
                break;
            }
            case 'post': {
                this.post(pathToMap, controllerFunction);
                this.logger.info(STRINGS.logger.info.mapToRouter_MAPPED, method, pathToMap, controllerName);
                break;
            }
            case 'put': {
                this.put(pathToMap, controllerFunction);
                this.logger.info(STRINGS.logger.info.mapToRouter_MAPPED, method, pathToMap, controllerName);
                break;
            }
            case 'patch': {
                this.patch(pathToMap, controllerFunction);
                this.logger.info(STRINGS.logger.info.mapToRouter_MAPPED, method, pathToMap, controllerName);
                break;
            }
            case 'delete': {
                this.delete(pathToMap, controllerFunction);
                this.logger.info(STRINGS.logger.info.mapToRouter_MAPPED, method, pathToMap, controllerName);
                break;
            }
            default: {
                this.logger.fatal(STRINGS.logger.fatal.mapToRouter_INVALIDMETHOD, method);
                throw new Error(STRINGS.logger.fatal.mapToRouter_INVALIDMETHOD + ' ' + method);
            }
        }
        return;
    }

    private mapOperationsByTag(paths: Paths): OperationTagMapping {
        const mapping: OperationTagMapping = {};
        const pathKeys = Object.keys(paths);
        pathKeys.map((pathKey) => {
            const apiPath = paths[pathKey];
            const methods = Object.keys(apiPath) as PossibleMethod[];
            methods.forEach((methodName: PossibleMethod) => {
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
}

/**
 * This is a extension of the Router.IRouterOptions.
 *
 * @export
 * @interface IRouterOptions
 * @property {Logger} [logger] A node-logger object
 * @property {string} [logLevel] Specifies the log level ('fatal' | 'error' | 'warn' | 'info' | 'debug') will be ignored if logger is specified
 * @extends {Router.IRouterOptions}
 */
export interface IRouterOptions extends Router.IRouterOptions {
    logger?: Logger;
    logLevel?: string;
};

/**
 * Options for adding the routes from a oas specification.
 *
 * @export
 * @interface AddFromSpecificationOpts
 * @property {string} [controllerBasePath] The base path in which the controllers can be found.
 * @property {boolean} [validateSpecification] Specifies if the oas-validator should be used.
 * @property {boolean} [provideStubs] Specifies if stubs should be provided.
 */
export interface AddFromSpecificationOpts {
    controllerBasePath?: string;
    validateSpecification?: boolean;
    provideStubs?: boolean;
};

interface OperationTagMapping {
    [tag: string]: OperationMapping;
};

interface OperationMapping {
    [operationId: string]: {
        path: string;
        method: PossibleMethod;
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
        get?: Operation;
        post?: Operation;
        put?: Operation;
        patch?: Operation;
        delete?: Operation;
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
    tags: string[];
    [x: string]: any;
};

type PossibleMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

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
