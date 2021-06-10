/*!
 * Copyright (c) 2018-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

import {httpClient} from '@digitalbazaar/http-client';

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

  async get({url = this.config.urls.base} = {}) {
    if(this._getPending) {
      const response = await this._getPending;
      return response.data;
    }
    // store pending session result so concurrent requests will reuse the
    // result instead of spamming the server
    this._getPending = httpClient.get(url);
    try {
      const response = await this._getPending;
      return response.data;
    } finally {
      this._getPending = null;
    }
  }

  async logout({url = this.config.urls.base} = {}) {
    await httpClient.delete(url);
    return true;
  }
}
