/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {store as defaultStore} from 'bedrock-web-store';
import Session from './Session.js';

export {default as SessionService} from './SessionService.js';

/**
 * Creates a Session with an optional id or store.
 *
 * @param {object} [options={}] - Options to use.
 * @param {string} [options.id='session.default'] - An id for the session.
 * @param {object} [options.store=defaultStore] - A store for the session.
 *
 * @returns {Promise<object>} The created session.
*/
export const createSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  const session = new Session();
  await store.create({id, object: session});
  return session;
};

/**
 * Gets a session from a store or creates a new session.
 *
 * @param {object} [options={}] - Options to use.
 * @param {string} [options.id='session.default'] - An id for the session.
 * @param {object} [options.store=defaultStore] - A store for the session.
 *
 * @returns {Promise<object>} A session.
*/
export const getSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  // the cached session is simply returned and intentionally not refreshed here;
  // if the caller wants the session refreshed they may call `refresh()` on the result
  const session = await store.get({id});
  if(session) {
    return session;
  }
  try {
    // use the passed in id and store
    const session = await createSession({id, store});
    await session.refresh();
    return session;
  } catch(e) {
    if(e.name === 'DuplicateError') {
      return store.get({id});
    }
    throw e;
  }
};
