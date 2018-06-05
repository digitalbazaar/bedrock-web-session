/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import axios from 'axios';
import Session from './Session.js';
import {store as defaultStore} from 'bedrock-web-store';

export default class SessionService {
  constructor({
    urls = {
      base: '/session',
      logout: '/session/logout'
    }
  } = {}) {
    this.config = {urls};
    this._getPending = null;
  }

  async create({id = 'session.default', store = defaultStore}) {
    let session = await store.get(id);
    if(session === undefined) {
      session = new Session({service: this});
      await store.create({id, object: session});
      await session.refresh();
    }
    return session;
  }

  async get({url = this.config.urls.base} = {}) {
    if(this._getPending) {
      const response = await this._getPending;
      return response.data;
    }
    // store pending session result so concurrent requests will reuse the
    // result instead of spamming the server
    this._getPending = axios.get(url);
    try {
      const response = await this._getPending;
      return response.data;
    } finally {
      this._getPending = null;
    }
  }

  async logout({url = this.config.urls.base} = {}) {
    await axios.delete(url);
    return true;
  }
}
