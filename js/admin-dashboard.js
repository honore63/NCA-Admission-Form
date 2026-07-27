// =============================================
// NCA Admin Dashboard - Complete Management System
// =============================================

var allApplications = [];
var filteredApplications = [];
var selectedApp = null;
var selectedIds = new Set();
var currentPage = 1;
var perPage = 10;
var searchTerm = "";
var statusFilter = "All";
var timeFilter = "All";
var notifications = JSON.parse(localStorage.getItem("nca_notifications") || "[]");
var charts = {};
var confirmCallback = null;

// ====== INIT ======
document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initTheme();
  initSearch();
  initNavigation();
  initProfileDropdown();
  initSelectAll();
  loadApplications();
  renderNotifications();
  updateNotifBadge();
});

// ====== SIDEBAR ======
function initSidebar() {
  var hamburger = document.getElementById("hamburger");
  var sidebar = document.getElementById("sidebar");
  var sidebarClose = document.getElementById("sidebar-close");

  hamburger.addEventListener("click", function () {
    sidebar.classList.toggle("open");
  });
  sidebarClose.addEventListener("click", function () {
    sidebar.classList.remove("open");
  });
}

// ====== THEME ======
function initTheme() {
  var saved = localStorage.getItem("nca_theme") || "light";
  if (saved === "dark") document.body.classList.add("dark");

  document.getElementById("theme-toggle").addEventListener("click", function (e) {
    e.preventDefault();
    toggleTheme();
  });
  document.getElementById("topbar-theme").addEventListener("click", toggleTheme);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  var isDark = document.body.classList.contains("dark");
  localStorage.setItem("nca_theme", isDark ? "dark" : "light");
  var icon = document.querySelector("#theme-toggle i");
  var topIcon = document.querySelector("#topbar-theme i");
  if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  if (topIcon) topIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

// ====== NAVIGATION ======
function initNavigation() {
  document.querySelectorAll("[data-page]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      navigateTo(this.getAttribute("data-page"));
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll(".admin-page").forEach(function (p) { p.classList.remove("active"); });
  document.querySelectorAll(".sidebar-link").forEach(function (l) { l.classList.remove("active"); });

  var pageEl = document.getElementById("page-" + page);
  if (pageEl) pageEl.classList.add("active");

  var link = document.querySelector('.sidebar-link[data-page="' + page + '"]');
  if (link) link.classList.add("active");

  var breadcrumb = document.getElementById("breadcrumb");
  var titles = { dashboard: "Dashboard", applications: "Applications", reports: "Reports", notifications: "Notifications", profile: "Profile" };
  breadcrumb.innerHTML = "<span>" + (titles[page] || "Dashboard") + "</span>";

  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("profile-dropdown").classList.remove("open");
}

// ====== PROFILE DROPDOWN ======
function initProfileDropdown() {
  document.getElementById("topbar-profile").addEventListener("click", function (e) {
    e.stopPropagation();
    document.getElementById("profile-dropdown").classList.toggle("open");
  });
  document.addEventListener("click", function () {
    document.getElementById("profile-dropdown").classList.remove("open");
  });
}

// ====== SEARCH & FILTERS ======
function initSearch() {
  document.getElementById("search").addEventListener("input", function (e) {
    searchTerm = e.target.value.toLowerCase();
    currentPage = 1;
    filterAndRender();
  });
  document.getElementById("statusFilter").addEventListener("change", function (e) {
    statusFilter = e.target.value;
    currentPage = 1;
    filterAndRender();
  });
  document.getElementById("timeFilter").addEventListener("change", function (e) {
    timeFilter = e.target.value;
    currentPage = 1;
    filterAndRender();
  });
}

// ====== LOAD ======
async function loadApplications() {
  var tableBody = document.getElementById("table-body");
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="11" class="table-empty"><i class="fas fa-spinner fa-spin"></i> Loading applications...</td></tr>';

  try {
    if (supabase) {
      var result = await supabase.from("admissions").select("*").order("app_number", { ascending: true });
      if (result.error) throw result.error;
      allApplications = result.data || [];
    } else {
      allApplications = [];
    }
  } catch (err) {
    console.error("Error loading:", err);
    allApplications = [];
  }

  filterAndRender();
  addNotification("info", "Applications loaded successfully");
}

// ====== FILTER ======
function filterAndRender() {
  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);
  var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  filteredApplications = allApplications.filter(function (app) {
    var matchSearch = !searchTerm ||
      (app.child_full_name && app.child_full_name.toLowerCase().includes(searchTerm)) ||
      (app.father_full_name && app.father_full_name.toLowerCase().includes(searchTerm)) ||
      (app.mother_full_name && app.mother_full_name.toLowerCase().includes(searchTerm)) ||
      (app.father_phone && app.father_phone.includes(searchTerm)) ||
      (app.mother_phone && app.mother_phone.includes(searchTerm)) ||
      (app.father_national_id && app.father_national_id.includes(searchTerm)) ||
      (app.mother_national_id && app.mother_national_id.includes(searchTerm)) ||
      (app.district && app.district.toLowerCase().includes(searchTerm)) ||
      (app.app_number && String(app.app_number).includes(searchTerm));

    var matchStatus = statusFilter === "All" || app.status === statusFilter;

    var matchTime = true;
    if (timeFilter !== "All" && app.created_at) {
      var appDate = new Date(app.created_at);
      if (timeFilter === "today") matchTime = appDate.toISOString().slice(0, 10) === todayStr;
      if (timeFilter === "week") matchTime = appDate >= weekAgo;
      if (timeFilter === "month") matchTime = appDate >= monthStart;
    }

    return matchSearch && matchStatus && matchTime;
  });

  selectedIds.clear();
  updateBulkActions();
  renderStats();
  renderTable();
  renderRecentTable();
  renderCharts();
  renderReports();
}

// ====== STATS ======
function renderStats() {
  var todayStr = new Date().toISOString().slice(0, 10);
  var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  setText("stat-total", allApplications.length);
  setText("stat-pending", allApplications.filter(function (a) { return a.status === "Pending"; }).length);
  setText("stat-admitted", allApplications.filter(function (a) { return a.status === "Admitted"; }).length);
  setText("stat-rejected", allApplications.filter(function (a) { return a.status === "Not Admitted"; }).length);
  setText("stat-today", allApplications.filter(function (a) { return a.created_at && a.created_at.slice(0, 10) === todayStr; }).length);
  setText("stat-month", allApplications.filter(function (a) { return a.created_at && new Date(a.created_at) >= monthStart; }).length);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ====== TABLE ======
function renderTable() {
  var tbody = document.getElementById("table-body");
  var countEl = document.getElementById("result-count");
  if (countEl) countEl.textContent = filteredApplications.length + " of " + allApplications.length + " applications";

  var totalPages = Math.ceil(filteredApplications.length / perPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  var start = (currentPage - 1) * perPage;
  var pageData = filteredApplications.slice(start, start + perPage);

  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="table-empty"><i class="fas fa-search"></i><br>No applications found.</td></tr>';
    renderPagination(totalPages);
    return;
  }

  var html = "";
  pageData.forEach(function (app, i) {
    var checked = selectedIds.has(app.id) ? "checked" : "";
    html += '<tr class="' + (selectedIds.has(app.id) ? "row-selected" : "") + '">';
    html += '<td><input type="checkbox" class="row-check" data-id="' + app.id + '" ' + checked + ' /></td>';
    html += '<td class="td-muted">' + (app.app_number || "") + '</td>';
    html += '<td><strong>' + esc(app.child_full_name) + '</strong></td>';
    html += '<td>' + esc(app.gender) + '</td>';
    html += '<td class="td-muted">' + esc(app.date_of_birth) + '</td>';
    html += '<td>' + esc(app.father_full_name || "-") + '<br><small class="td-muted">' + esc(app.father_phone || "") + '</small></td>';
    html += '<td>' + esc(app.mother_full_name || "-") + '<br><small class="td-muted">' + esc(app.mother_phone || "") + '</small></td>';
    html += '<td>' + esc(app.district || "-") + '</td>';
    html += '<td>' + getStatusBadge(app.status) + '</td>';
    html += '<td class="td-muted">' + (app.created_at ? new Date(app.created_at).toLocaleDateString() : "-") + '</td>';
    html += '<td><div class="action-btns">';
    html += '<button class="btn-action view" title="View" onclick="openModal(\'' + app.id + '\')"><i class="fas fa-eye"></i></button>';
    html += '<button class="btn-action edit" title="Edit" onclick="openModal(\'' + app.id + '\');setTimeout(openEditModal,200)"><i class="fas fa-edit"></i></button>';
    html += '<button class="btn-action admit" title="Admit" onclick="quickStatus(\'' + app.id + '\',\'Admitted\')"><i class="fas fa-check"></i></button>';
    html += '<button class="btn-action reject" title="Reject" onclick="quickStatus(\'' + app.id + '\',\'Not Admitted\')"><i class="fas fa-times"></i></button>';
    html += '<button class="btn-action print" title="Print" onclick="quickPrint(\'' + app.id + '\')"><i class="fas fa-print"></i></button>';
    html += '<button class="btn-action delete" title="Delete" onclick="quickDelete(\'' + app.id + '\')"><i class="fas fa-trash"></i></button>';
    html += '</div></td></tr>';
  });

  tbody.innerHTML = html;

  tbody.querySelectorAll(".row-check").forEach(function (cb) {
    cb.addEventListener("change", function () {
      var id = this.getAttribute("data-id");
      if (this.checked) selectedIds.add(id); else selectedIds.delete(id);
      this.closest("tr").classList.toggle("row-selected", this.checked);
      updateBulkActions();
    });
  });

  renderPagination(totalPages);
}

function renderRecentTable() {
  var tbody = document.getElementById("recent-table-body");
  if (!tbody) return;
  var recent = allApplications.slice(-5).reverse();
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No applications yet.</td></tr>';
    return;
  }
  var html = "";
  recent.forEach(function (app) {
    html += '<tr>';
    html += '<td class="td-muted">' + (app.app_number || "") + '</td>';
    html += '<td><strong>' + esc(app.child_full_name) + '</strong></td>';
    html += '<td>' + esc(app.gender) + '</td>';
    html += '<td>' + esc(app.father_full_name || app.mother_full_name || "-") + '</td>';
    html += '<td>' + esc(app.district || "-") + '</td>';
    html += '<td>' + getStatusBadge(app.status) + '</td>';
    html += '<td class="td-muted">' + (app.created_at ? new Date(app.created_at).toLocaleDateString() : "-") + '</td>';
    html += '</tr>';
  });
  tbody.innerHTML = html;
}

// ====== PAGINATION ======
function renderPagination(totalPages) {
  var el = document.getElementById("pagination");
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ""; return; }

  var html = '<button class="page-btn" ' + (currentPage === 1 ? "disabled" : "") + ' onclick="goPage(' + (currentPage - 1) + ')"><i class="fas fa-chevron-left"></i></button>';

  for (var i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += '<button class="page-btn ' + (i === currentPage ? "active" : "") + '" onclick="goPage(' + i + ')">' + i + '</button>';
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span class="page-dots">...</span>';
    }
  }

  html += '<button class="page-btn" ' + (currentPage === totalPages ? "disabled" : "") + ' onclick="goPage(' + (currentPage + 1) + ')"><i class="fas fa-chevron-right"></i></button>';
  el.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderTable();
  document.getElementById("page-applications").scrollTo({ top: 0, behavior: "smooth" });
}

