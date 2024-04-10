"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransformPluginVisitor = void 0;
const core_1 = require("@babel/core");
function runTransformPluginVisitor(code, pluginConfig, transformConfig = {}) {
    return (0, core_1.transform)(code, Object.assign(Object.assign({ code: true, ast: true }, transformConfig), { plugins: [
            ...(transformConfig.plugins || []),
            function () {
                return Object.assign({ name: 'test' }, pluginConfig);
            },
        ] })) || {};
}
exports.runTransformPluginVisitor = runTransformPluginVisitor;
