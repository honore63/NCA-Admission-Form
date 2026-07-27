// =============================================
// NCA Communication Module
// =============================================

var commStore = {
  announcements: JSON.parse(localStorage.getItem("nca_announcements") || "[]"),
  messages: JSON.parse(localStorage.getItem("nca_messages") || "[]"),
  history: JSON.parse(localStorage.getItem("nca_comm_history") || "[]")
};

var templates = [
  { id: "received", title: "Application Received", icon: "fa-check-circle", color: "var(--success)", message: "Thank you for applying to Nyabihu Christian Academy. Your application has been received and is under review." },
  { id: "review", title: "Under Review", icon: "fa-search", color: "var(--primary)", message: "Your application is currently being reviewed by our admission team. We will notify you once a decision has been made." },
  { id: "doc-request", title: "Document Request", icon: "fa-file-upload", color: "var(--accent)", message: "Please upload a clear copy of the Birth Certificate (Icyemezo cy'Amavuko) issued through IREMBO or the National Civil Registration System." },
  { id: "approved", title: "Admission Approved", icon: "fa-graduation-cap", color: "var(--success)", message: "Congratulations! Your child has been admitted to Nyabihu Christian Academy. Please visit the school for registration and fee payment." },
  { id: "declined", title: "Admission Declined", icon: "fa-times-circle", color: "#D32F2F", message: "We appreciate your interest in Nyabihu Christian Academy. Unfortunately, your application was not successful at this time. We wish you the best in finding a suitable school for your child." },
  { id: "welcome", title: "Welcome Message", icon: "fa-hand-holding-heart", color: "var(--primary)", message: "Welcome to Nyabihu Christian Academy! We are delighted to have your child join our learning community. Please complete the registration process at your earliest convenience." }
];

// ====== INIT ======
document.addEventListener("DOMContentLoaded", function () {
  initCommTabs();
  renderAnnouncements();
  renderMessages();
  renderTemplates();
  renderCommHistory();
});

// ====== TABS ======
function initCommTabs() {
  document.querySelectorAll(".comm-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".comm-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".comm-panel").forEach(function (p) { p.classList.remove("active"); });
      this.classList.add("active");
      var panel = document.getElementById("tab-" + this.getAttribute("data-tab"));
      if (panel) panel.classList.add("active");
    });
  });
}

// ====== ANNOUNCEMENTS ======
function openAnnouncementModal(id) {
  var modal = document.getElementById("announcement-modal");
  var titleEl = document.getElementById("ann-modal-title");
  if (id) {
    var ann = commStore.announcements.find(function (a) { return a.id === id; });
    if (!ann) return;
    titleEl.textContent = "Edit Announcement";
    document.getElementById("ann-id").value = ann.id;
    document.getElementById("ann-title").value = ann.title;
    document.getElementById("ann-message").value = ann.message;
    document.getElementById("ann-category").value = ann.category || "General";
    document.getElementById("ann-priority").value = ann.priority || "Medium";
    document.getElementById("ann-audience").value = ann.target_audience || "All";
    document.getElementById("ann-status").value = ann.status || "Draft";
    document.getElementById("ann-publish").value = ann.publish_date ? ann.publish_date.slice(0, 16) : "";
    document.getElementById("ann-expiry").value = ann.expiry_date ? ann.expiry_date.slice(0, 16) : "";
  } else {
    titleEl.textContent = "New Announcement";
    document.getElementById("announcement-form").reset();
    document.getElementById("ann-id").value = "";
    document.getElementById("ann-publish").value = new Date().toISOString().slice(0, 16);
  }
  modal.classList.add("open");
}

function closeAnnouncementModal() {
  document.getElementById("announcement-modal").classList.remove("open");
}

function saveAnnouncement() {
  var id = document.getElementById("ann-id").value;
  var title = document.getElementById("ann-title").value.trim();
  var message = document.getElementById("ann-message").value.trim();
  if (!title || !message) { showToast("error", "Title and message are required."); return; }

  var data = {
    id: id || "ann_" + Date.now(),
    title: title,
    message: message,
    category: document.getElementById("ann-category").value,
    priority: document.getElementById("ann-priority").value,
    target_audience: document.getElementById("ann-audience").value,
    status: document.getElementById("ann-status").value,
    publish_date: document.getElementById("ann-publish").value || new Date().toISOString(),
    expiry_date: document.getElementById("ann-expiry").value || null,
    created_at: new Date().toISOString()
  };

  if (id) {
    var idx = commStore.announcements.findIndex(function (a) { return a.id === id; });
    if (idx !== -1) commStore.announcements[idx] = data;
  } else {
    commStore.announcements.unshift(data);
  }

  saveAnnouncements();
  renderAnnouncements();
  closeAnnouncementModal();
  addCommHistory("announcement", "Announcement " + (id ? "updated" : "created") + ": " + title);
  showToast("success", "Announcement saved successfully.");
}

