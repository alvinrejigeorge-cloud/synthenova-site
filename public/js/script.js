
"use strict";
/* =========================================================
SYNTHENOVA
PUBLIC FRONTEND + SUPABASE AUTH + ADMIN CONTROL CENTER
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
function hidePageLoader() {
const loader = document.getElementById("pageLoader");
if (!loader) return;
loader.classList.add("hidden");
setTimeout(() => {
loader.style.display = "none";
}, 700);
}
/* =========================================================
BASIC HELPERS
========================================================= */
const $ = (id) =>
document.getElementById(id);
const body = document.body;
/* =========================================================
SYNTHENOVA MENU
DESKTOP + TABLET + MOBILE
========================================================= */
const menuButton =
document.getElementById("menuButton");
const sideMenu =
document.getElementById("sideMenu");
const menuOverlay =
document.getElementById("menuOverlay");
const closeMenu =
document.getElementById("closeMenu");
function openMenu() {
if (sideMenu) {
sideMenu.classList.add("active");
}
if (menuOverlay) {
menuOverlay.classList.add("active");
}
if (body) {
body.classList.add("menu-open");
}
if (menuButton) {
menuButton.classList.add("active");
menuButton.setAttribute(
"aria-expanded",
"true"
);
menuButton.setAttribute(
"aria-label",
"Close navigation menu"
);
}
}
function closeSideMenu() {
if (sideMenu) {
sideMenu.classList.remove("active");
}
if (menuOverlay) {
menuOverlay.classList.remove("active");
}
if (body) {
body.classList.remove("menu-open");
}
if (menuButton) {
menuButton.classList.remove("active");
menuButton.setAttribute(
"aria-expanded",
"false"
);
menuButton.setAttribute(
"aria-label",
"Open navigation menu"
);
}
}
function toggleMenu(event) {
if (event) {
event.preventDefault();
event.stopPropagation();
}
if (
sideMenu &&
sideMenu.classList.contains("active")
) {
closeSideMenu();
} else {
openMenu();
}
}
if (menuButton) {
menuButton.setAttribute(
"type",
"button"
);
menuButton.setAttribute(
"aria-expanded",
"false"
);
menuButton.setAttribute(
"aria-label",
"Open navigation menu"
);
menuButton.style.pointerEvents =
"auto";
menuButton.style.cursor =
"pointer";
menuButton.addEventListener(
"click",
toggleMenu
);
menuButton.addEventListener(
"pointerup",
event => {
if (
event.pointerType === "mouse"
) {
return;
}
toggleMenu(event);
}
);
menuButton.addEventListener(
"keydown",
event => {
if (
event.key === "Enter" ||
event.key === " "
) {
event.preventDefault();
toggleMenu(event);
}
}
);
}
if (closeMenu) {
closeMenu.addEventListener(
"click",
event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
}
);
}
if (menuOverlay) {
menuOverlay.addEventListener(
"click",
event => {
event.preventDefault();
closeSideMenu();
}
);
}
document
.querySelectorAll(
".menu-navigation a, .mobile-nav a"
)
.forEach(
link => {
link.addEventListener(
"click",
() => {
closeSideMenu();
}
);
}
);
document.addEventListener(
"keydown",
event => {
if (
event.key === "Escape"
) {
closeSideMenu();
}
}
);
/* =========================================================
SUPABASE
========================================================= */
let supabaseClient = null;
let currentUser = null;
let isAdmin = false;
let editingTeamId = null;
let editingEventId = null;
let editingGalleryId = null;
/* =========================================================
ESCAPE HTML
========================================================= */
function escapeHTML(value) {
if (value === null || value === undefined) {
return "";
}
return String(value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}
/* =========================================================
INITIALIZE SUPABASE
========================================================= */
async function initializeSupabase() {
try {
const response =
await fetch("/api/config");
if (!response.ok) {
throw new Error(
"Unable to load Supabase configuration."
);
}
const config =
await response.json();
if (
!config.success ||
!config.supabaseUrl ||
!config.supabasePublishableKey
) {
throw new Error(
"Supabase configuration is missing."
);
}
if (
typeof window.supabase ===
"undefined"
) {
throw new Error(
"Supabase library is not loaded."
);
}
supabaseClient =
window.supabase.createClient(
config.supabaseUrl,
config.supabasePublishableKey
);
console.log(
"SYNTHENOVA Supabase initialized."
);
} catch (error) {
console.error(
"Supabase initialization error:",
error
);
supabaseClient = null;
}
}
/* =========================================================
NAVIGATION
========================================================= */
function setupNavigation() {
const navLinks =
document.querySelectorAll(
'a[href^="#"]'
);
navLinks.forEach(link => {
link.addEventListener(
"click",
event => {
const targetId =
link.getAttribute("href");
if (
!targetId ||
targetId === "#"
) {
return;
}
const target =
document.querySelector(
targetId
);
if (!target) {
return;
}
event.preventDefault();
closeSideMenu();
const header =
document.querySelector(
".site-header, header"
);
const headerHeight =
header
? header.offsetHeight
: 0;
const targetPosition =
target.getBoundingClientRect()
.top +
window.scrollY -
headerHeight -
20;
window.scrollTo({
top: targetPosition,
behavior: "smooth"
});
}
);
});
const logo =
document.querySelector(
".logo, .brand-logo, [data-home]"
);
if (logo) {
logo.addEventListener(
"click",
event => {
const home =
document.querySelector(
"#home"
);
if (!home) {
return;
}
event.preventDefault();
closeSideMenu();
window.scrollTo({
top: 0,
behavior: "smooth"
});
}
);
}
}
/* =========================================================
PUBLIC INTERACTIONS
========================================================= */
function setupPublicInteractions() {
const yearElements =
document.querySelectorAll(
"[data-current-year]"
);
yearElements.forEach(
element => {
element.textContent =
new Date().getFullYear();
}
);
const backToTop =
$("backToTop");
if (backToTop) {
window.addEventListener(
"scroll",
() => {
if (
window.scrollY >
500
) {
backToTop.classList.add(
"visible"
);
} else {
backToTop.classList.remove(
"visible"
);
}
}
);
backToTop.addEventListener(
"click",
() => {
window.scrollTo({
top: 0,
behavior: "smooth"
});
}
);
}
const contactForm =
$("contactForm");
if (contactForm) {
contactForm.addEventListener(
"submit",
event => {
event.preventDefault();
const message =
$("contactMessage");
if (message) {
message.textContent =
"THANK YOU. YOUR MESSAGE HAS BEEN RECEIVED.";
message.classList.add(
"visible"
);
}
contactForm.reset();
}
);
}
}
/* =========================================================
AUTH UI HELPERS
========================================================= */
function updateAuthUI() {
const loginButton = $("loginButton");
const adminButton = $("adminButton");
const logoutButton = $("logoutButton");
const authStatus = $("authStatus");
const mobileLogin = $("mobileLogin");
const mobileAdmin = $("mobileAdmin");
const mobileLogout = $("mobileLogout");
const isVerifiedAdmin =
!!currentUser && isAdmin === true;
/*
NORMAL VISITOR
*/
if (!isVerifiedAdmin) {
if (loginButton) {
loginButton.classList.remove("hidden");
loginButton.style.display = "inline-flex";
}
if (adminButton) {
adminButton.classList.add("hidden");
adminButton.style.display = "none";
}
if (logoutButton) {
logoutButton.classList.add("hidden");
logoutButton.style.display = "none";
}
if (mobileLogin) {
mobileLogin.classList.remove("hidden");
mobileLogin.style.display = "flex";
}
if (mobileAdmin) {
mobileAdmin.classList.add("hidden");
mobileAdmin.style.display = "none";
}
if (mobileLogout) {
mobileLogout.classList.add("hidden");
mobileLogout.style.display = "none";
}
if (authStatus) {
authStatus.textContent =
currentUser ? "AUTHENTICATED" : "GUEST";
}
return;
}
/*
VERIFIED ADMIN ONLY
*/
if (loginButton) {
loginButton.classList.add("hidden");
loginButton.style.display = "none";
}
if (adminButton) {
adminButton.classList.remove("hidden");
adminButton.style.display = "inline-flex";
adminButton.textContent = "ADMIN DASHBOARD";
}
if (logoutButton) {
logoutButton.classList.remove("hidden");
logoutButton.style.display = "inline-flex";
}
if (mobileLogin) {
mobileLogin.classList.add("hidden");
mobileLogin.style.display = "none";
}
if (mobileAdmin) {
mobileAdmin.classList.remove("hidden");
mobileAdmin.style.display = "flex";
mobileAdmin.textContent = "ADMIN DASHBOARD";
}
if (mobileLogout) {
mobileLogout.classList.remove("hidden");
mobileLogout.style.display = "flex";
}
if (authStatus) {
authStatus.textContent = "ADMIN";
}
}
/* =========================================================
AUTHENTICATION
========================================================= */
function setupAuthentication() {
const loginForm =
$("loginForm");
const loginModal =
$("loginModal");
const closeLoginModal =
$("closeLoginModal");
const loginButton =
$("loginButton");
const adminButton =
$("adminButton");
const logoutButton =
$("logoutButton");
const mobileLogin =
$("mobileLogin");
const mobileAdmin =
$("mobileAdmin");
if (loginButton) {
loginButton.addEventListener(
"click",
event => {
event.preventDefault();
loginModal?.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
);
}
if (adminButton) {
adminButton.addEventListener(
"click",
async event => {
event.preventDefault();
event.stopPropagation();
if (!currentUser) {
if (loginModal) {
loginModal.classList.add("active");
body.classList.add("modal-open");
}
return;
}
const verified =
await verifyAdmin();
updateAuthUI();
if (verified) {
await openAdminDashboard();
} else {
alert("ADMIN ACCESS REQUIRED.");
}
}
);
}
if (mobileLogin) {
mobileLogin.addEventListener(
"click",
event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
if (loginModal) {
loginModal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
}
);
}
if (closeLoginModal) {
closeLoginModal.addEventListener(
"click",
event => {
event.preventDefault();
loginModal?.classList.remove(
"active"
);
body.classList.remove(
"modal-open"
);
}
);
}
if (loginModal) {
loginModal.addEventListener(
"click",
event => {
if (
event.target ===
loginModal
) {
loginModal.classList.remove(
"active"
);
body.classList.remove(
"modal-open"
);
}
}
);
}
if (loginForm) {
loginForm.addEventListener(
"submit",
async event => {
event.preventDefault();
if (!supabaseClient) {
alert(
"SUPABASE IS NOT AVAILABLE."
);
return;
}
const email =
$("loginEmail")?.value
?.trim();
const password =
$("loginPassword")?.value
?.trim();
if (
!email ||
!password
) {
alert(
"PLEASE ENTER EMAIL AND PASSWORD."
);
return;
}
try {
const {
data,
error
} =
await supabaseClient
.auth
.signInWithPassword({
email,
password
});
if (error) {
throw error;
}
currentUser =
data.user;
const verifiedAdmin =
await verifyAdmin();
if (!verifiedAdmin) {
await supabaseClient.auth.signOut();
currentUser = null;
isAdmin = false;
updateAuthUI();
throw new Error(
"This account does not have SYNTHENOVA admin access."
);
}
updateAuthUI();
closeLoginModal?.classList.remove(
"active"
);
body.classList.remove(
"modal-open"
);
if (isAdmin) {
await openAdminDashboard();
}
} catch (error) {
console.error(
"Login error:",
error
);
alert(
error.message ||
"LOGIN FAILED."
);
}
}
);
}
if (logoutButton) {
logoutButton.addEventListener(
"click",
async event => {
event.preventDefault();
await logoutUser();
}
);
}
const mobileLogout =
$("mobileLogout");
if (mobileLogout) {
mobileLogout.addEventListener(
"click",
async event => {
event.preventDefault();
closeSideMenu();
await logoutUser();
}
);
}
if (mobileAdmin) {
mobileAdmin.addEventListener(
"click",
async event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
if (!currentUser) {
if (loginModal) {
loginModal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
return;
}
const verified =
await verifyAdmin();
updateAuthUI();
if (verified) {
await openAdminDashboard();
} else {
alert(
"ADMIN ACCESS REQUIRED."
);
}
}
);
}
}
/* =========================================================
ADMIN VERIFICATION
========================================================= */
async function verifyAdmin() {
isAdmin = false;
if (
!supabaseClient ||
!currentUser
) {
return false;
}
try {
const {
data,
error
} =
await supabaseClient
.from("admin_users")
.select("user_id")
.eq(
"user_id",
currentUser.id
)
.maybeSingle();
if (error) {
throw error;
}
isAdmin =
!!data;
return isAdmin;
} catch (error) {
console.error(
"Admin verification error:",
error
);
isAdmin = false;
return false;
}
}
/* =========================================================
AUTH SESSION
========================================================= */
async function initializeAuth() {
if (!supabaseClient) {
return;
}
try {
const {
data
} =
await supabaseClient
.auth
.getSession();
currentUser =
data?.session?.user ||
null;
if (currentUser) {
await verifyAdmin();
}
updateAuthUI();
supabaseClient.auth.onAuthStateChange(
async (
event,
session
) => {
currentUser =
session?.user ||
null;
if (currentUser) {
await verifyAdmin();
} else {
isAdmin = false;
}
updateAuthUI();
}
);
} catch (error) {
console.error(
"Auth initialization error:",
error
);
}
}
/* =========================================================
LOGOUT
========================================================= */
async function logoutUser() {
try {
if (supabaseClient) {
await supabaseClient
.auth
.signOut();
}
} catch (error) {
console.error(
"Logout error:",
error
);
}
currentUser = null;
isAdmin = false;
updateAuthUI();
closeDashboard();
}
/* =========================================================
ADMIN DASHBOARD
========================================================= */
async function openAdminDashboard() {
if (!isAdmin) {
const verified =
await verifyAdmin();
if (!verified) {
return;
}
}
const dashboard =
$("adminDashboard");
if (!dashboard) {
return;
}
dashboard.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
switchAdminTab(
"team"
);
await refreshAdminDashboard();
}
/* =========================================================
CLOSE ADMIN DASHBOARD
========================================================= */
function closeDashboard() {
const dashboard =
$("adminDashboard");
if (dashboard) {
dashboard.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
}
/* =========================================================
ADMIN DASHBOARD CLOSE BUTTON
========================================================= */
function setupAdminDashboard() {
const dashboard = $("adminDashboard");
const closeButton = $("closeDashboard");
const logoutButton = $("dashboardLogout");
if (closeButton) {
closeButton.addEventListener(
"click",
event => {
event.preventDefault();
closeDashboard();
}
);
}
if (logoutButton) {
logoutButton.addEventListener(
"click",
async event => {
event.preventDefault();
await logoutUser();
}
);
}
if (dashboard) {
dashboard.addEventListener(
"click",
event => {
if (event.target === dashboard) {
closeDashboard();
}
}
);
}
setupAdminTabs();
setupTeamAdmin();
setupEventAdmin();
setupGalleryAdmin();
}
/* =========================================================
ADMIN TABS
========================================================= */
function setupAdminTabs() {
document
.querySelectorAll(".admin-tab")
.forEach(tab => {
tab.addEventListener(
"click",
event => {
event.preventDefault();
const tabName =
tab.dataset.adminTab;
if (!tabName) {
return;
}
switchAdminTab(tabName);
}
);
});
document
.querySelectorAll(".admin-stat[data-admin-tab]")
.forEach(card => {
card.addEventListener(
"click",
event => {
event.preventDefault();
const tabName =
card.dataset.adminTab;
if (!tabName) {
return;
}
switchAdminTab(tabName);
}
);
});
}
/* =========================================================
SWITCH ADMIN TAB
========================================================= */
function switchAdminTab(tabName) {
const validTabs = [
"team",
"events",
"gallery"
];
if (!validTabs.includes(tabName)) {
return;
}
document
.querySelectorAll(".admin-tab")
.forEach(tab => {
tab.classList.toggle(
"active",
tab.dataset.adminTab === tabName
);
});
document
.querySelectorAll(".admin-management-panel")
.forEach(panel => {
panel.classList.remove("active");
});
const panelMap = {
team: "adminTeamPanel",
events: "adminEventsPanel",
gallery: "adminGalleryPanel"
};
const targetPanel =
$(panelMap[tabName]);
if (targetPanel) {
targetPanel.classList.add("active");
}
if (tabName === "team") {
loadAdminTeam();
}
if (tabName === "events") {
loadAdminEvents();
}
if (tabName === "gallery") {
loadAdminGallery();
}
}
/* =========================================================
CAPITALIZE
========================================================= */
function capitalizeFirstLetter(
value
) {
if (!value) {
return "";
}
return (
value.charAt(0).toUpperCase() +
value.slice(1)
);
}
/* =========================================================
REFRESH ADMIN DASHBOARD
========================================================= */
async function refreshAdminDashboard() {
if (!supabaseClient) {
return;
}
if (!isAdmin) {
return;
}
await Promise.all([
updateTeamCount(),
updateEventCount(),
updateGalleryCount()
]);
const activeTab =
document.querySelector(
".admin-tab.active"
);
if (
activeTab &&
activeTab.dataset.adminTab
) {
switchAdminTab(
activeTab.dataset.adminTab
);
}
}
/* =========================================================
TEAM COUNT
========================================================= */
async function updateTeamCount() {
const countElement =
$("teamCount");
if (!countElement) {
return;
}
if (!supabaseClient) {
countElement.textContent =
"0";
return;
}
try {
const {
count,
error
} =
await supabaseClient
.from("team_members")
.select(
"id",
{
count: "exact",
head: true
}
)
.eq(
"active",
true
);
if (error) {
throw error;
}
countElement.textContent =
String(count || 0);
} catch (error) {
console.error(
"Team count error:",
error
);
countElement.textContent =
"0";
}
}
/* =========================================================
EVENT COUNT
========================================================= */
async function updateEventCount() {
const countElement =
$("eventCount");
if (!countElement) {
return;
}
if (!supabaseClient) {
countElement.textContent =
"0";
return;
}
try {
const {
count,
error
} =
await supabaseClient
.from("events")
.select(
"id",
{
count: "exact",
head: true
}
);
if (error) {
throw error;
}
countElement.textContent =
String(count || 0);
} catch (error) {
console.error(
"Event count error:",
error
);
countElement.textContent =
"0";
}
}
/* =========================================================
GALLERY COUNT
========================================================= */
async function updateGalleryCount() {
const countElement =
$("galleryCount");
if (!countElement) {
return;
}
if (!supabaseClient) {
countElement.textContent =
"0";
return;
}
try {
const {
count,
error
} =
await supabaseClient
.from("gallery")
.select(
"id",
{
count: "exact",
head: true
}
);
if (error) {
throw error;
}
countElement.textContent =
String(count || 0);
} catch (error) {
console.error(
"Gallery count error:",
error
);
countElement.textContent =
"0";
}
}
/* =========================================================
TEAM ADMIN SETUP
========================================================= */
function setupTeamAdmin() {
const addButton =
$("addTeamButton");
const modal =
$("teamAdminModal");
const closeButton =
$("closeTeamAdminModal");
const cancelButton =
$("cancelTeamAdmin");
const form =
$("teamAdminForm");
if (addButton) {
addButton.addEventListener(
"click",
event => {
event.preventDefault();
openTeamAdminModal();
}
);
}
if (closeButton) {
closeButton.addEventListener(
"click",
event => {
event.preventDefault();
closeTeamAdminModal();
}
);
}
if (cancelButton) {
cancelButton.addEventListener(
"click",
event => {
event.preventDefault();
closeTeamAdminModal();
}
);
}
if (modal) {
modal.addEventListener(
"click",
event => {
if (
event.target ===
modal
) {
closeTeamAdminModal();
}
}
);
}
if (form) {
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveTeamMember();
}
);
}
}
/* =========================================================
OPEN TEAM MODAL
========================================================= */
function openTeamAdminModal(
member = null
) {
const modal =
$("teamAdminModal");
const form =
$("teamAdminForm");
const title =
$("teamAdminModalTitle");
const message =
$("teamAdminMessage");
if (!modal) {
return;
}
editingTeamId =
member?.id || null;
if (form) {
form.reset();
}
if (message) {
message.textContent =
"";
message.className =
"admin-form-message";
}
const nameInput =
$("adminTeamName");
const positionInput =
$("adminTeamPosition");
const classInput =
$("adminTeamClass");
const categoryInput =
$("adminTeamCategory");
const orderInput =
$("adminTeamOrder");
const activeInput =
$("adminTeamActive");
if (member) {
if (title) {
title.textContent =
"EDIT TEAM MEMBER";
}
if (nameInput) {
nameInput.value =
member.name || "";
}
if (positionInput) {
positionInput.value =
member.position || "";
}
if (classInput) {
classInput.value =
member.class_name || "";
}
if (categoryInput) {
categoryInput.value =
member.category || "general";
}
if (orderInput) {
orderInput.value =
member.display_order ??
0;
}
if (activeInput) {
activeInput.checked =
member.active !== false;
}
} else {
if (title) {
title.textContent =
"ADD TEAM MEMBER";
}
if (orderInput) {
orderInput.value =
"0";
}
if (activeInput) {
activeInput.checked =
true;
}
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE TEAM MODAL
========================================================= */
function closeTeamAdminModal() {
const modal =
$("teamAdminModal");
if (modal) {
modal.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
editingTeamId = null;
}
/* =========================================================
SAVE TEAM MEMBER
========================================================= */
async function saveTeamMember() {
const message =
$("teamAdminMessage");
const saveButton =
$("saveTeamButton");
if (!supabaseClient) {
showAdminMessage(
message,
"SUPABASE IS NOT AVAILABLE.",
"error"
);
return;
}
if (!currentUser || !isAdmin) {
showAdminMessage(
message,
"ADMIN ACCESS REQUIRED.",
"error"
);
return;
}
const name =
$("adminTeamName")
?.value
?.trim();
const position =
$("adminTeamPosition")
?.value
?.trim();
const className =
$("adminTeamClass")
?.value
?.trim();
const category =
$("adminTeamCategory")
?.value
?.trim() ||
"general";
const displayOrder =
parseInt(
$("adminTeamOrder")
?.value,
10
) || 0;
const active =
$("adminTeamActive")
?.checked !== false;
const photoInput =
$("adminTeamPhoto");
if (!name || !position) {
showAdminMessage(
message,
"NAME AND POSITION ARE REQUIRED.",
"error"
);
return;
}
try {
if (saveButton) {
saveButton.disabled =
true;
saveButton.textContent =
"SAVING...";
}
let photoURL =
null;
if (
editingTeamId
) {
const {
data: existingMember,
error: existingError
} =
await supabaseClient
.from("team_members")
.select(
"photo_url"
)
.eq(
"id",
editingTeamId
)
.maybeSingle();
if (existingError) {
throw existingError;
}
photoURL =
existingMember
?.photo_url ||
null;
}
if (
photoInput &&
photoInput.files &&
photoInput.files.length > 0
) {
photoURL =
await uploadTeamPhoto(
photoInput.files[0],
editingTeamId ||
crypto.randomUUID()
);
}
const payload = {
name,
position,
class_name:
className || null,
category,
photo_url:
photoURL,
display_order:
displayOrder,
active,
updated_at:
new Date().toISOString()
};
if (editingTeamId) {
const {
error
} =
await supabaseClient
.from("team_members")
.update(
payload
)
.eq(
"id",
editingTeamId
);
if (error) {
throw error;
}
showAdminMessage(
message,
"TEAM MEMBER UPDATED.",
"success"
);
} else {
const {
error
} =
await supabaseClient
.from("team_members")
.insert(
payload
);
if (error) {
throw error;
}
showAdminMessage(
message,
"TEAM MEMBER ADDED.",
"success"
);
}
await loadAdminTeam();
await updateTeamCount();
await loadPublicTeam();
setTimeout(
() => {
closeTeamAdminModal();
},
700
);
} catch (error) {
console.error(
"Save team member error:",
error
);
showAdminMessage(
message,
error.message ||
"UNABLE TO SAVE TEAM MEMBER.",
"error"
);
} finally {
if (saveButton) {
saveButton.disabled =
false;
saveButton.textContent =
"SAVE TEAM MEMBER";
}
}
}
/* =========================================================
SHOW ADMIN MESSAGE
========================================================= */
function showAdminMessage(
element,
text,
type = "info"
) {
if (!element) {
return;
}
element.textContent =
text;
element.className =
`admin-form-message ${type}`;
}
/* =========================================================
TEAM PHOTO UPLOAD
========================================================= */
async function uploadTeamPhoto(
file,
memberId
) {
if (!supabaseClient) {
throw new Error(
"SUPABASE IS NOT AVAILABLE."
);
}
if (!file) {
return null;
}
const allowedTypes = [
"image/jpeg",
"image/png",
"image/webp",
"image/gif"
];
if (
!allowedTypes.includes(
file.type
)
) {
throw new Error(
"PLEASE SELECT A JPG, PNG, WEBP OR GIF IMAGE."
);
}
const maxSize =
5 * 1024 * 1024;
if (file.size > maxSize) {
throw new Error(
"TEAM PHOTO MUST BE 5MB OR SMALLER."
);
}
const extension =
getFileExtension(file.name);
const safeMemberId =
memberId ||
crypto.randomUUID();
const filePath =
`team/${safeMemberId}-${Date.now()}.${extension}`;
const {
error
} =
await supabaseClient
.storage
.from("team photo")
.upload(
filePath,
file,
{
cacheControl: "3600",
upsert: false,
contentType: file.type
}
);
if (error) {
throw error;
}
const {
data
} =
supabaseClient
.storage
.from("team photo")
.getPublicUrl(
filePath
);
return data?.publicUrl || null;
}
/* =========================================================
FILE EXTENSION
========================================================= */
function getFileExtension(
fileName
) {
const name =
String(fileName || "");
const parts =
name.split(".");
if (parts.length < 2) {
return "jpg";
}
return parts
.pop()
.toLowerCase()
.replace(
/[^a-z0-9]/g,
""
) || "jpg";
}
/* =========================================================
LOAD ADMIN TEAM
========================================================= */
async function loadAdminTeam() {
const list =
$("adminTeamList");
if (!list) {
return;
}
if (!supabaseClient) {
list.innerHTML = `
<div class="admin-empty-state">
SUPABASE IS NOT AVAILABLE.
</div>
`;
return;
}
if (!isAdmin) {
list.innerHTML = `
<div class="admin-empty-state">
ADMIN ACCESS REQUIRED.
</div>
`;
return;
}
list.innerHTML = `
<div class="admin-loading">
LOADING TEAM...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("team_members")
.select(`
id,
name,
position,
class_name,
category,
photo_url,
display_order,
active,
created_at,
updated_at
`)
.order(
"display_order",
{
ascending: true
}
)
.order(
"created_at",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
list.innerHTML = `
<div class="admin-empty-state">
NO TEAM MEMBERS YET.
</div>
`;
return;
}
list.innerHTML = "";
data.forEach(
member => {
list.appendChild(
createAdminTeamCard(
member
)
);
}
);
} catch (error) {
console.error(
"Load admin team error:",
error
);
list.innerHTML = `
<div class="admin-empty-state error">
UNABLE TO LOAD TEAM.
</div>
`;
}
}
/* =========================================================
ADMIN TEAM CARD
========================================================= */
function createAdminTeamCard(
member
) {
const card =
document.createElement(
"article"
);
card.className =
"admin-data-card";
const photo =
member.photo_url
? `
<img
src="${escapeHTML(member.photo_url)}"
alt="${escapeHTML(member.name || "Team member")}"
loading="lazy"
>
`
: `
<div class="admin-card-placeholder">
SN
</div>
`;
const status =
member.active
? "ACTIVE"
: "HIDDEN";
card.innerHTML = `
<div class="admin-data-card-media">
${photo}
</div>
<div class="admin-data-card-content">
<div class="admin-data-card-top">
<span class="admin-data-status ${
member.active
? "active"
: "inactive"
}">
${status}
</span>
<span class="admin-data-order">
#${escapeHTML(
member.display_order ?? 0
)}
</span>
</div>
<h3>
${escapeHTML(
member.name ||
"SYNTHENOVA MEMBER"
)}
</h3>
<p class="admin-data-role">
${escapeHTML(
member.position ||
"MEMBER"
)}
</p>
${
member.class_name
? `
<p class="admin-data-class">
${escapeHTML(
member.class_name
)}
</p>
`
: ""
}
<p class="admin-data-category">
${escapeHTML(
member.category ||
"GENERAL"
)}
</p>
</div>
<div class="admin-data-card-actions">
<button
type="button"
class="admin-edit-button"
data-team-edit="${escapeHTML(
member.id
)}"
>
EDIT
</button>
<button
type="button"
class="admin-delete-button"
data-team-delete="${escapeHTML(
member.id
)}"
>
DELETE
</button>
</div>
`;
const editButton =
card.querySelector(
"[data-team-edit]"
);
const deleteButton =
card.querySelector(
"[data-team-delete]"
);
if (editButton) {
editButton.addEventListener(
"click",
event => {
event.preventDefault();
openTeamAdminEdit(
member
);
}
);
}
if (deleteButton) {
deleteButton.addEventListener(
"click",
event => {
event.preventDefault();
deleteTeamMember(
member
);
}
);
}
return card;
}
/* =========================================================
EDIT TEAM MEMBER
========================================================= */
function openTeamAdminEdit(
member
) {
if (!member) {
return;
}
openTeamAdminModal(
member
);
}
/* =========================================================
DELETE TEAM MEMBER
========================================================= */
async function deleteTeamMember(
member
) {
if (!member?.id) {
return;
}
if (
!supabaseClient ||
!currentUser ||
!isAdmin
) {
alert(
"ADMIN ACCESS REQUIRED."
);
return;
}
const confirmed =
window.confirm(
`DELETE ${member.name || "THIS TEAM MEMBER"}?`
);
if (!confirmed) {
return;
}
try {
if (
member.photo_url
) {
await deleteTeamPhotoByUrl(
member.photo_url
);
}
const {
error
} =
await supabaseClient
.from("team_members")
.delete()
.eq(
"id",
member.id
);
if (error) {
throw error;
}
await loadAdminTeam();
await updateTeamCount();
await loadPublicTeam();
} catch (error) {
console.error(
"Delete team member error:",
error
);
alert(
error.message ||
"UNABLE TO DELETE TEAM MEMBER."
);
}
}
/* =========================================================
DELETE TEAM PHOTO
========================================================= */
async function deleteTeamPhotoByUrl(
publicUrl
) {
if (
!publicUrl ||
!supabaseClient
) {
return;
}
try {
const marker =
"/storage/v1/object/public/team%20photo/";
let index =
publicUrl.indexOf(
marker
);
if (index === -1) {
const decoded =
decodeURIComponent(
publicUrl
);
index =
decoded.indexOf(
"/storage/v1/object/public/team photo/"
);
if (index === -1) {
return;
}
const decodedPath =
decoded.substring(
index +
"/storage/v1/object/public/team photo/"
.length
);
if (!decodedPath) {
return;
}
await supabaseClient
.storage
.from("team photo")
.remove([
decodedPath
]);
return;
}
const filePath =
publicUrl.substring(
index +
marker.length
);
if (!filePath) {
return;
}
await supabaseClient
.storage
.from("team photo")
.remove([
decodeURIComponent(
filePath
)
]);
} catch (error) {
console.warn(
"Unable to delete old team photo:",
error
);
}
}
/* =========================================================
LOAD PUBLIC TEAM
========================================================= */
async function loadPublicTeam() {
const teamGrid =
$("publicTeamGrid");
if (!teamGrid) {
return;
}
if (!supabaseClient) {
teamGrid.innerHTML = `
<div class="team-loading">
TEAM DATA UNAVAILABLE.
</div>
`;
return;
}
teamGrid.innerHTML = `
<div class="team-loading">
LOADING TEAM...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("team_members")
.select(`
id,
name,
position,
class_name,
category,
photo_url,
display_order,
active
`)
.eq(
"active",
true
)
.order(
"display_order",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
teamGrid.innerHTML = `
<div class="team-loading">
TEAM WILL BE UPDATED SOON.
</div>
`;
return;
}
teamGrid.innerHTML = "";
data.forEach(
member => {
const card =
document.createElement(
"article"
);
card.className =
"team-member";
card.dataset.id =
member.id || "";
const photoHTML =
member.photo_url
? `
<img
src="${escapeHTML(
member.photo_url
)}"
alt="${escapeHTML(
member.name ||
"SYNTHENOVA member"
)}"
loading="lazy"
>
`
: `
<div class="team-no-photo">
SN
</div>
`;
card.innerHTML = `
<div class="team-photo">
${photoHTML}
<div class="team-photo-overlay">
VIEW
</div>
</div>
<div class="team-info">
<span class="team-position">
${escapeHTML(
member.position ||
"MEMBER"
)}
</span>
<h3>
${escapeHTML(
member.name ||
"SYNTHENOVA MEMBER"
)}
</h3>
${
member.class_name
? `
<p>
${escapeHTML(
member.class_name
)}
</p>
`
: ""
}
</div>
`;
card.addEventListener(
"click",
() => {
openTeamProfile(
member
);
}
);
teamGrid.appendChild(
card
);
}
);
} catch (error) {
console.error(
"Public team error:",
error
);
teamGrid.innerHTML = `
<div class="team-loading">
UNABLE TO LOAD TEAM.
</div>
`;
}
}
/* =========================================================
OPEN TEAM PROFILE
========================================================= */
function openTeamProfile(
member
) {
const profile =
$("teamProfile");
if (!profile) {
return;
}
const image =
$("profileImage");
const role =
$("profileRole");
const name =
$("profileName");
const className =
$("profileClass");
const category =
$("profileCategory");
if (image) {
if (
member.photo_url
) {
image.style.backgroundImage =
`url("${member.photo_url}")`;
image.style.backgroundSize =
"cover";
image.style.backgroundPosition =
"center";
} else {
image.style.backgroundImage =
"none";
}
}
if (role) {
role.textContent =
member.position ||
"SYNTHENOVA TEAM";
}
if (name) {
name.textContent =
member.name ||
"SYNTHENOVA MEMBER";
}
if (className) {
className.textContent =
member.class_name ||
"SYNTHENOVA";
}
if (category) {
category.textContent =
member.category ||
"GENERAL";
}
profile.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE TEAM PROFILE
========================================================= */
function closeTeamProfile() {
const profile =
$("teamProfile");
if (profile) {
profile.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
}
/* =========================================================
TEAM PROFILE EVENTS
========================================================= */
const closeTeamProfileButton =
$("closeTeamProfile");
if (closeTeamProfileButton) {
closeTeamProfileButton.addEventListener(
"click",
closeTeamProfile
);
}
const teamProfile =
$("teamProfile");
if (teamProfile) {
teamProfile.addEventListener(
"click",
event => {
if (
event.target ===
teamProfile
) {
closeTeamProfile();
}
}
);
}
/* =========================================================
EVENTS ADMIN SETUP
========================================================= */
function setupEventAdmin() {
const addButton =
$("addEventButton");
const modal =
$("eventAdminModal");
const closeButton =
$("closeEventAdminModal");
const cancelButton =
$("cancelEventAdmin");
const form =
$("eventAdminForm");
if (addButton) {
addButton.addEventListener(
"click",
event => {
event.preventDefault();
openEventAdminModal();
}
);
}
if (closeButton) {
closeButton.addEventListener(
"click",
event => {
event.preventDefault();
closeEventAdminModal();
}
);
}
if (cancelButton) {
cancelButton.addEventListener(
"click",
event => {
event.preventDefault();
closeEventAdminModal();
}
);
}
if (modal) {
modal.addEventListener(
"click",
event => {
if (
event.target ===
modal
) {
closeEventAdminModal();
}
}
);
}
if (form) {
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveEvent();
}
);
}
}
/* =========================================================
OPEN EVENT MODAL
========================================================= */
function openEventAdminModal(
eventData = null
) {
const modal =
$("eventAdminModal");
const form =
$("eventAdminForm");
const title =
$("eventAdminModalTitle");
const message =
$("eventAdminMessage");
if (!modal) {
return;
}
editingEventId =
eventData?.id || null;
if (form) {
form.reset();
}
if (message) {
message.textContent =
"";
message.className =
"admin-form-message";
}
const titleInput =
$("adminEventTitle");
const dateInput =
$("adminEventDate");
const descriptionInput =
$("adminEventDescription");
const registrationInput =
$("adminEventRegistration");
const orderInput =
$("adminEventOrder");
const publishedInput =
$("adminEventPublished");
if (eventData) {
if (title) {
title.textContent =
"EDIT EVENT";
}
if (titleInput) {
titleInput.value =
eventData.title || "";
}
if (dateInput) {
dateInput.value =
eventData.event_date || "";
}
if (descriptionInput) {
descriptionInput.value =
eventData.description ||
"";
}
if (registrationInput) {
registrationInput.value =
eventData.registration_url ||
"";
}
if (orderInput) {
orderInput.value =
eventData.display_order ??
0;
}
if (publishedInput) {
publishedInput.checked =
eventData.published !== false;
}
} else {
if (title) {
title.textContent =
"ADD EVENT";
}
if (orderInput) {
orderInput.value =
"0";
}
if (publishedInput) {
publishedInput.checked =
true;
}
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE EVENT MODAL
========================================================= */
function closeEventAdminModal() {
const modal =
$("eventAdminModal");
if (modal) {
modal.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
editingEventId =
null;
}
/* =========================================================
SAVE EVENT
========================================================= */
async function saveEvent() {
const message =
$("eventAdminMessage");
const saveButton =
$("saveEventButton");
if (
!supabaseClient ||
!currentUser ||
!isAdmin
) {
showAdminMessage(
message,
"ADMIN ACCESS REQUIRED.",
"error"
);
return;
}
const title =
$("adminEventTitle")
?.value
?.trim();
const eventDate =
$("adminEventDate")
?.value;
const description =
$("adminEventDescription")
?.value
?.trim();
const registrationURL =
$("adminEventRegistration")
?.value
?.trim();
const displayOrder =
parseInt(
$("adminEventOrder")
?.value,
10
) || 0;
const published =
$("adminEventPublished")
?.checked !== false;
const posterInput =
$("adminEventPoster");
if (!title) {
showAdminMessage(
message,
"EVENT TITLE IS REQUIRED.",
"error"
);
return;
}
if (
registrationURL &&
!isValidURL(
registrationURL
)
) {
showAdminMessage(
message,
"PLEASE ENTER A VALID GOOGLE FORM URL.",
"error"
);
return;
}
try {
if (saveButton) {
saveButton.disabled =
true;
saveButton.textContent =
"SAVING...";
}
let posterURL =
null;
if (editingEventId) {
const {
data: existingEvent,
error: existingError
} =
await supabaseClient
.from("events")
.select(
"poster_url"
)
.eq(
"id",
editingEventId
)
.maybeSingle();
if (existingError) {
throw existingError;
}
posterURL =
existingEvent
?.poster_url ||
null;
}
if (
posterInput &&
posterInput.files &&
posterInput.files.length > 0
) {
posterURL =
await readFileAsDataURL(
posterInput.files[0]
);
}
const payload = {
title,
event_date:
eventDate || null,
description:
description || null,
registration_url:
registrationURL || null,
poster_url:
posterURL,
display_order:
displayOrder,
published,
updated_at:
new Date().toISOString()
};
if (editingEventId) {
const {
error
} =
await supabaseClient
.from("events")
.update(
payload
)
.eq(
"id",
editingEventId
);
if (error) {
throw error;
}
showAdminMessage(
message,
"EVENT UPDATED.",
"success"
);
} else {
const {
error
} =
await supabaseClient
.from("events")
.insert(
payload
);
if (error) {
throw error;
}
showAdminMessage(
message,
"EVENT ADDED.",
"success"
);
}
await loadAdminEvents();
await updateEventCount();
await loadPublicEvents();
setTimeout(
() => {
closeEventAdminModal();
},
700
);
} catch (error) {
console.error(
"Save event error:",
error
);
showAdminMessage(
message,
error.message ||
"UNABLE TO SAVE EVENT.",
"error"
);
} finally {
if (saveButton) {
saveButton.disabled =
false;
saveButton.textContent =
"SAVE EVENT";
}
}
}
/* =========================================================
URL VALIDATION
========================================================= */
function isValidURL(
value
) {
try {
const url =
new URL(value);
return (
url.protocol ===
"http:" ||
url.protocol ===
"https:"
);
} catch {
return false;
}
}
/* =========================================================
READ FILE AS DATA URL
========================================================= */
function readFileAsDataURL(
file
) {
return new Promise(
(
resolve,
reject
) => {
const reader =
new FileReader();
reader.onload =
() => {
resolve(
reader.result
);
};
reader.onerror =
() => {
reject(
new Error(
"UNABLE TO READ IMAGE."
)
);
};
reader.readAsDataURL(
file
);
}
);
}
/* =========================================================
LOAD ADMIN EVENTS
========================================================= */
async function loadAdminEvents() {
const list =
$("adminEventsList");
if (!list) {
return;
}
if (
!supabaseClient ||
!isAdmin
) {
list.innerHTML = `
<div class="admin-empty-state">
ADMIN ACCESS REQUIRED.
</div>
`;
return;
}
list.innerHTML = `
<div class="admin-loading">
LOADING EVENTS...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("events")
.select(`
id,
title,
event_date,
description,
registration_url,
poster_url,
display_order,
published,
created_at,
updated_at
`)
.order(
"display_order",
{
ascending: true
}
)
.order(
"created_at",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
list.innerHTML = `
<div class="admin-empty-state">
NO EVENTS YET.
</div>
`;
return;
}
list.innerHTML = "";
data.forEach(
eventData => {
list.appendChild(
createAdminEventCard(
eventData
)
);
}
);
} catch (error) {
console.error(
"Load admin events error:",
error
);
list.innerHTML = `
<div class="admin-empty-state error">
UNABLE TO LOAD EVENTS.
</div>
`;
}
}
/* =========================================================
ADMIN EVENT CARD
========================================================= */
function createAdminEventCard(
eventData
) {
const card =
document.createElement(
"article"
);
card.className =
"admin-data-card";
const poster =
eventData.poster_url
? `
<img
src="${escapeHTML(
eventData.poster_url
)}"
alt="${escapeHTML(
eventData.title ||
"Event poster"
)}"
loading="lazy"
>
`
: `
<div class="admin-card-placeholder">
EVENT
</div>
`;
const status =
eventData.published
? "PUBLISHED"
: "DRAFT";
const registration =
eventData.registration_url
? `
<a
class="admin-registration-link"
href="${escapeHTML(
eventData.registration_url
)}"
target="_blank"
rel="noopener noreferrer"
>
GOOGLE FORM ↗
</a>
`
: `
<span class="admin-no-registration">
NO REGISTRATION LINK
</span>
`;
card.innerHTML = `
<div class="admin-data-card-media">
${poster}
</div>
<div class="admin-data-card-content">
<div class="admin-data-card-top">
<span class="admin-data-status ${
eventData.published
? "active"
: "inactive"
}">
${status}
</span>
<span class="admin-data-order">
#${escapeHTML(
eventData.display_order ?? 0
)}
</span>
</div>
<h3>
${escapeHTML(
eventData.title ||
"SYNTHENOVA EVENT"
)}
</h3>
${
eventData.event_date
? `
<p class="admin-data-date">
${escapeHTML(
formatEventDate(
eventData.event_date
)
)}
</p>
`
: ""
}
${
eventData.description
? `
<p class="admin-data-description">
${escapeHTML(
eventData.description
)}
</p>
`
: ""
}
<div class="admin-registration-status">
${registration}
</div>
</div>
<div class="admin-data-card-actions">
<button
type="button"
class="admin-edit-button"
data-event-edit="${escapeHTML(
eventData.id
)}"
>
EDIT
</button>
<button
type="button"
class="admin-delete-button"
data-event-delete="${escapeHTML(
eventData.id
)}"
>
DELETE
</button>
</div>
`;
const editButton =
card.querySelector(
"[data-event-edit]"
);
const deleteButton =
card.querySelector(
"[data-event-delete]"
);
if (editButton) {
editButton.addEventListener(
"click",
event => {
event.preventDefault();
openEventAdminEdit(
eventData
);
}
);
}
if (deleteButton) {
deleteButton.addEventListener(
"click",
event => {
event.preventDefault();
deleteEvent(
eventData
);
}
);
}
return card;
}
/* =========================================================
FORMAT EVENT DATE
========================================================= */
function formatEventDate(
value
) {
if (!value) {
return "";
}
const date =
new Date(value);
if (
Number.isNaN(
date.getTime()
)
) {
return String(value);
}
return date.toLocaleDateString(
undefined,
{
day: "2-digit",
month: "short",
year: "numeric"
}
);
}
/* =========================================================
EDIT EVENT
========================================================= */
function openEventAdminEdit(
eventData
) {
if (!eventData) {
return;
}
openEventAdminModal(
eventData
);
}
/* =========================================================
DELETE EVENT
========================================================= */
async function deleteEvent(
eventData
) {
if (!eventData?.id) {
return;
}
if (
!supabaseClient ||
!currentUser ||
!isAdmin
) {
alert(
"ADMIN ACCESS REQUIRED."
);
return;
}
const confirmed =
window.confirm(
`DELETE ${
eventData.title ||
"THIS EVENT"
}?`
);
if (!confirmed) {
return;
}
try {
const {
error
} =
await supabaseClient
.from("events")
.delete()
.eq(
"id",
eventData.id
);
if (error) {
throw error;
}
await loadAdminEvents();
await updateEventCount();
await loadPublicEvents();
} catch (error) {
console.error(
"Delete event error:",
error
);
alert(
error.message ||
"UNABLE TO DELETE EVENT."
);
}
}
/* =========================================================
LOAD PUBLIC EVENTS
========================================================= */
async function loadPublicEvents() {
const eventsContainer =
$("publicEventsGrid") ||
$("eventsGrid") ||
$("publicEvents");
if (!eventsContainer) {
return;
}
if (!supabaseClient) {
eventsContainer.innerHTML = `
<div class="events-loading">
EVENTS DATA UNAVAILABLE.
</div>
`;
return;
}
eventsContainer.innerHTML = `
<div class="events-loading">
LOADING EVENTS...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("events")
.select(`
id,
title,
event_date,
description,
registration_url,
poster_url,
display_order,
published
`)
.eq(
"published",
true
)
.order(
"display_order",
{
ascending: true
}
)
.order(
"event_date",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
eventsContainer.innerHTML = `
<div class="events-loading">
NO UPCOMING EVENTS.
</div>
`;
return;
}
eventsContainer.innerHTML = "";
data.forEach(
eventData => {
eventsContainer.appendChild(
createPublicEventCard(
eventData
)
);
}
);
} catch (error) {
console.error(
"Public events error:",
error
);
eventsContainer.innerHTML = `
<div class="events-loading">
UNABLE TO LOAD EVENTS.
</div>
`;
}
}
/* =========================================================
CREATE PUBLIC EVENT CARD
========================================================= */
function createPublicEventCard(
eventData
) {
const card =
document.createElement(
"article"
);
card.className =
"event-card";
const poster =
eventData.poster_url
? `
<div class="event-poster">
<img
src="${escapeHTML(
eventData.poster_url
)}"
alt="${escapeHTML(
eventData.title ||
"SYNTHENOVA event"
)}"
loading="lazy"
>
</div>
`
: `
<div class="event-poster event-poster-placeholder">
<span>
SYNTHENOVA
</span>
</div>
`;
const registerButton =
eventData.registration_url
? `
<a
class="event-register-button"
href="${escapeHTML(
eventData.registration_url
)}"
rel="noopener noreferrer"
>
REGISTER NOW
<span>↗</span>
</a>
`
: "";
card.innerHTML = `
${poster}
<div class="event-card-content">
${
eventData.event_date
? `
<span class="event-date">
${escapeHTML(
formatEventDate(
eventData.event_date
)
)}
</span>
`
: ""
}
<h3>
${escapeHTML(
eventData.title ||
"SYNTHENOVA EVENT"
)}
</h3>
${
eventData.description
? `
<p>
${escapeHTML(
eventData.description
)}
</p>
`
: ""
}
${
registerButton
? `
<div class="event-card-action">
${registerButton}
</div>
`
: ""
}
</div>
`;
return card;
}
/* =========================================================
GALLERY ADMIN SETUP
========================================================= */
function setupGalleryAdmin() {
const addButton =
$("addGalleryButton");
const modal =
$("galleryAdminModal");
const closeButton =
$("closeGalleryAdminModal");
const cancelButton =
$("cancelGalleryAdmin");
const form =
$("galleryAdminForm");
if (addButton) {
addButton.addEventListener(
"click",
event => {
event.preventDefault();
openGalleryAdminModal();
}
);
}
if (closeButton) {
closeButton.addEventListener(
"click",
event => {
event.preventDefault();
closeGalleryAdminModal();
}
);
}
if (cancelButton) {
cancelButton.addEventListener(
"click",
event => {
event.preventDefault();
closeGalleryAdminModal();
}
);
}
if (modal) {
modal.addEventListener(
"click",
event => {
if (
event.target ===
modal
) {
closeGalleryAdminModal();
}
}
);
}
if (form) {
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveGalleryItems();
}
);
}
}
/* =========================================================
OPEN GALLERY MODAL
========================================================= */
function openGalleryAdminModal(
galleryItem = null
) {
const modal =
$("galleryAdminModal");
const form =
$("galleryAdminForm");
const title =
$("galleryAdminModalTitle");
const message =
$("galleryAdminMessage");
const imageInput =
$("adminGalleryImage");
const captionInput =
$("adminGalleryCaption");
const orderInput =
$("adminGalleryOrder");
const publishedInput =
$("adminGalleryPublished");
if (!modal) {
return;
}
editingGalleryId =
galleryItem?.id || null;
if (form) {
form.reset();
}
if (message) {
message.textContent =
"";
message.className =
"admin-form-message";
}
if (galleryItem) {
if (title) {
title.textContent =
"EDIT GALLERY ITEM";
}
if (captionInput) {
captionInput.value =
galleryItem.caption ||
"";
}
if (orderInput) {
orderInput.value =
galleryItem.display_order ??
0;
}
if (publishedInput) {
publishedInput.checked =
galleryItem.published !== false;
}
if (imageInput) {
imageInput.removeAttribute(
"multiple"
);
}
} else {
if (title) {
title.textContent =
"ADD GALLERY IMAGES";
}
if (orderInput) {
orderInput.value =
"0";
}
if (publishedInput) {
publishedInput.checked =
true;
}
if (imageInput) {
imageInput.setAttribute(
"multiple",
""
);
}
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE GALLERY MODAL
========================================================= */
function closeGalleryAdminModal() {
const modal =
$("galleryAdminModal");
if (modal) {
modal.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
editingGalleryId =
null;
const imageInput =
$("adminGalleryImage");
if (imageInput) {
imageInput.setAttribute(
"multiple",
""
);
}
}
/* =========================================================
SAVE GALLERY ITEMS
========================================================= */
async function saveGalleryItems() {
const message =
$("galleryAdminMessage");
const saveButton =
$("saveGalleryButton");
const imageInput =
$("adminGalleryImage");
if (
!supabaseClient ||
!currentUser ||
!isAdmin
) {
showAdminMessage(
message,
"ADMIN ACCESS REQUIRED.",
"error"
);
return;
}
if (
!imageInput ||
!imageInput.files ||
imageInput.files.length === 0
) {
showAdminMessage(
message,
"PLEASE SELECT AT LEAST ONE IMAGE.",
"error"
);
return;
}
const files =
Array.from(
imageInput.files
);
const caption =
$("adminGalleryCaption")
?.value
?.trim() ||
"";
const startingOrder =
parseInt(
$("adminGalleryOrder")
?.value,
10
) || 0;
const published =
$("adminGalleryPublished")
?.checked !== false;
try {
if (saveButton) {
saveButton.disabled =
true;
saveButton.textContent =
`UPLOADING 0/${files.length}...`;
}
if (editingGalleryId) {
await updateExistingGalleryItem(
files[0],
caption,
startingOrder,
published,
editingGalleryId,
message,
saveButton
);
} else {
for (
let index = 0;
index < files.length;
index++
) {
if (saveButton) {
saveButton.textContent =
`UPLOADING ${
index + 1
}/${files.length}...`;
}
showAdminMessage(
message,
`UPLOADING ${
index + 1
}/${files.length}...`,
"info"
);
const imageData =
await readFileAsDataURL(
files[index]
);
const payload = {
image_url:
imageData,
caption:
caption ||
null,
display_order:
startingOrder +
index,
published,
created_at:
new Date().toISOString(),
updated_at:
new Date().toISOString()
};
const {
error
} =
await supabaseClient
.from("gallery")
.insert(
payload
);
if (error) {
throw error;
}
}
showAdminMessage(
message,
`${files.length} IMAGE${
files.length === 1
? ""
: "S"
} UPLOADED SUCCESSFULLY.`,
"success"
);
}
await loadAdminGallery();
await updateGalleryCount();
await loadPublicGallery();
setTimeout(
() => {
closeGalleryAdminModal();
},
800
);
} catch (error) {
console.error(
"Save gallery error:",
error
);
showAdminMessage(
message,
error.message ||
"UNABLE TO SAVE GALLERY.",
"error"
);
} finally {
if (saveButton) {
saveButton.disabled =
false;
saveButton.textContent =
editingGalleryId
? "SAVE GALLERY"
: "UPLOAD IMAGES";
}
}
}
/* =========================================================
UPDATE EXISTING GALLERY ITEM
========================================================= */
async function updateExistingGalleryItem(
file,
caption,
displayOrder,
published,
galleryId,
message,
saveButton
) {
let imageData = null;
if (file) {
imageData =
await readFileAsDataURL(
file
);
}
const payload = {
caption:
caption || null,
display_order:
displayOrder,
published,
updated_at:
new Date().toISOString()
};
if (imageData) {
payload.image_url =
imageData;
}
if (saveButton) {
saveButton.textContent =
"SAVING...";
}
const {
error
} =
await supabaseClient
.from("gallery")
.update(
payload
)
.eq(
"id",
galleryId
);
if (error) {
throw error;
}
showAdminMessage(
message,
"GALLERY ITEM UPDATED.",
"success"
);
}
/* =========================================================
LOAD ADMIN GALLERY
========================================================= */
async function loadAdminGallery() {
const list =
$("adminGalleryList");
if (!list) {
return;
}
if (
!supabaseClient ||
!isAdmin
) {
list.innerHTML = `
<div class="admin-empty-state">
ADMIN ACCESS REQUIRED.
</div>
`;
return;
}
list.innerHTML = `
<div class="admin-loading">
LOADING GALLERY...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("gallery")
.select(`
id,
image_url,
caption,
display_order,
published,
created_at,
updated_at
`)
.order(
"display_order",
{
ascending: true
}
)
.order(
"created_at",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
list.innerHTML = `
<div class="admin-empty-state">
NO GALLERY IMAGES YET.
</div>
`;
return;
}
list.innerHTML = "";
data.forEach(
galleryItem => {
list.appendChild(
createAdminGalleryCard(
galleryItem
)
);
}
);
} catch (error) {
console.error(
"Load admin gallery error:",
error
);
list.innerHTML = `
<div class="admin-empty-state error">
UNABLE TO LOAD GALLERY.
</div>
`;
}
}
/* =========================================================
ADMIN GALLERY CARD
========================================================= */
function createAdminGalleryCard(
galleryItem
) {
const card =
document.createElement(
"article"
);
card.className =
"admin-gallery-card";
const image =
galleryItem.image_url
? `
<img
src="${escapeHTML(
galleryItem.image_url
)}"
alt="${escapeHTML(
galleryItem.caption ||
"SYNTHENOVA gallery image"
)}"
loading="lazy"
>
`
: `
<div class="admin-card-placeholder">
IMAGE
</div>
`;
card.innerHTML = `
<div class="admin-gallery-image">
${image}
</div>
<div class="admin-gallery-info">
<div class="admin-data-card-top">
<span class="admin-data-status ${
galleryItem.published
? "active"
: "inactive"
}">
${
galleryItem.published
? "PUBLISHED"
: "HIDDEN"
}
</span>
<span class="admin-data-order">
#${escapeHTML(
galleryItem.display_order ?? 0
)}
</span>
</div>
${
galleryItem.caption
? `
<p class="admin-gallery-caption">
${escapeHTML(
galleryItem.caption
)}
</p>
`
: `
<p class="admin-gallery-caption muted">
NO CAPTION
</p>
`
}
</div>
<div class="admin-gallery-actions">
<button
type="button"
class="admin-edit-button"
data-gallery-edit="${escapeHTML(
galleryItem.id
)}"
>
EDIT
</button>
<button
type="button"
class="admin-delete-button"
data-gallery-delete="${escapeHTML(
galleryItem.id
)}"
>
DELETE
</button>
</div>
`;
const editButton =
card.querySelector(
"[data-gallery-edit]"
);
const deleteButton =
card.querySelector(
"[data-gallery-delete]"
);
if (editButton) {
editButton.addEventListener(
"click",
event => {
event.preventDefault();
openGalleryAdminEdit(
galleryItem
);
}
);
}
if (deleteButton) {
deleteButton.addEventListener(
"click",
event => {
event.preventDefault();
deleteGalleryItem(
galleryItem
);
}
);
}
return card;
}
/* =========================================================
EDIT GALLERY ITEM
========================================================= */
function openGalleryAdminEdit(
galleryItem
) {
if (!galleryItem) {
return;
}
openGalleryAdminModal(
galleryItem
);
}
/* =========================================================
DELETE GALLERY ITEM
========================================================= */
async function deleteGalleryItem(
galleryItem
) {
if (!galleryItem?.id) {
return;
}
if (
!supabaseClient ||
!currentUser ||
!isAdmin
) {
alert(
"ADMIN ACCESS REQUIRED."
);
return;
}
const confirmed =
window.confirm(
"DELETE THIS GALLERY IMAGE?"
);
if (!confirmed) {
return;
}
try {
const {
error
} =
await supabaseClient
.from("gallery")
.delete()
.eq(
"id",
galleryItem.id
);
if (error) {
throw error;
}
await loadAdminGallery();
await updateGalleryCount();
await loadPublicGallery();
} catch (error) {
console.error(
"Delete gallery item error:",
error
);
alert(
error.message ||
"UNABLE TO DELETE GALLERY IMAGE."
);
}
}
/* =========================================================
LOAD PUBLIC GALLERY
========================================================= */
async function loadPublicGallery() {
const galleryGrid =
$("publicGalleryGrid") ||
$("galleryGrid") ||
$("publicGallery");
if (!galleryGrid) {
return;
}
if (!supabaseClient) {
galleryGrid.innerHTML = `
<div class="gallery-loading">
GALLERY DATA UNAVAILABLE.
</div>
`;
return;
}
galleryGrid.innerHTML = `
<div class="gallery-loading">
LOADING GALLERY...
</div>
`;
try {
const {
data,
error
} =
await supabaseClient
.from("gallery")
.select(`
id,
image_url,
caption,
display_order,
published
`)
.eq(
"published",
true
)
.order(
"display_order",
{
ascending: true
}
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
galleryGrid.innerHTML = `
<div class="gallery-loading">
GALLERY WILL BE UPDATED SOON.
</div>
`;
return;
}
galleryGrid.innerHTML = "";
data.forEach(
galleryItem => {
galleryGrid.appendChild(
createPublicGalleryItem(
galleryItem
)
);
}
);
setupGalleryLightbox();
} catch (error) {
console.error(
"Public gallery error:",
error
);
galleryGrid.innerHTML = `
<div class="gallery-loading">
UNABLE TO LOAD GALLERY.
</div>
`;
}
}
/* =========================================================
CREATE PUBLIC GALLERY ITEM
========================================================= */
function createPublicGalleryItem(
galleryItem
) {
const item =
document.createElement(
"article"
);
item.className =
"gallery-item";
item.dataset.galleryId =
galleryItem.id || "";
const image =
galleryItem.image_url
? `
<img
src="${escapeHTML(
galleryItem.image_url
)}"
alt="${escapeHTML(
galleryItem.caption ||
"SYNTHENOVA gallery"
)}"
loading="lazy"
>
`
: `
<div class="gallery-placeholder">
SYNTHENOVA
</div>
`;
item.innerHTML = `
<div class="gallery-image-wrap">
${image}
<div class="gallery-hover">
<span>
VIEW
</span>
</div>
</div>
${
galleryItem.caption
? `
<div class="gallery-caption">
${escapeHTML(
galleryItem.caption
)}
</div>
`
: ""
}
`;
item.addEventListener(
"click",
event => {
event.preventDefault();
openGalleryLightbox(
galleryItem
);
}
);
return item;
}
/* =========================================================
GALLERY LIGHTBOX
========================================================= */
let currentGalleryItems = [];
let currentGalleryIndex = 0;
function setupGalleryLightbox() {
const galleryItems =
document.querySelectorAll(
".gallery-item"
);
currentGalleryItems =
Array.from(
galleryItems
).map(
item => {
const image =
item.querySelector(
"img"
);
return {
src:
image?.src ||
"",
alt:
image?.alt ||
"SYNTHENOVA gallery",
caption:
item.querySelector(
".gallery-caption"
)?.textContent
?.trim() ||
""
};
}
);
}
/* =========================================================
OPEN GALLERY LIGHTBOX
========================================================= */
function openGalleryLightbox(
galleryItem
) {
const lightbox =
$("galleryLightbox");
if (!lightbox) {
return;
}
const image =
$("galleryLightboxImage");
const caption =
$("galleryLightboxCaption");
currentGalleryIndex =
currentGalleryItems.findIndex(
item =>
item.src ===
galleryItem.image_url
);
if (
currentGalleryIndex < 0
) {
currentGalleryIndex = 0;
}
if (image) {
image.src =
galleryItem.image_url ||
"";
image.alt =
galleryItem.caption ||
"SYNTHENOVA gallery";
}
if (caption) {
caption.textContent =
galleryItem.caption ||
"";
}
lightbox.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE GALLERY LIGHTBOX
========================================================= */
function closeGalleryLightbox() {
const lightbox =
$("galleryLightbox");
if (lightbox) {
lightbox.classList.remove(
"active"
);
}
body.classList.remove(
"modal-open"
);
}
/* =========================================================
GALLERY LIGHTBOX CONTROLS
========================================================= */
const galleryLightbox =
$("galleryLightbox");
const galleryLightboxClose =
$("galleryLightboxClose");
const galleryLightboxPrev =
$("galleryLightboxPrev");
const galleryLightboxNext =
$("galleryLightboxNext");
if (galleryLightboxClose) {
galleryLightboxClose.addEventListener(
"click",
event => {
event.preventDefault();
closeGalleryLightbox();
}
);
}
if (galleryLightbox) {
galleryLightbox.addEventListener(
"click",
event => {
if (
event.target ===
galleryLightbox
) {
closeGalleryLightbox();
}
}
);
}
if (galleryLightboxPrev) {
galleryLightboxPrev.addEventListener(
"click",
event => {
event.preventDefault();
showPreviousGalleryImage();
}
);
}
if (galleryLightboxNext) {
galleryLightboxNext.addEventListener(
"click",
event => {
event.preventDefault();
showNextGalleryImage();
}
);
}
/* =========================================================
SHOW PREVIOUS GALLERY IMAGE
========================================================= */
function showPreviousGalleryImage() {
if (
currentGalleryItems.length ===
0
) {
return;
}
currentGalleryIndex--;
if (
currentGalleryIndex < 0
) {
currentGalleryIndex =
currentGalleryItems.length -
1;
}
updateGalleryLightbox();
}
/* =========================================================
SHOW NEXT GALLERY IMAGE
========================================================= */
function showNextGalleryImage() {
if (
currentGalleryItems.length ===
0
) {
return;
}
currentGalleryIndex++;
if (
currentGalleryIndex >=
currentGalleryItems.length
) {
currentGalleryIndex =
0;
}
updateGalleryLightbox();
}
/* =========================================================
UPDATE GALLERY LIGHTBOX
========================================================= */
function updateGalleryLightbox() {
const item =
currentGalleryItems[
currentGalleryIndex
];
if (!item) {
return;
}
const image =
$("galleryLightboxImage");
const caption =
$("galleryLightboxCaption");
if (image) {
image.src =
item.src;
image.alt =
item.alt;
}
if (caption) {
caption.textContent =
item.caption;
}
}
/* =========================================================
KEYBOARD GALLERY CONTROLS
========================================================= */
document.addEventListener(
"keydown",
event => {
const lightbox =
$("galleryLightbox");
if (
!lightbox ||
!lightbox.classList.contains(
"active"
)
) {
return;
}
if (
event.key ===
"Escape"
) {
closeGalleryLightbox();
}
if (
event.key ===
"ArrowLeft"
) {
showPreviousGalleryImage();
}
if (
event.key ===
"ArrowRight"
) {
showNextGalleryImage();
}
}
);
/* =========================================================
ADMIN MODAL ESCAPE CONTROL
========================================================= */
document.addEventListener(
"keydown",
event => {
if (
event.key !==
"Escape"
) {
return;
}
const teamModal =
$("teamAdminModal");
const eventModal =
$("eventAdminModal");
const galleryModal =
$("galleryAdminModal");
if (
teamModal &&
teamModal.classList.contains(
"active"
)
) {
closeTeamAdminModal();
return;
}
if (
eventModal &&
eventModal.classList.contains(
"active"
)
) {
closeEventAdminModal();
return;
}
if (
galleryModal &&
galleryModal.classList.contains(
"active"
)
) {
closeGalleryAdminModal();
return;
}
}
);
/* =========================================================
WINDOW RESIZE
========================================================= */
window.addEventListener(
"resize",
() => {
if (
window.innerWidth > 1100 &&
sideMenu &&
sideMenu.classList.contains(
"active"
)
) {
closeSideMenu();
}
}
);
/* =========================================================
SCROLL REVEAL ANIMATIONS
========================================================= */
function setupScrollReveal() {
const revealElements =
document.querySelectorAll(
".reveal, .fade-up, .section-header, .event-card, .team-member, .gallery-item"
);
if (
!revealElements ||
revealElements.length === 0
) {
return;
}
if (
!("IntersectionObserver" in window)
) {
revealElements.forEach(
element => {
element.classList.add(
"visible"
);
}
);
return;
}
const observer =
new IntersectionObserver(
entries => {
entries.forEach(
entry => {
if (
entry.isIntersecting
) {
entry.target.classList.add(
"visible"
);
observer.unobserve(
entry.target
);
}
}
);
},
{
threshold: 0.12,
rootMargin:
"0px 0px -50px 0px"
}
);
revealElements.forEach(
element => {
observer.observe(
element
);
}
);
}
/* =========================================================
NAVBAR SCROLL EFFECT
========================================================= */
function setupHeaderScroll() {
const header =
document.querySelector(
".site-header, header"
);
if (!header) {
return;
}
const updateHeader =
() => {
if (
window.scrollY > 40
) {
header.classList.add(
"scrolled"
);
} else {
header.classList.remove(
"scrolled"
);
}
};
updateHeader();
window.addEventListener(
"scroll",
updateHeader,
{
passive: true
}
);
}
/* =========================================================
ACTIVE NAVIGATION
========================================================= */
function setupActiveNavigation() {
const sections =
document.querySelectorAll(
"main section[id], section[id]"
);
const links =
document.querySelectorAll(
'.menu-navigation a[href^="#"], .mobile-nav a[href^="#"], nav a[href^="#"]'
);
if (
sections.length === 0 ||
links.length === 0
) {
return;
}
const linkMap =
new Map();
links.forEach(
link => {
const href =
link.getAttribute(
"href"
);
if (
href &&
href.startsWith("#")
) {
linkMap.set(
href.substring(1),
link
);
}
}
);
const observer =
new IntersectionObserver(
entries => {
entries.forEach(
entry => {
if (
entry.isIntersecting
) {
links.forEach(
link => {
link.classList.remove(
"active"
);
}
);
const activeLink =
linkMap.get(
entry.target.id
);
if (
activeLink
) {
activeLink.classList.add(
"active"
);
}
}
}
);
},
{
rootMargin:
"-35% 0px -55% 0px",
threshold: 0
}
);
sections.forEach(
section => {
observer.observe(
section
);
}
);
}
/* =========================================================
IMAGE ERROR HANDLING
========================================================= */
function setupImageFallbacks() {
document
.querySelectorAll(
"img"
)
.forEach(
image => {
image.addEventListener(
"error",
() => {
image.classList.add(
"image-load-error"
);
},
{
once: true
}
);
}
);
}
/* =========================================================
SMOOTH INTERNAL LINKS
========================================================= */
function setupSmoothLinks() {
document
.querySelectorAll(
'a[href^="#"]'
)
.forEach(
link => {
link.addEventListener(
"click",
event => {
const href =
link.getAttribute(
"href"
);
if (
!href ||
href === "#"
) {
return;
}
const target =
document.querySelector(
href
);
if (!target) {
return;
}
event.preventDefault();
const header =
document.querySelector(
".site-header, header"
);
const offset =
header
? header.offsetHeight
: 0;
const position =
target.getBoundingClientRect()
.top +
window.scrollY -
offset -
10;
window.scrollTo({
top: position,
behavior: "smooth"
});
closeSideMenu();
}
);
}
);
}
/* =========================================================
COPY / CONTACT HELPERS
========================================================= */
function setupContactActions() {
const emailLinks =
document.querySelectorAll(
'a[href^="mailto:"]'
);
emailLinks.forEach(
link => {
link.addEventListener(
"click",
() => {
closeSideMenu();
}
);
}
);
const phoneLinks =
document.querySelectorAll(
'a[href^="tel:"]'
);
phoneLinks.forEach(
link => {
link.addEventListener(
"click",
() => {
closeSideMenu();
}
);
}
);
}
/* =========================================================
MOBILE BODY LOCK
========================================================= */
function setupBodyState() {
const updateBodyState =
() => {
const menuActive =
sideMenu &&
sideMenu.classList.contains(
"active"
);
const modalActive =
document.querySelector(
".modal.active, .admin-overlay.active, .gallery-lightbox.active"
);
if (
menuActive ||
modalActive
) {
body.classList.add(
"no-scroll"
);
} else {
body.classList.remove(
"no-scroll"
);
}
};
const observer =
new MutationObserver(
updateBodyState
);
if (sideMenu) {
observer.observe(
sideMenu,
{
attributes: true,
attributeFilter: [
"class"
]
}
);
}
if (menuOverlay) {
observer.observe(
menuOverlay,
{
attributes: true,
attributeFilter: [
"class"
]
}
);
}
document
.querySelectorAll(
".modal, .admin-overlay, .gallery-lightbox"
)
.forEach(
element => {
observer.observe(
element,
{
attributes: true,
attributeFilter: [
"class"
]
}
);
}
);
updateBodyState();
}
/* =========================================================
FOOTER YEAR
========================================================= */
function setupFooterYear() {
const year =
new Date().getFullYear();
document
.querySelectorAll(
".current-year, [data-year]"
)
.forEach(
element => {
element.textContent =
year;
}
);
}
/* =========================================================
PREVENT EMPTY BUTTON JUMP
========================================================= */
function setupButtonSafety() {
document
.querySelectorAll(
'button[type="button"]'
)
.forEach(
button => {
button.addEventListener(
"mousedown",
event => {
if (
button.disabled
) {
event.preventDefault();
}
}
);
}
);
}
/* =========================================================
ADMIN ACCESS GUARD
========================================================= */
function setupAdminAccessGuard() {
const adminElements =
document.querySelectorAll(
"[data-admin-only]"
);
if (
adminElements.length === 0
) {
return;
}
const update =
() => {
adminElements.forEach(
element => {
if (
currentUser &&
isAdmin === true
) {
element.style.display =
"";
} else {
element.style.display =
"none";
}
}
);
};
update();
}
/* =========================================================
AUTH STATE REFRESH
========================================================= */
async function refreshAuthenticationState() {
if (!supabaseClient) {
currentUser = null;
isAdmin = false;
updateAuthUI();
return;
}
try {
const {
data,
error
} =
await supabaseClient
.auth
.getSession();
if (error) {
throw error;
}
currentUser =
data?.session?.user ||
null;
if (currentUser) {
await verifyAdmin();
} else {
isAdmin = false;
}
updateAuthUI();
} catch (error) {
console.error(
"Authentication refresh error:",
error
);
currentUser = null;
isAdmin = false;
updateAuthUI();
}
}
/* =========================================================
ADMIN DASHBOARD REFRESH AFTER AUTH
========================================================= */
async function refreshAdminAfterLogin() {
if (
!currentUser ||
!isAdmin
) {
return;
}
await refreshAdminDashboard();
await loadAdminTeam();
await loadAdminEvents();
await loadAdminGallery();
}
/* =========================================================
SUPABASE REALTIME REFRESH
========================================================= */
function setupRealtimeUpdates() {
if (!supabaseClient) {
return;
}
try {
supabaseClient
.channel(
"synthenova-public-updates"
)
.on(
"postgres_changes",
{
event: "*",
schema: "public",
table: "team_members"
},
async () => {
await loadPublicTeam();
if (isAdmin) {
await loadAdminTeam();
await updateTeamCount();
}
}
)
.on(
"postgres_changes",
{
event: "*",
schema: "public",
table: "events"
},
async () => {
await loadPublicEvents();
if (isAdmin) {
await loadAdminEvents();
await updateEventCount();
}
}
)
.on(
"postgres_changes",
{
event: "*",
schema: "public",
table: "gallery"
},
async () => {
await loadPublicGallery();
if (isAdmin) {
await loadAdminGallery();
await updateGalleryCount();
}
}
)
.subscribe();
} catch (error) {
console.warn(
"Realtime setup failed:",
error
);
}
}
/* =========================================================
AUTH BUTTON VISUAL STATE
========================================================= */
function refreshMenuAuthState() {
const mobileLogin =
$("mobileLogin");
const mobileAdmin =
$("mobileAdmin");
const mobileLogout =
$("mobileLogout");
if (mobileLogin) {
mobileLogin.style.display =
currentUser
? "none"
: "flex";
}
if (mobileAdmin) {
mobileAdmin.style.display =
currentUser &&
isAdmin === true
? "flex"
: "none";
}
if (mobileLogout) {
mobileLogout.style.display =
currentUser
? "flex"
: "none";
}
}
/* =========================================================
ADMIN STATUS LABEL
========================================================= */
function updateAdminStatusLabel() {
const status =
$("authStatus");
if (!status) {
return;
}
if (!currentUser) {
status.textContent =
"GUEST";
return;
}
status.textContent =
isAdmin
? "ADMIN"
: "AUTHENTICATED";
}
/* =========================================================
PUBLIC AUTH DISPLAY
========================================================= */
function updatePublicAuthDisplay() {
const userElements =
document.querySelectorAll(
"[data-user-email]"
);
userElements.forEach(
element => {
element.textContent =
currentUser?.email ||
"";
}
);
const adminElements =
document.querySelectorAll(
"[data-admin-status]"
);
adminElements.forEach(
element => {
element.textContent =
isAdmin
? "ADMIN"
: "";
}
);
}
/* =========================================================
COMBINED AUTH UI REFRESH
========================================================= */
function refreshAllAuthUI() {
updateAuthUI();
refreshMenuAuthState();
updateAdminStatusLabel();
updatePublicAuthDisplay();
setupAdminAccessGuard();
}
/* =========================================================
PATCH AUTH UI FUNCTION
========================================================= */
const originalUpdateAuthUI =
updateAuthUI;
/*
Keep the main authentication state
synchronized with all menu controls.
*/
function syncAuthenticationUI() {
originalUpdateAuthUI();
refreshMenuAuthState();
updateAdminStatusLabel();
updatePublicAuthDisplay();
}
/* =========================================================
ADMIN DASHBOARD OPEN GUARD
========================================================= */
function canOpenAdminDashboard() {
return (
!!currentUser &&
isAdmin === true
);
}
/* =========================================================
ADMIN DASHBOARD BUTTON STATE
========================================================= */
function updateAdminDashboardButton() {
const desktopButton = $("adminButton");
const mobileButton = $("mobileAdmin");
const verified =
!!currentUser && isAdmin === true;
if (desktopButton) {
desktopButton.disabled = !verified;
desktopButton.setAttribute(
"aria-hidden",
verified ? "false" : "true"
);
desktopButton.classList.toggle(
"hidden",
!verified
);
desktopButton.style.display =
verified ? "inline-flex" : "none";
}
if (mobileButton) {
mobileButton.disabled = !verified;
mobileButton.setAttribute(
"aria-hidden",
verified ? "false" : "true"
);
mobileButton.classList.toggle(
"hidden",
!verified
);
mobileButton.style.display =
verified ? "flex" : "none";
}
}
/* =========================================================
ADMIN DASHBOARD CLOSE ON LOGOUT
========================================================= */
function closeDashboardIfLoggedOut() {
if (
!currentUser ||
!isAdmin
) {
closeDashboard();
}
}
/* =========================================================
PROTECT ADMIN DASHBOARD
========================================================= */
function protectAdminDashboard() {
const dashboard =
$("adminDashboard");
if (!dashboard) {
return;
}
if (
dashboard.classList.contains(
"active"
) &&
!canOpenAdminDashboard()
) {
closeDashboard();
}
}
/* =========================================================
FINAL AUTH STATE SYNCHRONIZATION
========================================================= */
function synchronizeApplicationState() {
syncAuthenticationUI();
updateAdminDashboardButton();
closeDashboardIfLoggedOut();
protectAdminDashboard();
}
/* =========================================================
GLOBAL SUPABASE ERROR HELPER
========================================================= */
function handleSupabaseError(
error,
fallbackMessage
) {
console.error(
"SYNTHENOVA Supabase error:",
error
);
if (
error &&
typeof error.message ===
"string"
) {
return error.message;
}
return (
fallbackMessage ||
"AN UNEXPECTED ERROR OCCURRED."
);
}
/* =========================================================
INITIAL PAGE ENHANCEMENTS
========================================================= */
setupScrollReveal();
setupHeaderScroll();
setupActiveNavigation();
setupImageFallbacks();
setupSmoothLinks();
setupContactActions();
setupBodyState();
setupFooterYear();
setupButtonSafety();
setupAdminAccessGuard();
/* =========================================================
FINAL SYNTHENOVA INITIALIZATION
========================================================= */
try {
await initializeSupabase();
setupNavigation();
setupPublicInteractions();
setupAuthentication();
setupAdminDashboard();
await initializeAuth();
/*
Load public content only after
Supabase authentication/configuration
has been initialized.
*/
if (supabaseClient) {
await loadPublicTeam();
await loadPublicEvents();
await loadPublicGallery();
}
/*
Keep the authentication UI synchronized
after the initial session check.
*/
synchronizeApplicationState();
/*
Start realtime updates after the
initial public content has loaded.
*/
setupRealtimeUpdates();
/*
Refresh public/admin authentication
controls one final time.
*/
refreshAllAuthUI();
/*
Make sure the admin button is only
available to verified administrators.
*/
updateAdminDashboardButton();
} catch (error) {
console.error(
"SYNTHENOVA initialization error:",
error
);
} finally {
/*
Always remove the loading screen,
even if Supabase or another optional
feature encounters an error.
*/
hidePageLoader();
}
/* =========================================================
GLOBAL ESCAPE HANDLER
========================================================= */
document.addEventListener(
"keydown",
event => {
if (
event.key !==
"Escape"
) {
return;
}
const loginModal =
$("loginModal");
const adminDashboard =
$("adminDashboard");
if (
loginModal &&
loginModal.classList.contains(
"active"
)
) {
loginModal.classList.remove(
"active"
);
body.classList.remove(
"modal-open"
);
}
if (
adminDashboard &&
adminDashboard.classList.contains(
"active"
)
) {
closeDashboard();
}
}
);
/* =========================================================
FINAL ADMIN SECURITY CHECK
========================================================= */
window.addEventListener(
"focus",
async () => {
if (!supabaseClient) {
return;
}
try {
const {
data
} =
await supabaseClient
.auth
.getSession();
const sessionUser =
data?.session?.user ||
null;
if (!sessionUser) {
currentUser = null;
isAdmin = false;
synchronizeApplicationState();
return;
}
/*
If the session user changed,
update the local user state.
*/
if (
!currentUser ||
currentUser.id !==
sessionUser.id
) {
currentUser =
sessionUser;
}
/*
Always re-check the admin table
before allowing admin controls.
*/
await verifyAdmin();
synchronizeApplicationState();
} catch (error) {
console.error(
"Final auth security check error:",
error
);
}
}
);
/* =========================================================
PAGE VISIBILITY AUTH CHECK
========================================================= */
document.addEventListener(
"visibilitychange",
async () => {
if (
document.visibilityState !==
"visible"
) {
return;
}
if (!supabaseClient) {
return;
}
try {
const {
data
} =
await supabaseClient
.auth
.getSession();
currentUser =
data?.session?.user ||
null;
if (currentUser) {
await verifyAdmin();
} else {
isAdmin = false;
}
synchronizeApplicationState();
} catch (error) {
console.error(
"Visibility auth check error:",
error
);
}
}
);
/* =========================================================
FINAL DOM SAFETY
========================================================= */
window.addEventListener(
"load",
() => {
/*
The loader is hidden here as a final
fallback in case any async operation
took longer than expected.
*/
hidePageLoader();
/*
Refresh image fallback handlers
for dynamically loaded content.
*/
setupImageFallbacks();
/*
Make sure the menu remains clickable
after every dynamic DOM operation.
*/
if (menuButton) {
menuButton.style.pointerEvents =
"auto";
menuButton.style.cursor =
"pointer";
menuButton.style.zIndex =
"10001";
}
/*
Final admin button security state.
*/
updateAdminDashboardButton();
}
);
/* =========================================================
SYNTHENOVA READY
========================================================= */
console.log(
"SYNTHENOVA frontend initialized successfully."
);
});