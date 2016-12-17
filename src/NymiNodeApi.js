'use strict';

const   cluster = require('cluster'),
        emptyFn = () => {},
        GenJson = require('./GenJson');

let instance;

class NymiNodeApi {
    static get HapticNotification () {
        return {
            ERROR: -1,
            NOTIFY_NEGATIVE: 0,
            NOTIFY_POSITIVE: 1
        };
    }

    static get FoundStatus () {
        return{
            ERROR: 0,
            ANONYMOUS: 1,
            AUTHENTICATED: 2,
            IDENTIFIED: 3,
            PROVISIONING: 4,
            UNCLASPED: 5,
            UNDETECTED: 6,
            UNPROVISIONABLE: 7,
            DISCOVERED: 8
        };
    }

    static get PresenceStatus () {
        return{
            ERROR: 0,
            DEVICE_PRESENCE_NO: 1,
            DEVICE_PRESENCE_UNLIKELY: 2,
            DEVICE_PRESENCE_LIKELY: 3,
            DEVICE_PRESENCE_YES: 4
        };
    }

    static get ProximityState () {
        return{
            ERROR: 0,
            PROXIMITY_STATE_NOT_READY: 1,
            PROXIMITY_STATE_UNDETECTABLE: 2,
            PROXIMITY_STATE_DETECTABLE: 3,
            PROXIMITY_STATE_SPHERE1: 4,
            PROXIMITY_STATE_SPHERE2: 5,
            PROXIMITY_STATE_SPHERE3: 6,
            PROXIMITY_STATE_SPHERE4: 7
        };
    }

    static get KeyType () {
        return{
            ERROR: 0,
            SYMMETRIC: 1,
            TOTP: 2
        };
    }

    static get ProvisionListType () {
        return{
            ALL: 0,
            PRESENT: 1
        };
    }

    constructor (callback) {
        this.listener = null;
    	this.callback = callback || emptyFn;

        if (!instance) {
            instance = this;
        }

        return instance;
    }

    static get instance () {
        return instance;
    }

    init (dir, log, port, host) {
        console.log('Initializing NAPI');

        cluster.setupMaster({exec: './src/Listener.js'});
        this.listener = cluster.fork();

        if (!this.listener.isDead()) {
        	this.listener.on('message', this.callback);
			this.listener.send({op: 'init', dir: dir, port: port, log: log, host: host});
		}

        return this.listener;
    }

    put (query) {
        if (this.listener && !this.listener.isDead()) {
            this.listener.send({op: 'put', query: query});
        }
    }

    terminate () {
    	if (this.listener && !this.listener.isDead()) {
			this.listener.send({op: 'quit'});

			Object.keys(cluster.workers).forEach(id => {
				if (!cluster.workers[id].isDead()) {
					cluster.workers[id].kill('SIGTERM');
				}
			});

            console.log('NymiApi terminated');
		}
    }

    startProvisioning () {
        this.put(GenJson.startProv());
    }

    acceptPattern (pattern) {
        this.put(GenJson.acceptPattern(pattern));
    }

    stopProvisioning () {
        this.put(GenJson.stopProv());
    }

    getProvisions (provisionType) {
  		let type = provisionType === NymiNodeApi.ProvisionListType.ALL ? 'provisions' : 'provisionsPresent';
  		this.put(GenJson.getInfo(type));
    }

    enableOnFoundChange () {
		this.put(GenJson.enableNotification(true, 'onFoundChange'));
    }

    enableOnPresenceChange () {
		this.put(GenJson.enableNotification(true, 'onPresenceChange'));
    }

    disableOnFoundChange () {
		this.put(GenJson.enableNotification(false, 'onFoundChange'));
    }

    disableOnPresenceChange () {
		this.put(GenJson.enableNotification(false, 'onPresenceChange'));
    }

    getApiNotificationState () {
        this.put(GenJson.getStateNotifications());
    }
}

module.exports = NymiNodeApi;