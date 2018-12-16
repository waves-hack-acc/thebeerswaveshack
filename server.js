const restify = require('restify');
const TarantoolConnection = require('tarantool-driver');
const Repo = require('./Repository/Repo');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const server = restify.createServer({
    name: 'waves',
    version: '1.0.0'
});

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});

let config = yaml.load(fs.readFileSync(path.resolve(__dirname, './config/config.yml')));

const conn = new TarantoolConnection({host: config.tarantool.server.host, port: config.tarantool.server.port});

const repository = new Repo(conn);

// /api part is from nginx /api location

server.get('/api/get', function (req, res, next) {

    const getParams = req.query;

    let hash = '';

    if (getParams.hash) {
        hash = getParams.hash;
    }

    repository.get(hash).then(result => {
        res.send({code: 200, data: result});
    });

});
