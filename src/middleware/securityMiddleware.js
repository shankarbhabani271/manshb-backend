/**
 * Recursively removes keys starting with '$' or containing '.' from object keys
 * to protect against NoSQL Injection attacks.
 */
const sanitizeNoSql = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (/^\$/.test(key) || key.includes(".")) {
        delete obj[key];
      } else {
        sanitizeNoSql(obj[key]);
      }
    }
  }
  return obj;
};

/**
 * HTML escapes standard characters to prevent Cross-Site Scripting (XSS) scripts execution.
 */
const escapeHtml = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

const sanitizeXss = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = escapeHtml(obj[key]);
      } else {
        sanitizeXss(obj[key]);
      }
    }
  }
  return obj;
};

// Middleware: Prevent NoSQL Injection
export const nosqlInjectionPreventer = (req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.query) sanitizeNoSql(req.query);
  if (req.params) sanitizeNoSql(req.params);
  next();
};

// Middleware: Escape input strings for basic XSS protection
export const xssSanitizer = (req, res, next) => {
  if (req.body) sanitizeXss(req.body);
  if (req.query) sanitizeXss(req.query);
  if (req.params) sanitizeXss(req.params);
  next();
};
