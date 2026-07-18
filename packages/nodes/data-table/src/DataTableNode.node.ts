import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

const DB_PATH = '/home/node/.n8n/n8n-fullstack.db';

export class DataTableNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Data Table',
    name: 'dataTableNode',
    group: ['transform'],
    version: 1,
    description: 'Persistent CRUD storage using SQLite',
    defaults: {
      name: 'Data Table',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Create Table', value: 'createTable' },
          { name: 'Insert', value: 'insert' },
          { name: 'Select', value: 'select' },
          { name: 'Update', value: 'update' },
          { name: 'Delete', value: 'delete' },
        ],
        default: 'select',
        description: 'CRUD operation to perform',
      },
      {
        displayName: 'Table Name',
        name: 'tableName',
        type: 'string',
        default: '',
        description: 'Name of the SQLite table',
      },
      {
        displayName: 'Columns',
        name: 'columns',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        displayOptions: {
          show: {
            operation: ['createTable'],
          },
        },
        options: [
          {
            name: 'column',
            displayName: 'Column',
            values: [
              {
                displayName: 'Column Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Name of the column',
              },
              {
                displayName: 'Type',
                name: 'type',
                type: 'options',
                options: [
                  { name: 'Text', value: 'TEXT' },
                  { name: 'Integer', value: 'INTEGER' },
                  { name: 'Real', value: 'REAL' },
                  { name: 'Boolean', value: 'INTEGER' },
                ],
                default: 'TEXT',
                description: 'SQLite column type',
              },
              {
                displayName: 'Required',
                name: 'required',
                type: 'boolean',
                default: false,
                description: 'Whether this column is NOT NULL',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Data',
        name: 'data',
        type: 'json',
        default: '',
        typeOptions: {
          rows: 5,
        },
        displayOptions: {
          show: {
            operation: ['insert', 'update'],
          },
        },
        description: 'JSON data for insert or update operation. Can be an object or array of objects. Falls back to input item data if empty.',
      },
      {
        displayName: 'Where Clause (JSON)',
        name: 'whereClause',
        type: 'json',
        default: '',
        typeOptions: {
          rows: 3,
        },
        displayOptions: {
          hide: {
            operation: ['createTable', 'insert'],
          },
        },
        description: 'JSON filter object, e.g. {"id": 1} or {"status": "active"}. All conditions are AND-ed.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    let db: any = null;
    try {
      db = getDatabase(DB_PATH);

      for (let i = 0; i < items.length; i++) {
        const operation = this.getNodeParameter('operation', i, 'select') as string;
        const tableName = this.getNodeParameter('tableName', i, '') as string;

        if (!tableName && operation !== 'createTable') {
          throw new Error('Table name is required');
        }

        switch (operation) {
          case 'createTable':
            returnData.push(...handleCreateTable(db, this, i, tableName));
            break;
          case 'insert':
            returnData.push(...handleInsert(db, this, i, items, tableName));
            break;
          case 'select':
            returnData.push(...handleSelect(db, this, i, tableName));
            break;
          case 'update':
            returnData.push(...handleUpdate(db, this, i, tableName));
            break;
          case 'delete':
            returnData.push(...handleDelete(db, this, i, tableName));
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      }
    } catch (error) {
      throw new Error(`DataTable error: ${(error as Error).message}`);
    } finally {
      if (db) {
        try { db.close(); } catch { /* ignore close error */ }
      }
    }

    return [returnData];
  }
}

function getDatabase(dbPath: string): any {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode=WAL');
  return db;
}

function handleCreateTable(
  db: any,
  ctx: IExecuteFunctions,
  itemIndex: number,
  tableName: string,
): INodeExecutionData[] {
  const rawColumns = ctx.getNodeParameter('columns', itemIndex, {}) as {
    column?: Array<{ name: string; type: string; required: boolean }>;
  };
  const columns = rawColumns?.column || [];

  if (!tableName) {
    throw new Error('Table name is required for Create Table operation');
  }
  if (columns.length === 0) {
    throw new Error('At least one column is required');
  }

  const sanitizedName = sanitizeIdentifier(tableName);

  const columnDefs = columns.map((col) => {
    const name = sanitizeIdentifier(col.name);
    const type = col.type || 'TEXT';
    const nullable = col.required ? 'NOT NULL' : '';
    return `"${name}" ${type} ${nullable}`.trim();
  });

  const sql = `CREATE TABLE IF NOT EXISTS "${sanitizedName}" (\n  ${columnDefs.join(',\n  ')}\n)`;

  db.exec(sql);

  return [{ json: { success: true, operation: 'createTable', table: tableName, sql } }];
}

function handleInsert(
  db: any,
  ctx: IExecuteFunctions,
  itemIndex: number,
  items: INodeExecutionData[],
  tableName: string,
): INodeExecutionData[] {
  let rawData = ctx.getNodeParameter('data', itemIndex, '') as string;
  const sanitizedName = sanitizeIdentifier(tableName);
  const result: INodeExecutionData[] = [];

  let records: Record<string, unknown>[];

  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error(`Invalid JSON in Data field: ${rawData}`);
    }
  } else {
    records = items.map((item) => item.json);
  }

  if (records.length === 0) {
    return [{ json: { success: true, operation: 'insert', table: tableName, inserted: 0 } }];
  }

  const insertStmt = db.prepare(buildInsertSql(sanitizedName, records[0]));

  for (const record of records) {
    const stmt = record === records[0] ? insertStmt : db.prepare(buildInsertSql(sanitizedName, record));
    const info = stmt.run(record);
    result.push({
      json: {
        success: true,
        operation: 'insert',
        table: tableName,
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid,
        data: record,
      },
    });
  }

  return result;
}

function handleSelect(
  db: any,
  ctx: IExecuteFunctions,
  itemIndex: number,
  tableName: string,
): INodeExecutionData[] {
  const rawWhere = ctx.getNodeParameter('whereClause', itemIndex, '') as string;
  const sanitizedName = sanitizeIdentifier(tableName);

  let whereClause = '';
  let params: Record<string, unknown> = {};

  if (rawWhere) {
    try {
      params = JSON.parse(rawWhere) as Record<string, unknown>;
    } catch {
      throw new Error(`Invalid JSON in Where Clause: ${rawWhere}`);
    }
    const conditions = Object.keys(params).map((key) => {
      const sanitizedKey = sanitizeIdentifier(key);
      return `"${sanitizedKey}" = @${sanitizedKey}`;
    });
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
  }

  const sql = `SELECT * FROM "${sanitizedName}" ${whereClause}`;
  const stmt = db.prepare(sql);
  const rows = params ? stmt.all(params) : stmt.all();

  return [
    {
      json: {
        success: true,
        operation: 'select',
        table: tableName,
        count: rows.length,
        data: rows,
      },
    },
  ];
}

function handleUpdate(
  db: any,
  ctx: IExecuteFunctions,
  itemIndex: number,
  tableName: string,
): INodeExecutionData[] {
  const rawData = ctx.getNodeParameter('data', itemIndex, '') as string;
  const rawWhere = ctx.getNodeParameter('whereClause', itemIndex, '') as string;
  const sanitizedName = sanitizeIdentifier(tableName);

  if (!rawData) {
    throw new Error('Data is required for Update operation');
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawData) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON in Data: ${rawData}`);
  }

  let whereClause = '';
  let whereParams: Record<string, unknown> = {};
  if (rawWhere) {
    try {
      whereParams = JSON.parse(rawWhere) as Record<string, unknown>;
    } catch {
      throw new Error(`Invalid JSON in Where Clause: ${rawWhere}`);
    }
    const conditions = Object.keys(whereParams).map((key) => {
      const sanitizedKey = sanitizeIdentifier(key);
      return `"${sanitizedKey}" = @_where_${sanitizedKey}`;
    });
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
  }

  const setColumns = Object.keys(data).map((key) => {
    const sanitizedKey = sanitizeIdentifier(key);
    return `"${sanitizedKey}" = @${sanitizedKey}`;
  });

  const sql = `UPDATE "${sanitizedName}" SET ${setColumns.join(', ')} ${whereClause}`;

  const mergedParams: Record<string, unknown> = { ...data };
  for (const [key, value] of Object.entries(whereParams)) {
    mergedParams[`_where_${sanitizeIdentifier(key)}`] = value;
  }

  const stmt = db.prepare(sql);
  const info = stmt.run(mergedParams);

  return [
    {
      json: {
        success: true,
        operation: 'update',
        table: tableName,
        changes: info.changes,
      },
    },
  ];
}

function handleDelete(
  db: any,
  ctx: IExecuteFunctions,
  itemIndex: number,
  tableName: string,
): INodeExecutionData[] {
  const rawWhere = ctx.getNodeParameter('whereClause', itemIndex, '') as string;
  const sanitizedName = sanitizeIdentifier(tableName);

  let whereClause = '';
  let params: Record<string, unknown> = {};
  if (rawWhere) {
    try {
      params = JSON.parse(rawWhere) as Record<string, unknown>;
    } catch {
      throw new Error(`Invalid JSON in Where Clause: ${rawWhere}`);
    }
    const conditions = Object.keys(params).map((key) => {
      const sanitizedKey = sanitizeIdentifier(key);
      return `"${sanitizedKey}" = @${sanitizedKey}`;
    });
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
  } else {
    throw new Error('Where clause is required for Delete operation to prevent accidental full table deletion');
  }

  const sql = `DELETE FROM "${sanitizedName}" ${whereClause}`;
  const stmt = db.prepare(sql);
  const info = stmt.run(params);

  return [
    {
      json: {
        success: true,
        operation: 'delete',
        table: tableName,
        deleted: info.changes,
      },
    },
  ];
}

function buildInsertSql(tableName: string, record: Record<string, unknown>): string {
  const keys = Object.keys(record);
  const columns = keys.map((k) => `"${sanitizeIdentifier(k)}"`).join(', ');
  const values = keys.map((k) => `@${sanitizeIdentifier(k)}`).join(', ');
  return `INSERT INTO "${tableName}" (${columns}) VALUES (${values})`;
}

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}
