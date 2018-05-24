/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import axios from 'axios';

export class SessionService {
  constructor({
    urls = {
      base: '/session',
      logout: '/session/logout'
    }
  } = {}) {
    this.config = {urls};
    this._getPending = null;
  }

  async get({url = this.config.urls.base} = {}) {
    if(this._getPending) {
      return this._getPending;
    }
    // store pending session result so concurrent requests will reuse the
    // result instead of spamming the server
    this._getPending = axios.get(url);
    try {
      return await this._getPending;
    } finally {
      this._getPending = null;
    }
  }

  async logout({url = this.config.urls.base} = {}) {
    await axios.delete(url);
    return true;
  }
}
