var esprima = require('esprima'),
    fs = require('fs'),
    program = require('commander'),
    escodegen = require('escodegen'),
    g_id = 1;

function getNextUniqueId() { return g_id++; }
function resetUniqueId() { g_id = 1; }
function iCombinator(x) { return x; }

function privateVariableName(name) {
    return '\u02c0' + name;
}
function uniqueVariableName(name) {
    return privateVariableName(name) + '\u02c0' + getNextUniqueId();
}

function traverse(ast, visitor, arrAncestors) {
    if (!ast) { return; }
    arrAncestors = arrAncestors || [];
    visitor = visitor || iCombinator;

    ast = visitor(ast, arrAncestors);

    arrAncestors.push(ast);

    switch (ast.type) {
        case 'BlockStatement':
        case 'Program':
        case 'ClassBody':
            for (var idx = 0; idx < ast.body.length; ++idx) {
                ast.body[idx] = traverse(ast.body[idx], visitor, arrAncestors);
            }
            break;
        case 'ExpressionStatement':
            ast.expression = traverse(ast.expression, visitor, arrAncestors);
            break;
        case 'ConditionalExpression':
        case 'IfStatement':
            ast.test = traverse(ast.test, visitor, arrAncestors);
            ast.consequent = traverse(ast.consequent, visitor, arrAncestors);
            ast.alternate = traverse(ast.alternate, visitor, arrAncestors);
            break;
        case 'VariableDeclaration':
            for (var idx = 0; idx < ast.declarations.length; ++idx) {
                ast.declarations[idx] = traverse(ast.declarations[idx], visitor, arrAncestors);
            }
            break;
        case 'VariableDeclarator':
            ast.id = traverse(ast.id, visitor, arrAncestors);
            ast.init = traverse(ast.init, visitor, arrAncestors);
            break;
        case 'LogicalExpression':
        case 'AssignmentExpression':
        case 'BinaryExpression':
        case 'ComprehensionBlock':
            ast.left = traverse(ast.left, visitor, arrAncestors);
            ast.right = traverse(ast.right, visitor, arrAncestors);
            break;
        case 'WhileStatement':
        case 'DoWhileStatement':
            ast.test = traverse(ast.test, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'ObjectExpression':
            for (var idx = 0; idx < ast.properties.length; ++idx) {
                ast.properties[idx].value = traverse(ast.properties[idx].value, visitor, arrAncestors);
            }
            break;
        case 'Property':
            ast.key = traverse(ast.key, visitor, arrAncestors);
            ast.value = traverse(ast.value, visitor, arrAncestors);
            break;
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
            for (var idx = 0; idx < ast.params.length; ++idx) {
                ast.params[idx] = traverse(ast.params[idx], visitor, arrAncestors);
            }
            for (var idx = 0; idx < ast.defaults.length; ++idx) {
                ast.defaults[idx] = traverse(ast.defaults[idx], visitor, arrAncestors);
            }
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'LabeledStatement':
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'WithStatement':
            ast.object = traverse(ast.object, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'SwitchStatement':
            ast.discriminant = traverse(ast.discriminant, visitor, arrAncestors);
            for (var idx = 0; idx < ast.cases.length; ++idx) {
                ast.cases[idx] = traverse(ast.cases[idx], visitor, arrAncestors);
            }
            break;
        case 'SwitchCase':
            ast.test = traverse(ast.test, visitor, arrAncestors);
            for (var idx = 0; idx < ast.consequent.length; ++idx) {
                ast.consequent[idx] = traverse(ast.consequent[idx], visitor, arrAncestors);
            }
            break;
        case 'TryStatement':
            ast.block = traverse(ast.block, visitor, arrAncestors);
            ast.handler = traverse(ast.handler, visitor, arrAncestors);
            for (var idx = 0; idx < ast.guardedHandlers.length; ++idx) {
                ast.guardedHandlers[idx] = traverse(ast.guardedHandlers[idx], visitor, arrAncestors);
            }
            ast.finalizer = traverse(ast.finalizer, visitor, arrAncestors);
            break;
        case 'ForStatement':
            ast.init = traverse(ast.init, visitor, arrAncestors);
            ast.test = traverse(ast.test, visitor, arrAncestors);
            ast.update = traverse(ast.update, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'ForInStatement':
        case 'ForOfStatement':
            ast.left = traverse(ast.left, visitor, arrAncestors);
            ast.right = traverse(ast.right, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'LetStatement':
        case 'LetExpression':
            for (var idx = 0; idx < ast.head.length; ++idx) {
                ast.head[idx].id = traverse(ast.head[idx].id, visitor, arrAncestors);
                ast.head[idx].init = traverse(ast.head[idx].init, visitor, arrAncestors);
            }
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'ArrayExpression':
            for (var idx = 0; idx < ast.elements.length; ++idx) {
                ast.elements[idx] = traverse(ast.elements[idx], visitor, arrAncestors);
            }
            break;
        case 'SequenceExpression':
            for (var idx = 0; idx < ast.expressions.length; ++idx) {
                ast.expressions[idx] = traverse(ast.expressions[idx], visitor, arrAncestors);
            }
            break;
        case 'YieldExpression':
        case 'UpdateExpression':
        case 'ThrowStatement':
        case 'UnaryExpression':
        case 'ReturnStatement':
        case 'AwaitExpression':
        case 'SpreadElement':
            ast.argument = traverse(ast.argument, visitor, arrAncestors);
            break;
        case 'NewExpression':
        case 'CallExpression':
            ast.callee = traverse(ast.callee, visitor, arrAncestors);
            for (var idx = 0; idx < ast.arguments.length; ++idx) {
                ast.arguments[idx] = traverse(ast.arguments[idx], visitor, arrAncestors);
            }
            break;
        case 'MemberExpression':
            ast.object = traverse(ast.object, visitor, arrAncestors);
            ast.property = traverse(ast.property, visitor, arrAncestors);
            break;
        case 'GeneratorExpression':
        case 'ComprehensionExpression':
            ast.body = traverse(ast.body, visitor, arrAncestors);
            for (var idx = 0; idx < ast.blocks.length; ++idx) {
                ast.blocks[idx] = traverse(ast.blocks[idx], visitor, arrAncestors);
            }
            ast.filter = traverse(ast.filter, visitor, arrAncestors);
            break;
        case 'ObjectPattern':
            for (var idx = 0; idx < ast.properties.length; ++idx) {
                ast.properties[idx].key = traverse(ast.properties[idx].key, visitor, arrAncestors);
                ast.properties[idx].value = traverse(ast.properties[idx].value, visitor, arrAncestors);
            }
            break;
        case 'ArrayPattern':
            for (var idx = 0; idx < ast.elements.length; ++idx) {
                ast.elements[idx] = traverse(ast.elements[idx], visitor, arrAncestors);
            }
            break;
        case 'CatchClause':
            ast.param = traverse(ast.param, visitor, arrAncestors);
            ast.guard = traverse(ast.guard, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'ClassDeclaration':
        case 'ClassExpression':
            ast.superClass = traverse(ast.superClass, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'ExportDeclaration':
            ast.declaration = traverse(ast.declaration, visitor, arrAncestors);
            for (var idx = 0; idx < ast.specifiers.length; ++idx) {
                ast.specifiers[idx] = traverse(ast.specifiers[idx], visitor, arrAncestors);
            }
            ast.source = traverse(ast.source, visitor, arrAncestors);
            break;
        case 'ExportSpecifier':
        case 'ImportSpecifier':
            ast.id = traverse(ast.id, visitor, arrAncestors);
            break;
        case 'ImportDeclaration':
            for (var idx = 0; idx < ast.specifiers.length; ++idx) {
                ast.specifiers[idx] = traverse(ast.specifiers[idx], visitor, arrAncestors);
            }
            ast.source = traverse(ast.source, visitor, arrAncestors);
            break;
        case 'MethodDefinition':
            ast.key = traverse(ast.key, visitor, arrAncestors);
            ast.value = traverse(ast.value, visitor, arrAncestors);
            break;
        case 'ModuleDeclaration':
            ast.id = traverse(ast.id, visitor, arrAncestors);
            ast.source = traverse(ast.source, visitor, arrAncestors);
            ast.body = traverse(ast.body, visitor, arrAncestors);
            break;
        case 'TaggedTemplateExpression':
            ast.tag = traverse(ast.tag, visitor, arrAncestors);
            ast.quasi = traverse(ast.quasi, visitor, arrAncestors);
            break;
        case 'TemplateElement':
            ast.value.raw = traverse(ast.value.raw, visitor, arrAncestors);
            ast.value.cooked = traverse(ast.value.cooked, visitor, arrAncestors);
            ast.tail = traverse(ast.tail, visitor, arrAncestors);
            break;
        case 'TemplateLiteral':
            for (var idx = 0; idx < ast.quasis.length; ++idx) {
                ast.quasis[idx] = traverse(ast.quasis[idx], visitor, arrAncestors);
            }
            for (var idx = 0; idx < ast.expressions.length; ++idx) {
                ast.expressions[idx] = traverse(ast.expressions[idx], visitor, arrAncestors);
            }
            break;

        case 'ThisExpression':
        case 'DebuggerStatement':
        case 'ContinueStatement':
        case 'BreakStatement':
        case 'Identifier':
        case 'Literal':
        case 'ClassHeritage':
        case 'EmptyStatement':
        case 'ExportBatchSpecifier':
        default:
            break;
    }

    arrAncestors.pop();

    return ast;
}

function parseCodeSnippet(codeSnippet) {
    var ast = esprima.parse(codeSnippet, { raw: true, tokens: true, range: true, comment: true });
    return ast.body || [];
}

function isInAsyncGenerator(arrAncestors) {
    // search backward for innermost function
    for (var idx = arrAncestors.length-1; idx >= 0; --idx) {
        var astNode = arrAncestors[idx];
        if (astNode.type === 'FunctionExpression' || astNode.type === 'FunctionDeclaration') {
            return Boolean(astNode.async && astNode.generator);
        }
    }
    return false;
}

function rewriteAsyncYield(ast, arrAncestors) {
    if (!ast) { return; }
    if (ast.type === 'YieldExpression' &&
        isInAsyncGenerator(arrAncestors) &&
        !ast.ignore)
    {
        var valueName = privateVariableName('value');
        var observerName = privateVariableName('observer');
        var setValueName = privateVariableName('setValue');

        var result = parseCodeSnippet(
'function *_() {(\n\
    '+valueName+' = ('+observerName+' && '+observerName+'.next && '+observerName+'.next({ done: false, value: null })),\n\
    ('+valueName+' && '+valueName+'.isPromise ?\n\
        yield '+valueName+'.then('+setValueName+') :\n\
        null),\n\
    '+valueName+'\n\
)}'
        )[0].body.body[0];
        var call = result.expression.expressions[0].right.right;
        call.arguments[0].properties[1].value = ast.argument;
        var yieldToIgnore = result.expression.expressions[1].consequent;
        yieldToIgnore.ignore = true;
        return result.expression;
    }
    return ast;
}

function __addPromiseImplementation(astProgram) {
    if (astProgram.hasPromiseImplementation) { return; }
    var runAsyncGeneratorName = privateVariableName('runAsyncGenerator');
    var astPromiseImplementation = parseCodeSnippet(
'function Promise() {\
    this.arrFulfilledActions = [];\
    this.arrRejectedActions = [];\
    this.then = this.then.bind(this);\
    this.fulfill = this.fulfill.bind(this);\
    this.reject = this.reject.bind(this);\
    this.executeActions = this.executeActions.bind(this);\
}\
\
Promise.prototype = {\
    isPromise: true,\
    isFulfilled: false,\
    isRejected: false,\
    executeTimeout: 0,\
    value: null,\
    defer: setImmediate || setTimeout,\
    adoptState: function(otherPromise) {\
        var arrFulfilledActions = this.arrFulfilledActions;\
        var arrRejectedActions = this.arrRejectedActions;\
        for (var key in this) {\
            if (this.hasOwnProperty(key)) {\
                delete this[key];\
            }\
        }\
        this.__proto__ = otherPromise;\
        for (var idx = 0; idx < arrFulfilledActions.length; ++idx) {\
            this.arrFulfilledActions.push(arrFulfilledActions[idx]);\
        }\
        for (var idx = 0; idx < arrRejectedActions.length; ++idx) {\
            this.arrRejectedActions.push(arrRejectedActions[idx]);\
        }\
    },\
    executeActions: function() {\
        if ((!this.isFulfilled && !this.isRejected) || this.arrFulfilledActions.length === 0) {\
            this.executeTimeout = 0;\
            return;\
        }\
        var fulfilledAction = this.arrFulfilledActions.shift();\
        var rejectedAction = this.arrRejectedActions.shift();\
        var action = this.isFulfilled ? fulfilledAction : rejectedAction;\
        try {\
            var result = action(this.value);\
            if (typeof result !== "undefined") {\
                this.fulfill(result);\
            }\
        } catch (error) {\
            this.reject(error);\
        }\
        this.executeTimeout = this.defer(this.executeActions);\
    },\
    then: function(onFulfilled, onRejected) {\
        onFulfilled = typeof onFulfilled === "function" ? onFulfilled : this.noop;\
        onRejected = typeof onRejected === "function" ? onRejected : this.noop;\
        this.arrFulfilledActions.push(onFulfilled);\
        this.arrRejectedActions.push(onRejected);\
        if ((this.isFulfilled || this.isRejected) && this.executeTimeout === 0) {\
            this.executeTimeout = this.defer(this.executeActions);\
        }\
        return this;\
    },\
    fulfill: function(value) {\
        if (this === value) {\
            this.reject(new TypeError("Can\'t fulfill promise with itself"));\
            return this;\
        }\
        if (value && value.isPromise) {\
            this.adoptState(value);\
            return;\
        }\
        try {\
            if (value && typeof value === "object") {\
                var then = value.then;\
                if (typeof then === "function") {\
                    then.call(value, this.fulfill, this.reject);\
                    return;\
                }\
            } else if (typeof value === "function") {\
                value(this.fulfill, this.reject);\
                return;\
            }\
        } catch (error) {\
            this.reject(error);\
            return;\
        }\
        this.isFulfilled = true;\
        this.isRejected = false;\
        this.value = value;\
        if (!this.executeTimeout) {\
            this.executeTimeout = this.defer(this.executeActions);\
        }\
    },\
    reject: function(value) {\
        this.isFulfilled = false;\
        this.isRejected = true;\
        this.value = value;\
        if (!this.executeTimeout) {\
            this.executeTimeout = this.defer(this.executeActions);\
        }\
    }\
};\
\
function '+runAsyncGeneratorName+'(asyncGenerator) {\
    var generatorArgs = Array.prototype.slice.call(arguments, 1), \
        observer = generatorArgs[1],\
        iterator = asyncGenerator.apply(null, generatorArgs),\
        isFinished = false,\
        response;\
\
    function next(error, result) {\
        if (isFinished) return;\
        try {\
            response = error ? iterator.throw(error) : iterator.next(result);\
        } catch (error) {\
            observer && observer.throw && observer.throw(error);\
            return;\
        }\
        isFinished = response.done;\
        if (response && !response.done) {\
            if (response.value && response.value.isPromise) {\
                response.value.then(success, failure);\
            } else {\
                next(undefined, response);\
            }\
        } else {\
            next(undefined, response);\
        }\
    }\
\
    function success(result) { next(undefined, result); }\
    function failure(error) { next(error, undefined); }\
    next();\
    return {\
        dispose: function dispose() {\
            isFinished = true;\
        }\
    }\
}'
    );
    astProgram.body = astPromiseImplementation.concat(astProgram.body);
    astProgram.hasPromiseImplementation = true;
}

function __addObservableImplementation(astProgram) {
    if (astProgram.hasObservableImplementation) { return; }
    var astObservableImplementation = parseCodeSnippet(
'function Observable(subscribe) {\
    this.subscribe = subscribe;\
}\
\
Observable.prototype = {\
    "@@observe": function observe(iterator) {\
        return this.subscribe(iterator);\
    }\
};'
    );
    astProgram.body = astObservableImplementation.concat(astProgram.body);
    astProgram.hasObservableImplementation = true;
}

function rewriteAsyncAwait(ast, arrAncestors) {
    if (!ast) { return; }
    var observerName = privateVariableName('observer');
    var valueName = privateVariableName('value');
    var setValueName = privateVariableName('setValue');
    switch (ast.type) {
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
            if (ast.async) {
                __addPromiseImplementation(arrAncestors[0]);
                __addObservableImplementation(arrAncestors[0]);
                ast.isAsync = true;
                ast.async = false;
                ast.generator = true;
                ast.params.unshift({
                    type: 'Identifier',
                    name: observerName
                });
                ast.body.body = parseCodeSnippet(
'var '+valueName+';\n\
function '+setValueName+'(value){'+valueName+'=value}\n'
                ).concat(ast.body.body)
            }
            break;
        case 'AwaitExpression':
            var argumentCode = escodegen.generate(ast.argument);
            // wrap this in a temporary generator function so the yield is legal
            ast.argument = parseCodeSnippet(
'function *_() {(\n\
    '+valueName+' = '+argumentCode+',\n\
    ('+valueName+' && '+valueName+'.isPromise ?\n\
        yield '+valueName+'.then('+setValueName+') :\n\
        null),\n\
    '+valueName+'\n\
)}'
            )[0].body.body[0].expression;
            return ast.argument;
    }
    return ast;
}

function rewriteForOn(ast, arrAncestors) {
    if (!ast) { return; }
    if (ast.type === 'ForOnStatement') {
        var declarations = ast.left.declarations;
        var loopVariable = declarations[declarations.length-1]

        var loopIterationPromiseName = uniqueVariableName('loopIterationPromise');
        var resumeObservablePromiseName = uniqueVariableName('resumeObservablePromise');
        var disposableName = uniqueVariableName('disposable');
        var tupleName = uniqueVariableName('tuple');

        // Adding a yield 0 statement makes esprima not freak out about generators without yields.
        // Naming it _ makes esprima not freak out about unnamed generators.
        var result = parseCodeSnippet(
'async function *_() {\
    yield 0;\
    var '+loopIterationPromiseName+' = new Promise;\
    var '+resumeObservablePromiseName+' = new Promise;\
    var '+disposableName+' = REPLACEME["@@observe"]({\
        next: function(tuple) {\
            '+loopIterationPromiseName+'.fulfill(tuple);\
            '+resumeObservablePromiseName+' = new Promise;\
            return '+resumeObservablePromiseName+';\
        },\
        error: function(error) {\
            return '+loopIterationPromiseName+'.reject(error);\
        }\
    });\
    try {\
        while (true) {\
            '+resumeObservablePromiseName+'.fulfill({ done: false });\
            var '+tupleName+' = await '+loopIterationPromiseName+';\
            '+tupleName+'.value;\
            if ('+tupleName+'.done) {\
                break;\
            }\
            '+loopIterationPromiseName+' = new Promise;\
        }\
    } catch (e) {\
        '+disposableName+'.dispose();\
        throw e;\
    }\
}'
        );

        // remove yield 0
        result[0].body.body.splice(0, 1);

        // get loop init
        var disposableInit = result[0].body.body[2].declarations[0];
        disposableInit.init.callee.object = ast.right;

        // insert declarations
        var whileStatement = result[0].body.body[3].block.body[0];
        var tupleValue = whileStatement.body.body.splice(2, 1, ast.left);
        loopVariable.init = tupleValue[0].expression;

        // insert loop body
        whileStatement.body.body.splice(
            whileStatement.body.body.length-1, 0, ast.body
        )

        return result[0].body;
    }
    return ast;
}

function rewriteAsyncGenerators(ast, arrAncestors) {
    if (!ast) { return; }
    switch (ast.type) {
        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
            if (ast.isAsync) {
                var name;
                if (ast.id) {
                    name = ast.id.name;
                    ast.id.name = uniqueVariableName(ast.id.name + 'Generator');
                }

                var runAsyncGeneratorName = privateVariableName('runAsyncGenerator');
                var observerName = privateVariableName('observer');

                ast.body.body.push(parseCodeSnippet(
                    '('+observerName+' && '+observerName+'.next && '+observerName+'.next({ done: true }));'
                )[0]);
                var astCode = escodegen.generate(ast);
                // we're implicitly passing along the observer
                var astWrapped = parseCodeSnippet(
'function ' + name + '() { \
    var generatorArgs = Array.prototype.slice.call(arguments, 0); \
    generatorArgs.unshift(null); /* placeholder for observers */ \
    generatorArgs.unshift(' + astCode + '); \
    return new Observable(function subscribe(observer) {\
        if (typeof observer === "function") {\
            observer = { next: observer };\
        }\
        generatorArgs[1] = observer;\
        return '+runAsyncGeneratorName+'.apply(null, generatorArgs);\
    });\
}'
                )[0];
                return astWrapped;
            }
    }
    return ast;
}

function prettyPrint(ast, arrAncestors) {
    var indent = arrAncestors.map(function() { return ' '; }).join('');
    console.log(indent + ast.type);
    return ast;
}

function getRewrittenAst(filename) {
    var contents = fs.readFileSync(filename);
    var ast = esprima.parse(contents, { raw: true, tokens: true, range: true, comment: true });

    resetUniqueId();

    // Rewrite yield first so that when we replace await with yield nothing breaks.
    traverse(ast, rewriteForOn);
    traverse(ast, rewriteAsyncYield);
    traverse(ast, rewriteAsyncAwait);
    traverse(ast, rewriteAsyncGenerators);

    return ast;
}

function getRewrittenFileContents(filename) {
    return escodegen.generate(getRewrittenAst(filename));
}

try {

    program.
        command('exec <filename>').
        description('Rewrite and execute the given JS file').
        action(function(filename) {
            var code = getRewrittenFileContents(filename);
            eval(code);
        });

    program.
        command('print <filename>').
        description('Rewrite and print the contents of the given JS file').
        action(function(filename) {
            var code = getRewrittenFileContents(filename);
            console.log(code);
        });

    program.
        command('print-ast <filename>').
        description('Rewrite and print the abstract syntax tree of the given JS file').
        action(function(filename) {
            var ast = getRewrittenAst(filename);
            traverse(ast, prettyPrint);
        });

    program.parse(process.argv);

    if (!program.args.length) program.help();

} catch (e) {
    console.error(e.stack);
}

