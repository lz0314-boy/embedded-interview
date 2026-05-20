/**
 * 嵌入式八股文学习网站 - 核心应用逻辑
 */
(function () {
  'use strict';

  // ============ State ============
  let currentCategory = null;
  let currentQuery = '';
  let expandedCards = new Set();

  // ============ DOM refs ============
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const sidebar = $('#sidebar');
  const sidebarNav = $('#sidebarNav');
  const sidebarOverlay = $('#sidebarOverlay');
  const menuToggle = $('#menuToggle');
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  const searchHint = $('#searchHint');
  const themeToggle = $('#themeToggle');
  const contentArea = $('#contentArea');
  const backToTop = $('#backToTop');
  const expandAllBtn = $('#expandAllBtn');
  const collapseAllBtn = $('#collapseAllBtn');
  const progressText = $('#progressText');
  const progressFill = $('#progressFill');
  const totalCount = $('#totalCount');
  const reviewedCount = $('#reviewedCount');

  // ============ localStorage helpers ============
  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem('embed_' + key); return v !== null ? JSON.parse(v) : fallback; }
      catch (_) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('embed_' + key, JSON.stringify(val)); } catch (_) {}
    }
  };

  // ============ Reviewed state ============
  let reviewedSet = new Set(storage.get('reviewed', []));

  function saveReviewed() { storage.set('reviewed', [...reviewedSet]); updateProgress(); }

  function isReviewed(id) { return reviewedSet.has(id); }

  function toggleReviewed(id) {
    if (reviewedSet.has(id)) reviewedSet.delete(id);
    else reviewedSet.add(id);
    saveReviewed();
    renderSidebar();
    const card = document.querySelector(`.qa-card[data-id="${id}"]`);
    if (card) {
      const btn = card.querySelector('.btn-reviewed');
      if (btn) btn.classList.toggle('marked', reviewedSet.has(id));
    }
  }

  // ============ Theme ============
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    storage.set('theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Init theme
  const savedTheme = storage.get('theme', 'light');
  applyTheme(savedTheme);

  // ============ Merge duplicate category IDs ============
  function getMergedData() {
    if (typeof EMBEDDED_DATA === 'undefined') return [];
    const map = new Map();
    EMBEDDED_DATA.forEach(cat => {
      if (map.has(cat.id)) {
        const existing = map.get(cat.id);
        existing.questions = (existing.questions || []).concat(cat.questions || []);
      } else {
        map.set(cat.id, { ...cat, questions: [...(cat.questions || [])] });
      }
    });
    return Array.from(map.values());
  }

  // ============ All questions flat list ============
  function getBuiltInCategories() {
    return getMergedData().map(cat => ({ id: cat.id, name: cat.name, icon: cat.icon }));
  }

  function getAllQuestions() {
    const items = [];
    getMergedData().forEach(cat => {
      (cat.questions || []).forEach(q => {
        items.push({ ...q, categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, source: 'builtin' });
      });
    });
    const userItems = getUserItems();
    userItems.forEach(q => {
      const cat = getBuiltInCategories().find(c => c.id === q.categoryId);
      items.push({ ...q, categoryName: cat ? cat.name : q.categoryId, categoryIcon: cat ? cat.icon : '📝', source: 'user' });
    });
    return items;
  }

  // ============ User Items (localStorage) ============
  function getUserItems() { return storage.get('user_items', []); }
  function saveUserItems(items) { storage.set('user_items', items); }

  function addUserItem(item) {
    const items = getUserItems();
    item.id = 'user-' + Date.now();
    items.push(item);
    saveUserItems(items);
  }

  function updateUserItem(id, updates) {
    const items = getUserItems();
    const idx = items.findIndex(it => it.id === id);
    if (idx >= 0) { Object.assign(items[idx], updates); saveUserItems(items); }
  }

  function deleteUserItem(id) {
    const items = getUserItems().filter(it => it.id !== id);
    saveUserItems(items);
    reviewedSet.delete(id);
    saveReviewed();
  }

  // ============ Modal ============
  const modalOverlay = $('#modalOverlay');
  const modalTitle = $('#modalTitle');
  const formCategory = $('#formCategory');
  const formQuestion = $('#formQuestion');
  const formAnswer = $('#formAnswer');
  const formTags = $('#formTags');
  const formEditId = $('#formEditId');
  const formDeleteBtn = $('#formDeleteBtn');
  const addKnowledgeBtn = $('#addKnowledgeBtn');

  function populateCategoryDropdown() {
    const cats = getBuiltInCategories();
    formCategory.innerHTML = cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  function openAddModal(presetCatId) {
    populateCategoryDropdown();
    if (presetCatId) formCategory.value = presetCatId;
    modalTitle.textContent = '添加新知识点';
    formQuestion.value = ''; formAnswer.value = ''; formTags.value = '';
    formEditId.value = ''; formDeleteBtn.style.display = 'none';
    modalOverlay.classList.add('show');
    formQuestion.focus();
  }

  function openEditModal(id) {
    populateCategoryDropdown();
    const item = getUserItems().find(it => it.id === id);
    if (!item) return;
    modalTitle.textContent = '编辑知识点';
    formCategory.value = item.categoryId || '';
    formQuestion.value = item.q || '';
    formAnswer.value = item.a || '';
    formTags.value = (item.tags || []).join(', ');
    formEditId.value = id;
    formDeleteBtn.style.display = '';
    modalOverlay.classList.add('show');
  }

  function closeModal() { modalOverlay.classList.remove('show'); }

  function saveFromModal() {
    const q = formQuestion.value.trim();
    const a = formAnswer.value.trim();
    if (!q || !a) { alert('问题和答案不能为空'); return; }
    const data = {
      categoryId: formCategory.value,
      q, a,
      tags: formTags.value.split(',').map(t => t.trim()).filter(Boolean)
    };
    const editId = formEditId.value;
    if (editId) { updateUserItem(editId, data); } else { addUserItem(data); }
    closeModal();
    // 刷新当前视图
    renderSidebar();
    expandedCards.clear();
    renderContent(getFilteredQuestions());
  }

  function handleDeleteFromModal() {
    const id = formEditId.value;
    if (!id || !confirm('确定要删除这条知识点吗？此操作不可撤销。')) return;
    deleteUserItem(id);
    closeModal();
    renderSidebar();
    expandedCards.clear();
    renderContent(getFilteredQuestions());
  }

  // Modal event bindings
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  $('#modalClose').addEventListener('click', closeModal);
  $('#formCancelBtn').addEventListener('click', closeModal);
  $('#formSaveBtn').addEventListener('click', saveFromModal);
  formDeleteBtn.addEventListener('click', handleDeleteFromModal);
  addKnowledgeBtn.addEventListener('click', () => openAddModal(currentCategory));

  // Keyboard shortcut for modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('show')) { closeModal(); e.stopPropagation(); }
  });

  // ============ Search ============
  function searchQuestions(query) {
    const all = getAllQuestions();
    if (!query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(item =>
      item.q.toLowerCase().includes(q) ||
      item.a.toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q)) ||
      item.categoryName.toLowerCase().includes(q)
    );
  }

  function getQuestionsByCategory(catId) {
    const cat = getMergedData().find(c => c.id === catId);
    const items = [];
    if (cat) {
      (cat.questions || []).forEach(q => { items.push({ ...q, categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, source: 'builtin' }); });
    }
    const userItems = getUserItems().filter(q => q.categoryId === catId);
    userItems.forEach(q => {
      items.push({ ...q, categoryName: cat ? cat.name : catId, categoryIcon: cat ? cat.icon : '📝', source: 'user' });
    });
    return items;
  }

  function getFilteredQuestions() {
    if (currentQuery.trim()) return searchQuestions(currentQuery);
    if (currentCategory) return getQuestionsByCategory(currentCategory);
    return getAllQuestions();
  }

  // ============ Highlight text ============
  function highlightText(text, query) {
    if (!query || !query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // Simple syntax highlighting for C code
  function highlightCode(code) {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Comments
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class=cm>$1</span>')
      // Strings
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class=str>$1</span>')
      // Keywords
      .replace(/\b(volatile|const|static|extern|typedef|struct|union|enum|void|int|char|float|double|long|short|unsigned|signed|if|else|for|while|do|switch|case|break|continue|return|sizeof|NULL|true|false|define|include|pragma|inline|register|auto|goto|default)\b/g, '<span class=kw>$1</span>')
      // Numbers
      .replace(/\b(0x[0-9a-fA-F]+|\d+\.?\d*)\b/g, '<span class=num>$1</span>')
      // Functions (word followed by parenthesis)
      .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class=fn>$1</span>(');
  }

  // ============ Render sidebar ============
  function renderSidebar() {
    if (typeof EMBEDDED_DATA === 'undefined') return;
    const userItems = getUserItems();
    const mergedData = getMergedData();
    let html = '';
    mergedData.forEach(cat => {
      const userInCat = userItems.filter(q => q.categoryId === cat.id);
      const allInCat = (cat.questions || []).concat(userInCat);
      const reviewedInCat = allInCat.filter(q => reviewedSet.has(q.id)).length;
      const totalInCat = allInCat.length;
      const isActive = currentCategory === cat.id;
      const isExpanded = isActive || currentQuery.trim() !== '';
      html += `<div class="nav-category">`;
      html += `<div class="nav-category-header${isExpanded ? ' expanded' : ''}${isActive ? ' active' : ''}" data-cat="${cat.id}">`;
      html += `<span class="icon">${cat.icon}</span>`;
      html += `<span class="name">${cat.name}</span>`;
      html += `<span class="count">${reviewedInCat}/${totalInCat}</span>`;
      html += `<span class="arrow">▶</span>`;
      html += `</div>`;
      html += `<div class="nav-questions${isExpanded ? ' show' : ''}">`;
      (cat.questions || []).forEach(q => {
        html += `<a class="nav-question${reviewedSet.has(q.id) ? ' reviewed' : ''}" data-id="${q.id}" title="${q.q.replace(/"/g, '&quot;')}">${q.q}</a>`;
      });
      userInCat.forEach(q => {
        html += `<a class="nav-question${reviewedSet.has(q.id) ? ' reviewed' : ''} user-item" data-id="${q.id}" title="${q.q.replace(/"/g, '&quot;')}">✎ ${q.q}</a>`;
      });
      html += `</div></div>`;
    });
    sidebarNav.innerHTML = html;

    // Click handlers for sidebar
    sidebarNav.querySelectorAll('.nav-category-header').forEach(header => {
      header.addEventListener('click', () => {
        const catId = header.dataset.cat;
        if (currentCategory === catId && !currentQuery) {
          currentCategory = null;
        } else {
          currentCategory = catId;
          currentQuery = '';
          searchInput.value = '';
          updateSearchUI();
        }
        renderSidebar();
        renderContent(getFilteredQuestions());
        scrollToTop();
      });
    });

    sidebarNav.querySelectorAll('.nav-question').forEach(link => {
      link.addEventListener('click', () => {
        const id = link.dataset.id;
        const card = document.querySelector(`.qa-card[data-id="${id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (!expandedCards.has(id)) {
            toggleAnswer(id, card);
          }
        }
      });
    });
  }

  // ============ Render content ============
  function renderContent(items) {
    if (!items.length) {
      contentArea.innerHTML = `<div class="no-results"><div class="icon">🔍</div><h3>没有找到相关内容</h3><p>尝试使用其他关键词搜索</p></div>`;
      updateProgress();
      return;
    }

    // Group by category
    const grouped = {};
    items.forEach(item => {
      const key = item.categoryId;
      if (!grouped[key]) grouped[key] = { name: item.categoryName, icon: item.categoryIcon, items: [] };
      grouped[key].items.push(item);
    });

    let html = '';
    Object.entries(grouped).forEach(([catId, group]) => {
      html += `<div class="category-section" id="cat-${catId}">`;
      html += `<h2 class="category-title"><span class="icon">${group.icon}</span>${group.name}</h2>`;
      group.items.forEach((item, idx) => {
        const isExpanded = expandedCards.has(item.id);
        html += `
        <div class="qa-card${isExpanded ? ' expanded' : ''}" data-id="${item.id}">
          <div class="qa-card-header" data-id="${item.id}">
            <span class="qa-card-index">${idx + 1}</span>
            <span class="qa-card-question">${currentQuery ? highlightText(item.q, currentQuery) : item.q}</span>
            <span class="qa-card-arrow">▼</span>
          </div>
          <div class="qa-card-tags">
            ${(item.tags || []).map(t => {
              const cls = (t === '高频' || t === '必考') ? 'tag hot' : 'tag';
              return `<span class="${cls}" data-tag="${t}">${t}</span>`;
            }).join('')}
          </div>
          <div class="qa-card-body">
            <div class="qa-card-answer">${processAnswerHTML(item.a, currentQuery)}</div>
            <div class="qa-card-footer">
              <button class="btn-reviewed${reviewedSet.has(item.id) ? ' marked' : ''}" data-id="${item.id}">
                ${reviewedSet.has(item.id) ? '✓ 已掌握' : '标记为已掌握'}
              </button>
              ${item.source === 'user' ? `<span class="qa-card-actions">
                <button class="btn-sm" data-edit="${item.id}">✎ 编辑</button>
                <button class="btn-sm danger" data-del="${item.id}">✕ 删除</button>
              </span>` : ''}
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    });

    contentArea.innerHTML = html;

    // Bind card header clicks
    contentArea.querySelectorAll('.qa-card-header').forEach(header => {
      header.addEventListener('click', () => toggleAnswer(header.dataset.id));
    });

    // Bind reviewed buttons
    contentArea.querySelectorAll('.btn-reviewed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleReviewed(btn.dataset.id);
      });
    });

    // Bind edit/delete buttons (user items)
    contentArea.querySelectorAll('.btn-sm[data-edit]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(btn.dataset.edit); });
    });
    contentArea.querySelectorAll('.btn-sm[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('确定删除？')) { deleteUserItem(btn.dataset.del); renderSidebar(); expandedCards.clear(); renderContent(getFilteredQuestions()); }
      });
    });

    // Bind tag clicks
    contentArea.querySelectorAll('.tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = tag.dataset.tag;
        currentQuery = t;
        searchInput.value = t;
        currentCategory = null;
        updateSearchUI();
        renderSidebar();
        renderContent(searchQuestions(t));
        scrollToTop();
      });
    });

    // Bind copy buttons
    contentArea.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.nextElementSibling ? btn.nextElementSibling.textContent : '';
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = '已复制';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('copied'); }, 1500);
        }).catch(() => {});
      });
    });

    updateProgress();
  }

  function processAnswerHTML(html, query) {
    // Process code blocks: add copy button and apply highlighting
    let result = html.replace(/<pre><code class="language-c">([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      const highlighted = highlightCode(code.trim());
      return `<div class="code-block-wrapper"><button class="copy-btn">复制</button><pre><code class="language-c">${highlighted}</code></pre></div>`;
    });

    // Also handle pre/code without language class
    result = result.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
      const highlighted = highlightCode(code.trim());
      return `<div class="code-block-wrapper"><button class="copy-btn">复制</button><pre><code>${highlighted}</code></pre></div>`;
    });

    if (query && query.trim()) {
      // Highlight in text nodes (simple approach — wrap query matches)
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      // Only highlight in non-tag content
      result = result.replace(/(>)([^<]+)(<)/g, (m, before, text, after) => {
        return before + text.replace(regex, '<mark class="search-highlight">$1</mark>') + after;
      });
    }

    return result;
  }

  // ============ Toggle answer ============
  function toggleAnswer(id, cardEl) {
    const card = cardEl || document.querySelector(`.qa-card[data-id="${id}"]`);
    if (!card) return;
    const isExpanded = card.classList.contains('expanded');
    if (isExpanded) {
      card.classList.remove('expanded');
      expandedCards.delete(id);
    } else {
      card.classList.add('expanded');
      expandedCards.add(id);
    }
  }

  function expandAll() {
    contentArea.querySelectorAll('.qa-card').forEach(card => {
      card.classList.add('expanded');
      expandedCards.add(card.dataset.id);
    });
  }

  function collapseAll() {
    contentArea.querySelectorAll('.qa-card').forEach(card => {
      card.classList.remove('expanded');
      expandedCards.delete(card.dataset.id);
    });
  }

  // ============ Update UI ============
  function updateSearchUI() {
    if (currentQuery.trim()) {
      searchClear.classList.add('visible');
      searchHint.style.display = 'none';
    } else {
      searchClear.classList.remove('visible');
      searchHint.style.display = '';
    }
  }

  function updateProgress() {
    const all = getAllQuestions();
    const total = all.length;
    const reviewed = all.filter(q => reviewedSet.has(q.id)).length;
    totalCount.textContent = total;
    reviewedCount.textContent = reviewed;
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    progressFill.style.width = pct + '%';
    progressText.textContent = pct + '%';
  }

  function scrollToTop() {
    contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============ Event Listeners ============

  // Search input
  searchInput.addEventListener('input', () => {
    currentQuery = searchInput.value;
    currentCategory = null;
    updateSearchUI();
    renderSidebar();
    expandedCards.clear();
    renderContent(getFilteredQuestions());
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      currentQuery = '';
      updateSearchUI();
      renderSidebar();
      expandedCards.clear();
      renderContent(getAllQuestions());
      searchInput.blur();
    }
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    currentQuery = '';
    updateSearchUI();
    renderSidebar();
    expandedCards.clear();
    renderContent(getAllQuestions());
    searchInput.focus();
  });

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Expand/Collapse all
  expandAllBtn.addEventListener('click', expandAll);
  collapseAllBtn.addEventListener('click', collapseAll);

  // Mobile menu
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  });

  // Close sidebar when clicking a nav item on mobile
  sidebar.addEventListener('click', (e) => {
    if (e.target.closest('.nav-category-header') || e.target.closest('.nav-question')) {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
      }
    }
  });

  // Back to top
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });

  backToTop.addEventListener('click', scrollToTop);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // ============ Init ============
  function init() {
    if (typeof EMBEDDED_DATA === 'undefined') {
      contentArea.innerHTML = '<div class="no-results"><div class="icon">⚠️</div><h3>数据加载失败</h3><p>请确保 data.js 文件已正确加载</p></div>';
      return;
    }
    renderSidebar();
    const all = getAllQuestions();
    renderContent(all);
    updateProgress();
    updateSearchUI();
  }

  // Wait for data to be loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, but data.js might not be
    if (typeof EMBEDDED_DATA !== 'undefined') {
      init();
    } else {
      window.addEventListener('load', init);
    }
  }

})();
