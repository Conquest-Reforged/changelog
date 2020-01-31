const OWNER = "TerraForged";
const NAME = "TerraForged";

window.addEventListener("load", function() {
    fetch(`https://api.github.com/repos/${OWNER}/${NAME}/commits?per_page=100`)
        .then(r => r.json())
        .then(render)
        .catch(console.warn);
});

function render(commits) {
    let log = document.createElement("ul");
    let latest = null;
    let oldest = null;
    commits.forEach(entry => {
        const commit = entry["commit"];
        const lines = commit["message"].split("\n") || [];
        if (latest) {
            oldest = commit["author"];
        } else {
            latest = commit["author"];
        }
        lines.map(sanitize)
            .filter(s => s !== "")
            .map(renderLine)
            .forEach(item => log.appendChild(item));
    });
    document.body.appendChild(renderTitle(oldest, latest));
    document.body.appendChild(log);
}

function renderTitle(start, end) {
    let title = document.createElement("h3");
    let oldest = formatDate(new Date(start["date"]));
    let latest = formatDate(new Date(end["date"]));
    title.innerText = `${NAME} Changelog - ${oldest} to ${latest}`;
    return title;
}

function renderLine(text) {
    let item = document.createElement("li");
    item.innerText = sanitize(text);
    return item;
}

function sanitize(text) {
    text = text.trim();
    if (text.startsWith("Merge remote")) {
        return "";
    }
    if (text.startsWith("-")) {
        text = text.substring(1);
        text = text.trim();
    }
    return text.charAt(0).toUpperCase() + text.substring(1);
}

function formatDate(date) {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }
    return `${day}/${month}/${date.getFullYear()}`;
}