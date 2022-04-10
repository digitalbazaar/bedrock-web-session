/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {httpClient} from '@digitalbazaar/http-client';

export class SessionService {
  constructor({
    urls = {
      base: '/session'
    }
  } = {}) {
    this.config = {urls};
    this._getPending = null;
  }

  /**
   * Get the data from the server that is associated with the current session.
   *
   * @param {object} options - The options to use.
   * @param {object} [options.url] - The URL to use; defaults to the URL
   *   configured via the constructor.
   *
   * @returns {Promise<object>} The data associated with the current session.
   */
  async get({url = this.config.urls.base} = {}) {
    if(this._getPending) {
      const response = await this._getPending;
      return response.data;
    }
    // store pending result so concurrent requests will reuse the
    // result instead of spamming the server
    this._getPending = httpClient.get(url);
    try {
      const response = await this._getPending;
      return response.data;
    } finally {
      this._getPending = null;
    }
  }

  /**
   * Sends a request to the server to end the current session.
   *
   * @param {object} options - The options to use.
   * @param {object} [options.url] - The URL to use; defaults to the URL
   *   configured via the constructor.
   *
   * @returns {Promise} Settles once the operation completes.
   */
  async logout({url = this.config.urls.base} = {}) {
    await httpClient.delete(url);
  }
}
