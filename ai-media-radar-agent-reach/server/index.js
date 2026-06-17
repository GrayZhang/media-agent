import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data", "store.json");
const PORT = Number(process.env.PORT || 8787);
const HOME_DIR = process.env.USERPROFILE || process.env.HOME || "";
const VENV_BIN_DIR = process.platform === "win32" ? "Scripts" : "bin";
const AGENT_REACH_VENV = process.env.AGENT_REACH_VENV || path.join(HOME_DIR, ".agent-reach-venv");
const AGENT_REACH_BIN_DIR = process.env.AGENT_REACH_BIN_DIR || path.join(AGENT_REACH_VENV, VENV_BIN_DIR);
const AGENT_REACH_CONFIG = process.env.AGENT_REACH_CONFIG || path.join(HOME_DIR, ".agent-reach", "config.yaml");

const app = express();
app.use(express.json({ limit: "4mb" }));

const nowIso = () => new Date().toISOString();
const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const realSourceAccounts = [
  {
    id: "feed_openai_news",
    platform: "RSS",
    handle: "https://openai.com/news/rss.xml",
    name: "OpenAI News",
    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=openai-news",
    lane: "模型与产品发布",
    sourceType: "官方 RSS",
    score: "S",
    quality: 95,
    followers: 0,
    avgLikes: 0,
    hot30d: 0,
    posts30d: 0,
    tags: ["模型发布", "AI产品", "OpenAI"],
    status: "active",
    lastSync: null,
  },
  {
    id: "feed_huggingface_blog",
    platform: "RSS",
    handle: "https://huggingface.co/blog/feed.xml",
    name: "Hugging Face Blog",
    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=huggingface-blog",
    lane: "开源模型与工具",
    sourceType: "官方 RSS",
    score: "A",
    quality: 88,
    followers: 0,
    avgLikes: 0,
    hot30d: 0,
    posts30d: 0,
    tags: ["开源模型", "AI基础设施", "开发者社区"],
    status: "active",
    lastSync: null,
  },
  {
    id: "feed_github_changelog",
    platform: "RSS",
    handle: "https://github.blog/changelog/feed/",
    name: "GitHub Changelog",
    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=github-changelog",
    lane: "AI编程",
    sourceType: "官方 RSS",
    score: "A",
    quality: 84,
    followers: 0,
    avgLikes: 0,
    hot30d: 0,
    posts30d: 0,
    tags: ["GitHub", "AI编程", "开发者工具"],
    status: "active",
    lastSync: null,
  },
  {
    id: "feed_simon_willison",
    platform: "RSS",
    handle: "https://simonwillison.net/atom/everything/",
    name: "Simon Willison",
    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=simon-willison",
    lane: "AI工程实践",
    sourceType: "个人博客 Atom",
    score: "A",
    quality: 86,
    followers: 0,
    avgLikes: 0,
    hot30d: 0,
    posts30d: 0,
    tags: ["LLM工程", "Agent与自动化", "AI编程"],
    status: "active",
    lastSync: null,
  },
  {
    id: "feed_hn_ai",
    platform: "RSS",
    handle: "https://hnrss.org/newest?q=AI",
    name: "Hacker News AI",
    avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=hn-ai",
    lane: "全球技术社区",
    sourceType: "社区搜索 RSS",
    score: "B",
    quality: 72,
    followers: 0,
    avgLikes: 0,
    hot30d: 0,
    posts30d: 0,
    tags: ["AI趋势", "开发者社区", "创业产品"],
    status: "active",
    lastSync: null,
  },
];

