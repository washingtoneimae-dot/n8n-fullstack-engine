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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const pageTitle = this.getNodeParameter('pageTitle', i, 'My App') as string;
      const layout = this.getNodeParameter('layout', i, 'default') as string;

      // Collect data from connected sub-nodes
      const inputData = items[i].json;

      // Build HTML page
      const html = this.buildPage(pageTitle, layout, inputData);

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

  private buildPage(title: string, layout: string, data: Record<string, any>): string {
    const layouts: Record<string, string> = {
      default: 'max-w-4xl mx-auto px-4 py-8',
      centered: 'max-w-md mx-auto px-4 py-16 text-center',
      fullwidth: 'w-full px-8 py-6',
    };

    const containerClass = layouts[layout] || layouts.default;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="${containerClass}">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">${this.escapeHtml(title)}</h1>
    <div class="space-y-4">
      ${this.renderData(data)}
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private renderData(data: Record<string, any>): string {
    if (!data || Object.keys(data).length === 0) {
      return '<p class="text-gray-500">No data</p>';
    }

    if (Array.isArray(data)) {
      return `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                ${Object.keys(data[0] || {}).map(key =>
                  `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${this.escapeHtml(key)}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(val =>
                    `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.escapeHtml(String(val))}</td>`
                  ).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    }

    return `<pre class="bg-gray-100 p-4 rounded text-sm">${this.escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  }
}
