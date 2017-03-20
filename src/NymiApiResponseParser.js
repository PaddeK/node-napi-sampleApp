'use strict';

const   NapiError = require('./NapiError'),
        NymiProvision = require('./NymiProvision'),
        NymiApi = require('./NymiNodeApi'),
        TransientNymiBandInfo = require('./TransientNymiBandInfo');

class NymiApiResponseParser {
    constructor (callbacks) {
        this.callbacks = callbacks;
    }

    parse (jobj) {
        try {
            jobj = JSON.parse(jobj.replace(/[^\x20-\x7e \x80-\xff]/g, ''));
        } catch (err) {
            this.handleNapiError(jobj);
            return;
        }

        if (jobj.errors) {
            this.handleNapiError(jobj);
            return;
        }

        if (jobj.hasOwnProperty('successful') && !jobj.successful) {
            this.handleNapiError(jobj);
            return;
        }

        if (jobj.operation && Array.isArray(jobj.operation)) {
            switch (jobj.operation[0]) {
                case 'provision':
                    this.handleOpProvision(jobj);
                    break;
                case 'info':
                    this.handleOpInfo(jobj);
                    break;
                case 'random':
                    this.handleOpRandom(jobj);
                    break;
                case 'symmetricKey':
                    this.handleOpSymmetric(jobj);
                    break;
                case 'sign':
                    this.handleOpSignature(jobj);
                    break;
                case 'totp':
                    this.handleOpTotp(jobj);
                    break;
                case 'buzz':
                    this.handleOpNotified(jobj);
                    break;
                case 'notifications':
                    this.handleOpApiNotifications(jobj);
                    break;
                case 'revoke':
                    this.handleOpRevokeProvision(jobj);
                    break;
                case 'key':
                    this.handleOpKey(jobj);
                    break;
                default:
                    this.logMessage(jobj);
                    break;
            }
        }
    }

    logMessage (jobj) {
        console.log('Unknown message received from API: ' + JSON.stringify(jobj));
    }

    handleNapiError (jobj) {
        let nErr = new NapiError();

        nErr.errorString += ' Operation: ' + jobj.path;

        if (jobj.errors && Array.isArray(jobj.errors)) {
            nErr.errorString += ', Error message(s):';

            jobj.errors.forEach(error => {
                nErr.errorString += '{' + error[1] + ':' + '\'' + error[0] + '\'} ';
            });
        }

        this.callbacks.onError(nErr);
    }

    getExchange (jobj, errorIfNoExchange) {
        if (!jobj.hasOwnProperty('exchange')) {
            if (errorIfNoExchange) {
                let errMsg = 'Could not find JSON field "exchange" in the JSON obj:\n';
                this.callbacks.onError(new NapiError(errMsg + JSON.stringify(jobj)));
            }
            return '';
        }
        return jobj.exchange;
    }

    getPid (jobj) {
        return jobj.request && jobj.request.pid ? jobj.request.pid : '';
    }

    genMissingJsonKeyErr (key, jobj) {
        let errMsg = 'Could not find JSON field "' + key + '" in the JSON obj:\n';
        return new NapiError(errMsg + JSON.stringify(jobj));
    }

    handleOpProvision (jobj) {
        if (jobj.operation[1] === 'report') {
            if (jobj.operation[2] === 'patterns') {
                if (jobj.event) {
                    this.callbacks.onAgreement(jobj.event.patterns);
                }
            } else if (jobj.operation[2] === 'provisioned') {
                if (jobj.event && jobj.event.info && jobj.event.info.pid) {
                    this.callbacks.onProvision(new NymiProvision(jobj.event.info.pid));
                }
            }
        } else if (jobj.operation[1] === 'run' && (jobj.operation[2] === 'start' || jobj.operation[2] === 'stop')) {
            this.callbacks.onProvisionModeChange(jobj.operation[2]);
        }
    }

    handleOpInfo (jobj) {
        let exchange = this.getExchange(jobj, true);
        let provList = [];

        if (!exchange.length) {
            return;
        }

        if (exchange === 'provisions' || exchange === 'provisionsPresent') {
            if (jobj.response && Array.isArray(jobj.response[exchange])) {
                jobj.response[exchange].forEach(prov => {
                    provList.push(new NymiProvision(prov));
                });
            }
            this.callbacks.getProvisionList(provList);
        } else if (exchange.includes('deviceinfo')) {
            let pid = exchange.substr(exchange.indexOf('deviceinfo') + 10);

            if (jobj.response && jobj.response.provisionMap) {
                jobj = jobj.response;
                let idx = jobj.provisionMap[pid];

                if (jobj.nymiband && idx < jobj.nymiband.length) {
                    this.callbacks.onDeviceInfo(1, pid, new TransientNymiBandInfo(jobj.nymiband[idx]), new NapiError());
                }
            }
        }
    }

    handleOpRandom (jobj) {
        let pid = this.getPid(jobj);

        if (!pid.length) {
            this.callbacks.onRandom(false, pid, '', new NapiError());
            return;
        }

        if (jobj.response && !jobj.response.pseudoRandomNumber) {
            this.callbacks.onRandom(false, pid, '', this.genMissingJsonKeyErr('pseudoRandomNumber', jobj));
            return;
        }

        this.callbacks.onRandom(true, pid, jobj.response.pseudoRandomNumber, new NapiError());
    }

