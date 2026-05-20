const https = require("https");
const fs = require("fs");

const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;
if (!email || !token) {
  console.error("Missing JIRA_EMAIL or JIRA_API_TOKEN");
  process.exit(1);
}

const EPIC_KEY = "RHWA-836";
const STORY_KEYS = ["RHWA-969","RHWA-972","RHWA-837","RHWA-961","RHWA-975","RHWA-982"];
const ALL_PARENT_KEYS = [EPIC_KEY, ...STORY_KEYS];

const jql = `key in (${ALL_PARENT_KEYS.join(",")}) OR parent in (${ALL_PARENT_KEYS.join(",")})`;

function jiraRequest(nextPageToken) {
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

const CATEGORY_MAP = { new: "todo", indeterminate: "ip", done: "done" };

async function main() {
  const issues = {};
  let nextPageToken = null;

  do {
    const result = await jiraRequest(nextPageToken);
    for (const issue of result.issues) {
      const catKey = issue.fields.status.statusCategory.key;
      issues[issue.key] = {
        status: CATEGORY_MAP[catKey] || "todo",
        name: issue.fields.status.name,
        parent: issue.fields.parent ? issue.fields.parent.key : null
      };
    }
    nextPageToken = result.nextPageToken || null;
  } while (nextPageToken);

  const output = {
    updated: new Date().toISOString(),
    issues
  };

  const outPath = process.argv[2] || "rhwa-migration/jira-status.json";
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log("Wrote " + Object.keys(issues).length + " issues to " + outPath);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
