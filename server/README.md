# Embedded Interview AI Backend

该服务为个人面试助手提供鉴权、知识检索和 OpenAI-compatible 流式回答。API Key、访问令牌和私有资料只放在后端，不能写入前端或提交到 GitHub。

## 本地运行

如果只在电脑上使用，推荐直接在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local-assistant.ps1
```

首次运行会自动创建 `server/.env`、启用 `LOCAL_ONLY=true` 并打开配置文件。填写 `OPENAI_API_KEY` 后再次运行即可。电脑本地模式不要求在网页中填写访问令牌；之后脚本会启动前端和后端并自动打开浏览器，不需要重复配置。

如果使用中转或自定义 API，在网页 AI 助手设置中填写 API 请求地址、服务商模型名和协议。最常见的中转服务选择 `Chat Completions`，请求地址通常是服务商文档给出的 `/v1` 地址，例如 `https://provider.example.com/v1`。只有明确支持 Responses API 的服务才选择 `Responses`。

停止本地服务：

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-local-assistant.ps1
```

```powershell
cd server
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 本地模式下 LOCAL_ONLY=true 时不需要填写 ASSISTANT_ACCESS_TOKEN
python -m uvicorn app.main:app --host 127.0.0.1 --port 8787 --reload
```

另开终端，在仓库根目录启动静态站点：

```powershell
python -m http.server 8000
```

浏览器打开 `http://127.0.0.1:8000`，在 AI 助手设置中填写：

- 后端地址：`http://127.0.0.1:8787`
- 访问令牌：`.env` 中的 `ASSISTANT_ACCESS_TOKEN`

## 私有知识

公开题库由以下命令重新生成：

```powershell
node server/scripts/export_knowledge.cjs
```

本机私有资料放入 `server/private_knowledge/`，支持 UTF-8 的 `.md`、`.txt` 和 `.json`。该目录已被 `.gitignore` 排除。JSON 可以是文档数组，也可以使用：

```json
{
  "documents": [
    {
      "id": "internship-example",
      "title": "实习工作闭环",
      "category": "私有实习资料",
      "status": "private",
      "text": "脱敏后的工作背景、负责范围、排查过程和验证证据"
    }
  ]
}
```

线上部署可把一份 Markdown/JSON 配置为平台的 Secret File，并将 `PRIVATE_KNOWLEDGE_PATH` 指向该文件。不要上传内部截图、客户标识、公司源码、账号或未脱敏日志。

## Render 部署

仓库根目录的 `render.yaml` 可创建 Web Service。部署时设置：

- `OPENAI_API_KEY`：OpenAI API Key
- `ASSISTANT_ACCESS_TOKEN`：一段至少 32 字节的随机令牌
- `OPENAI_MODEL`：账号可用的模型，例如 `gpt-5-mini`
- `CORS_ORIGINS`：保留 `https://lz0314-boy.github.io`

部署成功后，把 `https://<service>.onrender.com` 和访问令牌填入手机端 AI 助手设置。`/health` 可用于检查知识数量和 AI 配置状态。

## API

- `GET /health`：公开健康检查
- `POST /v1/chat`：需 `X-Assistant-Token`，返回 SSE 事件 `meta`、`sources`、`delta`、`done` 或 `error`
- `POST /v1/knowledge/search`：需 `X-Assistant-Token`，返回检索片段

运行测试：

```powershell
$env:PYTHONPATH='.'
python -m pytest tests -q
```
