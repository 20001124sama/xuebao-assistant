const ASSET_KEY = "snow_leopard_assistant_assets_v2";
const EXPENSE_KEY = "snow_leopard_expenses_v1";
const DELTA_KEY = "snow_leopard_delta_v1";
const OLD_ASSET_KEYS = ["snow_leopard_assets_v2", "real_estate_ledger_assets_v1"];

const DEFAULT_TYPES = ["住宅", "商铺", "写字楼", "车位", "土地", "车辆", "电子产品", "饰品", "收藏品", "现金", "基金股票", "游戏资产", "其他"];
const REAL_ESTATE_TYPES = ["住宅", "商铺", "写字楼", "车位", "土地", "房产", "房地产", "不动产", "公寓", "别墅"];
const DEFAULT_EXPENSE_CATEGORIES = ["生活", "餐饮", "交通", "房产", "维修", "数码", "饰品", "游戏", "学习", "医疗", "其他"];

const createId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (date) => (date || "").slice(0, 7);

const state = {
  assets: loadList(ASSET_KEY, OLD_ASSET_KEYS),
  expenses: loadList(EXPENSE_KEY),
  delta: loadObject(DELTA_KEY, { provider: "", status: "暂未绑定" }),
  page: "assets",
  filter: "all",
  expenseFilter: "all",
  query: "",
  expenseQuery: "",
  detail: { kind: "", id: "" }
};

const assetFields = ["assetId", "name", "type", "city", "district", "address", "area", "purchasePrice", "purchaseDate", "currentValue", "loanBalance", "mortgagePayment", "monthlyRent", "monthlyExpense", "ownershipEnd", "status", "tags", "notes"];
const expenseFields = ["expenseId", "expenseKind", "expenseName", "expenseAmount", "expenseCategory", "expenseDate", "expenseMethod", "expenseAssetRef", "expenseNotes"];

