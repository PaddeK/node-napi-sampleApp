'use strict';

const NymiNodeApi = require('./NymiNodeApi');

class SampleAppCallbacks {
    constructor () {
        this.bands = [];
    }

    getBands () {
        return this.bands;
    }

    onDeviceInfo(opResult, pid, transientinfo, nErr) {
        if (!opResult) {
            console.error('Received error ' + nErr.errorString + ' for band with pid: ' + pid);
            return;
        }
        
        console.log('Info for Nymi band with provision id: ' + transientinfo.getPid());
        console.log('  Authentication status: ' + transientinfo.getFoundState());
        console.log('  Presence status: ' + transientinfo.getPresenceState());
        console.log('  Last RSSI: ' + transientinfo.getRssiLast());
        console.log('  Smoothed RSSI: ' + transientinfo.getRssiSmoothed());
        console.log('  Firmware version: ' + transientinfo.getFirmwareVersion());
        console.log('  Provisioned: ' + transientinfo.isProvisioned().toString());
        console.log('  Time since last contact: ' + transientinfo.getSinceLastContact());
        console.log('  Authentication window remaining: ' + transientinfo.getAuthenticationWindowRemaining());
        console.log('  Number of commands queued: ' + transientinfo.getNumCommandsQueued());

        let commands = transientinfo.getCommandsQueued();

        if (commands.length) {
            console.log('  Commands queued: ');
            commands.forEach(cmd => { console.log('    ' + cmd); });
        }
    }

    onEcdsaSign (opResult, pid, sig, vk, nErr) {
        if (!opResult) {
            console.error('Received error ' + nErr.errorString + ' for band with pid: ' + pid);
            return;
        }
        console.log('Received signature: '  +  sig  + ', with verification key: ' + vk  + ' for band with pid: ' + pid);
    }

    onAgreement (ptrns) {
        console.log('Pattern(s) discovered: ');

        ptrns.forEach(pattern => { console.log(pattern + ' '); });

        console.log('');

        if (!ptrns.length){
            console.log('\nConfirm the pattern on your Nymi Band by the accept command. Example: `accept ' + ptrns[0]);
        }

        console.log(' ');
    }

    onProvision (newprov) {
        console.log('Successfully provisioned with pid: ' + newprov.getPid());
        NymiNodeApi.instance.stopProvisioning();
		this.bands.push(newprov);
    }

    onError (err) {
        console.log('Got unknown or unhandled ERROR: ' + err.errorString);
    }

    onGetProvisions (provisions) {
        console.log('Provisions:');

        provisions.forEach(provision => {
            console.log(provision.getPid());
            this.bands.push(provision);
        });
    }

    onKeyCreation (opResult, pid, keyType, err) {
        if (!opResult) {
            console.error('Received error in key creation ' + err.errorString + ' for band with pid: ' + pid);
            return;
        }
        console.log('Created key type ' + Object.keys(NymiNodeApi.KeyType)[keyType] + ' for band with pid: ' + pid);
    }

    onKeyRevocation (opResult, pid, keyType, err) {
        if (!opResult) {
            console.error('Received error in key revocation ' + err.errorString + ' for band with pid: ' + pid);
            return;
        }
        console.log(Object.keys(NymiNodeApi.KeyType)[keyType] + ' revoked on Nymi Band with pid ' + pid);
    }

    onNewProvision (newprov) {
        console.log('Successfully provisioned with pid: '  +  newprov.getPid());
        NymiNodeApi.instance.stopProvisioning();
		this.bands.push(newprov);
    }

    onNotification (opResult, pid, type, err) {
        type = Object.keys(NymiNodeApi.HapticNotification)[++type];

		if (!opResult) {
	        console.error('Received error ' + err.errorString + ' for band with pid: ' + pid);
	        return;
	    }
	    console.log('Notification result: ' + opResult + ', Notification type: ' + type + ' for band with pid: ' + pid);
    }

    onNotificationsGetState (notificationState) {
        console.log('Notifications state: ');

        Object.keys(notificationState).forEach(key => { console.log(key + ' : ' + notificationState[key]); });
    }

    onNymiBandFoundStatusChange (pid, before, after) {
        before = Object.keys(NymiNodeApi.FoundStatus)[before];
        after = Object.keys(NymiNodeApi.FoundStatus)[after];

        console.log('onFoundChange, pid: ' + pid + ', before: ' + before + ', after: ' + after);
    }

    onNymiBandPresenceChange (pid, before, after, auth) {
        before = Object.keys(NymiNodeApi.PresenceStatus)[before];
        after = Object.keys(NymiNodeApi.PresenceStatus)[after];

        console.log('onPresenceChange, pid: %s, before: %s, after: %s, authenticated: %s', pid, before, after, auth);
    }

    onProvisionRevoked (opResult, pid, err) {
		if (err.errorString.length !== 0) {
            console.log('ERROR revoking provision on Nymi Band with pid ' + pid + ': ' + err.errorString);
        } else {
            console.log('Provision revoked on Nymi Band with pid ' + pid);
        }
        this.bands = this.bands.filter(prov => prov.getPid() !== pid);
    }

    onRandom (opResult, pid, prand, err) {
        if (!opResult) {
            console.error('Received error ' + err.errorString + ' for band with pid: ' + pid);
            return;
        }
		console.log('Received pseudo random number: ' + prand + ' for band with pid: ' + pid);
    }

    onStartStopProvisioning (newState) {
        console.log('Provisioning mode is now ' + newState);
    }

    onSymmetricKey (opResult, pid, sk, err) {
        if (!opResult) {
            console.log('Received error ' + err.errorString + ' for band with pid: ' + pid);
            return;
        }
		console.log('Received symmetric key: ' + sk + ' for band with pid: ' + pid);
    }

    onTotpGet (opResult, pid, totp, err) {
        if (!opResult) {
            console.log('Received error ' + err.errorString + ' for band with pid: ' + pid);
            return;
        }
		console.log('Received totp key: ' + totp + ' for band with pid: ' + pid);
    }

    onProvisionModeChange(provState) {
		console.log('Provisioning mode is now ' + provState);
    }

    getProvisionList (provList) {
        console.log('Provisions:');

        provList.forEach(prov => {
            console.log(prov.getPid());
            this.bands.push(prov);
        });
    }
}

module.exports = SampleAppCallbacks;