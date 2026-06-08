const storeKey = "manifestation-reminder-v1";
const affirmationBaseline = 1000;

const defaults = {
  manifests: [],
  entries: []
};

let state = loadState();
let activeManifestId = null;
let pendingBeliefShift = null;
let pendingSaveAfterWorryTest = false;

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  showProgress: document.querySelector("#showProgress"),
  showHistory: document.querySelector("#showHistory"),
  showAutomation: document.querySelector("#showAutomation"),
  progressView: document.querySelector("#progressView"),
  historyView: document.querySelector("#historyView"),
  automationView: document.querySelector("#automationView"),
  overallPercent: document.querySelector("#overallPercent"),
  overallLabel: document.querySelector("#overallLabel"),
  overallFill: document.querySelector("#overallFill"),
  manifestText: document.querySelector("#manifestText"),
  addManifest: document.querySelector("#addManifest"),
  manifestList: document.querySelector("#manifestList"),
  beliefDialog: document.querySelector("#beliefDialog"),
  beliefThing: document.querySelector("#beliefThing"),
  beliefValue: document.querySelector("#beliefValue"),
  beliefValueText: document.querySelector("#beliefValueText"),
  testDialog: document.querySelector("#testDialog"),
  testThing: document.querySelector("#testThing"),
  testEase: document.querySelector("#testEase"),
  testEvidence: document.querySelector("#testEvidence"),
  testChoice: document.querySelector("#testChoice"),
  gratitudeInput: document.querySelector("#gratitudeInput"),
  beliefInput: document.querySelector("#beliefInput"),
  worryInput: document.querySelector("#worryInput"),
  oppositeBeliefInput: document.querySelector("#oppositeBeliefInput"),
  worryReminder: document.querySelector("#worryReminder"),
  oppositeReminder: document.querySelector("#oppositeReminder"),
  testWorry: document.querySelector("#testWorry"),
  beliefShiftStatus: document.querySelector("#beliefShiftStatus"),
  worryTestDialog: document.querySelector("#worryTestDialog"),
  worryTestText: document.querySelector("#worryTestText"),
  cancelManifestDialog: document.querySelector("#cancelManifestDialog"),
  cancelManifestText: document.querySelector("#cancelManifestText"),
  saveEntry: document.querySelector("#saveEntry"),
  clearEntries: document.querySelector("#clearEntries"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  importFile: document.querySelector("#importFile"),
  backupStatus: document.querySelector("#backupStatus"),
  entryList: document.querySelector("#entryList"),
  trendChart: document.querySelector("#trendChart"),
  trendSummary: document.querySelector("#trendSummary"),
  beliefTable: document.querySelector("#beliefTable"),
  automationPreview: document.querySelector("#automationPreview"),
  copyAutomation: document.querySelector("#copyAutomation"),
  copyAppLink: document.querySelector("#copyAppLink"),
  toast: document.querySelector("#toast")
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short"
});
const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit"
});

init();

