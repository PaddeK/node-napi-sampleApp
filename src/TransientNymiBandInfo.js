'use strict';
/* jshint -W106 */

const api = require('./NymiNodeApi');

class TransientNymiBandInfo {
    constructor (jobj) {
        this.device = jobj;
    }

    getRssiLast () {
        return parseInt(this.device.RSSI_last, 10) || 0;
    }

    getRssiSmoothed () {
        return parseInt(this.device.RSSI_smoothed, 10) || 0;
    }

    getCommandsQueued () {
        return Array.isArray(this.device.commandQueue) ? this.device.commandQueue : [];
    }

    getFirmwareVersion () {
        return this.device.firmwareVersion || '';
    }

    getFoundState () {
        let found = api.FoundStatus;
        let state = this.device.found ? found[this.device.found.toUpperCase()] : found.ERROR;
        return 'FoundStatus::' + Object.keys(found)[state];
    }

    getPresenceState () {
        let present = api.PresenceStatus;
        let presence = this.device.present;
        let state = presence ? present['DEVICE_PRESENCE_' + presence.toUpperCase()] : present.PresenceStatus.ERROR;
        return 'Present::' + Object.keys(present)[state];
    }

    isProvisioned () {
        return !!this.device.isProvisioned;
    }

    getSinceLastContact () {
        return parseFloat(this.device.sinceLastContact) || 0.0;
    }

    getAuthenticationWindowRemaining () {
        return this.device.provisioned ? parseFloat(this.device.provisioned.authenticationWindowRemaining) : 0.0;
    }

    getNumCommandsQueued () {
        return this.device.provisioned ? parseInt(this.device.provisioned.commandsQueued) : 0;
    }

    enabledSigning () {
        return this.device.provisioned && this.device.provisioned.enabledSigning;
    }

    enabledSymmetricKeys () {
        return this.device.provisioned && this.device.provisioned.enabledSymmetricKeys;
    }

    enabledTOTP () {
        return this.device.provisioned && this.device.provisioned.enabledTOTP;
    }

    getPid () {
        return this.device.provisioned ? this.device.provisioned.pid : '';
    }

}

module.exports = TransientNymiBandInfo;