const tagSeed = [
  { id: "tag_ai_coding", group: "AI编程", name: "AI编程", aliases: ["coding", "developer", "copilot", "code"] },
  { id: "tag_claude_code", group: "AI编程", name: "Claude Code", aliases: ["claude"] },
  { id: "tag_codex", group: "AI编程", name: "Codex", aliases: ["codex"] },
  { id: "tag_github", group: "AI编程", name: "GitHub", aliases: ["github"] },
  { id: "tag_devtools", group: "AI编程", name: "开发者工具", aliases: ["developer tool", "devtool", "sdk", "api"] },
  { id: "tag_agent", group: "Agent与自动化", name: "Agent 智能体", aliases: ["agent", "agents", "automation"] },
  { id: "tag_workflow", group: "Agent与自动化", name: "工作流自动化", aliases: ["workflow", "automation"] },
  { id: "tag_mcp", group: "Agent与自动化", name: "MCP", aliases: ["mcp", "model context protocol"] },
  { id: "tag_rag", group: "Agent与自动化", name: "RAG", aliases: ["rag", "retrieval"] },
  { id: "tag_openai", group: "模型与产品", name: "OpenAI", aliases: ["openai", "gpt"] },
  { id: "tag_model_release", group: "模型与产品", name: "模型发布", aliases: ["model", "models", "release"] },
  { id: "tag_ai_product", group: "模型与产品", name: "AI产品", aliases: ["product", "launch"] },
  { id: "tag_open_source", group: "开源与基础设施", name: "开源模型", aliases: ["open source", "open-source", "hugging face"] },
  { id: "tag_infra", group: "开源与基础设施", name: "AI基础设施", aliases: ["infrastructure", "serving", "runtime", "cluster"] },
  { id: "tag_llm_engineering", group: "开源与基础设施", name: "LLM工程", aliases: ["llm", "eval", "prompt", "token"] },
  { id: "tag_trend", group: "趋势与商业", name: "AI趋势", aliases: ["trend", "market", "industry"] },
  { id: "tag_startup", group: "趋势与商业", name: "创业产品", aliases: ["startup", "founder", "funding"] },
  { id: "tag_community", group: "趋势与商业", name: "开发者社区", aliases: ["hacker news", "community", "comments"] },
].map((tag) => ({ ...tag, count: 0, watch: ["MCP", "OpenAI", "GitHub", "Agent 智能体"].includes(tag.name) }));

const collectors = [
  {
    id: "collector_rss",
    platform: "RSS",
    name: "公开 RSS 源",
    command: "内置 fetch + XML 解析",
    needs: "RSS/Atom URL",
    status: "built-in-real",
  },
  {
    id: "collector_youtube",
    platform: "YouTube",
    name: "YouTube 关键词搜索",
    command: "yt-dlp --dump-json ytsearch10:关键词",
    needs: "Agent-Reach venv 内置 yt-dlp",
    status: "ready",
  },
  {
    id: "collector_x",
    platform: "X",
    name: "X 账号时间线",
    command: "twitter user-posts handle -n 20 --json",
    needs: "twitter-cli + TWITTER_AUTH_TOKEN/TWITTER_CT0",
    status: "requires-cookie",
  },
  {
    id: "collector_bili",
    platform: "B站",
    name: "B站关键词搜索",
    command: "B站公开搜索 API fallback",
    needs: "公网可访问 api.bilibili.com",
    status: "built-in-real",
  },
  {
    id: "collector_xhs",
    platform: "小红书",
    name: "小红书关键词搜索",
    command: "opencli xiaohongshu search 关键词 -f json",
    needs: "OpenCLI 或 xiaohongshu-mcp 登录态",
    status: "requires-login",
  },
];

const seed = {
  accounts: realSourceAccounts,
  tags: tagSeed,
  contents: [],
  topics: [],
  collectors,
  activity: [{ id: "act_seed", at: nowIso(), text: "已启用真实数据模式：默认只配置公开 RSS 源。" }],
};

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeStore({ ...seed, meta: { createdAt: nowIso(), updatedAt: nowIso(), mode: "real" } });
  }
}

async function readStore() {
  await ensureStore();
  const store = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  return refreshDerivedStats(store);
}

