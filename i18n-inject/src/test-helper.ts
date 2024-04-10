import { transform, TransformOptions } from '@babel/core';

export function runTransformPluginVisitor(code: string, pluginConfig: object, transformConfig: Partial<TransformOptions> = {}) {
    return transform(
        code,
        {
            code: true,
            ast: true,
            ...transformConfig,
            plugins: [
                ...(transformConfig.plugins || []),
                function () {
                    return {
                        name: 'test',
                        ...pluginConfig,
                    };
                },
            ],
        },
    ) || {};
}
