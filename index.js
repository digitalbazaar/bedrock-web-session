/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {store as defaultStore} from 'bedrock-web-store';
import Session from './Session.js';

export {SessionService} from './SessionService.js';

export const getSession = async (
  {id = 'session.default', store = defaultStore} = {}) => {
  try {
    const session = new Session();
    await store.create({id, object: session});
    await session.refresh();
    return session;
  } catch(e) {
    if(e.name === 'DuplicateError') {
      return store.get({id});
    }
    throw e;
  }
};