const els = {
  totalValue: document.querySelector("#totalValue"),
  netWorth: document.querySelector("#netWorth"),
  annualRent: document.querySelector("#annualRent"),
  monthlyCashflow: document.querySelector("#monthlyCashflow"),
  assetCount: document.querySelector("#assetCount"),
  yieldRate: document.querySelector("#yieldRate"),
  assetList: document.querySelector("#assetList"),
  assetTemplate: document.querySelector("#assetTemplate"),
  typeTabs: document.querySelector("#typeTabs"),
  typeBars: document.querySelector("#typeBars"),
  topCity: document.querySelector("#topCity"),
  assetDialog: document.querySelector("#assetDialog"),
  assetForm: document.querySelector("#assetForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  deleteAssetBtn: document.querySelector("#deleteAssetBtn"),
  typeSelect: document.querySelector("#type"),
  customTypeField: document.querySelector("#customTypeField"),
  customType: document.querySelector("#customType"),
  typeQuickList: document.querySelector("#assetTypeQuickList"),
  assetNames: document.querySelector("#assetNames"),
  expenseDialog: document.querySelector("#expenseDialog"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDialogTitle: document.querySelector("#expenseDialogTitle"),
  deleteExpenseBtn: document.querySelector("#deleteExpenseBtn"),
  expenseList: document.querySelector("#expenseList"),
  expenseTemplate: document.querySelector("#expenseTemplate"),
  expenseBars: document.querySelector("#expenseBars"),
  monthExpense: document.querySelector("#monthExpense"),
  todayExpense: document.querySelector("#todayExpense"),
  monthBalance: document.querySelector("#monthBalance"),
  topExpense: document.querySelector("#topExpense"),
  topExpenseName: document.querySelector("#topExpenseName"),
  expenseCount: document.querySelector("#expenseCount"),
  expenseFilterNote: document.querySelector("#expenseFilterNote"),
  expenseCategorySelect: document.querySelector("#expenseCategory"),
  customExpenseCategoryField: document.querySelector("#customExpenseCategoryField"),
  customExpenseCategory: document.querySelector("#customExpenseCategory"),
  expenseCategoryQuickList: document.querySelector("#expenseCategoryQuickList"),
  detailDialog: document.querySelector("#detailDialog"),
  detailEyebrow: document.querySelector("#detailEyebrow"),
  detailTitle: document.querySelector("#detailTitle"),
  detailContent: document.querySelector("#detailContent"),
  detailEditBtn: document.querySelector("#detailEditBtn"),
  deltaAuthStatus: document.querySelector("#deltaAuthStatus")
};

bindEvents();
render();
window.setTimeout(() => {
  document.body.classList.remove("booting");
  document.body.classList.add("booted");
}, 3000);

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => switchPage(button.dataset.page)));
  document.querySelector("#newAssetBtn").addEventListener("click", () => openAssetEditor());
  document.querySelector("#type").addEventListener("change", () => {
    toggleCustomTypeField();
    toggleAssetFields();
  });
  document.querySelector("#customType").addEventListener("input", toggleAssetFields);
  document.querySelector("#purchasePrice").addEventListener("input", syncValueForSimpleAsset);
  document.querySelector("#newExpenseBtn").addEventListener("click", () => openExpenseEditor());
  document.querySelector("#expenseCategory").addEventListener("change", () => {
    toggleCustomExpenseCategoryField();
    renderExpenseCategoryQuickList();
  });
  document.querySelector("#customExpenseCategory").addEventListener("input", renderExpenseCategoryQuickList);
  document.querySelector("#closeDialogBtn").addEventListener("click", closeAssetEditor);
  document.querySelector("#cancelBtn").addEventListener("click", closeAssetEditor);
  document.querySelector("#closeExpenseBtn").addEventListener("click", closeExpenseEditor);
  document.querySelector("#cancelExpenseBtn").addEventListener("click", closeExpenseEditor);
  document.querySelector("#exportBtn").addEventListener("click", exportData);
  document.querySelector("#exportAllBtn").addEventListener("click", exportData);
  document.querySelector("#clearAllBtn").addEventListener("click", clearAllData);
  document.querySelector("#structureDetailBtn").addEventListener("click", () => openModuleDetail("structure"));
  document.querySelector("#expenseClearFilterBtn").addEventListener("click", () => {
    state.expenseFilter = "all";
    renderExpenses();
  });
  document.querySelector("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderAssets();
  });
  document.querySelector("#expenseSearchInput").addEventListener("input", (event) => {
    state.expenseQuery = event.target.value.trim().toLowerCase();
    renderExpenses();
  });
  document.querySelectorAll(".metric[data-module]").forEach((metric) => metric.addEventListener("click", () => openModuleDetail(metric.dataset.module)));
  document.querySelector("#closeDetailBtn").addEventListener("click", closeDetail);
  document.querySelector("#detailCloseAction").addEventListener("click", closeDetail);
  document.querySelector("#wechatLoginBtn").addEventListener("click", () => reserveDeltaLogin("微信"));
  document.querySelector("#qqLoginBtn").addEventListener("click", () => reserveDeltaLogin("QQ"));
  els.detailEditBtn.addEventListener("click", editCurrentDetail);
  els.assetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAsset();
  });
  els.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveExpense();
  });
  els.deleteAssetBtn.addEventListener("click", deleteCurrentAsset);
  els.deleteExpenseBtn.addEventListener("click", deleteCurrentExpense);
}

function loadList(key, fallbackKeys = []) {
  for (const item of [key, ...[].concat(fallbackKeys)].filter(Boolean)) {
    try {
      const raw = localStorage.getItem(item);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      localStorage.removeItem(item);
    }
  }
  return [];
}

function loadObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(ASSET_KEY, JSON.stringify(state.assets));
  localStorage.setItem(EXPENSE_KEY, JSON.stringify(state.expenses));
  localStorage.setItem(DELTA_KEY, JSON.stringify(state.delta));
}

