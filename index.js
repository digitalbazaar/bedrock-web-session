/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {Store} from 'bedrock-web-store';
import Session from './Session.js';

const store = new Store();

export const createSession = () => {
  const session = new Session();
  let data = store.get();
  data = session;
  return data;
};

export const getSession = () => {
  return store.get();
};

