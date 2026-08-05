const fs = require('fs');

let content = fs.readFileSync('src/features/documents/documentService.js', 'utf8');

// Add StorageService import
content = content.replace(/const path = require\('path'\);\nconst fs = require\('fs'\);/, 'const path = require(\'path\');\nconst fs = require(\'fs\');\nconst StorageService = require(\'../../services/StorageService\');');

// Replace resolveStoredFilePath
const newResolve = `const resolveStoredFilePath = async (filePath) => {
  if (!filePath) return null;
  try {
    return await StorageService.getFilePath(filePath);
  } catch (e) {
    return null;
  }
};`;
content = content.replace(/const resolveStoredFilePath = \(filePath\) => \{[\s\S]*?return null;\n\};/, newResolve);

// In createDocument, replace file.path
content = content.replace(/const uploadDate = new Date\(\)\.toISOString\(\)\.slice\(0, 10\);/, 'const uploadDate = new Date().toISOString().slice(0, 10);\n  const savedFilePath = await StorageService.saveFile(file, \'documents\');');
content = content.replace(/filePath: file\.path \|\| path\.join\('uploads', file\.filename\)/g, 'filePath: savedFilePath');

// In updateDocument, replace file.path and unlinkSync
content = content.replace(/const oldFilePath = document\.filePath;\n    if \(oldFilePath && fs\.existsSync\(oldFilePath\)\) \{\n      try \{\n        fs\.unlinkSync\(oldFilePath\);\n      \} catch \{\n        \/\/ ignore\n      \}\n    \}/, `if (document.filePath) {
      try { await StorageService.deleteFile(document.filePath); } catch {}
    }
    const savedFilePath = await StorageService.saveFile(file, 'documents');`);
content = content.replace(/document\.filePath = file\.path \|\| path\.join\('uploads', file\.filename\);/, 'document.filePath = savedFilePath;');

// In deleteDocument, replace unlinkSync
content = content.replace(/if \(filePath && fs\.existsSync\(filePath\)\) \{\n      try \{\n        fs\.unlinkSync\(filePath\);\n      \} catch \{\n        \/\/ File cleanup is best-effort after DB delete\n      \}\n    \}/, `if (filePath) {
    try { await StorageService.deleteFile(filePath); } catch {}
  }`);

// In getDocumentTextContent, resolveStoredFilePath is now async
content = content.replace(/const resolvedPath = resolveStoredFilePath\(plain\.filePath\);/, 'const resolvedPath = await resolveStoredFilePath(plain.filePath);');

fs.writeFileSync('src/features/documents/documentService.js', content);
console.log('Fixed documentService.js');
