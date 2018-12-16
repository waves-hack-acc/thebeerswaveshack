'use strict';

class Repo
{
    constructor(conn) {
        this.conn = conn;
    }

    /**
     * @param limit
     * @param offset
     * @returns {Promise<Array>}
     */
    async get(hash) {

        let res =  await this.conn.call('getTokenScamPercent', hash);
        console.log(res);
        return res;
    }
}

module.exports = Repo;