// ====== BULK ACTIONS ======
function initSelectAll() {
  var selectAll = document.getElementById("select-all");
  if (selectAll) {
    selectAll.addEventListener("change", function () {
      var checkboxes = document.querySelectorAll(".row-check");
      checkboxes.forEach(function (cb) {
        cb.checked = selectAll.checked;
        var id = cb.getAttribute("data-id");
        if (selectAll.checked) selectedIds.add(id); else selectedIds.delete(id);
        cb.closest("tr").classList.toggle("row-selected", selectAll.checked);
      });
      updateBulkActions();
    });
  }
}

function updateBulkActions() {
  var el = document.getElementById("bulk-actions");
  var countEl = document.getElementById("selected-count");
  if (selectedIds.size > 0) {
    el.style.display = "flex";
    countEl.textContent = selectedIds.size + " selected";
  } else {
    el.style.display = "none";
  }
}

function getSelectedApps() {
  return allApplications.filter(function (a) { return selectedIds.has(a.id); });
}

async function bulkAdmit() {
  var apps = getSelectedApps();
  if (apps.length === 0) return;
  showConfirm("Admit " + apps.length + " application(s)?", "This will change their status to Admitted.", function () { bulkUpdateStatus(apps, "Admitted"); });
}

async function bulkReject() {
  var apps = getSelectedApps();
  if (apps.length === 0) return;
  showConfirm("Reject " + apps.length + " application(s)?", "This will change their status to Not Admitted.", function () { bulkUpdateStatus(apps, "Not Admitted"); });
}

