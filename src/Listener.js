'use strict';

const NapiBinding = require('napi-bindings');

let napi = null;

process.on('message', msg => {
    switch (msg.op) {
        case 'init':
            napi = new NapiBinding(msg.nymulator);

            let init = napi.jsonNapiConfigureD(msg.dir, msg.log, msg.port, msg.host);

            if (init !== NapiBinding.ConfigOutcome.OKAY) {
                console.error('NymiApi initialization failed');
                process.exit(1);
            }
            break;
        case 'quit':
            napi.jsonNapiTerminateD();
            process.exit();
            break;
        case 'put':
            napi.jsonNapiPutD(msg.query);
            break;
    }
});

let get, interval;

function doGet() {
    clearInterval(interval);

    if (napi !== null) {
        get = napi.jsonNapiGetTSD(100, 100);

        if(get.outcome === NapiBinding.JsonGetOutcome.OKAY) {
            process.send(get.message);
        }
    }

    interval = setInterval(doGet, 100);
}

doGet();


