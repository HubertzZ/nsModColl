/**
 * Copyright 2020 Hubert Z.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @NApiVersion 2.x
 */

/**
 * File: tba.js
 * Name: Token-based Authentication
 * Version:
 */

import {EntryPoints} from "N/types";
import * as cryptojs from "./cryptojs";
import * as secret from "./secret";

interface Consumer {
    key: string;
    secret: string;
}

export class OAuth {
    consumer: Consumer;
    nonce_length: number;
    version: string;
    realm: string;
    parameter_separator: string;
    last_ampersand: boolean | string;
    signature_method: string;
    hash_function: any;

    /**
     * Constructor
     * @param {Object} opts consumer key and secret
     */
    constructor(opts?) {
        if (!opts) opts = {};
        if (!opts.consumer) throw new Error('consumer option is required');

        this.consumer = opts.consumer;
        this.nonce_length = opts.nonce_length || 32;
        this.version = opts.version || '1.0';
        this.realm = opts.realm || '';
        this.parameter_separator = opts.parameter_separator || ', ';
        this.last_ampersand = typeof opts.last_ampersand === 'undefined' ? true : opts.last_ampersand;
        this.signature_method = opts.signature_method || 'PLAINTEXT';

        if (this.signature_method == 'PLAINTEXT' && !opts.hash_function) opts.hash_function = (base_string, key) => key;
        if (!opts.hash_function) throw new Error('hash_function option is required');

        this.hash_function = opts.hash_function;
    }

    /**
     * OAuth request authorize
     * @param  {Object} request data
     * {
     *     method,
     *     url,
     *     data
     * }
     * @param  {Object} key and secret token
     * @return {Object} OAuth Authorized data
     */
    authorize(request, token) {
        let oauth_data = {
            oauth_consumer_key: this.consumer.key,
            oauth_nonce: this.getNonce(),
            oauth_signature_method: this.signature_method,
            oauth_timestamp: this.getTimeStamp(),
            oauth_version: this.version
        };

        if(!token) token = {};
        if(token.key) oauth_data['oauth_token'] = token.key;
        if(!request.data) request.data = {};

        oauth_data['oauth_signature'] = this.getSignature(request, token.secret, oauth_data);

        return oauth_data;
    }

    /**
     * Create a OAuth Signature
     * @param  {Object} request data
     * @param  {Object} token_secret key and secret token
     * @param  {Object} oauth_data   OAuth data
     * @return {String} Signature
     */
    getSignature(request, token_secret, oauth_data) {
        return this.hash_function(this.getBaseString(request, oauth_data), this.getSigningKey(token_secret));
    };

    /**
     * Base String = Method + Base Url + ParameterString
     * @param  {Object} request data
     * @param  {Object} OAuth data
     * @return {String} Base String
     */
    getBaseString(request, oauth_data) {
        return request.method.toUpperCase() + '&' + this.percentEncode(this.getBaseUrl(request.url)) + '&' + this.percentEncode(this.getParameterString(request, oauth_data));
    };

    /**
     * Get data from url
     * -> merge with oauth data
     * -> percent encode key & value
     * -> sort
     *
     * @param  {Object} request data
     * @param  {Object} OAuth data
     * @return {Object} Parameter string data
     */
    getParameterString(request, oauth_data) {
        let base_string_data = this.sortObject(this.percentEncodeData(this.mergeObject(oauth_data, this.mergeObject(request.data, this.deParamUrl(request.url)))));

        let data_str = '';

        //base_string_data to string
        for(let key in base_string_data) {
            let value = base_string_data[key];
            // check if the value is an array
            // this means that this key has multiple values
            if (value && Array.isArray(value)){
                // sort the array first
                value.sort();

                let valString = "";
                // serialize all values for this key: e.g. formkey=formvalue1&formkey=formvalue2
                value.forEach((function(item, i){
                    valString += key + '=' + item;
                    if (i < value.length){
                        valString += "&";
                    }
                }).bind(this));
                data_str += valString;
            } else {
                data_str += key + '=' + value + '&';
            }
        }

        //remove the last character
        data_str = data_str.substr(0, data_str.length - 1);
        return data_str;
    };

    /**
     * Create a Signing Key
     * @param  {String} token_secret Secret Token
     * @return {String} Signing Key
     */
    getSigningKey(token_secret) {
        token_secret = token_secret || '';

        if(!this.last_ampersand && !token_secret) return this.percentEncode(this.consumer.secret);

        return this.percentEncode(this.consumer.secret) + '&' + this.percentEncode(token_secret);
    };

    /**
     * Get base url
     * @param  {String} url
     * @return {String}
     */
    getBaseUrl(url) {
        return url.split('?')[0];
    };

    /**
     * Get data from String
     * @param  {String} string
     * @return {Object}
     */
    deParam(string) {
        let arr = string.split('&');
        let data = {};

        for(let i = 0; i < arr.length; i++) {
            let item = arr[i].split('=');

            // '' value
            item[1] = item[1] || '';

            data[item[0]] = decodeURIComponent(item[1]);
        }

        return data;
    };

