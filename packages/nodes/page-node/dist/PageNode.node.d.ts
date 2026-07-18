import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
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
export declare class PageNode implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}
//# sourceMappingURL=PageNode.node.d.ts.map