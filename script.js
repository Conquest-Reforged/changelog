const OWNER = "Conquest-Reforged";
const NAME = "ReforgedMod";
const PAGE_LIMIT = 5;

window.addEventListener("load", function() {
    let commits = fetch(`https://api.github.com/repos/${OWNER}/${NAME}/commits?per_page=100`)
        .then(r => r.json());

    let tags = fetch(`https://api.github.com/repos/${OWNER}/${NAME}/tags?per_page=100`)
        .then(r => r.json())
        .then(tags => {
            let map = {};
            tags.forEach(tag => map[tag["commit"]["sha"]] = tag["name"]);
            return map;
        });

    Promise.all([commits, tags])
        .then(results => render(1, results[0], results[1]))
        .catch(console.warn);
});

function render(page, commits, tags) {
    let range = getRange();
    let to = range["to"];
    let from = range["from"];
    document.body.appendChild(renderTitle(from, to));

    let log = document.createElement("ul");

    renderRange(log, page, commits, tags, from, to);

    document.body.appendChild(log);
}

function renderRange(log, page, commits, tags, from, to) {
    if (commits.length === 0) {
        return;
    }

    let end = false;
    let recording = to === "present";
    for (let i = 0; i < commits.length; i++) {
        const entry = commits[i];
        const tag = tags[entry["sha"]];
        if (recording && tag && (tag === from || from === "last")) {
            from = tag;
            end = true;
            break;
        }
        if (!recording && tag && tag === to) {
            recording = true;
        }
        if (!recording) {
            continue;
        }

        const commit = commits[i]["commit"];
        const lines = commit["message"].split("\n") || [];

        lines.map(sanitize)
            .filter(s => s !== "")
            .map(renderLine)
            .forEach(item => log.appendChild(item));
    }

    if (!end && commits.length === 100 && page < PAGE_LIMIT) {
        nextPage(log, page + 1, tags, from, to);
    }
}

function nextPage(log, page, tags, from, to) {
    fetch(`https://api.github.com/repos/${OWNER}/${NAME}/commits?per_page=100&page=${page}`)
        .then(r => r.json())
        .then(commits => renderRange(log, page, commits, tags, from, to))
        .catch(console.log);
}

function renderTitle(from, to) {
    let title = document.createElement("h3");
    title.innerText = `Changelog: ${from} to ${to}`;
    return title;
}

function renderLine(text) {
    let item = document.createElement("li");
    item.innerText = sanitize(text);
    return item;
}

function sanitize(text) {
    if (filter(text.toLowerCase())) {
        return "";
    }
    text = text.trim();
    if (text.startsWith("-")) {
        text = text.substring(1);
        text = text.trim();
    }
    return text.charAt(0).toUpperCase() + text.substring(1);
}

function filter(text) {
    if (text.startsWith("merge remote")) {
        return true;
    }
    if (text.indexOf("update") > -1 && text.indexOf("ref") > 0) {
        return true;
    }
    return false;
}

function getRange() {
    let query = parseQuery(window.location.search);
    let to = "present";
    let from = "last";
    if (query.hasOwnProperty("from")) {
        from = query["from"];
    }
    if (query.hasOwnProperty("to")) {
        to = query["to"];
    }
    return {"from": from, "to": to}
}

function parseQuery(queryString) {
    let query = {};
    let pairs = (queryString[0] === "?" ? queryString.substr(1) : queryString).split("&");
    for (let i = 0; i < pairs.length; i++) {
        let kv = pairs[i].split("=");
        query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    }
    return query;
}
