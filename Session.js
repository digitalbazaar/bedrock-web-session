/*!
 * Copyright (c) 2018-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService.js';

export default class Session {
  constructor() {
    this._service = new SessionService();
    this.data = {};
    this.eventTypes = new Map([['change', new Map()]]);
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
      this._emit('change', {authentication, oldData, newData});
    }
  }

  async end() {
    await this._service.logout();
    await this.refresh();
  }

  on(eventType, handler) {
    if(typeof eventName !== 'string') {
      throw new TypeError('"eventType" must be a string.');
    }
    if(typeof handler !== 'function') {
      throw new TypeError('"handler" must be a function.');
    }

    const listeners = this.eventTypes.get(eventType);
    if(!listeners) {
      throw new Error(`Event "${eventType}" is not supported.`);
    }

    const remover = () => listeners.delete(remover);
    listeners.set(remover, handler);
  }

  async _emit(eventType, eventData) {
    const listeners = this.eventTypes.get(eventType);
    for(const handler of listeners.values()) {
      try {
        await handler(eventData);
      } catch(e) {
        console.error(e);
      }
    }
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
