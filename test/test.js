/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
require('bedrock-mongodb');
require('bedrock-express');
require('bedrock-session-http');
// note: this is the only backend we currently
// have for sessions.
require('bedrock-session-mongodb');
require('bedrock-authn-token');
require('bedrock-authn-token-http');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-https-agent');
require('bedrock-security-context');
require('bedrock-test');
require('bedrock-karma');

bedrock.start();
