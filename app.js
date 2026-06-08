const storeKey = "manifestation-reminder-v1";
const affirmationBaseline = 1000;
const appVersion = "V2.1";
const appUrl = "https://917sus-bit.github.io/mytri/?v=2.1";
const surveyUrl = "https://zcn58ot3c768.feishu.cn/share/base/form/shrcnUWuibkRyfK97YNnbRAOaGA";

const defaults = {
  manifests: [],
  entries: []
};

let state = loadState();
let activeManifestId = null;
let pendingBeliefShift = null;
let pendingSaveAfterWorryTest = false;
let pendingReleaseShift = null;
let pendingReleaseChoice = "";
let pendingSaveAfterRelease = false;
let pendingRuminationShift = null;
let pendingRuminationChoice = "";
let pendingSaveAfterRumination = false;

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  showProgress: document.querySelector("#showProgress"),
  showRelease: document.querySelector("#showRelease"),
  showHistory: document.querySelector("#showHistory"),
  showAutomation: document.querySelector("#showAutomation"),
  progressView: document.querySelector("#progressView"),
  releaseView: document.querySelector("#releaseView"),
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
  releaseTopicInput: document.querySelector("#releaseTopicInput"),
  releaseBodyInput: document.querySelector("#releaseBodyInput"),
  releasePrompt: document.querySelector("#releasePrompt"),
  startRelease: document.querySelector("#startRelease"),
  releaseStatus: document.querySelector("#releaseStatus"),
  saveReleaseEntry: document.querySelector("#saveReleaseEntry"),
  ruminationLoopInput: document.querySelector("#ruminationLoopInput"),
  ruminationMeaningInput: document.querySelector("#ruminationMeaningInput"),
  ruminationActionInput: document.querySelector("#ruminationActionInput"),
  ruminationPrompt: document.querySelector("#ruminationPrompt"),
  startRumination: document.querySelector("#startRumination"),
  ruminationStatus: document.querySelector("#ruminationStatus"),
  worryTestDialog: document.querySelector("#worryTestDialog"),
  worryTestText: document.querySelector("#worryTestText"),
  releaseDialog: document.querySelector("#releaseDialog"),
  releaseGuideText: document.querySelector("#releaseGuideText"),
  releaseChoiceInput: document.querySelector("#releaseChoiceInput"),
  ruminationDialog: document.querySelector("#ruminationDialog"),
  ruminationGuideText: document.querySelector("#ruminationGuideText"),
  ruminationChoiceInput: document.querySelector("#ruminationChoiceInput"),
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
  lockscreenPreview: document.querySelector("#lockscreenPreview"),
  copyAutomation: document.querySelector("#copyAutomation"),
  copyLockscreenText: document.querySelector("#copyLockscreenText"),
  copySurveyLink: document.querySelector("#copySurveyLink"),
  surveyLink: document.querySelector("#surveyLink"),
  runLockscreenShortcut: document.querySelector("#runLockscreenShortcut"),
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
  updateReleasePrompt();
  updateRuminationPrompt();
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
  els.showRelease.addEventListener("click", () => switchView("release"));
  els.showHistory.addEventListener("click", () => switchView("history"));
  els.showAutomation.addEventListener("click", () => switchView("automation"));
  els.copyAutomation.addEventListener("click", () => copyText(getAutomationText()));
  els.copyLockscreenText.addEventListener("click", () => copyText(getLockscreenText()));
  els.copySurveyLink.addEventListener("click", () => copyText(surveyUrl));
  els.copyAppLink.addEventListener("click", () => copyText(appUrl));
  els.worryInput.addEventListener("input", () => {
    pendingBeliefShift = null;
    updateReverseReminder();
  });
  els.oppositeBeliefInput.addEventListener("input", () => {
    pendingBeliefShift = null;
    updateReverseReminder();
  });
  els.releaseTopicInput.addEventListener("input", () => {
    pendingReleaseShift = null;
    pendingReleaseChoice = "";
    updateReleasePrompt();
  });
  els.releaseBodyInput.addEventListener("input", () => {
    pendingReleaseShift = null;
    pendingReleaseChoice = "";
    updateReleasePrompt();
  });
  els.ruminationLoopInput.addEventListener("input", () => {
    pendingRuminationShift = null;
    pendingRuminationChoice = "";
    updateRuminationPrompt();
  });
  els.ruminationMeaningInput.addEventListener("input", () => {
    pendingRuminationShift = null;
    pendingRuminationChoice = "";
    updateRuminationPrompt();
  });
  els.ruminationActionInput.addEventListener("input", () => {
    pendingRuminationShift = null;
    pendingRuminationChoice = "";
    updateRuminationPrompt();
  });
  els.testWorry.addEventListener("click", () => openWorryTest(false));
  els.startRelease.addEventListener("click", () => openReleaseFlow(false));
  els.startRumination.addEventListener("click", () => openRuminationFlow(false));
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
  els.releaseDialog.addEventListener("close", () => {
    if (els.releaseDialog.returnValue === "released") {
      pendingReleaseShift = 1;
      pendingReleaseChoice = els.releaseChoiceInput.value.trim();
      els.releaseStatus.textContent = "释放结果：松动了，信念 +1";
    }
    if (els.releaseDialog.returnValue === "holding") {
      pendingReleaseShift = 0;
      pendingReleaseChoice = els.releaseChoiceInput.value.trim();
      els.releaseStatus.textContent = "释放结果：还在抓紧，保持 0";
    }
    if (pendingSaveAfterRelease && pendingReleaseShift !== null) {
      pendingSaveAfterRelease = false;
      saveEntry();
      return;
    }
    pendingSaveAfterRelease = false;
  });
  els.ruminationDialog.addEventListener("close", () => {
    if (els.ruminationDialog.returnValue === "settled") {
      pendingRuminationShift = 1;
      pendingRuminationChoice = els.ruminationChoiceInput.value.trim();
      els.ruminationStatus.textContent = "反刍结果：回来了，信念 +1";
    }
    if (els.ruminationDialog.returnValue === "spinning") {
      pendingRuminationShift = 0;
      pendingRuminationChoice = els.ruminationChoiceInput.value.trim();
      els.ruminationStatus.textContent = "反刍结果：还在循环，保持 0";
    }
    if (pendingSaveAfterRumination && pendingRuminationShift !== null) {
      pendingSaveAfterRumination = false;
      saveEntry();
      return;
    }
    pendingSaveAfterRumination = false;
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
  els.saveReleaseEntry.addEventListener("click", saveEntry);
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
  const isRelease = view === "release";
  const isHistory = view === "history";
  const isAutomation = view === "automation";
  els.progressView.classList.toggle("active", !isRelease && !isHistory && !isAutomation);
  els.releaseView.classList.toggle("active", isRelease);
  els.historyView.classList.toggle("active", isHistory);
  els.automationView.classList.toggle("active", isAutomation);
  els.showProgress.classList.toggle("active", !isRelease && !isHistory && !isAutomation);
  els.showRelease.classList.toggle("active", isRelease);
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
  els.surveyLink.href = surveyUrl;
  els.automationPreview.textContent = getAutomationText();
  els.lockscreenPreview.textContent = getLockscreenText();
  els.runLockscreenShortcut.href = getRunShortcutUrl(getLockscreenText());
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
    showToast("内容已复制");
  } catch {
    showToast("内容已生成");
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
      ${entry.releaseTopic ? `<p>释放：${escapeHtml(entry.releaseTopic)}</p>` : ""}
      ${entry.releaseBody ? `<p>身体感受：${escapeHtml(entry.releaseBody)}</p>` : ""}
      ${entry.releasePrompt ? `<p>释放提示：${escapeHtml(entry.releasePrompt)}</p>` : ""}
      ${entry.releaseChoice ? `<p>新选择：${escapeHtml(entry.releaseChoice)}</p>` : ""}
      ${entry.ruminationLoop ? `<p>反复念头：${escapeHtml(entry.ruminationLoop)}</p>` : ""}
      ${entry.ruminationMeaning ? `<p>想证明：${escapeHtml(entry.ruminationMeaning)}</p>` : ""}
      ${entry.ruminationPrompt ? `<p>反刍提示：${escapeHtml(entry.ruminationPrompt)}</p>` : ""}
      ${entry.ruminationChoice ? `<p>回到现在：${escapeHtml(entry.ruminationChoice)}</p>` : ""}
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
  const releaseTopic = els.releaseTopicInput.value.trim();
  const releaseBody = els.releaseBodyInput.value.trim();
  const ruminationLoop = els.ruminationLoopInput.value.trim();
  const ruminationMeaning = els.ruminationMeaningInput.value.trim();
  const ruminationAction = els.ruminationActionInput.value.trim();
  const worryReminder = getWorryReminder(worry);
  const oppositeReminder = getOppositeReminder(oppositeBelief);
  const releasePrompt = getReleasePrompt(releaseTopic, releaseBody);
  const ruminationPrompt = getRuminationPrompt(ruminationLoop, ruminationMeaning, ruminationAction);

  if (
    !gratitude &&
    !belief &&
    !worry &&
    !oppositeBelief &&
    !releaseTopic &&
    !releaseBody &&
    !ruminationLoop &&
    !ruminationMeaning &&
    !ruminationAction
  ) {
    showToast("先写一点内容");
    return;
  }

  if ((worry || oppositeBelief) && pendingBeliefShift === null) {
    pendingSaveAfterWorryTest = true;
    openWorryTest(true);
    return;
  }

  if ((releaseTopic || releaseBody) && pendingReleaseShift === null) {
    pendingSaveAfterRelease = true;
    openReleaseFlow(true);
    return;
  }

  if ((ruminationLoop || ruminationMeaning || ruminationAction) && pendingRuminationShift === null) {
    pendingSaveAfterRumination = true;
    openRuminationFlow(true);
    return;
  }

  const beliefShift = getBeliefShift(
    belief,
    worry,
    oppositeBelief,
    releaseTopic,
    releaseBody,
    ruminationLoop,
    ruminationMeaning,
    ruminationAction
  );

  state.entries.unshift({
    id: crypto.randomUUID(),
    gratitude,
    belief,
    worry,
    oppositeBelief,
    worryReminder,
    oppositeReminder,
    releaseTopic,
    releaseBody,
    releasePrompt,
    releaseChoice: pendingReleaseChoice,
    ruminationLoop,
    ruminationMeaning,
    ruminationAction,
    ruminationPrompt,
    ruminationChoice: pendingRuminationChoice,
    beliefShift,
    module: getEntryModuleFromFields(
      belief,
      worry,
      oppositeBelief,
      releaseTopic,
      releaseBody,
      ruminationLoop,
      ruminationMeaning,
      ruminationAction
    ),
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
  els.releaseTopicInput.value = "";
  els.releaseBodyInput.value = "";
  els.ruminationLoopInput.value = "";
  els.ruminationMeaningInput.value = "";
  els.ruminationActionInput.value = "";
  pendingBeliefShift = null;
  pendingReleaseShift = null;
  pendingReleaseChoice = "";
  pendingRuminationShift = null;
  pendingRuminationChoice = "";
  updateReverseReminder();
  updateReleasePrompt();
  updateRuminationPrompt();
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

function updateReleasePrompt() {
  const releaseTopic = els.releaseTopicInput.value.trim();
  const releaseBody = els.releaseBodyInput.value.trim();
  els.releasePrompt.textContent = getReleasePrompt(releaseTopic, releaseBody) || "写下想释放的内容后生成四步提示";
  els.releaseStatus.textContent = "松动后写入记录，信念 +1";
}

function updateRuminationPrompt() {
  const ruminationLoop = els.ruminationLoopInput.value.trim();
  const ruminationMeaning = els.ruminationMeaningInput.value.trim();
  const ruminationAction = els.ruminationActionInput.value.trim();
  els.ruminationPrompt.textContent =
    getRuminationPrompt(ruminationLoop, ruminationMeaning, ruminationAction) || "写下反复念头后生成降噪提示";
  els.ruminationStatus.textContent = "从脑内循环回到当下，松动后 +1";
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

function openReleaseFlow(fromSave) {
  const releaseTopic = els.releaseTopicInput.value.trim();
  const releaseBody = els.releaseBodyInput.value.trim();
  const prompt = getReleasePrompt(releaseTopic, releaseBody);
  if (!prompt) {
    showToast("先写下想释放的内容");
    return;
  }
  pendingSaveAfterRelease = fromSave;
  els.releaseGuideText.textContent = prompt;
  els.releaseChoiceInput.value = pendingReleaseChoice;
  els.releaseDialog.showModal();
}

function openRuminationFlow(fromSave) {
  const ruminationLoop = els.ruminationLoopInput.value.trim();
  const ruminationMeaning = els.ruminationMeaningInput.value.trim();
  const ruminationAction = els.ruminationActionInput.value.trim();
  const prompt = getRuminationPrompt(ruminationLoop, ruminationMeaning, ruminationAction);
  if (!prompt) {
    showToast("先写下反复出现的念头");
    return;
  }
  pendingSaveAfterRumination = fromSave;
  els.ruminationGuideText.textContent = prompt;
  els.ruminationChoiceInput.value = pendingRuminationChoice || ruminationAction;
  els.ruminationDialog.showModal();
}

function getWorryReminder(worry) {
  if (worry) return `我不担心${worry}。`;
  return "";
}

function getOppositeReminder(oppositeBelief) {
  if (oppositeBelief) return `我不再选择相信：${oppositeBelief}。`;
  return "";
}

function getReleasePrompt(releaseTopic, releaseBody) {
  const target = releaseTopic || releaseBody;
  if (!target) return "";
  const bodyLine = releaseBody ? `我注意到身体里有：${releaseBody}。` : "我先回到身体，找到这个感觉。";
  return `${bodyLine} 我允许「${target}」先在这里；我愿意放下想控制、证明或抓住它的需要；如果可以，就现在放下一点点。`;
}

function getRuminationPrompt(ruminationLoop, ruminationMeaning, ruminationAction) {
  const target = ruminationLoop || ruminationMeaning || ruminationAction;
  if (!target) return "";
  const meaningLine = ruminationMeaning ? `它想让我相信：${ruminationMeaning}。` : "它想让我继续证明和确定。";
  const actionLine = ruminationAction ? `我现在把注意力交还给：${ruminationAction}。` : "我现在把注意力交还给身体和下一件具体小事。";
  return `我注意到念头在循环：「${target}」。${meaningLine} 这只是一个念头，不是命令；我允许它经过，但不继续喂它。${actionLine}`;
}

function getBeliefShift(
  belief,
  worry,
  oppositeBelief,
  releaseTopic,
  releaseBody,
  ruminationLoop,
  ruminationMeaning,
  ruminationAction
) {
  let shift = 0;
  if (belief) shift += 1;
  if (worry || oppositeBelief) shift += pendingBeliefShift ?? -1;
  if (releaseTopic || releaseBody) shift += pendingReleaseShift ?? 0;
  if (ruminationLoop || ruminationMeaning || ruminationAction) shift += pendingRuminationShift ?? 0;
  return shift;
}

function getEntryToast(shift) {
  if (shift > 0) return `已写入记录，信念 +${shift}`;
  if (shift < 0) return `已写入记录，信念 ${shift}`;
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
        <span>${escapeHtml(entry.ruminationLoop || entry.releaseTopic || entry.belief || entry.worry || entry.oppositeBelief || "-")}</span>
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
  if ((entry.releaseTopic || entry.releaseBody) && (entry.ruminationLoop || entry.ruminationMeaning || entry.ruminationAction)) {
    return "释放 + 反刍";
  }
  if (entry.ruminationLoop || entry.ruminationMeaning || entry.ruminationAction) return "思维反刍";
  if (entry.releaseTopic || entry.releaseBody) return "释放法";
  if (entry.belief) return "我相信";
  if (entry.worry || entry.oppositeBelief) return "我不相信";
  return "记录";
}

function getEntryModuleFromFields(
  belief,
  worry,
  oppositeBelief,
  releaseTopic,
  releaseBody,
  ruminationLoop,
  ruminationMeaning,
  ruminationAction
) {
  if ((releaseTopic || releaseBody) && (ruminationLoop || ruminationMeaning || ruminationAction)) return "释放 + 反刍";
  if (ruminationLoop || ruminationMeaning || ruminationAction) return "思维反刍";
  if (releaseTopic || releaseBody) return "释放法";
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
  const releaseLine = getReleaseAutomationLine();
  const lockscreenText = getLockscreenText();
  return [
    `显化Mytri ${appVersion}`,
    "快捷指令名称：显化Mytri",
    "",
    "V2.1 设置：",
    "1. 自动化页新增问卷调查入口。",
    "2. 锁屏弹窗、释放窗口、思维反刍测试后，请提交问卷反馈。",
    `3. 问卷调查：${surveyUrl}`,
    "",
    "锁屏弹窗快捷指令：",
    "1. 文本：粘贴下面的锁屏弹窗内容。",
    "2. 显示通知：标题填“显化Mytri”，正文使用上一步文本。",
    "3. URL：粘贴 GitHub App 链接。",
    "4. 打开 URL：打开上一步 URL。",
    "",
    "个人自动化设置：",
    "1. 点“打开自动化设定”。如果只打开快捷指令 App，就进入底部“自动化”。",
    "2. 新建个人自动化，选择每天固定时间或睡眠/起床触发器。",
    "3. 选择“立即运行”，关闭运行前询问。",
    "4. 添加操作：运行快捷指令。",
    "5. 选择快捷指令：显化Mytri。",
    "",
    "显化提醒文字：",
    ...lines,
    "",
    "释放法提示：",
    releaseLine,
    "",
    "锁屏弹窗内容：",
    lockscreenText,
    "",
    `App 链接：${appUrl}`,
    `问卷调查：${surveyUrl}`
  ].join("\n");
}

function getReleaseAutomationLine() {
  const latestRelease = state.entries.find((entry) => entry.releasePrompt || entry.ruminationPrompt);
  if (latestRelease) return [latestRelease.releasePrompt, latestRelease.ruminationPrompt].filter(Boolean).join(" ");
  return "我允许今天出现的情绪先在这里；我愿意放下想控制、证明或抓住它的需要；现在放下一点点。";
}

function getLockscreenText() {
  const items = state.manifests.length ? state.manifests : [createManifest("我的显化目标")];
  const first = items[0];
  const score = getManifestScore(first);
  const releaseLine = getReleaseAutomationLine();
  return [
    `显化Mytri ${appVersion} ${score.total}%`,
    getAffirmation(first.text),
    releaseLine,
    "点开后记录一次相信、释放或反刍。"
  ].join("\n");
}

function getRunShortcutUrl(text) {
  const params = new URLSearchParams({
    name: "显化Mytri",
    input: "text",
    text
  });
  return `shortcuts://run-shortcut?${params.toString()}`;
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
