## Classes

<dl>
<dt><a href="#KoaOasRouter">KoaOasRouter</a> ⇐ <code>Router</code></dt>
<dd></dd>
</dl>

## Interfaces

<dl>
<dt><a href="#IRouterOptions">IRouterOptions</a> ⇐ <code>Router.IRouterOptions</code></dt>
<dd><p>This is a extension of the Router.IRouterOptions.</p></dd>
<dt><a href="#AddFromSpecificationOpts">AddFromSpecificationOpts</a></dt>
<dd><p>Options for adding the routes from a oas specification.</p></dd>
<dt><a href="#Specification">Specification</a></dt>
<dd><p>The oas specification as js object. (Convert it via js-yaml)</p></dd>
<dt><a href="#Specification">Specification</a></dt>
<dd><p>The oas specification as js object. (Convert it via js-yaml)</p></dd>
<dt><a href="#Paths">Paths</a></dt>
<dd><p>Representation of the oas paths.</p></dd>
<dt><a href="#Specification">Specification</a></dt>
<dd><p>The oas specification as js object. (Convert it via js-yaml)</p></dd>
<dt><a href="#Paths">Paths</a></dt>
<dd><p>Representation of the oas paths.</p></dd>
<dt><a href="#Path">Path</a></dt>
<dd><p>Representation of the oas path.</p></dd>
<dt><a href="#Operation">Operation</a></dt>
<dd><p>Representation of one operation.</p></dd>
</dl>

<a name="IRouterOptions"></a>

## IRouterOptions ⇐ <code>Router.IRouterOptions</code>
<p>This is a extension of the Router.IRouterOptions.</p>

**Kind**: global interface  
**Extends**: <code>Router.IRouterOptions</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [logger] | <code>Logger</code> | <p>A node-logger object</p> |
| [logLevel] | <code>LogLevel</code> | <p>Specifies the log level ('fatal' | 'error' | 'warn' | 'info' | 'debug') will be ignored if logger is specified</p> |

<a name="AddFromSpecificationOpts"></a>

## AddFromSpecificationOpts
<p>Options for adding the routes from a oas specification.</p>

**Kind**: global interface  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [controllerBasePath] | <code>string</code> | <code>&quot;&#x27;../controller&#x27;&quot;</code> | <p>The base path in which the controllers can be found.</p> |
| [validateSpecification] | <code>boolean</code> | <code>true</code> | <p>Specifies if the oas-validator should be used.</p> |
| [provideStubs] | <code>boolean</code> | <code>true</code> | <p>Specifies if stubs should be provided.</p> |

<a name="Specification"></a>

## Specification
<p>The oas specification as js object. (Convert it via js-yaml)</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| paths | [<code>Paths</code>](#Paths) | <p>Object that hold all the paths.</p> |
| [x] | <code>any</code> | <p>Different other values.</p> |

<a name="Specification"></a>

## Specification
<p>The oas specification as js object. (Convert it via js-yaml)</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| paths | [<code>Paths</code>](#Paths) | <p>Object that hold all the paths.</p> |
| [x] | <code>any</code> | <p>Different other values.</p> |

<a name="Paths"></a>

## Paths
<p>Representation of the oas paths.</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pathName | [<code>Path</code>](#Path) | <p>Index type! Specifies one path object of oas. PathName is a string that specifies the path.</p> |

<a name="Specification"></a>

## Specification
<p>The oas specification as js object. (Convert it via js-yaml)</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| paths | [<code>Paths</code>](#Paths) | <p>Object that hold all the paths.</p> |
| [x] | <code>any</code> | <p>Different other values.</p> |

<a name="Paths"></a>

## Paths
<p>Representation of the oas paths.</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| pathName | [<code>Path</code>](#Path) | <p>Index type! Specifies one path object of oas. PathName is a string that specifies the path.</p> |

<a name="Path"></a>

## Path
<p>Representation of the oas path.</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [get] | [<code>Operation</code>](#Operation) | <p>Specifies the get operation of the oas path.</p> |
| [post] | [<code>Operation</code>](#Operation) | <p>Specifies the post operation of the oas path.</p> |
| [put] | [<code>Operation</code>](#Operation) | <p>Specifies the put operation of the oas path.</p> |
| [patch] | [<code>Operation</code>](#Operation) | <p>Specifies the patch operation of the oas path.</p> |
| [delete] | [<code>Operation</code>](#Operation) | <p>Specifies the delete operation of the oas path.</p> |

<a name="Operation"></a>

## Operation
<p>Representation of one operation.</p>

**Kind**: global interface  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| operationId | <code>string</code> | <p>Specifies the oas operationId.</p> |
| tags | <code>Array.&lt;string&gt;</code> | <p>Specifies an array of oas tags.</p> |
| [x] | <code>string</code> | <p>Additional values.</p> |

<a name="KoaOasRouter"></a>

## KoaOasRouter ⇐ <code>Router</code>
**Kind**: global class  
**Extends**: <code>Router</code>  

* [KoaOasRouter](#KoaOasRouter) ⇐ <code>Router</code>
    * [new KoaOasRouter()](#new_KoaOasRouter_new)
    * _instance_
        * [.addRoutesFromSpecification(specification, [opts])](#KoaOasRouter+addRoutesFromSpecification) ⇒ <code>Promise.&lt;any&gt;</code>
    * _static_
        * [.KoaOasRouter](#KoaOasRouter.KoaOasRouter)
            * [new KoaOasRouter([opt])](#new_KoaOasRouter.KoaOasRouter_new)

<a name="new_KoaOasRouter_new"></a>

### new KoaOasRouter()
<p>A child class of the koa-router. It extends the koa-router by some features that can be used with oas.</p>

<a name="KoaOasRouter+addRoutesFromSpecification"></a>

### koaOasRouter.addRoutesFromSpecification(specification, [opts]) ⇒ <code>Promise.&lt;any&gt;</code>
<p>Adds the routes from a specification to the router. As implementation it uses the controllers from the opts.controllerBasePath (default = '../controller').
The name of the controller file is the first tag of a operation in pascal case.
The name of the function in the controller file is the operationId.
The specification will be validated by oas-validator. You can opt this out with opts.validateSpecification.
If a implementation is not found this function will add a stub for that. You can opt this out with opts.provideStubs.</p>

**Kind**: instance method of [<code>KoaOasRouter</code>](#KoaOasRouter)  

| Param | Type |
| --- | --- |
| specification | [<code>Specification</code>](#Specification) | 
| [opts] | [<code>AddFromSpecificationOpts</code>](#AddFromSpecificationOpts) | 

<a name="KoaOasRouter.KoaOasRouter"></a>

### KoaOasRouter.KoaOasRouter
**Kind**: static class of [<code>KoaOasRouter</code>](#KoaOasRouter)  
<a name="new_KoaOasRouter.KoaOasRouter_new"></a>

#### new KoaOasRouter([opt])
<p>Creates an instance of KoaOasRouter.</p>


| Param | Type |
| --- | --- |
| [opt] | [<code>IRouterOptions</code>](#IRouterOptions) | 

