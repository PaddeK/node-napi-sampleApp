'use strict';

const napi = require('napi-bindings');

process.on('message', msg => {
    switch (msg.op) {
        case 'init':
            let init = napi.jsonNapiConfigureD(msg.dir, msg.log, msg.port, msg.host);

            if (init !== napi.ConfigOutcome.OKAY) {
                console.error('NymiApi initialization failed');
                process.exit(1);
            }
            break;
        case 'quit':
            napi.jsonNapiTerminateD();
            process.exit();
            break;
        case 'put':
            napi.jsonNapiPutD(JSON.stringify(msg.query));
            break;
    }
});

let get, interval;

function doGet() {
    clearInterval(interval);

    get = napi.jsonNapiGetTSD(100, 100);

    if (get.outcome === napi.JsonGetOutcome.OKAY) {
        process.send(get.message);
    }

    interval = setInterval(doGet, 100);
}

doGet();


