(function () {
  "use strict";

  const STORAGE_PREFIX = "ei_ai_v1_";
  const MAX_STORED_MESSAGES = 30;
  const MODES = {
    answer: { label: "答疑模式", placeholder: "输入简历、项目或嵌入式问题" },
    mock: { label: "模拟面试", placeholder: "输入岗位方向，开始一轮模拟面试" },
    review: { label: "答案点评", placeholder: "粘贴你的回答，让 AI 帮你改进" }
  };

  const elements = {
    drawer: document.querySelector("#aiDrawer"),
    scrim: document.querySelector("#aiScrim"),
    launch: document.querySelector("#aiLaunchBtn"),
    close: document.querySelector("#aiCloseBtn"),
    clear: document.querySelector("#aiClearBtn"),
    settingsButton: document.querySelector("#aiSettingsBtn"),
    settingsClose: document.querySelector("#aiSettingsCloseBtn"),
    settings: document.querySelector("#aiSettings"),
    backendUrl: document.querySelector("#aiBackendUrl"),
    accessToken: document.querySelector("#aiAccessToken"),
    tokenToggle: document.querySelector("#aiTokenToggle"),
    test: document.querySelector("#aiTestBtn"),
    save: document.querySelector("#aiSaveBtn"),
    settingsStatus: document.querySelector("#aiSettingsStatus"),
    connectionText: document.querySelector("#aiConnectionText"),
    statusDot: document.querySelector("#aiStatusDot"),
    messages: document.querySelector("#aiMessages"),
    input: document.querySelector("#aiInput"),
    send: document.querySelector("#aiSendBtn"),
    charCount: document.querySelector("#aiCharCount"),
    modeHint: document.querySelector("#aiModeHint")
  };

  if (!elements.drawer) return;

  const defaultBackendUrl = ["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://127.0.0.1:8787"
    : "";
  let config = readStorage("config", { backendUrl: defaultBackendUrl, accessToken: "" });
  if (!config || typeof config !== "object") config = { backendUrl: defaultBackendUrl, accessToken: "" };
  let history = readStorage("history", []);
  if (!Array.isArray(history)) history = [];
  let mode = readStorage("mode", "answer");
  if (!MODES[mode]) mode = "answer";
  let controller = null;
  let streamingMessage = null;

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (_) {}
  }

  function refreshIcons(root = document) {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ root, attrs: { "aria-hidden": "true" } });
    }
  }

  function setConnection(status, text) {
    elements.connectionText.textContent = text;
    elements.statusDot.dataset.status = status;
  }

  function openDrawer() {
    document.body.classList.add("ai-open");
    elements.drawer.setAttribute("aria-hidden", "false");
    window.setTimeout(() => elements.input.focus(), 180);
    if (config.backendUrl) checkHealth(false);
    else toggleSettings(true);
  }

  function closeDrawer() {
    document.body.classList.remove("ai-open");
    elements.drawer.setAttribute("aria-hidden", "true");
  }

  function toggleSettings(force) {
    const shouldOpen = typeof force === "boolean" ? force : elements.settings.hidden;
    elements.settings.hidden = !shouldOpen;
    if (shouldOpen) {
      elements.backendUrl.value = config.backendUrl;
      elements.accessToken.value = config.accessToken;
      elements.settingsStatus.textContent = "";
      window.setTimeout(() => elements.backendUrl.focus(), 50);
    }
  }

  function normalizeBackendUrl(value) {
    const trimmed = value.trim().replace(/\/+$/, "");
    if (!trimmed) throw new Error("请填写后端地址");
    let url;
    try {
      url = new URL(trimmed);
    } catch (_) {
      throw new Error("后端地址格式不正确");
    }
    if (location.protocol === "https:" && url.protocol !== "https:") {
      throw new Error("HTTPS 页面必须连接 HTTPS 后端");
    }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error("后端地址必须使用 HTTP 或 HTTPS");
    return url.toString().replace(/\/$/, "");
  }

  function normalizeAccessToken(value) {
    const token = String(value || "").trim();
    if (!token) throw new Error("请填写访问令牌");
    // Fetch serializes request headers as ISO-8859-1; reject pasted Chinese/full-width text early.
    if (!/^[\x20-\x7e]+$/.test(token)) {
      throw new Error("访问令牌只能使用 ASCII 字母、数字和符号，请重新粘贴随机令牌");
    }
    if (token.length < 16) throw new Error("访问令牌长度太短，请使用至少 16 个字符的随机令牌");
    return token;
  }

  async function checkHealth(showResult = true) {
    if (!config.backendUrl) {
      setConnection("offline", "未配置");
      return false;
    }
    setConnection("checking", "连接中");
    if (showResult) elements.settingsStatus.textContent = "正在检查…";
    try {
      const response = await fetch(`${config.backendUrl}/health`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const count = Number(data.knowledgeCount || 0);
      setConnection(data.aiConfigured ? "online" : "warning", data.aiConfigured ? `${count} 条知识` : "缺少 API Key");
      if (showResult) elements.settingsStatus.textContent = data.aiConfigured
        ? `连接成功 · ${count} 条知识`
        : `后端可用 · ${count} 条知识 · 未配置 API Key`;
      return true;
    } catch (_) {
      setConnection("offline", "连接失败");
      if (showResult) elements.settingsStatus.textContent = "无法连接后端";
      return false;
    }
  }

  function saveConfig() {
    try {
      config = {
        backendUrl: normalizeBackendUrl(elements.backendUrl.value),
        accessToken: normalizeAccessToken(elements.accessToken.value)
      };
      writeStorage("config", config);
      elements.settingsStatus.textContent = "已保存";
      checkHealth(true);
    } catch (error) {
      elements.settingsStatus.textContent = error.message;
    }
  }

  function setMode(nextMode) {
    if (!MODES[nextMode]) return;
    mode = nextMode;
    writeStorage("mode", mode);
    document.querySelectorAll("[data-ai-mode]").forEach((button) => {
      const active = button.dataset.aiMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.modeHint.textContent = MODES[mode].label;
    elements.input.placeholder = MODES[mode].placeholder;
  }

  function emptyState() {
    const wrapper = document.createElement("div");
    wrapper.className = "ai-empty";
    const avatar = document.createElement("span");
    avatar.className = "ai-empty-icon";
    avatar.innerHTML = '<i data-lucide="sparkles"></i>';
    const title = document.createElement("strong");
    title.textContent = "廖洲，今天从哪里开始？";
    const suggestions = document.createElement("div");
    suggestions.className = "ai-suggestions";
    [
      "模拟追问我的智能穿戴项目",
      "怎么回答 OTA 升级与回滚机制？",
      "从驱动岗位角度深挖我的简历",
      "给我一道 Linux BSP 高频题"
    ].forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", () => {
        elements.input.value = label;
        updateComposer();
        sendMessage();
      });
      suggestions.appendChild(button);
    });
    wrapper.append(avatar, title, suggestions);
    return wrapper;
  }

  function appendContent(container, content) {
    const pattern = /```([^\n`]*)\n?([\s\S]*?)```/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      appendPlainText(container, content.slice(cursor, match.index));
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      if (match[1].trim()) code.dataset.language = match[1].trim();
      code.textContent = match[2].replace(/^\n|\n$/g, "");
      pre.appendChild(code);
      container.appendChild(pre);
      cursor = pattern.lastIndex;
    }
    appendPlainText(container, content.slice(cursor));
  }

  function appendPlainText(container, text) {
    if (!text) return;
    const block = document.createElement("div");
    block.className = "ai-message-text";
    block.textContent = text.trim();
    if (block.textContent) container.appendChild(block);
  }

  function createSourceChip(source) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ai-source-chip";
    button.title = source.category || source.title;
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", source.sourceType === "private" ? "lock-keyhole" : "book-open-text");
    const label = document.createElement("span");
    label.textContent = source.title || source.id;
    button.append(icon, label);
    if (source.sourceType === "public") {
      button.addEventListener("click", () => {
        location.hash = `#question/${encodeURIComponent(source.id)}`;
        closeDrawer();
      });
    } else {
      button.disabled = true;
    }
    return button;
  }

  function renderMessages() {
    elements.messages.replaceChildren();
    if (!history.length) {
      elements.messages.appendChild(emptyState());
      refreshIcons(elements.messages);
      return;
    }
    history.forEach((message) => {
      const article = document.createElement("article");
      article.className = `ai-message ai-message-${message.role}${message.error ? " is-error" : ""}`;
      article.dataset.messageId = message.id;
      const label = document.createElement("span");
      label.className = "ai-message-label";
      label.textContent = message.role === "assistant" ? "廖洲 AI" : "你";
      const content = document.createElement("div");
      content.className = "ai-message-content";
      appendContent(content, message.content || (message.streaming ? "正在思考…" : ""));
      article.append(label, content);
      if (message.sources?.length) {
        const sources = document.createElement("div");
        sources.className = "ai-sources";
        message.sources.slice(0, 6).forEach((source) => sources.appendChild(createSourceChip(source)));
        article.appendChild(sources);
      }
      elements.messages.appendChild(article);
    });
    refreshIcons(elements.messages);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function updateStreamingMessage() {
    if (!streamingMessage) return;
    const article = elements.messages.querySelector(`[data-message-id="${CSS.escape(streamingMessage.id)}"]`);
    const content = article?.querySelector(".ai-message-content");
    if (content) {
      content.replaceChildren();
      appendContent(content, streamingMessage.content || "正在思考…");
    }
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function persistHistory() {
    const completed = history
      .filter((message) => !message.streaming && message.content)
      .slice(-MAX_STORED_MESSAGES)
      .map(({ id, role, content, sources, error }) => ({ id, role, content, sources, error }));
    writeStorage("history", completed);
  }

  function setStreaming(active) {
    elements.send.classList.toggle("is-stop", active);
    elements.send.setAttribute("aria-label", active ? "停止生成" : "发送问题");
    elements.send.title = active ? "停止生成" : "发送问题";
    elements.send.innerHTML = `<i data-lucide="${active ? "square" : "send"}"></i>`;
    elements.input.disabled = active;
    refreshIcons(elements.send);
  }

  function parseSseBlock(block) {
    const lines = block.split(/\r?\n/);
    const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() || "message";
    const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
    if (!data) return null;
    try {
      return { event, data: JSON.parse(data) };
    } catch (_) {
      return null;
    }
  }

  async function consumeStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      for (const block of blocks) {
        const parsed = parseSseBlock(block);
        if (!parsed || !streamingMessage) continue;
        if (parsed.event === "delta") {
          streamingMessage.content += parsed.data.text || "";
          streamingMessage.streaming = false;
          updateStreamingMessage();
        } else if (parsed.event === "sources") {
          streamingMessage.sources = parsed.data.items || [];
        } else if (parsed.event === "error") {
          throw new Error(parsed.data.message || "AI 服务返回错误");
        }
      }
      if (done) {
        const finalBlock = parseSseBlock(buffer);
        if (finalBlock && streamingMessage) {
          if (finalBlock.event === "delta") {
            streamingMessage.content += finalBlock.data.text || "";
          } else if (finalBlock.event === "sources") {
            streamingMessage.sources = finalBlock.data.items || [];
          } else if (finalBlock.event === "error") {
            throw new Error(finalBlock.data.message || "AI 服务返回错误");
          }
        }
        break;
      }
    }
  }

  async function sendMessage() {
    if (controller) {
      controller.abort();
      return;
    }
    const message = elements.input.value.trim();
    if (!message) return;
    if (!config.backendUrl || !config.accessToken) {
      toggleSettings(true);
      elements.settingsStatus.textContent = "请先完成后端连接设置";
      return;
    }
    try {
      config.accessToken = normalizeAccessToken(config.accessToken);
    } catch (error) {
      toggleSettings(true);
      elements.settingsStatus.textContent = error.message;
      return;
    }

    const priorHistory = history
      .filter((item) => !item.error && !item.streaming)
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content }));
    history.push({ id: crypto.randomUUID(), role: "user", content: message });
    streamingMessage = {
      id: crypto.randomUUID(), role: "assistant", content: "", sources: [], streaming: true
    };
    history.push(streamingMessage);
    elements.input.value = "";
    updateComposer();
    renderMessages();
    setStreaming(true);
    controller = new AbortController();

    try {
      const response = await fetch(`${config.backendUrl}/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Assistant-Token": config.accessToken
        },
        body: JSON.stringify({ message, history: priorHistory, mode }),
        signal: controller.signal
      });
      if (!response.ok) {
        let detail = "";
        try { detail = (await response.json()).detail || ""; } catch (_) {}
        if (response.status === 401) throw new Error("访问令牌不正确");
        throw new Error(detail || `请求失败（HTTP ${response.status}）`);
      }
      await consumeStream(response);
      streamingMessage.streaming = false;
      if (!streamingMessage.content) streamingMessage.content = "本次没有生成回答，请重试。";
    } catch (error) {
      if (error.name === "AbortError") {
        streamingMessage.content = streamingMessage.content || "已停止生成。";
      } else {
        streamingMessage.content = error.message || "AI 服务暂时不可用";
        streamingMessage.error = true;
      }
      streamingMessage.streaming = false;
    } finally {
      controller = null;
      streamingMessage = null;
      setStreaming(false);
      persistHistory();
      renderMessages();
      elements.input.focus();
    }
  }

  function updateComposer() {
    elements.charCount.textContent = `${elements.input.value.length} / 4000`;
    elements.input.style.height = "auto";
    elements.input.style.height = `${Math.min(elements.input.scrollHeight, 132)}px`;
  }

  elements.launch.addEventListener("click", openDrawer);
  elements.close.addEventListener("click", closeDrawer);
  elements.scrim.addEventListener("click", closeDrawer);
  elements.settingsButton.addEventListener("click", () => toggleSettings());
  elements.settingsClose.addEventListener("click", () => toggleSettings(false));
  elements.save.addEventListener("click", saveConfig);
  elements.test.addEventListener("click", () => {
    try {
      config.backendUrl = normalizeBackendUrl(elements.backendUrl.value);
      checkHealth(true);
    } catch (error) {
      elements.settingsStatus.textContent = error.message;
    }
  });
  elements.tokenToggle.addEventListener("click", () => {
    const reveal = elements.accessToken.type === "password";
    elements.accessToken.type = reveal ? "text" : "password";
    elements.tokenToggle.setAttribute("aria-label", reveal ? "隐藏访问令牌" : "显示访问令牌");
    elements.tokenToggle.title = reveal ? "隐藏访问令牌" : "显示访问令牌";
    elements.tokenToggle.innerHTML = `<i data-lucide="${reveal ? "eye-off" : "eye"}"></i>`;
    refreshIcons(elements.tokenToggle);
  });
  elements.clear.addEventListener("click", () => {
    if (controller) controller.abort();
    history = [];
    writeStorage("history", history);
    renderMessages();
  });
  elements.send.addEventListener("click", sendMessage);
  elements.input.addEventListener("input", updateComposer);
  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });
  document.querySelectorAll("[data-ai-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.aiMode));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("ai-open")) {
      if (!elements.settings.hidden) toggleSettings(false);
      else closeDrawer();
    }
  });

  elements.backendUrl.value = config.backendUrl;
  elements.accessToken.value = config.accessToken;
  setMode(mode);
  renderMessages();
  updateComposer();
  refreshIcons();
  if (config.backendUrl) checkHealth(false);
})();
