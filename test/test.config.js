/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {config} = require('bedrock');
const path = require('path');

const {permissions, roles} = config.permission;

config.karma.suites['bedrock-web'] = path.join('web', '**', '*.js');

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
config.express.session.key = 'web-authn-token-test-session';
config.express.session.prefix = 'web-authn-token-test';
// test specific settings
config.express.session.rolling = true;
config.express.session.resave = true;
config.express.session.saveUninitialized = false;

// make sessions last 1 second for this test
config.express.session.ttl = 1 * 1000;

roles['account.registered'] = {
  id: 'account.registered',
  label: 'Account Test Role',
  comment: 'Role for Test User',
  sysPermission: [
    permissions.ACCOUNT_ACCESS.id,
    permissions.ACCOUNT_UPDATE.id,
    permissions.ACCOUNT_INSERT.id
  ]
};
