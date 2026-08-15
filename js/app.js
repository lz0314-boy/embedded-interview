(function () {
  "use strict";

  const RESUME_CATEGORY_IDS = new Set([
    "resume-core", "internships", "watch-project", "can-blackbox", "debug-methods"
  ]);

  const CATEGORY_ICONS = {
    "resume-core": "user-round",
    internships: "briefcase-business",
    "watch-project": "watch",
    "can-blackbox": "radio-tower",
    "debug-methods": "bug",
    "c-lang": "braces",
    "os-rtos": "cpu",
    linux: "terminal",
    hardware: "microchip",
    protocols: "cable",
    arm: "binary",
    architecture: "blocks",
    uds: "scan-line",
    autosar: "network",
    interviews: "messages-square",
    coding: "square-code"
  };

  const CATEGORY_DESCRIPTIONS = {
    "c-lang": "对象生命周期、指针、内存布局、对齐与嵌入式 C 高频陷阱。",
    "os-rtos": "任务调度、IPC、内存管理、FreeRTOS 与 RT-Thread 内核机制。",
    linux: "启动、驱动框架、系统调用、进程线程、I/O 多路复用与调试命令。",
    hardware: "GPIO、中断、DMA、ADC、定时器、看门狗与硬件可靠性。",
    protocols: "CAN/LIN、UART/SPI/I2C、TCP/IP、BLE 与 IoT 协议。",
    arm: "Cortex-M/A、异常、Cache/MMU/MPU、内存屏障与调用约定。",
    architecture: "分层、模块边界、依赖倒置、状态机和可靠性设计。",
    uds: "UDS 会话、安全访问、DTC、刷写和诊断时序。",
    autosar: "Classic AUTOSAR 分层、RTE、DCM/DEM 与通信栈。",
    interviews: "公司真题、项目表达、稳定性和现场问题处理。",
    coding: "嵌入式常见手写代码、数据结构和边界处理。"
  };

  const el = (selector, root = document) => root.querySelector(selector);
  const els = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`ei_v2_${key}`);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`ei_v2_${key}`, JSON.stringify(value));
      } catch (_) {}
    }
  };

  function mergeCategories(source) {
    const map = new Map();
    source.forEach((category) => {
      if (!map.has(category.id)) {
        map.set(category.id, {
          ...category,
          desc: category.desc || CATEGORY_DESCRIPTIONS[category.id] || "",
          questions: []
        });
      }
      const target = map.get(category.id);
      if (category.desc) target.desc = category.desc;
      if (category.track) target.track = category.track;
      if (category.icon) target.icon = category.icon;
      target.questions.push(...(category.questions || []));
    });
    return Array.from(map.values());
  }

  const categories = mergeCategories(typeof EMBEDDED_DATA === "undefined" ? [] : EMBEDDED_DATA);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const questions = [];
  const questionMap = new Map();

  categories.forEach((category) => {
    category.questions.forEach((question, index) => {
      const normalized = {
        priority: question.priority || ((question.tags || []).some((tag) => /必考|必问|高频/.test(tag)) ? "must" : "normal"),
        difficulty: question.difficulty || ((question.tags || []).some((tag) => /进阶|内核|高级/.test(tag)) ? "advanced" : "base"),
        tags: [],
        ...question,
        categoryId: category.id,
        categoryName: category.name,
        categoryIndex: index
      };
      questions.push(normalized);
      questionMap.set(normalized.id, normalized);
    });
  });

  const resumeCategories = categories.filter((category) => RESUME_CATEGORY_IDS.has(category.id));
  const foundationCategories = categories.filter((category) => !RESUME_CATEGORY_IDS.has(category.id));

  let progress = storage.get("progress", {});
  let bookmarks = new Set(storage.get("bookmarks", []));
  let notes = storage.get("notes", {});
  let activity = storage.get("activity", {});

  try {
    const legacy = JSON.parse(localStorage.getItem("embed_reviewed") || "[]");
    if (Array.isArray(legacy) && Object.keys(progress).length === 0) {
      legacy.forEach((id) => { if (questionMap.has(id)) progress[id] = "mastered"; });
      storage.set("progress", progress);
    }
  } catch (_) {}

  const state = {
    route: "dashboard",
    categoryId: null,
    questionId: null,
    answerTab: "brief",
    search: "",
    statusFilter: "all",
    priorityFilter: "all",
    flashScope: "resume",
    flashDeck: [],
    flashIndex: 0,
    flashRevealed: false,
    flashStats: { again: 0, unsure: 0, know: 0 },
    mock: null,
    mockTimer: null
  };

  const main = el("#mainContent");
  const searchInput = el("#searchInput");
  const searchBox = el("#searchBox");
  const mockDialog = el("#interviewDialog");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function stripHtml(value) {
    const holder = document.createElement("div");
    holder.innerHTML = value || "";
    return (holder.textContent || "").replace(/\s+/g, " ").trim();
  }

  function firstAnswerIdea(question) {
    if (question.brief) return question.brief;
    const holder = document.createElement("div");
    holder.innerHTML = question.a || "";
    const first = holder.querySelector("p, li, td")?.textContent || holder.textContent || "";
    const clean = first.replace(/\s+/g, " ").trim();
    return clean.length > 220 ? `${clean.slice(0, 218)}…` : clean;
  }

  function icon(name, className = "") {
    return `<i data-lucide="${escapeHtml(name)}"${className ? ` class="${className}"` : ""}></i>`;
  }

  function categoryIcon(category) {
    const value = category.icon;
    if (value && /^[a-z0-9-]+$/.test(value)) return value;
    return CATEGORY_ICONS[category.id] || "folder";
  }

  function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }

  function getStatus(id) {
    return progress[id] || "new";
  }

  function statusLabel(status) {
    return { new: "未复习", reviewing: "还模糊", mastered: "已掌握" }[status] || "未复习";
  }

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function recordActivity(id) {
    const key = todayKey();
    const items = new Set(activity[key] || []);
    items.add(id);
    activity[key] = Array.from(items);
    storage.set("activity", activity);
  }

  function setStatus(id, status, notify = true) {
    if (!questionMap.has(id)) return;
    progress[id] = status;
    recordActivity(id);
    storage.set("progress", progress);
    updateSidebarStats();
    if (notify) toast(`已标记为「${statusLabel(status)}」`);
  }

  function categoryStats(category) {
    const total = category.questions.length;
    const mastered = category.questions.filter((question) => getStatus(question.id) === "mastered").length;
    const reviewing = category.questions.filter((question) => getStatus(question.id) === "reviewing").length;
    const percent = total ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, reviewing, percent };
  }

  function allStats() {
    const mastered = questions.filter((question) => getStatus(question.id) === "mastered").length;
    const reviewing = questions.filter((question) => getStatus(question.id) === "reviewing").length;
    const percent = questions.length ? Math.round((mastered / questions.length) * 100) : 0;
    return { total: questions.length, mastered, reviewing, percent };
  }

  function updateSidebarStats() {
    const stats = allStats();
    el("#sidebarProgressText").textContent = `${stats.percent}%`;
    el("#sidebarProgressBar").style.width = `${stats.percent}%`;
    el("#sidebarMastered").textContent = `${stats.mastered} 已掌握`;
    el("#sidebarTotal").textContent = `${stats.total} 题`;
  }

  function renderSidebar() {
    const renderCategory = (category) => {
      const stats = categoryStats(category);
      return `<button class="category-item" data-category="${escapeHtml(category.id)}">
        ${icon(categoryIcon(category))}
        <span>${escapeHtml(category.name)}</span>
        <span class="category-count">${stats.mastered}/${stats.total}</span>
      </button>`;
    };
    el("#resumeNav").innerHTML = resumeCategories.map(renderCategory).join("");
    el("#foundationNav").innerHTML = foundationCategories.map(renderCategory).join("");
    updateSidebarStats();
  }

  function updateActiveNav() {
    els(".nav-item[data-route], .category-item").forEach((button) => button.classList.remove("active"));
    if (state.categoryId) {
      el(`[data-category="${CSS.escape(state.categoryId)}"]`)?.classList.add("active");
    } else if (!state.search) {
      el(`.nav-item[data-route="${CSS.escape(state.route)}"]`)?.classList.add("active");
    }
  }

  function routeHash(route, id) {
    if (route === "category") return `#category/${encodeURIComponent(id)}`;
    if (route === "question") return `#question/${encodeURIComponent(id)}`;
    return `#${route}`;
  }

  function navigate(route, id = null) {
    state.search = "";
    searchInput.value = "";
    searchBox.classList.remove("has-value");
    document.body.classList.remove("sidebar-open");
    const next = routeHash(route, id);
    if (location.hash === next) {
      applyRoute(route, id);
    } else {
      location.hash = next;
    }
  }

  function applyRoute(route, id = null) {
    stopMockTimer();
    state.route = route;
    state.categoryId = route === "category" ? id : null;
    state.questionId = route === "question" ? id : null;
    state.answerTab = "brief";
    window.scrollTo({ top: 0, behavior: "auto" });
    render();
  }

  function readHash() {
    const value = location.hash.replace(/^#/, "") || "dashboard";
    const [route, encodedId] = value.split("/");
    const id = encodedId ? decodeURIComponent(encodedId) : null;
    if (route === "category" && categoryMap.has(id)) return applyRoute(route, id);
    if (route === "question" && questionMap.has(id)) return applyRoute(route, id);
    if (["dashboard", "library", "flashcard", "mock", "bookmarks"].includes(route)) return applyRoute(route);
    applyRoute("dashboard");
  }

  function zhDate() {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long", day: "numeric", weekday: "long"
    }).format(new Date());
  }

  function autumnCountdown() {
    const now = new Date();
    let target = new Date(now.getFullYear(), 8, 1);
    if (now > target) target = new Date(now.getFullYear() + 1, 8, 1);
    return Math.max(0, Math.ceil((target - now) / 86400000));
  }

  function pageHeading(eyebrow, title, description, aside = "") {
    return `<div class="page-heading">
      <div><span class="eyebrow">${escapeHtml(eyebrow)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
      ${aside ? `<span class="date-copy">${escapeHtml(aside)}</span>` : ""}
    </div>`;
  }

  function questionRow(question, index, options = {}) {
    const status = getStatus(question.id);
    const priority = question.priority === "must"
      ? `<span class="question-priority">${icon("flame")} 必须掌握</span>`
      : question.priority === "should" ? `<span class="question-priority should">重点</span>` : "";
    const meta = options.showCategory
      ? `${escapeHtml(question.categoryName)} · ${statusLabel(status)}`
      : `${priority}${priority ? " · " : ""}${statusLabel(status)}`;
    return `<button class="question-row" data-question="${escapeHtml(question.id)}">
      <span class="question-row-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="question-row-copy"><strong>${escapeHtml(question.q)}</strong><span>${meta}</span></span>
      <span class="question-row-actions">
        <span class="status-dot ${status}" title="${statusLabel(status)}"></span>
        <span class="icon-btn bookmark-btn ${bookmarks.has(question.id) ? "active" : ""}" data-bookmark="${escapeHtml(question.id)}" role="button" tabindex="0" aria-label="收藏" title="收藏">${icon("bookmark")}</span>
        ${icon("chevron-right")}
      </span>
    </button>`;
  }

  function renderDashboard() {
    const stats = allStats();
    const todayCount = (activity[todayKey()] || []).length;
    const resumeQuestions = questions.filter((question) => RESUME_CATEGORY_IDS.has(question.categoryId));
    const riskItems = [
      { id: "watch-intro", title: "GD32F405 平台主线", copy: "从启动、时钟、外设、RT-Thread 到 LVGL，先把系统边界讲完整。" },
      { id: "watch-ota-rollback", title: "OTA 升级闭环", copy: "接收、校验、写入、试运行、健康确认和失败回滚必须能画出状态机。" },
      { id: "watch-resume-risk", title: "量化指标证据卡", copy: "±3 bpm、15→2、+40%、<1 mA 都要绑定基线、工具、条件和公式。" }
    ];
    const queue = [...resumeQuestions, ...questions.filter((q) => !RESUME_CATEGORY_IDS.has(q.categoryId))]
      .filter((question) => getStatus(question.id) !== "mastered")
      .sort((a, b) => priorityRank(a) - priorityRank(b))
      .slice(0, 7);

    main.innerHTML = `
      ${pageHeading("TODAY", "今天先讲透简历，再补基础", "按项目主线和掌握度安排复习。先口述，再看实现，最后沿追问链自测。", zhDate())}
      <section class="overview-band">
        <div class="overview-copy">
          <span class="eyebrow">距 9 月 1 日 ${autumnCountdown()} 天</span>
          <h2>${todayCount >= 20 ? "今日目标已完成，继续巩固薄弱题。" : `今天完成 ${Math.max(0, 20 - todayCount)} 道口述，优先讲透简历项目。`}</h2>
          <p>每道题先用 30 秒给结论；能回答“为什么、怎么验证、哪里有限制”，才算真正掌握。</p>
          <div class="overview-actions">
            <button class="primary-btn" data-route="flashcard">${icon("play")}开始闪卡</button>
            <button class="secondary-btn" data-open-mock>${icon("messages-square")}模拟面试</button>
          </div>
        </div>
        <div class="overview-metrics">
          <div class="metric-cell"><strong>${stats.total}</strong><span>题库总量</span></div>
          <div class="metric-cell"><strong>${resumeQuestions.length}</strong><span>简历专项</span></div>
          <div class="metric-cell"><strong>${todayCount}/20</strong><span>今日已复习</span></div>
          <div class="metric-cell"><strong>${stats.percent}%</strong><span>总掌握度</span></div>
        </div>
      </section>

      <section class="section">
        <div class="section-header"><div><h2>简历项目主线</h2><p>先按简历口径讲清架构，再用实现路径、测试方法和边界回答追问。</p></div></div>
        <div class="risk-strip">
          ${riskItems.map((item) => `<button class="risk-item" data-question="${item.id}"><span class="risk-level">FOCUS</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.copy)}</p></button>`).join("")}
        </div>
      </section>

      <div class="dashboard-grid section">
        <section>
          <div class="section-header"><div><h2>今日口述队列</h2><p>按照简历相关度和优先级排列。</p></div><button class="section-link" data-route="library">查看全部 ${icon("arrow-right")}</button></div>
          <div class="question-list">${queue.map((question, index) => questionRow(question, index, { showCategory: true })).join("")}</div>
        </section>
        <aside>
          <div class="section-header"><div><h2>简历准备度</h2><p>只统计“已掌握”。</p></div></div>
          <div class="roadmap">
            <h3>五条项目主线</h3>
            ${resumeCategories.map((category) => {
              const item = categoryStats(category);
              return `<div class="roadmap-row"><div class="roadmap-copy"><span>${escapeHtml(category.name)}</span><span>${item.mastered}/${item.total}</span></div><div class="mini-track"><span style="width:${item.percent}%"></span></div></div>`;
            }).join("")}
          </div>
        </aside>
      </div>

      <section class="section">
        <div class="section-header"><div><h2>两个项目，一条可靠性主线</h2><p>根据岗位方向选择先讲哪个。</p></div></div>
        <div class="project-grid">
          <button class="project-tile with-image" style="background-image:url('assets/watch-project.jpg')" data-category="watch-project">
            <span class="tile-top"><span class="tile-icon">${icon("watch")}</span><span class="tag">MCU · RTOS</span></span>
            <h3>智能健康穿戴</h3><p>传感器、PPG、LVGL、DMA、OTA 与低功耗。</p><span class="tile-meta">${categoryStats(categoryMap.get("watch-project")).mastered}/${categoryStats(categoryMap.get("watch-project")).total} 已掌握</span>
          </button>
          <button class="project-tile" data-category="can-blackbox">
            <span class="tile-top"><span class="tile-icon">${icon("radio-tower")}</span><span class="tag">Linux · CAN</span></span>
            <h3>CAN 通信黑匣子</h3><p>事件循环、异常检测、故障快照、可靠落盘与进程恢复。</p><span class="tile-meta">${categoryStats(categoryMap.get("can-blackbox")).mastered}/${categoryStats(categoryMap.get("can-blackbox")).total} 已掌握</span>
          </button>
        </div>
      </section>`;
  }

  function priorityRank(question) {
    return { must: 0, should: 1, normal: 2 }[question.priority] ?? 2;
  }

  function categoryTile(category) {
    const stats = categoryStats(category);
    return `<button class="category-tile" data-category="${escapeHtml(category.id)}">
      <span class="tile-top"><span class="tile-icon">${icon(categoryIcon(category))}</span><span class="tag">${stats.total} 题</span></span>
      <h3>${escapeHtml(category.name)}</h3><p>${escapeHtml(category.desc || "系统整理高频问题与参考回答。")}</p>
      <span class="tile-meta">掌握度 ${stats.percent}%</span>
    </button>`;
  }

  function renderLibrary() {
    main.innerHTML = `
      ${pageHeading("KNOWLEDGE BASE", "全部题库", "先围绕简历项目掌握实现与验证，再用基础题补足原理和手写能力。", `${questions.length} 道题`)}
      <section class="section">
        <div class="section-header"><div><h2>简历与项目</h2><p>口述回答、实现方案、深挖问题和验证方法。</p></div></div>
        <div class="category-grid">${resumeCategories.map(categoryTile).join("")}</div>
      </section>
      <section class="section">
        <div class="section-header"><div><h2>嵌入式基础</h2><p>C、RTOS、Linux、硬件、协议和车载知识。</p></div></div>
        <div class="category-grid">${foundationCategories.map(categoryTile).join("")}</div>
      </section>`;
  }

  function filterQuestions(items) {
    return items.filter((question) => {
      const statusOk = state.statusFilter === "all" || getStatus(question.id) === state.statusFilter;
      const priorityOk = state.priorityFilter === "all" || question.priority === state.priorityFilter;
      return statusOk && priorityOk;
    });
  }

  function renderCategory(categoryId) {
    const category = categoryMap.get(categoryId);
    if (!category) return renderLibrary();
    const stats = categoryStats(category);
    const filtered = filterQuestions([...category.questions].sort((a, b) => priorityRank(a) - priorityRank(b)));
    main.innerHTML = `
      <div class="breadcrumb"><button data-route="library">全部题库</button>${icon("chevron-right")}<span>${escapeHtml(category.name)}</span></div>
      <section class="category-summary">
        <div><span class="eyebrow">${RESUME_CATEGORY_IDS.has(category.id) ? "RESUME DEFENSE" : "FOUNDATION"}</span><h1>${escapeHtml(category.name)}</h1><p>${escapeHtml(category.desc || "")}</p></div>
        <div class="category-progress"><strong>${stats.percent}%</strong><span>掌握度</span></div>
      </section>
      <div class="filter-bar">
        <button class="filter-chip ${state.priorityFilter === "all" ? "active" : ""}" data-priority-filter="all">全部</button>
        <button class="filter-chip ${state.priorityFilter === "must" ? "active" : ""}" data-priority-filter="must">必须掌握</button>
        <button class="filter-chip ${state.priorityFilter === "should" ? "active" : ""}" data-priority-filter="should">重点</button>
        <span class="filter-spacer"></span>
        <select class="filter-select" id="statusFilter" aria-label="掌握状态">
          <option value="all" ${state.statusFilter === "all" ? "selected" : ""}>全部状态</option>
          <option value="new" ${state.statusFilter === "new" ? "selected" : ""}>未复习</option>
          <option value="reviewing" ${state.statusFilter === "reviewing" ? "selected" : ""}>还模糊</option>
          <option value="mastered" ${state.statusFilter === "mastered" ? "selected" : ""}>已掌握</option>
        </select>
        <button class="secondary-btn" data-flash-category="${escapeHtml(category.id)}">${icon("layers-3")}本类闪卡</button>
      </div>
      ${filtered.length ? `<div class="question-list library-list">${filtered.map((question, index) => questionRow(question, index)).join("")}</div>` : emptyState("filter", "没有符合条件的题目", "调整优先级或掌握状态筛选。")}`;
  }

  function answerTabs(question) {
    const tabs = [
      ["brief", question.brief ? "30 秒口述" : "回答提纲"],
      ["detail", "展开回答"]
    ];
    if (question.followups?.length) tabs.push(["followups", `继续深挖 · ${question.followups.length}`]);
    if (question.evidence || question.boundary || question.caution) tabs.push(["boundary", "证据与边界"]);
    return tabs.map(([id, label]) => `<button class="answer-tab ${state.answerTab === id ? "active" : ""}" data-answer-tab="${id}">${escapeHtml(label)}</button>`).join("");
  }

  function answerPanel(question) {
    if (state.answerTab === "brief") {
      return `<div class="answer-panel"><div class="brief-answer">${escapeHtml(firstAnswerIdea(question))}</div></div>`;
    }
    if (state.answerTab === "detail") {
      return `<div class="answer-panel"><h2>参考回答</h2>${question.a || "<p>暂无详细答案。</p>"}</div>`;
    }
    if (state.answerTab === "followups") {
      return `<div class="answer-panel"><h2>面试官可能继续问</h2><div class="followup-list">${(question.followups || []).map((item, index) => `<details class="followup-item" ${index === 0 ? "open" : ""}><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join("")}</div></div>`;
    }
    return `<div class="answer-panel"><h2>回答边界</h2>
      ${question.evidence ? `<div class="boundary-box evidence"><strong>${icon("file-check-2")}可用证据</strong><p>${escapeHtml(question.evidence)}</p></div>` : ""}
      ${question.boundary ? `<div class="boundary-box limit"><strong>${icon("triangle-alert")}能力边界</strong><p>${escapeHtml(question.boundary)}</p></div>` : ""}
      ${question.caution ? `<div class="boundary-box caution"><strong>${icon("shield-alert")}避免这样说</strong><p>${escapeHtml(question.caution)}</p></div>` : ""}
    </div>`;
  }

  function renderQuestion(questionId) {
    const question = questionMap.get(questionId);
    if (!question) return renderLibrary();
    const category = categoryMap.get(question.categoryId);
    const index = category.questions.findIndex((item) => item.id === question.id);
    const previous = index > 0 ? category.questions[index - 1] : null;
    const next = index < category.questions.length - 1 ? category.questions[index + 1] : null;
    const status = getStatus(question.id);
    main.innerHTML = `<article class="question-detail">
      <div class="breadcrumb"><button data-route="library">全部题库</button>${icon("chevron-right")}<button data-category="${escapeHtml(category.id)}">${escapeHtml(category.name)}</button>${icon("chevron-right")}<span>第 ${index + 1} 题</span></div>
      <header class="question-hero">
        <div class="tag-row">
          ${question.priority === "must" ? '<span class="tag must">必须掌握</span>' : question.priority === "should" ? '<span class="tag should">重点</span>' : ""}
          ${(question.tags || []).slice(0, 6).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <h1>${escapeHtml(question.q)}</h1>
        <div class="question-toolbar">
          <button class="status-btn ${status === "new" ? "active" : ""}" data-set-status="new" data-id="${escapeHtml(question.id)}">${icon("circle")}未复习</button>
          <button class="status-btn reviewing ${status === "reviewing" ? "active" : ""}" data-set-status="reviewing" data-id="${escapeHtml(question.id)}">${icon("circle-help")}还模糊</button>
          <button class="status-btn mastered ${status === "mastered" ? "active" : ""}" data-set-status="mastered" data-id="${escapeHtml(question.id)}">${icon("circle-check-big")}已掌握</button>
          <span class="filter-spacer"></span>
          <button class="secondary-btn bookmark-btn ${bookmarks.has(question.id) ? "active" : ""}" data-bookmark="${escapeHtml(question.id)}">${icon("bookmark")}收藏</button>
        </div>
      </header>
      <nav class="answer-tabs" aria-label="答案层级">${answerTabs(question)}</nav>
      <div id="answerPanel">${answerPanel(question)}</div>
      <section class="note-section"><label for="questionNote">我的口述提纲 / 易错点</label><textarea id="questionNote" data-note-id="${escapeHtml(question.id)}" placeholder="只记关键词和自己的案例，不要整段抄答案。">${escapeHtml(notes[question.id] || "")}</textarea><span class="note-hint">内容自动保存在当前浏览器。</span></section>
      <footer class="detail-footer">
        ${previous ? `<button class="secondary-btn" data-question="${escapeHtml(previous.id)}">${icon("arrow-left")}上一题</button>` : "<span></span>"}
        ${next ? `<button class="primary-btn" data-question="${escapeHtml(next.id)}">下一题${icon("arrow-right")}</button>` : `<button class="primary-btn" data-category="${escapeHtml(category.id)}">返回本类题库</button>`}
      </footer>
    </article>`;
  }

  function searchQuestions(query) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return questions.map((question) => {
      const followups = (question.followups || []).map((item) => `${item.q} ${item.a}`).join(" ");
      const haystack = `${question.q} ${(question.tags || []).join(" ")} ${question.categoryName} ${question.brief || ""} ${stripHtml(question.a)} ${followups}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (question.q.toLowerCase().includes(term) ? 5 : haystack.includes(term) ? 1 : -100), 0);
      return { question, score };
    }).filter((item) => item.score >= terms.length).sort((a, b) => b.score - a.score).map((item) => item.question);
  }

  function renderSearch() {
    const results = searchQuestions(state.search);
    main.innerHTML = `${pageHeading("SEARCH", `搜索“${state.search}”`, "搜索覆盖题目、标签、答案、深挖和证据边界。", `${results.length} 条结果`)}
      ${results.length ? `<div class="question-list library-list">${results.map((question, index) => questionRow(question, index, { showCategory: true })).join("")}</div>` : emptyState("search-x", "没有匹配结果", "换一个技术名词、项目模块或故障关键词。")}`;
  }

  function shuffled(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function questionsForScope(scope) {
    if (scope === "resume") return questions.filter((question) => RESUME_CATEGORY_IDS.has(question.categoryId));
    if (scope === "foundation") return questions.filter((question) => !RESUME_CATEGORY_IDS.has(question.categoryId));
    if (categoryMap.has(scope)) return categoryMap.get(scope).questions;
    return questions;
  }

  function startFlashDeck(scope = state.flashScope) {
    state.flashScope = scope;
    let candidates = questionsForScope(scope).filter((question) => getStatus(question.id) !== "mastered");
    if (!candidates.length) candidates = questionsForScope(scope);
    const must = shuffled(candidates.filter((question) => question.priority === "must"));
    const rest = shuffled(candidates.filter((question) => question.priority !== "must"));
    state.flashDeck = [...must, ...rest].slice(0, 30).map((question) => question.id);
    state.flashIndex = 0;
    state.flashRevealed = false;
    state.flashStats = { again: 0, unsure: 0, know: 0 };
  }

  function renderFlashcard() {
    if (!state.flashDeck.length) startFlashDeck();
    if (state.flashIndex >= state.flashDeck.length) {
      const stats = state.flashStats;
      main.innerHTML = `<div class="trainer-shell"><div class="mock-result">${icon("circle-check-big")}<strong>${stats.know}/${state.flashDeck.length}</strong><h1>本轮闪卡完成</h1><p>掌握 ${stats.know} · 模糊 ${stats.unsure} · 不会 ${stats.again}</p><button class="primary-btn" data-restart-flash>${icon("rotate-cw")}再来一轮</button></div></div>`;
      return;
    }
    const question = questionMap.get(state.flashDeck[state.flashIndex]);
    const percent = Math.round((state.flashIndex / state.flashDeck.length) * 100);
    main.innerHTML = `<div class="trainer-shell">
      <div class="trainer-head">
        <div><span class="eyebrow">FLASHCARD</span><strong>${escapeHtml(question.categoryName)}</strong></div>
        <div class="trainer-progress"><div class="trainer-count">${state.flashIndex + 1} / ${state.flashDeck.length}</div><div class="mini-track"><span style="width:${percent}%"></span></div></div>
        <select id="flashScope" class="filter-select" aria-label="闪卡范围">
          <option value="resume" ${state.flashScope === "resume" ? "selected" : ""}>简历与项目</option>
          <option value="foundation" ${state.flashScope === "foundation" ? "selected" : ""}>基础知识</option>
          <option value="all" ${state.flashScope === "all" ? "selected" : ""}>全部题库</option>
        </select>
      </div>
      <article class="flashcard">
        <div class="flashcard-meta"><span class="tag ${question.priority === "must" ? "must" : ""}">${question.priority === "must" ? "必须掌握" : escapeHtml(question.categoryName)}</span><button class="icon-btn bookmark-btn ${bookmarks.has(question.id) ? "active" : ""}" data-bookmark="${escapeHtml(question.id)}" aria-label="收藏" title="收藏">${icon("bookmark")}</button></div>
        <h2>${escapeHtml(question.q)}</h2>
        ${state.flashRevealed ? `<div class="flashcard-answer"><strong>口述要点</strong><p>${escapeHtml(firstAnswerIdea(question))}</p></div><div class="flashcard-actions"><button class="rate-btn again" data-flash-rate="again">1 不会</button><button class="rate-btn unsure" data-flash-rate="unsure">2 模糊</button><button class="rate-btn know" data-flash-rate="know">3 掌握</button></div>` : `<div class="flashcard-actions"><button class="primary-btn" data-reveal-flash>${icon("eye")}显示回答要点</button></div>`}
      </article>
    </div>`;
  }

  function rateFlash(value) {
    if (!state.flashDeck[state.flashIndex]) return;
    const id = state.flashDeck[state.flashIndex];
    const status = value === "know" ? "mastered" : value === "unsure" ? "reviewing" : "new";
    state.flashStats[value] += 1;
    setStatus(id, status, false);
    state.flashIndex += 1;
    state.flashRevealed = false;
    render();
  }

  function openMockSetup() {
    if (typeof mockDialog.showModal === "function") mockDialog.showModal();
  }

  function startMock(scope, count) {
    const pool = questionsForScope(scope);
    const must = shuffled(pool.filter((question) => question.priority === "must"));
    const rest = shuffled(pool.filter((question) => question.priority !== "must"));
    const selected = [...must.slice(0, Math.ceil(count * 0.65)), ...rest].slice(0, count);
    state.mock = {
      scope,
      ids: shuffled(selected.map((question) => question.id)),
      index: 0,
      revealed: false,
      scores: [],
      startedAt: Date.now(),
      questionStartedAt: Date.now(),
      done: false
    };
    if (mockDialog.open) mockDialog.close();
    navigate("mock");
  }

  function stopMockTimer() {
    if (state.mockTimer) window.clearInterval(state.mockTimer);
    state.mockTimer = null;
  }

  function startMockTimer() {
    stopMockTimer();
    state.mockTimer = window.setInterval(() => {
      const target = el("#mockTimer");
      if (!target || !state.mock) return stopMockTimer();
      const elapsed = Math.floor((Date.now() - state.mock.questionStartedAt) / 1000);
      target.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    }, 1000);
  }

  function renderMock() {
    if (!state.mock) {
      main.innerHTML = `${pageHeading("MOCK INTERVIEW", "模拟一场真实技术面", "随机抽取简历或基础题。先完整口述，再看参考答案并自评。")}
        <div class="empty-state">${icon("messages-square")}<h2>还没有开始面试</h2><p>建议先从 5 道简历题开始，控制每题 1～2 分钟。</p><button class="primary-btn" data-open-mock>${icon("settings-2")}设置并开始</button></div>`;
      return;
    }
    if (state.mock.done) {
      const total = state.mock.scores.reduce((sum, score) => sum + score, 0);
      const max = state.mock.ids.length * 2;
      main.innerHTML = `<div class="mock-shell"><div class="mock-result">${icon("badge-check")}<strong>${total}/${max}</strong><h1>模拟面试完成</h1><p>0 分表示答不出，1 分表示有结论但证据不足，2 分表示回答完整且能守住边界。</p><div class="flashcard-actions"><button class="secondary-btn" data-route="dashboard">返回复习台</button><button class="primary-btn" data-open-mock>${icon("rotate-cw")}重新设置</button></div></div></div>`;
      return;
    }
    const question = questionMap.get(state.mock.ids[state.mock.index]);
    const scoreLabels = ["答不出", "基本完整", "可以深挖"];
    main.innerHTML = `<div class="mock-shell">
      <div class="trainer-head"><div><span class="eyebrow">MOCK INTERVIEW</span><strong>第 ${state.mock.index + 1} / ${state.mock.ids.length} 题</strong></div><div class="timer-display">${icon("timer")}<span id="mockTimer">00:00</span></div><button class="secondary-btn danger-button" data-end-mock>结束</button></div>
      <section class="mock-question"><span class="tag">${escapeHtml(question.categoryName)}</span><h2>${escapeHtml(question.q)}</h2>${state.mock.revealed ? `<div class="answer-panel"><div class="brief-answer">${escapeHtml(firstAnswerIdea(question))}</div>${question.followups?.length ? `<h3>继续追问</h3><p>${escapeHtml(question.followups[0].q)}</p>` : ""}</div>` : `<p class="date-copy">请先脱离屏幕口述。结论、原因、实现、验证、边界。</p>`}</section>
      <div class="mock-controls">${state.mock.revealed ? `<div class="flashcard-actions">${scoreLabels.map((label, score) => `<button class="rate-btn ${score === 0 ? "again" : score === 1 ? "unsure" : "know"}" data-mock-score="${score}">${score} · ${label}</button>`).join("")}</div>` : `<button class="primary-btn" data-reveal-mock>${icon("eye")}查看参考要点</button>`}<button class="secondary-btn" data-question="${escapeHtml(question.id)}">打开完整答案</button></div>
    </div>`;
    startMockTimer();
  }

  function scoreMock(score) {
    if (!state.mock) return;
    const id = state.mock.ids[state.mock.index];
    state.mock.scores.push(score);
    setStatus(id, score === 2 ? "mastered" : score === 1 ? "reviewing" : "new", false);
    state.mock.index += 1;
    state.mock.revealed = false;
    state.mock.questionStartedAt = Date.now();
    if (state.mock.index >= state.mock.ids.length) state.mock.done = true;
    render();
  }

  function renderBookmarks() {
    const items = questions.filter((question) => bookmarks.has(question.id));
    main.innerHTML = `${pageHeading("BOOKMARKS", "重点收藏", "把容易忘、证据薄弱或近期岗位高频题集中复习。", `${items.length} 道题`)}
      ${items.length ? `<div class="question-list library-list">${items.map((question, index) => questionRow(question, index, { showCategory: true })).join("")}</div>` : emptyState("bookmark", "还没有收藏", "在问题列表或答案页点击收藏，集中建立自己的重点题单。")}`;
  }

  function emptyState(iconName, title, copy) {
    return `<div class="empty-state">${icon(iconName)}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></div>`;
  }

  function render() {
    updateActiveNav();
    if (state.search) renderSearch();
    else if (state.route === "dashboard") renderDashboard();
    else if (state.route === "library") renderLibrary();
    else if (state.route === "category") renderCategory(state.categoryId);
    else if (state.route === "question") renderQuestion(state.questionId);
    else if (state.route === "flashcard") renderFlashcard();
    else if (state.route === "mock") renderMock();
    else if (state.route === "bookmarks") renderBookmarks();
    else renderDashboard();
    renderIcons();
    updateActiveNav();
  }

  function toggleBookmark(id) {
    if (bookmarks.has(id)) {
      bookmarks.delete(id);
      toast("已取消收藏");
    } else {
      bookmarks.add(id);
      toast("已加入重点收藏");
    }
    storage.set("bookmarks", Array.from(bookmarks));
    render();
  }

  function toast(message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    el("#toastRegion").appendChild(item);
    window.setTimeout(() => item.remove(), 2200);
  }

  function exportProgress() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      progress,
      bookmarks: Array.from(bookmarks),
      notes,
      activity
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `embedded-interview-progress-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast("学习记录已导出");
  }

  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) return navigate(routeButton.dataset.route);

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) return navigate("category", categoryButton.dataset.category);

    const bookmarkButton = event.target.closest("[data-bookmark]");
    if (bookmarkButton) {
      event.preventDefault();
      event.stopPropagation();
      return toggleBookmark(bookmarkButton.dataset.bookmark);
    }

    const questionButton = event.target.closest("[data-question]");
    if (questionButton) return navigate("question", questionButton.dataset.question);

    const answerTab = event.target.closest("[data-answer-tab]");
    if (answerTab) {
      state.answerTab = answerTab.dataset.answerTab;
      return render();
    }

    const statusButton = event.target.closest("[data-set-status]");
    if (statusButton) {
      setStatus(statusButton.dataset.id, statusButton.dataset.setStatus);
      return render();
    }

    const priorityButton = event.target.closest("[data-priority-filter]");
    if (priorityButton) {
      state.priorityFilter = priorityButton.dataset.priorityFilter;
      return render();
    }

    const flashCategory = event.target.closest("[data-flash-category]");
    if (flashCategory) {
      startFlashDeck(flashCategory.dataset.flashCategory);
      return navigate("flashcard");
    }

    if (event.target.closest("[data-reveal-flash]")) {
      state.flashRevealed = true;
      return render();
    }
    const flashRate = event.target.closest("[data-flash-rate]");
    if (flashRate) return rateFlash(flashRate.dataset.flashRate);
    if (event.target.closest("[data-restart-flash]")) {
      startFlashDeck(state.flashScope);
      return render();
    }

    if (event.target.closest("[data-open-mock]")) return openMockSetup();
    if (event.target.closest("[data-close-dialog]")) return mockDialog.close();
    if (event.target.closest("[data-reveal-mock]")) {
      state.mock.revealed = true;
      return render();
    }
    const mockScore = event.target.closest("[data-mock-score]");
    if (mockScore) return scoreMock(Number(mockScore.dataset.mockScore));
    if (event.target.closest("[data-end-mock]")) {
      state.mock.done = true;
      return render();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "statusFilter") {
      state.statusFilter = event.target.value;
      render();
    }
    if (event.target.id === "flashScope") {
      startFlashDeck(event.target.value);
      render();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target === searchInput) {
      state.search = searchInput.value.trim();
      searchBox.classList.toggle("has-value", Boolean(state.search));
      render();
    }
    if (event.target.matches("[data-note-id]")) {
      notes[event.target.dataset.noteId] = event.target.value;
      storage.set("notes", notes);
    }
  });

  el("#searchClear").addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    searchBox.classList.remove("has-value");
    searchInput.focus();
    render();
  });

  el("#menuBtn").addEventListener("click", () => document.body.classList.add("sidebar-open"));
  el("#sidebarClose").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  el("#sidebarScrim").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  el("#exportBtn").addEventListener("click", exportProgress);
  el("#randomBtn").addEventListener("click", () => {
    const candidates = questions.filter((question) => getStatus(question.id) !== "mastered");
    const pool = candidates.length ? candidates : questions;
    navigate("question", pool[Math.floor(Math.random() * pool.length)].id);
  });
  el("#focusBtn").addEventListener("click", () => navigate("flashcard"));

  const savedTheme = storage.get("theme", "light");
  document.documentElement.dataset.theme = savedTheme;
  el("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.set("theme", next);
    toast(next === "dark" ? "已切换深色主题" : "已切换浅色主题");
  });

  el("#mockSetupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const scope = el("#mockScope").value;
    const count = Number(el('input[name="mockCount"]:checked').value);
    startMock(scope, count);
  });

  document.addEventListener("keydown", (event) => {
    const editing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (editing) return;
    if (event.key.toLowerCase() === "f") navigate("flashcard");
    if (event.key.toLowerCase() === "m") openMockSetup();
    if (event.key === "Escape") {
      document.body.classList.remove("sidebar-open");
      if (mockDialog.open) mockDialog.close();
    }
    if (state.route === "flashcard") {
      if (event.code === "Space") {
        event.preventDefault();
        state.flashRevealed = true;
        render();
      }
      if (state.flashRevealed && ["1", "2", "3"].includes(event.key)) {
        rateFlash({ "1": "again", "2": "unsure", "3": "know" }[event.key]);
      }
    }
    if (state.route === "mock" && state.mock && event.code === "Space") {
      event.preventDefault();
      state.mock.revealed = true;
      render();
    }
  });

  window.addEventListener("hashchange", readHash);
  renderSidebar();
  renderIcons();
  readHash();
})();
