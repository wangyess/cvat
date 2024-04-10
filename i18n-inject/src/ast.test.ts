import { types as t } from '@babel/core';
import type { NodePath } from '@babel/traverse';
import { runTransformPluginVisitor } from './test-helper';

import {
    addImportDeclare,
    getCallExpressionName,
    getJSXElementAndAttrName, getJSXElementName,
    wrapObjectStringLiteralProps,
    wrapStringLiteral, wrapTemplateLiteral,
} from './ast';

describe('ast.ts', () => {
    describe('getCallExpressionName', () => {
        it.each([
            ['alert()', 'alert'],
            ['Math.floor()', 'Math.floor'],
        ])('%s => %s', ([code, expectName]) => {
            runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        CallExpression(path: NodePath<t.CallExpression>) {
                            expect(getCallExpressionName(path.node))
                                .toEqual(expectName);
                        },
                    },
                },
            );
        });
    });

    describe('getJSXElementAndAttrName', () => {
        it.each([
            { code: '<Foo title="title"/>', expected: 'Foo[title]' },
            { code: '<Foo title="title">AAA</Foo>', expected: 'Foo[title]' },
            { code: '<Foo bar="title">BBB</Foo>', expected: 'Foo[bar]' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        JSXAttribute(path: NodePath<t.JSXAttribute>) {
                            expect(getJSXElementAndAttrName(path)).toEqual(expected);
                        },
                    },
                },
                {
                    plugins: [
                        '@babel/plugin-syntax-jsx',
                    ],
                },
            );
        });
    });

    describe('getJSXElementName', () => {
        it.each([
            { code: '<Foo title="title"/>', expected: 'Foo' },
            { code: '<span title="title">AAA</span>', expected: 'span' },
            { code: '<Form.Item bar="title">BBB</Form.Item>', expected: 'Form.Item' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        JSXOpeningElement(path: NodePath<t.JSXOpeningElement>) {
                            expect(getJSXElementName(path.node)).toEqual(expected);
                        },
                    },
                },
                {
                    plugins: [
                        '@babel/plugin-syntax-jsx',
                    ],
                },
            );
        });
    });

    describe('wrapStringLiteral', () => {
        it.each([
            { code: 'foo("");', expected: 'foo( /*i18n-1*/t(""));' },
            { code: 'foo("bar");', expected: 'foo( /*i18n-1*/t("bar"));' },
        ])('$code\t => \t$expected', ({ code, expected }) => {
            // @ts-ignore
            const result = runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        CallExpression(path: NodePath<t.CallExpression>) {
                            const {
                                node: {
                                    extra,
                                    callee,
                                },
                                node,
                            } = path;
                            // add name condition in case of infinite loop
                            if (extra?.injected || (t.isIdentifier(callee) && callee.name === 't')) {
                                return;
                            }
                            // @ts-ignore
                            if (node.arguments[0] && !node.arguments[0].injected) {
                                // @ts-ignore
                                node.arguments[0].injected = true;
                                node.arguments[0] = wrapStringLiteral(
                                    node.arguments[0] as t.StringLiteral,
                                    't',
                                    // @ts-ignore
                                    () => ({ id: 1 })
                                );
                            }
                        },
                    },
                },
            );
            expect(result?.code).toEqual(expected);
        });
    });

    describe('wrapObjectStringLiteralProps', () => {
        it.each([
            {
                code: '({foo: "bar"})',
                name: 'normal',
                expectedFn(program: t.Program) {
                    // TODO use .toHaveProperty
                    const statement = program.body[0] as t.ExpressionStatement;
                    expect(statement.expression).toBeTruthy();
                    const expression = statement.expression as t.ObjectExpression;
                    expect(expression.properties.length > 0).toBeTruthy();
                    const prop0 = expression.properties[0] as t.ObjectProperty;
                    const value = prop0.value as t.CallExpression;
                    expect(t.isCallExpression(value)).toBeTruthy();
                    const callArg0 = value.arguments[0] as t.StringLiteral;
                    expect(t.isStringLiteral(callArg0)).toBeTruthy();
                    expect(callArg0.value).toEqual('bar');
                },
            },
            {
                code: '({foo: "bar", boo: 1})',
                name: 'keep number value',
                expectedFn(program: t.Program) {
                    const statement = program.body[0] as t.ExpressionStatement;
                    expect(statement.expression).toBeTruthy();
                    const expression = statement.expression as t.ObjectExpression;
                    expect(expression.properties.length > 0).toBeTruthy();
                    const prop0 = expression.properties[0] as t.ObjectProperty;
                    const value = prop0.value as t.CallExpression;
                    expect(t.isCallExpression(value)).toBeTruthy();
                    const callArg0 = value.arguments[0] as t.StringLiteral;
                    expect(t.isStringLiteral(callArg0)).toBeTruthy();
                    expect(callArg0.value).toEqual('bar');
                    {
                        const prop1 = expression.properties[1] as t.ObjectProperty;
                        expect(t.isNumericLiteral(prop1.value)).toBeTruthy();
                        // @ts-ignore
                        expect(prop1.value.value).toEqual(1);
                    }
                },
            },
        ])('$name $code', ({ code, expectedFn }) => {
            const result = runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        ObjectExpression(path: NodePath<t.ObjectExpression>) {
                            console.log('path.node', path.node);
                            wrapObjectStringLiteralProps(path.node, '$t');
                        },
                    },
                },
                {},
            );
            if (result?.ast) {
                expectedFn(result.ast.program!);
            }
        });
    });
    describe('wrapTemplateLiteral', () => {
        it.each([
            {
                code: '`foo`',
                testFn(node: t.ExpressionStatement) {
                    console.log(node);
                    expect(node).toHaveProperty('expression');
                    expect(node.expression.type).toEqual('CallExpression');
                    const call = node.expression as t.CallExpression;
                    expect(call.callee).toHaveProperty('name', 't');
                    expect(call.arguments).toHaveProperty('0.value', 'foo');
                },
            },
            {
                // eslint-disable-next-line no-template-curly-in-string
                code: '`foo${x}bar`',
                testFn(node: t.ExpressionStatement) {
                    console.log(node);
                    expect(node).toHaveProperty('expression');
                    expect(node.expression.type).toEqual('CallExpression');
                    const call = node.expression as t.CallExpression;
                    expect(call.callee).toHaveProperty('name', 't');
                    expect(call.arguments).toHaveProperty('0.value', 'foo{{x}}bar');
                },
            },
        ])('$code', ({ code, testFn }) => {
            const result = runTransformPluginVisitor(
                code,
                {
                    visitor: {
                        TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
                            console.log(path.getPathLocation());
                            const call = wrapTemplateLiteral(path.node, 't');
                            if (call) {
                                if (t.isExpressionStatement(path.parent)) {
                                    path.parent.expression = call;
                                }
                            }
                        },
                    },
                },
            );
            expect(result).toBeTruthy();
            if (result?.ast) {
                console.log(code, '\n=>\t', result.code);
                const body = result.ast.program.body as Array<any>;
                const expressStatement = body[0] as t.ExpressionStatement;
                testFn(expressStatement);
            }
        });
    });
    describe('addImportDeclare', () => {
        it('addI18nImport', () => {
            const result = runTransformPluginVisitor(
                'foo();',
                {
                    visitor: {
                        Program(path: NodePath<t.Program>) {
                            addImportDeclare(path, {
                                path: '@root/i18n',
                                functionName: 't',
                                resourceFile: 'key.raw.txt',
                                resourceRawFile: 'key.json',
                            });
                        },
                    },
                },
            );
            expect(result?.ast).toBeTruthy();
            if (result?.ast) {
                const body = result.ast.program.body as Array<any>;
                const imp = body[0] as t.ImportDeclaration;
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
