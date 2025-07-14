"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqs_1 = require("./sqs");
console.log('Notification service started. Polling for messages...');
(0, sqs_1.pollSqsQueue)();
