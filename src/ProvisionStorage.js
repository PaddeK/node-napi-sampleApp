'use strict';

const
    Utils = require('nea-helpers').Utils,
    path = require('path'),
    fs = require('fs');

class ProvisionStorage
{
    /**
     * Provision storage
     * @param {string} file
     */
    constructor (file)
    {
        let dir = path.dirname(file);

        if (!Utils.isValidPath(dir) || !Utils.hasAccess(dir, 'frw')) {
            throw new Error('Invalid file or insufficient permissions');
        }

        if (path.basename(file).length === 0) {
            file = path.resolve(dir, 'provisions.json');
        }

        this._file = file;
    }

    /**
     * Read provision data
     * @return {string}
     */
    read ()
    {
        return Utils.tryCatch(() => fs.readFileSync(this._file, 'utf8'), '{}');
    }

    /**
     * Write provision data
     * @param {string} data
     * @return {void}
     */
    write (data)
    {
        fs.writeFileSync(this._file, Utils.tryCatch(() => JSON.stringify(data, null, 4), '{}'), 'utf8');
    }
}

module.exports = ProvisionStorage;