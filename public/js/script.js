
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
const ID_ALIASES = {
adminDashboardButton: "adminButton",
menuLoginButton: "mobileLogin",
menuAdminButton: "mobileAdmin",
menuLogoutButton: "mobileLogout",
closeLogin: "closeLoginModal",
closeAdmin: "closeDashboard",
adminLogout: "dashboardLogout",
closeTeamAdmin: "closeTeamAdminModal",
closeEventAdmin: "closeEventAdminModal",
closeGalleryAdmin: "closeGalleryAdminModal",
profileImage: "teamProfileImage",
profileRole: "teamProfilePosition",
profileName: "teamProfileName",
profileClass: "teamProfileClass",
profileCategory: "teamProfileCategory",
eventsGrid: "publicEventsGrid",
eventsContainer: "publicEventsGrid",
publicGalleryGrid: "galleryContainer",
galleryGrid: "galleryContainer"
};
const $ = (id) => {
const direct = document.getElementById(id);
if (direct) return direct;
const alias = ID_ALIASES[id];
return alias ? document.getElementById(alias) : null;
};
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
const loginButton =
$("loginButton");
const logoutButton =
$("logoutButton");
const authStatus =
$("authStatus");
const menuLoginButton =
$("mobileLogin");
const menuAdminButton =
$("mobileAdmin");
if (menuAdminButton) {
menuAdminButton.style.display =
currentUser && isAdmin === true
? "flex"
: "none";
}
if (currentUser) {
if (loginButton) {
loginButton.style.display = "none";
}
if (menuLoginButton) {
menuLoginButton.style.display = "none";
}
if (logoutButton) {
logoutButton.style.display = "inline-flex";
}
if (authStatus) {
authStatus.textContent =
isAdmin ? "ADMIN" : "AUTHENTICATED";
}
} else {
if (loginButton) {
loginButton.style.display = "inline-flex";
}
if (menuLoginButton) {
menuLoginButton.style.display = "flex";
}
if (logoutButton) {
logoutButton.style.display = "none";
}
if (authStatus) {
authStatus.textContent = "GUEST";
}
if (menuAdminButton) {
menuAdminButton.style.display = "none";
}
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
const closeLogin =
$("closeLoginModal");
const loginButton =
$("loginButton");
const logoutButton =
$("logoutButton");
const adminButton =
$("adminButton");
const mobileLogout =
$("mobileLogout");
const menuLoginButton =
$("mobileLogin");
const menuAdminButton =
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
loginModal?.classList.add("active");
body.classList.add("modal-open");
return;
}
const verified = await verifyAdmin();
updateAuthUI();
if (verified) {
await openAdminDashboard();
} else {
alert("ADMIN ACCESS REQUIRED.");
}
}
);
}
if (closeLogin) {
closeLogin.addEventListener(
"click",
() => {
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
const email =
$("loginEmail")?.value
?.trim();
const password =
$("loginPassword")?.value;
const message =
$("loginMessage");
if (!email || !password) {
if (message) {
message.textContent =
"ENTER EMAIL AND PASSWORD.";
}
return;
}
if (!supabaseClient) {
if (message) {
message.textContent =
"SUPABASE IS NOT AVAILABLE.";
}
return;
}
if (message) {
message.textContent =
"AUTHENTICATING...";
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
await verifyAdmin();
updateAuthUI();
loginModal?.classList.remove(
"active"
);
body.classList.remove(
"modal-open"
);
if (isAdmin) {
openAdminDashboard();
}
} catch (error) {
console.error(
"Login error:",
error
);
if (message) {
message.textContent =
error.message ||
"LOGIN FAILED.";
}
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
if (menuLoginButton) {
menuLoginButton.addEventListener(
"click",
event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
if (loginModal) {
loginModal.classList.add("active");
body.classList.add("modal-open");
}
}
);
}
if (mobileLogout) {
mobileLogout.addEventListener(
"click",
async event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
await logoutUser();
}
);
}
if (menuAdminButton) {
menuAdminButton.addEventListener(
"click",
async event => {
event.preventDefault();
event.stopPropagation();
closeSideMenu();
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
}
/* =========================================================
INITIALIZE AUTH
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
data?.session?.user || null;
if (currentUser) {
await verifyAdmin();
}
updateAuthUI();
supabaseClient
.auth
.onAuthStateChange(
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
VERIFY ADMIN
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
closeAdminDashboard();
}
/* =========================================================
ADMIN DASHBOARD
========================================================= */
function setupAdminDashboard() {
const adminDashboard =
$("adminDashboard");
const closeAdmin =
$("closeAdmin");
const adminLogout =
$("adminLogout");
const adminTabs =
document.querySelectorAll(
".admin-tab"
);
if (closeAdmin) {
closeAdmin.addEventListener(
"click",
() => {
closeAdminDashboard();
}
);
}
if (adminLogout) {
adminLogout.addEventListener(
"click",
async () => {
await logoutUser();
}
);
}
adminTabs.forEach(tab => {
tab.addEventListener(
"click",
() => {
const tabName =
tab.dataset.adminTab;
switchAdminTab(
tabName
);
}
);
});
document
.querySelectorAll(
"[data-admin-tab]"
)
.forEach(card => {
if (
card.classList.contains(
"admin-tab"
)
) {
return;
}
card.addEventListener(
"click",
() => {
const tabName =
card.dataset.adminTab;
switchAdminTab(
tabName
);
}
);
});
const addTeamButton =
$("addTeamButton");
if (addTeamButton) {
addTeamButton.addEventListener(
"click",
() => {
openTeamAdminModal();
}
);
}
const addEventButton =
$("addEventButton");
if (addEventButton) {
addEventButton.addEventListener(
"click",
() => {
openEventAdminModal();
}
);
}
const addGalleryButton =
$("addGalleryButton");
if (addGalleryButton) {
addGalleryButton.addEventListener(
"click",
() => {
openGalleryAdminModal();
}
);
}
setupTeamAdminForm();
setupEventAdminForm();
setupGalleryAdminForm();
}
/* =========================================================
OPEN ADMIN DASHBOARD
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
switchAdminTab("team");
await refreshAdminDashboard();
}
/* =========================================================
CLOSE ADMIN DASHBOARD
========================================================= */
function closeAdminDashboard() {
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
SWITCH ADMIN TAB
========================================================= */
function switchAdminTab(
tabName
) {
document
.querySelectorAll(
".admin-tab"
)
.forEach(tab => {
tab.classList.toggle(
"active",
tab.dataset.adminTab ===
tabName
);
});
const panels = {
team: $("adminTeamPanel"),
events: $("adminEventsPanel"),
gallery: $("adminGalleryPanel")
};
Object.entries(panels)
.forEach(
([name, panel]) => {
if (!panel) {
return;
}
panel.classList.toggle(
"active",
name === tabName
);
}
);
if (
tabName === "team"
) {
loadAdminTeam();
}
if (
tabName === "events"
) {
loadAdminEvents();
}
if (
tabName === "gallery"
) {
loadAdminGallery();
}
}
/* =========================================================
REFRESH ADMIN DASHBOARD
========================================================= */
async function refreshAdminDashboard() {
await Promise.all([
loadAdminTeam(),
loadAdminEvents(),
loadAdminGallery()
]);
updateAdminCounts();
}
/* =========================================================
UPDATE ADMIN COUNTS
========================================================= */
async function updateAdminCounts() {
if (!supabaseClient) {
return;
}
try {
const [
teamResult,
eventResult,
galleryResult
] =
await Promise.all([
supabaseClient
.from("team_members")
.select(
"id",
{
count: "exact",
head: true
}
),
supabaseClient
.from("events")
.select(
"id",
{
count: "exact",
head: true
}
),
supabaseClient
.from("gallery")
.select(
"id",
{
count: "exact",
head: true
}
)
]);
const teamCount =
$("teamCount");
const eventCount =
$("eventCount");
const galleryCount =
$("galleryCount");
if (teamCount) {
teamCount.textContent =
teamResult.count || 0;
}
if (eventCount) {
eventCount.textContent =
eventResult.count || 0;
}
if (galleryCount) {
galleryCount.textContent =
galleryResult.count || 0;
}
} catch (error) {
console.error(
"Admin count error:",
error
);
}
}
/* =========================================================
TEAM ADMIN FORM
========================================================= */
function setupTeamAdminForm() {
const form =
$("teamAdminForm");
const modal =
$("teamAdminModal");
const closeButton =
$("closeTeamAdmin");
if (closeButton) {
closeButton.addEventListener(
"click",
() => {
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
if (!form) {
return;
}
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveTeamMember();
}
);
}
/* =========================================================
OPEN TEAM ADMIN MODAL
========================================================= */
function openTeamAdminModal(
member = null
) {
const modal =
$("teamAdminModal");
const form =
$("teamAdminForm");
if (!modal || !form) {
return;
}
editingTeamId =
member?.id || null;
const name =
$("adminTeamName");
const position =
$("adminTeamPosition");
const className =
$("adminTeamClass");
const category =
$("adminTeamCategory");
const order =
$("adminTeamOrder");
const photo =
$("adminTeamPhoto");
const active =
$("adminTeamActive");
const message =
$("teamAdminMessage");
if (name) {
name.value =
member?.name || "";
}
if (position) {
position.value =
member?.position || "";
}
if (className) {
className.value =
member?.class_name || "";
}
if (category) {
category.value =
member?.category || "general";
}
if (order) {
order.value =
member?.display_order ??
0;
}
if (photo) {
photo.value = "";
}
if (active) {
active.checked =
member
? member.active !== false
: true;
}
if (message) {
message.textContent = "";
}
const title =
modal.querySelector(
".admin-modal-title"
);
if (title) {
title.textContent =
member
? "EDIT TEAM MEMBER"
: "ADD TEAM MEMBER";
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE TEAM ADMIN MODAL
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
if (!supabaseClient) {
return;
}
if (!isAdmin) {
return;
}
const name =
$("adminTeamName")?.value
?.trim();
const position =
$("adminTeamPosition")?.value
?.trim();
const className =
$("adminTeamClass")?.value
?.trim();
const category =
$("adminTeamCategory")?.value
?.trim() ||
"general";
const order =
Number(
$("adminTeamOrder")?.value
) || 0;
const photoInput =
$("adminTeamPhoto");
const active =
$("adminTeamActive")
?.checked !== false;
const message =
$("teamAdminMessage");
const saveButton =
$("saveTeamButton");
if (!name || !position) {
if (message) {
message.textContent =
"NAME AND POSITION ARE REQUIRED.";
}
return;
}
if (saveButton) {
saveButton.disabled = true;
saveButton.textContent =
"SAVING...";
}
try {
let photoURL = null;
if (editingTeamId) {
const {
data: existingMember
} =
await supabaseClient
.from("team_members")
.select("photo_url")
.eq(
"id",
editingTeamId
)
.maybeSingle();
photoURL =
existingMember?.photo_url ||
null;
}
if (
photoInput &&
photoInput.files &&
photoInput.files.length > 0
) {
const file =
photoInput.files[0];
const extension =
file.name
.split(".")
.pop()
.toLowerCase();
const fileName =
`${crypto.randomUUID()}.${extension}`;
const filePath =
`team/${fileName}`;
const {
error: uploadError
} =
await supabaseClient
.storage
.from("team photo")
.upload(
filePath,
file,
{
cacheControl:
"3600",
upsert:
false
}
);
if (uploadError) {
throw uploadError;
}
const {
data: publicData
} =
supabaseClient
.storage
.from("team photo")
.getPublicUrl(
filePath
);
photoURL =
publicData?.publicUrl ||
photoURL;
}
const teamData = {
name,
position,
class_name:
className || null,
category,
photo_url:
photoURL,
display_order:
order,
active
};
if (editingTeamId) {
const {
error
} =
await supabaseClient
.from("team_members")
.update(
teamData
)
.eq(
"id",
editingTeamId
);
if (error) {
throw error;
}
} else {
const {
error
} =
await supabaseClient
.from("team_members")
.insert(
teamData
);
if (error) {
throw error;
}
}
if (message) {
message.textContent =
"TEAM MEMBER SAVED SUCCESSFULLY.";
}
closeTeamAdminModal();
await loadAdminTeam();
await loadPublicTeam();
await updateAdminCounts();
} catch (error) {
console.error(
"Save team member error:",
error
);
if (message) {
message.textContent =
error.message ||
"UNABLE TO SAVE TEAM MEMBER.";
}
} finally {
if (saveButton) {
saveButton.disabled = false;
saveButton.textContent =
"SAVE TEAM MEMBER";
}
}
}
/* =========================================================
LOAD ADMIN TEAM
========================================================= */
async function loadAdminTeam() {
const container =
$("adminTeamList");
if (!container) {
return;
}
if (!supabaseClient) {
container.innerHTML =
`<div class="admin-empty">
SUPABASE UNAVAILABLE.
</div>`;
return;
}
container.innerHTML =
`<div class="admin-loading">
LOADING TEAM...
</div>`;
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
);
if (error) {
throw error;
}
if (
!data ||
data.length === 0
) {
container.innerHTML =
`<div class="admin-empty">
NO TEAM MEMBERS YET.
</div>`;
return;
}
container.innerHTML = "";
data.forEach(
member => {
const item =
document.createElement(
"div"
);
item.className =
"admin-data-item";
const photoHTML =
member.photo_url
? `<img
src="${escapeHTML(member.photo_url)}"
alt="${escapeHTML(member.name)}"
>`
: `<div class="admin-item-placeholder">
SN
</div>`;
item.innerHTML = `
<div class="admin-data-item-main">
<div class="admin-item-photo">
${photoHTML}
</div>
<div class="admin-item-info">
<strong>
${escapeHTML(member.name)}
</strong>
<span>
${escapeHTML(member.position)}
</span>
${
member.class_name
? `<small>
${escapeHTML(member.class_name)}
</small>`
: ""
}
<small>
${escapeHTML(member.category || "general")}
·
${member.active ? "ACTIVE" : "HIDDEN"}
</small>
</div>
</div>
<div class="admin-data-item-actions">
<button
type="button"
class="admin-secondary-button edit-team-button"
>
EDIT
</button>
<button
type="button"
class="admin-danger-button delete-team-button"
>
DELETE
</button>
</div>
`;
const editButton =
item.querySelector(
".edit-team-button"
);
const deleteButton =
item.querySelector(
".delete-team-button"
);
editButton?.addEventListener(
"click",
() => {
openTeamAdminModal(
member
);
}
);
deleteButton?.addEventListener(
"click",
async () => {
await deleteTeamMember(
member
);
}
);
container.appendChild(
item
);
}
);
} catch (error) {
console.error(
"Load admin team error:",
error
);
container.innerHTML =
`<div class="admin-empty">
UNABLE TO LOAD TEAM.
</div>`;
}
}
/* =========================================================
DELETE TEAM MEMBER
========================================================= */
async function deleteTeamMember(
member
) {
if (
!supabaseClient ||
!isAdmin ||
!member?.id
) {
return;
}
const confirmed =
window.confirm(
`Delete ${member.name || "this team member"}?`
);
if (!confirmed) {
return;
}
try {
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
await loadPublicTeam();
await updateAdminCounts();
} catch (error) {
console.error(
"Delete team member error:",
error
);
window.alert(
error.message ||
"UNABLE TO DELETE TEAM MEMBER."
);
}
}
/* =========================================================
PUBLIC TEAM
========================================================= */
async function loadPublicTeam() {
const teamGrid =
$("publicTeamGrid");
if (!teamGrid) {
return;
}
if (!supabaseClient) {
teamGrid.innerHTML =
`<div class="team-loading">
TEAM DATA UNAVAILABLE.
</div>`;
return;
}
teamGrid.innerHTML =
`<div class="team-loading">
LOADING TEAM...
</div>`;
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
teamGrid.innerHTML =
`<div class="team-loading">
TEAM WILL BE UPDATED SOON.
</div>`;
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
? `<img
src="${escapeHTML(member.photo_url)}"
alt="${escapeHTML(member.name || "SYNTHENOVA member")}"
loading="lazy"
>`
: `<div class="team-no-photo">
SN
</div>`;
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
? `<p>
${escapeHTML(
member.class_name
)}
</p>`
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
teamGrid.innerHTML =
`<div class="team-loading">
UNABLE TO LOAD TEAM.
</div>`;
}
}
/* =========================================================
TEAM PROFILE
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
if (member.photo_url) {
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
$("closeTeamProfile")
?.addEventListener(
"click",
closeTeamProfile
);
$("teamProfile")
?.addEventListener(
"click",
event => {
const profile =
$("teamProfile");
if (
event.target ===
profile
) {
closeTeamProfile();
}
}
);
/* =========================================================
EVENTS ADMIN FORM
========================================================= */
function setupEventAdminForm() {
const form =
$("eventAdminForm");
const modal =
$("eventAdminModal");
const closeButton =
$("closeEventAdmin");
if (closeButton) {
closeButton.addEventListener(
"click",
() => {
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
if (!form) {
return;
}
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveEvent();
}
);
}
/* =========================================================
OPEN EVENT ADMIN MODAL
========================================================= */
function openEventAdminModal(
eventData = null
) {
const modal =
$("eventAdminModal");
const form =
$("eventAdminForm");
if (!modal || !form) {
return;
}
editingEventId =
eventData?.id || null;
const title =
$("adminEventTitle");
const date =
$("adminEventDate");
const description =
$("adminEventDescription");
const registration =
$("adminEventRegistration");
const poster =
$("adminEventPoster");
const order =
$("adminEventOrder");
const published =
$("adminEventPublished");
const message =
$("eventAdminMessage");
if (title) {
title.value =
eventData?.title || "";
}
if (date) {
date.value =
eventData?.event_date ||
eventData?.date ||
"";
}
if (description) {
description.value =
eventData?.description || "";
}
if (registration) {
registration.value =
eventData?.registration_url ||
"";
}
if (poster) {
poster.value = "";
}
if (order) {
order.value =
eventData?.display_order ??
0;
}
if (published) {
published.checked =
eventData
? eventData.published !== false
: true;
}
if (message) {
message.textContent = "";
}
const modalTitle =
modal.querySelector(
".admin-modal-title"
);
if (modalTitle) {
modalTitle.textContent =
eventData
? "EDIT EVENT"
: "ADD EVENT";
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE EVENT ADMIN MODAL
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
editingEventId = null;
}
/* =========================================================
SAVE EVENT
========================================================= */
async function saveEvent() {
if (
!supabaseClient ||
!isAdmin
) {
return;
}
const title =
$("adminEventTitle")
?.value
?.trim();
const eventDate =
$("adminEventDate")
?.value
?.trim();
const description =
$("adminEventDescription")
?.value
?.trim();
const registrationURL =
$("adminEventRegistration")
?.value
?.trim();
const posterInput =
$("adminEventPoster");
const displayOrder =
Number(
$("adminEventOrder")
?.value
) || 0;
const published =
$("adminEventPublished")
?.checked !== false;
const message =
$("eventAdminMessage");
const saveButton =
$("saveEventButton");
if (!title || !eventDate) {
if (message) {
message.textContent =
"EVENT TITLE AND DATE ARE REQUIRED.";
}
return;
}
if (saveButton) {
saveButton.disabled = true;
saveButton.textContent =
"SAVING...";
}
try {
let posterURL = null;
if (editingEventId) {
const {
data: existingEvent
} =
await supabaseClient
.from("events")
.select("poster_url")
.eq(
"id",
editingEventId
)
.maybeSingle();
posterURL =
existingEvent?.poster_url ||
null;
}
if (
posterInput &&
posterInput.files &&
posterInput.files.length > 0
) {
const file =
posterInput.files[0];
const reader =
new FileReader();
posterURL =
await new Promise(
(
resolve,
reject
) => {
reader.onload =
() => resolve(
reader.result
);
reader.onerror =
() => reject(
new Error(
"Unable to read event poster."
)
);
reader.readAsDataURL(
file
);
}
);
}
const eventPayload = {
title,
event_date:
eventDate,
description:
description ||
null,
registration_url:
registrationURL ||
null,
poster_url:
posterURL,
display_order:
displayOrder,
published
};
if (editingEventId) {
const {
error
} =
await supabaseClient
.from("events")
.update(
eventPayload
)
.eq(
"id",
editingEventId
);
if (error) {
throw error;
}
} else {
const {
error
} =
await supabaseClient
.from("events")
.insert(
eventPayload
);
if (error) {
throw error;
}
}
if (message) {
message.textContent =
"EVENT SAVED SUCCESSFULLY.";
}
closeEventAdminModal();
await loadAdminEvents();
await loadPublicEvents();
await updateAdminCounts();
} catch (error) {
console.error(
"Save event error:",
error
);
if (message) {
message.textContent =
error.message ||
"UNABLE TO SAVE EVENT.";
}
} finally {
if (saveButton) {
saveButton.disabled = false;
saveButton.textContent =
"SAVE EVENT";
}
}
}
/* =========================================================
LOAD ADMIN EVENTS
========================================================= */
async function loadAdminEvents() {
const container =
$("adminEventsList");
if (!container) {
return;
}
if (!supabaseClient) {
container.innerHTML =
`<div class="admin-empty">
SUPABASE UNAVAILABLE.
</div>`;
return;
}
container.innerHTML =
`<div class="admin-loading">
LOADING EVENTS...
</div>`;
try {
const {
data,
error
} =
await supabaseClient
.from("events")
.select("*")
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
container.innerHTML =
`<div class="admin-empty">
NO EVENTS YET.
</div>`;
return;
}
container.innerHTML = "";
data.forEach(
eventData => {
const item =
document.createElement(
"div"
);
item.className =
"admin-data-item";
const posterHTML =
eventData.poster_url
? `<img
src="${escapeHTML(eventData.poster_url)}"
alt="${escapeHTML(eventData.title || "Event")}"
>`
: `<div class="admin-item-placeholder">
EVENT
</div>`;
item.innerHTML = `
<div class="admin-data-item-main">
<div class="admin-item-photo">
${posterHTML}
</div>
<div class="admin-item-info">
<strong>
${escapeHTML(
eventData.title ||
"UNTITLED EVENT"
)}
</strong>
<span>
${escapeHTML(
eventData.event_date ||
""
)}
</span>
<small>
${
eventData.published
? "PUBLISHED"
: "HIDDEN"
}
</small>
${
eventData.registration_url
? `<small>
GOOGLE FORM CONNECTED
</small>`
: `<small>
NO REGISTRATION LINK
</small>`
}
</div>
</div>
<div class="admin-data-item-actions">
<button
type="button"
class="admin-secondary-button edit-event-button"
>
EDIT
</button>
<button
type="button"
class="admin-danger-button delete-event-button"
>
DELETE
</button>
</div>
`;
item.querySelector(
".edit-event-button"
)?.addEventListener(
"click",
() => {
openEventAdminModal(
eventData
);
}
);
item.querySelector(
".delete-event-button"
)?.addEventListener(
"click",
async () => {
await deleteEvent(
eventData
);
}
);
container.appendChild(
item
);
}
);
} catch (error) {
console.error(
"Load admin events error:",
error
);
container.innerHTML =
`<div class="admin-empty">
UNABLE TO LOAD EVENTS.
</div>`;
}
}
/* =========================================================
DELETE EVENT
========================================================= */
async function deleteEvent(
eventData
) {
if (
!supabaseClient ||
!isAdmin ||
!eventData?.id
) {
return;
}
const confirmed =
window.confirm(
`Delete ${eventData.title || "this event"}?`
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
await loadPublicEvents();
await updateAdminCounts();
} catch (error) {
console.error(
"Delete event error:",
error
);
window.alert(
error.message ||
"UNABLE TO DELETE EVENT."
);
}
}
/* =========================================================
PUBLIC EVENTS
========================================================= */
async function loadPublicEvents() {
const eventsContainer =
$("publicEventsGrid") ||
$("eventsGrid") ||
$("eventsContainer");
if (!eventsContainer) {
return;
}
if (!supabaseClient) {
eventsContainer.innerHTML =
`<div class="events-loading">
EVENT DATA UNAVAILABLE.
</div>`;
return;
}
eventsContainer.innerHTML =
`<div class="events-loading">
LOADING EVENTS...
</div>`;
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
poster_url,
registration_url,
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
eventsContainer.innerHTML =
`<div class="events-loading">
NO EVENTS AVAILABLE.
</div>`;
return;
}
eventsContainer.innerHTML = "";
data.forEach(
eventData => {
const card =
document.createElement(
"article"
);
card.className =
"event-card";
const posterHTML =
eventData.poster_url
? `<img
class="event-poster"
src="${escapeHTML(eventData.poster_url)}"
alt="${escapeHTML(eventData.title || "SYNTHENOVA event")}"
loading="lazy"
>`
: `<div class="event-poster event-poster-placeholder">
SYNTHENOVA
</div>`;
const registerButton =
eventData.registration_url
? `
<a
class="event-register-button"
href="${escapeHTML(eventData.registration_url)}"
rel="noopener noreferrer"
>
REGISTER NOW
<span>↗</span>
</a>
`
: "";
card.innerHTML = `
<div class="event-card-media">
${posterHTML}
</div>
<div class="event-card-content">
<span class="event-date">
${escapeHTML(
eventData.event_date ||
""
)}
</span>
<h3>
${escapeHTML(
eventData.title ||
"SYNTHENOVA EVENT"
)}
</h3>
${
eventData.description
? `<p>
${escapeHTML(
eventData.description
)}
</p>`
: ""
}
${
registerButton
? `<div class="event-card-actions">
${registerButton}
</div>`
: ""
}
</div>
`;
eventsContainer.appendChild(
card
);
}
);
} catch (error) {
console.error(
"Public events error:",
error
);
eventsContainer.innerHTML =
`<div class="events-loading">
UNABLE TO LOAD EVENTS.
</div>`;
}
}
/* =========================================================
GALLERY ADMIN FORM
========================================================= */
function setupGalleryAdminForm() {
const form =
$("galleryAdminForm");
const modal =
$("galleryAdminModal");
const closeButton =
$("closeGalleryAdmin");
if (closeButton) {
closeButton.addEventListener(
"click",
() => {
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
if (!form) {
return;
}
form.addEventListener(
"submit",
async event => {
event.preventDefault();
await saveGallery();
}
);
}
/* =========================================================
OPEN GALLERY ADMIN MODAL
========================================================= */
function openGalleryAdminModal(
galleryData = null
) {
const modal =
$("galleryAdminModal");
const form =
$("galleryAdminForm");
if (!modal || !form) {
return;
}
editingGalleryId =
galleryData?.id || null;
const imageInput =
$("adminGalleryImage");
const caption =
$("adminGalleryCaption");
const order =
$("adminGalleryOrder");
const published =
$("adminGalleryPublished");
const message =
$("galleryAdminMessage");
if (imageInput) {
imageInput.value = "";
if (galleryData) {
imageInput.removeAttribute(
"multiple"
);
} else {
imageInput.setAttribute(
"multiple",
"multiple"
);
}
}
if (caption) {
caption.value =
galleryData?.caption ||
"";
}
if (order) {
order.value =
galleryData?.display_order ??
0;
}
if (published) {
published.checked =
galleryData
? galleryData.published !== false
: true;
}
if (message) {
message.textContent = "";
}
const modalTitle =
modal.querySelector(
".admin-modal-title"
);
if (modalTitle) {
modalTitle.textContent =
galleryData
? "EDIT GALLERY IMAGE"
: "ADD GALLERY IMAGES";
}
modal.classList.add(
"active"
);
body.classList.add(
"modal-open"
);
}
/* =========================================================
CLOSE GALLERY ADMIN MODAL
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
editingGalleryId = null;
}
/* =========================================================
SAVE GALLERY
========================================================= */
async function saveGallery() {
if (
!supabaseClient ||
!isAdmin
) {
return;
}
const imageInput =
$("adminGalleryImage");
const caption =
$("adminGalleryCaption")
?.value
?.trim();
const baseOrder =
Number(
$("adminGalleryOrder")
?.value
) || 0;
const published =
$("adminGalleryPublished")
?.checked !== false;
const message =
$("galleryAdminMessage");
const saveButton =
$("saveGalleryButton");
if (
!imageInput ||
!imageInput.files ||
imageInput.files.length === 0
) {
if (
!editingGalleryId
) {
if (message) {
message.textContent =
"PLEASE SELECT IMAGE FILES.";
}
return;
}
}
if (saveButton) {
saveButton.disabled = true;
saveButton.textContent =
"UPLOADING...";
}
try {
if (editingGalleryId) {
const file =
imageInput.files[0];
let imageURL = null;
if (file) {
const reader =
new FileReader();
imageURL =
await new Promise(
(
resolve,
reject
) => {
reader.onload =
() => resolve(
reader.result
);
reader.onerror =
() => reject(
new Error(
"Unable to read image."
)
);
reader.readAsDataURL(
file
);
}
);
}
const galleryPayload = {
...(imageURL
? {
image_url:
imageURL
}
: {}),
caption:
caption ||
null,
display_order:
baseOrder,
published
};
const {
error
} =
await supabaseClient
.from("gallery")
.update(
galleryPayload
)
.eq(
"id",
editingGalleryId
);
if (error) {
throw error;
}
} else {
const files =
Array.from(
imageInput.files
);
for (
let index = 0;
index < files.length;
index++
) {
const file =
files[index];
if (message) {
message.textContent =
`UPLOADING ${index + 1}/${files.length}...`;
}
const reader =
new FileReader();
const imageURL =
await new Promise(
(
resolve,
reject
) => {
reader.onload =
() => resolve(
reader.result
);
reader.onerror =
() => reject(
new Error(
`Unable to read ${file.name}.`
)
);
reader.readAsDataURL(
file
);
}
);
const {
error
} =
await supabaseClient
.from("gallery")
.insert({
image_url:
imageURL,
caption:
caption ||
null,
display_order:
baseOrder +
index,
published
});
if (error) {
throw error;
}
}
}
if (message) {
message.textContent =
"GALLERY SAVED SUCCESSFULLY.";
}
closeGalleryAdminModal();
await loadAdminGallery();
await loadPublicGallery();
await updateAdminCounts();
} catch (error) {
console.error(
"Save gallery error:",
error
);
if (message) {
message.textContent =
error.message ||
"UNABLE TO SAVE GALLERY.";
}
} finally {
if (saveButton) {
saveButton.disabled = false;
saveButton.textContent =
"SAVE GALLERY";
}
}
}
/* =========================================================
LOAD ADMIN GALLERY
========================================================= */
async function loadAdminGallery() {
const container =
$("adminGalleryList");
if (!container) {
return;
}
if (!supabaseClient) {
container.innerHTML =
`<div class="admin-empty">
SUPABASE UNAVAILABLE.
</div>`;
return;
}
container.innerHTML =
`<div class="admin-loading">
LOADING GALLERY...
</div>`;
try {
const {
data,
error
} =
await supabaseClient
.from("gallery")
.select("*")
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
container.innerHTML =
`<div class="admin-empty">
NO GALLERY IMAGES YET.
</div>`;
return;
}
container.innerHTML = "";
container.classList.add(
"admin-gallery-list"
);
data.forEach(
galleryData => {
const item =
document.createElement(
"div"
);
item.className =
"admin-gallery-item";
const imageHTML =
galleryData.image_url
? `<img
src="${escapeHTML(galleryData.image_url)}"
alt="${escapeHTML(galleryData.caption || "SYNTHENOVA gallery image")}"
loading="lazy"
>`
: `<div class="admin-item-placeholder">
IMAGE
</div>`;
item.innerHTML = `
<div class="admin-gallery-preview">
${imageHTML}
</div>
<div class="admin-gallery-info">
<strong>
${escapeHTML(
galleryData.caption ||
"SYNTHENOVA IMAGE"
)}
</strong>
<small>
ORDER:
${galleryData.display_order ?? 0}
</small>
<small>
${
galleryData.published
? "PUBLISHED"
: "HIDDEN"
}
</small>
</div>
<div class="admin-data-item-actions">
<button
type="button"
class="admin-secondary-button edit-gallery-button"
>
EDIT
</button>
<button
type="button"
class="admin-danger-button delete-gallery-button"
>
DELETE
</button>
</div>
`;
item.querySelector(
".edit-gallery-button"
)?.addEventListener(
"click",
() => {
openGalleryAdminModal(
galleryData
);
}
);
item.querySelector(
".delete-gallery-button"
)?.addEventListener(
"click",
async () => {
await deleteGalleryImage(
galleryData
);
}
);
container.appendChild(
item
);
}
);
} catch (error) {
console.error(
"Load admin gallery error:",
error
);
container.innerHTML =
`<div class="admin-empty">
UNABLE TO LOAD GALLERY.
</div>`;
}
}
/* =========================================================
DELETE GALLERY IMAGE
========================================================= */
async function deleteGalleryImage(
galleryData
) {
if (
!supabaseClient ||
!isAdmin ||
!galleryData?.id
) {
return;
}
const confirmed =
window.confirm(
"Delete this gallery image?"
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
galleryData.id
);
if (error) {
throw error;
}
await loadAdminGallery();
await loadPublicGallery();
await updateAdminCounts();
} catch (error) {
console.error(
"Delete gallery error:",
error
);
window.alert(
error.message ||
"UNABLE TO DELETE GALLERY IMAGE."
);
}
}
/* =========================================================
PUBLIC GALLERY
========================================================= */
async function loadPublicGallery() {
const galleryContainer =
$("publicGalleryGrid") ||
$("galleryGrid") ||
$("galleryContainer");
if (!galleryContainer) {
return;
}
if (!supabaseClient) {
galleryContainer.innerHTML =
`<div class="gallery-loading">
GALLERY DATA UNAVAILABLE.
</div>`;
return;
}
galleryContainer.innerHTML =
`<div class="gallery-loading">
LOADING GALLERY...
</div>`;
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
galleryContainer.innerHTML =
`<div class="gallery-loading">
GALLERY WILL BE UPDATED SOON.
</div>`;
return;
}
galleryContainer.innerHTML = "";
data.forEach(
galleryData => {
const item =
document.createElement(
"figure"
);
item.className =
"gallery-item";
if (
galleryData.image_url
) {
item.innerHTML = `
<img
src="${escapeHTML(galleryData.image_url)}"
alt="${escapeHTML(galleryData.caption || "SYNTHENOVA gallery image")}"
loading="lazy"
>
${
galleryData.caption
? `<figcaption>
${escapeHTML(
galleryData.caption
)}
</figcaption>`
: ""
}
`;
}
galleryContainer.appendChild(
item
);
}
);
} catch (error) {
console.error(
"Public gallery error:",
error
);
galleryContainer.innerHTML =
`<div class="gallery-loading">
UNABLE TO LOAD GALLERY.
</div>`;
}
}
/* =========================================================
INITIALIZATION
========================================================= */
try {
// Attach all UI controls before backend initialization.
// The site remains navigable/clickable even if Supabase is unavailable.
setupNavigation();
setupPublicInteractions();
setupAuthentication();
setupAdminDashboard();
await initializeSupabase();
if (supabaseClient) {
await initializeAuth();
}
if (supabaseClient) {
await loadPublicTeam();
await loadPublicEvents();
await loadPublicGallery();
}
updateAuthUI();
} catch (error) {
console.error(
"SYNTHENOVA initialization error:",
error
);
} finally {
hidePageLoader();
}
});