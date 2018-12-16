const TarantoolConnection = require('tarantool-driver');
const Storage = require('./Storage/Storage');
const axios = require('axios');
const fs = require('fs');

process.title = 'syncing blockchain';

const conn = new TarantoolConnection({host: '127.0.0.1', port: 3301});

const WAVES_TOKEN_API_URL = 'https://nodes.wavesnodes.com/transactions/info/';

const scamCX = '000017508735297593231:bgv_yoycqaq';
const goodCX = '000017508735297593231:tsmotopvz1c';

const storage = new Storage(conn);

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

let data = JSON.stringify({
    "client": {
        "clientId":      "yourcompanyname",
        "clientVersion": "1.5.2"
    },
    "threatInfo": {
        "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
        "platformTypes":    ["WINDOWS"],
        "threatEntryTypes": ["URL"],
        "threatEntries": [
            {"url": "http://www.google.com/"},
            {"url": "http://www.urltocheck2.org/"},
            {"url": "http://www.urltocheck3.com/"}
        ]
    }
})

async function test() {
    // console.log((await axios.post('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyARN2JzdGYdQmgW553mJf_ZdotEyW4spIo', data, {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     }
    // })).data);

    let a = await axios.post('https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyARN2JzdGYdQmgW553mJf_ZdotEyW4spIo', {
        "client": {
            "clientId":      "yourcompanyname",
            "clientVersion": "1.5.2"
        },
        "threatInfo": {
            "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
            "platformTypes":    ["WINDOWS"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [
                {"url": "http://www.google.com/"},
                {"url": "http://www.urltocheck2.org/"},
                {"url": "http://tracking.condonors.ml/"}
            ]
        }
    })
        .catch(function (error) {
            console.log(error);
        });

    console.log(a.data);
}

// test();

function replaceAll(str, what, to) {
    return str.replace(new RegExp(what, 'g'), to);
}

async function readFile() {
    fs.readFile('1.txt', 'utf8', async function(err, content) {
        let isClosed = false;
        let str = '';
        let count = 0;
        for (let i = 281; i < content.length; i++) {
            if (content[i] === '\n') {
                count++;
                let id = str.substr(0, 6);
                id = replaceAll(id, ' ', '');
                id = Number(id);
                let time = str.substr(7, 19);
                let year = time.substr(6, 4);
                let month = time.substr(0, 2);
                let day = time.substr(3, 2);
                let timing = time.substr(11);

                time = new Date(year + '-'+month + '-' + day + 'T' + timing + "Z");
                time = time.getTime();

                let issuer = str.substr(27, 35);
                let assetId = str.substr(63, 44);

                assetId = replaceAll(assetId ,' ', '');

                issuer = replaceAll(issuer, ' ', '');

                let name  = str.substr(108, 21);

                while (name.length > 0 && name[name.length-1] === ' ')
                    name = name.substr(0, name.length-1);

                let desc = str.substr(129);

                while (desc.length > 0 && desc[desc.length-1] === ' ')
                    desc = desc.substr(0, desc.length-1);
                console.log(desc);

                await storage.putToken(id, time, issuer, assetId, name, desc, 50);

                str = '';
            } else {
                str += content[i];
            }

        }
        console.log(count);
    });

}

readFile();
// console.log(replaceAll('aaaaaaaaavvvv', 'a', 't'));