async function bulkUpdateStatus(apps, status) {
  try {
    for (var i = 0; i < apps.length; i++) {
      if (supabase) {
        await supabase.from("admissions").update({ status: status }).eq("id", apps[i].id);
      }
      var idx = allApplications.findIndex(function (a) { return a.id === apps[i].id; });
      if (idx !== -1) allApplications[idx].status = status;
    }
    selectedIds.clear();
    filterAndRender();
    showToast("success", apps.length + " application(s) updated to " + status);
    addNotification("status", apps.length + " applications changed to " + status);
  } catch (err) {
    showToast("error", "Error updating: " + err.message);
  }
}

async function bulkDelete() {
  var apps = getSelectedApps();
  if (apps.length === 0) return;
  showConfirm("Delete " + apps.length + " application(s)?", "This action cannot be undone.", async function () {
    try {
      for (var i = 0; i < apps.length; i++) {
        if (supabase) await supabase.from("admissions").delete().eq("id", apps[i].id);
      }
      allApplications = allApplications.filter(function (a) { return !selectedIds.has(a.id); });
      selectedIds.clear();
      filterAndRender();
      showToast("success", apps.length + " application(s) deleted");
    } catch (err) {
      showToast("error", "Error deleting: " + err.message);
    }
  });
}

function bulkExportExcel() { exportData(getSelectedApps(), "NCA_Selected"); }
function bulkExportPDF() { exportPDF(getSelectedApps()); }
function bulkPrint() { printMultiple(getSelectedApps()); }

