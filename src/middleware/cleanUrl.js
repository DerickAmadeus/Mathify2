const path = require('path');
const fs = require('fs');

/**
 * Middleware to serve HTML files without .html extension
 * Example: /calculator will serve /public/pages/calculator.html
 */
const cleanUrlMiddleware = (req, res, next) => {
  // Skip if path has extension or is root
  if (req.path.includes('.') || req.path === '/') {
    return next();
  }

  // Try to find .html file in pages directory
  const htmlPath = path.join(__dirname, '../../public/pages', req.path + '.html');
  
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }
  
  next();
};

module.exports = cleanUrlMiddleware;
