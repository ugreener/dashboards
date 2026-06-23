const https = require("https");
const fs = require("fs");

const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;
if (!email || !token) {
  console.error("Missing JIRA_EMAIL or JIRA_API_TOKEN");
  process.exit(1);
}

const EPIC_KEY = "RHWA-836";

function jiraSearch(jql, nextPageToken) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(email + ":" + token).toString("base64");
    const params = new URLSearchParams({
      jql,
      fields: "status,parent",
      maxResults: "100"
    });
    if (nextPageToken) params.set("nextPageToken", nextPageToken);

    const opts = {
      hostname: "redhat.atlassian.net",
      path: "/rest/api/3/search/jql?" + params.toString(),
      method: "GET",
      headers: {
        Authorization: "Basic " + auth,
        Accept: "application/json"
      }
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error("Jira API " + res.statusCode + ": " + data.slice(0, 300)));
          return;
        }
        resolve(JSON.parse(data));
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function fetchAll(jql) {
  const results = [];
  let nextPageToken = null;
  do {
    const result = await jiraSearch(jql, nextPageToken);
    results.push(...result.issues);
    nextPageToken = result.nextPageToken || null;
  } while (nextPageToken);
  return results;
}

const CATEGORY_MAP = { new: "todo", indeterminate: "ip", done: "done" };

function issueEntry(issue) {
  const catKey = issue.fields.status.statusCategory.key;
  return {
    status: CATEGORY_MAP[catKey] || "todo",
    name: issue.fields.status.name,
    parent: issue.fields.parent ? issue.fields.parent.key : null
  };
}

async function main() {
  const issues = {};

  // Phase 1: fetch the epic and all its direct children (stories)
  const epicAndStories = await fetchAll(`key = ${EPIC_KEY} OR parent = ${EPIC_KEY}`);
  const storyKeys = [];
  for (const issue of epicAndStories) {
    issues[issue.key] = issueEntry(issue);
    if (issue.key !== EPIC_KEY) {
      storyKeys.push(issue.key);
    }
  }
  console.log("Discovered " + storyKeys.length + " stories under " + EPIC_KEY);

  // Phase 2: fetch all sub-tasks under every discovered story
  if (storyKeys.length > 0) {
    const subTasks = await fetchAll(`parent in (${storyKeys.join(",")})`);
    for (const issue of subTasks) {
      issues[issue.key] = issueEntry(issue);
    }
    console.log("Fetched " + subTasks.length + " sub-tasks");
  }

  const outPath = process.argv[2] || "rhwa-migration/jira-status.json";

  let prev = {};
  try {
    prev = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch (_) {}

  const stableStr = (obj) => {
    const keys = Object.keys(obj).sort();
    return JSON.stringify(keys.map((k) => [k, obj[k]]));
  };
  const statusChanged = !(prev.issues && stableStr(prev.issues) === stableStr(issues));
  if (!statusChanged) {
    console.log("No status changes (" + Object.keys(issues).length + " issues unchanged)");
    return;
  }

  const output = {
    updated: new Date().toISOString(),
    issues
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log("Wrote " + Object.keys(issues).length + " issues to " + outPath);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
