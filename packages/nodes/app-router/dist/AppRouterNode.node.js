"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRouterNode = void 0;
class AppRouterNode {
    constructor() {
        this.description = {
            displayName: 'App Router',
            name: 'appRouterNode',
            group: ['transform'],
            version: 1,
            description: 'Multi-page routing for web applications',
            defaults: {
                name: 'App Router',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Routes',
                    name: 'routes',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    options: [
                        {
                            name: 'route',
                            displayName: 'Route',
                            values: [
                                {
                                    displayName: 'Path',
                                    name: 'path',
                                    type: 'string',
                                    default: '',
                                    description: 'URL path pattern, e.g. "/todos" or "/todos/:id"',
                                },
                                {
                                    displayName: 'Page Title',
                                    name: 'pageTitle',
                                    type: 'string',
                                    default: '',
                                    description: 'Title for the page',
                                },
                                {
                                    displayName: 'Layout',
                                    name: 'layout',
                                    type: 'options',
                                    options: [
                                        { name: 'Default', value: 'default' },
                                        { name: 'Minimal', value: 'minimal' },
                                        { name: 'Full', value: 'full' },
                                    ],
                                    default: 'default',
                                    description: 'Page layout template',
                                },
                                {
                                    displayName: 'Auth Required',
                                    name: 'authRequired',
                                    type: 'boolean',
                                    default: false,
                                    description: 'Whether route needs authentication',
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Default Route',
                    name: 'defaultRoute',
                    type: 'string',
                    default: '/',
                    description: 'Fallback route path when no match found',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const rawRoutes = this.getNodeParameter('routes', i, {});
            const routes = rawRoutes?.route || [];
            const defaultRoute = this.getNodeParameter('defaultRoute', i, '/');
            const inputData = items[i].json;
            // On first execution (no request input): output route definitions for setup
            if (!inputData || Object.keys(inputData).length === 0 || !('path' in inputData)) {
                returnData.push({
                    json: {
                        routes: routes.map((r) => ({
                            path: r.path,
                            pageTitle: r.pageTitle,
                            layout: r.layout,
                            authRequired: r.authRequired,
                        })),
                        defaultRoute,
                    },
                });
                continue;
            }
            // With request input: match the request path against defined routes
            const requestPath = inputData.path;
            const parsedRoutes = routes.map(parseRoute);
            const match = matchRoute(requestPath, parsedRoutes);
            if (match) {
                returnData.push({
                    json: {
                        route: match.definition,
                        params: match.params,
                        context: {
                            path: requestPath,
                            method: inputData.method,
                            query: inputData.query,
                            body: inputData.body,
                            headers: inputData.headers,
                            session: inputData.session,
                        },
                        matchedPath: requestPath,
                    },
                });
            }
            else {
                const defaultDef = routes.find((r) => r.path === defaultRoute);
                returnData.push({
                    json: {
                        route: defaultDef || { path: defaultRoute, pageTitle: 'Default', layout: 'default', authRequired: false },
                        params: {},
                        context: {
                            path: requestPath,
                            method: inputData.method,
                            query: inputData.query,
                            body: inputData.body,
                            headers: inputData.headers,
                            session: inputData.session,
                        },
                        matchedPath: requestPath,
                        note: `No route matched "${requestPath}", using default "${defaultRoute}"`,
                    },
                });
            }
        }
        return [returnData];
    }
}
exports.AppRouterNode = AppRouterNode;
function parseRoute(route) {
    const paramNames = [];
    const regexStr = route.path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    return {
        pattern: new RegExp(`^${regexStr}$`),
        paramNames,
        definition: route,
    };
}
function matchRoute(path, parsedRoutes) {
    for (const parsed of parsedRoutes) {
        const match = path.match(parsed.pattern);
        if (match) {
            const params = {};
            parsed.paramNames.forEach((name, index) => {
                params[name] = match[index + 1];
            });
            return { definition: parsed.definition, params };
        }
    }
    return null;
}
//# sourceMappingURL=AppRouterNode.node.js.map