async function writeStore(store) {
  const next = refreshDerivedStats({
    ...store,
    meta: { ...(store.meta || {}), updatedAt: nowIso(), mode: "real" },
  });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

function addActivity(store, text) {
  store.activity = [{ id: uid("act"), at: nowIso(), text }, ...(store.activity || [])].slice(0, 40);
}

function refreshDerivedStats(store) {
  const contents = store.contents || [];
  const tags = (store.tags || tagSeed).map((tag) => ({
    ...tag,
    count: contents.filter((item) => (item.tags || []).includes(tag.name)).length,
  }));
  const accountStats = new Map();
  for (const item of contents) {
    if (!item.accountId) continue;
    const current = accountStats.get(item.accountId) || { posts: 0, hot: 0, likes: [] };
    current.posts += 1;
    if ((item.heatScore || 0) >= 70) current.hot += 1;
    current.likes.push(item.metrics?.likes || 0);
    accountStats.set(item.accountId, current);
  }
  const accounts = (store.accounts || []).map((account) => {
    const stat = accountStats.get(account.id);
    if (!stat) return account;
    const sortedLikes = [...stat.likes].sort((a, b) => a - b);
    const median = sortedLikes[Math.floor(sortedLikes.length / 2)] || 0;
    return { ...account, posts30d: stat.posts, hot30d: stat.hot, avgLikes: median };
  });
  return { ...store, accounts, tags };
}

function cleanConfigValue(value = "") {
  return String(value).trim().replace(/^[']|[']$/g, "").replace(/^["]|["]$/g, "");
}

async function readAgentReachConfigEnv() {
  try {
    const text = await fs.readFile(AGENT_REACH_CONFIG, "utf8");
    const values = {};
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*(twitter_auth_token|twitter_ct0|proxy|bilibili_proxy)\s*:\s*(.+?)\s*$/);
      if (match) values[match[1]] = cleanConfigValue(match[2]);
    }
    return values;
  } catch {
    return {};
  }
}

async function buildToolEnv(extraEnv = {}) {
  const env = { ...process.env, ...extraEnv, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
  env[pathKey] = [AGENT_REACH_BIN_DIR, env[pathKey]].filter(Boolean).join(path.delimiter);

  const config = await readAgentReachConfigEnv();
  if (config.twitter_auth_token && !env.TWITTER_AUTH_TOKEN) env.TWITTER_AUTH_TOKEN = config.twitter_auth_token;
  if (config.twitter_ct0 && !env.TWITTER_CT0) env.TWITTER_CT0 = config.twitter_ct0;
  const proxy = config.proxy || config.bilibili_proxy;
  if (proxy) {
    if (!env.HTTP_PROXY) env.HTTP_PROXY = proxy;
    if (!env.HTTPS_PROXY) env.HTTPS_PROXY = proxy;
  }
  return env;
}

async function runCommand(command, args, options = {}) {
  const timeoutMs = options.timeoutMs || 45000;
  const env = await buildToolEnv(options.env);
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true, shell: false, env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, code: "spawn_error", stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0 && !timedOut, code, stdout, stderr, timedOut });
    });
  });
}

function htmlDecode(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? htmlDecode(match[1]) : "";
}

function getLink(block) {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
  return htmlDecode(getTag(block, "link") || atom || "");
}

function parseHnMetrics(text) {
  const points = Number(text.match(/Points:\s*(\d+)/i)?.[1] || 0);
  const comments = Number(text.match(/# Comments:\s*(\d+)/i)?.[1] || 0);
  return { likes: points, comments };
}

async function fetchTextWithRetry(url, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "ai-media-radar-mvp/0.2" },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }
  throw new Error(`请求失败：${lastError?.message || String(lastError)}`);
}

async function collectRss(url, limit) {
  const xml = await fetchTextWithRetry(url, 3);
  const blocks = [...xml.matchAll(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi)]
    .map((m) => m[0])
    .slice(0, limit);

  return blocks.map((block) => {
    const title = getTag(block, "title");
    const text =
      getTag(block, "description") ||
      getTag(block, "summary") ||
      getTag(block, "content") ||
      getTag(block, "content:encoded") ||
      title;
    const hn = parseHnMetrics(text);
    const publishedAt = getTag(block, "pubDate") || getTag(block, "published") || getTag(block, "updated");
    return {
      title,
      text,
      url: getLink(block),
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : nowIso(),
      author: getTag(block, "author") || getTag(block, "dc:creator") || "RSS",
      metrics: { comments: hn.comments, reposts: 0, likes: hn.likes, views: 0, bookmarks: 0 },
    };
  });
}

