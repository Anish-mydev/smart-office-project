"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddbDocClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const region = process.env.AWS_REGION;
const endpoint = process.env.DYNAMODB_ENDPOINT;
const ddbClient = new client_dynamodb_1.DynamoDBClient({
    region,
    endpoint,
});
exports.ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(ddbClient);