function money(value, compact = true) {
  const amount = Number(value) || 0;
  if (compact && Math.abs(amount) >= 10000) return `¥${(amount / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}万`;
  return amount.toLocaleString("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 });
}

function numberValue(id) {
  return Number(document.querySelector(`#${id}`).value) || 0;
}

function calc(asset) {
  const value = Number(asset.currentValue) || Number(asset.purchasePrice) || 0;
  const loan = Number(asset.loanBalance) || 0;
  const income = Number(asset.monthlyRent) || 0;
  const expense = Number(asset.monthlyExpense) || 0;
  const payment = Number(asset.mortgagePayment) || 0;
  return { value, equity: value - loan, annualIncome: income * 12, cashflow: income - expense - payment, yieldRate: value > 0 ? (income * 12) / value : 0 };
}

function isRealEstateType(type) {
  return REAL_ESTATE_TYPES.some((item) => String(type || "").includes(item));
}

function switchPage(page) {
  state.page = page;
  document.querySelectorAll(".page").forEach((item) => item.classList.toggle("active", item.id === `page${page[0].toUpperCase()}${page.slice(1)}`));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === page));
}

function render() {
  renderAssetOptions();
  renderAssets();
  renderExpenses();
  renderDelta();
}

function assetTypes() {
  const used = state.assets.map((asset) => asset.type).filter(Boolean);
  return [...new Set([...DEFAULT_TYPES, ...used])];
}

function expenseCategories() {
  const used = state.expenses.map((expense) => expense.category).filter(Boolean);
  return [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...used])];
}

function renderAssetOptions() {
  const selected = getSelectedAssetType();
  els.typeSelect.replaceChildren();
  assetTypes().forEach((type) => els.typeSelect.append(new Option(type, type)));
  els.typeSelect.append(new Option("自定义类别", "__custom__"));
  if (selected && assetTypes().includes(selected)) {
    els.typeSelect.value = selected;
  }
  renderAssetTypeQuickList();
  els.assetNames.replaceChildren();
  state.assets.forEach((asset) => els.assetNames.append(new Option(asset.name, asset.name)));
  renderExpenseCategoryOptions();
}

function renderExpenseCategoryOptions() {
  const selected = getSelectedExpenseCategory();
  els.expenseCategorySelect.replaceChildren();
  expenseCategories().forEach((category) => els.expenseCategorySelect.append(new Option(category, category)));
  els.expenseCategorySelect.append(new Option("自定义分类", "__custom__"));
  if (selected && expenseCategories().includes(selected)) els.expenseCategorySelect.value = selected;
  renderExpenseCategoryQuickList();
}

function renderExpenseCategoryQuickList() {
  if (!els.expenseCategoryQuickList) return;
  const selected = getSelectedExpenseCategory();
  els.expenseCategoryQuickList.replaceChildren();
  expenseCategories().forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quick-chip${selected === category ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => setExpenseCategory(category));
    els.expenseCategoryQuickList.append(button);
  });
}

function setExpenseCategory(category) {
  els.expenseCategorySelect.value = category;
  els.customExpenseCategory.value = "";
  toggleCustomExpenseCategoryField();
  renderExpenseCategoryQuickList();
}

function setEditorExpenseCategory(category) {
  const normalizedCategory = category || DEFAULT_EXPENSE_CATEGORIES[0];
  if (expenseCategories().includes(normalizedCategory)) {
    els.expenseCategorySelect.value = normalizedCategory;
    els.customExpenseCategory.value = "";
  } else {
    els.expenseCategorySelect.value = "__custom__";
    els.customExpenseCategory.value = normalizedCategory;
  }
  toggleCustomExpenseCategoryField();
  renderExpenseCategoryQuickList();
}

function getSelectedExpenseCategory() {
  return els.expenseCategorySelect.value === "__custom__" ? els.customExpenseCategory.value.trim() : els.expenseCategorySelect.value;
}

function toggleCustomExpenseCategoryField() {
  const isCustom = els.expenseCategorySelect.value === "__custom__";
  els.customExpenseCategoryField.hidden = !isCustom;
  if (isCustom && els.expenseDialog.open) els.customExpenseCategory.focus();
}

function renderAssetTypeQuickList() {
  if (!els.typeQuickList) return;
  const selected = getSelectedAssetType();
  els.typeQuickList.replaceChildren();
  assetTypes().forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `quick-chip${selected === type ? " active" : ""}`;
    button.textContent = type;
    button.addEventListener("click", () => setAssetType(type));
    els.typeQuickList.append(button);
  });
}

function setAssetType(type) {
  els.typeSelect.value = type;
  els.customType.value = "";
  toggleCustomTypeField();
  toggleAssetFields();
  renderAssetTypeQuickList();
}