    handleOpSymmetric (jobj) {
        let pid = this.getPid(jobj);

        if (!pid.length) {
            this.callbacks.onKeyCreation(false, pid, NymiApi.KeyType.SYMMETRIC, new NapiError());
            return;
        }

        if (jobj.operation[1] === 'run') {
            this.callbacks.onKeyCreation(jobj.successful, pid, NymiApi.KeyType.SYMMETRIC, new NapiError());
        } else if (jobj.operation[1] === 'get' && jobj.response && jobj.response.key) {
            this.callbacks.onSymmetricKey(true, pid, jobj.response.key, new NapiError());
        }
    }

    handleOpSignature (jobj) {
        let pid = this.getPid(jobj);

        if (!pid.length) {
            this.callbacks.onEcdsaSign(false, pid, '', '', new NapiError());
            return;
        }

        if (jobj.response) {
            if (!jobj.response.hasOwnProperty('signature')) {
                this.callbacks.onEcdsaSign(false, pid, '', '', this.genMissingJsonKeyErr('signature', jobj));
                return;
            }

            if (!jobj.response.hasOwnProperty('verificationKey')) {
                this.callbacks.onEcdsaSign(false, pid, '', '', this.genMissingJsonKeyErr('verificationKey', jobj));
                return;
            }

            jobj = jobj.response;

            this.callbacks.onEcdsaSign(true, pid, jobj.signature, jobj.verificationKey, new NapiError());
        }
    }

    handleOpTotp (jobj) {
        let pid = this.getPid(jobj);

        if (!pid.length) {
            this.callbacks.onTotpGet(false, pid, '', new NapiError());
            return;
        }

        if (!jobj.successful) {
            let errMsg = 'Could not complete CreateTOTP request. JSON response follows:\n';
            this.callbacks.onTotpGet(false, pid, '', new NapiError(errMsg + JSON.stringify(jobj)));
            return;
        }

        if (jobj.operation[1] === 'run') {
            this.callbacks.onTotpGet(jobj.successful, pid, '', new NapiError());
        } else if (jobj.operation[1] === 'get') {
            if (!jobj.response || !jobj.response.totp) {
                this.callbacks.onTotpGet(false, pid, '', this.genMissingJsonKeyErr('response/totp', jobj));
                return;
            }

            this.callbacks.onTotpGet(true, pid, jobj.response.totp, new NapiError());
        }
    }

    handleOpNotified (jobj) {
        let pid = this.getPid(jobj);
        let haptic = NymiApi.HapticNotification;

        if (!pid.length) {
            this.callbacks.onNotification(false, pid, haptic.ERROR, new NapiError());
            return;
        }

        if (!jobj.request || !jobj.request.hasOwnProperty('buzz')) {
            this.callbacks.onNotification(false, pid, haptic.ERROR, this.genMissingJsonKeyErr('request/buzz', jobj));
            return;
        }

        let notifyType = jobj.request.buzz ? haptic.NOTIFY_POSITIVE : haptic.NOTIFY_NEGATIVE;

        this.callbacks.onNotification(true, pid, notifyType, new NapiError());
    }

    handleOpApiNotifications (jobj) {
        if (jobj.operation[1] === 'set') { /* jshint -W035 */
            /*response of set is received here, not handling it for now*/
        } else if (jobj.operation[1] === 'report') {
            if (jobj.event && jobj.event.kind) {
                let eventType = jobj.event.kind;

                if (eventType === 'found-change' || eventType === 'presence-change') {
                    let before = jobj.event.before || '',
                        after = jobj.event.after || '',
                        pid = jobj.event.pid || '';

                    if (eventType === 'found-change') {
                        before = NymiApi.FoundStatus[before.toUpperCase()];
                        after = NymiApi.FoundStatus[after.toUpperCase()];

                        this.callbacks.onNymiBandFoundStatusChange(pid, before, after);
                    } else if (eventType === 'presence-change') {
                        let auth = jobj.event.authenticated || false;

                        before = NymiApi.PresenceStatus['DEVICE_PRESENCE_' + before.toUpperCase()];
                        after = NymiApi.PresenceStatus['DEVICE_PRESENCE_' + after.toUpperCase()];

                        this.callbacks.onNymiBandPresenceChange(pid, before, after, auth);
                    }

                }
            }
        } else if (jobj.operation[1] === 'get' && jobj.response) {
            this.callbacks.onNotificationsGetState(jobj.response);
        }
    }

    handleOpRevokeProvision (jobj) {
        let pid = this.getPid(jobj);
        this.callbacks.onProvisionRevoked(pid.length, pid, new NapiError());
    }

    handleOpKey (jobj) {
        let del = jobj.operation[1] === 'delete';
        let pid = this.getPid(jobj);
        let KeyType = NymiApi.KeyType;

        if (!pid.length) {
            this.callbacks[del ? 'onKeyRevocation' : 'onKeyCreation'](false, pid, KeyType.ERROR, new NapiError());
            return;
        }

        if (!jobj.request || !jobj.response) {
            this.callbacks.onKeyCreation(false, pid, KeyType.ERROR, new NapiError());
            return;
        }

        if (jobj.request.symmetric && !jobj.response.symmetric) {
            this.callbacks[del ? 'onKeyRevocation' : 'onKeyCreation'](true, pid, KeyType.SYMMETRIC, new NapiError());
        } else if (jobj.request.totp && !jobj.response.totp) {
            this.callbacks[del ? 'onKeyRevocation' : 'onKeyCreation'](true, pid, KeyType.TOTP, new NapiError());
        }
    }
}

module.exports = NymiApiResponseParser;