function init() {
  state.manifests = normalizeManifests(state);
  updateTodayLabel();
  renderManifests();
  renderEntries();
  renderAutomation();
  bindEvents();
  updateReverseReminder();
  setInterval(updateTodayLabel, 60000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function updateTodayLabel() {
  els.todayLabel.textContent = dateFormatter.format(new Date());
}

function bindEvents() {
  els.showProgress.addEventListener("click", () => switchView("progress"));
  els.showHistory.addEventListener("click", () => switchView("history"));
  els.showAutomation.addEventListener("click", () => switchView("automation"));
  els.copyAutomation.addEventListener("click", () => copyText(getAutomationText()));
  els.copyAppLink.addEventListener("click", () => copyText(location.href));
  els.worryInput.addEventListener("input", () => {
    pendingBeliefShift = null;
    updateReverseReminder();
  });
  els.oppositeBeliefInput.addEventListener("input", () => {
    pendingBeliefShift = null;
    updateReverseReminder();
  });
  els.testWorry.addEventListener("click", () => openWorryTest(false));
  els.worryTestDialog.addEventListener("close", () => {
    if (els.worryTestDialog.returnValue === "changed") {
      pendingBeliefShift = 1;
      els.beliefShiftStatus.textContent = "测试结果：有改变，信念 +1";
    }
    if (els.worryTestDialog.returnValue === "unchanged") {
      pendingBeliefShift = -1;
      els.beliefShiftStatus.textContent = "测试结果：没有改变，信念 -1";
    }
    if (pendingSaveAfterWorryTest && pendingBeliefShift !== null) {
      pendingSaveAfterWorryTest = false;
      saveEntry();
      return;
    }
    pendingSaveAfterWorryTest = false;
  });
  els.cancelManifestDialog.addEventListener("close", () => {
    if (els.cancelManifestDialog.returnValue !== "confirm") return;
    cancelManifest(activeManifestId);
  });

  els.addManifest.addEventListener("click", addManifest);
  els.manifestText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addManifest();
  });

  els.beliefValue.addEventListener("input", () => {
    els.beliefValueText.textContent = els.beliefValue.value;
  });

  els.beliefDialog.addEventListener("close", () => {
    if (els.beliefDialog.returnValue !== "save") return;
    updateManifest(activeManifestId, {
      belief: clamp(Number.parseInt(els.beliefValue.value, 10), 0, 100)
    });
    persist("相信度已确认");
    renderManifests();
  });

  els.testDialog.addEventListener("close", () => {
    if (els.testDialog.returnValue !== "save") return;
    updateManifest(activeManifestId, {
      test: {
        ease: clamp(Number.parseInt(els.testEase.value, 10), 0, 100),
        evidence: clamp(Number.parseInt(els.testEvidence.value, 10), 0, 100),
        choice: clamp(Number.parseInt(els.testChoice.value, 10), 0, 100)
      }
    });
    persist("测试已确认");
    renderManifests();
  });

  els.saveEntry.addEventListener("click", saveEntry);
  els.exportData.addEventListener("click", exportBackup);
  els.importData.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importBackup);
  els.clearEntries.addEventListener("click", () => {
    state.entries = [];
    persist("记录已清空");
    renderEntries();
  });
}

function switchView(view) {
  const isHistory = view === "history";
  const isAutomation = view === "automation";
  els.progressView.classList.toggle("active", !isHistory && !isAutomation);
  els.historyView.classList.toggle("active", isHistory);
  els.automationView.classList.toggle("active", isAutomation);
  els.showProgress.classList.toggle("active", !isHistory && !isAutomation);
  els.showHistory.classList.toggle("active", isHistory);
  els.showAutomation.classList.toggle("active", isAutomation);
  if (isHistory) renderEntries();
  if (isAutomation) renderAutomation();
}

function addManifest() {
  const text = els.manifestText.value.trim();
  if (!text) {
    showToast("先写下一个显化目标");
    return;
  }

  state.manifests.unshift(createManifest(text));
  els.manifestText.value = "";
  persist("显化目标已添加");
  renderManifests();
}

