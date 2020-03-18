const OWNER = "TerraForged";
const NAME = "TerraForged";
const TARGET = getHash();

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
        .then(results => render(results[0], results[1]))
        .catch(console.warn);
});

function render(commits, tags) {
    let log = document.createElement("ul");
    let lastTag = "unknown";
    for (let i = 0; i < commits.length; i++) {
        const entry = commits[i];
        const tag = tags[entry["sha"]];
        if (tag && (!TARGET || tag === TARGET)) {
            lastTag = tag;
            break;
        }

        const commit = commits[i]["commit"];
        const lines = commit["message"].split("\n") || [];

        lines.map(sanitize)
            .filter(s => s !== "")
            .map(renderLine)
            .forEach(item => log.appendChild(item));
    }
    document.body.appendChild(renderTitle(lastTag));
    document.body.appendChild(log);
}

function renderTitle(tag) {
    let title = document.createElement("h3");
    title.innerText = `Changelog: ${tag} to Present`;
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

function getHash() {
    let hash = window.location.hash;
    if (hash) {
        return hash.substring(1);
    }
    return "";
}