/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import '@bedrock/security-context';
import '@bedrock/account';
import '@bedrock/account-http';
import '@bedrock/express';
import '@bedrock/https-agent';
import '@bedrock/mongodb';
import '@bedrock/session-http';
import '@bedrock/session-mongodb';
import '@bedrock/authn-token';
import '@bedrock/authn-token-http';

import '@bedrock/test';
import '@bedrock/karma';

bedrock.start();
