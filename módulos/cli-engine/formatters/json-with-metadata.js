"use strict";

// node_modules/eslint/lib/cli-engine/formatters/json-with-metadata.js
module.exports = function(results, data) {
  return JSON.stringify({
    results,
    metadata: data
  });
};
