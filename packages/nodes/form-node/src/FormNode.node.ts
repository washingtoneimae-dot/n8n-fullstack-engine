import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import * as crypto from 'crypto';

export class FormNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Form',
    name: 'formNode',
    group: ['transform'],
    version: 1,
    description: 'Generate HTML forms from workflow data and collect user submissions',
    defaults: {
      name: 'Form',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Form Fields',
        name: 'formFields',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'fields',
            displayName: 'Fields',
            values: [
              {
                displayName: 'Label',
                name: 'label',
                type: 'string',
                default: '',
                description: 'Field label displayed above the input',
              },
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                default: '',
                description: 'Field name used as the JSON key in form output',
              },
              {
                displayName: 'Type',
                name: 'type',
                type: 'options',
                options: [
                  { name: 'Text', value: 'text' },
                  { name: 'Email', value: 'email' },
                  { name: 'Number', value: 'number' },
                  { name: 'Password', value: 'password' },
                  { name: 'Textarea', value: 'textarea' },
                  { name: 'Select', value: 'select' },
                  { name: 'Checkbox', value: 'checkbox' },
                ],
                default: 'text',
                description: 'HTML input type',
              },
              {
                displayName: 'Required',
                name: 'required',
                type: 'boolean',
                default: false,
                description: 'Whether this field is required',
              },
              {
                displayName: 'Placeholder',
                name: 'placeholder',
                type: 'string',
                default: '',
                description: 'Placeholder text for the input',
              },
              {
                displayName: 'Options',
                name: 'options',
                type: 'string',
                typeOptions: {
                  rows: 3,
                },
                default: '',
                displayOptions: {
                  show: {
                    type: ['select'],
                  },
                },
                description: 'Comma-separated list of options for select dropdown',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Submit Button Text',
        name: 'submitText',
        type: 'string',
        default: 'Submit',
        description: 'Text displayed on the submit button',
      },
      {
        displayName: 'Success Message',
        name: 'successMessage',
        type: 'string',
        default: 'Form submitted successfully!',
        description: 'Message shown after successful form submission',
      },
      {
        displayName: 'Form Action URL',
        name: 'formAction',
        type: 'string',
        default: '',
        description: 'URL to POST the form data to (leave empty to output HTML for manual use)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const rawFields = this.getNodeParameter('formFields', i, {}) as {
        fields?: Array<{
          label: string;
          name: string;
          type: string;
          required: boolean;
          placeholder: string;
          options?: string;
        }>;
      };
      const fields = rawFields?.fields || [];
      const submitText = this.getNodeParameter('submitText', i, 'Submit') as string;
      const successMessage = this.getNodeParameter('successMessage', i, 'Form submitted successfully!') as string;
      const formAction = this.getNodeParameter('formAction', i, '') as string;

      const inputData = items[i].json;

      // If input contains submitted form data, output it as JSON
      if (inputData && typeof inputData === 'object' && !isFormRenderRequest(inputData)) {
        returnData.push({
          json: {
            submitted: true,
            data: inputData,
            timestamp: new Date().toISOString(),
          },
        });
        continue;
      }

      const csrfToken = crypto.randomBytes(32).toString('hex');
      const html = buildFormHtml(fields, submitText, successMessage, formAction, csrfToken);

      returnData.push({
        json: {
          html,
          fields,
          submitText,
          successMessage,
          csrfToken,
        },
      });
    }

    return [returnData];
  }
}

function isFormRenderRequest(data: Record<string, unknown>): boolean {
  // Empty input or input with 'html' property means we should render a form
  if (Object.keys(data).length === 0) return true;
  if ('html' in data) return true;
  // Otherwise, it's submitted form data — don't render
  return false;
}

function buildFormHtml(
  fields: Array<{
    label: string;
    name: string;
    type: string;
    required: boolean;
    placeholder: string;
    options?: string;
  }>,
  submitText: string,
  successMessage: string,
  formAction: string,
  csrfToken: string,
): string {
  const actionAttr = formAction ? `action="${escapeHtml(formAction)}"` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
  <div class="bg-white rounded-lg shadow-md w-full max-w-lg p-6">
    <div id="form-container">
      <form ${actionAttr} method="POST" class="space-y-4" onsubmit="return handleSubmit(event)">
        <input type="hidden" name="_csrf" value="${csrfToken}">

        ${fields.map((field) => renderField(field)).join('\n')}

        <div>
          <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            ${escapeHtml(submitText)}
          </button>
        </div>
      </form>
    </div>

    <div id="success-message" class="hidden text-center py-8">
      <div class="text-green-500 text-5xl mb-4">&#10003;</div>
      <p class="text-gray-700 text-lg">${escapeHtml(successMessage)}</p>
    </div>
  </div>

  <script>
    function handleSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const data = {};
      formData.forEach(function(value, key) {
        if (key === '_csrf') return;
        if (data[key] !== undefined) {
          if (!Array.isArray(data[key])) {
            data[key] = [data[key]];
          }
          data[key].push(value);
        } else {
          data[key] = value;
        }
      });

      // If form action is set, POST to that URL
      const action = form.getAttribute('action');
      if (action) {
        fetch(action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(function(response) {
          if (response.ok) {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('success-message').classList.remove('hidden');
          } else {
            alert('Submission failed. Please try again.');
          }
        })
        .catch(function() {
          alert('Network error. Please try again.');
        });
      } else {
        // If no action URL, show the data as JSON for demo/testing
        alert('Form Data:\\n' + JSON.stringify(data, null, 2));
        document.getElementById('form-container').classList.add('hidden');
        document.getElementById('success-message').classList.remove('hidden');
      }
      return false;
    }
  </script>
</body>
</html>`;
}

function renderField(field: {
  label: string;
  name: string;
  type: string;
  required: boolean;
  placeholder: string;
  options?: string;
}): string {
  const labelHtml = `<label for="${escapeHtml(field.name)}" class="block text-sm font-medium text-gray-700">${escapeHtml(field.label)}${field.required ? ' <span class="text-red-500">*</span>' : ''}</label>`;
  const requiredAttr = field.required ? ' required' : '';
  const placeholderAttr = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
  const idAttr = ` id="${escapeHtml(field.name)}"`;
  const nameAttr = ` name="${escapeHtml(field.name)}"`;

  switch (field.type) {
    case 'textarea':
      return `
        <div>
          ${labelHtml}
          <textarea${idAttr}${nameAttr} rows="4"${requiredAttr}${placeholderAttr} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"></textarea>
        </div>`;

    case 'select': {
      const options = (field.options || '').split(',').map((o) => o.trim()).filter(Boolean);
      const optionHtml = options.map((opt) =>
        `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`,
      ).join('\n');
      return `
        <div>
          ${labelHtml}
          <select${idAttr}${nameAttr}${requiredAttr} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            <option value="">${escapeHtml(field.placeholder || 'Select...')}</option>
            ${optionHtml}
          </select>
        </div>`;
    }

    case 'checkbox':
      return `
        <div class="flex items-start">
          <input${idAttr}${nameAttr} type="checkbox" class="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"${requiredAttr}>
          <label for="${escapeHtml(field.name)}" class="ml-2 block text-sm text-gray-700">${escapeHtml(field.label)}${field.required ? ' <span class="text-red-500">*</span>' : ''}</label>
        </div>`;

    default:
      return `
        <div>
          ${labelHtml}
          <input${idAttr}${nameAttr} type="${escapeHtml(field.type)}"${requiredAttr}${placeholderAttr} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm">
        </div>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
