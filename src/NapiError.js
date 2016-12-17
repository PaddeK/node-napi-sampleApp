'use strict';

class NapiError {
    constructor (msg) {
        this.errorString = msg || '';
    }
}

module.exports = NapiError;