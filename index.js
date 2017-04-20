'use strict';

const
    crypto = require('crypto'),
    NeaHelpers = require('nea-helpers'),
    Nea = NeaHelpers.Nea,
    NeaConfig = NeaHelpers.NeaConfig,
    Factory = NeaHelpers.RequestFactory,
    readline = require('readline'),
    ResponseHandler = require('./src/ResponseHandler'),
    Utils = require('./src/Utils'),
    ProvisionStorage = require('./src/ProvisionStorage'),
    sha256 = (message) => crypto.createHash('sha256').update(message).digest('hex'),
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });

rl.prompt();

let nea, handler,
    config = new NeaConfig(__dirname + '/config.json'),
    storage = new ProvisionStorage('./provisions.json');

config.
    setName('sampleApp').
    useNymulator(true).     // use nymulator (true) or physical band (false)
    setPort(9088).          // nymulator port usually 9088 / physical band 9089
    save();

nea = new Nea(config, storage);
handler = new ResponseHandler(nea);

nea.start().then(() => {
    console.log('-*-*-> NymiApi initialization succeeded. Enter `help` for list of supported commands. <-*-*-\n');
    console.log('Populating band table with any existing provisioned bands');

    nea.send(Factory.getInfo());
    nea.send(Factory.provisionStart());

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
                        bandIndex = Utils.parseBandIndex(cmdarr[1]);
                    } catch(err) {
                        command = '';
                    }
                }
                break;
            case 3:
                try {
                    bandIndex = Utils.parseBandIndex(cmdarr[1]);
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
                if (!Utils.validatePattern(pattern)) {
                    console.log('Pattern must be 5 characters long, and composed only ' +
                                'of \'+\' (led on) and \'-\' (led off) characters.');
                    break;
                }
                console.log('Accepting pattern ' + pattern);
                nea.send(Factory.acceptPattern(pattern));
                break;
            case 'provision-start':
                nea.send(Factory.provisionStart());
                break;
            case 'provision-stop':
                nea.send(Factory.provisionStop());
                break;
            case 'provision-getall':
                nea.send(Factory.getInfo('provisions'));
                break;
            case 'provision-gethere':
                nea.send(Factory.getInfo('provisionsPresent'));
                break;
            case 'get-random':
                handler.sendToBandAt(bandIndex, Factory.getRandom)();
                break;
            case 'create-sk':
                handler.sendToBandAt(bandIndex, Factory.createSymmetricKey)(guarded);
                break;
            case 'get-sk':
                handler.sendToBandAt(bandIndex, Factory.getSymmetricKey)();
                break;
            case 'setup-signature':
                handler.sendToBandAt(bandIndex, Factory.signSetup)(NeaHelpers.Const.SignatureAlgorithm.NIST256P);
                break;
            case 'get-signature':
                handler.sendToBandAt(bandIndex, Factory.signMessage)(sha256('hello world'));
                break;
            case 'create-totp':
                //hard coded in sample app, should be user provided.
                handler.sendToBandAt(bandIndex, Factory.createTotp)('48656c6c6f21deadbeef', guarded);
                break;
            case 'get-totp':
                handler.sendToBandAt(bandIndex, Factory.getTotp)();
                break;
            case 'buzz':
                // We use the "guarded" value even though it doesn't mean guarded in this context
                handler.sendToBandAt(bandIndex, Factory.notifyBand)(guarded);
                break;
            case 'info':
                handler.sendToBandAt(bandIndex, Factory.getInfo, 'deviceinfo')();
                break;
            case 'get-noti-status':
                handler.sendToBandAt(bandIndex, Factory.getEvents)();
                break;
            case 'onfoundchange-stop':
                nea.send(Factory.setEvents(false));
                break;
            case 'onpresencechange-stop':
                nea.send(Factory.setEvents(null, false));
                break;
            case 'onfoundchange-start':
                nea.send(Factory.setEvents(true));
                break;
            case 'onpresencechange-start':
                nea.send(Factory.setEvents(null, true));
                break;
            case 'provision-revoke':
                handler.sendToBandAt(bandIndex, Factory.revokeProvision)(false);
                break;
            case 'delete-sk':
                handler.sendToBandAt(bandIndex, Factory.deleteKey)(false, false, true);
                break;
            case 'delete-totp':
                handler.sendToBandAt(bandIndex, Factory.deleteKey)(false, false, false, true);
                break;
            case 'exit':
                rl.close();
                break;
            case 'help':
                Utils.printHelp();
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
        nea.stop().then(() => process.exit(0)).catch(() => process.exit(1));
    });
}).catch(err => {
    console.error(err);
    nea.stop().then(() => process.exit(0)).catch(() => process.exit(1));
});