// ====== CHARTS ======
function renderCharts() {
  renderDistrictChart();
  renderGenderChart();
  renderDailyChart();
}

function renderDistrictChart() {
  var counts = {};
  allApplications.forEach(function (a) {
    var d = a.district || "Unknown";
    counts[d] = (counts[d] || 0) + 1;
  });
  var labels = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  var data = labels.map(function (l) { return counts[l]; });

  if (charts.district) charts.district.destroy();
  var ctx = document.getElementById("chart-district");
  if (!ctx) return;
  charts.district = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ label: "Applications", data: data, backgroundColor: "rgba(13,71,161,0.7)", borderColor: "#0D47A1", borderWidth: 1, borderRadius: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

function renderGenderChart() {
  var male = allApplications.filter(function (a) { return a.gender === "Male"; }).length;
  var female = allApplications.filter(function (a) { return a.gender === "Female"; }).length;

  if (charts.gender) charts.gender.destroy();
  var ctx = document.getElementById("chart-gender");
  if (!ctx) return;
  charts.gender = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Male", "Female"],
      datasets: [{ data: [male, female], backgroundColor: ["#0D47A1", "#F9A825"], borderWidth: 0 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, cutout: "65%" }
  });
}

function renderDailyChart() {
  var counts = {};
  var today = new Date();
  for (var i = 6; i >= 0; i--) {
    var d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    var key = d.toISOString().slice(0, 10);
    counts[key] = 0;
  }
  allApplications.forEach(function (a) {
    if (a.created_at) {
      var key = a.created_at.slice(0, 10);
      if (counts.hasOwnProperty(key)) counts[key]++;
    }
  });
  var labels = Object.keys(counts).map(function (k) { return new Date(k).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }); });
  var data = Object.values(counts);

  if (charts.daily) charts.daily.destroy();
  var ctx = document.getElementById("chart-daily");
  if (!ctx) return;
  charts.daily = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{ label: "Applications", data: data, borderColor: "#0D47A1", backgroundColor: "rgba(13,71,161,0.1)", fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: "#0D47A1" }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

// ====== REPORTS ======
function renderReports() {
  var male = allApplications.filter(function (a) { return a.gender === "Male"; }).length;
  var female = allApplications.filter(function (a) { return a.gender === "Female"; }).length;
  var admitted = allApplications.filter(function (a) { return a.status === "Admitted"; }).length;
  var pending = allApplications.filter(function (a) { return a.status === "Pending"; }).length;
  var rejected = allApplications.filter(function (a) { return a.status === "Not Admitted"; }).length;

  var statsEl = document.getElementById("report-stats");
  if (statsEl) {
    statsEl.innerHTML =
      statRow("Total Applicants", allApplications.length, "var(--primary)") +
      statRow("Male Applicants", male, "#0D47A1") +
      statRow("Female Applicants", female, "#F9A825") +
      statRow("Admitted", admitted, "var(--success)") +
      statRow("Pending", pending, "var(--orange-500)") +
      statRow("Not Admitted", rejected, "#D32F2F");
  }

  var distCounts = {};
  allApplications.forEach(function (a) {
    var d = a.district || "Unknown";
    distCounts[d] = (distCounts[d] || 0) + 1;
  });
  var distEl = document.getElementById("district-stats");
  if (distEl) {
    var distHtml = "";
    Object.keys(distCounts).sort(function (a, b) { return distCounts[b] - distCounts[a]; }).forEach(function (d) {
      distHtml += '<div class="stat-row"><span>' + esc(d) + '</span><span class="stat-row-val">' + distCounts[d] + '</span></div>';
    });
    distEl.innerHTML = distHtml || '<div class="empty-state"><p>No data available.</p></div>';
  }
}

function statRow(label, val, color) {
  return '<div class="stat-row"><span>' + label + '</span><span class="stat-row-val" style="color:' + color + ';">' + val + '</span></div>';
}

// ====== EXPORTS ======
function exportAllExcel() { exportData(allApplications, "NCA_All_Applications"); }
function exportAllCSV() { exportCSV(allApplications); }
function exportAllPDF() { exportPDF(allApplications); }

function exportData(data, filename) {
  if (data.length === 0) { showToast("info", "No data to export."); return; }
  var headers = ["App #", "Child Name", "Gender", "DOB", "Class", "Father", "Father Phone", "Father ID", "Mother", "Mother Phone", "Mother ID", "Province", "District", "Sector", "Cell", "Village", "Birth Cert", "Status", "Submitted"];
  var rows = data.map(function (a) {
    return [a.app_number || "", a.child_full_name || "", a.gender || "", a.date_of_birth || "", a.applying_class || "", a.father_full_name || "", a.father_phone || "", a.father_national_id || "", a.mother_full_name || "", a.mother_phone || "", a.mother_national_id || "", a.province || "", a.district || "", a.sector || "", a.cell || "", a.village || "", a.birth_certificate_name || "", a.status || "", a.created_at ? new Date(a.created_at).toLocaleDateString() : ""];
  });
  var csv = headers.join(",") + "\n";
  rows.forEach(function (row) {
    csv += row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",") + "\n";
  });
  downloadBlob("\uFEFF" + csv, filename + ".csv", "text/csv;charset=utf-8;");
  showToast("success", "Excel exported successfully.");
}

