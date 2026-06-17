# AI Media Radar MVP

个人版 AI 媒体采集与选题雷达。第一版目标不是商业化 SaaS，而是给自己用的本地工作台：

- 账号库：维护真实数据源、平台、赛道、质量评分。
- 采集监控：RSS 内置可采集；X、B站、小红书、YouTube 通过 Agent-Reach 推荐的上游 CLI 采集。
- 内容流：按时间查看内容，收藏素材、移除噪音、生成选题。
- 标签库：用固定标签 + 关注标签控制分类边界。
- 选题库：把内容信号沉淀成可制作角度。

## 运行

```bash
npm install
npm run dev
```

默认地址：

- 前端：http://127.0.0.1:5174
- 后端：http://127.0.0.1:8787

本地数据保存在：

```text
server/data/store.json
```

## 真实数据模式

默认不会再写入假内容。初始只配置这些公开可采集源：

- OpenAI News RSS
- Hugging Face Blog RSS
- GitHub Changelog RSS
- Simon Willison Atom
- Hacker News AI RSS

在「采集监控」里点击「一键采集真实公开源」即可拉取真实内容。

## Agent-Reach 接入

当前项目会优先使用本机隔离环境：

```text
%USERPROFILE%\.agent-reach-venv
```

如需重装：

```powershell
py -3 -m venv $env:USERPROFILE\.agent-reach-venv
& $env:USERPROFILE\.agent-reach-venv\Scripts\python.exe -m pip install --upgrade "https://github.com/Panniantong/Agent-Reach/archive/refs/heads/main.zip" twitter-cli
```

第一版采集策略：

- RSS：后端内置 fetch + XML 解析，可以直接跑。
- YouTube：调用 Agent-Reach 环境里的 `yt-dlp --dump-json ytsearch10:关键词`。
- X：调用 Agent-Reach 环境里的 `twitter user-posts handle -n 20 --json` 或 `twitter search 关键词 -n 20 --json`，需要 `TWITTER_AUTH_TOKEN` 和 `TWITTER_CT0`。
- B站：内置公开搜索 API fallback，可直接搜索视频。
- 小红书：预留 `opencli xiaohongshu search 关键词 -f json`，需要 OpenCLI/浏览器登录态。

后端会自动把 `%USERPROFILE%\.agent-reach-venv\Scripts` 加入采集命令的 `PATH`，并读取 `%USERPROFILE%\.agent-reach\config.yaml` 里的 `twitter_auth_token` / `twitter_ct0`。可以用下面命令检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/doctor
```
