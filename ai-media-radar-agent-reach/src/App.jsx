import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CircleDot,
  Database,
  Filter,
  Flame,
  FolderKanban,
  Layers,
  Loader2,
  Plus,
  Radar,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const navItems = [
  { key: "accounts", label: "账号库", icon: Users },
  { key: "collect", label: "采集监控", icon: Radar },
  { key: "stream", label: "内容流", icon: Layers },
  { key: "tags", label: "标签库", icon: Tag },
  { key: "topics", label: "选题库", icon: FolderKanban },
  { key: "settings", label: "设置", icon: Settings },
];

const scoreRank = { S: 4, A: 3, B: 2, C: 1, D: 0 };

function compact(value) {
  const n = Number(value || 0);
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 1 : 0)}万`;
  return new Intl.NumberFormat("zh-CN").format(n);
}

function timeAgo(value) {
  if (!value) return "未采集";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}小时前`;
  return `${Math.round(hours / 24)}天前`;
}

function scoreClass(score) {
  return `score score-${String(score || "C").toLowerCase()}`;
}

function api(path, options = {}) {
  return fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "请求失败");
    return data;
  });
}

function Sidebar({ activeView, setActiveView, stats }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Radar size={28} />
        </div>
        <div>
          <strong>AI Media Radar</strong>
          <span>个人采集与选题雷达</span>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? "active" : ""}`}
              onClick={() => setActiveView(item.key)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-stats">
        <div className="metric-tile">
          <strong>{compact(stats.accounts)}</strong>
          <span>真实数据源</span>
        </div>
        <div className="metric-tile">
          <strong>{compact(stats.contents)}</strong>
          <span>内容库</span>
        </div>
        <div className="metric-tile wide">
          <strong>{compact(stats.hot)}</strong>
          <span>近 72h 检出爆款</span>
        </div>
      </div>

      <div className="sidebar-foot">X · YouTube · B站 · 小红书 · RSS</div>
    </aside>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}

function SelectControl({ value, onChange, children, label }) {
  return (
    <label className="control">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <ChevronDown size={17} />
    </label>
  );
}

function SearchControl({ value, onChange, placeholder }) {
  return (
    <label className="search-control">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function Chip({ children, tone = "plain" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

function AccountsView({ store, onAddAccount }) {
  const [platform, setPlatform] = useState("全部平台");
  const [lane, setLane] = useState("全部赛道");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ platform: "X", name: "", handle: "", lane: "AI编程", tags: "" });

  const lanes = [...new Set(store.accounts.map((account) => account.lane))];
  const platforms = [...new Set(store.accounts.map((account) => account.platform))];

  const accounts = store.accounts
    .filter((account) => platform === "全部平台" || account.platform === platform)
    .filter((account) => lane === "全部赛道" || account.lane === lane)
    .filter((account) => {
      const text = `${account.name} ${account.handle} ${account.tags.join(" ")}`.toLowerCase();
      return text.includes(query.toLowerCase());
    })
    .sort((a, b) => scoreRank[b.score] - scoreRank[a.score] || b.quality - a.quality);

  return (
    <section>
      <PageHeader
        title="账号库"
        subtitle={`${store.accounts.length} 个真实数据源在持续监控，RSS 源可直接采集，社交平台需要登录态后再启用。`}
        actions={
          <button className="primary-button" onClick={() => document.getElementById("accountName")?.focus()}>
            <Plus size={17} />
            新增账号
          </button>
        }
      />

      <div className="toolbar">
        <SelectControl value={platform} onChange={setPlatform} label="平台">
          <option>全部平台</option>
          {platforms.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectControl>
        <SelectControl value={lane} onChange={setLane} label="赛道">
          <option>全部赛道</option>
          {lanes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectControl>
        <SearchControl value={query} onChange={setQuery} placeholder="搜账号名、标签、handle" />
      </div>

      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAddAccount({
            ...draft,
            tags: draft.tags
              .split(/[,\s，]+/)
              .map((item) => item.trim())
              .filter(Boolean),
          });
          setDraft({ platform: "X", name: "", handle: "", lane: "AI编程", tags: "" });
        }}
      >
        <SelectControl
          value={draft.platform}
          onChange={(value) => setDraft((next) => ({ ...next, platform: value }))}
          label="新账号平台"
        >
          <option>X</option>
          <option>YouTube</option>
          <option>B站</option>
          <option>小红书</option>
          <option>RSS</option>
        </SelectControl>
        <input
          id="accountName"
          value={draft.name}
          onChange={(event) => setDraft((next) => ({ ...next, name: event.target.value }))}
          placeholder="账号名"
          required
        />
        <input
          value={draft.handle}
          onChange={(event) => setDraft((next) => ({ ...next, handle: event.target.value }))}
          placeholder="@handle 或 RSS URL"
        />
        <input
          value={draft.tags}
          onChange={(event) => setDraft((next) => ({ ...next, tags: event.target.value }))}
          placeholder="标签，用空格分隔"
        />
        <button className="ghost-button" type="submit">
          <Plus size={16} />
          添加
        </button>
      </form>

      <div className="account-grid">
        {accounts.map((account) => (
          <article className="account-card" key={account.id}>
            <div className="account-top">
              <img src={account.avatar} alt="" />
              <div>
                <h2>{account.name}</h2>
                <p>
                  {account.platform} · {account.lane}
                </p>
              </div>
              <span className={scoreClass(account.score)}>{account.score} {account.quality}</span>
            </div>
            <p className="account-desc">{account.sourceType}</p>
            <div className="account-metrics">
              <div>
                <strong>{compact(account.followers)}</strong>
                <span>粉丝</span>
              </div>
              <div>
                <strong>{account.posts30d}</strong>
                <span>30天</span>
              </div>
              <div>
                <strong>{account.avgLikes}</strong>
                <span>中位赞</span>
              </div>
              <div>
                <strong>{account.hot30d}</strong>
                <span>爆款</span>
              </div>
            </div>
            <div className="tag-row">
              {account.tags.slice(0, 3).map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
            <div className="card-foot">
              <span>{timeAgo(account.lastSync)}</span>
              <span>{account.handle}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StreamView({ store, onPatchContent, onCreateTopic }) {
  const [platform, setPlatform] = useState("全部平台");
  const [score, setScore] = useState("全部评级");
  const [query, setQuery] = useState("");
  const platforms = [...new Set(store.contents.map((item) => item.platform))];

  const contents = store.contents
    .filter((item) => !item.removed)
    .filter((item) => platform === "全部平台" || item.platform === platform)
    .filter((item) => score === "全部评级" || item.score === score)
    .filter((item) => `${item.author} ${item.text} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return (
    <section>
      <PageHeader
        title={`内容流 · ${new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}`}
        subtitle="监控账号的内容按发布时间倒序。看到好内容就收进选题，噪音可以移出。"
      />

      <div className="toolbar">
        <SelectControl value={score} onChange={setScore} label="评级">
          <option>全部评级</option>
          <option>S</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
        </SelectControl>
        <SelectControl value={platform} onChange={setPlatform} label="平台">
          <option>全部平台</option>
          {platforms.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectControl>
        <SearchControl value={query} onChange={setQuery} placeholder="搜标题关键词、作者、标签" />
      </div>

      <div className="stream-layout">
        <div className="feed">
          <div className="feed-count">已加载 {contents.length} 条</div>
          {contents.map((item) => (
            <article className="feed-item" key={item.id}>
              <img src={item.avatar} alt="" className="feed-avatar" />
              <div className="feed-main">
                <div className="feed-meta">
                  <strong>{item.author}</strong>
                  <span>{item.handle}</span>
                  <span>{item.platform}</span>
                  <span>{timeAgo(item.publishedAt)}</span>
                  <span className={scoreClass(item.score)}>{item.score} {item.heatScore}</span>
                </div>
                <p className="feed-text">{item.text}</p>
                <div className="feed-tags">
                  {item.tags.map((tag) => (
                    <Chip key={tag} tone={tag.includes("风险") ? "warn" : "plain"}>
                      {tag}
                    </Chip>
                  ))}
                </div>
                <div className="feed-actions">
                  <span>评论 {compact(item.metrics.comments)}</span>
                  <span>转发 {compact(item.metrics.reposts)}</span>
                  <span>赞 {compact(item.metrics.likes)}</span>
                  <span>曝光 {compact(item.metrics.views)}</span>
                  <button
                    title="收藏到素材箱"
                    className={item.collected ? "text-button active" : "text-button"}
                    onClick={() => onPatchContent(item.id, { collected: !item.collected })}
                  >
                    <Archive size={16} />
                    {item.collected ? "已收录" : "收录"}
                  </button>
                  <button className="text-button" onClick={() => onCreateTopic(item)}>
                    <Sparkles size={16} />
                    生成选题
                  </button>
                  <button className="icon-button" title="移出内容流" onClick={() => onPatchContent(item.id, { removed: true })}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="insight-panel">
          <h2>爆款判断</h2>
          <div className="rule-row">
            <Flame size={18} />
            <span>优先看相对表现，不只看绝对点赞。</span>
          </div>
          <div className="score-list">
            {["S 强爆款", "A 高潜内容", "B 可观察", "C 普通内容"].map((item) => (
              <div key={item}>
                <CircleDot size={14} />
                {item}
              </div>
            ))}
          </div>
          <h2>今日可写</h2>
          {store.topics.slice(0, 3).map((topic) => (
            <div className="mini-topic" key={topic.id}>
              <strong>{topic.title}</strong>
              <span>{topic.evidenceCount} 条证据 · {topic.confidence}% 置信</span>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

function TagsView({ store }) {
  const groups = store.tags.reduce((acc, tag) => {
    acc[tag.group] ||= [];
    acc[tag.group].push(tag);
    return acc;
  }, {});

  return (
    <section>
      <PageHeader title="标签库" subtitle={`${store.tags.length} 个标签，用固定标签 + 临时热词控制 AI 分类不要发散。`} />
      <div className="tag-groups">
        {Object.entries(groups).map(([group, tags]) => (
          <section className="tag-group" key={group}>
            <h2>
              {group} <span>({tags.length})</span>
            </h2>
            <div className="tag-cloud">
              {tags
                .sort((a, b) => b.count - a.count)
                .map((tag) => (
                  <button className={`tag-pill ${tag.watch ? "watching" : ""}`} key={tag.id}>
                    {tag.watch ? <Search size={16} /> : null}
                    <span>{tag.name}</span>
                    <strong>{compact(tag.count)}</strong>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function TopicsView({ store }) {
  return (
    <section>
      <PageHeader title="选题库" subtitle="把内容流里的强信号收敛成可制作的选题角度。" />
      <div className="topics">
        {store.topics.map((topic) => (
          <article className="topic-card" key={topic.id}>
            <div className="topic-head">
              <div>
                <span className="topic-status">{topic.status}</span>
                <h2>{topic.title}</h2>
              </div>
              <div className="confidence">
                <strong>{topic.confidence}%</strong>
                <span>置信度</span>
              </div>
            </div>
            <div className="topic-fields">
              <Chip>{topic.category}</Chip>
              <Chip>{topic.targetPlatform}</Chip>
              <Chip tone="good">{topic.evidenceCount} 条证据</Chip>
            </div>
            <p>{topic.notes}</p>
            <div className="angles">
              {topic.angles.map((angle) => (
                <div className="angle-row" key={angle.title}>
                  {angle.checked ? <Check size={18} /> : <ChevronDown size={18} />}
                  <div>
                    <strong>{angle.title}</strong>
                    <span>{angle.note}</span>
                  </div>
                  <Chip tone="good">{angle.evidence}</Chip>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CollectView({ store, onRunCollector, onRunDefaultCollectors, onImportManual, busy, message }) {
  const [form, setForm] = useState({
    platform: "RSS",
    query: "https://hnrss.org/newest?q=AI",
    accountId: "",
    limit: 10,
  });
  const [manual, setManual] = useState("");

  const accounts = form.platform === "全部" ? store.accounts : store.accounts.filter((item) => item.platform === form.platform);

  useEffect(() => {
    if (form.platform === "RSS" && !form.query) {
      setForm((next) => ({ ...next, query: "https://hnrss.org/newest?q=AI" }));
    }
  }, [form.platform, form.query]);

  return (
    <section>
      <PageHeader
        title="采集监控"
        subtitle="个人版先把采集做成可控手动运行：RSS 内置可跑，其它平台调用 Agent-Reach 推荐的上游 CLI。"
      />
      <div className="collector-layout">
        <section className="collector-main">
          <h2>运行一次采集</h2>
          <div className="collector-form">
            <SelectControl
              value={form.platform}
              onChange={(value) =>
                setForm((next) => ({
                  ...next,
                  platform: value,
                  query: value === "RSS" ? "https://hnrss.org/newest?q=AI" : "",
                  accountId: "",
                }))
              }
              label="采集平台"
            >
              <option>RSS</option>
              <option>YouTube</option>
              <option>X</option>
              <option>B站</option>
              <option>小红书</option>
            </SelectControl>
            <SelectControl
              value={form.accountId}
              onChange={(value) => setForm((next) => ({ ...next, accountId: value }))}
              label="账号"
            >
              <option value="">不绑定账号</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </SelectControl>
            <input
              value={form.query}
              onChange={(event) => setForm((next) => ({ ...next, query: event.target.value }))}
              placeholder={form.platform === "RSS" ? "RSS URL" : "关键词或账号 handle"}
            />
            <input
              type="number"
              min="1"
              max="30"
              value={form.limit}
              onChange={(event) => setForm((next) => ({ ...next, limit: event.target.value }))}
            />
            <button className="primary-button" onClick={() => onRunCollector(form)} disabled={busy}>
              {busy ? <Loader2 className="spin" size={17} /> : <RefreshCcw size={17} />}
              运行采集
            </button>
            <button className="ghost-button" onClick={onRunDefaultCollectors} disabled={busy}>
              {busy ? <Loader2 className="spin" size={17} /> : <Database size={17} />}
              一键采集真实公开源
            </button>
          </div>
          {message ? <div className="notice">{message}</div> : null}

          <h2>手工导入</h2>
          <textarea
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder={"一条内容一段。可以先把 Agent-Reach 或浏览器里看到的内容复制进来，后面再逐步自动化。"}
          />
          <button
            className="ghost-button"
            onClick={() => {
              onImportManual(manual);
              setManual("");
            }}
            disabled={!manual.trim()}
          >
            <Plus size={16} />
            导入内容流
          </button>
        </section>

        <aside className="collector-side">
          <h2>接入清单</h2>
          {store.collectors.map((collector) => (
            <div className="collector-card" key={collector.id}>
              <div>
                <strong>{collector.name}</strong>
                <span>{collector.platform} · {collector.status}</span>
              </div>
              <code>{collector.command}</code>
              <p>{collector.needs}</p>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

function SettingsView({ store, onReset, onDoctor, doctor }) {
  return (
    <section>
      <PageHeader title="设置" subtitle="个人版配置集中放在这里，后续可以扩展成采集频率、代理、账号 Cookie 管理。" />
      <div className="settings-grid">
        <section className="settings-section">
          <h2>Agent-Reach 状态</h2>
          <p>检查本机是否安装 Agent-Reach，以及当前哪些平台后端可用。</p>
          <button className="ghost-button" onClick={onDoctor}>
            <Activity size={16} />
            运行 doctor
          </button>
          {doctor ? <pre className="doctor-output">{JSON.stringify(doctor, null, 2)}</pre> : null}
        </section>
        <section className="settings-section">
          <h2>本地数据</h2>
          <p>当前数据保存在 `server/data/store.json`，适合个人使用和手工备份。</p>
          <div className="settings-metrics">
            <span>{store.accounts.length} 个账号</span>
            <span>{store.contents.length} 条内容</span>
            <span>{store.topics.length} 个选题</span>
          </div>
          <button className="danger-button" onClick={onReset}>
            <Trash2 size={16} />
            重置真实源配置
          </button>
        </section>
      </div>
    </section>
  );
}

export default function App() {
  const [store, setStore] = useState(null);
  const [activeView, setActiveView] = useState("accounts");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [doctor, setDoctor] = useState(null);

  async function load() {
    const data = await api("/api/bootstrap");
    setStore(data);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, []);

  const stats = useMemo(() => {
    if (!store) return { accounts: 0, contents: 0, hot: 0 };
    return {
      accounts: store.accounts.length,
      contents: store.contents.length,
      hot: store.contents.filter((item) => item.heatScore >= 75).length,
    };
  }, [store]);

  async function addAccount(account) {
    const created = await api("/api/accounts", { method: "POST", body: JSON.stringify(account) });
    setStore((next) => ({ ...next, accounts: [created, ...next.accounts] }));
  }

  async function patchContent(id, patch) {
    const updated = await api(`/api/contents/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setStore((next) => ({
      ...next,
      contents: next.contents.map((item) => (item.id === id ? updated : item)),
    }));
  }

  async function createTopicFromContent(content) {
    const topic = await api("/api/topics", {
      method: "POST",
      body: JSON.stringify({
        title: content.summary || content.text.slice(0, 60),
        status: "想法",
        category: content.tags[0] || "AI综合",
        targetPlatform: content.platform === "X" ? "公众号 / 小红书" : content.platform,
        notes: content.rationale || content.text,
        sourceContentIds: [content.id],
        evidenceCount: 1,
        confidence: Math.min(90, Math.max(50, content.heatScore)),
        angles: content.tags.slice(0, 4).map((tag, index) => ({
          title: tag,
          evidence: index === 0 ? 1 : 0,
          checked: index === 0,
          note: `围绕「${tag}」展开信息点。`,
        })),
      }),
    });
    setStore((next) => ({ ...next, topics: [topic, ...next.topics] }));
    setActiveView("topics");
  }

  async function runCollector(form) {
    setBusy(true);
    setMessage("");
    try {
      const result = await api("/api/collect/run", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage(`采集完成：新增 ${result.added} 条。`);
      await load();
      setActiveView("stream");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function runDefaultCollectors() {
    setBusy(true);
    setMessage("");
    try {
      const result = await api("/api/collect/defaults", {
        method: "POST",
        body: JSON.stringify({ limit: 8 }),
      });
      setMessage(`真实公开源采集完成：新增 ${result.added} 条，失败 ${result.errors?.length || 0} 个源。`);
      await load();
      setActiveView("stream");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function importManual(text) {
    if (!text.trim()) return;
    const result = await api("/api/collect/import", {
      method: "POST",
      body: JSON.stringify({ text, platform: "手工" }),
    });
    setMessage(`已导入 ${result.added} 条。`);
    await load();
    setActiveView("stream");
  }

  async function resetData() {
    const next = await api("/api/reset", { method: "POST" });
    setStore(next);
    setMessage("真实源配置已重置。");
  }

  async function runDoctor() {
    const result = await api("/api/doctor");
    setDoctor(result);
  }

  if (!store) {
    return (
      <div className="loading">
        <Loader2 className="spin" size={24} />
        正在加载个人雷达
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} stats={stats} />
      <main className="content">
        {activeView === "accounts" ? <AccountsView store={store} onAddAccount={addAccount} /> : null}
        {activeView === "collect" ? (
          <CollectView
            store={store}
            onRunCollector={runCollector}
            onRunDefaultCollectors={runDefaultCollectors}
            onImportManual={importManual}
            busy={busy}
            message={message}
          />
        ) : null}
        {activeView === "stream" ? (
          <StreamView store={store} onPatchContent={patchContent} onCreateTopic={createTopicFromContent} />
        ) : null}
        {activeView === "tags" ? <TagsView store={store} /> : null}
        {activeView === "topics" ? <TopicsView store={store} /> : null}
        {activeView === "settings" ? (
          <SettingsView store={store} onReset={resetData} onDoctor={runDoctor} doctor={doctor} />
        ) : null}
      </main>
    </div>
  );
}
