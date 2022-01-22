/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {Session} from './Session.js';
import {SessionService} from './SessionService.js';

export {Session, SessionService};

// must be created via `createSession`
export let session;

/**
 * Creates the singleton Session instance for a Web app. This should only
 * be called once in a given Web app.
 *
 * @param {object} [options={}] - Options to use.
 * @param {SessionService} [options.sessionService] - An optional
 *   SessionService instance for the session to use; a default one will be
 *   constructed otherwise.
 *
 * @returns {Promise<Session>} The created session.
 */
export async function createSession({sessionService} = {}) {
  if(session) {
    throw new Error('Session singleton already created.');
  }
  return session = new Session({sessionService});
}

// exported for test purposes
export async function _setSession({newSession} = {}) {
  session = newSession;
}