function setEditorAssetType(type) {
  const normalizedType = type || DEFAULT_TYPES[0];
  if (assetTypes().includes(normalizedType)) {
    els.typeSelect.value = normalizedType;
    els.customType.value = "";
  } else {
    els.typeSelect.value = "__custom__";
    els.customType.value = normalizedType;
  }
  toggleCustomTypeField();
  renderAssetTypeQuickList();
}

function getSelectedAssetType() {
  return els.typeSelect.value === "__custom__" ? els.customType.value.trim() : els.typeSelect.value;
}

function toggleCustomTypeField() {
  const isCustom = els.typeSelect.value === "__custom__";
  els.customTypeField.hidden = !isCustom;
  if (isCustom && els.assetDialog.open) els.customType.focus();
}

function totalsFor(assets = state.assets) {
  return assets.reduce((acc, asset) => {
    const item = calc(asset);
    acc.value += item.value;
    acc.equity += item.equity;
    acc.annualIncome += item.annualIncome;
    acc.cashflow += item.cashflow;
    return acc;
  }, { value: 0, equity: 0, annualIncome: 0, cashflow: 0 });
}

function filteredAssets() {
  return state.assets.filter((asset) => {
    const matchType = state.filter === "all" || asset.type === state.filter;
    const haystack = [asset.name, asset.type, asset.city, asset.district, asset.address, asset.tags, asset.status].join(" ").toLowerCase();
    return matchType && (!state.query || haystack.includes(state.query));
  });
}

function renderAssets() {
  const totals = totalsFor();
  els.totalValue.textContent = money(totals.value);
  els.netWorth.textContent = money(totals.equity);
  els.annualRent.textContent = money(totals.annualIncome);
  els.monthlyCashflow.textContent = money(totals.cashflow, false);
  els.assetCount.textContent = `${state.assets.length} 项资产 · 点击查看`;
  els.yieldRate.textContent = `收益率 ${totals.value ? ((totals.annualIncome / totals.value) * 100).toFixed(2) : "0.00"}% · 点击查看`;
  renderTypeTabs();
  renderAssetList();
  renderTypeBars();
}

function renderTypeTabs() {
  const counts = state.assets.reduce((map, asset) => {
    const type = asset.type || "未分类";
    map.set(type, (map.get(type) || 0) + 1);
    return map;
  }, new Map());
  const tabs = [["all", `全部 ${state.assets.length}`], ...[...counts.entries()].map(([type, count]) => [type, `${type} ${count}`])];
  els.typeTabs.replaceChildren();
  tabs.forEach(([filter, label]) => {
    const tab = document.createElement("button");
    tab.className = `tab${state.filter === filter ? " active" : ""}`;
    tab.type = "button";
    tab.textContent = label;
    tab.addEventListener("click", () => {
      state.filter = filter;
      renderAssets();
    });
    els.typeTabs.append(tab);
  });
}

function renderAssetList() {
  const assets = filteredAssets();
  els.assetList.replaceChildren();
  if (!assets.length) {
    els.assetList.append(emptyState(state.assets.length ? "没有匹配的资产" : "还没有资产", state.assets.length ? "换个关键词或分类试试" : "点击“新增”，开始建立你的资产账本"));
    return;
  }
  assets.sort((a, b) => (Number(b.currentValue) || 0) - (Number(a.currentValue) || 0)).forEach((asset) => {
    const metrics = calc(asset);
    const fragment = els.assetTemplate.content.cloneNode(true);
    fragment.querySelector(".type-pill").textContent = asset.type || "资产";
    fragment.querySelector(".status-dot").textContent = asset.status || "未设置";
    fragment.querySelector("h3").textContent = asset.name || "未命名资产";
    fragment.querySelector(".address").textContent = isRealEstateType(asset.type)
      ? [asset.city, asset.district, asset.address].filter(Boolean).join(" · ") || "位置未填写"
      : [asset.purchaseDate ? `购入 ${asset.purchaseDate}` : "", asset.tags].filter(Boolean).join(" · ") || "普通资产";
    fragment.querySelector(".value").textContent = money(metrics.value);
    fragment.querySelector(".equity").textContent = money(metrics.equity);
    const cashflow = fragment.querySelector(".cashflow");
    cashflow.textContent = money(metrics.cashflow, false);
    cashflow.classList.toggle("positive", metrics.cashflow >= 0);
    cashflow.classList.toggle("negative", metrics.cashflow < 0);
    fragment.querySelector(".rent").textContent = `月收入 ${money(asset.monthlyRent || 0, false)}`;
    fragment.querySelector(".area").textContent = isRealEstateType(asset.type) ? (asset.area ? `面积 ${asset.area} m²` : "面积未填") : (asset.purchaseDate ? `购入 ${asset.purchaseDate}` : "购入日期未填");
    fragment.querySelector(".view-asset").addEventListener("click", () => openAssetDetail(asset.id));
    fragment.querySelector(".edit-asset").addEventListener("click", () => openAssetEditor(asset.id));
    els.assetList.append(fragment);
  });
}

