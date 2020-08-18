/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import SessionService from './SessionService.js';

export default class Session {
  constructor() {
    this.data = {};
    this._service = new SessionService();
    // this stores the timer used to expire a session
    this._timeout = null;
    this._eventTypeListeners = new Map([
      ['change', new Set()],
      ['expire', new Set()]
    ]);
    window.addEventListener('storage', ({key, newValue}) => {
      this._setTimeout({key, timeout: newValue});
    });
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
    const {ttl, account} = newData;
    if((typeof ttl === 'number') && (typeof account === 'object')) {
      const key = this._formatStorageKey({account});
      const message = JSON.stringify({
        ttl,
        // chrome caches localStorage so this ensures
        // each refresh emits a storage event
        // calling setItem with the same key and value results in no event
        update: Date.now()
      });
      // if the user has the same site open in multipe tabs
      // the tabs will see this storage event
      window.localStorage.setItem(key, message);
      // this current window will not see the storageEvent
      this._setTimeout({key, timeout: ttl, account, newData});
    }
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
   * Creates a common unique key for session storage.
   *
   * @param {object} options - Options to use.
   * @param {object} options.account - The authenticated session's account.
   *
   * @returns {string} - A unique session key identifier.
  */
  _formatStorageKey({account}) {
    const {id} = account;
    if(!id) {
      const dataError = new Error('Object account should have an id');
      dataError.name = 'DataError';
      throw dataError;
    }
    return `session-${id}`;
  }

  /**
   * Sets a timeout based on the cookie's maxAge that will emit an
   *   expire event.
   *
   * @param {object} options - Options to use.
   * @param {string} options.key - A unique session timeout key.
   * @param {number} options.timeout - The timeout.
   * @param {object} options.newData - The newData from the latest refresh.
   *
   * @returns {undefined} Just emits an event.
  */
  _setTimeout({key, timeout, newData}) {
    // use the newData if available.
    const data = newData || this.data || {};
    const expectedKey = this._formatStorageKey({account: data.account});
    if(key.trim() !== expectedKey) {
      return;
    }
    clearTimeout(this._timeout);
    // the timeout might be a json object from localStorage
    let _timeout = JSON.parse(timeout);
    // if it is json use the ttl else use the number
    _timeout = _timeout.ttl || _timeout;
    // only set the timeout if we are authenticated
    // and the ttl is a number
    this._timeout = setTimeout(
      () => this._emit('expire', {data}), _timeout);
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
