import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

/**
 * Page Node — renders a full HTML page from sub-node assembly.
 *
 * Phase 1: SSR (Server-Side Rendering)
 * - Receives data from connected sub-nodes (Form, Data Table, etc.)
 * - Assembles a complete HTML page with Tailwind CSS
 * - Returns HTML string as output
 *
 * Phase 2: Hydration (adds Preact/alpine.js for interactivity)
 * Phase 3: Full SPA (returns JSON, frontend handles routing)
 */
export class PageNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Page',
    name: 'pageNode',
    group: ['transform'],
    version: 1,
    description: 'Render a full HTML page from sub-node assembly',
    defaults: {
      name: 'Page',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Page Title',
        name: 'pageTitle',
        type: 'string',
        default: 'My App',
        description: 'Title of the HTML page',
      },
      {
        displayName: 'Layout',
        name: 'layout',
        type: 'options',
        options: [
          { name: 'Default', value: 'default' },
          { name: 'Centered', value: 'centered' },
          { name: 'Full Width', value: 'fullwidth' },
        ],
        default: 'default',
        description: 'Page layout template',
      },
      {
        displayName: 'Navigation Bar',
        name: 'showNav',
        type: 'boolean',
        default: true,
        description: 'Whether to show a navigation bar',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const pageTitle = this.getNodeParameter('pageTitle', i, 'My App') as string;
      const layout = this.getNodeParameter('layout', i, 'default') as string;
      const showNav = this.getNodeParameter('showNav', i, true) as boolean;

      // Collect data from connected sub-nodes
      const inputData = items[i].json;

      // Build HTML page using standalone helpers
      const html = buildPage(pageTitle, layout, showNav, inputData);

      returnData.push({
        json: {
          html,
          title: pageTitle,
          layout,
          data: inputData,
        },
      });
    }

    return [returnData];
  }
}

// ── Standalone helpers (accessible without `this`) ──────────────

function buildPage(
  title: string,
  layout: string,
  showNav: boolean,
  data: Record<string, any>,
): string {
  const layouts: Record<string, string> = {
    default: 'max-w-4xl mx-auto px-4 py-8',
    centered: 'max-w-md mx-auto px-4 py-16 text-center',
    fullwidth: 'w-full px-8 py-6',
  };

  const containerClass = layouts[layout] || layouts.default;
  const nav = showNav ? buildNav(title) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  ${nav}
  <div class="${containerClass}">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">${escapeHtml(title)}</h1>
    <div class="space-y-4">
      ${renderData(data)}
    </div>
  </div>
</body>
</html>`;
}

function buildNav(title: string): string {
  return `
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" class="text-lg font-semibold text-gray-900">${escapeHtml(title)}</a>
      <div class="flex gap-4 text-sm text-gray-600">
        <a href="/" class="hover:text-gray-900">Home</a>
        <a href="/login" class="hover:text-gray-900">Login</a>
      </div>
    </div>
  </nav>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    try { return JSON.stringify(val); } catch { return String(val); }
  }
  return String(val);
}

function renderData(data: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) {
    return '<p class="text-gray-500">No data</p>';
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '<p class="text-gray-500">No items</p>';
    }
    const keys = Object.keys(data[0] || {});
    return `
        <div class="overflow-x-auto bg-white rounded-lg shadow">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                ${keys.map((key) =>
                  `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${escapeHtml(key)}</th>`,
                ).join('')}
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${data.map((row, idx) => `
                <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
                  ${keys.map((key) =>
                    `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${escapeHtml(String(row[key] ?? ''))}</td>`
                  ).join('')}
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <a href="/edit/${idx}" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</a>
                    <a href="/delete/${idx}" class="text-red-600 hover:text-red-900">Delete</a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return `
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <tbody>
              ${entries.map(([key, val], idx) => `
                <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                  <td class="px-6 py-3 text-sm font-medium text-gray-700 w-1/3">${escapeHtml(key)}</td>
                  <td class="px-6 py-3 text-sm text-gray-900">${escapeHtml(formatValue(val))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
  }

  return `<pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
}
