'use strict';

const
    NeaHelper = require('nea-helpers'),
    Factory = NeaHelper.RequestFactory,
    Events = NeaHelper.Events,
    Responses = NeaHelper.Responses;

class ResponseHandler
{
    /**
     * Create ResponseHandler instance
     * @param {object|Nea|EventEmitter} nea
     */
    constructor (nea)
    {
        this._nea = nea;
        this._bands = [];

        this._nea.on('InfoGet', this._infoHandler.bind(this));
        this._nea.on('ProvisionRunStart', this._provisionHandler.bind(this));
        this._nea.on('ProvisionRunStop', this._provisionHandler.bind(this));
        this._nea.on('ProvisionReportPatterns', this._provisionHandler.bind(this));
        this._nea.on('ProvisionReportProvisioned', this._provisionHandler.bind(this));
        this._nea.on('RandomRun', this._randomHandler.bind(this));
        this._nea.on('SymmetricKeyRun', this._symmetricKeyHandler.bind(this));
        this._nea.on('SymmetricKeyGet', this._symmetricKeyHandler.bind(this));
        this._nea.on('SignSetup', this._signatureHandler.bind(this));
        this._nea.on('SignRun', this._signatureHandler.bind(this));
        this._nea.on('TotpRun', this._totpHandler.bind(this));
        this._nea.on('TotpGet', this._totpHandler.bind(this));
        this._nea.on('BuzzRun', this._buzzHandler.bind(this));
        this._nea.on('NotificationsGet', this._notificationHandler.bind(this));
        this._nea.on('NotificationsReportFoundChange', this._notificationHandler.bind(this));
        this._nea.on('NotificationsReportPresenceChange', this._notificationHandler.bind(this));
        this._nea.on('RevokeRun', this._revokeHandler.bind(this));
        this._nea.on('KeyDelete', this._keyDeleteHandler.bind(this));
        this._nea.on('Error', console.error);
    }

    /**
     * Get Band at index
     * @param {int} bandIndex
     * @param {NeaRequest|function} request
     * @param {string} [pref = '']
     * @returns {function}
     */
    sendToBandAt (bandIndex, request, pref = '')
    {
        let band = this._bands.find(band => band.getTid() === bandIndex && band.isProvisioned());

        if (!band) {
            return () => console.error('Incorrect band index');
        }

        return (...args) => {
            this._nea.send(request.apply(null, [pref + band.getProvisionInfo().getPid()].concat(args)));
        }
    }

    /**
     * Handle Provision
     * @param {PatternEvent|ProvisionedEvent|AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _provisionHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        switch (true) {
            case res instanceof Events.Pattern:
                console.log('Pattern(s) discovered: ');
                res.getPatterns().forEach(pattern => console.log(pattern + ' '));
                console.log('');

                if (res.getPatterns().length) {
                    console.log('\nConfirm the pattern on your Nymi Band by the accept command. ' +
                                'Example: `accept ' + res.getPatternAt(0));
                }

                console.log(' ');
                break;
            case res instanceof Events.Provisioned:
                console.log('Successfully provisioned with pid: ' + res.getNymiBandInfo().getProvisionInfo().getPid());
                this._nea.send(Factory.provisionStop());
                this._bands.push(res.getNymiBandInfo());
                break;
            case res instanceof Responses.Acknowledgement:
                console.log('Provisioning mode is now ' + res.getOperation().pop());
                break;
        }
    }

    /**
     * Handle Totp
     * @param {TotpResponse|AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _totpHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        if (res instanceof Responses.Totp) {
            console.log(`Received totp key: ${res.getTotp()} for band with pid: ${res.getRequest().pid}`);
        } else {
            console.log(`Created key type TOTP for band with pid: ${res.getRequest().pid}`);
        }
    }

    /**
     * Handle KeyDelete
     * @param {KeyDeleteResponse} res
     * @private
     * @return {*}
     */
    _keyDeleteHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        let type = Object.keys(res.getRequest()).find(key => res.getRequest()[key] === true);

