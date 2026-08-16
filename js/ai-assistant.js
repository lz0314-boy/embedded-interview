(function () {
  "use strict";

  const STORAGE_PREFIX = "ei_ai_v1_";
  const MAX_STORED_MESSAGES = 30;
  const MAX_USAGE_RECORDS = 100;
  const MAX_SESSIONS = 20;
  const MODES = {
    answer: { label: "答疑模式", placeholder: "输入简历、项目或嵌入式问题" },
    mock: { label: "模拟面试", placeholder: "输入岗位方向，开始一轮模拟面试" },
    review: { label: "答案点评", placeholder: "粘贴你的回答，让 AI 帮你改进" }
  };

  const elements = {
    drawer: document.querySelector("#aiDrawer"),
    resizeHandle: document.querySelector("#aiResizeHandle"),
    scrim: document.querySelector("#aiScrim"),
    launch: document.querySelector("#aiLaunchBtn"),
    close: document.querySelector("#aiCloseBtn"),
    newSession: document.querySelector("#aiNewSessionBtn"),
    settingsButton: document.querySelector("#aiSettingsBtn"),
    usageButton: document.querySelector("#aiUsageBtn"),
    sessionsButton: document.querySelector("#aiSessionsBtn"),
    settingsClose: document.querySelector("#aiSettingsCloseBtn"),
    settings: document.querySelector("#aiSettings"),
    usageClose: document.querySelector("#aiUsageCloseBtn"),
    usage: document.querySelector("#aiUsage"),
    usageLast: document.querySelector("#aiUsageLast"),
    usageToday: document.querySelector("#aiUsageToday"),
    usageTotal: document.querySelector("#aiUsageTotal"),
    usageStatus: document.querySelector("#aiUsageStatus"),
    usageList: document.querySelector("#aiUsageList"),
    usageClear: document.querySelector("#aiUsageClearBtn"),
    sessions: document.querySelector("#aiSessions"),
    sessionsClose: document.querySelector("#aiSessionsCloseBtn"),
    sessionsNew: document.querySelector("#aiSessionsNewBtn"),
    sessionList: document.querySelector("#aiSessionList"),
    backendUrl: document.querySelector("#aiBackendUrl"),
    providerBaseUrl: document.querySelector("#aiProviderBaseUrl"),
    providerModel: document.querySelector("#aiProviderModel"),
    providerMode: document.querySelector("#aiProviderMode"),
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
  const defaultConfig = {
    backendUrl: defaultBackendUrl,
    accessToken: "",
    providerBaseUrl: "",
    providerModel: "gpt-5-mini",
    providerApiMode: "chat_completions"
  };
  const savedConfig = readStorage("config", defaultConfig);
  let config = {
    ...defaultConfig,
    ...(savedConfig && typeof savedConfig === "object" ? savedConfig : {})
  };
  const legacyHistory = readStorage("history", []);
  let sessions = normalizeSessions(readStorage("sessions", []));
  if (!sessions.length) {
    sessions = [createSession(Array.isArray(legacyHistory) ? legacyHistory : [])];
  }
  let activeSessionId = String(readStorage("activeSessionId", "") || "");
  if (!sessions.some((session) => session.id === activeSessionId)) {
    activeSessionId = sessions[0].id;
  }
  let history = [...sessions.find((session) => session.id === activeSessionId).messages];
  writeStorage("sessions", sessions);
  writeStorage("activeSessionId", activeSessionId);
  let usageRecords = readStorage("usage", []);
  if (!Array.isArray(usageRecords)) usageRecords = [];
  usageRecords = usageRecords.filter((record) => record && typeof record === "object").slice(0, MAX_USAGE_RECORDS);
  let mode = readStorage("mode", "answer");
  if (!MODES[mode]) mode = "answer";
  let controller = null;
  let streamingMessage = null;
  let resizeState = null;

  const DRAWER_WIDTH_KEY = "drawerWidth";
  const DEFAULT_DRAWER_WIDTH = 440;
  const MIN_DRAWER_WIDTH = 360;
  const MAX_DRAWER_WIDTH = 960;

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

  function normalizeMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages
      .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
      .slice(-MAX_STORED_MESSAGES)
      .map((message) => ({
        id: String(message.id || crypto.randomUUID()),
        role: message.role,
        content: message.content,
        sources: Array.isArray(message.sources) ? message.sources : undefined,
        error: message.error === true || undefined,
        usage: message.usage && typeof message.usage === "object" ? message.usage : undefined
      }));
  }

  function deriveSessionTitle(messages) {
    const firstQuestion = messages.find((message) => message.role === "user" && message.content.trim());
    if (!firstQuestion) return "新会话";
    const title = firstQuestion.content.replace(/\s+/g, " ").trim();
    return title.length > 26 ? `${title.slice(0, 26)}…` : title;
  }

  function createSession(messages = []) {
    const normalizedMessages = normalizeMessages(messages);
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      title: deriveSessionTitle(normalizedMessages),
      createdAt: now,
      updatedAt: now,
      messages: normalizedMessages
    };
  }

  function normalizeSessions(value) {
    if (!Array.isArray(value)) return [];
    return value
      .filter((session) => session && typeof session === "object" && Array.isArray(session.messages))
      .map((session) => {
        const messages = normalizeMessages(session.messages);
        const createdAt = Number(session.createdAt) || Date.now();
        return {
          id: String(session.id || crypto.randomUUID()),
          title: deriveSessionTitle(messages),
          createdAt,
          updatedAt: Number(session.updatedAt) || createdAt,
          messages
        };
      })
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_SESSIONS);
  }

  function saveSessions() {
    sessions.sort((left, right) => right.updatedAt - left.updatedAt);
    sessions = sessions.slice(0, MAX_SESSIONS);
    writeStorage("sessions", sessions);
    writeStorage("activeSessionId", activeSessionId);
  }

  function formatCount(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function localDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知时间";
    return date.toLocaleString("zh-CN", {
      month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }

  function normalizeUsage(data) {
    const inputTokens = Math.max(0, Number(data.inputTokens) || 0);
    const outputTokens = Math.max(0, Number(data.outputTokens) || 0);
    const totalTokens = Math.max(inputTokens + outputTokens, Number(data.totalTokens) || 0);
    return {
      requestId: String(data.requestId || ""),
      model: String(data.model || config.providerModel || "未知模型"),
      inputTokens,
      outputTokens,
      totalTokens,
      cachedInputTokens: Math.max(0, Number(data.cachedInputTokens) || 0),
      exact: data.exact === true,
      source: data.source === "provider" ? "provider" : "estimated",
      incomplete: data.incomplete === true
    };
  }

  function usageLine(usage) {
    const quality = usage.exact ? "精确" : "估算";
    return `本轮 ${formatCount(usage.totalTokens)} tokens · 输入 ${formatCount(usage.inputTokens)} / 输出 ${formatCount(usage.outputTokens)} · ${quality}`;
  }

  function recordUsage(data) {
    const usage = normalizeUsage(data);
    const record = {
      ...usage,
      requestId: usage.requestId || crypto.randomUUID(),
      timestamp: Number(data.timestamp) || Date.now(),
      mode: mode,
      sessionId: activeSessionId
    };
    const existingIndex = usageRecords.findIndex((item) => item.requestId && item.requestId === record.requestId);
    if (existingIndex >= 0) usageRecords.splice(existingIndex, 1);
    usageRecords.unshift(record);
    usageRecords = usageRecords.slice(0, MAX_USAGE_RECORDS);
    writeStorage("usage", usageRecords);
    renderUsage();
    return record;
  }

  function renderUsage() {
    const today = localDateKey(Date.now());
    const todayRecords = usageRecords.filter((record) => localDateKey(record.timestamp) === today);
    const total = usageRecords.reduce((sum, record) => sum + (Number(record.totalTokens) || 0), 0);
    const todayTotal = todayRecords.reduce((sum, record) => sum + (Number(record.totalTokens) || 0), 0);
    elements.usageLast.textContent = usageRecords[0] ? formatCount(usageRecords[0].totalTokens) : "--";
    elements.usageToday.textContent = formatCount(todayTotal);
    elements.usageTotal.textContent = formatCount(total);
    if (!usageRecords.length) {
      elements.usageStatus.textContent = "暂无调用记录";
      elements.usageList.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "ai-usage-empty";
      empty.textContent = "发送一次问题后，这里会记录 token 用量";
      elements.usageList.appendChild(empty);
      return;
    }
    const exactCount = usageRecords.filter((record) => record.exact).length;
    const estimatedCount = usageRecords.length - exactCount;
    elements.usageStatus.textContent = `${usageRecords.length} 次调用 · 精确 ${exactCount} · 估算 ${estimatedCount}`;
    elements.usageList.replaceChildren();
    usageRecords.slice(0, 20).forEach((record) => {
      const entry = document.createElement("div");
      entry.className = "ai-usage-entry";
      const head = document.createElement("div");
      head.className = "ai-usage-entry-head";
      const model = document.createElement("strong");
      model.textContent = `${record.model || "未知模型"} · ${record.mode === "mock" ? "模拟" : record.mode === "review" ? "点评" : "答疑"}`;
      const time = document.createElement("span");
      time.textContent = formatDateTime(record.timestamp);
      head.append(model, time);
      const detail = document.createElement("div");
      detail.className = "ai-usage-entry-detail";
      const totalCopy = document.createElement("span");
      totalCopy.textContent = `合计 ${formatCount(record.totalTokens)}`;
      const inputCopy = document.createElement("span");
      inputCopy.textContent = `输入 ${formatCount(record.inputTokens)}`;
      const outputCopy = document.createElement("span");
      outputCopy.textContent = `输出 ${formatCount(record.outputTokens)}`;
      const quality = document.createElement("span");
      quality.className = record.exact ? "is-exact" : "is-estimated";
      quality.textContent = record.exact ? "服务商精确值" : "本地估算值";
      detail.append(totalCopy, inputCopy, outputCopy, quality);
      entry.append(head, detail);
      elements.usageList.appendChild(entry);
    });
  }

  function clampDrawerWidth(value) {
    const viewportLimit = Math.max(MIN_DRAWER_WIDTH, Math.floor(window.innerWidth * 0.85));
    return Math.round(Math.min(MAX_DRAWER_WIDTH, viewportLimit, Math.max(MIN_DRAWER_WIDTH, value)));
  }

  function applyDrawerWidth(value, persist = false) {
    const width = clampDrawerWidth(Number(value) || DEFAULT_DRAWER_WIDTH);
    elements.drawer.style.setProperty("--ai-drawer-width", `${width}px`);
    if (persist) writeStorage(DRAWER_WIDTH_KEY, width);
  }

  function startDrawerResize(event) {
    if (window.innerWidth <= 820) return;
    event.preventDefault();
    resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: elements.drawer.getBoundingClientRect().width
    };
    elements.resizeHandle.setPointerCapture?.(event.pointerId);
    document.body.classList.add("ai-resizing");
  }

  function moveDrawerResize(event) {
    if (!resizeState || event.pointerId !== resizeState.pointerId) return;
    applyDrawerWidth(resizeState.startWidth - (event.clientX - resizeState.startX));
  }

  function finishDrawerResize(event) {
    if (!resizeState || (event && event.pointerId !== resizeState.pointerId)) return;
    const width = elements.drawer.getBoundingClientRect().width;
    applyDrawerWidth(width, true);
    resizeState = null;
    document.body.classList.remove("ai-resizing");
  }

  function refreshIcons(root = document) {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ root, attrs: { "aria-hidden": "true" } });
    }
  }

  function focusInsideDrawer(element) {
    elements.drawer.scrollTop = 0;
    try {
      element.focus({ preventScroll: true });
    } catch (_) {
      element.focus();
    }
    window.requestAnimationFrame(() => {
      elements.drawer.scrollTop = 0;
    });
  }

  function setConnection(status, text) {
    elements.connectionText.textContent = text;
    elements.statusDot.dataset.status = status;
  }

  function openDrawer() {
    document.body.classList.add("ai-open");
    elements.drawer.setAttribute("aria-hidden", "false");
    elements.drawer.scrollTop = 0;
    window.setTimeout(() => focusInsideDrawer(elements.input), 180);
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
    elements.settingsButton.classList.toggle("active", shouldOpen);
    elements.settingsButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) {
      elements.usage.hidden = true;
      elements.usageButton.classList.remove("active");
      elements.usageButton.setAttribute("aria-expanded", "false");
      elements.sessions.hidden = true;
      elements.sessionsButton.classList.remove("active");
      elements.sessionsButton.setAttribute("aria-expanded", "false");
      elements.backendUrl.value = config.backendUrl;
      elements.providerBaseUrl.value = config.providerBaseUrl;
      elements.providerModel.value = config.providerModel;
      elements.providerMode.value = config.providerApiMode;
      elements.accessToken.value = config.accessToken;
      elements.settingsStatus.textContent = "";
      window.setTimeout(() => focusInsideDrawer(elements.backendUrl), 50);
    }
  }

  function toggleUsage(force) {
    const shouldOpen = typeof force === "boolean" ? force : elements.usage.hidden;
    elements.usage.hidden = !shouldOpen;
    elements.usageButton.classList.toggle("active", shouldOpen);
    elements.usageButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) {
      elements.settings.hidden = true;
      elements.settingsButton.classList.remove("active");
      elements.settingsButton.setAttribute("aria-expanded", "false");
      elements.sessions.hidden = true;
      elements.sessionsButton.classList.remove("active");
      elements.sessionsButton.setAttribute("aria-expanded", "false");
      renderUsage();
    }
  }

  function toggleSessions(force) {
    const shouldOpen = typeof force === "boolean" ? force : elements.sessions.hidden;
    elements.sessions.hidden = !shouldOpen;
    elements.sessionsButton.classList.toggle("active", shouldOpen);
    elements.sessionsButton.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) {
      elements.settings.hidden = true;
      elements.settingsButton.classList.remove("active");
      elements.settingsButton.setAttribute("aria-expanded", "false");
      elements.usage.hidden = true;
      elements.usageButton.classList.remove("active");
      elements.usageButton.setAttribute("aria-expanded", "false");
      renderSessions();
    }
  }

  function renderSessions() {
    elements.sessionList.replaceChildren();
    sessions
      .slice()
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .forEach((session) => {
        const row = document.createElement("div");
        row.className = `ai-session-row${session.id === activeSessionId ? " active" : ""}`;
        const main = document.createElement("button");
        main.type = "button";
        main.className = "ai-session-main";
        const title = document.createElement("strong");
        title.textContent = session.title || "新会话";
        const meta = document.createElement("span");
        meta.textContent = `${session.messages.length} 条消息 · ${formatDateTime(session.updatedAt)}`;
        main.append(title, meta);
        main.addEventListener("click", () => selectSession(session.id));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "icon-btn ai-session-delete";
        remove.setAttribute("aria-label", `删除会话：${session.title || "新会话"}`);
        remove.title = "删除会话";
        remove.innerHTML = '<i data-lucide="trash-2"></i>';
        remove.addEventListener("click", () => deleteSession(session.id));
        row.append(main, remove);
        elements.sessionList.appendChild(row);
      });
    refreshIcons(elements.sessionList);
  }

  function startNewSession() {
    if (controller) return;
    persistHistory();
    if (!history.length) {
      elements.input.value = "";
      updateComposer();
      toggleSettings(false);
      toggleUsage(false);
      toggleSessions(false);
      focusInsideDrawer(elements.input);
      return;
    }
    const session = createSession();
    sessions.unshift(session);
    activeSessionId = session.id;
    history = [];
    elements.input.value = "";
    saveSessions();
    toggleSettings(false);
    toggleUsage(false);
    toggleSessions(false);
    renderMessages();
    renderSessions();
    updateModeHint();
    updateComposer();
    focusInsideDrawer(elements.input);
  }

  function selectSession(sessionId) {
    if (controller || sessionId === activeSessionId) {
      if (sessionId === activeSessionId) toggleSessions(false);
      return;
    }
    persistHistory();
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) return;
    activeSessionId = target.id;
    target.updatedAt = Date.now();
    history = [...target.messages];
    elements.input.value = "";
    saveSessions();
    toggleSessions(false);
    renderMessages();
    renderSessions();
    updateModeHint();
    updateComposer();
    focusInsideDrawer(elements.input);
  }

  function deleteSession(sessionId) {
    if (controller) return;
    const target = sessions.find((session) => session.id === sessionId);
    if (!target || !window.confirm(`确定删除会话“${target.title || "新会话"}”吗？`)) return;
    persistHistory();
    sessions = sessions.filter((session) => session.id !== sessionId);
    if (!sessions.length) sessions = [createSession()];
    if (activeSessionId === sessionId) {
      activeSessionId = sessions[0].id;
      history = [...sessions[0].messages];
      elements.input.value = "";
      renderMessages();
      updateModeHint();
      updateComposer();
    }
    saveSessions();
    renderSessions();
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

  function isLocalBackend(urlValue = config.backendUrl) {
    try {
      const hostname = new URL(urlValue).hostname;
      return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
    } catch (_) {
      return false;
    }
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

  function normalizeProviderBaseUrl(value) {
    const trimmed = String(value || "").trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    let url;
    try {
      url = new URL(trimmed);
    } catch (_) {
      throw new Error("API 请求地址格式不正确");
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("API 请求地址必须使用 HTTP 或 HTTPS");
    }
    return url.toString().replace(/\/$/, "");
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
      const backendUrl = normalizeBackendUrl(elements.backendUrl.value);
      const localMode = isLocalBackend(backendUrl);
      config = {
        backendUrl,
        accessToken: localMode && !elements.accessToken.value.trim()
          ? ""
          : normalizeAccessToken(elements.accessToken.value),
        providerBaseUrl: normalizeProviderBaseUrl(elements.providerBaseUrl.value),
        providerModel: elements.providerModel.value.trim(),
        providerApiMode: elements.providerMode.value
      };
      if (!config.providerModel) throw new Error("请填写中转服务支持的模型名");
      writeStorage("config", config);
      elements.settingsStatus.textContent = localMode ? "已保存 · 本地模式无需访问令牌" : "已保存";
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
    updateModeHint();
    elements.input.placeholder = MODES[mode].placeholder;
  }

  function updateModeHint() {
    const session = sessions.find((item) => item.id === activeSessionId);
    elements.modeHint.textContent = `${MODES[mode].label} · ${session?.title || "新会话"}`;
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
      label.textContent = message.role === "assistant" ? "Lzzz AI" : "你";
      const content = document.createElement("div");
      content.className = "ai-message-content";
      appendContent(content, message.content || (message.streaming ? "正在思考…" : ""));
      article.append(label, content);
      if (message.role === "assistant" && message.usage) {
        const usage = document.createElement("div");
        usage.className = "ai-message-usage";
        usage.textContent = usageLine(message.usage);
        article.appendChild(usage);
      }
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
      .map(({ id, role, content, sources, error, usage }) => ({ id, role, content, sources, error, usage }));
    let session = sessions.find((item) => item.id === activeSessionId);
    if (!session) {
      session = createSession();
      session.id = activeSessionId || session.id;
      activeSessionId = session.id;
      sessions.push(session);
    }
    history = completed;
    session.messages = [...completed];
    session.title = deriveSessionTitle(completed);
    session.updatedAt = Date.now();
    updateModeHint();
    writeStorage("history", completed);
    saveSessions();
    if (!elements.sessions.hidden) renderSessions();
  }

  function setStreaming(active) {
    elements.send.classList.toggle("is-stop", active);
    elements.send.setAttribute("aria-label", active ? "停止生成" : "发送问题");
    elements.send.title = active ? "停止生成" : "发送问题";
    elements.send.innerHTML = `<i data-lucide="${active ? "square" : "send"}"></i>`;
    elements.input.disabled = active;
    elements.newSession.disabled = active;
    elements.sessionsButton.disabled = active;
    elements.sessionsNew.disabled = active;
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
        if (parsed.event === "meta") {
          streamingMessage.requestId = parsed.data.requestId || streamingMessage.requestId;
          streamingMessage.model = parsed.data.model || streamingMessage.model;
        } else if (parsed.event === "delta") {
          streamingMessage.content += parsed.data.text || "";
          streamingMessage.streaming = false;
          updateStreamingMessage();
        } else if (parsed.event === "sources") {
          streamingMessage.sources = parsed.data.items || [];
        } else if (parsed.event === "usage") {
          streamingMessage.usage = recordUsage({
            ...parsed.data,
            requestId: parsed.data.requestId || streamingMessage.requestId,
            model: parsed.data.model || streamingMessage.model
          });
        } else if (parsed.event === "error") {
          throw new Error(parsed.data.message || "AI 服务返回错误");
        }
      }
      if (done) {
        const finalBlock = parseSseBlock(buffer);
        if (finalBlock && streamingMessage) {
          if (finalBlock.event === "meta") {
            streamingMessage.requestId = finalBlock.data.requestId || streamingMessage.requestId;
            streamingMessage.model = finalBlock.data.model || streamingMessage.model;
          } else if (finalBlock.event === "delta") {
            streamingMessage.content += finalBlock.data.text || "";
          } else if (finalBlock.event === "sources") {
            streamingMessage.sources = finalBlock.data.items || [];
          } else if (finalBlock.event === "usage") {
            streamingMessage.usage = recordUsage({
              ...finalBlock.data,
              requestId: finalBlock.data.requestId || streamingMessage.requestId,
              model: finalBlock.data.model || streamingMessage.model
            });
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
    if (!config.backendUrl || (!config.accessToken && !isLocalBackend())) {
      toggleSettings(true);
      elements.settingsStatus.textContent = isLocalBackend()
        ? "本地后端未配置"
        : "请先完成后端地址和访问令牌设置";
      return;
    }
    if (config.accessToken) {
      try {
        config.accessToken = normalizeAccessToken(config.accessToken);
      } catch (error) {
        toggleSettings(true);
        elements.settingsStatus.textContent = error.message;
        return;
      }
    }

    const priorHistory = history
      .filter((item) => !item.error && !item.streaming)
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content }));
    toggleSessions(false);
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
      const headers = {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      };
      if (config.accessToken) headers["X-Assistant-Token"] = config.accessToken;
      const response = await fetch(`${config.backendUrl}/v1/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          history: priorHistory,
          mode,
          provider_base_url: config.providerBaseUrl || null,
          provider_model: config.providerModel || null,
          provider_api_mode: config.providerApiMode
        }),
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
      focusInsideDrawer(elements.input);
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
  elements.usageButton.addEventListener("click", () => toggleUsage());
  elements.usageClose.addEventListener("click", () => toggleUsage(false));
  elements.sessionsButton.addEventListener("click", () => toggleSessions());
  elements.sessionsClose.addEventListener("click", () => toggleSessions(false));
  elements.newSession.addEventListener("click", startNewSession);
  elements.sessionsNew.addEventListener("click", startNewSession);
  elements.usageClear.addEventListener("click", () => {
    if (!usageRecords.length) return;
    if (!window.confirm("确定清空本机保存的 token 用量记录吗？")) return;
    usageRecords = [];
    writeStorage("usage", usageRecords);
    sessions = sessions.map((session) => {
      const messages = session.messages.map((message) => {
        const { usage: _usage, ...rest } = message;
        return rest;
      });
      return { ...session, messages };
    });
    const active = sessions.find((session) => session.id === activeSessionId);
    history = active ? [...active.messages] : [];
    writeStorage("history", history);
    saveSessions();
    renderMessages();
    renderUsage();
  });
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
  elements.send.addEventListener("click", sendMessage);
  elements.resizeHandle.addEventListener("pointerdown", startDrawerResize);
  elements.resizeHandle.addEventListener("pointermove", moveDrawerResize);
  elements.resizeHandle.addEventListener("pointerup", finishDrawerResize);
  elements.resizeHandle.addEventListener("pointercancel", finishDrawerResize);
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
      else if (!elements.usage.hidden) toggleUsage(false);
      else if (!elements.sessions.hidden) toggleSessions(false);
      else closeDrawer();
    }
  });

  elements.backendUrl.value = config.backendUrl;
  elements.providerBaseUrl.value = config.providerBaseUrl;
  elements.providerModel.value = config.providerModel;
  elements.providerMode.value = config.providerApiMode;
  applyDrawerWidth(readStorage(DRAWER_WIDTH_KEY, DEFAULT_DRAWER_WIDTH));
  elements.accessToken.value = config.accessToken;
  setMode(mode);
  renderMessages();
  renderUsage();
  renderSessions();
  updateComposer();
  refreshIcons();
  if (config.backendUrl) checkHealth(false);
})();
