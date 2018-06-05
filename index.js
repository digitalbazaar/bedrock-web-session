/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {store as defaultStore} from 'bedrock-web-store';
import Session from './Session.js';

export const getSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  let session = await store.get({id});
  if(session === undefined) {
    session = new Session();
    await store.create({id, object: session});
    await session.refresh();
  }
  return session;
};