function exportCSV(data) {
  if (data.length === 0) { showToast("info", "No data to export."); return; }
  exportData(data, "NCA_Report_" + new Date().toISOString().slice(0, 10));
}

function exportPDF(data) {
  if (data.length === 0) { showToast("info", "No data to export."); return; }
  var html = '<html><head><title>NCA Report</title><style>';
  html += 'body{font-family:Arial,sans-serif;padding:2rem;color:#111;font-size:0.8rem;}';
  html += 'h1{font-size:1.2rem;margin-bottom:0.3rem;color:#0D47A1;}';
  html += 'p{color:#666;margin-bottom:1rem;font-size:0.8rem;}';
  html += 'table{width:100%;border-collapse:collapse;}';
  html += 'th{background:#0D47A1;color:#fff;padding:8px;text-align:left;font-size:0.7rem;}';
  html += 'td{padding:6px 8px;border-bottom:1px solid #eee;font-size:0.75rem;}';
  html += 'tr:nth-child(even){background:#f9fafb;}';
  html += '.footer{margin-top:1.5rem;font-size:0.7rem;color:#999;border-top:1px solid #ddd;padding-top:0.5rem;text-align:center;}';
  html += '</style></head><body>';
  html += '<h1>Nyabihu Christian Academy</h1>';
  html += '<p>Admission Report &mdash; Generated: ' + new Date().toLocaleDateString() + ' (' + data.length + ' applications)</p>';
  html += '<table><thead><tr><th>#</th><th>Child</th><th>Gender</th><th>DOB</th><th>Father</th><th>Phone</th><th>District</th><th>Status</th></tr></thead><tbody>';
  data.forEach(function (a) {
    html += '<tr><td>' + (a.app_number || "") + '</td><td>' + esc(a.child_full_name) + '</td><td>' + esc(a.gender) + '</td><td>' + esc(a.date_of_birth) + '</td><td>' + esc(a.father_full_name) + '</td><td>' + esc(a.father_phone) + '</td><td>' + esc(a.district) + '</td><td>' + esc(a.status) + '</td></tr>';
  });
  html += '</tbody></table>';
  html += '<div class="footer">Nyabihu Christian Academy &mdash; Admission System</div>';
  html += '</body></html>';
  var w = window.open("", "_blank", "width=1000,height=700");
  w.document.write(html);
  w.document.close();
  setTimeout(function () { w.print(); }, 500);
  showToast("success", "PDF report generated.");
}

