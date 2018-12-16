'use strict';

const sync = require('../app.js');

class Storage
{
    constructor(conn) {
        this.conn = conn;
    }

    /**
     * @param limit
     * @param offset
     * @returns {Promise<Array>}
     */
    async get(limit, offset) {
        return await this.conn.select('blocks', 0, limit, offset, 'all');
    }


    async getBet(id) {
        return await this.conn.call('getBet',id);
    }

    async getTokenScamPercent(address) {
        return await this.conn.call('getTokenScamPercent', address);
    }

    async isRoundExists(id) {
        return (await this.conn.select('rounds', 0, 1, 0, 'eq', [id])).length > 0;
    }

    async isUserExists(round_id, user_id) {
        return (await this.conn.select('participants', 'user_round', 1, 0, 'eq', [user_id, round_id])).length > 0;
    }

    async isCommentExists(comment_id) {
        return (await this.conn.select('comments', 'comment_id', 1, 0, 'eq', [comment_id])).length > 0;
    }

    async setRound(round_id, start, end, bet, creator_address, creator_id) {
        return await this.conn.insert('rounds', [round_id, start, end, bet, creator_address, creator_id]);
    }

    async setComment(comment_id, timestamp, likes_count, user_id) {
        return await this.conn.insert('comments', [comment_id, timestamp, user_id, likes_count, user_id]);
    }

    async setParticipant(round_id, user_id, address) {
        return await this.conn.insert('participants', [round_id, user_id, address]);
    }

    async updateBalances(updates, blockHash) {
        if (updates && Array.isArray(updates) && updates.length > 0) {
            for (let x = 0; x < updates.length; x++) {
                let update = updates[x];
                if (update.kind.localeCompare('contract') === 0) {
                    await this.changeBalance(update.contract, +update.change, blockHash);
                } else if (update.kind.localeCompare('freezer') === 0) {
                    if (update.category.localeCompare('deposits') === 0) {
                        await this.changeDeposits(update.delegate, +update.change, blockHash)
                    } else if (update.category.localeCompare('rewards') === 0) {
                        await this.changeRewards(update.delegate, +update.change, blockHash)
                    } else if (update.category.localeCompare('fees') === 0) {
                        await this.changeFees(update.delegate, +update.change, blockHash)
                    }
                }
            }
        }
    }

    async checkExistsBalance(address, blockHash) {
        let balance = await this.getBalance(address);
        if (Array.isArray(balance) && balance.length == 0) {
            let initialBalance = await sync.callApi('/chains/main/blocks/' + blockHash + '/context/contracts/' + address + '/balance').catch(async (err) => {
                    if (err.toString().includes('NotFoundError')) {
                        return await this.conn.call('addBalance', address, 0);
                    }
                    else {
                        throw(err);
                    }
                });
            return await this.conn.call('addBalance', address, Number(initialBalance));
        }
    }

    async changeDeposits(address, amount, blockHash) {
        await this.checkExistsBalance(address, blockHash);
        return await this.conn.call('changeDeposits', address, amount);
    }

    async changeRewards(address, amount, blockHash) {
        await this.checkExistsBalance(address, blockHash);
        return await this.conn.call('changeRewards', address, amount);
    }

    async changeFees(address, amount, blockHash) {
        await this.checkExistsBalance(address, blockHash);
        return await this.conn.call('changeFees', address, amount);
    }

    async getLastBlock() {
        return await this.conn.call('getLastBlockLevel');
    }

    async getBlockHashByNumber(number) {
        return await this.conn.call('getBlockHashByNumber', number);
    }

    async checkFreeze(blockNumber) {
        return await this.conn.call('checkFreeze', blockNumber);
    }

    /**
     * @returns {Promise<Array>}
     */
    async getOne(hash) {
        return await this.conn.select('blocks', 0, 1, 0, 'eq', [hash]);
    }

    async putToken(id, timestamp, issuer, address, name, description, scamPercent) {
        console.log('insert');
        return await this.conn.insert('tokens',
            [
                Number(id),
                Number(timestamp),
                issuer,
                address,
                name,
                description,
                scamPercent
            ]
        );
    }

    async insertBaking(blockHash, opHash, blockLevel, baker, timestamp) {
        return await this.conn.insert('bakings',
            [
                blockHash, opHash, Number(blockLevel), baker, timestamp
            ]
        );
    }

    async setSuccessor(target, successor) {
        let block = await this.conn.select('blocks', 0, 1, 0, 'eq', [target]);
        if (!block[0]) return;
        block = block[0];
        block[20] = successor;
        return await this.conn.replace('blocks', block);
    }


    async insertOperationBalance(kind, blockHash, operation, blockNumber, content, timestamp, baker, predeccessor) {

        switch(kind) {
            case 'endorsement':
                let balance_updates = operation.contents[content].metadata.balance_updates;
                return await this.updateBalances(balance_updates, predeccessor);

            case 'transaction':
                if (!operation.contents[content].metadata.operation_result.status.includes('failed')) {
                    await this.updateBalances(operation.contents[content].metadata.operation_result.balance_updates, predeccessor);
                }
                if (operation.contents[content].metadata.internal_operation_results) {
                    console.log('internal tx');
                    for (let result = 0; result < operation.contents[content].metadata.internal_operation_results.length; result++) {
                        let opRes = operation.contents[content].metadata.internal_operation_results[result];
                        if (opRes.result.status.includes('applied')) {
                            console.log(opRes.result.balance_updates);
                            await this.updateBalances(opRes.result.balance_updates, predeccessor);
                        }
                    }
                }

                console.log(operation.contents[content].metadata.balance_updates);

                return await this.updateBalances(operation.contents[content].metadata.balance_updates, predeccessor);

            case 'origination':
                if (!operation.contents[content].metadata.operation_result.status.includes('failed'))
                    return await this.updateBalances(operation.contents[content].metadata.operation_result.balance_updates, predeccessor);
                return;

            case 'delegation':
                if (operation.contents[content].metadata.operation_result.status.includes('applied'))
                    await this.updateBalances(operation.contents[content].metadata.balance_updates, predeccessor);
                return;

            case 'double_baking_evidence':
                return await this.updateBalances(operation.contents[content].metadata.balance_updates, predeccessor);

            case 'reveal':
                return;


            case 'seed_nonce_revelation':
                return await this.updateBalances(operation.contents[content].metadata.balance_updates, predeccessor);

            case 'activate_account':
                return await this.updateBalances(operation.contents[content].metadata.balance_updates, predeccessor);



            default: console.log('Unexpected operation kind: '+ kind + '; blockHash: ' + blockHash);
        }
    }

}

module.exports = Storage;