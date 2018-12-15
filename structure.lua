
--Spaces identifier
box.schema.space.create("scam_words");
box.schema.space.create("scam_names");
box.schema.space.create("scam_account_address");
box.schema.space.create("scam_token_address");

--"scam_words" description
box.space.scam_words:format({
    {name = 'word', type = 'string'},
    {name = 'count', type = 'number'}
})

box.space.scam_words:create_index('word', {type = 'HASH', unique = true, parts = {'word'}})
box.space.scam_words:create_index('count', { parts = { 'count' }, type = 'tree', unique = false })

--scam_names description
box.space.scam_names:format({
    {name = 'name', type = 'string'},
    {name = 'short_name', type = 'string'}
})

box.space.scam_names:create_index('name', {type = 'HASH', unique = true, parts = {'name'}})
box.space.scam_names:create_index('short_name', { parts = { 'short_name' }, type = 'tree', unique = false })

--scam_account_address description
box.space.scam_account_address:format({
    {name = 'address', type = 'string'},
    {name = 'scam_percent', type = 'number'}
})

box.space.scam_account_address:create_index('address', {type = 'HASH', unique = true, parts = {'address'}})
box.space.scam_account_address:create_index('percent', { parts = { 'scam_percent' }, type = 'tree', unique = false })

--scam_token_address description
box.space.scam_token_address:format({
    {name = 'address', type = 'string'},
    {name = 'scam_percent', type = 'number'},
    {name = 'issuer', type = 'string'}
})

box.space.scam_token_address:create_index('address', {type = 'HASH', unique = true, parts = {'address'}})
box.space.scam_token_address:create_index('scam_percent', { parts = { 'scam_percent' }, type = 'tree', unique = false })
box.space.scam_token_address:create_index('issuer', { parts = { 'issuer' }, type = 'tree', unique = false })