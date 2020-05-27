/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService.js';

export default class Session {
  constructor() {
    this.data = {};
    this._service = new SessionService();
    this._eventTypeListeners = new Map([
      ['change', new Set()],
      ['expire', new Set()]
    ]);
  }

  /**
   * Refreshes this session instance by retrieving new session data via the
   * session service. When the session has been explicitly changed, by
   * logging a user into a server, the caller may optionally supply
   * authentication information that can be used by `change` listeners. If
   * `authentication` is passed or if the refresh causes the session data
   * to change, then a `change` event is emitted.
   *
   * @param {object} options - The options to use.
   * @param {object} [options.authentication] - Authentication information to
   *  pass to change listeners.
   */
  async refresh({authentication} = {}) {
    const oldData = this.data;
    const newData = await this._service.get();
    // issue change event when new authentication is used or when
    // session data changes
    if(authentication || !deepEqual(oldData, newData)) {
      this.data = newData;
      try {
        await this._emit('change', {authentication, oldData, newData});
      } catch(e) {
        // could not refresh session, so end it
        const error = e;
        try {
          await this.end();
        } finally {
          throw error;
        }
      }
    }
  }

  async end() {
    await this._service.logout();
    await this.refresh();
  }

  /**
   * Registers a handler that is executed when an event is emitted.
   *
   * @param {string} eventType - An event such as "change".
   * @param {Function} handler - A handler function called when
   *   an event occurs.
   *
   * @returns {Function} A unique function to remover the listener.
   */
  on(eventType, handler) {
    if(typeof eventType !== 'string') {
      throw new TypeError('"eventType" must be a string.');
    }
    if(typeof handler !== 'function') {
      throw new TypeError('"handler" must be a function.');
    }
    // this returns a Map for `eventType`
    const listeners = this._eventTypeListeners.get(eventType);
    if(!listeners) {
      throw new Error(`Event "${eventType}" is not supported.`);
    }

    const remover = () => listeners.delete(handler);
    // add the function as a unique element in the event listener Set
    listeners.add(handler);
    // return the remover so the application can remove the handler
    return remover;
  }

  async _emit(eventType, eventData) {
    const listeners = this._eventTypeListeners.get(eventType);
    for(const handler of listeners) {
      await handler(eventData);
    }
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
