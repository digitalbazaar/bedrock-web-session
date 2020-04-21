/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {store as defaultStore} from 'bedrock-web-store';
import Session from './Session.js';

export {default as SessionService} from './SessionService.js';

export const createSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  const session = new Session();
  await store.create({id, object: session});
  return session;
};

export const getSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  const session = await store.get({id});
  if(session) {
    return session;
  }
  try {
    const session = await createSession();
    await session.refresh();
    return session;
  } catch(e) {
    if(e.name === 'DuplicateError') {
      return store.get({id});
    }
    throw e;
  }
};
