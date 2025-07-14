"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get('/auth/health', (req, res) => res.status(200).send('Auth Service is Healthy!'));
app.post('/auth/register', auth_1.registerUser);
app.post('/auth/login', auth_1.loginUser);
app.post('/auth/register-admin', auth_1.registerAdminUser);
// Triggering a new deployment
app.listen(port, () => {
    console.log(`Auth service listening at http://localhost:${port}`);
});
