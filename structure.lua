
--Spaces identifier
box.schema.space.create("scam_words");
box.schema.space.create("scam_names");
box.schema.space.create("users");
box.schema.space.create("tokens");

--"scam_words" description
box.space.scam_words:format({
    {name = 'word', type = 'string'},
    {name = 'count', type = 'number'}
})

box.space.scam_words:create_index('word', {type = 'HASH', unique = true, parts = {'word'}})
box.space.scam_words:create_index('count', { parts = { 'count' }, type = 'tree', unique = false })

--scam_names description
box.space.scam_names:format({
    {name = 'name', type = 'string'}
})

box.space.scam_names:create_index('name', {type = 'HASH', unique = true, parts = {'name'}})
box.space.scam_names:create_index('short_name', { parts = { 'short_name' }, type = 'tree', unique = false })

--users description
box.space.users:format({
    {name = 'address', type = 'string'},
    {name = 'scam_percent', type = 'number'}
})

box.space.users:create_index('address', {type = 'HASH', unique = true, parts = {'address'}})
box.space.users:create_index('percent', { parts = { 'scam_percent' }, type = 'tree', unique = false })

--tokens description
box.space.tokens:format({
    {name = 'id', type = 'number'},
    {name = 'timestamp', type = 'number'},
    {name = 'issuer', type = 'string'},
    {name = 'address', type = 'string'},
    {name = 'name', type = 'string'},
    {name = 'description', type = 'string'},
    {name = 'scam_percent', type = 'number'}
})

box.space.tokens:create_index('address', {type = 'HASH', unique = true, parts = {'address'}})
box.space.tokens:create_index('id', {type = 'HASH', unique = true, parts = {'id'}})
box.space.tokens:create_index('scam_percent', { parts = { 'scam_percent' }, type = 'tree', unique = false })
box.space.tokens:create_index('issuer', { parts = { 'issuer' }, type = 'tree', unique = false })