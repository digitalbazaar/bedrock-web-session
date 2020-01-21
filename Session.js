/*!
 * Copyright (c) 2018-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService.js';

export default class Session {
  constructor() {
    this.data = {};
    this._service = new SessionService();
    this._eventTypeListeners = new Map([['change', new Map()]]);
  }

  /**
   * Refreshes this session instance by retrieving new session data via the
   * session service. When the session has been explicitly changed (e.g. by
   * logging a user into a server), the caller may optionally supply
   * authentication information that can be used by `change` listeners. If
   * `authentication` is passed or if the refresh causes the session data
   * to change, then a `change` event is emitted.
   *
   * @param {Object} authentication authentication information to pass to
   *   change listeners.
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
   * Registers a callback that is executed when an event listener fires.
   *
   * @param {string} eventType - An event such as change.
   * @param {function} handler - A callback function called when
   *   an event occurs.
   *
   * @returns {function} A unique function to remover the listener.
   */ 
  on(eventType, handler) {
    if(typeof eventType !== 'string') {
      throw new TypeError('"eventType" must be a string.');
    }
    if(typeof handler !== 'function') {
      throw new TypeError('"handler" must be a function.');
    }
    // this should return a Map for the eventType.
    const listeners = this._eventTypeListeners.get(eventType);
    if(!listeners) {
      throw new Error(`Event "${eventType}" is not supported.`);
    }

    const remover = () => listeners.delete(remover);
    // use the function as a unique key in the event listener Map.
    listeners.set(remover, handler);
    // Return the remover so an external app can remove its listener.
    return remover;
  }

  async _emit(eventType, eventData) {
    const listeners = this._eventTypeListeners.get(eventType);
    for(const handler of listeners.values()) {
      await handler(eventData);
    }
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
