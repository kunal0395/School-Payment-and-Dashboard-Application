"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '3600s',
    EDVIRON_API_BEARER: process.env.EDVIRON_API_BEARER,
    EDVIRON_PG_KEY: process.env.EDVIRON_PG_KEY,
    EDVIRON_BASE: process.env.EDVIRON_BASE || 'https://dev-vanilla.edviron.com',
    SCHOOL_ID: process.env.SCHOOL_ID,
    TRUSTEE_ID: process.env.TRUSTEE_ID,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
});
//# sourceMappingURL=configuration.js.map