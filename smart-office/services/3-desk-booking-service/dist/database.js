"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExistingBookingForDate = exports.deleteDesk = exports.updateDesk = exports.getDesks = exports.createDesk = exports.getDeskById = exports.ddbDocClient = void 0;
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
const DESKS_TABLE = process.env.DYNAMODB_DESKS_TABLE_NAME || 'Desks';
const BOOKINGS_TABLE = process.env.DYNAMODB_TABLE_NAME || 'Bookings';
// --- Desk Management Functions ---
const getDeskById = (deskId) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: DESKS_TABLE,
        Key: { deskId },
    };
    const { Item } = yield exports.ddbDocClient.send(new lib_dynamodb_1.GetCommand(params));
    return Item;
});
exports.getDeskById = getDeskById;
const createDesk = (desk) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: DESKS_TABLE,
        Item: desk,
    };
    yield exports.ddbDocClient.send(new lib_dynamodb_1.PutCommand(params));
    return desk;
});
exports.createDesk = createDesk;
const getDesks = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: DESKS_TABLE,
    };
    const { Items } = yield exports.ddbDocClient.send(new lib_dynamodb_1.ScanCommand(params));
    return Items;
});
exports.getDesks = getDesks;
const updateDesk = (deskId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: DESKS_TABLE,
        Key: { deskId },
        UpdateExpression: 'set #location = :l, #features = :f',
        ExpressionAttributeNames: {
            '#location': 'location',
            '#features': 'features',
        },
        ExpressionAttributeValues: {
            ':l': updates.location,
            ':f': updates.features,
        },
        ReturnValues: client_dynamodb_1.ReturnValue.ALL_NEW,
    };
    const { Attributes } = yield exports.ddbDocClient.send(new lib_dynamodb_1.UpdateCommand(params));
    return Attributes;
});
exports.updateDesk = updateDesk;
const deleteDesk = (deskId) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: DESKS_TABLE,
        Key: { deskId },
    };
    yield exports.ddbDocClient.send(new lib_dynamodb_1.DeleteCommand(params));
});
exports.deleteDesk = deleteDesk;
// --- Booking Validation Functions ---
const getExistingBookingForDate = (resourceId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        TableName: BOOKINGS_TABLE,
        FilterExpression: `
            resourceId = :resourceId AND
            bookingType = :bookingType AND
            #date = :date
        `,
        ExpressionAttributeNames: {
            '#date': 'date',
        },
        ExpressionAttributeValues: {
            ':resourceId': resourceId,
            ':bookingType': 'DESK',
            ':date': date,
        },
    };
    const { Items } = yield exports.ddbDocClient.send(new lib_dynamodb_1.ScanCommand(params));
    return Items;
});
exports.getExistingBookingForDate = getExistingBookingForDate;
