box.cfg {
    listen = 3301,
    memtx_memory = 2256 * 1024 * 1024,
    memtx_max_tuple_size = 20 * 1024 * 1024
}

function getTokenScamPercent(address)
    local a = box.space.scam_token_address.index.address:select({ address })
    if (table.getn(a) > 0) then
        return a[1][2]
    end
    return nil
end