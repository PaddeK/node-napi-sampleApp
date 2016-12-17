'use strict';

module.exports = {
    getInit: () => {
        return {
            path: 'init/get',
            exchange: '*init*'
        };
    },
    finish: () => {
        return {
            path: 'finish/run',
            exchange: '*finish*'
        };
    },
    startProv: () => {
        return {
            path: 'provision/run/start',
            exchange: '*provisioning*'
        };
    },
    stopProv: () => {
        return {
            path: 'provision/run/stop',
            exchange: '*provisioning*'
        };
    },
    getStateNotifications: () => {
        return {
            path: 'notifications/get',
            exchange: '*notifications*',
        };
    },
    getInfo: (exchange) => {
        return {
            path: 'info/get',
            exchange: String(exchange)
        };
    },
    acceptPattern: (pattern) => {
        return {
            path: 'provision/pattern',
            exchange: '*provisioning*',
            request: {
                action: 'accept',
                pattern: String(pattern)
            }
        };
    },
    getRandom: (pid, exchange) => {
        return {
            path: 'random/run',
            exchange: exchange,
            request: {
                pid: String(pid)
            }
        };
    },
    createSymkey: (pid, guarded, exchange) => {
        return {
            path: 'symmetricKey/run',
            exchange: String(exchange),
            request: {
                pid: String(pid),
                guarded: !!guarded
            }
        };
    },
    getSymkey: (pid, exchange) => {
        return {
            path: 'symmetricKey/get',
            exchange: String(exchange),
            request: {
                pid: String(pid)
            }
        };
    },
    signMsg: (pid, hash, exchange) => {
        return {
            path: 'sign/run',
            exchange: String(exchange),
            request: {
                pid: String(pid),
                hash: String(hash)
            }
        };
    },
    setTotp: (pid, totpKey, guarded, exchange) => {
        return {
            path: 'totp/run',
            exchange: String(exchange),
            request: {
                pid: String(pid),
                key: String(totpKey),
                guarded: !!guarded
            }
        };
    },
    getTotp: (pid, exchange) => {
        return {
            path: 'totp/get',
            exchange: String(exchange),
            request: {
                pid: String(pid)
            }
        };
    },
    notify: (pid, notifyType, exchange) => {
        return {
            path: 'buzz/run',
            exchange: String(exchange),
            request: {
                pid: String(pid),
                buzz: !!notifyType
            }
        };
    },
    enableNotification: (enable, state) => {
        let obj = {
            path: 'notifications/set',
            exchange: '*notifications*',
            request: {}
        };

        obj.request[state] = !!enable;

        return obj;
    },
    revokeProvision: (pid, onlyIfAuthenticated, exchange) => {
        return {
            path: 'revoke/run',
            exchange: String(exchange),
            request: {
                pid: String(pid),
                onlyIfAuthenticated: !!onlyIfAuthenticated
            }
        };
    },
    deleteKey: (pid, keyToDelete, exchange) => {
        let obj = {
            path: 'key/delete',
            exchange: String(exchange),
            request: {
                pid: String(pid)
            }
        };

        obj.request[keyToDelete] = true;

        return obj;
    }
};
