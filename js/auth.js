var AUTH_KEY = "nca_admin_auth";
var ADMIN_EMAIL = "valentinuwi@gmail.com";
var ADMIN_PASSWORD = "123456";

function isLoggedIn() {
  var session = localStorage.getItem(AUTH_KEY);
  if (!session) return false;
  try {
    var data = JSON.parse(session);
    if (data.email === ADMIN_EMAIL && data.loggedIn === true) {
      return true;
    }
  } catch (e) {}
  return false;
}

function login(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    var session = { email: email, loggedIn: true, timestamp: Date.now() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "login.html";
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}
