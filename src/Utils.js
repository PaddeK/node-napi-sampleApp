'use strict';

const NeaUtils = require('nea-helpers').Utils;

class Utils extends NeaUtils
{

    /**
     * Validate provision pattern
     * @param {string} pattern
     * @returns {boolean}
     */
    static validatePattern (pattern)
    {
        return /[+-]{5}/.test(pattern);
    }

    /**
     * Parse Band index given on commandline
     * @param {*} value
     * @returns {int}
     */
    static parseBandIndex (value)
    {
        let result = parseInt(value, 10);

        if (!Number.isSafeInteger(result) || result < 0) {
            throw new RangeError('Unknown band number or format');
        }

        return result;
    }

    /**
     * Print help
     * @return {void}
     */
    static printHelp () {
        console.log('\nIn all cmds below, i is index of the band in NymiProvision array `bands`.');
        console.log('\nProvisioning commands:');
        console.log('  `provision-start` enable provisioning bands.');
        console.log('  `provision-stop` disable provisioning bands.');
        // eslint-disable-next-line max-len
        console.log('  `accept [+|-]{5}` accept a provisioning pattern.\n     Pattern string has length 5, composed of \'+\' (led on) or \'-\' (led off).\n     e.g. `accept +----` to accept a pattern where only the first led is on.');
        console.log('  `provision-getall` get all bands provisioned to this NEA.');
        console.log('  `provision-gethere` get all bands provisioned to this NEA and are present.');
        console.log('  `provision-revoke i` Revoke provisioning of Nymi Band i.');
        console.log('\nCryptographic commands:');
        console.log('  `get-random i` get a random number from Nymi Band i.');
        console.log('  `setup-signature i` setup signing for Nymi Band i.');
        console.log('  `get-signature i` get a signature (of a currently hard coded msg) from Nymi Band i.');
        // eslint-disable-next-line max-len
        console.log('  `create-sk i g` create a symmetric key on Nymi Band i.\n     Guarded option: g=1 -> guarded, g=0 -> unguarded.\n     If the key is guarded, key retrieval requires user double tap.');
        console.log('  `get-sk i` get the symmetric key previously created on Nymi Band i.');
        console.log('  `delete-sk i` delete the symmetric key previously created on Nymi Band i.');
        // eslint-disable-next-line max-len
        console.log('  `create-totp i g` register totp (with a currently hardcoded totp key) on Nymi Band i.\n     Guarded option: g=1 -> guarded, g=0 -> unguarded.\n     If the key is guarded, key retrieval requires user double tap.');
        console.log('  `get-totp i` get a totp token from Nymi Band i.');
        console.log('  `delete-totp i` delete the totp registered on Nymi Band i.');
        console.log('\nHaptic command:');
        // eslint-disable-next-line max-len
        console.log('  `buzz i s` Send a haptic signal for status s to Nymi Band i.\n     Status option: s=1 -> success signal, s=0 -> error signal');
        console.log('\nInfo command:');
        console.log('  `info i` recieve a transient snapshot of the state of Nymi Band i.');
        console.log('\nApi notification commands:');
        console.log('  `get-noti-status` to get status of notification streams');
        // eslint-disable-next-line max-len
        console.log('  `onfoundchange-start` receive notification when there is a change in authentication status of a Nymi Band.');
        console.log('  `onfoundchange-stop` don\'t receive onfoundchange notifications.');
        // eslint-disable-next-line max-len
        console.log('  `onpresencechange-start` receive notification when there is a change in presence status of a Nymi Band.');
        console.log('  `onpresencechange-stop` don\'t receive onpresencechange notifications.');
        console.log('\nMiscellaneous commands:');
        console.log('  `clear` to clear the terminal/screen');
        console.log('  `help` to show this help');
        console.log('  `exit` to exit the sample app');
    }
}

module.exports = Utils;