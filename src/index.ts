import * as path from 'path';
import * as Router from 'koa-router';
import { Logger } from 'logger';

const CONTROLLER_BASE_PATH: string = '../controller';
const VALIDATE_SPECIFICATION: boolean = true;
const PROVIDE_STUBS: boolean = true;

const FATAL_mapToRouter_INVALIDMETHOD: string = 'Invalid method:';

const ERROR_addRoutesFromSpecification_SPECUNDEFINED: string = 'Specification not defined!';
const ERROR_addRoutesFromSpecification_PATHUNDEFINED: string = 'Paths not found!';
const ERROR_addRoutesFromSpecification_IMPORTERROR: string = 'Import failed:';

const INFO_addRoutesFromSpecification_INITCONTROLLERBASEPATH: string = 'Basepath of controller:';
const INFO_addRoutesFromSpecification_INITVALIDATESPEC: string = 'Validate specification?';
const INFO_addRoutesFromSpecification_INITPROVIDESTUBS: string = 'Do provide stubs?';
const INFO_mapToRouter_MAPPED: string = 'Mapped method of path to controller:';

const DEBUG_addRoutesFromSpecification_LOOPTAGS: string = 'Looping through these tags:';
const DEBUG_addRoutesFromSpecification_LOOPOPERATIONS: string = 'Looping through these operations:';
const DEBUG_addRoutesFromSpecification_TRYTOIMPORTCONTROLLER: string = 'Try to import controller with path:';
const DEBUG_addRoutesFromSpecification_IMPORTCONTROLLER: string = 'Imported controller:';
const DEBUG_addRoutesFromSpecification_IMPORTMODULENOTFOUND: string = 'Module of following controller not found:';
const DEBUG_addRoutesFromSpecification_CONTROLLERFUNCTIONFOUND: string = 'Found function in controller:';
const DEBUG_addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND: string = 'Function not found:';