function renderTypeBars() {
  const rows = groupSum(state.assets, (asset) => asset.type || "未分类", (asset) => Number(asset.currentValue) || 0);
  renderBars(els.typeBars, rows, (type) => {
    state.filter = type;
    renderAssets();
  });
  els.topCity.textContent = rows.length ? `最高占比：${rows[0][0]}` : "暂无资产结构数据";
}

function groupSum(items, keyFn, valueFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + valueFn(item));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function renderBars(container, rows, onClick) {
  container.replaceChildren();
  if (!rows.length) return;
  const max = rows[0][1] || 1;
  rows.forEach(([label, value]) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "bar-row";
    row.innerHTML = `<span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max((value / max) * 100, 3)}%"></div></div><strong>${money(value)}</strong>`;
    row.addEventListener("click", () => onClick(label));
    container.append(row);
  });
}

function openAssetEditor(id) {
  const asset = id ? state.assets.find((item) => item.id === id) : null;
  els.dialogTitle.textContent = asset ? "编辑资产" : "新增资产";
  els.deleteAssetBtn.hidden = !asset;
  assetFields.forEach((field) => {
    const input = document.querySelector(`#${field}`);
    if (!input) return;
    if (field === "type") return;
    input.value = field === "assetId" ? asset?.id || "" : asset?.[field] ?? "";
  });
  setEditorAssetType(asset?.type || DEFAULT_TYPES[0]);
  toggleAssetFields();
  els.assetDialog.showModal();
}

function closeAssetEditor() {
  els.assetDialog.close();
  els.assetForm.reset();
  els.customTypeField.hidden = true;
}

function saveAsset() {
  const id = document.querySelector("#assetId").value || createId();
  const type = getSelectedAssetType() || "其他";
  const isRealEstate = isRealEstateType(type);
  const purchasePrice = numberValue("purchasePrice");
  const enteredValue = numberValue("currentValue");
  const asset = {
    id,
    name: document.querySelector("#name").value.trim(),
    type,
    city: isRealEstate ? document.querySelector("#city").value.trim() : "",
    district: isRealEstate ? document.querySelector("#district").value.trim() : "",
    address: isRealEstate ? document.querySelector("#address").value.trim() : "",
    area: isRealEstate ? numberValue("area") : 0,
    purchasePrice,
    purchaseDate: document.querySelector("#purchaseDate").value,
    currentValue: enteredValue || purchasePrice,
    loanBalance: isRealEstate ? numberValue("loanBalance") : 0,
    mortgagePayment: isRealEstate ? numberValue("mortgagePayment") : 0,
    monthlyRent: isRealEstate ? numberValue("monthlyRent") : 0,
    monthlyExpense: isRealEstate ? numberValue("monthlyExpense") : 0,
    ownershipEnd: isRealEstate ? document.querySelector("#ownershipEnd").value : "",
    status: document.querySelector("#status").value,
    tags: document.querySelector("#tags").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
    updatedAt: new Date().toISOString()
  };
  const index = state.assets.findIndex((item) => item.id === id);
  if (index >= 0) state.assets[index] = asset;
  else state.assets.unshift(asset);
  persist();
  closeAssetEditor();
  render();
}

