/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {SessionService} from './SessionService.js';

export class Session {
  constructor({sessionService = new SessionService()} = {}) {
    this.data = {};
    this._service = sessionService;
    this._eventTypeListeners = new Map([['change', new Set()]]);
  }

  /**
   * Refreshes this session instance by retrieving session data via the
   * session service. If the retrieved session data is different from the
   * cached session data, then a `change` event will be emitted to all
   * `change` listeners.
   *
   * @returns {Promise} Settles once the operation completes.
   */
  async refresh() {
    return this._refresh();
  }

  /**
   * Ends the current session by using the session service to logout and then
   * refreshing the session's internal state so it represents a new session. A
   * `change` event will be emitted to all `change` listeners (whether or not
   * the session data is different) with the `oldEnded` property on the event
   * set to `true`.
   *
   * @returns {Promise} Settles once the session ends.
   */
  async end() {
    await this._service.logout();
    await this._refresh({oldEnded: true});
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

  async _refresh({oldEnded = false} = {}) {
    const oldData = this.data;
    const newData = await this._service.get();

    // if old session did not end nor did data change, then return early
    if(!oldEnded && _deepEqual(oldData, newData)) {
      return;
    }

    // the session is new or changed; notify change listeners
    this.data = newData;
    try {
      await this._emit('change', {oldEnded, oldData, newData});
    } catch(e) {
      // could not refresh session, so end it if not already ended
      const error = e;
      try {
        if(!oldEnded) {
          await this.end();
        }
      } finally {
        throw error;
      }
    }
  }
}

function _deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