    /**
     * Get data from url
     * @param  {String} url
     * @return {Object}
     */
    deParamUrl(url) {
        let tmp = url.split('?');

        if (tmp.length === 1) return {};

        return this.deParam(tmp[1]);
    };

    /**
     * Percent Encode
     * @param  {String} str
     * @return {String} percent encoded string
     */
    percentEncode(str) {
        return encodeURIComponent(str)
            .replace(/\!/g, "%21")
            .replace(/\*/g, "%2A")
            .replace(/\'/g, "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29");
    };

    /**
     * Percent Encode Object
     * @param  {Object} data
     * @return {Object} percent encoded data
     */
    percentEncodeData(data) {
        let result = {};

        for(let key in data) {
            let value = data[key];
            // check if the value is an array
            if (value && Array.isArray(value)){
                let newValue = [];
                // percentEncode every value
                value.forEach((function(val){
                    newValue.push(this.percentEncode(val));
                }).bind(this));
                value = newValue;
            } else {
                value = this.percentEncode(value);
            }
            result[this.percentEncode(key)] = value;
        }

        return result;
    };

    /**
     * Get OAuth data as Header
     * @param  {Object} oauth_data
     * @return {String} Header data key - value
     */
    toHeader(oauth_data) {
        oauth_data = this.sortObject(oauth_data);

        let header_value = 'OAuth ';

        if (this.realm) header_value += this.percentEncode('realm') + '="' + this.percentEncode(this.realm) + '"' + this.parameter_separator;

        for(let key in oauth_data) {
            if (key.indexOf('oauth_') === -1) continue;
            header_value += this.percentEncode(key) + '="' + this.percentEncode(oauth_data[key]) + '"' + this.parameter_separator;
        }

        return {
            Authorization: header_value.substr(0, header_value.length - this.parameter_separator.length) //cut the last chars
        };
    };

    /**
     * Create a random word characters string with input length
     * @return {String} a random word characters string
     */
    getNonce() {
        let word_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';

        for(let i = 0; i < this.nonce_length; i++) {
            result += word_characters[parseInt((Math.random() * word_characters.length).toString(), 10)];
        }

        return result;
    };

    /**
     * Get Current Unix TimeStamp
     * @return {Int} current unix timestamp
     */
    getTimeStamp() {
        return parseInt((new Date().getTime()/1000).toString(), 10);
    };

    ////////////////////// HELPER FUNCTIONS //////////////////////

    /**
     * Merge object
     * @param  {Object} obj1
     * @param  {Object} obj2
     * @return {Object}
     */
    mergeObject(obj1, obj2) {
        obj1 = obj1 || {};
        obj2 = obj2 || {};

        let merged_obj = obj1;
        for(let key in obj2) {
            merged_obj[key] = obj2[key];
        }
        return merged_obj;
    };

    /**
     * Sort object by key
     * @param  {Object} data
     * @return {Object} sorted object
     */
    sortObject(data) {
        let keys = Object.keys(data);
        let result = {};

        keys.sort();

        for(const key of keys) {
            result[key] = data[key];
        }

        return result;
    };
}

let getQueryParams = (url) => {
    if (typeof url !== 'string') throw TypeError("getQueryParams requires a String argument.");

    let paramObj = {};

    if (url.indexOf('?') === -1) return paramObj;

    // Trim any anchors
    url = url.split('#')[0];

    const queryString = url.split('?')[1];
    const params = queryString.split('&');
    for (const paramString of params) {
        const keyValuePair = paramString.split('=');
        const key = keyValuePair[0];
        const value = keyValuePair[1];

        if (key in paramObj) {
            if (typeof paramObj[key] === 'string') {
                paramObj[key] = [paramObj[key]]
            }
            paramObj[key].push(value);
        } else {
            paramObj[key] = value;
        }
    }
    return paramObj;
}

let hmacSHA1 = (base_string, key) => {
    return cryptojs.HmacSHA1(base_string, key).toString(cryptojs.enc.Base64);
}

let hmacSHA256 = (base_string, key) => {
    return cryptojs.HmacSHA256(base_string, key).toString(cryptojs.enc.Base64);
}

let auth = new OAuth({
    realm: secret.realm,
    consumer: {
        key: secret.consumer.public,
        secret: secret.consumer.secret
    },
    signature_method: 'HMAC-SHA256',
    hash_function: hmacSHA256
})

export let getHeaders = (options) => {
    let data = options.method.toUpperCase() === 'GET' ? getQueryParams(options.url) : undefined;

    let requestData = {
        url: options.url,
        method: options.method,
        data: data
    };

    let token = {
        key: options.tokenKey,
        secret: options.tokenSecret
    };

    return auth.toHeader(auth.authorize(requestData, token));
};