async function collectBilibiliSearch(query, limit) {
  const keyword = String(query || "").trim();
  if (!keyword) throw new Error("B站采集需要填写关键词");
  const url = `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(keyword)}&page=1`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 ai-media-radar-mvp/0.2",
      Referer: "https://www.bilibili.com/",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`B站搜索 API 请求失败：HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.code !== 0) throw new Error(payload.message || "B站搜索 API 返回异常");

  const groups = Array.isArray(payload.data?.result) ? payload.data.result : [];
  const videos = groups
    .flatMap((group) => (Array.isArray(group.data) ? group.data : []))
    .filter((item) => item?.result_type === "video" || item?.arcurl || item?.bvid)
    .slice(0, limit);

  return videos.map((item) => ({
    title: htmlDecode(item.title || item.name || "B站视频"),
    text: htmlDecode(item.description || item.title || ""),
    author: item.author || item.mid || "B站",
    url: item.arcurl || (item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : ""),
    thumbnail: item.pic ? (String(item.pic).startsWith("//") ? `https:${item.pic}` : item.pic) : "",
    publishedAt: item.pubdate ? Number(item.pubdate) : nowIso(),
    views: item.play,
    likes: item.like,
    comments: item.review,
    reposts: item.video_review,
    raw: item,
  }));
}

function parseJsonish(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const rows = [];
    for (const line of trimmed.split(/\r?\n/)) {
      try {
        rows.push(JSON.parse(line));
      } catch {
        // Some CLIs mix logs with JSON lines.
      }
    }
    return rows;
  }
}

function unwrapCollectedPayload(rows) {
  const unwrapped = [];
  for (const row of rows) {
    if (!row) continue;
    if (Array.isArray(row)) {
      unwrapped.push(...row);
      continue;
    }
    let matchedNestedList = false;
    for (const key of ["data", "items", "tweets", "results", "videos"]) {
      if (Array.isArray(row[key])) {
        unwrapped.push(...row[key]);
        matchedNestedList = true;
        break;
      }
    }
    if (matchedNestedList) continue;
    if (row.ok && row.data && !Array.isArray(row.data)) {
      unwrapped.push(row.data);
      continue;
    }
    unwrapped.push(row);
  }
  return unwrapped;
}

function compactNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function inferTags(text, tags) {
  const source = String(text || "").toLowerCase();
  const matched = tags
    .filter((tag) => {
      const needles = [tag.name, tag.group, ...(tag.aliases || [])].map((item) => String(item).toLowerCase());
      return needles.some((needle) => needle && source.includes(needle));
    })
    .map((tag) => tag.name);
  return [...new Set(matched)].slice(0, 5);
}

function scoreFromMetrics(metrics, tags = []) {
  const weighted =
    (metrics.likes || 0) * 1 +
    (metrics.comments || 0) * 3 +
    (metrics.reposts || 0) * 4 +
    (metrics.bookmarks || 0) * 5 +
    Math.sqrt(metrics.views || 0);
  return Math.min(99, Math.max(28, Math.round(weighted / 2 + tags.length * 4)));
}

function normalizeDate(value) {
  if (!value) return nowIso();
  if (typeof value === "number") {
    const millis = value < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
  }
  const text = String(value).trim();
  if (/^\d{8}$/.test(text)) {
    const date = new Date(`${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
}

function normalizeCollectedItems(items, context, store) {
  const fallbackAccount = store.accounts.find((account) => account.id === context.accountId);
  return items
    .filter((item) => item && (item.title || item.text || item.description))
    .map((item) => {
      const title = item.title || item.full_text || item.text || item.description || item.name || "未命名内容";
      const text = item.text || item.full_text || item.description || item.title || JSON.stringify(item).slice(0, 500);
      const authorProfile = typeof item.author === "object" && item.author ? item.author : null;
      const screenName = authorProfile?.screenName || authorProfile?.screen_name || item.screenName || item.username || item.handle;
      const author =
        authorProfile?.name ||
        (screenName ? `@${String(screenName).replace(/^@/, "")}` : "") ||
        (typeof item.author === "string" ? item.author : "") ||
        item.uploader ||
        item.channel ||
        item.user?.nickname ||
        item.user?.name ||
        fallbackAccount?.name ||
        context.platform;
      const views = compactNumber(item.view_count || item.views || item.play_count);
      const likes = compactNumber(item.metrics?.likes || item.like_count || item.likes || item.liked_count);
      const comments = compactNumber(item.metrics?.comments || item.metrics?.replies || item.comment_count || item.comments || item.replies);
      const reposts = compactNumber(
        item.metrics?.reposts || item.metrics?.retweets || item.repost_count || item.retweets || item.reposts || item.share_count
      );
      const bookmarks = compactNumber(item.metrics?.bookmarks || item.bookmark_count || item.collected_count || item.favorites);
      const tags = inferTags(`${title} ${text}`, store.tags || tagSeed);
      const heatScore = scoreFromMetrics({ likes, comments, reposts, views, bookmarks }, tags);
      const handle = screenName || fallbackAccount?.handle || "";
      const twitterHandle = String(handle).replace(/^@/, "");
      const url =
        item.url ||
        item.webpage_url ||
        item.link ||
        (context.platform === "X" && item.id && twitterHandle ? `https://x.com/${twitterHandle}/status/${item.id}` : "");
      const publishedAt = item.createdAtISO || item.publishedAt || item.upload_date || item.created_at || item.createdAt || item.time || item.timestamp;
      return {
        id: uid("post"),
        platform: context.platform,
        accountId: fallbackAccount?.id || "",
        author,
        handle,
        avatar:
          fallbackAccount?.avatar ||
          item.avatar ||
          item.thumbnail ||
          item.thumbnail_url ||
          authorProfile?.profileImageUrl ||
          `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(author)}`,
        publishedAt: normalizeDate(publishedAt),
        title,
        text,
        url,
        metrics: { comments, reposts, likes, views, bookmarks },
        tags,
        heatScore,
        score: heatScore > 85 ? "S" : heatScore > 70 ? "A" : heatScore > 50 ? "B" : "C",
        status: "new",
        collected: false,
        removed: false,
        summary: title,
        rationale: "真实采集内容，等待人工确认标签和选题价值。",
        source: context.source || "collector",
        raw: item,
      };
    });
}

function rawFallbackContent(stdout, context, store) {
  const text = stdout.trim().slice(0, 1200);
  if (!text) return [];
  return normalizeCollectedItems([{ title: `${context.platform} 采集结果`, text, author: context.platform }], context, store);
}

function normalizeXHandle(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const urlMatch = raw.match(/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?#]+)/i);
  const handle = urlMatch ? urlMatch[1] : raw;
  return handle.replace(/^@/, "").replace(/[/?#].*$/, "");
}

function collectorCommand(payload, account) {
  const limit = Number(payload.limit || 10);
  const query = String(payload.query || "").trim();
  switch (payload.platform) {
    case "YouTube":
      return { command: "yt-dlp", args: ["--dump-json", `ytsearch${limit}:${query}`] };
    case "X": {
      const target = account?.handle || query;
      const shouldReadUser = Boolean(account?.handle) || /^@/.test(query) || /(?:x|twitter)\.com\//i.test(query);
      if (shouldReadUser) {
        return { command: "twitter", args: ["user-posts", normalizeXHandle(target), "-n", String(limit), "--json"] };
      }
      return { command: "twitter", args: ["search", query, "-n", String(limit), "--json"] };
    }
    case "B站":
      return { command: "bili", args: ["search", query, "--type", "video", "-n", String(limit)] };
    case "小红书":
      return { command: "opencli", args: ["xiaohongshu", "search", query, "-f", "json"] };
    default:
      return null;
  }
}

function mergeNewContents(store, normalized) {
  const existingKeys = new Set(
    (store.contents || []).map((item) => item.url || `${item.accountId}:${item.title}:${item.publishedAt}`)
  );
  const fresh = normalized.filter((item) => {
    const key = item.url || `${item.accountId}:${item.title}:${item.publishedAt}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
  store.contents = [...fresh, ...(store.contents || [])].slice(0, 800);
  return fresh;
}

async function collectForAccount(store, account, limit) {
  const rssItems = await collectRss(account.handle, limit);
  const normalized = normalizeCollectedItems(rssItems, { platform: "RSS", accountId: account.id, source: "rss" }, store);
  const fresh = mergeNewContents(store, normalized);
  store.accounts = store.accounts.map((item) =>
    item.id === account.id ? { ...item, lastSync: nowIso(), posts30d: item.posts30d + fresh.length } : item
  );
  return fresh;
}

app.get("/api/bootstrap", async (_req, res) => {
  const store = await readStore();
  res.json(store);
});

app.get("/api/doctor", async (_req, res) => {
  const result = await runCommand("agent-reach", ["doctor", "--json"], { timeoutMs: 70000 });
  const runtime = { venv: AGENT_REACH_VENV, binDir: AGENT_REACH_BIN_DIR, config: AGENT_REACH_CONFIG };
  if (!result.ok) {
    return res.status(200).json({
      ok: false,
      message: "未检测到 agent-reach，或 doctor 检查失败。",
      hint: "可以运行：py -3 -m venv %USERPROFILE%\\.agent-reach-venv，然后在该环境安装 Agent-Reach。",
      runtime,
      stderr: result.stderr,
    });
  }
  const parsed = parseJsonish(result.stdout);
  res.json({ ok: true, runtime, result: parsed.length ? parsed[0] : result.stdout });
});

app.post("/api/accounts", async (req, res) => {
  const store = await readStore();
  const account = {
    id: req.body.id || uid("acc"),
    platform: req.body.platform || "RSS",
    handle: req.body.handle || "",
    name: req.body.name || req.body.handle || "新数据源",
    avatar:
      req.body.avatar ||
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(req.body.name || req.body.handle || "account")}`,
    lane: req.body.lane || "未分类",
    sourceType: req.body.sourceType || "手工添加",
    score: req.body.score || "C",
    quality: Number(req.body.quality || 50),
    followers: Number(req.body.followers || 0),
    avgLikes: Number(req.body.avgLikes || 0),
    hot30d: Number(req.body.hot30d || 0),
    posts30d: Number(req.body.posts30d || 0),
    tags: req.body.tags || [],
    status: req.body.status || "active",
    lastSync: null,
  };
  store.accounts = [account, ...store.accounts];
  addActivity(store, `新增数据源：${account.name}`);
  await writeStore(store);
  res.json(account);
});

app.patch("/api/accounts/:id", async (req, res) => {
  const store = await readStore();
  const idx = store.accounts.findIndex((item) => item.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "account not found" });
  store.accounts[idx] = { ...store.accounts[idx], ...req.body };
  addActivity(store, `更新数据源：${store.accounts[idx].name}`);
  await writeStore(store);
  res.json(store.accounts[idx]);
});

app.patch("/api/contents/:id", async (req, res) => {
  const store = await readStore();
  const idx = store.contents.findIndex((item) => item.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "content not found" });
  store.contents[idx] = { ...store.contents[idx], ...req.body };
  addActivity(store, `更新内容：${store.contents[idx].title || store.contents[idx].author}`);
  await writeStore(store);
  res.json(store.contents[idx]);
});

app.post("/api/topics", async (req, res) => {
  const store = await readStore();
  const topic = {
    id: uid("topic"),
    title: req.body.title || "新选题",
    status: req.body.status || "想法",
    category: req.body.category || "AI综合",
    targetPlatform: req.body.targetPlatform || "待定",
    notes: req.body.notes || "",
    sourceContentIds: req.body.sourceContentIds || [],
    evidenceCount: Number(req.body.evidenceCount || 1),
    confidence: Number(req.body.confidence || 50),
    angles: req.body.angles || [],
  };
  store.topics = [topic, ...store.topics];
  addActivity(store, `新增选题：${topic.title}`);
  await writeStore(store);
  res.json(topic);
});

app.post("/api/collect/import", async (req, res) => {
  const store = await readStore();
  const items = String(req.body.text || "")
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ title: text.split(/\r?\n/)[0].slice(0, 80), text }));
  const normalized = normalizeCollectedItems(items, { platform: req.body.platform || "手工", source: "manual-import" }, store);
  const fresh = mergeNewContents(store, normalized);
  addActivity(store, `手工导入 ${fresh.length} 条内容`);
  await writeStore(store);
  res.json({ added: fresh.length, contents: fresh });
});

