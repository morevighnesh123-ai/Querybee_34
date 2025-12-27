const path = require('path');

// This repository's real backend server lives at ../server.js.
// package.json expects the entrypoint at backend/api/server.js, so this wrapper keeps that stable.
module.exports = require(path.join(__dirname, '..', 'server.js'));
