const fs = require('fs');
const path = require('path');

const files = [
  'tests/services/staging/comprehensive-staging.test.js',
  'tests/utils/item-validator.test.js',
  'tests/services/outbound/scan-rfid-picking-service.test.js',
  'tests/utils/reconciliation.test.js',
  'tests/services/user/refresh-token-service.test.js',
  'tests/controllers/role.test.js',
  'tests/controllers/location.test.js',
  'tests/services/user/register-service.test.js',
  'tests/services/user/get-user-by-id-service.test.js',
  'tests/services/user/delete-user-service.test.js',
  'tests/services/user/get-users-service.test.js'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all individual model requires and mocks
    const modelImports = [];
    const modelRequireRegex = /const (\w+) = require\(['"]((?:\.\.\/)+src\/models\/(\w+))['"]\);/g;
    let match;
    while ((match = modelRequireRegex.exec(content)) !== null) {
        modelImports.push({ name: match[1], path: match[2], modelFile: match[3] });
    }

    if (modelImports.length > 0) {
        // Replace first import with destruction from index
        const firstImport = modelImports[0];
        const modelsToImport = modelImports.map(m => m.name).join(', ');
        const relativePathToModels = firstImport.path.split('/models/')[0] + '/models';
        
        content = content.replace(modelRequireRegex, '');
        // Add new combined import at the top or where the first one was
        content = `const { ${modelsToImport} } = require('${relativePathToModels}');\n` + content;

        // Replace mocks
        content = content.replace(/jest\.mock\(['"](?:\.\.\/)+src\/models\/\w+['"]\);/g, `jest.mock('${relativePathToModels}');`);
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
