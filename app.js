(function () {
  "use strict";

  const books = [
    { number: 1, title: "第一册", subtitle: "商业基础与商业环境", chapters: [
      [1, "商业学学习及专题研习", "Learning Business Studies and Project Work"],
      [2, "商业与永续性", "Business and Sustainability"], [3, "国内贸易", "Domestic Trade"],
      [4, "国际贸易", "International Trade"], [5, "商业组织", "Business Organisations"],
      [6, "个人理财", "Personal Finance"], [7, "精明消费", "Smart Consumption"]
    ]},
    { number: 2, title: "第二册", subtitle: "企业营运与职能管理", chapters: [
      [1, "营运管理", "Operations Management"], [2, "供应链管理", "Supply Chain Management"],
      [3, "行销管理 I", "Marketing Management I"], [4, "行销管理 II", "Marketing Management II"],
      [5, "人力资源管理 I", "Human Resource Management I"], [6, "人力资源管理 II", "Human Resource Management II"],
      [7, "财务管理 I", "Financial Management I"], [8, "财务管理 II", "Financial Management II"]
    ]},
    { number: 3, title: "第三册", subtitle: "创业、治理与商业环境", chapters: [
      [1, "创业与企业家精神", "Entrepreneurship and Entrepreneurial Spirit"], [2, "商业模式", "Business Model"],
      [3, "领导与管理", "Leadership and Management"], [4, "企业治理与责任", "Corporate Governance and Responsibility"],
      [5, "企业风险管理", "Enterprise Risk Management"], [6, "政府预算和税务", "Government Budget and Taxation"]
    ]}
  ];

  const main = document.getElementById("mainContent");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("drawerBackdrop");
  const imageDialog = document.getElementById("imageDialog");
  const imageDialogImage = document.getElementById("imageDialogImage");
  const imageDialogCaption = document.getElementById("imageDialogCaption");
  const imageDialogSource = document.getElementById("imageDialogSource");
  const imageDialogClose = document.getElementById("imageDialogClose");
  const pdfDialog = document.getElementById("pdfDialog");
  const pdfDialogFrame = document.getElementById("pdfDialogFrame");
  const pdfDialogTitle = document.getElementById("pdfDialogTitle");
  const pdfDialogClose = document.getElementById("pdfDialogClose");
  const siteSearch = document.querySelector(".site-search");
  const siteSearchInput = document.getElementById("siteSearchInput");
  const siteSearchClear = document.getElementById("siteSearchClear");
  const siteSearchResults = document.getElementById("siteSearchResults");
  let imageReturnFocus = null;
  let mode = localStorage.getItem("business-mode") === "teacher" ? "teacher" : "student";
  let theme = localStorage.getItem("business-theme") === "dark" ? "dark" : "light";
  const bankStates = {
    historical: { year: "all", chapter: "all", type: "all", query: "", page: 1, userChoices: {} },
    supplemental: { year: "all", chapter: "all", type: "all", query: "", page: 1, userChoices: {} }
  };
  let bankQuiz = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const bookBy = number => books.find(book => book.number === number);
  const chapterBy = (book, chapter) => bookBy(book)?.chapters.find(item => item[0] === chapter);
  const contentBy = (book, chapter) => window.CHAPTER_CONTENT?.[`${book}-${chapter}`] || {};
  const textbook = (book, chapter) => `assets/textbooks/book-${book}/chapter-${chapter}/textbook.pdf`;
  const footer = () => '<footer class="footer"><p>本网页专为新民独中商业学教学与备考复习制作 • YU SIR 编制 2026年8月。</p><small style="display:block;margin-top:4px;opacity:0.8;">版权所有，欢迎转发；网页内所有图文资料严禁复制及二次使用。</small></footer>';

  function blockSearchText(section) {
    return (section?.content || []).flatMap(block => block.type === "table" ? (block.rows || []).flat() : [block.text || ""]).join(" ");
  }

  function buildSearchIndex() {
    const records = [];
    books.forEach(book => book.chapters.forEach(chapter => {
      const chapterNumber = chapter[0];
      const data = contentBy(book.number, chapterNumber);
      const base = { book: book.number, chapter: chapterNumber, chapterTitle: chapter[1] };
      records.push({ ...base, type: "章节", label: chapter[1], text: `${chapter[1]} ${chapter[2]} ${data.learningMap || ""} ${(data.learningQuestions || []).join(" ")}` });
      (data.lessons || []).forEach(section => records.push({ ...base, type: "重点讲义", label: section.title, text: `${section.title} ${blockSearchText(section)}` }));
      (data.applications || []).forEach(section => records.push({ ...base, type: "情境应用", label: section.title, text: `${section.title} ${blockSearchText(section)}` }));
      (data.answerGuide || []).forEach(section => records.push({ ...base, type: "作答方法", label: section.title, text: `${section.title} ${blockSearchText(section)}` }));
      (data.terms || []).forEach(term => records.push({ ...base, type: "关键术语", label: term.term, text: `${term.term} ${term.english || ""} ${term.meaning || ""}` }));
      (data.questions || []).forEach((question, index) => records.push({ ...base, type: `作答题 ${index + 1}`, label: question.title.replace(/^第\d+题[｜ ]*/, ""), text: `${question.title} ${(question.question || []).join(" ")}` }));
      (data.visuals || []).forEach(visual => records.push({ ...base, type: "教学图解", label: visual.caption, text: `${visual.caption} ${visual.source || ""}` }));
      const review = window.INTERACTIVE_REVIEW?.[`${book.number}-${chapterNumber}`];
      (review?.flashcards || []).forEach(card => records.push({ ...base, type: "复习闪卡", label: card.tag, text: `${card.front} ${card.back} ${card.source || ""}` }));
      (review?.questions || []).forEach(question => records.push({ ...base, type: "挑战选择题", label: question.tag, text: `${question.prompt} ${(question.options || []).join(" ")} ${question.explanation || ""}` }));
    }));
    ["historical", "supplemental"].forEach(kind => (window.QUESTION_BANKS?.[kind] || []).forEach(record => records.push({
      book: record.currentBook, chapter: record.currentChapter, chapterTitle: record.currentTitle,
      type: kind === "historical" ? "历届翻新题" : "专项题库", label: record.prompt.slice(0, 48),
      text: `${record.sourceYear} ${record.sourceLabel} ${record.type} ${record.prompt} ${(record.options || []).join(" ")}`,
      href: `#/bank/${kind}?q=${encodeURIComponent(record.prompt.slice(0, 16))}`
    })));
    return records.map(record => ({ ...record, search: `${record.label} ${record.text}`.toLocaleLowerCase("zh-Hans") }));
  }

  const searchIndex = buildSearchIndex();

  function searchSnippet(text, query) {
    const cleanText = String(text || "").replace(/\s+/g, " ").trim();
    const position = cleanText.toLocaleLowerCase("zh-Hans").indexOf(query.toLocaleLowerCase("zh-Hans"));
    const start = Math.max(0, position < 0 ? 0 : position - 32);
    const end = Math.min(cleanText.length, start + 105);
    return `${start ? "…" : ""}${cleanText.slice(start, end)}${end < cleanText.length ? "…" : ""}`;
  }

  function closeSearchResults() {
    siteSearchResults.hidden = true;
    siteSearchInput.setAttribute("aria-expanded", "false");
  }

  function renderSearchResults() {
    const query = siteSearchInput.value.trim();
    siteSearchClear.hidden = !query;
    if (!query) { closeSearchResults(); siteSearchResults.innerHTML = ""; return; }
    const terms = query.toLocaleLowerCase("zh-Hans").split(/\s+/).filter(Boolean);
    const results = searchIndex.filter(record => terms.every(term => record.search.includes(term))).map(record => {
      const label = record.label.toLocaleLowerCase("zh-Hans");
      const score = label === query.toLocaleLowerCase("zh-Hans") ? 0 : label.startsWith(query.toLocaleLowerCase("zh-Hans")) ? 1 : label.includes(query.toLocaleLowerCase("zh-Hans")) ? 2 : 3;
      return { ...record, score };
    }).sort((a, b) => a.score - b.score || a.book - b.book || a.chapter - b.chapter).slice(0, 16);
    siteSearchResults.innerHTML = results.length ? `<header>找到相关内容 <b>${results.length}</b> 项</header>${results.map(result => `<a role="option" data-search-result href="${result.href || `#/chapter/${result.book}/${result.chapter}`}"><span>${esc(result.type)}</span><div><b>${esc(result.label)}</b><small>第${result.book}册第${result.chapter}章 · ${esc(result.chapterTitle)}</small><p>${esc(searchSnippet(result.text, query))}</p></div></a>`).join("")}` : `<div class="search-empty"><b>找不到“${esc(query)}”</b><p>可尝试较短的课本术语，例如“需求”“行销”“风险”。</p></div>`;
    siteSearchResults.hidden = false;
    siteSearchInput.setAttribute("aria-expanded", "true");
  }

  const sidebarToggle = document.getElementById("sidebarToggle");
  let sidebarCollapsed = localStorage.getItem("business-sidebar-collapsed") === "true";

  function setAppearance() {
    document.body.dataset.mode = mode;
    document.body.dataset.theme = theme;
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    document.querySelectorAll("[data-mode]").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
    document.getElementById("themeButton").textContent = theme === "light" ? "夜" : "日";
  }

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem("business-sidebar-collapsed", String(sidebarCollapsed));
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  }

  function renderSidebar() {
    const hash = location.hash || "#/home";
    sidebar.innerHTML = `<p class="sidebar-label">三册课程目录</p><a class="sidebar-home ${hash === "#/home" ? "active" : ""}" href="#/home"><b>课程首页</b></a><div class="sidebar-bank-links"><a class="sidebar-bank-item historical ${hash.startsWith("#/bank/historical") ? "active" : ""}" href="#/bank/historical"><b>历届翻新题</b></a><a class="sidebar-bank-item supplemental ${hash.startsWith("#/bank/supplemental") ? "active" : ""}" href="#/bank/supplemental"><b>专项题库</b></a></div>${books.map(book => `<section class="sidebar-group book-${book.number}"><div class="sidebar-book"><b>${book.title}</b><small>${book.chapters.length}章</small></div><div class="sidebar-chapters">${book.chapters.map(chapter => `<a class="${hash === `#/chapter/${book.number}/${chapter[0]}` ? "active" : ""}" href="#/chapter/${book.number}/${chapter[0]}"><span>${chapter[0]}</span><b>${esc(chapter[1])}</b></a>`).join("")}</div></section>`).join("")}`;
  }

  function home() {
    return `<div class="page"><section class="home-intro"><p class="eyebrow">马来西亚华文独中商业学</p><h1>${mode === "teacher" ? "备课、讲解与评量，集中在同一章节。" : "按章节理解概念，再练习统考作答。"}</h1><p>讲义、图解、纠错与题目已拆分成网页内容；只有课本保留 PDF 阅读。</p></section><section class="book-list"><div class="section-title"><p class="eyebrow">课程目录</p><h2>第一册至第三册 · 共21章</h2></div>${books.map(book => `<article class="book-block"><header><span>0${book.number}</span><div><h2>${book.title}</h2><p>${book.subtitle}</p></div></header><div class="home-chapters">${book.chapters.map(chapter => `<a href="#/chapter/${book.number}/${chapter[0]}"><span>${String(chapter[0]).padStart(2,"0")}</span><div><b>${esc(chapter[1])}</b><small>${esc(chapter[2])}</small></div><em>进入</em></a>`).join("")}</div></article>`).join("")}</section>${footer()}</div>`;
  }

  function visualSection(data) {
    if (!data.visuals?.length) return "";
    return `<section class="content-section visual-section"><div class="section-title"><p class="eyebrow">图像复习</p><p>点击图片可放大查看；内容包括简报重点图解及按章节整理的信息图。</p></div><div class="visual-grid">${data.visuals.map(item => `<figure><button class="visual-button" type="button" data-image-src="${esc(item.src)}" data-image-caption="${esc(item.caption)}" data-image-source="${esc(item.source || "")}" aria-label="放大查看：${esc(item.caption)}"><img loading="lazy" src="${esc(item.src)}" alt="${esc(item.caption)}"><span class="visual-zoom-hint" aria-hidden="true">放大查看</span></button><figcaption><b>${esc(item.caption)}</b>${item.source ? `<small>${esc(item.source)}</small>` : ""}</figcaption></figure>`).join("")}</div></section>`;
  }

  function knowledgeArchitecture(chapterTitle, data) {
    const lessonTitles = (data.lessons || []).map(section => section.title).filter(Boolean);
    const mapSteps = String(data.learningMap || "").split(/\s*[→➜⇒]\s*/).map(step => step.trim()).filter(Boolean);
    const flowSteps = (mapSteps.length >= 3 ? mapSteps : lessonTitles).slice(0, 7);
    const modules = lessonTitles.slice(0, 8);
    const keywords = (data.terms || []).slice(0, 6).map(term => term.term);
    if (!flowSteps.length && !modules.length) return "";
    return `<section class="content-section knowledge-architecture-section"><div class="section-title"><p class="eyebrow">讲义知识图解与架构</p><h2>先看整体，再进入细节</h2><p>依据本章讲义的概念顺序与教学模块整理，适合课堂导入、课末总结和考前快速回忆。</p></div><div class="knowledge-board"><article class="knowledge-flow-card"><header><span>01</span><div><h3>概念学习路径</h3><p>按照理解与应用次序串联重点</p></div></header><div class="knowledge-flow">${flowSteps.map((step, index) => `<div class="knowledge-step"><small>${String(index + 1).padStart(2, "0")}</small><b>${esc(step)}</b></div>`).join("")}</div></article><article class="chapter-architecture-card"><header><span>02</span><div><h3>章节知识架构</h3><p>掌握各讲义模块在本章的位置</p></div></header><div class="architecture-root"><small>本章核心</small><strong>${esc(chapterTitle)}</strong></div><div class="architecture-branches">${modules.map((title, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><b>${esc(title)}</b></div>`).join("")}</div>${keywords.length ? `<div class="architecture-keywords"><small>关键术语</small>${keywords.map(term => `<span>${esc(term)}</span>`).join("")}</div>` : ""}</article></div></section>`;
  }

  function openImageDialog(button) {
    main.querySelectorAll("[data-image-return-focus]").forEach(item => item.removeAttribute("data-image-return-focus"));
    button.setAttribute("data-image-return-focus", "true");
    imageReturnFocus = button;
    imageDialogImage.src = button.dataset.imageSrc;
    imageDialogImage.alt = button.dataset.imageCaption;
    imageDialogCaption.textContent = button.dataset.imageCaption;
    imageDialogSource.textContent = button.dataset.imageSource;
    document.body.classList.add("dialog-open");
    imageDialog.showModal();
  }

  function closeImageDialog() {
    if (imageDialog.open) imageDialog.close();
  }

  function textbookSection(book, chapter, chapterTitle) {
    return `<section class="content-section textbook-section textbook-section-top"><div><p class="eyebrow">课本原文</p><h2>需要核对时打开课本</h2><p>课本是术语、定义与考试范围的最高依据；点击后以弹窗阅读，可再放大。</p></div><div class="pdf-actions"><button class="button primary" type="button" data-pdf-open data-pdf-src="${textbook(book, chapter)}" data-pdf-title="第${book}册第${chapter}章《${esc(chapterTitle)}》课本">打开课本</button><a class="button secondary" href="${textbook(book, chapter)}" target="_blank" rel="noopener">另页阅读</a></div></section>`;
  }

  function openPdfDialog(button) {
    pdfDialogFrame.src = button.dataset.pdfSrc;
    pdfDialogTitle.textContent = button.dataset.pdfTitle;
    document.body.classList.add("dialog-open");
    pdfDialog.showModal();
  }

  function closePdfDialog() {
    if (pdfDialog.open) pdfDialog.close();
  }

  const flashStates = {};
  const quizStates = {};
  const shuffled = items => items.map(value => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(item => item.value);

  function reviewData(key) { return window.INTERACTIVE_REVIEW?.[key]; }

  function interactiveReviewSection(book, chapter) {
    const key = `${book}-${chapter}`;
    if (!reviewData(key)) return "";
    return `<section class="content-section interactive-review-section" data-review-key="${key}"><div class="section-title"><p class="eyebrow">章节互动复习</p><h2>闪卡测验与挑战辨识题</h2><p>先用闪卡检查概念，再由题库自动组合10道辨识选择题。进度只保存在这台装置。</p></div><div class="interactive-review-grid"><div class="flash-review-panel" data-flash-panel></div><div class="quiz-review-panel" data-quiz-panel></div></div></section>`;
  }

  function flashStateFor(key) {
    if (flashStates[key]) return flashStates[key];
    const data = reviewData(key);
    let mastered = [];
    try { mastered = JSON.parse(localStorage.getItem(`business-flash-mastered-${key}`) || "[]"); } catch (_) {}
    flashStates[key] = { order: shuffled(data.flashcards.map(card => card.id)), index: 0, flipped: false, mastered: new Set(mastered) };
    return flashStates[key];
  }

  function renderFlashPanel(key) {
    const panel = main.querySelector(`[data-review-key="${key}"] [data-flash-panel]`);
    if (!panel) return;
    const data = reviewData(key);
    const state = flashStateFor(key);
    const current = data.flashcards.find(card => card.id === state.order[state.index]);
    const mastered = state.mastered.has(current.id);
    panel.innerHTML = `<header class="review-panel-header"><div><span>闪卡测验</span><h3>${data.flashcards.length}张概念辨析卡</h3></div><strong>${state.mastered.size}/${data.flashcards.length} 已掌握</strong></header><div class="flash-progress"><i style="width:${(state.mastered.size / data.flashcards.length) * 100}%"></i></div><button type="button" class="flashcard ${state.flipped ? "flipped" : ""}" data-flash-flip aria-label="${state.flipped ? "查看闪卡题目" : "翻面查看答案"}"><span class="flashcard-face flashcard-front"><small>${esc(current.tag)} · ${state.index + 1}/${state.order.length}</small><b>${esc(current.front)}</b><em>点击翻面</em></span><span class="flashcard-face flashcard-back"><small>答案与判断依据</small><b>${esc(current.back)}</b><em>${esc(current.source)}</em></span></button><div class="flash-actions"><button type="button" data-flash-prev>上一张</button><button type="button" class="${mastered ? "mastered" : ""}" data-flash-mark="mastered">${mastered ? "✓ 已掌握" : "标记已掌握"}</button><button type="button" data-flash-mark="review">需复习</button><button type="button" data-flash-next>下一张</button></div><button type="button" class="review-secondary-action" data-flash-shuffle>重新洗牌</button>`;
  }

  function makeQuiz(key) {
    const data = reviewData(key);
    const quotas = { scenario: 3, comparison: 2, process: 2, error: 2, application: 1 };
    const selected = [];
    Object.entries(quotas).forEach(([category, count]) => selected.push(...shuffled(data.questions.filter(question => question.category === category)).slice(0, count)));
    if (selected.length < 10) selected.push(...shuffled(data.questions.filter(question => !selected.includes(question))).slice(0, 10 - selected.length));
    const prepared = shuffled(selected).map(question => {
      const optionEntries = shuffled(question.options.map((text, index) => ({ text, correct: index === question.answer })));
      return { ...question, options: optionEntries.map(item => item.text), answer: optionEntries.findIndex(item => item.correct) };
    });
    quizStates[key] = { questions: prepared, answers: {}, submitted: false };
  }

  function renderQuizPanel(key) {
    const panel = main.querySelector(`[data-review-key="${key}"] [data-quiz-panel]`);
    if (!panel) return;
    const data = reviewData(key);
    const state = quizStates[key];
    if (!state) {
      panel.innerHTML = `<header class="review-panel-header"><div><span>挑战辨识题</span><h3>从${data.questions.length}题母题自动组合</h3></div><strong>每次10题</strong></header><div class="quiz-intro"><b>不是简单背定义</b><p>题目包含情境辨识、相似概念、流程次序、错误说法及综合应用。</p><button type="button" class="button primary" data-quiz-generate>生成10题</button></div>`;
      return;
    }
    const score = state.submitted ? state.questions.reduce((sum, question, index) => sum + (state.answers[index] === question.answer ? 1 : 0), 0) : 0;
    const answered = Object.keys(state.answers).length;
    panel.innerHTML = `<header class="review-panel-header"><div><span>挑战辨识题</span><h3>${state.submitted ? `本次得分 ${score}/10` : `作答进度 ${answered}/10`}</h3></div><strong>${state.submitted ? (score >= 8 ? "掌握良好" : score >= 6 ? "继续巩固" : "建议重练") : "每题1分"}</strong></header>${state.submitted ? `<div class="quiz-score"><span>${score * 10}%</span><p>${score >= 8 ? "能够辨认多数题干证据。" : "请根据解析找出易混概念后再生成一组。"}</p></div>` : ""}<div class="quiz-question-list">${state.questions.map((question, index) => `<article class="quiz-question ${state.submitted ? (state.answers[index] === question.answer ? "correct" : "incorrect") : ""}"><header><span>第${index + 1}题</span><small>${esc(question.difficulty)} · ${esc(question.tag)}</small></header><p class="quiz-prompt">${esc(question.prompt)}</p><div class="quiz-options">${question.options.map((option, optionIndex) => { const checked = state.answers[index] === optionIndex; const status = state.submitted ? (optionIndex === question.answer ? "correct-option" : checked ? "wrong-option" : "") : ""; return `<label class="${status}" data-quiz-choice="${index}:${optionIndex}"><input type="radio" name="quiz-${key}-${index}" value="${optionIndex}" data-quiz-answer="${index}" ${checked ? "checked" : ""} ${state.submitted ? "disabled" : ""}><span>${"ABCD"[optionIndex]}</span><b>${esc(option)}</b></label>`; }).join("")}</div>${state.submitted ? `<div class="quiz-explanation"><b>${state.answers[index] === question.answer ? "✓ 判断正确" : `正确答案：${"ABCD"[question.answer]}`}</b><p>${esc(question.explanation)}</p></div>` : ""}</article>`).join("")}</div><div class="quiz-submit-bar">${state.submitted ? `<button type="button" class="button primary" data-quiz-generate>生成新一组10题</button>` : `<button type="button" class="button primary" data-quiz-submit ${answered < 10 ? "disabled" : ""}>提交并查看解析</button><small>${answered < 10 ? `还有${10 - answered}题未作答` : "已完成全部题目"}</small>`}</div>`;
  }

  function renderInteractiveReview(key) {
    renderFlashPanel(key);
    renderQuizPanel(key);
  }

  function tableHtml(rows) {
    if (!rows?.length) return "";
    const columnCount = Math.max(...rows.map(row => row.length));
    let note = "", header = rows[0], body = rows.slice(1);
    if (header.length === 1 && columnCount > 1) { note = header[0]; header = rows[1] || []; body = rows.slice(2); }
    if (columnCount === 1) return rows.map(row => `<p class="lesson-callout">${esc(row[0])}</p>`).join("");
    return `${note ? `<p class="lesson-callout">${esc(note)}</p>` : ""}<div class="lesson-table-wrap"><table class="lesson-table"><thead><tr>${header.map(cell => `<th>${esc(cell)}</th>`).join("")}</tr></thead><tbody>${body.map(row => `<tr>${row.map(cell => `<td ${row.length === 1 ? `colspan="${columnCount}"` : ""}>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function blockHtml(block) {
    return block.type === "table" ? tableHtml(block.rows) : `<p class="lesson-text">${esc(block.text)}</p>`;
  }

  function sectionCollection(sections, eyebrow, title, description = "") {
    if (!sections?.length) return "";
    return `<section class="content-section"><div class="section-title"><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ""}</div><div class="lesson-sections">${sections.map((section, index) => `<article class="lesson-section"><header><span>${String(index + 1).padStart(2, "0")}</span><h3>${esc(section.title)}</h3></header><div class="lesson-content">${section.content.map(blockHtml).join("")}</div></article>`).join("")}</div></section>`;
  }

  function termsSection(data) {
    if (!data.terms?.length) return "";
    return `<section class="content-section"><div class="section-title"><p class="eyebrow">术语速查</p><h2>先把专业用语说准确</h2></div><div class="term-list">${data.terms.map(term => `<article><div><b>${esc(term.term)}</b><small>${esc(term.english)}</small></div><p>${esc(term.meaning)}</p></article>`).join("")}</div></section>`;
  }

  function mistakesSection(data) {
    if (!data.mistakes?.length) return "";
    return `<section class="content-section"><div class="section-title"><p class="eyebrow">纠错讲义</p><h2>常见误区与检查方法</h2></div><div class="mistake-list">${data.mistakes.map(item => `<article><div class="wrong"><span>容易写成</span><p>${esc(item.wrong)}</p></div><div class="right"><span>检查与修正</span><p>${esc(item.right)}</p></div></article>`).join("")}</div></section>`;
  }

  function questionsSection(book, chapter, data) {
    if (!data.questions?.length) return `<section class="content-section"><div class="section-title"><p class="eyebrow">学习检查</p><h2>本章以专题研习任务为主</h2><p>第一册第1章不设置正式章节作答题。请用学习问题检查资料搜集、分析与汇报方法。</p></div></section>`;
    const questionCard = (question, index) => {
      return `<article class="question-item" id="question-${book}-${chapter}-${index + 1}"><header><span>第 ${index + 1} 题</span><h3>${esc(question.title.replace(/^第\d+题[｜ ]*/, ""))}</h3></header><div class="question-body">${question.question.map(line => `<p>${esc(line)}</p>`).join("")}</div><details class="answer-panel" ${mode === "teacher" ? "open" : ""}><summary>完成后查看教师参考答案</summary><div><h4>教师参考答案</h4>${question.answer.map(line => `<p>${esc(line)}</p>`).join("")}${question.rubric?.length ? `<details ${mode === "teacher" ? "open" : ""}><summary>逐点评分标准与提醒</summary>${question.rubric.map(line => `<p>${esc(line)}</p>`).join("")}</details>` : ""}</div></details></article>`;
    };
    const groups = [
      { title: "基础作答题", note: "每题10分 · 巩固定义、分类与基本判断", start: 0, end: 6 },
      { title: "进阶作答题", note: "每题15分 · 训练解释、比较与情境应用", start: 6, end: 12 },
      { title: "综合个案题", note: "每题15分 · 综合题干证据、课本概念与建议", start: 12, end: data.questions.length }
    ].filter(group => group.start < data.questions.length);
    const navigation = data.questions.map((question, index) => `<button type="button" data-question-target="question-${book}-${chapter}-${index + 1}" aria-label="前往第${index + 1}题">${index + 1}</button>`).join("");
    const groupedQuestions = groups.map(group => `<section class="question-group"><header><div><h3>${group.title}</h3><p>${group.note}</p></div><strong>${Math.min(group.end, data.questions.length) - group.start}题</strong></header><div class="question-list">${data.questions.slice(group.start, group.end).map((question, offset) => questionCard(question, group.start + offset)).join("")}</div></section>`).join("");
    return `<section class="content-section question-bank-section"><div class="section-title"><p class="eyebrow">章节作答题库</p><h2>本章全部 ${data.questions.length} 题</h2><p>${mode === "teacher" ? "教师模式已展开教师参考答案、逐点评分标准与提醒。" : "所有题目均直接显示；先独立作答，再按需要展开教师参考答案。"}</p></div><nav class="question-jump" aria-label="题目快速导航"><span>快速跳题</span>${navigation}</nav>${groupedQuestions}</section>`;
  }

  function teacherSection(data) {
    if (mode !== "teacher") return "";
    const groups = [
      ["课节规划", "先确定教学节奏与课堂产出", data.teacherPlan || []],
      ["诊断与纠错", "先备知识、即时判断与预判易错", data.teacherDiagnostics || []],
      ["情境与讲评", "课堂个案、作答讲解、评分观察及板书建议", data.teacherCases || []],
      ["课末检查", "检查学习成果与教师审核事项", data.teacherChecks || []]
    ].filter(group => group[2].length);
    const noteCount = groups.reduce((sum, group) => sum + group[2].length, 0);
    return `<section class="content-section teacher-section" id="teacher-console"><div class="teacher-console-head"><div class="section-title"><p class="eyebrow">教师专用 · 课堂控制台</p><h2>备课、诊断、提问、讲评集中处理</h2><p>内容依据本章教师教学讲义拆分；学生模式不会显示以下教师资料。</p></div><div class="teacher-console-stats"><span><b>${(data.teachingPath || []).length}</b>教学主线</span><span><b>${(data.teacherPrompts || []).length}</b>课堂提问</span><span><b>${noteCount}</b>教学模块</span></div></div><div class="teacher-actions"><button type="button" data-teacher-action="answers-show">展开全部参考答案</button><button type="button" data-teacher-action="answers-hide">收起全部参考答案</button><button type="button" data-teacher-action="questions">前往章节题库</button></div>${data.teachingPath?.length ? `<div class="teacher-subtitle"><span>01</span><div><b>本章教学主线</b><small>按课堂推进次序使用</small></div></div><div class="teaching-path">${data.teachingPath.map((line, index) => `<div><span>${index + 1}</span><p>${esc(line)}</p></div>`).join("")}</div>` : ""}${data.teacherPrompts?.length ? `<div class="teacher-subtitle"><span>02</span><div><b>课堂提问与追问</b><small>先让学生判断，再要求提供课本概念与题干证据</small></div></div><div class="prompt-list">${data.teacherPrompts.map(item => `<article><b>${esc(item.prompt)}</b><p>${esc(item.followup)}</p></article>`).join("")}</div>` : ""}${groups.length ? `<div class="teacher-module-grid">${groups.map((group, groupIndex) => `<details class="teacher-module" ${groupIndex < 2 ? "open" : ""}><summary><span>${String(groupIndex + 3).padStart(2,"0")}</span><div><b>${esc(group[0])}</b><small>${esc(group[1])} · ${group[2].length}项</small></div><em>展开</em></summary><div class="teacher-module-body">${group[2].map((section, index) => `<article class="teacher-note"><header><span>${index + 1}</span><h3>${esc(section.title)}</h3></header><div class="lesson-content">${section.content.map(blockHtml).join("")}</div></article>`).join("")}</div></details>`).join("")}</div>` : ""}</section>`;
  }

  function chapterPage(book, chapter) {
    const info = chapterBy(book, chapter);
    if (!info) return notFound();
    const data = contentBy(book, chapter);
    const introNote = book === 1 && chapter === 1 ? '<div class="intro-note">本章是课程导论；正式章节复习从第一册第2章开始。</div>' : "";
    return `<div class="page book-${book}-page">
      <div class="breadcrumbs"><a href="#/home">课程首页</a><span>›</span><span>第${book}册</span><span>›</span><b>第${chapter}章</b></div>
      <section class="chapter-intro"><div><p class="eyebrow">第${book}册 · 第${chapter}章${mode === "teacher" ? " · 教师备课视图" : ""}</p><h1>${esc(info[1])}</h1><p class="english">${esc(info[2])}</p><p class="learning-map">${esc(data.learningMap || "本章资料正在整理。")}</p>${mode === "teacher" ? '<a class="teacher-console-link" href="#teacher-console">进入教师课堂控制台</a>' : ""}</div><div class="chapter-number"><small>BOOK ${book}</small><strong>${String(chapter).padStart(2,"0")}</strong></div></section>
      ${introNote}
      ${textbookSection(book, chapter, info[1])}
      <section class="content-section focus-section"><div class="section-title"><p class="eyebrow">学习起点</p><h2>本章要解决什么问题？</h2></div><ol class="learning-questions">${(data.learningQuestions || []).map(item => `<li>${esc(item)}</li>`).join("")}</ol></section>
      ${teacherSection(data)}
      ${knowledgeArchitecture(info[1], data)}
      ${visualSection(data)}
      ${sectionCollection(data.lessons,"重点讲义","核心概念、比较与判断规则","依据学生讲义重整，保留定义、比较表、流程与判断依据。")}
      ${termsSection(data)}${mistakesSection(data)}
      ${interactiveReviewSection(book, chapter)}
      ${sectionCollection(data.applications,"情境应用","把概念放进商业情境","情境属于教学模拟；作答时必须写出课本术语、题干证据与解释。")}
      ${sectionCollection(data.answerGuide,"作答方法","从题目要求组织答案")}
      ${questionsSection(book, chapter, data)}${footer()}
    </div>`;
  }

  function bankRecords(kind) {
    return window.QUESTION_BANKS?.[kind] || [];
  }

  function filteredBankRecords(kind) {
    const state = bankStates[kind];
    const query = state.query.trim().toLocaleLowerCase("zh-Hans");
    return bankRecords(kind).filter(record => {
      const chapterKey = `${record.currentBook}-${record.currentChapter}`;
      const haystack = `${record.prompt} ${(record.options || []).join(" ")} ${record.sourceLabel} ${record.originalTitle} ${record.currentTitle}`.toLocaleLowerCase("zh-Hans");
      return (state.year === "all" || record.sourceYear === state.year) &&
        (state.chapter === "all" || chapterKey === state.chapter) &&
        (state.type === "all" || record.type === state.type) &&
        (!query || haystack.includes(query));
    });
  }

  function textParagraphs(text) {
    return String(text || "").split(/\n+/).filter(Boolean).map(line => `<p>${esc(line)}</p>`).join("");
  }

  function bankRecordCard(record, number, kind) {
    const isChoice = Boolean(record.options?.length);
    const userChosen = kind ? bankStates[kind]?.userChoices?.[record.id] : undefined;
    const isSubmitted = userChosen !== undefined;
    const isWrong = isSubmitted && userChosen !== record.answer;
    const isCorrect = isSubmitted && userChosen === record.answer;
    const isOpen = mode === "teacher" || (isChoice && (isWrong || isCorrect));

    return `<article class="bank-question-card" id="bank-${record.id}">
      <header class="bank-card-header">
        <div class="bank-card-title">
          <span class="question-number">第 ${number} 题</span>
          <span class="question-type-badge">${esc(record.type)}</span>
        </div>
        <div class="question-badges">${record.status.map(status => `<em>${esc(status)}</em>`).join("")}</div>
      </header>
      <div class="bank-source-line">
        <strong>${record.sourceYear === "新编" ? "新编情境" : `${esc(record.sourceYear)}年`}</strong>
        <span>${esc(record.sourceLabel)}</span>
        <span>现行：第${record.currentBook}册第${record.currentChapter}章 ${esc(record.currentTitle)}</span>
      </div>
      ${record.remapped ? `<div class="remap-note">原资料：第${record.originalBook}册第${record.originalChapter}章 ${esc(record.originalTitle)} → 已按现行课本重新归类</div>` : ""}
      <div class="bank-prompt">${textParagraphs(record.prompt)}</div>
      ${isChoice ? `<div class="bank-interactive-options" data-card-id="${record.id}">${record.options.map((option, index) => {
        const letter = "ABCD"[index];
        const selected = userChosen === letter;
        const correctOpt = isSubmitted && letter === record.answer;
        const wrongOpt = selected && !correctOpt;
        let optClass = "bank-option-btn";
        if (selected) optClass += " chosen";
        if (correctOpt) optClass += " option-correct";
        if (wrongOpt) optClass += " option-wrong";
        return `<button type="button" class="${optClass}" data-card-choice="${record.id}:${letter}">
          <span>${letter}</span><b>${esc(option)}</b>
        </button>`;
      }).join("")}</div>` : ""}
      ${isChoice && isSubmitted ? `<div class="bank-choice-feedback ${isCorrect ? "feedback-correct" : "feedback-wrong"}">
        ${isCorrect ? "<b>✓ 回答正确！</b>" : `<b>✕ 回答错误！您的选择是 ${userChosen}，正确答案是 ${esc(record.answer)}</b>`}
      </div>` : ""}
      <details class="bank-answer-panel" ${isOpen ? "open" : ""}>
        <summary class="bank-answer-summary">
          <span class="summary-btn-text">${isChoice ? "参考解析与答案" : "点击展开参考答案与评分要点"}</span>
        </summary>
        <div class="bank-answer-content">
          ${isChoice ? `<div class="bank-correct-badge"><b>正确答案：${esc(record.answer)}</b></div>` : textParagraphs(record.answer)}
          ${record.explanation ? `<div class="bank-explanation"><b>解析 / 评分观察</b>${textParagraphs(record.explanation)}</div>` : ""}
        </div>
      </details>
      ${mode === "teacher" ? `<small class="teacher-source-file">教师核对来源：${esc(record.sourceFile)}</small>` : ""}
    </article>`;
  }

  function bankQuizHtml(kind) {
    if (!bankQuiz || bankQuiz.kind !== kind) return "";
    return `<section class="bank-quiz"><header><div><p class="eyebrow">随机挑战</p><h2>10题辨识选择题</h2><p>题目从当前筛选范围随机抽取；作答完毕后才显示答案与解析。</p></div><button type="button" data-bank-quiz-close>关闭测验</button></header>${bankQuiz.questions.map((question, index) => `<article><h3>${index + 1}. ${esc(question.prompt)}</h3><div class="bank-quiz-options">${question.options.map((option, optionIndex) => { const chosen = bankQuiz.answers[index] === optionIndex; const correct = bankQuiz.submitted && "ABCD"[optionIndex] === question.answer; const wrong = bankQuiz.submitted && chosen && !correct; return `<button type="button" data-bank-quiz-choice="${index}:${optionIndex}" class="${chosen ? "chosen" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" ${bankQuiz.submitted ? "disabled" : ""}><span>${"ABCD"[optionIndex]}</span>${esc(option)}</button>`; }).join("")}</div>${bankQuiz.submitted ? `<div class="quiz-feedback"><b>答案：${esc(question.answer)}</b>${question.explanation ? `<p>${esc(question.explanation)}</p>` : ""}</div>` : ""}</article>`).join("")}<footer>${bankQuiz.submitted ? `<strong>得分：${bankQuiz.score} / ${bankQuiz.questions.length}</strong><button type="button" data-bank-quiz-generate="${kind}">再出10题</button>` : `<span>已作答 ${Object.keys(bankQuiz.answers).length} / ${bankQuiz.questions.length}</span><button type="button" data-bank-quiz-submit ${Object.keys(bankQuiz.answers).length < bankQuiz.questions.length ? "disabled" : ""}>提交答案</button>`}</footer></section>`;
  }

  function makeBankQuiz(kind) {
    const choices = filteredBankRecords(kind).filter(record => record.options?.length === 4 && /^[A-D]$/.test(record.answer));
    const pool = shuffled(choices).slice(0, Math.min(10, choices.length));
    bankQuiz = { kind, questions: pool, answers: {}, submitted: false, score: 0 };
  }

  function updateBankResults(kind) {
    const records = filteredBankRecords(kind);
    const pages = Math.max(1, Math.ceil(records.length / 20));
    const state = bankStates[kind];
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * 20;
    const visible = records.slice(start, start + 20);

    const resultsEl = main.querySelector("#bankResultsContainer");
    if (resultsEl) {
      resultsEl.innerHTML = `<div class="section-title"><p class="eyebrow">网页题库</p><h2>显示 ${records.length} 题</h2><p>${mode === "teacher" ? "教师模式默认展开答案，并显示来源文件供备查。" : "学生先独立作答，再按需要展开答案。"}</p></div>${visible.length ? visible.map((record, index) => bankRecordCard(record, start + index + 1, kind)).join("") : `<div class="bank-empty"><b>没有符合条件的题目</b><p>请清除部分筛选或缩短关键词。</p></div>`}`;
    }

    const paginationEl = main.querySelector("#bankPaginationContainer");
    if (paginationEl) {
      paginationEl.innerHTML = pages > 1 ? `<nav class="bank-pagination" aria-label="题库分页"><button data-bank-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>上一页</button><span>第 ${state.page} / ${pages} 页</span><button data-bank-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""}>下一页</button></nav>` : "";
    }
  }

  function questionBankPage(kind) {
    const historical = kind === "historical";
    const state = bankStates[kind];
    const all = bankRecords(kind);
    const records = filteredBankRecords(kind);
    const years = [...new Set(all.map(item => item.sourceYear))].sort();
    const chapters = [...new Map(all.map(item => [`${item.currentBook}-${item.currentChapter}`, item])).values()].sort((a, b) => a.currentBook - b.currentBook || a.currentChapter - b.currentChapter);
    const types = [...new Set(all.map(item => item.type))].sort();
    const pages = Math.max(1, Math.ceil(records.length / 20));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * 20;
    const visible = records.slice(start, start + 20);
    return `<div class="page bank-page"><div class="breadcrumbs"><a href="#/home">课程首页</a><span>›</span><b>${historical ? "历届翻新题" : "专项题库"}</b></div><section class="bank-hero"><div><p class="eyebrow">${historical ? "统考题型复习" : "章节强化练习"}</p><h1>${historical ? "历届考题 · 已翻新" : "其它选择题与作答题"}</h1><p>${historical ? "依原讲义标示年份呈现，并依据现行课本章节重新归类。资料夹虽名为2012–2021，个别题目依原文件显示2010或2022，网页不擅自更改年份。" : "新增资料独立使用，不并入原有340题；旧课本章节已经重新映射到现行章节。"}</p></div><div class="bank-stats"><span><b>${all.length}</b>题目</span><span><b>${new Set(all.map(item => item.sourceFile)).size}</b>资料包</span><span><b>${records.length}</b>筛选结果</span></div></section>${bankQuizHtml(kind)}<section class="bank-toolbar" data-bank-kind="${kind}"><label><span>关键词</span><input type="search" data-bank-filter="query" value="${esc(state.query)}" placeholder="搜寻题目或概念"></label>${historical ? `<label><span>年份</span><select data-bank-filter="year"><option value="all">全部年份</option>${years.map(year => `<option value="${esc(year)}" ${state.year === year ? "selected" : ""}>${esc(year)}</option>`).join("")}</select></label>` : ""}<label><span>现行章节</span><select data-bank-filter="chapter"><option value="all">全部章节</option>${chapters.map(item => { const value = `${item.currentBook}-${item.currentChapter}`; return `<option value="${value}" ${state.chapter === value ? "selected" : ""}>第${item.currentBook}册第${item.currentChapter}章 ${esc(item.currentTitle)}</option>`; }).join("")}</select></label><label><span>题型</span><select data-bank-filter="type"><option value="all">全部题型</option>${types.map(type => `<option value="${esc(type)}" ${state.type === type ? "selected" : ""}>${esc(type)}</option>`).join("")}</select></label><button type="button" data-bank-reset>清除筛选</button><button class="primary" type="button" data-bank-quiz-generate="${kind}">随机10题</button></section><section class="bank-results" id="bankResultsContainer"><div class="section-title"><p class="eyebrow">网页题库</p><h2>显示 ${records.length} 题</h2><p>${mode === "teacher" ? "教师模式默认展开答案，并显示来源文件供备课核对。" : "学生先独立作答，再按需要展开答案。"}</p></div>${visible.length ? visible.map((record, index) => bankRecordCard(record, start + index + 1, kind)).join("") : `<div class="bank-empty"><b>没有符合条件的题目</b><p>请清除部分筛选或缩短关键词。</p></div>`}</section><div id="bankPaginationContainer">${pages > 1 ? `<nav class="bank-pagination" aria-label="题库分页"><button data-bank-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>上一页</button><span>第 ${state.page} / ${pages} 页</span><button data-bank-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""}>下一页</button></nav>` : ""}</div>${footer()}</div>`;
  }

  function notFound() {
    return `<div class="page"><section class="home-intro"><h1>找不到这个章节</h1><a class="button primary" href="#/home">返回课程首页</a></section>${footer()}</div>`;
  }

  function closeDrawer() { sidebar.classList.remove("open"); backdrop.hidden = true; }
  function openDrawer() { sidebar.classList.add("open"); backdrop.hidden = false; }

  function render(reset = true) {
    const prevScrollY = window.scrollY;
    closeImageDialog();
    closePdfDialog();
    const hashRoute = (location.hash || "#/home").slice(2);
    const [routePath, routeQuery = ""] = hashRoute.split("?");
    const route = routePath.split("/");
    if (route[0] === "bank" && bankStates[route[1]] && routeQuery) {
      const query = new URLSearchParams(routeQuery).get("q");
      if (query) bankStates[route[1]].query = query;
    }
    main.innerHTML = route[0] === "chapter" ? chapterPage(Number(route[1]), Number(route[2])) : route[0] === "bank" && bankStates[route[1]] ? questionBankPage(route[1]) : route[0] === "home" || !route[0] ? home() : notFound();
    renderSidebar();
    setAppearance();
    closeDrawer();
    if (route[0] === "chapter") {
      const key = `${Number(route[1])}-${Number(route[2])}`;
      if (reviewData(key)) renderInteractiveReview(key);
    }
    if (reset) window.scrollTo(0, 0);
    else window.scrollTo(0, prevScrollY);
  }

  document.addEventListener("click", event => {
    if (event.target.closest(".bank-toolbar select, .bank-toolbar input") || event.target.tagName === "OPTION") return;
    if (event.target.closest("[data-search-result]")) closeSearchResults();
    else if (!event.target.closest(".site-search")) closeSearchResults();
    const bankRoot = event.target.closest("[data-bank-kind]");
    const quizGenerate = event.target.closest("[data-bank-quiz-generate]");
    if (quizGenerate) {
      makeBankQuiz(quizGenerate.dataset.bankQuizGenerate);
      render(false);
      main.querySelector(".bank-quiz")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (event.target.closest("[data-bank-quiz-close]")) { bankQuiz = null; render(false); return; }
    const cardChoice = event.target.closest("[data-card-choice]");
    if (cardChoice) {
      const [cardId, letter] = cardChoice.dataset.cardChoice.split(":");
      const kind = (location.hash.match(/^#\/bank\/(historical|supplemental)/) || [])[1];
      if (kind && bankStates[kind]) {
        bankStates[kind].userChoices[cardId] = letter;
        updateBankResults(kind);
      }
      return;
    }
    const bankQuizChoice = event.target.closest("[data-bank-quiz-choice]");
    if (bankQuizChoice && bankQuiz && !bankQuiz.submitted) {
      const [questionIndex, optionIndex] = bankQuizChoice.dataset.bankQuizChoice.split(":").map(Number);
      bankQuiz.answers[questionIndex] = optionIndex;
      render(false);
      return;
    }
    if (event.target.closest("[data-bank-quiz-submit]") && bankQuiz) {
      bankQuiz.submitted = true;
      bankQuiz.score = bankQuiz.questions.reduce((score, question, index) => score + ("ABCD"[bankQuiz.answers[index]] === question.answer ? 1 : 0), 0);
      render(false);
      return;
    }
    if (bankRoot && event.target.closest("[data-bank-reset]")) {
      bankStates[bankRoot.dataset.bankKind] = { year: "all", chapter: "all", type: "all", query: "", page: 1 };
      bankQuiz = null;
      render(false);
      return;
    }
    const bankPageButton = event.target.closest("[data-bank-page]");
    if (bankPageButton) {
      const kind = (location.hash.match(/^#\/bank\/(historical|supplemental)/) || [])[1];
      if (kind) { bankStates[kind].page = Number(bankPageButton.dataset.bankPage); render(false); main.scrollTo(0, 0); }
      return;
    }
    const reviewRoot = event.target.closest("[data-review-key]");
    if (reviewRoot) {
      const key = reviewRoot.dataset.reviewKey;
      const data = reviewData(key);
      const flashState = flashStateFor(key);
      if (event.target.closest("[data-flash-flip]")) {
        flashState.flipped = !flashState.flipped;
        renderFlashPanel(key);
        return;
      }
      if (event.target.closest("[data-flash-prev]")) {
        flashState.index = (flashState.index - 1 + flashState.order.length) % flashState.order.length;
        flashState.flipped = false;
        renderFlashPanel(key);
        return;
      }
      if (event.target.closest("[data-flash-next]")) {
        flashState.index = (flashState.index + 1) % flashState.order.length;
        flashState.flipped = false;
        renderFlashPanel(key);
        return;
      }
      if (event.target.closest("[data-flash-shuffle]")) {
        flashState.order = shuffled(data.flashcards.map(card => card.id));
        flashState.index = 0;
        flashState.flipped = false;
        renderFlashPanel(key);
        return;
      }
      const markButton = event.target.closest("[data-flash-mark]");
      if (markButton) {
        const currentId = flashState.order[flashState.index];
        if (markButton.dataset.flashMark === "mastered") flashState.mastered.add(currentId);
        else flashState.mastered.delete(currentId);
        localStorage.setItem(`business-flash-mastered-${key}`, JSON.stringify([...flashState.mastered]));
        flashState.index = (flashState.index + 1) % flashState.order.length;
        flashState.flipped = false;
        renderFlashPanel(key);
        return;
      }
      if (event.target.closest("[data-quiz-generate]")) {
        makeQuiz(key);
        renderQuizPanel(key);
        return;
      }
      const quizChoice = event.target.closest("[data-quiz-choice]");
      if (quizChoice) {
        const state = quizStates[key];
        if (!state || state.submitted) return;
        const [questionIndex, optionIndex] = quizChoice.dataset.quizChoice.split(":").map(Number);
        state.answers[questionIndex] = optionIndex;
        renderQuizPanel(key);
        return;
      }
      if (event.target.closest("[data-quiz-submit]")) {
        const state = quizStates[key];
        if (!state || Object.keys(state.answers).length < 10) return;
        state.submitted = true;
        const score = state.questions.reduce((sum, question, index) => sum + (state.answers[index] === question.answer ? 1 : 0), 0);
        localStorage.setItem(`business-quiz-latest-${key}`, JSON.stringify({ score, total: 10, completedAt: new Date().toISOString() }));
        renderQuizPanel(key);
        return;
      }
    }
    const questionJump = event.target.closest("[data-question-target]");
    if (questionJump) {
      const target = document.getElementById(questionJump.dataset.questionTarget);
      if (target) {
        main.querySelectorAll("[data-question-target]").forEach(button => button.classList.toggle("active", button === questionJump));
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    const teacherAction = event.target.closest("[data-teacher-action]");
    if (teacherAction) {
      const action = teacherAction.dataset.teacherAction;
      if (action === "questions") {
        main.querySelector(".question-bank-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        main.querySelectorAll(".answer-panel").forEach(panel => { panel.open = action === "answers-show"; });
        if (action === "answers-show") main.querySelectorAll(".answer-panel details").forEach(panel => { panel.open = true; });
      }
      return;
    }
    const pdfButton = event.target.closest("[data-pdf-open]");
    if (pdfButton) { openPdfDialog(pdfButton); return; }
    const visualButton = event.target.closest("[data-image-src]");
    if (visualButton) { openImageDialog(visualButton); return; }
    const detailsSummary = event.target.closest(".answer-panel > summary, .more-questions > summary, .bank-answer > summary, .bank-answer-summary");
    if (detailsSummary) { event.preventDefault(); detailsSummary.parentElement.open = !detailsSummary.parentElement.open; return; }
    const modeButton = event.target.closest("[data-mode]");
    if (modeButton) { mode = modeButton.dataset.mode; localStorage.setItem("business-mode", mode); render(false); return; }
    if (event.target.closest(".sidebar a")) closeDrawer();
  });

  document.addEventListener("change", event => {
    const bankFilter = event.target.closest("[data-bank-filter]");
    if (bankFilter) {
      const root = bankFilter.closest("[data-bank-kind]");
      if (root) {
        const filterName = bankFilter.dataset.bankFilter;
        if (filterName !== "query") {
          bankStates[root.dataset.bankKind][filterName] = bankFilter.value;
          bankStates[root.dataset.bankKind].page = 1;
          bankQuiz = null;
          updateBankResults(root.dataset.bankKind);
        }
      }
      return;
    }
    const answer = event.target.closest("[data-quiz-answer]");
    if (!answer) return;
    const root = answer.closest("[data-review-key]");
    const key = root?.dataset.reviewKey;
    const state = quizStates[key];
    if (!state || state.submitted) return;
    state.answers[Number(answer.dataset.quizAnswer)] = Number(answer.value);
    renderQuizPanel(key);
  });

  document.addEventListener("input", event => {
    const bankFilter = event.target.closest('[data-bank-filter="query"]');
    if (!bankFilter) return;
    const root = bankFilter.closest("[data-bank-kind]");
    if (!root) return;
    const kind = root.dataset.bankKind;
    bankStates[kind].query = bankFilter.value;
    bankStates[kind].page = 1;
    window.clearTimeout(bankFilter._bankTimer);
    bankFilter._bankTimer = window.setTimeout(() => updateBankResults(kind), 180);
  });

  siteSearchInput.addEventListener("input", renderSearchResults);
  siteSearchInput.addEventListener("focus", () => { if (siteSearchInput.value.trim()) renderSearchResults(); });
  siteSearchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeSearchResults(); siteSearchInput.blur(); }
    if (event.key === "Enter") {
      const firstResult = siteSearchResults.querySelector("[data-search-result]");
      if (firstResult) { event.preventDefault(); firstResult.click(); }
    }
  });
  siteSearchClear.addEventListener("click", () => { siteSearchInput.value = ""; renderSearchResults(); siteSearchInput.focus(); });
  document.getElementById("themeButton").addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("business-theme", theme); setAppearance(); });
  sidebarToggle?.addEventListener("click", toggleSidebar);
  document.getElementById("mobileMenuButton")?.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", closeDrawer);
  imageDialogClose.addEventListener("click", closeImageDialog);
  imageDialog.addEventListener("click", event => { if (event.target === imageDialog) closeImageDialog(); });
  imageDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    imageDialogImage.removeAttribute("src");
    const focusTarget = main.querySelector("[data-image-return-focus]") || imageReturnFocus;
    imageReturnFocus = null;
    setTimeout(() => {
      if (focusTarget?.isConnected) {
        focusTarget.focus({ preventScroll: true });
        focusTarget.removeAttribute("data-image-return-focus");
      }
    }, 120);
  });
  pdfDialogClose.addEventListener("click", closePdfDialog);
  pdfDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    pdfDialogFrame.removeAttribute("src");
  });
  const topbarClock = document.getElementById("topbarClock");
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  function updateTopbarClock() {
    if (!topbarClock) return;
    const now = new Date();
    // Format to Asia/Kuala_Lumpur (Malaysia GMT+8)
    const options = { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: true };
    const formatter = new Intl.DateTimeFormat("zh-Hans-MY", options);
    const parts = formatter.formatToParts(now);
    const getVal = type => parts.find(p => p.type === type)?.value || "";
    const weekday = weekdays[now.getDay()];
    const dateStr = `${getVal("year")}年${getVal("month")}月${getVal("day")}日`;
    const period = getVal("dayPeriod").toUpperCase();
    const hourStr = String(Number(getVal("hour"))).padStart(2, "0");
    const minStr = String(Number(getVal("minute"))).padStart(2, "0");
    topbarClock.textContent = `${dateStr} ${weekday} ${hourStr}:${minStr} ${period}`;
  }
  updateTopbarClock();
  setInterval(updateTopbarClock, 1000);

  window.addEventListener("hashchange", () => render(true));
  render(true);
})();
