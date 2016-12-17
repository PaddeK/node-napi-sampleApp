'use strict';

const   crypto = require('crypto'),
        GenJson = require('./GenJson'),
        NymiNodeApi = require('./NymiNodeApi');

let exchange = new WeakMap();

class NymiProvision {

    constructor (pid) {
        this.pid = pid || '';

        function genExchange (pid, string) {
            return crypto.randomBytes(8).toString('hex') + string + pid;
        }

        exchange.set(this, genExchange.bind(this, this.getPid()));
    }

    getPid () {
        return this.pid;
    }

    getRandom () {
        NymiNodeApi.instance.put(GenJson.getRandom(this.getPid(), exchange.get(this)('random')));
    }

    createSymmetricKey (guarded) {
        NymiNodeApi.instance.put(GenJson.createSymkey(this.getPid(), guarded, exchange.get(this)('createsymkey')));
    }

    getSymmetricKey () {
        NymiNodeApi.instance.put(GenJson.getSymkey(this.getPid(), exchange.get(this)('getsymkey')));
    }

    signMessage (msgHash) {
        NymiNodeApi.instance.put(GenJson.signMsg(this.getPid(), msgHash, exchange.get(this)('sign')));
    }

    createTotpKey (totpKey, guarded) {
        NymiNodeApi.instance.put(GenJson.setTotp(this.getPid(), totpKey, guarded, exchange.get(this)('createTotp')));
    }

    getTotpKey () {
        NymiNodeApi.instance.put(GenJson.getTotp(this.getPid(), exchange.get(this)('getTotp')));
    }

    sendNotification(notifyType) {
        NymiNodeApi.instance.put(GenJson.notify(this.getPid(), notifyType, exchange.get(this)('notify')));
    }

    getDeviceInfo () {
        NymiNodeApi.instance.put(GenJson.getInfo(exchange.get(this)('deviceinfo')));
    }

    revokeKey (keyType) {
        let keyStr = ['', 'symmetric', 'totp'][keyType] || '';

        NymiNodeApi.instance.put(GenJson.deleteKey(this.getPid(), keyStr, exchange.get(this)('revokekey')));
    }

    revokeProvision (auth) {
        NymiNodeApi.instance.put(GenJson.revokeProvision(this.getPid(), auth, exchange.get(this)('revokeprovision')));
    }
}


module.exports = NymiProvision;