app.post("/api/collect/defaults", async (req, res) => {
  const store = await readStore();
  const limit = Math.min(Number(req.body.limit || 6), 20);
  const rssAccounts = store.accounts.filter((item) => item.platform === "RSS" && item.status === "active" && item.handle);
  const errors = [];
  let added = 0;
  for (const account of rssAccounts) {
    try {
      const fresh = await collectForAccount(store, account, limit);
      added += fresh.length;
    } catch (error) {
      errors.push({ source: account.name, error: error.message || String(error) });
    }
  }
  addActivity(store, `真实公开源采集完成：新增 ${added} 条，失败 ${errors.length} 个源`);
  const next = await writeStore(store);
  res.json({ added, errors, store: next });
});

app.post("/api/collect/run", async (req, res) => {
  const store = await readStore();
  const platform = req.body.platform || "RSS";
  const limit = Math.min(Number(req.body.limit || 10), 30);
  const account = store.accounts.find((item) => item.id === req.body.accountId);
  try {
    let normalized = [];
    let commandInfo = null;

    if (platform === "RSS") {
      const url = String(req.body.query || account?.handle || "").trim();
      if (!url) return res.status(400).json({ error: "RSS 需要填写 feed URL" });
      const rssItems = await collectRss(url, limit);
      normalized = normalizeCollectedItems(rssItems, { platform: "RSS", accountId: account?.id, source: "rss" }, store);
      commandInfo = { command: "built-in-rss", args: [url] };
    } else if (platform === "B站") {
      const query = String(req.body.query || account?.handle || "").trim();
      const biliItems = await collectBilibiliSearch(query, limit);
      normalized = normalizeCollectedItems(biliItems, { platform: "B站", accountId: account?.id, source: "bilibili-api" }, store);
      commandInfo = { command: "built-in-bilibili-search-api", args: [query] };
    } else {
      commandInfo = collectorCommand({ ...req.body, platform, limit }, account);
      if (!commandInfo) return res.status(400).json({ error: `暂不支持 ${platform}` });
      const result = await runCommand(commandInfo.command, commandInfo.args, { timeoutMs: 60000 });
      if (!result.ok) {
        return res.status(409).json({
          error: `${platform} 采集命令执行失败`,
          command: `${commandInfo.command} ${commandInfo.args.join(" ")}`,
          stderr: result.stderr || result.stdout,
          hint: "先运行 agent-reach install --env=auto，并按该平台要求配置 Cookie/登录态。",
        });
      }
      const parsed = unwrapCollectedPayload(parseJsonish(result.stdout));
      normalized =
        parsed.length > 0
          ? normalizeCollectedItems(parsed, { platform, accountId: account?.id, source: "cli" }, store)
          : rawFallbackContent(result.stdout, { platform, accountId: account?.id, source: "cli-raw" }, store);
    }

    if (req.body.dryRun) {
      return res.json({ added: normalized.length, contents: normalized, command: commandInfo, dryRun: true });
    }

    const fresh = mergeNewContents(store, normalized);
    if (account) {
      store.accounts = store.accounts.map((item) =>
        item.id === account.id ? { ...item, lastSync: nowIso(), posts30d: item.posts30d + fresh.length } : item
      );
    }
    addActivity(store, `${platform} 采集完成：新增 ${fresh.length} 条`);
    await writeStore(store);
    res.json({ added: fresh.length, contents: fresh, command: commandInfo });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/reset", async (_req, res) => {
  const next = await writeStore({ ...seed, meta: { createdAt: nowIso(), updatedAt: nowIso(), mode: "real" } });
  res.json(next);
});

await ensureStore();
app.listen(PORT, "127.0.0.1", () => {
  console.log(`AI Media Radar API listening on http://127.0.0.1:${PORT}`);
});