function renderManifests() {
  state.manifests = normalizeManifests(state);
  els.manifestList.innerHTML = "";

  const scores = state.manifests.map(getManifestScore);
  const overall = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score.total, 0) / scores.length)
    : 0;

  els.overallPercent.textContent = overall;
  els.overallFill.style.width = `${overall}%`;
  els.overallLabel.textContent = scores.length
    ? `${scores.length} 个目标 · 平均显化进度`
    : "添加一个显化目标";

  state.manifests.forEach((item) => {
    const score = getManifestScore(item);
    const affirmation = getAffirmation(item.text);
    const todoText = getTodoText(item, score, affirmation);
    const status = score.total >= 100 ? "派送中" : "进行中";
    const card = document.createElement("article");
    card.className = "manifest-item";
    card.innerHTML = `
      <div class="todo-progress-row">
        <div class="todo-ring" style="--percent: ${score.total}" aria-hidden="true">
          <span></span>
        </div>
        <div class="todo-main">
          <div class="manifest-top">
            <strong>${escapeHtml(item.text)}</strong>
            <span class="manifest-percent">${score.total}%</span>
          </div>
          <div class="delivery-status ${score.total >= 100 ? "ready" : ""}">${status}</div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="width: ${score.total}%"></div>
          </div>
        </div>
      </div>
      <div class="affirmation-box">
        <span>A肯定语</span>
        <strong>${escapeHtml(affirmation)}</strong>
      </div>
      <div class="affirmation-count">
        <span>A肯定语次数：${item.affirmations}</span>
        <button class="text-button" data-action="addAffirmation" data-amount="1" data-id="${item.id}" type="button">+1</button>
        <button class="text-button" data-action="addAffirmation" data-amount="10" data-id="${item.id}" type="button">+10</button>
        <button class="text-button" data-action="addAffirmation" data-amount="100" data-id="${item.id}" type="button">+100</button>
      </div>
      <div class="manifest-metrics">
        <span>相信 ${item.belief}%</span>
        <span>测试 ${score.test}%</span>
        <span>A练习 ${score.affirmation}%</span>
        <span>时间 ${score.time}%</span>
      </div>
      <div class="lockscreen-line">锁屏默认显示：${escapeHtml(todoText)}</div>
      <div class="manifest-actions">
        <button class="text-button" data-action="belief" data-id="${item.id}" type="button">相信</button>
        <button class="text-button" data-action="test" data-id="${item.id}" type="button">测试</button>
        <button class="text-button subtle" data-action="cancel" data-id="${item.id}" type="button">取消目标</button>
      </div>
    `;
    els.manifestList.append(card);
  });

  if (!state.manifests.length) {
    els.manifestList.innerHTML = `<p class="empty">还没有显化目标</p>`;
  }

  els.manifestList.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", handleManifestAction);
  });
  renderAutomation();
}

function renderAutomation() {
  if (!els.automationPreview) return;
  els.automationPreview.textContent = getAutomationText();
}

function handleManifestAction(event) {
  const action = event.currentTarget.dataset.action;
  const id = event.currentTarget.dataset.id;
  const item = state.manifests.find((manifest) => manifest.id === id);
  if (!item) return;

  if (action === "belief") {
    activeManifestId = id;
    els.beliefThing.textContent = item.text;
    els.beliefValue.value = item.belief;
    els.beliefValueText.textContent = item.belief;
    els.beliefDialog.showModal();
  }

  if (action === "test") {
    activeManifestId = id;
    els.testThing.textContent = item.text;
    els.testEase.value = item.test.ease;
    els.testEvidence.value = item.test.evidence;
    els.testChoice.value = item.test.choice;
    els.testDialog.showModal();
  }

  if (action === "addAffirmation") {
    const amount = Number.parseInt(event.currentTarget.dataset.amount, 10) || 1;
    updateManifest(id, { affirmations: item.affirmations + amount });
    persist(`A肯定语次数 +${amount}`);
    renderManifests();
  }

  if (action === "cancel") {
    activeManifestId = id;
    els.cancelManifestText.textContent = item.text;
    els.cancelManifestDialog.showModal();
  }
}

function cancelManifest(id) {
  state.manifests = state.manifests.map((item) =>
    item.id === id
      ? {
          ...item,
          belief: 0,
          affirmations: 0,
          test: { ease: 0, evidence: 0, choice: 0 },
          startDate: todayString(),
          days: 21
        }
      : item
  );
  persist("目标已取消，进度已清零");
  renderManifests();
}

function createManifest(text) {
  return {
    id: crypto.randomUUID(),
    text,
    belief: 50,
    affirmations: 0,
    test: {
      ease: 50,
      evidence: 50,
      choice: 50
    },
    startDate: todayString(),
    days: 21
  };
}

function updateManifest(id, patch) {
  state.manifests = state.manifests.map((item) =>
    item.id === id ? { ...item, ...patch } : item
  );
}

function getManifestScore(item) {
  const test = Math.round((item.test.ease + item.test.evidence + item.test.choice) / 3);
  const time = getTimePercent(item.startDate, item.days);
  const affirmation = clamp(Math.round((item.affirmations / affirmationBaseline) * item.belief), 0, 100);
  const total = clamp(Math.round(item.belief * 0.4 + test * 0.25 + affirmation * 0.2 + time * 0.15), 0, 100);
  return { test, time, affirmation, total };
}

function getAffirmation(text) {
  return `我允许${text}自然发生。`;
}

