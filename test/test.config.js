/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';
import path from 'path';
import '@bedrock/https-agent';
import '@bedrock/karma';
import '@bedrock/mongodb';
import '@bedrock/account-http';
import '@bedrock/express';
import '@bedrock/session-mongodb';

config.karma.suites['bedrock-web-session'] = path.join('web', '**', '*.js');

// only allow 1 browser window for these tests to reduce flakiness
config.karma.config.concurrency = 1;

config.karma.config.proxies = {
  '/': 'https://localhost:18443'
};
config.karma.config.proxyValidateSSL = false;

// mongodb config
config.mongodb.name = 'bedrock_web_session_test';
config.mongodb.host = 'localhost';
config.mongodb.port = 27017;
// drop all collections on initialization
config.mongodb.dropCollections = {};
config.mongodb.dropCollections.onInit = true;
config.mongodb.dropCollections.collections = [];

// allow self-signed certs in test framework
config['https-agent'].rejectUnauthorized = false;

// this needs to be true in order to set auth stuff
config['account-http'].autoLoginNewAccounts = true;

config.express.session.secret = 'NOTASECRET';
config.express.session.key = 'bedrock-web-session-test';
config.express.session.prefix = 'bedrock-web-session-prefix';

// make sessions last 1 second for this test
config['session-mongodb'].ttl = 1;