function deleteAnnouncement(id) {
  showConfirm("Delete Announcement?", "This cannot be undone.", function () {
    commStore.announcements = commStore.announcements.filter(function (a) { return a.id !== id; });
    saveAnnouncements();
    renderAnnouncements();
    showToast("success", "Announcement deleted.");
  });
}

function renderAnnouncements() {
  var el = document.getElementById("announcements-list");
  if (!el) return;
  if (commStore.announcements.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet.</p></div>';
    return;
  }
  var html = "";
  commStore.announcements.forEach(function (ann) {
    var priorityClass = ann.priority === "High" ? "badge-rejected" : ann.priority === "Medium" ? "badge-pending" : "badge-admitted";
    var statusClass = ann.status === "Published" ? "badge-admitted" : "badge-pending";
    html += '<div class="ann-card">';
    html += '<div class="ann-card-header">';
    html += '<div><h4>' + esc(ann.title) + '</h4><p class="ann-meta"><i class="fas fa-folder"></i> ' + esc(ann.category) + ' &bull; <i class="fas fa-bullseye"></i> ' + esc(ann.target_audience) + ' &bull; ' + timeAgoShort(ann.created_at) + '</p></div>';
    html += '<div class="ann-badges"><span class="badge ' + priorityClass + '">' + esc(ann.priority) + '</span><span class="badge ' + statusClass + '">' + esc(ann.status) + '</span></div>';
    html += '</div>';
    html += '<div class="ann-card-body"><p>' + esc(ann.message) + '</p></div>';
    html += '<div class="ann-card-footer">';
    html += '<button class="btn btn-sm btn-outline-dark" onclick="openAnnouncementModal(\'' + ann.id + '\')"><i class="fas fa-edit"></i> Edit</button>';
    html += '<button class="btn btn-sm btn-danger" onclick="deleteAnnouncement(\'' + ann.id + '\')"><i class="fas fa-trash"></i> Delete</button>';
    html += '</div></div>';
  });
  el.innerHTML = html;
}

function saveAnnouncements() {
  localStorage.setItem("nca_announcements", JSON.stringify(commStore.announcements));
}

// ====== MESSAGES ======
function openNewMessageModal() {
  var select = document.getElementById("msg-recipient");
  select.innerHTML = '<option value="">Select Application</option>';
  allApplications.forEach(function (app) {
    select.innerHTML += '<option value="' + app.id + '">#' + (app.app_number || "") + ' - ' + esc(app.child_full_name) + '</option>';
  });
  document.getElementById("msg-content").value = "";
  document.getElementById("msg-template-select").value = "";
  document.getElementById("new-message-modal").classList.add("open");
}

function closeNewMessageModal() {
  document.getElementById("new-message-modal").classList.remove("open");
}

function applyMsgTemplate() {
  var val = document.getElementById("msg-template-select").value;
  if (val) {
    var tpl = templates.find(function (t) { return t.id === val; });
    if (tpl) document.getElementById("msg-content").value = tpl.message;
  }
}

function sendNewMessage() {
  var appId = document.getElementById("msg-recipient").value;
  var message = document.getElementById("msg-content").value.trim();
  if (!appId || !message) { showToast("error", "Select an application and enter a message."); return; }

  var msg = {
    id: "msg_" + Date.now(),
    application_id: appId,
    sender: "admin",
    message: message,
    is_read: false,
    created_at: new Date().toISOString()
  };

  commStore.messages.unshift(msg);
  saveMessages();
  addCommHistory("message", "Message sent to application #" + (allApplications.find(function (a) { return a.id === appId; }) || {}).app_number);
  closeNewMessageModal();
  renderMessages();
  showToast("success", "Message sent successfully.");
}

function sendAppMessage() {
  if (!selectedApp) return;
  var input = document.getElementById("modal-comm-input");
  var message = input.value.trim();
  if (!message) return;

  var msg = {
    id: "msg_" + Date.now(),
    application_id: selectedApp.id,
    sender: "admin",
    message: message,
    is_read: false,
    created_at: new Date().toISOString()
  };

  commStore.messages.unshift(msg);
  saveMessages();
  addCommHistory("message", "Message sent to application #" + selectedApp.app_number);
  input.value = "";
  renderAppTimeline(selectedApp.id);
  showToast("success", "Message sent.");
}

function renderMessages() {
  var el = document.getElementById("messages-list");
  if (!el) return;
  if (commStore.messages.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open"></i><p>No messages yet.</p></div>';
    return;
  }
  var html = "";
  commStore.messages.slice(0, 50).forEach(function (msg) {
    var app = allApplications ? allApplications.find(function (a) { return a.id === msg.application_id; }) : null;
    var senderIcon = msg.sender === "admin" ? "fa-user-tie" : "fa-user";
    html += '<div class="msg-card">';
    html += '<div class="msg-icon" style="color:' + (msg.sender === "admin" ? "var(--primary)" : "var(--accent)") + ';"><i class="fas ' + senderIcon + '"></i></div>';
    html += '<div class="msg-content">';
    html += '<div class="msg-header"><strong>To: #' + (app ? app.app_number : "?") + ' - ' + esc(app ? app.child_full_name : "Unknown") + '</strong><span class="msg-time">' + timeAgoShort(msg.created_at) + '</span></div>';
    html += '<p>' + esc(msg.message) + '</p>';
    html += '</div></div>';
  });
  el.innerHTML = html;
}

