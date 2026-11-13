import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentPath = join(root, "app", "site-content.json");
const pagePath = join(root, "tools", "maintainer.html");
const port = Number(process.env.AGGIE_MAINTAINER_PORT || 4317);
const languages = ["en", "zh", "es", "ko", "ja", "hi", "fr"];
const heroFields = ["live", "titleA", "titleB", "subtitle", "placeholder"];

function respond(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(body);
}

function validContent(value) {
  if (!value || typeof value !== "object" || !value.announcement || !value.hero) return false;
  const { bannerText, posterLabel, posterImage } = value.announcement;
  if (![bannerText, posterLabel, posterImage].every((part) => typeof part === "string" && part.length <= 500)) return false;
  if (!/^\/[A-Za-z0-9_./-]+$/.test(posterImage) || posterImage.includes("..")) return false;
  return languages.every((language) => heroFields.every((field) => typeof value.hero[language]?.[field] === "string" && value.hero[language][field].length <= 1000));
}

const server = createServer(async (request, response) => {
  const host = request.headers.host || "";
  if (!/^((127\.0\.0\.1)|(localhost)):4317$/.test(host) && !new RegExp(`^((127\\.0\\.0\\.1)|(localhost)):${port}$`).test(host)) {
    return respond(response, 403, JSON.stringify({ error: "Local access only" }));
  }
  const url = new URL(request.url || "/", `http://${host}`);
  if (request.method === "GET" && url.pathname === "/") {
    return respond(response, 200, await readFile(pagePath), "text/html; charset=utf-8");
  }
  if (request.method === "GET" && url.pathname === "/api/content") {
    return respond(response, 200, await readFile(contentPath));
  }
  if (request.method === "PUT" && url.pathname === "/api/content") {
    const origin = request.headers.origin;
    if (origin !== `http://${host}`) return respond(response, 403, JSON.stringify({ error: "Same-origin request required" }));
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 65536) return respond(response, 413, JSON.stringify({ error: "Content too large" }));
    }
    let value;
    try { value = JSON.parse(body); } catch { return respond(response, 400, JSON.stringify({ error: "Invalid JSON" })); }
    if (!validContent(value)) return respond(response, 400, JSON.stringify({ error: "Invalid site content" }));
    const clean = {
      announcement: { bannerText: value.announcement.bannerText, posterLabel: value.announcement.posterLabel, posterImage: value.announcement.posterImage },
      hero: Object.fromEntries(languages.map((language) => [language, Object.fromEntries(heroFields.map((field) => [field, value.hero[language][field]]))])),
    };
    await writeFile(contentPath, `${JSON.stringify(clean, null, 2)}\n`, "utf8");
    return respond(response, 200, JSON.stringify({ saved: true }));
  }
  return respond(response, 404, JSON.stringify({ error: "Not found" }));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Aggie Care maintainer: http://127.0.0.1:${port}\n`);
});
