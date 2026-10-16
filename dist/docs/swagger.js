"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const registry_1 = require("./registry");
require("./auth.swagger");
const setupSwagger = (app) => {
    const generator = new zod_to_openapi_1.OpenApiGeneratorV3(registry_1.registry.definitions);
    const document = generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'KiddyBD API',
            description: 'API documentation for KiddyBD e-commerce platform',
        },
        servers: [{ url: '/api/v1' }]
    });
    // Serve swagger docs if not in production
    if (process.env.NODE_ENV !== 'production') {
        app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(document));
        app.get('/api/docs/json', (req, res) => res.json(document));
    }
    else {
        app.use('/api/docs', (req, res) => res.status(404).send('Not Found'));
    }
};
exports.setupSwagger = setupSwagger;
