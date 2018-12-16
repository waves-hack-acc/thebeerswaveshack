box.cfg {
    listen = 3301,
    memtx_memory = 2256 * 1024 * 1024,
    memtx_max_tuple_size = 20 * 1024 * 1024
}

function getTokenScamPercent(address)
    local a = box.space.tokens.index.address:select({ address })
    if (table.getn(a) > 0) then
        return a[1]
    end
    return nil
end

function getUserScamPercent(address)
    local a = box.space.tokens.index.address:select({ address })
    if (table.getn(a) > 0) then
        return a[1][7]
    end
    return nil
end

function setTokenRating(address)
    local a = box.space.users.index.address:select({ address })
    if (table.getn(a) > 0) then
        return a[1][2]
    end
    return nil
end

function deleteSpaces()
    local a = box.space.tokens:select({})
    for i = 1, table.getn(a) do
        local str = a[i][4]
        if (string.find(str, ' ')) then
            str = str:sub(1, -2)
            box.space.tokens:update({a[i][4]},{{'=', 4, str}})
        end
    end
end



function getTokensWithSites()
    local tokens = {};
    local original = box.space.tokens:select({})
    for i = 1, table.getn(original) do
        if string.find(original[i][6], "http") or string.find(original[i][6], "www") then
            table.insert(tokens, original[i]);
        end
    end
    return tokens
end

function deleteSmall()
    local original = box.space.scam_names:select({})
    for i = 1, table.getn(original) do
        if string.len(original[i][1]) < 5 then
            box.space.scam_names:delete(original[i][1]);
        end
    end
end

function setScamTokenPercent(token, percent)
    box.space.tokens:update({token},{{'=', 7, percent}})
end

function checkName()
    local words = box.space.scam_words:select({})
    local names = box.space.scam_names:select({})

    for i = 1, table.getn(names) do
        table.insert(words, names[i])
    end

    local tokens = box.space.tokens.index.scam_percent:select({98}, {iterator= box.index.LE})

    for i = 1, table.getn(tokens) do
        local name = tokens[i][5]:lower()
        if table.getn(box.space.scam_names:select({name})) > 0 then
            setScamTokenPercent(tokens[i][4], 99)
        end

        for j = 1, table.getn(words) do
            if string.find(tokens[i][6]:lower(), words[j][1]) then
                setScamTokenPercent(tokens[i][4], 99)
            end
         end
    end
end

