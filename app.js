const TarantoolConnection = require('tarantool-driver');
const Storage = require('./Storage/Storage');
const axios = require('axios');

process.title = 'syncing blockchain';

const conn = new TarantoolConnection({host: '127.0.0.1', port: 3301});

const WAVES_TOKEN_API_URL = 'https://nodes.wavesnodes.com/transactions/info/';

const scamCX = '000017508735297593231:bgv_yoycqaq';
const goodCX = '000017508735297593231:tsmotopvz1c';

// const storage = new Storage(conn);

async function start() {

    let tokenAddress = 'DptxnwX74V11CehAq8PCUg6ZqCZhTkDiyU5QJfbEwR7C';

    let tokenScamPercent = await checkToken(tokenAddress);

    console.log(tokenScamPercent);
}

async function checkToken(address) {

    let scamPercent = await storage.getTokenScamPercent(address);

    // returns if scam
    if (scamPercent && scamPercent > 98)
        return scamPercent;

    //fetch data from node
    let apiData = (await axios.get(WAVES_TOKEN_API_URL + address)).data;
    console.log(apiData);

    let issuer = apiData.sender;

    let issuerScamPercent = await checkAccount(issuer);

    if (issuerScamPercent > 98) {
        await storage.setTokenRating(address, 99);
        return 99;
    }

    let scamCount = await fetchScamGoogleCount(address);

    let goodCount = await fetchGoodGoogleCount(address);

    if (scamCount == goodCount && scamCount !== 0) {
        await storage.setTokenRating(address, 50);
        return 50;
    }

    if (scamCount > goodCount) {
        await storage.setTokenRating(address, 99);
        return 99;
    }

    if (scamCount < goodCount) {
        await storage.setTokenRating(address, 10);
        return 10;
    }

    let isBadName = await storage.checkName(apiData.name);
    let isGoodName = await storage.checkDescription(apiData.name);

}

async function fetchScamGoogleCount(address) {
    let response = await axios.get('https://www.googleapis.com/customsearch/v1?key=AIzaSyBsnjZX2wAwheDIoQ0EAqsZ_j0_1sT2t5o&cx='
        + scamCX
        + '&q=' + address
        +'%20scam');
    if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log(response.data.items.length);
        return response.data.items.length;
    }
    return 0;
}

async function fetchGoodGoogleCount(address) {
    let response = await axios.get('https://www.googleapis.com/customsearch/v1?key=AIzaSyBsnjZX2wAwheDIoQ0EAqsZ_j0_1sT2t5o&cx='
        + goodCX
        + '&q=' + address);
    if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log(response.data.items.length);
        return response.data.items.length;
    }
    return 0;
}

async function checkAccount(address) {

    let scamPercent = await storage.getUserScamPercent(address);

    if (scamPercent && scamPercent > 98)
        return scamPercent;

    let scamCount = await fetchScamGoogleCount(address);

    let goodCount = await fetchGoodGoogleCount(address);

    if (scamCount == goodCount) {
        await storage.setUserRating(address, 50);
        return 50;
    }

    if (scamCount > goodCount) {
        await storage.setUserRating(address, 99);
        return 99;
    }

    if (scamCount < goodCount) {
        await storage.setUserRating(address, 10);
        return 10;
    }
}
