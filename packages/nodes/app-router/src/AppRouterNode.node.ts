import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

interface RouteDefinition {
  path: string;
  pageTitle: string;
  layout: string;
  authRequired: boolean;
}

interface ParsedRoute {
  pattern: RegExp;
  paramNames: string[];
  definition: RouteDefinition;
}

export class AppRouterNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'App Router',
    name: 'appRouterNode',
    group: ['transform'],
    version: 1,
    description: 'Multi-page routing for web applications',
    defaults: {
      name: 'App Router',
    },
    inputs: ['main'],
    outputs: [
      { type: 'main' as const, displayName: 'Home' },
      { type: 'main' as const, displayName: 'Todos' },
      { type: 'main' as const, displayName: 'New Todo' },
      { type: 'main' as const, displayName: 'Create API' },
    ],
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const rawRoutes = this.getNodeParameter('routes', i, {}) as {
        route?: RouteDefinition[];
      };
      const routes = rawRoutes?.route || [];
      const defaultRoute = this.getNodeParameter('defaultRoute', i, '/') as string;

      const inputData = items[i].json;

      // On first execution (no request input): output route definitions for setup
      const hasRequest = 'path' in inputData && typeof inputData.path === 'string';
      const hasWrappedRequest = inputData.body && typeof inputData.body === 'object' && 'path' in inputData.body;
      if (!hasRequest && !hasWrappedRequest) {
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
      // Handle both direct input and n8n webhook-wrapped input (body.path)
      const bodyField = inputData.body;
      const wrappedBody = (bodyField && typeof bodyField === 'object' && !Array.isArray(bodyField) ? bodyField : {}) as Record<string, unknown>;
      const requestPath = (typeof inputData.path === 'string' ? inputData.path : (wrappedBody.path as string)) || '/';
      const method = (typeof inputData.method === 'string' ? inputData.method : (wrappedBody.method as string)) || 'GET';
      const query = inputData.query && typeof inputData.query === 'object' ? inputData.query : (wrappedBody.query || {});
      const body = bodyField && typeof bodyField === 'object' ? bodyField : {};
      const headers = inputData.headers && typeof inputData.headers === 'object' ? inputData.headers : (wrappedBody.headers || {});
      const session = inputData.session || null;
      const parsedRoutes = routes.map(parseRoute);
      const match = matchRoute(requestPath, parsedRoutes);
      const out = {
        route: match ? match.definition : (routes.find((r) => r.path === defaultRoute) || { path: defaultRoute, pageTitle: 'Default', layout: 'default', authRequired: false }),
        params: match ? match.params : {},
        context: {
          path: requestPath,
          method: method,
          query: query,
          body: body,
          headers: headers,
          session: session,
        },
        matchedPath: requestPath,
      };
      returnData.push({ json: out });
    }

    // Route the output to the correct output channel based on matched route path
    const matchedPath = returnData[0]?.json?.matchedPath || '/';
    const home: INodeExecutionData[] = [];
    const todos: INodeExecutionData[] = [];
    const newTodo: INodeExecutionData[] = [];
    const apiTodos: INodeExecutionData[] = [];

    if (matchedPath === '/') {
      return [returnData, [], [], []];
    } else if (matchedPath === '/todos') {
      return [[], returnData, [], []];
    } else if (matchedPath === '/todos/new') {
      return [[], [], returnData, []];
    } else if (matchedPath === '/api/todos') {
      return [[], [], [], returnData];
    }
    // Default: send to home output
    return [returnData, [], [], []];
  }
}

function parseRoute(route: RouteDefinition): ParsedRoute {
  const paramNames: string[] = [];
  const regexStr = route.path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name: string) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return {
    pattern: new RegExp(`^${regexStr}$`),
    paramNames,
    definition: route,
  };
}

function matchRoute(
  path: string,
  parsedRoutes: ParsedRoute[],
): { definition: RouteDefinition; params: Record<string, string> } | null {
  for (const parsed of parsedRoutes) {
    const match = path.match(parsed.pattern);
    if (match) {
      const params: Record<string, string> = {};
      parsed.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { definition: parsed.definition, params };
    }
  }
  return null;
}
