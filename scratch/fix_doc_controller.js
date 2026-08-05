const fs = require('fs');
let content = fs.readFileSync('src/features/documents/documentController.js', 'utf8');
if (!content.includes('StorageService')) {
  content = content.replace(/const fs = require\('fs'\);/, 'const fs = require(\'fs\');\nconst StorageService = require(\'../../services/StorageService\');');
}
content = content.replace(/exports\.downloadDocument = async \(req, res, next\) => \{[\s\S]*?return null;\n  \}/, "exports.downloadDocument = async (req, res, next) => {\n  try {\n    const document = await documentService.getDocumentById(req.params.id);\n    const existingPath = await StorageService.getFilePath(document.filePath);\n    \n    if (!existingPath) {\n      return next(new AppError('File not found on server', 404));\n    }\n\n    const downloadName = `${document.documentCode}-${document.name}${path.extname(existingPath)}`;\n    return res.download(existingPath, downloadName);\n  } catch (error) {\n    logger.error('DownloadDocument error:', error);\n    next(error);\n  }\n};");
fs.writeFileSync('src/features/documents/documentController.js', content);
console.log('Fixed documentController.js');