const WARN_addRoutesFromSpecification_IMPORTMODULENOTFOUND: string = 'Module not found and don\'t provide stub:';
const WARN_addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND: string = 'Function not found and don\'t provide stub:';

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
     * @memberof KoaOasRouter
     */
    constructor(opt?: IRouterOptions) {
        super(opt);
        if(opt && opt.logger) {
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
     * @param {ReadSpecificationOpts} opts
     * @returns {Promise<any>}
     * @memberof KoaOasRouter
     */
    public addRoutesFromSpecification(specification: Specification, opts? : ReadSpecificationOpts): Promise<any> {
        const importPromises: Array<Promise<void>> = [];
        // TODO use oas-validator (opt-out?)
        if (!specification) {
            this.logger.error(ERROR_addRoutesFromSpecification_SPECUNDEFINED);
            Promise.reject(ERROR_addRoutesFromSpecification_SPECUNDEFINED);
        }
        if (!specification.paths) {
            this.logger.error(ERROR_addRoutesFromSpecification_PATHUNDEFINED);
            Promise.reject(ERROR_addRoutesFromSpecification_PATHUNDEFINED);
        }

        // Initialize default values
        opts = opts ? opts : {};
        const controllerBasePath = (opts.controllerBasePath)? opts.controllerBasePath : CONTROLLER_BASE_PATH;
        const validateSpecification = (opts.validateSpecification)? opts.validateSpecification : VALIDATE_SPECIFICATION;
        const provideStubs = (opts.provideStubs)? opts.provideStubs : PROVIDE_STUBS;
        this.logger.info(INFO_addRoutesFromSpecification_INITCONTROLLERBASEPATH, controllerBasePath);
        this.logger.info(INFO_addRoutesFromSpecification_INITVALIDATESPEC, validateSpecification.toString());
        this.logger.info(INFO_addRoutesFromSpecification_INITPROVIDESTUBS, provideStubs.toString());
        
        // Get the mapping tag -> operation (with operationId) -> {path, operationSpecification}
        const operationTagMapping: OperationTagMapping = this.mapOperationsByTag(specification.paths);

        // For each tag:
        const tags: string[] = Object.keys(operationTagMapping);
        this.logger.debug(DEBUG_addRoutesFromSpecification_LOOPTAGS, tags.toString())
        tags.forEach((tagName: string) => {
            const operationMapping: OperationMapping = operationTagMapping[tagName];

            this.logger.debug(DEBUG_addRoutesFromSpecification_TRYTOIMPORTCONTROLLER, path.join(controllerBasePath, tagName.toPascalCase()));
            // Import the controller belonging to it
            importPromises.push(import(path.join(controllerBasePath, tagName.toPascalCase())).then((controller) => {
                this.logger.debug(DEBUG_addRoutesFromSpecification_IMPORTCONTROLLER, tagName.toPascalCase());

                // For each operation (with operationId)
                const operationIds: string[] = Object.keys(operationMapping);
                this.logger.debug(DEBUG_addRoutesFromSpecification_LOOPOPERATIONS, operationIds.toString());
                operationIds.forEach((operationId: string) => {
                    const operation = operationMapping[operationId];

                    // get the function in controller and check if it is defined.
                    const operationInController = controller[operationId];
                    if (operationInController) {
                        this.logger.debug(DEBUG_addRoutesFromSpecification_CONTROLLERFUNCTIONFOUND, operationId);
                        // If it is defined: Map the funcion to the router by the path and the method.
                        this.mapToRouter(operation.path, operation.method, operationInController, tagName.toPascalCase());
                    } else {
                        this.logger.debug(DEBUG_addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND, operationId);
                        // If it is not defined: create a stub if the flag is set.
                        if (provideStubs) {
                            this.createStubFromSpec({path: operation.path, method: operation.method});
                        } else {
                            this.logger.warn(WARN_addRoutesFromSpecification_CONTROLLERFUNCTIONNOTFOUND, operationId);
                        }
                    }
                })
            }).catch((error: NodeJS.ErrnoException) => {
                // If the module belonging to a specific tag (controller) isn't found: create a stub if the flag is set.
                if (error.code === 'MODULE_NOT_FOUND') {
                    this.logger.debug(DEBUG_addRoutesFromSpecification_IMPORTMODULENOTFOUND, tagName.toPascalCase());
                    if (provideStubs) {
                        this.createStubFromSpec(operationMapping);
                    } else {
                        this.logger.warn(WARN_addRoutesFromSpecification_IMPORTMODULENOTFOUND, tagName.toPascalCase());
                    }
                } else {
                    this.logger.error(ERROR_addRoutesFromSpecification_IMPORTERROR, error.message)
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

    private mapToRouter(path: string, method: PossibleMethod, controllerFunction: () => void, controllerName: string): void {
        path = path.replace(/{/g, ':').replace(/}/g, '');
        controllerName = controllerName ? controllerName : '';
        switch (method) {
            case 'get': {
                this.get(path, controllerFunction);
                this.logger.info(INFO_mapToRouter_MAPPED, method, path, controllerName);
                break;
            }
            case 'post': {
                this.post(path, controllerFunction);
                this.logger.info(INFO_mapToRouter_MAPPED, method, path, controllerName);
                break;
            }
            case 'put': {
                this.put(path, controllerFunction);
                this.logger.info(INFO_mapToRouter_MAPPED, method, path, controllerName);
                break;
            }
            case 'patch': {
                this.patch(path, controllerFunction);
                this.logger.info(INFO_mapToRouter_MAPPED, method, path, controllerName);
                break;
            }
            case 'delete': {
                this.delete(path, controllerFunction);
                this.logger.info(INFO_mapToRouter_MAPPED, method, path, controllerName);
                break;
            }
            default: {
                this.logger.fatal(FATAL_mapToRouter_INVALIDMETHOD, method);
                throw new Error(FATAL_mapToRouter_INVALIDMETHOD + ' ' + method);
            }
        }
        return;
    }

    private mapOperationsByTag(paths: Paths): OperationTagMapping {
        const mapping: OperationTagMapping = {};
        const pathKeys = Object.keys(paths);
        pathKeys.map((pathKey) => {
            const apiPath = paths[pathKey];
            const methods = <PossibleMethod[]> Object.keys(apiPath);
            methods.forEach((methodName: PossibleMethod) => {
                const operation = <Operation> apiPath[methodName];

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

export interface IRouterOptions extends Router.IRouterOptions {
    logger: Logger;
}

interface ReadSpecificationOpts {
    controllerBasePath?: string;
    validateSpecification?: boolean;
    provideStubs?: boolean;
}

interface OperationTagMapping {
    [tag: string]: OperationMapping;
}

interface OperationMapping {
    [operationId: string]: {
        path: string;
        method: PossibleMethod;
        operationSpec: Operation;
    }
}

export interface Specification {
    paths: Paths;
    [x: string]: any;
}

interface Paths {
    [path: string]: Path;
}

interface Path {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    patch?: Operation;
    delete?: Operation;
}

interface Operation {
    operationId: string;
    tags: string[];
    [x: string]: any;
}


type PossibleMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

declare global {
    interface String {
        toPascalCase(): string;
    }
}

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
}
