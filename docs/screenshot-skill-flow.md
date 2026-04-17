# Flow: Chụp ảnh trang web

User prompt: _"Vào trang https://www.24h.com.vn/ và chụp ảnh cho tôi nhé"_

---

## 1. HTTP Request

```
POST /api/v1/agents/time-agent/generate
{ "messages": [{ "role": "user", "content": "Vào trang https://www.24h.com.vn/ và chụp ảnh cho tôi nhé" }] }
```

MastraServer nhận request, route vào `timeAgent.generate()`.

---

## 2. Mastra chuẩn bị context

- **SkillsProcessor** chạy ở step 0: scan `.skills/`, inject metadata vào system prompt:
  ```
  Available Skills:
  - agent-browser-screenshot: Uses agent-browser to open a page, inspect it with snapshots, and save screenshots
  ```
- Agent nhận full context: system instructions + skill list + user message.

---

## 3. LLM quyết định gọi tool

Model (gpt-4o-mini) nhận context, nhận ra user muốn chụp ảnh → quyết định gọi `runSkill` tool:

```json
{
  "skillName": "agent-browser-screenshot",
  "url": "https://www.24h.com.vn/",
  "fullPage": true
}
```

---

## 4. `run-skill-tool` execute

`run-skill-tool.ts` nhận input, gọi `executeSkill()` trong `skill-runner-service.ts`.

---

## 5. Skill registry resolve

`skill-registry-service.ts` scan `.skills/`, tìm skill có name/tag khớp `agent-browser-screenshot`, trả về `SkillDefinition` (name, tags, filePath).

---

## 6. Skill runner chuẩn bị lệnh

`runBrowserScreenshotSkill()` build shell command:

```bash
mkdir -p /workspace/runs/<runId>/artifacts \
&& agent-browser open "https://www.24h.com.vn/" \
&& agent-browser snapshot -i \
&& agent-browser screenshot --full "/workspace/runs/<runId>/artifacts/agent-browser-screenshot.png" \
&& agent-browser close
```

---

## 7. Sandbox execution

`sandbox-exec-service.ts` gọi Docker API (`dockerode`):
- `container.exec()` tạo exec instance trong container `netclaw-sandbox`
- `exec.start({ hijack: true })` chạy lệnh
- Nếu dockerode throw HTTP 101 (TTY WebSocket upgrade), error được catch và output được extract từ error message
- `exec.inspect()` lấy exit code

Bên trong container, `agent-browser`:
1. Mở Chromium, navigate tới `https://www.24h.com.vn/`
2. Chụp DOM snapshot (accessibility tree)
3. Chụp screenshot full-page, lưu vào `/workspace/runs/<runId>/artifacts/agent-browser-screenshot.png`
4. Đóng browser

---

## 8. Copy artifact ra host

`sandbox-artifact-service.ts`:
- `container.getArchive({ path: sandboxPath })` — Docker tar stream từ container
- Extract file từ tar stream
- Ghi ra `packages/api/.artifacts/<runId>/agent-browser-screenshot.png`

---

## 9. Tool trả về kết quả

`run-skill-tool` trả về cho LLM:

```json
{
  "runId": "<runId>",
  "summary": "Captured screenshot of https://www.24h.com.vn/ using skill \"agent-browser-screenshot\".",
  "artifacts": [
    {
      "id": "<uuid>",
      "kind": "image",
      "fileName": "agent-browser-screenshot.png",
      "mimeType": "image/png",
      "url": "http://localhost:3000/api/v1/artifacts/<runId>/agent-browser-screenshot.png"
    }
  ]
}
```

---

## 10. LLM sinh response

Model nhận tool result, sinh text response trả về client. Artifacts có URL thật để client fetch.

---

## 11. Client lấy ảnh

```
GET /api/v1/artifacts/<runId>/agent-browser-screenshot.png
→ 200 image/png
```

`artifacts.ts` route đọc file từ `.artifacts/<runId>/` và serve.

---

## Sơ đồ tổng quan

```
Client
  │  POST /generate
  ▼
MastraServer → timeAgent.generate()
  │  SkillsProcessor inject skill metadata
  ▼
LLM (gpt-4o-mini)
  │  tool_call: runSkill(agent-browser-screenshot, url)
  ▼
run-skill-tool
  │  executeSkill()
  ▼
skill-registry-service  →  resolve skill definition
  ▼
skill-runner-service    →  build shell command
  ▼
sandbox-exec-service    →  Docker exec in netclaw-sandbox
  │  agent-browser open / snapshot / screenshot / close
  ▼
sandbox-artifact-service →  tar extract → write to .artifacts/
  ▼
run-skill-tool          →  return { artifacts: [{ url }] }
  ▼
LLM                     →  generate text response
  ▼
Client
  │  GET /api/v1/artifacts/<runId>/agent-browser-screenshot.png
  ▼
  🖼️ image
```