function printMultiple(data) {
  if (data.length === 0) { showToast("info", "No applications to print."); return; }
  exportPDF(data);
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ====== VIEW MODAL ======
function openModal(id) {
  selectedApp = allApplications.find(function (a) { return a.id === id; });
  if (!selectedApp) return;

  setText("modal-title", "Application #" + (selectedApp.app_number || ""));
  setText("modal-app-number", selectedApp.app_number || "");
  setText("modal-child-name", selectedApp.child_full_name || "");
  setText("modal-gender", selectedApp.gender || "");
  setText("modal-dob", selectedApp.date_of_birth || "");
  setText("modal-class", selectedApp.applying_class || "");
  setText("modal-father-name", selectedApp.father_full_name || "-");
  setText("modal-father-id", selectedApp.father_national_id || "-");
  setText("modal-father-phone", selectedApp.father_phone || "-");
  setText("modal-mother-name", selectedApp.mother_full_name || "-");
  setText("modal-mother-id", selectedApp.mother_national_id || "-");
  setText("modal-mother-phone", selectedApp.mother_phone || "-");
  setText("modal-province", selectedApp.province || "-");
  setText("modal-district", selectedApp.district || "-");
  setText("modal-sector", selectedApp.sector || "-");
  setText("modal-cell", selectedApp.cell || "-");
  setText("modal-village", selectedApp.village || "-");
  setText("modal-date", selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleString() : "-");

  document.getElementById("modal-status-badge").innerHTML = getStatusBadge(selectedApp.status);
  var buttonsHtml = "";
  ["Pending", "Admitted", "Not Admitted"].forEach(function (s) {
    var ac = "inactive";
    if (s === selectedApp.status) ac = s === "Admitted" ? "active-admitted" : s === "Not Admitted" ? "active-rejected" : "active-pending";
    buttonsHtml += '<button class="status-btn ' + ac + '" onclick="updateStatus(\'' + s + '\')">' + (s === "Not Admitted" ? "Reject" : s === "Admitted" ? "Admit" : s) + '</button>';
  });
  document.getElementById("modal-status-buttons").innerHTML = buttonsHtml;

  // Documents
  var docsEl = document.getElementById("modal-documents");
  if (selectedApp.birth_certificate_name) {
    var isImage = selectedApp.birth_certificate_data && selectedApp.birth_certificate_data.indexOf("image/") !== -1;
    var isPdf = selectedApp.birth_certificate_name.toLowerCase().endsWith(".pdf");
    docsEl.innerHTML =
      '<div class="doc-card">' +
      '<div class="doc-info"><i class="fas fa-file-' + (isPdf ? 'pdf' : 'image') + ' doc-icon"></i><div><p class="doc-name">' + esc(selectedApp.birth_certificate_name) + '</p><p class="doc-meta">Birth Certificate</p></div></div>' +
      '<div class="doc-actions">' +
      (isImage ? '<button class="btn btn-sm btn-outline-dark" onclick="previewImage(\'' + selectedApp.birth_certificate_data + '\')"><i class="fas fa-eye"></i> Preview</button>' : '') +
      (selectedApp.birth_certificate_data ? '<a class="btn btn-sm btn-primary-solid" href="' + selectedApp.birth_certificate_data + '" download="' + esc(selectedApp.birth_certificate_name) + '"><i class="fas fa-download"></i> Download</a>' : '') +
      '</div></div>';
  } else {
    docsEl.innerHTML = '<div class="empty-state" style="padding:20px;"><i class="fas fa-folder-open"></i><p>No documents uploaded.</p></div>';
  }

  document.getElementById("modal-overlay").classList.add("open");
  if (typeof renderAppTimeline === "function") renderAppTimeline(selectedApp.id);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  selectedApp = null;
}

document.getElementById("modal-overlay").addEventListener("click", function (e) { if (e.target === this) closeModal(); });

function previewImage(src) {
  document.getElementById("image-preview").src = src;
  document.getElementById("image-modal").classList.add("open");
}

function closeImageModal() {
  document.getElementById("image-modal").classList.remove("open");
}

document.getElementById("image-modal").addEventListener("click", function (e) { if (e.target === this) closeImageModal(); });

// ====== STATUS UPDATE ======
async function updateStatus(newStatus) {
  if (!selectedApp) return;
  try {
    if (supabase) {
      var result = await supabase.from("admissions").update({ status: newStatus }).eq("id", selectedApp.id);
      if (result.error) throw result.error;
    }
    selectedApp.status = newStatus;
    var idx = allApplications.findIndex(function (a) { return a.id === selectedApp.id; });
    if (idx !== -1) allApplications[idx].status = newStatus;
    filterAndRender();
    openModal(selectedApp.id);
    showToast("success", "Status updated to " + newStatus);
    addNotification("status", "Application #" + selectedApp.app_number + " changed to " + newStatus);
    if (typeof addCommHistory === "function") addCommHistory("status", "Application #" + selectedApp.app_number + " status changed to " + newStatus);
    if (typeof renderAppTimeline === "function") renderAppTimeline(selectedApp.id);
  } catch (err) {
    showToast("error", "Error: " + err.message);
  }
}

async function quickStatus(id, status) {
  var app = allApplications.find(function (a) { return a.id === id; });
  if (!app) return;
  showConfirm("Change status?", "Set application #" + app.app_number + " to " + status + ".", async function () {
    try {
      if (supabase) await supabase.from("admissions").update({ status: status }).eq("id", id);
      var idx = allApplications.findIndex(function (a) { return a.id === id; });
      if (idx !== -1) allApplications[idx].status = status;
      filterAndRender();
      showToast("success", "Status updated to " + status);
      addNotification("status", "Application #" + app.app_number + " changed to " + status);
    } catch (err) {
      showToast("error", "Error: " + err.message);
    }
  });
}

// ====== EDIT MODAL ======
function openEditModal() {
  if (!selectedApp) return;
  document.getElementById("edit-child-full-name").value = selectedApp.child_full_name || "";
  document.getElementById("edit-gender").value = selectedApp.gender || "Male";
  document.getElementById("edit-date-of-birth").value = selectedApp.date_of_birth || "";
  document.getElementById("edit-applying-class").value = selectedApp.applying_class || "";
  document.getElementById("edit-father-name").value = selectedApp.father_full_name || "";
  document.getElementById("edit-father-id").value = selectedApp.father_national_id || "";
  document.getElementById("edit-father-phone").value = selectedApp.father_phone || "";
  document.getElementById("edit-mother-name").value = selectedApp.mother_full_name || "";
  document.getElementById("edit-mother-id").value = selectedApp.mother_national_id || "";
  document.getElementById("edit-mother-phone").value = selectedApp.mother_phone || "";
  document.getElementById("edit-province").value = selectedApp.province || "";
  document.getElementById("edit-district").value = selectedApp.district || "";
  document.getElementById("edit-sector").value = selectedApp.sector || "";
  document.getElementById("edit-cell").value = selectedApp.cell || "";
  document.getElementById("edit-village").value = selectedApp.village || "";
  document.getElementById("edit-status").value = selectedApp.status || "Pending";
  document.getElementById("edit-modal-overlay").classList.add("open");
}

function closeEditModal() {
  document.getElementById("edit-modal-overlay").classList.remove("open");
}

document.getElementById("edit-modal-overlay").addEventListener("click", function (e) { if (e.target === this) closeEditModal(); });

async function saveEdit() {
  if (!selectedApp) return;
  var d = {
    child_full_name: document.getElementById("edit-child-full-name").value.trim(),
    gender: document.getElementById("edit-gender").value,
    date_of_birth: document.getElementById("edit-date-of-birth").value,
    applying_class: document.getElementById("edit-applying-class").value.trim(),
    father_full_name: document.getElementById("edit-father-name").value.trim() || null,
    father_national_id: document.getElementById("edit-father-id").value.trim() || null,
    father_phone: document.getElementById("edit-father-phone").value.trim() || null,
    mother_full_name: document.getElementById("edit-mother-name").value.trim() || null,
    mother_national_id: document.getElementById("edit-mother-id").value.trim() || null,
    mother_phone: document.getElementById("edit-mother-phone").value.trim() || null,
    province: document.getElementById("edit-province").value.trim() || null,
    district: document.getElementById("edit-district").value.trim() || null,
    sector: document.getElementById("edit-sector").value.trim() || null,
    cell: document.getElementById("edit-cell").value.trim() || null,
    village: document.getElementById("edit-village").value.trim() || null,
    status: document.getElementById("edit-status").value,
  };
  if (!d.child_full_name) { showToast("error", "Child's name is required."); return; }

  var btn = document.getElementById("save-edit-btn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    if (supabase) {
      var result = await supabase.from("admissions").update(d).eq("id", selectedApp.id);
      if (result.error) throw result.error;
    }
    var idx = allApplications.findIndex(function (a) { return a.id === selectedApp.id; });
    if (idx !== -1) Object.keys(d).forEach(function (k) { allApplications[idx][k] = d[k]; });
    closeEditModal();
    closeModal();
    filterAndRender();
    showToast("success", "Application updated successfully.");
    addNotification("update", "Application #" + selectedApp.app_number + " was updated.");
  } catch (err) {
    showToast("error", "Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
}

// ====== DELETE ======
async function deleteApplication() {
  if (!selectedApp) return;
  showConfirm("Delete Application?", "This will permanently delete application #" + selectedApp.app_number + ".", async function () {
    try {
      if (supabase) await supabase.from("admissions").delete().eq("id", selectedApp.id);
      allApplications = allApplications.filter(function (a) { return a.id !== selectedApp.id; });
      closeModal();
      filterAndRender();
      showToast("success", "Application deleted.");
    } catch (err) {
      showToast("error", "Error: " + err.message);
    }
  });
}

async function quickDelete(id) {
  var app = allApplications.find(function (a) { return a.id === id; });
  if (!app) return;
  showConfirm("Delete Application?", "This will permanently delete application for " + app.child_full_name + ".", async function () {
    try {
      if (supabase) await supabase.from("admissions").delete().eq("id", id);
      allApplications = allApplications.filter(function (a) { return a.id !== id; });
      filterAndRender();
      showToast("success", "Application deleted.");
    } catch (err) {
      showToast("error", "Error: " + err.message);
    }
  });
}

// ====== PRINT ======
function printApplication() {
  if (!selectedApp) return;
  var a = selectedApp;
  var html = '<html><head><title>Application #' + a.app_number + '</title><style>';
  html += 'body{font-family:Arial,sans-serif;padding:2rem;color:#111;}';
  html += 'h1{font-size:1.3rem;color:#0D47A1;}h2{font-size:1rem;color:#0D47A1;border-bottom:2px solid #0D47A1;padding-bottom:4px;margin:1.2rem 0 0.5rem;}';
  html += 'table{width:100%;border-collapse:collapse;margin-bottom:1rem;}';
  html += 'td{padding:4px 8px;font-size:0.85rem;border-bottom:1px solid #eee;}td:first-child{font-weight:bold;color:#555;width:35%;}';
  html += '.footer{margin-top:2rem;font-size:0.75rem;color:#999;border-top:1px solid #ddd;padding-top:0.5rem;}';
  html += '</style></head><body>';
  html += '<h1>Nyabihu Christian Academy</h1><p style="color:#666;">Application #' + (a.app_number || "") + ' | Submitted: ' + (a.created_at ? new Date(a.created_at).toLocaleString() : "-") + '</p>';
  html += '<h2>Child Information</h2><table><tr><td>Name</td><td>' + esc(a.child_full_name) + '</td></tr><tr><td>Gender</td><td>' + esc(a.gender) + '</td></tr><tr><td>DOB</td><td>' + esc(a.date_of_birth) + '</td></tr><tr><td>Class</td><td>' + esc(a.applying_class) + '</td></tr><tr><td>Status</td><td>' + esc(a.status) + '</td></tr></table>';
  html += '<h2>Parents</h2><table><tr><td>Father</td><td>' + esc(a.father_full_name) + ' | ID: ' + esc(a.father_national_id) + ' | Phone: ' + esc(a.father_phone) + '</td></tr>';
  html += '<tr><td>Mother</td><td>' + esc(a.mother_full_name) + ' | ID: ' + esc(a.mother_national_id) + ' | Phone: ' + esc(a.mother_phone) + '</td></tr></table>';
  html += '<h2>Address</h2><table><tr><td>Province</td><td>' + esc(a.province) + '</td></tr><tr><td>District</td><td>' + esc(a.district) + '</td></tr><tr><td>Sector</td><td>' + esc(a.sector) + '</td></tr><tr><td>Cell</td><td>' + esc(a.cell) + '</td></tr><tr><td>Village</td><td>' + esc(a.village) + '</td></tr></table>';
  html += '<div class="footer">Nyabihu Christian Academy &mdash; Admission System</div></body></html>';
  var w = window.open("", "_blank", "width=800,height=600");
  w.document.write(html); w.document.close();
  setTimeout(function () { w.print(); }, 500);
}

function quickPrint(id) {
  var app = allApplications.find(function (a) { return a.id === id; });
  if (!app) return;
  selectedApp = app;
  printApplication();
  selectedApp = null;
}

// ====== NOTIFICATIONS ======
function addNotification(type, message) {
  var n = { type: type, message: message, time: new Date().toISOString() };
  notifications.unshift(n);
  if (notifications.length > 50) notifications = notifications.slice(0, 50);
  localStorage.setItem("nca_notifications", JSON.stringify(notifications));
  renderNotifications();
  updateNotifBadge();
}

function renderNotifications() {
  var el = document.getElementById("notifications-list");
  if (!el) return;
  if (notifications.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications yet.</p></div>';
    return;
  }
  var html = "";
  notifications.forEach(function (n) {
    var icon = n.type === "status" ? "fa-check-circle" : n.type === "update" ? "fa-edit" : n.type === "error" ? "fa-exclamation-circle" : "fa-info-circle";
    var color = n.type === "status" ? "var(--success)" : n.type === "update" ? "var(--primary)" : n.type === "error" ? "#D32F2F" : "var(--accent)";
    html += '<div class="notif-item"><div class="notif-icon" style="color:' + color + ';"><i class="fas ' + icon + '"></i></div><div class="notif-content"><p>' + esc(n.message) + '</p><small>' + timeAgo(n.time) + '</small></div></div>';
  });
  el.innerHTML = html;
}

function clearNotifications() {
  notifications = [];
  localStorage.removeItem("nca_notifications");
  renderNotifications();
  updateNotifBadge();
}

function updateNotifBadge() {
  var badge = document.getElementById("notif-badge");
  var dot = document.getElementById("notif-dot");
  if (badge) badge.textContent = notifications.length > 99 ? "99+" : notifications.length;
  if (dot) dot.style.display = notifications.length > 0 ? "block" : "none";
}

function timeAgo(iso) {
  var diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// ====== PROFILE ======
function saveProfile() {
  showToast("success", "Profile saved successfully.");
}

// ====== CONFIRM DIALOG ======
function showConfirm(title, message, callback) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-overlay").classList.add("open");
  confirmCallback = callback;
  document.getElementById("confirm-ok").onclick = function () {
    document.getElementById("confirm-overlay").classList.remove("open");
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  };
}

function confirmCancel() {
  document.getElementById("confirm-overlay").classList.remove("open");
  confirmCallback = null;
}

// ====== TOAST ======
function showToast(type, message) {
  var container = document.getElementById("toast-container");
  var icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle", warning: "fa-exclamation-triangle" };
  var toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span>' + esc(message) + '</span>';
  container.appendChild(toast);
  setTimeout(function () { toast.classList.add("show"); }, 10);
  setTimeout(function () { toast.classList.remove("show"); setTimeout(function () { toast.remove(); }, 300); }, 3000);
}

// ====== HELPERS ======
function getStatusBadge(status) {
  var cls = "badge-pending";
  if (status === "Admitted") cls = "badge-admitted";
  if (status === "Not Admitted") cls = "badge-rejected";
  return '<span class="badge ' + cls + '"><i class="fas fa-' + (status === "Admitted" ? "check" : status === "Not Admitted" ? "times" : "clock") + '"></i> ' + esc(status) + '</span>';
}

function esc(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
