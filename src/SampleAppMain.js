'use strict';

const Util = require('./Util');
const readline = require('readline');
const NymiNodeApi = require('./NymiNodeApi');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

rl.prompt();

let util = new Util(rl);
let port = 9088;
let nymulator = true;   // use nymulator (true) or physical band (false)

util.initNapi('.', 0, port, '127.0.0.1', nymulator);

console.log('-*-*-> NymiApi initialization succeeded. Enter `help` for list of supported commands. <-*-*-\n');
console.log('Populating band table with any existing provisioned bands');

util.getNapi().getProvisions(NymiNodeApi.ProvisionListType.ALL);
util.getNapi().startProvisioning();

rl.on('line', line => {
    let cmdarr, command,
        bandIndex = -1,
        guarded = false,
        pattern = '';

    line = line.trim();
    cmdarr = line.split(/\s+/);
    command = cmdarr[0];

    switch (cmdarr.length) {
        case 1:
            break;
        case 2:
            if (command === 'accept') {
                pattern = cmdarr[1];
            } else {
                try {
                    bandIndex = Util.parseBandIndex(cmdarr[1]);
                } catch(err) {
                    command = '';
                }
            }
            break;
        case 3:
            try {
                bandIndex = Util.parseBandIndex(cmdarr[1]);
            } catch(err) {
                command = '';
            }
            guarded = cmdarr[2] === '1';
            break;
        default:
            console.log('Improper number of arguments.  Type \'help\' for a list of commands and their syntax.');
            break;
    }

    switch(command) {
        case 'accept':
            if (!util.validatePattern(pattern)) {
                console.log('Pattern must be 5 characters long, and composed only of \'+\' (led on) and \'-\' (led off) characters.');
                break;
            }
            console.log('Accepting pattern ' + pattern);
            util.getNapi().acceptPattern(pattern);
            break;
        case 'provision-start':
            util.getNapi().startProvisioning();
            break;
        case 'provision-stop':
            util.getNapi().stopProvisioning();
            break;
        case 'provision-getall':
            util.getNapi().getProvisions(NymiNodeApi.ProvisionListType.ALL);
            break;
        case 'provision-gethere':
            util.getNapi().getProvisions(NymiNodeApi.ProvisionListType.PRESENT);
            break;
        case 'get-random':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].getRandom();
            }
            break;
        case 'create-sk':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].createSymmetricKey(guarded);
            }
            break;
        case 'get-sk':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].getSymmetricKey();
            }
            break;
        case 'get-signature':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].signMessage('7a1a5ee210a9dd4fc0a12319c394862f7caa7fe513bbbc8d22032f8e87e6c307');
            }
            break;
        case 'create-totp':
            if (util.validateBandIndex(bandIndex)) {
                let totpkeystr = '48656c6c6f21deadbeef'; //hard coded in sample app, should be user provided.
                util.getBands()[bandIndex].createTotpKey(totpkeystr, guarded);
            }
            break;
        case 'get-totp':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].getTotpKey();
            }
            break;
        case 'buzz':
            // We use the "guarded" value even though it doesn't mean guarded in this context
            if (util.validateBandIndex(bandIndex)) {
                let notval = guarded ? NymiNodeApi.HapticNotification.NOTIFY_POSITIVE : NymiNodeApi.HapticNotification.NOTIFY_NEGATIVE;
                util.getBands()[bandIndex].sendNotification(notval);
            }
            break;
        case 'info':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].getDeviceInfo();
            }
            break;
        case 'get-noti-status':
            util.getNapi().getApiNotificationState();
            break;
        case 'onfoundchange-stop':
            util.getNapi().disableOnFoundChange();
            break;
        case 'onpresencechange-stop':
            util.getNapi().disableOnPresenceChange();
            break;
        case 'onfoundchange-start':
            util.getNapi().enableOnFoundChange();
            break;
        case 'onpresencechange-start':
            util.getNapi().enableOnPresenceChange();
            break;
        case 'provision-revoke':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].revokeProvision(false);
            }
            break;
        case 'delete-sk':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].revokeKey(NymiNodeApi.KeyType.SYMMETRIC);
            }
            break;
        case 'delete-totp':
            if (util.validateBandIndex(bandIndex)) {
                util.getBands()[bandIndex].revokeKey(NymiNodeApi.KeyType.TOTP);
            }
            break;
        case 'exit':
            rl.close();
            break;
        case 'help':
            Util.printHelp();
            break;
        case 'clear':
            console.log('\u001b[2J\u001b[0;0H');
            break;
        case '':
            break;
        default:
            console.log('Command not found. Enter `help` to see list of supported commands.');
            break;
    }

    rl.prompt();
}).on('close', () => {
    util.getNapi().terminate();
    process.exit(0);
});