import moment from 'moment';
import CONSTANTS from './constants/index.js'
import utf8 from 'utf8';
import md5 from 'md5';
import _ from 'lodash';
import https from 'https';
import axios from 'axios';

const instance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

export class SmiteApi {
    constructor({
        // options
        auth_key = AUTH_KEY,
        dev_id = DEV_ID,
        response_type = "JSON",
      } = {}) {
        // session_id will be set once createSession is invoked
        this.session_id = null;
        this.session_timestamp = null;
    
        // these two are required to visit real SmiteApi endpoints
        this.auth_key = auth_key;
        this.dev_id = dev_id;
    
        // internal state for this class
        this.response_type = response_type;
      }

      _assertEnvVariables() {
        const errors = [];
        if (!this.dev_id) {
          errors.push('DEV_ID cannot be undefined. Please update top level .env file.');
        }
        if (!this.auth_key) {
          errors.push('AUTH_KEY cannot be undefined. Please update top level .env file.');
        }
        if (_.size(errors)) {
          throw new Error(errors.join(' '));
        }
      }

      _generateTimeStamp() {
        const timestamp = moment.utc().format(CONSTANTS.MOMENT.SMITE_API_FORMAT);
        return timestamp;
      }

      _generateSignature(method) {
        const timestamp = this._generateTimeStamp();
        const text = this.dev_id + method + this.auth_key + timestamp;
        const encodedText = utf8.encode(text);
        const signature = md5(encodedText);
        return signature;
      }

      _generateEndpoint(method, ...args) {
        const signature = this._generateSignature(method);
        const timestamp = this._generateTimeStamp();
        const url = this._composeUrl(method, signature, timestamp, ...args);
        return url;
      }

      _composeUrl(method, signature, timestamp, ...args) {
        this._assertEnvVariables();
    
        const urlComponents = _.filter([
          CONSTANTS.API.BASE_URL,
          `${method}${this.response_type}`,
          this.dev_id,
          signature,
          !this._isSessionExpired() ? this.session_id : '',
          timestamp,
          ...args,
        ]);
    
        // regenerates url like
        // `${BASE_URL}/${method}/${dev_id}/${signature}/${session}/${timestamp}/${...args}`
        const url = urlComponents.join('/');
    
        return url;
      }

      _isSessionExpired() {
        if (!this.session_timestamp) {
          return true;
        }
        if (!this.session_id) {
          return true;
        }
        return moment.utc() > this.session_timestamp;
      }

      async _processRequest(url) {
        let data = null;
    
        try {
          const response = await instance({ method: 'get', url });
          data = response.data;
        } catch (error) {
          const errors = [
            `-----------------------------------------------`,
            error,
            `❌❌❌ Request Failed for ${url}`,
            `❌❌❌ Current   time: ${moment.utc()}`,
            `❌❌❌ Timestamp time: ${this.session_timestamp}`,
          ].join('\n');
    
          throw new Error(errors);
        }
    
        return data;
      }

      async _createSession() {
        const url = this._generateEndpoint(CONSTANTS.METHODS.CREATE_SESSION);
        const data = await this._processRequest(url);
    
        // This might not belong here. sets up
        // session id if we are making createsession request
        this.session_id = _.get(data, CONSTANTS.API.SESSION_ID);
        this.session_timestamp = moment.utc().add(15, 'minutes');
    
        return data;
      }

      async performRequest(method, ...args) {
        if (this._isSessionExpired()) {
          // if now is 15 minutes later than the last session
          // that session has expired as we should make a new one
          await this._createSession();
        }
    
        const url = this._generateEndpoint(method, ...args);
        const data = await this._processRequest(url);
        return data;
      }




}