function toggleAssetFields() {
  const type = getSelectedAssetType();
  const isRealEstate = isRealEstateType(type);
  const areaField = document.querySelector("#areaField");
  document.querySelectorAll(".real-estate-field").forEach((field) => {
    field.hidden = !isRealEstate;
  });
  areaField.hidden = !isRealEstate;
  if (!isRealEstate) {
    document.querySelector("#area").value = "";
    document.querySelector("#city").value = "";
    document.querySelector("#district").value = "";
    document.querySelector("#address").value = "";
    document.querySelector("#loanBalance").value = "";
    document.querySelector("#mortgagePayment").value = "";
    document.querySelector("#monthlyRent").value = "";
    document.querySelector("#monthlyExpense").value = "";
    document.querySelector("#ownershipEnd").value = "";
  }
  syncValueForSimpleAsset();
  renderAssetTypeQuickList();
}

function syncValueForSimpleAsset() {
  const type = getSelectedAssetType();
  const currentValue = document.querySelector("#currentValue");
  if (!isRealEstateType(type) && !currentValue.value) {
    currentValue.value = document.querySelector("#purchasePrice").value;
  }
}

function deleteCurrentAsset() {
  const id = document.querySelector("#assetId").value;
  const asset = state.assets.find((item) => item.id === id);
  if (!asset || !confirm(`确认删除「${asset.name}」？`)) return;
  state.assets = state.assets.filter((item) => item.id !== id);
  persist();
  closeAssetEditor();
  render();
}

function filteredExpenses() {
  return state.expenses.filter((expense) => {
    const match = state.expenseFilter === "all" || expense.category === state.expenseFilter;
    const haystack = [expense.name, expense.category, expense.method, expense.assetRef, expense.notes].join(" ").toLowerCase();
    return match && (!state.expenseQuery || haystack.includes(state.expenseQuery));
  });
}

