"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth/auth.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const auth = app.get(auth_service_1.AuthService);
    await auth.createTestUser('student', 'password123');
    console.log('Seed done');
    await app.close();
}
bootstrap();
//# sourceMappingURL=seed.js.map