function saveMessages() {
  localStorage.setItem("nca_messages", JSON.stringify(commStore.messages));
}

// ====== TEMPLATES ======
function renderTemplates() {
  var el = document.getElementById("templates-grid");
  if (!el) return;
  var html = "";
  templates.forEach(function (t) {
    html += '<div class="template-card">';
    html += '<div class="template-icon" style="background:' + t.color + '15; color:' + t.color + ';"><i class="fas ' + t.icon + '"></i></div>';
    html += '<h4>' + esc(t.title) + '</h4>';
    html += '<p>' + esc(t.message) + '</p>';
    html += '<button class="btn btn-sm btn-outline-dark" onclick="copyTemplate(\'' + t.id + '\')"><i class="fas fa-copy"></i> Copy</button>';
    html += '</div>';
  });
  el.innerHTML = html;
}

function copyTemplate(id) {
  var tpl = templates.find(function (t) { return t.id === id; });
  if (tpl) {
    navigator.clipboard.writeText(tpl.message).then(function () {
      showToast("success", "Template copied to clipboard.");
    });
  }
}

// ====== COMMUNICATION HISTORY ======
function addCommHistory(type, detail) {
  commStore.history.unshift({
    id: "ch_" + Date.now(),
    type: type,
    detail: detail,
    created_at: new Date().toISOString()
  });
  if (commStore.history.length > 200) commStore.history = commStore.history.slice(0, 200);
  localStorage.setItem("nca_comm_history", JSON.stringify(commStore.history));
}

function renderCommHistory() {
  var el = document.getElementById("comm-history-list");
  if (!el) return;
  if (commStore.history.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No communication history yet.</p></div>';
    return;
  }
  var html = "";
  commStore.history.slice(0, 50).forEach(function (h) {
    var icon = h.type === "announcement" ? "fa-bullhorn" : h.type === "message" ? "fa-envelope" : h.type === "status" ? "fa-check-circle" : h.type === "document" ? "fa-file" : "fa-info-circle";
    var color = h.type === "status" ? "var(--success)" : h.type === "message" ? "var(--primary)" : "var(--accent)";
    html += '<div class="hist-item">';
    html += '<div class="hist-icon" style="color:' + color + ';"><i class="fas ' + icon + '"></i></div>';
    html += '<div class="hist-content"><p>' + esc(h.detail) + '</p><small>' + timeAgoShort(h.created_at) + '</small></div>';
    html += '</div>';
  });
  el.innerHTML = html;
}

// ====== APP TIMELINE (inside view modal) ======
function renderAppTimeline(appId) {
  var timelineEl = document.getElementById("modal-comm-timeline");
  if (!timelineEl) return;

  var appMessages = commStore.messages.filter(function (m) { return m.application_id === appId; });
  var appHistory = commStore.history.filter(function (h) { return h.detail && h.detail.includes("#") && allApplications; });

  var html = '<div class="timeline">';
  html += '<div class="timeline-item timeline-admin"><div class="timeline-dot" style="background:var(--primary);"></div><div class="timeline-content"><p>Application created</p><small>System</small></div></div>';

  appMessages.forEach(function (msg) {
    var isParent = msg.sender === "parent";
    html += '<div class="timeline-item ' + (isParent ? "timeline-parent" : "timeline-admin") + '">';
    html += '<div class="timeline-dot" style="background:' + (isParent ? "var(--accent)" : "var(--primary)") + ';"></div>';
    html += '<div class="timeline-content"><p>' + esc(msg.message) + '</p><small>' + (isParent ? "Parent" : "Administrator") + ' &bull; ' + timeAgoShort(msg.created_at) + '</small></div>';
    html += '</div>';
  });

  html += '</div>';
  timelineEl.innerHTML = html;

  // Render quick templates bar
  var tplBar = document.getElementById("modal-templates-bar");
  if (tplBar) {
    var tplHtml = '<span class="tpl-label">Quick:</span>';
    templates.slice(0, 4).forEach(function (t) {
      tplHtml += '<button class="tpl-btn" onclick="useTemplate(\'' + t.id + '\')"><i class="fas ' + t.icon + '"></i> ' + esc(t.title) + '</button>';
    });
    tplBar.innerHTML = tplHtml;
  }
}

function useTemplate(id) {
  var tpl = templates.find(function (t) { return t.id === id; });
  if (tpl) document.getElementById("modal-comm-input").value = tpl.message;
}

// ====== HELPERS ======
function timeAgoShort(iso) {
  if (!iso) return "";
  var diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
  return new Date(iso).toLocaleDateString();
}
