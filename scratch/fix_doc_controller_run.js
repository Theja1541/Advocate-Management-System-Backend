const fs = require('fs');

let content = fs.readFileSync('src/features/documents/documentController.js', 'utf8');

// Add StorageService import if not there
if (!content.includes('StorageService')) {
  content = content.replace(/const fs = require\('fs'\);/, 'const fs = require(\'fs\');\nconst StorageService = require(\'../../services/StorageService\');');
}

// Rewrite downloadDocument
const newDownloadDocument = `exports.downloadDocument = async (req, res, next) => {
  try {
    const document = await documentService.getDocumentById(req.params.id);
    const existingPath = await StorageService.getFilePath(document.filePath);
    
    if (!existingPath) {
      return next(new AppError('File not found on server', 404));
    }

    const downloadName = \`\${document.documentCode}-\${document.name}\${path.extname(existingPath)}\`;
    return res.download(existingPath, downloadName);
  } catch (error) {
    logger.error('DownloadDocument error:', error);
    next(error);
  }
};`;
content = content.replace(/exports\.downloadDocument = async \(req, res, next\) => \{[\s\S]*?\}\s*return null;\n  \}/, newDownloadDocument);

// Remove filePathCandidatesFind since it was deleted by the regex above (wait, is it safely deleted? The regex matched until `return null;\n  \}`)
// Let's make sure the regex matches perfectly
fs.writeFileSync('scratch/fix_doc_controller.js', 
`const fs = require('fs');
let content = fs.readFileSync('src/features/documents/documentController.js', 'utf8');
if (!content.includes('StorageService')) {
  content = content.replace(/const fs = require\\('fs'\\);/, 'const fs = require(\\'fs\\');\\nconst StorageService = require(\\'../../services/StorageService\\');');
}
content = content.replace(/exports\\.downloadDocument = async \\(req, res, next\\) => \\{[\\s\\S]*?return null;\\n  \\}/, ${JSON.stringify(newDownloadDocument)});
fs.writeFileSync('src/features/documents/documentController.js', content);
console.log('Fixed documentController.js');
`);