        console.log(`Key type ${type.toUpperCase()} revoked on Nymi Band with pid: ${res.getRequest().pid}`);
    }

    /**
     * Handle Revoke
     * @param {AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _revokeHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        console.log(`Provision revoked on Nymi Band with pid: ${res.getRequest().pid}`);

        this._bands = this._bands.filter(band => band.getProvisionInfo().getPid() !== res.getRequest().pid);
    }

    /**
     * Handle Notification
     * @param {NotificationResponse|FoundChangeEvent|PresenceChangeEvent} res
     * @private
     * @return {*}
     */
    _notificationHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        let notificationState, before, after, auth, pid;

        switch (true) {
            case res instanceof Responses.Notification:
                console.log('Notifications state: ');
                notificationState = res.getNotificationInfo().toJson();
                Object.keys(notificationState).forEach(key => console.log(`${key} : ${notificationState[key]}`));
                break;
            case res instanceof Events.PresenceChange:
                before = NeaHelper.Const.PresenceState[res.getBefore().toUpperCase()];
                after = NeaHelper.Const.PresenceState[res.getAfter().toUpperCase()];
                pid = res.getPid();
                auth = res.isAuthenticated();
                console.log(
                    `onPresenceChange, pid: ${pid}, before: ${before}, after: ${after}, authenticated: ${auth}`
                );
                break;
            case res instanceof Events.FoundChange:
                before = NeaHelper.Const.FoundState[res.getBefore().toUpperCase()];
                after = NeaHelper.Const.FoundState[res.getAfter().toUpperCase()];
                console.log(`onFoundChange, pid: ${res.getPid()}, before: ${before}, after: ${after}`);
                break;
        }
    }

    /**
     * Handle Buzz
     * @param {AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _buzzHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        let pid = res.getRequest().pid,
            type = Object.keys(NeaHelper.Const.HapticNotification)[~~res.getRequest().buzz];

        console.log(`Notification result: ${res.isSuccessful()}, Notification type: ${type} for band with pid: ${pid}`);
    }

    /**
     * Handle Signature
     * @param {SignatureResponse|AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _signatureHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        if (res instanceof Responses.Signature) {
            let sig = res.getSignature(), vk = res.getVerificationKey(), pid = res.getRequest().pid;
            console.log(`Received signature: ${sig}, with verification key: ${vk} for band with pid: ${pid}`);
        } else {
            console.log(`Signature setup done for band with pid: ${res.getRequest().pid}`);
        }
    }

    /**
     * Handle Symmetric
     * @param {SymmetricKeyResponse|AcknowledgementResponse} res
     * @private
     * @return {*}
     */
    _symmetricKeyHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        if (res instanceof Responses.SymmetricKey) {
            console.log(`Received symmetric key: ${res.getKey()} for band with pid: ${res.getRequest().pid}`);
        } else {
            console.log(`Created key type SYMMETRIC for band with pid: ${res.getRequest().pid}`);
        }
    }

    /**
     * Handle Random
     * @param {RandomResponse} res
     * @private
     * @return {*}
     */
    _randomHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        console.log(`Received pseudo random number: ${res.getRandom()} for band with pid: ${res.getRequest().pid}`);
    }

    /**
     * Handle Info
     * @param {InfoResponse} res
     * @private
     * @return {*}
     */
    _infoHandler (res)
    {
        if (res.getErrors() !== null) {
            return this._errorHandler(res);
        }

        this._bands = res.getNymiBands();

        if (res.getExchange().includes('deviceinfo')) {
            let pid = res.getExchange().substr(res.getExchange().indexOf('deviceinfo') + 10),
                band = res.getNymiBandByPid(pid);

            if (!band) {
                console.error('No band found with pid: ' + pid);
                return;
            }

            console.log('Info for Nymi band with provision id: ' + band.getProvisionInfo().getPid());
            console.log('  Authentication status: ' + band.getFound());
            console.log('  Presence status: ' + band.getPresent());
            console.log('  Last RSSI: ' + band.getRssi(false));
            console.log('  Smoothed RSSI: ' + band.getRssi(true));
            console.log('  Firmware version: ' + band.getFirmwareVersion());
            console.log('  Provisioned: ' + band.isProvisioned().toString());
            console.log('  Time since last contact: ' + band.getSinceLastContact());
            // eslint-disable-next-line max-len
            console.log('  Authentication window remaining: ' + band.getProvisionInfo().getAuthenticationWindowRemaining());
            console.log('  Number of commands queued: ' + band.getProvisionInfo().getCommandsQueued());

            let commands = band.getProvisionInfo().getCommandQueue();

            if (commands.length) {
                console.log('  Commands queued: ');
                commands.forEach(cmd => { console.log('    ' + cmd); });
            }
            return;
        }

        console.log('Provisions:');

        (res.getExchange() === 'provisions' ? res.getProvisions() : res.getPresentProvisions()).forEach(prov => {
            console.log(prov);
        })
    }

    /**
     * Handle error
     * @param {BaseResponse} res
     * @private
     * @return {void}
     */
    _errorHandler (res)
    {
        console.error(res.getErrors(true));
    }
}

module.exports = ResponseHandler;