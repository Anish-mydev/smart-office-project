#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SmartOfficeStack } from '../lib/smart-office-stack';

const app = new cdk.App();
const imageTag = app.node.tryGetContext('imageTag');

new SmartOfficeStack(app, 'SmartOfficeStack', {
  imageTag: imageTag,
  env: {
    account: '155452520827',
    region: 'us-east-1',
  },
});
