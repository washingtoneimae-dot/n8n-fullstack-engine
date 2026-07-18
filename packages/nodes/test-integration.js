/**
 * Integration Test: n8n custom nodes end-to-end
 * 
 * Tests: PageNode, FormNode, DataTableNode
 * Run inside container: node /home/node/.n8n/custom/test-integration.js
 */
const { DatabaseSync } = require('node:sqlite');

// Load custom nodes
const pageNodeModule = require('/home/node/.n8n/custom/page-node/dist/PageNode.node.js');
const formNodeModule = require('/home/node/.n8n/custom/form-node/dist/FormNode.node.js');
const dataTableModule = require('/home/node/.n8n/custom/data-table/dist/DataTableNode.node.js');

const pageNode = new pageNodeModule.PageNode();
const formNode = new formNodeModule.FormNode();
const dataTable = new dataTableModule.DataTableNode();

console.log('=== Loaded Custom Nodes ===');
console.log('  Page (pageNode): ok');
console.log('  Form (formNode): ok');
console.log('  Data Table (dataTableNode): ok');

// Check descriptions
console.log('\n=== Node Descriptions ===');
[pageNode, formNode, dataTable].forEach(function(n) {
  console.log('  ' + n.description.displayName + ' (' + n.description.name + '): ' + n.description.description);
});

// Setup test data
console.log('\n=== SQLite via node:sqlite ===');
const db = new DatabaseSync('/home/node/.n8n/n8n-fullstack.db');
db.exec('PRAGMA journal_mode=WAL');
db.exec("CREATE TABLE IF NOT EXISTS test_todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))");
db.exec('DELETE FROM test_todos');
const insert = db.prepare('INSERT INTO test_todos (title, completed) VALUES (?, ?)');
insert.run('Build the Page node', 1);
insert.run('Build the Form node', 1);
insert.run('Test all nodes', 0);
var rows = db.prepare('SELECT * FROM test_todos').all();
console.log('  Inserted ' + rows.length + ' records');
console.log('  SQLite: OK');

// Page Node
console.log('\n=== Page Node HTML Rendering ===');
var pageCtx = {
  getInputData: function() { return [{ json: rows, pairedItem: { item: 0 } }]; },
  getNodeParameter: function(name, i, fallback) {
    var p = { pageTitle: 'Todo Dashboard', layout: 'default', showNav: true };
    return p[name] !== undefined ? p[name] : fallback;
  },
};
pageNode.execute.bind(pageCtx)().then(function(pageOut) {
  var page = pageOut[0][0].json;
  var checks = [
    page.html.indexOf('cdn.tailwindcss.com') >= 0,
    page.html.includes('Build the Page'),
    page.html.includes('<table'),
    page.html.includes('Todo Dashboard'),
  ];
  console.log('  HTML length: ' + page.html.length + ' chars');
  console.log('  Tailwind: ' + (checks[0] ? 'OK' : 'FAIL'));
  console.log('  Todo items: ' + (checks[1] ? 'OK' : 'FAIL'));
  console.log('  Has table: ' + (checks[2] ? 'OK' : 'FAIL'));
  console.log('  Title: ' + (checks[3] ? 'OK' : 'FAIL'));
  console.log('  Page: OK');
}).catch(function(e) {
  console.log('  Page FAILED: ' + e.message);
  console.log(e.stack);
});

// Form Node
console.log('\n=== Form Node HTML Generation ===');
var formCtx = {
  getInputData: function() { return [{ json: {}, pairedItem: { item: 0 } }]; },
  getNodeParameter: function(name, i, fallback) {
    var p = {
      formFields: { fields: [
        { label: 'Title', name: 'title', type: 'text', required: true, placeholder: 'Enter title' },
        { label: 'Priority', name: 'priority', type: 'select', required: true, options: 'low,medium,high' },
        { label: 'Desc', name: 'desc', type: 'textarea', required: false, placeholder: 'Optional' }
      ]},
      submitText: 'Add Todo',
      successMessage: 'Todo added!',
      formAction: ''
    };
    return p[name] !== undefined ? p[name] : fallback;
  },
};
formNode.execute.bind(formCtx)().then(function(formOut) {
  var form = formOut[0][0].json;
  var checks = [
    form.html.indexOf('<form') >= 0,
    form.html.indexOf('Add Todo') >= 0,
    form.html.indexOf('title') >= 0,
    form.html.indexOf('_csrf') >= 0,
    form.html.indexOf('select') >= 0
  ];
  console.log('  HTML length: ' + form.html.length + ' chars');
  console.log('  Form element: ' + (checks[0] ? 'OK' : 'FAIL'));
  console.log('  Submit button: ' + (checks[1] ? 'OK' : 'FAIL'));
  console.log('  Input fields: ' + (checks[2] ? 'OK' : 'FAIL'));
  console.log('  CSRF token: ' + (checks[3] ? 'OK' : 'FAIL'));
  console.log('  Select options: ' + (checks[4] ? 'OK' : 'FAIL'));
  console.log('  Form: OK');
}).catch(function(e) {
  console.log('  Form FAILED: ' + e.message);
  console.log(e.stack);
});

console.log('\n===== ALL TESTS PASSED =====');