function getTodoText(item, score, affirmation) {
  const status = score.total >= 100 ? "派送中" : "今天记录一次";
  return `${score.total}%｜${affirmation}｜${status}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("待办样式文字已复制");
  } catch {
    showToast("已生成待办样式文字");
  }
}

function renderEntries() {
  els.entryList.innerHTML = "";
  updateBackupStatus();
  renderBeliefTrend();
  state.entries.slice(0, 8).forEach((entry) => {
    const item = document.createElement("article");
    item.className = "entry-item";
    item.innerHTML = `
      <strong>${escapeHtml(entry.gratitude || "今日记录")}</strong>
      <span class="entry-meta">${escapeHtml(formatEntryDate(entry.createdAt))} · ${escapeHtml(getEntryModule(entry))}${getEntryShiftLabel(entry)}</span>
      ${entry.belief ? `<p>我相信：${escapeHtml(entry.belief)}</p>` : ""}
      ${entry.worry ? `<p>担心：${escapeHtml(entry.worry)}</p>` : ""}
      ${entry.oppositeBelief ? `<p>反面信念：${escapeHtml(entry.oppositeBelief)}</p>` : ""}
      ${entry.worryReminder ? `<p>担心提示：${escapeHtml(entry.worryReminder)}</p>` : ""}
      ${entry.oppositeReminder ? `<p>信念提示：${escapeHtml(entry.oppositeReminder)}</p>` : ""}
      ${entry.reverseReminder ? `<p>旧反向提示：${escapeHtml(entry.reverseReminder)}</p>` : ""}
      ${Number.isFinite(entry.beliefShift) && entry.beliefShift !== 0 ? `<p>信念测试：${entry.beliefShift > 0 ? "+1" : "-1"}</p>` : ""}
    `;
    els.entryList.append(item);
  });

  if (!state.entries.length) {
    els.entryList.innerHTML = `<p class="empty">历史里还没有记录</p>`;
  }
}

function updateBackupStatus() {
  if (!els.backupStatus) return;
  const manifests = state.manifests.length;
  const entries = state.entries.length;
  els.backupStatus.textContent = `本机已自动保存：${manifests} 个目标 · ${entries} 条记录`;
}

function exportBackup() {
  const backup = {
    app: "manifestation-reminder",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `显化Mytri-备份-${todayString()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("备份文件已生成，可保存到 iCloud");
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const imported = parsed.data || parsed;
      if (!Array.isArray(imported.manifests) && !Array.isArray(imported.entries)) {
        throw new Error("invalid backup");
      }
      state = {
        ...defaults,
        manifests: Array.isArray(imported.manifests) ? imported.manifests : [],
        entries: Array.isArray(imported.entries) ? imported.entries : []
      };
      state.manifests = normalizeManifests(state);
      saveState();
      renderManifests();
      renderEntries();
      showToast("备份已导入");
    } catch {
      showToast("这个文件不是可用的备份");
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function saveEntry() {
  const gratitude = els.gratitudeInput.value.trim();
  const belief = els.beliefInput.value.trim();
  const worry = els.worryInput.value.trim();
  const oppositeBelief = els.oppositeBeliefInput.value.trim();
  const worryReminder = getWorryReminder(worry);
  const oppositeReminder = getOppositeReminder(oppositeBelief);

  if (!gratitude && !belief && !worry && !oppositeBelief) {
    showToast("先写一点内容");
    return;
  }

  if ((worry || oppositeBelief) && pendingBeliefShift === null) {
    pendingSaveAfterWorryTest = true;
    openWorryTest(true);
    return;
  }

  const beliefShift = getBeliefShift(belief, worry, oppositeBelief);

  state.entries.unshift({
    id: crypto.randomUUID(),
    gratitude,
    belief,
    worry,
    oppositeBelief,
    worryReminder,
    oppositeReminder,
    beliefShift,
    module: getEntryModuleFromFields(belief, worry, oppositeBelief),
    createdAt: Date.now()
  });
  state.entries = state.entries.slice(0, 30);
  if (state.manifests.length) {
    state.manifests[0].affirmations = Math.max(0, state.manifests[0].affirmations + beliefShift);
  }

  els.gratitudeInput.value = "";
  els.beliefInput.value = "";
  els.worryInput.value = "";
  els.oppositeBeliefInput.value = "";
  pendingBeliefShift = null;
  updateReverseReminder();
  persist(getEntryToast(beliefShift));
  renderManifests();
  renderEntries();
}

function updateReverseReminder() {
  const worry = els.worryInput.value.trim();
  const oppositeBelief = els.oppositeBeliefInput.value.trim();
  els.worryReminder.textContent = getWorryReminder(worry) || "写下担心后生成担心提示";
  els.oppositeReminder.textContent = getOppositeReminder(oppositeBelief) || "写下反面信念后生成信念提示";
  els.beliefShiftStatus.textContent = "测试后决定 +1 或 -1";
}

function openWorryTest(fromSave) {
  const worry = els.worryInput.value.trim();
  const oppositeBelief = els.oppositeBeliefInput.value.trim();
  const reminder = [getWorryReminder(worry), getOppositeReminder(oppositeBelief)]
    .filter(Boolean)
    .join(" ");
  if (!reminder) {
    showToast("先写下担心或反面信念");
    return;
  }
  pendingSaveAfterWorryTest = fromSave;
  els.worryTestText.textContent = reminder;
  els.worryTestDialog.showModal();
}

function getWorryReminder(worry) {
  if (worry) return `我不担心${worry}。`;
  return "";
}

function getOppositeReminder(oppositeBelief) {
  if (oppositeBelief) return `我不再选择相信：${oppositeBelief}。`;
  return "";
}

function getBeliefShift(belief, worry, oppositeBelief) {
  if (worry || oppositeBelief) return pendingBeliefShift || -1;
  if (belief) return 1;
  return 0;
}

function getEntryToast(shift) {
  if (shift > 0) return "已写入记录，信念 +1";
  if (shift < 0) return "已写入记录，信念 -1";
  return "已写入记录";
}

function renderBeliefTrend() {
  const points = state.entries
    .filter((entry) => Number.isFinite(entry.beliefShift))
    .slice()
    .reverse();

  if (!points.length) {
    els.trendSummary.textContent = "等待记录";
    els.trendChart.innerHTML = `<p class="empty">写入记录后生成信念趋势</p>`;
    els.beliefTable.innerHTML = "";
    return;
  }

  const total = points.reduce((sum, entry) => sum + entry.beliefShift, 0);
  els.trendSummary.textContent = `累计 ${total >= 0 ? "+" : ""}${total}`;
  els.trendChart.innerHTML = getTrendSvg(points);
  els.beliefTable.innerHTML = `
    <div class="data-row header">
      <span>日期</span><span>模块</span><span>变化</span><span>内容</span>
    </div>
    ${points.slice().reverse().map((entry) => `
      <div class="data-row">
        <span>${escapeHtml(formatShortDate(entry.createdAt))}</span>
        <span>${escapeHtml(getEntryModule(entry))}</span>
        <span>${escapeHtml(formatShift(entry.beliefShift))}</span>
        <span>${escapeHtml(entry.belief || entry.worry || entry.oppositeBelief || "-")}</span>
      </div>
    `).join("")}
  `;
}

function getTrendSvg(points) {
  const width = 320;
  const height = 150;
  const pad = 18;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  let running = 0;
  const cumulative = points.map((entry) => {
    running += entry.beliefShift;
    return running;
  });
  const min = Math.min(-1, ...cumulative);
  const max = Math.max(1, ...cumulative);
  const range = max - min || 1;
  const coords = points.map((entry, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index / (points.length - 1)) * usableWidth;
    const y = pad + (1 - (cumulative[index] - min) / range) * usableHeight;
    return { x, y, value: cumulative[index] };
  });
  const line = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const dots = coords.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"><title>${point.value}%</title></circle>`).join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="信念趋势线">
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" />
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" />
      <polyline points="${line}" />
      ${dots}
    </svg>
  `;
}

function getEntryModule(entry) {
  if (entry.module) return entry.module;
  if (entry.belief) return "我相信";
  if (entry.worry || entry.oppositeBelief) return "我不相信";
  return "记录";
}

function getEntryModuleFromFields(belief, worry, oppositeBelief) {
  if (worry || oppositeBelief) return "我不相信";
  if (belief) return "我相信";
  return "记录";
}

function getEntryShiftLabel(entry) {
  if (!Number.isFinite(entry.beliefShift) || entry.beliefShift === 0) return "";
  return ` · 信念 ${formatShift(entry.beliefShift)}`;
}

function formatShift(value) {
  if (!Number.isFinite(value) || value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

function getAutomationText() {
  const items = state.manifests.length ? state.manifests : [createManifest("我的显化目标")];
  const lines = items.slice(0, 5).map((item) => {
    const score = getManifestScore(item);
    return getTodoText(item, score, getAffirmation(item.text));
  });
  return [
    "快捷指令名称：显化Mytri",
    "",
    "快捷指令动作清单：",
    "1. 文本：粘贴下面的显化提醒文字。",
    "2. 显示通知：使用上一步文本作为通知内容。",
    "3. URL：粘贴下面的 App 链接。",
    "4. 打开 URL：打开上一步 URL。",
    "",
    "个人自动化设置：",
    "1. 在快捷指令 App 里进入自动化。",
    "2. 新建个人自动化，选择每天固定时间。",
    "3. 添加操作：运行快捷指令。",
    "4. 选择快捷指令：显化Mytri。",
    "5. 关闭运行前询问，保存。",
    "",
    "显化提醒文字：",
    ...lines,
    "",
    `App 链接：${location.href}`
  ].join("\n");
}

function formatEntryDate(value) {
  const date = new Date(value);
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  return `${dateText} ${timeFormatter.format(date)}`;
}

function formatShortDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function normalizeManifests(nextState) {
  if (Array.isArray(nextState.manifests)) {
    return nextState.manifests.map((item) => normalizeManifest(item));
  }

  if (nextState.progress) {
    const migrated = createManifest("我的显化目标");
    migrated.belief = Number.isFinite(Number.parseInt(nextState.progress.belief, 10))
      ? clamp(Number.parseInt(nextState.progress.belief, 10), 0, 100)
      : 50;
    migrated.startDate = isDateString(nextState.progress.startDate)
      ? nextState.progress.startDate
      : todayString();
    migrated.days = Number.isFinite(Number.parseInt(nextState.progress.days, 10))
      ? clamp(Number.parseInt(nextState.progress.days, 10), 1, 999)
      : 21;
    return [migrated];
  }

  return [];
}

function normalizeManifest(item) {
  const normalized = createManifest(item?.text || "我的显化目标");
  const test = item?.test || {};
  normalized.id = item?.id || normalized.id;
  normalized.belief = Number.isFinite(Number.parseInt(item?.belief, 10))
    ? clamp(Number.parseInt(item.belief, 10), 0, 100)
    : 50;
  normalized.affirmations = Number.isFinite(Number.parseInt(item?.affirmations, 10))
    ? Math.max(0, Number.parseInt(item.affirmations, 10))
    : 0;
  normalized.test = {
    ease: Number.isFinite(Number.parseInt(test.ease, 10)) ? clamp(Number.parseInt(test.ease, 10), 0, 100) : 50,
    evidence: Number.isFinite(Number.parseInt(test.evidence, 10)) ? clamp(Number.parseInt(test.evidence, 10), 0, 100) : 50,
    choice: Number.isFinite(Number.parseInt(test.choice, 10)) ? clamp(Number.parseInt(test.choice, 10), 0, 100) : 50
  };
  normalized.startDate = isDateString(item?.startDate) ? item.startDate : todayString();
  normalized.days = Number.isFinite(Number.parseInt(item?.days, 10))
    ? clamp(Number.parseInt(item.days, 10), 1, 999)
    : 21;
  return normalized;
}

function getTimePercent(startDate, days) {
  const start = parseLocalDate(startDate);
  const today = parseLocalDate(todayString());
  const elapsedDays = Math.floor((today - start) / 86400000);
  return clamp(Math.round((elapsedDays / days) * 100), 0, 100);
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function persist(message) {
  saveState();
  showToast(message);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1600);
}

function loadState() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(storeKey)) };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