function renderExpenses() {
  const currentMonth = today().slice(0, 7);
  const monthItems = state.expenses.filter((item) => monthKey(item.date) === currentMonth);
  const monthExpense = monthItems.filter((item) => (item.kind || "expense") === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthIncome = monthItems.filter((item) => item.kind === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const dayExpense = state.expenses.filter((item) => item.date === today() && (item.kind || "expense") === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  els.monthExpense.textContent = money(monthExpense, false);
  els.todayExpense.textContent = money(dayExpense, false);
  els.monthBalance.textContent = money(monthIncome - monthExpense, false);
  els.topExpense.textContent = money(monthIncome, false);
  els.topExpenseName.textContent = "收入合计";
  els.expenseCount.textContent = `${state.expenses.length} 条记录`;
  els.expenseFilterNote.textContent = state.expenseFilter === "all" ? "按分类查看花钱流向" : `正在查看：${state.expenseFilter}`;
  renderExpenseBars();
  renderExpenseList();
}

function renderExpenseBars() {
  const rows = groupSum(state.expenses, (item) => item.category || "其他", (item) => Number(item.amount) || 0);
  renderBars(els.expenseBars, rows, (category) => {
    state.expenseFilter = category;
    renderExpenses();
  });
}

function renderExpenseList() {
  const expenses = filteredExpenses();
  els.expenseList.replaceChildren();
  if (!expenses.length) {
    els.expenseList.append(emptyState(state.expenses.length ? "没有匹配的记录" : "还没有收支记录", state.expenses.length ? "换个关键词或分类试试" : "点击“记一笔”，记录收入或支出"));
    return;
  }
  expenses.sort((a, b) => (b.date || "").localeCompare(a.date || "")).forEach((expense) => {
    const fragment = els.expenseTemplate.content.cloneNode(true);
    fragment.querySelector(".category").textContent = `${(expense.kind || "expense") === "income" ? "收入" : "支出"} · ${expense.category || "其他"}`;
    fragment.querySelector(".expense-date").textContent = expense.date || "未填日期";
    fragment.querySelector("h3").textContent = expense.name || "未命名开支";
    fragment.querySelector(".expense-note").textContent = [expense.assetRef, expense.notes].filter(Boolean).join(" · ") || "暂无备注";
    const amount = fragment.querySelector(".expense-amount");
    amount.textContent = `${(expense.kind || "expense") === "income" ? "+" : "-"}${money(expense.amount || 0, false)}`;
    amount.classList.toggle("income", expense.kind === "income");
    fragment.querySelector(".expense-method").textContent = expense.method || "未填支付方式";
    fragment.querySelector(".view-expense").addEventListener("click", () => openExpenseDetail(expense.id));
    fragment.querySelector(".edit-expense").addEventListener("click", () => openExpenseEditor(expense.id));
    els.expenseList.append(fragment);
  });
}

function openExpenseEditor(id) {
  const expense = id ? state.expenses.find((item) => item.id === id) : null;
  els.expenseDialogTitle.textContent = expense ? "编辑记录" : "新增记录";
  els.deleteExpenseBtn.hidden = !expense;
  const values = {
    expenseId: expense?.id || "",
    expenseKind: expense?.kind || "expense",
    expenseName: expense?.name || "",
    expenseAmount: expense?.amount ?? "",
    expenseDate: expense?.date || today(),
    expenseMethod: expense?.method || "微信",
    expenseAssetRef: expense?.assetRef || "",
    expenseNotes: expense?.notes || ""
  };
  expenseFields.forEach((field) => {
    if (field === "expenseCategory") return;
    document.querySelector(`#${field}`).value = values[field] ?? "";
  });
  setEditorExpenseCategory(expense?.category || DEFAULT_EXPENSE_CATEGORIES[0]);
  els.expenseDialog.showModal();
}

function closeExpenseEditor() {
  els.expenseDialog.close();
  els.expenseForm.reset();
  els.customExpenseCategoryField.hidden = true;
}

function saveExpense() {
  const id = document.querySelector("#expenseId").value || createId();
  const expense = {
    id,
    kind: document.querySelector("#expenseKind").value,
    name: document.querySelector("#expenseName").value.trim(),
    amount: numberValue("expenseAmount"),
    category: getSelectedExpenseCategory() || "其他",
    date: document.querySelector("#expenseDate").value || today(),
    method: document.querySelector("#expenseMethod").value,
    assetRef: document.querySelector("#expenseAssetRef").value.trim(),
    notes: document.querySelector("#expenseNotes").value.trim(),
    updatedAt: new Date().toISOString()
  };
  const index = state.expenses.findIndex((item) => item.id === id);
  if (index >= 0) state.expenses[index] = expense;
  else state.expenses.unshift(expense);
  persist();
  closeExpenseEditor();
  render();
}

function deleteCurrentExpense() {
  const id = document.querySelector("#expenseId").value;
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense || !confirm(`确认删除「${expense.name}」？`)) return;
  state.expenses = state.expenses.filter((item) => item.id !== id);
  persist();
  closeExpenseEditor();
  render();
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value || "未填写"}</strong></div>`;
}

function openAssetDetail(id) {
  const asset = state.assets.find((item) => item.id === id);
  if (!asset) return;
  const metrics = calc(asset);
  const isRealEstate = isRealEstateType(asset.type);
  state.detail = { kind: "asset", id };
  els.detailEditBtn.hidden = false;
  els.detailEyebrow.textContent = asset.type || "资产详情";
  els.detailTitle.textContent = asset.name || "未命名资产";
  const realEstateRows = isRealEstate
    ? `${detailRow("负债/贷款", money(asset.loanBalance || 0))}${detailRow("月收入", money(asset.monthlyRent || 0, false))}${detailRow("月支出", money(asset.monthlyExpense || 0, false))}${detailRow("月还款", money(asset.mortgagePayment || 0, false))}${detailRow("月现金流", money(metrics.cashflow, false))}${detailRow("收益率", `${(metrics.yieldRate * 100).toFixed(2)}%`)}${detailRow("面积", asset.area ? `${asset.area} m²` : "")}${detailRow("产权/租约到期", asset.ownershipEnd)}${detailRow("所在地", [asset.city, asset.district, asset.address].filter(Boolean).join(" · "))}`
    : "";
  els.detailContent.innerHTML = `<div class="detail-grid">${detailRow("当前估值", money(metrics.value))}${detailRow("购入价", money(asset.purchasePrice || 0))}${detailRow("购入日期", asset.purchaseDate)}${detailRow("状态", asset.status)}${realEstateRows}${detailRow("标签", asset.tags)}</div><div class="notes-box">${asset.notes || "暂无备注"}</div>`;
  openDetail();
}

function openExpenseDetail(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) return;
  state.detail = { kind: "expense", id };
  els.detailEditBtn.hidden = false;
  els.detailEyebrow.textContent = `${(expense.kind || "expense") === "income" ? "收入" : "支出"}详情`;
  els.detailTitle.textContent = expense.name || "未命名开支";
  els.detailContent.innerHTML = `<div class="detail-grid">${detailRow("类型", (expense.kind || "expense") === "income" ? "收入" : "支出")}${detailRow("金额", money(expense.amount || 0, false))}${detailRow("分类", expense.category)}${detailRow("日期", expense.date)}${detailRow("支付方式", expense.method)}${detailRow("关联资产", expense.assetRef)}${detailRow("更新时间", new Date(expense.updatedAt || Date.now()).toLocaleString("zh-CN"))}</div><div class="notes-box">${expense.notes || "暂无备注"}</div>`;
  openDetail();
}

function openModuleDetail(module) {
  state.detail = { kind: "module", id: module };
  els.detailEditBtn.hidden = true;
  const assets = filteredAssets();
  const totals = totalsFor(assets);
  const moduleMap = {
    value: ["总估值", "当前筛选范围内所有资产的估值合计", totals.value],
    net: ["净资产", "当前估值扣除负债/贷款后的合计", totals.equity],
    income: ["年收入", "月收入按 12 个月折算后的合计", totals.annualIncome],
    cashflow: ["月现金流", "月收入扣除月支出和月还款后的合计", totals.cashflow],
    structure: ["结构分析", "按资产类型汇总估值", totals.value]
  };
  const [title, subtitle, value] = moduleMap[module] || moduleMap.value;
  els.detailEyebrow.textContent = subtitle;
  els.detailTitle.textContent = title;
  els.detailContent.innerHTML = `<div class="module-total">${money(value, false)}</div><div class="detail-list">${assets.length ? assets.map((asset) => {
    const metrics = calc(asset);
    const displayValue = module === "net" ? metrics.equity : module === "income" ? metrics.annualIncome : module === "cashflow" ? metrics.cashflow : metrics.value;
    return `<button type="button" class="mini-asset" data-id="${asset.id}"><span><strong>${asset.name || "未命名资产"}</strong><small>${asset.type || "资产"} · ${asset.status || "未设置"}</small></span><em>${money(displayValue)}</em></button>`;
  }).join("") : `<p class="empty-state">暂无资产，点击“新增”开始记录</p>`}</div>`;
  els.detailContent.querySelectorAll(".mini-asset").forEach((button) => button.addEventListener("click", () => openAssetDetail(button.dataset.id)));
  openDetail();
}

function openDetail() {
  if (!els.detailDialog.open) els.detailDialog.showModal();
}

function closeDetail() {
  els.detailDialog.close();
  state.detail = { kind: "", id: "" };
}

function editCurrentDetail() {
  const { kind, id } = state.detail;
  closeDetail();
  if (kind === "asset") openAssetEditor(id);
  if (kind === "expense") openExpenseEditor(id);
}

function emptyState(title, text) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  return empty;
}

function reserveDeltaLogin(provider) {
  state.delta = { provider, status: `${provider} 绑定暂未开放`, updatedAt: new Date().toISOString() };
  persist();
  renderDelta();
  alert(`${provider} 绑定暂未开放，后续更新后即可同步三角洲游戏资产。`);
}

function renderDelta() {
  els.deltaAuthStatus.textContent = state.delta.status || "暂未绑定";
}

function exportData() {
  const payload = { app: "雪豹助手", exportedAt: new Date().toISOString(), assets: state.assets, expenses: state.expenses, delta: state.delta };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `snow-leopard-assistant-backup-${today()}.sla`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (!confirm("确认清空本机保存的资产、收支和三角洲接口状态？")) return;
  state.assets = [];
  state.expenses = [];
  state.delta = { provider: "", status: "暂未绑定" };
  OLD_ASSET_KEYS.forEach((key) => localStorage.removeItem(key));
  persist();
  render();
  switchPage("assets");
}
