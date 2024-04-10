"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const test_helper_1 = require("./test-helper");
const ast_1 = require("./ast");
describe('ast.ts', () => {
    describe('getCallExpressionName', () => {
        it.each([
            ['alert()', 'alert'],
            ['Math.floor()', 'Math.floor'],
        ])('%s => %s', ([code, expectName]) => {
            (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    CallExpression(path) {
                        expect((0, ast_1.getCallExpressionName)(path.node))
                            .toEqual(expectName);
                    },
                },
            });
        });
    });
    describe('getJSXElementAndAttrName', () => {
        it.each([
            { code: '<Foo title="title"/>', expected: 'Foo[title]' },
            { code: '<Foo title="title">AAA</Foo>', expected: 'Foo[title]' },
            { code: '<Foo bar="title">BBB</Foo>', expected: 'Foo[bar]' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    JSXAttribute(path) {
                        expect((0, ast_1.getJSXElementAndAttrName)(path)).toEqual(expected);
                    },
                },
            }, {
                plugins: [
                    '@babel/plugin-syntax-jsx',
                ],
            });
        });
    });
    describe('getJSXElementName', () => {
        it.each([
            { code: '<Foo title="title"/>', expected: 'Foo' },
            { code: '<span title="title">AAA</span>', expected: 'span' },
            { code: '<Form.Item bar="title">BBB</Form.Item>', expected: 'Form.Item' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    JSXOpeningElement(path) {
                        expect((0, ast_1.getJSXElementName)(path.node)).toEqual(expected);
                    },
                },
            }, {
                plugins: [
                    '@babel/plugin-syntax-jsx',
                ],
            });
        });
    });
    describe('wrapStringLiteral', () => {
        it.each([
            { code: 'foo("");', expected: 'foo( /*i18n-1*/t(""));' },
            { code: 'foo("bar");', expected: 'foo( /*i18n-1*/t("bar"));' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            // @ts-ignore
            const result = (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    CallExpression(path) {
                        const { node: { extra, callee, }, node, } = path;
                        // add name condition in case of infinite loop
                        if ((extra === null || extra === void 0 ? void 0 : extra.injected) || (core_1.types.isIdentifier(callee) && callee.name === 't')) {
                            return;
                        }
                        // @ts-ignore
                        if (node.arguments[0] && !node.arguments[0].injected) {
                            // @ts-ignore
                            node.arguments[0].injected = true;
                            node.arguments[0] = (0, ast_1.wrapStringLiteral)(node.arguments[0], 't', 
                            // @ts-ignore
                            () => ({ id: 1 }));
                        }
                    },
                },
            });
            expect(result === null || result === void 0 ? void 0 : result.code).toEqual(expected);
        });
    });
    describe('wrapObjectStringLiteralProps', () => {
        it.each([
            {
                code: '({foo: "bar"})',
                name: 'normal',
                expectedFn(program) {
                    // TODO use .toHaveProperty
                    const statement = program.body[0];
                    expect(statement.expression).toBeTruthy();
                    const expression = statement.expression;
                    expect(expression.properties.length > 0).toBeTruthy();
                    const prop0 = expression.properties[0];
                    const value = prop0.value;
                    expect(core_1.types.isCallExpression(value)).toBeTruthy();
                    const callArg0 = value.arguments[0];
                    expect(core_1.types.isStringLiteral(callArg0)).toBeTruthy();
                    expect(callArg0.value).toEqual('bar');
                },
            },
            {
                code: '({foo: "bar", boo: 1})',
                name: 'keep number value',
                expectedFn(program) {
                    const statement = program.body[0];
                    expect(statement.expression).toBeTruthy();
                    const expression = statement.expression;
                    expect(expression.properties.length > 0).toBeTruthy();
                    const prop0 = expression.properties[0];
                    const value = prop0.value;
                    expect(core_1.types.isCallExpression(value)).toBeTruthy();
                    const callArg0 = value.arguments[0];
                    expect(core_1.types.isStringLiteral(callArg0)).toBeTruthy();
                    expect(callArg0.value).toEqual('bar');
                    {
                        const prop1 = expression.properties[1];
                        expect(core_1.types.isNumericLiteral(prop1.value)).toBeTruthy();
                        // @ts-ignore
                        expect(prop1.value.value).toEqual(1);
                    }
                },
            },
        ])('$name $code', ({ code, expectedFn }) => {
            const result = (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    ObjectExpression(path) {
                        console.log('path.node', path.node);
                        (0, ast_1.wrapObjectStringLiteralProps)(path.node, '$t');
                    },
                },
            }, {});
            if (result === null || result === void 0 ? void 0 : result.ast) {
                expectedFn(result.ast.program);
            }
        });
    });
    describe('wrapTemplateLiteral', () => {
        it.each([
            {
                code: '`foo`',
                testFn(node) {
                    console.log(node);
                    expect(node).toHaveProperty('expression');
                    expect(node.expression.type).toEqual('CallExpression');
                    const call = node.expression;
                    expect(call.callee).toHaveProperty('name', 't');
                    expect(call.arguments).toHaveProperty('0.value', 'foo');
                },
            },
            {
                // eslint-disable-next-line no-template-curly-in-string
                code: '`foo${x}bar`',
                testFn(node) {
                    console.log(node);
                    expect(node).toHaveProperty('expression');
                    expect(node.expression.type).toEqual('CallExpression');
                    const call = node.expression;
                    expect(call.callee).toHaveProperty('name', 't');
                    expect(call.arguments).toHaveProperty('0.value', 'foo{{x}}bar');
                },
            },
        ])('$code', ({ code, testFn }) => {
            const result = (0, test_helper_1.runTransformPluginVisitor)(code, {
                visitor: {
                    TemplateLiteral(path) {
                        console.log(path.getPathLocation());
                        const call = (0, ast_1.wrapTemplateLiteral)(path.node, 't');
                        if (call) {
                            if (core_1.types.isExpressionStatement(path.parent)) {
                                path.parent.expression = call;
                            }
                        }
                    },
                },
            });
            expect(result).toBeTruthy();
            if (result === null || result === void 0 ? void 0 : result.ast) {
                console.log(code, '\n=>\t', result.code);
                const body = result.ast.program.body;
                const expressStatement = body[0];
                testFn(expressStatement);
            }
        });
    });
    describe('addImportDeclare', () => {
        it('addI18nImport', () => {
            const result = (0, test_helper_1.runTransformPluginVisitor)('foo();', {
                visitor: {
                    Program(path) {
                        (0, ast_1.addImportDeclare)(path, {
                            path: '@root/i18n',
                            functionName: 't',
                            resourceFile: 'key.raw.txt',
                            resourceRawFile: 'key.json',
                        });
                    },
                },
            });
            expect(result === null || result === void 0 ? void 0 : result.ast).toBeTruthy();
            if (result === null || result === void 0 ? void 0 : result.ast) {
                const body = result.ast.program.body;
                const imp = body[0];
                // console.log(imp.specifiers[0]);
                expect(imp).toHaveProperty('type', 'ImportDeclaration');
                expect(imp).toHaveProperty('source.value', '@root/i18n');
                expect(imp).toHaveProperty('specifiers.0.local.name', 't');
                expect(imp).toHaveProperty('specifiers.0.local.type', 'Identifier');
                expect(imp).toHaveProperty('specifiers.0.imported.name', 't');
                expect(imp).toHaveProperty('specifiers.0.imported.type', 'Identifier');
            }
        });
    });
});
