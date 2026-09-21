"use strict";

/* =========================================================
   SYNTHENOVA
   PUBLIC FRONTEND + SUPABASE AUTH + ADMIN CONTROL CENTER


========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
function hidePageLoader() {
    const loader = document.getElementById("pageLoader");

    if (!loader) {
        return;
    }

    loader.classList.add("hidden");

    setTimeout(() => {
        loader.style.display = "none";
    }, 700);
}
    /* =====================================================
       GLOBAL STATE
    ===================================================== */

    let supabaseClient = null;

    let currentUser = null;

    let isAdmin = false;

    let editingTeamId = null;

    let editingEventId = null;

    let editingGalleryId = null;

    const TEAM_BUCKET = "team photo";

    const $ = (id) =>
        document.getElementById(id);

    const body = document.body;


    /* =====================================================
       INITIALIZE
    ===================================================== */

try {

    await initializeSupabase();

    setupNavigation();

    setupPublicInteractions();

    setupAuthentication();

    setupAdminDashboard();

    await initializeAuth();

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

    /* =====================================================
       SUPABASE
    ===================================================== */

    async function initializeSupabase() {

        try {

            const response =
                await fetch(
                    "/api/config",
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Could not load Supabase configuration."
                );

            }

            const config =
                await response.json();

            if (
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
                    "Supabase library failed to load."
                );

            }

            supabaseClient =
                window.supabase.createClient(
                    config.supabaseUrl,
                    config.supabasePublishableKey
                );

            console.log(
                "SYNTHENOVA Supabase connected."
            );

            return true;

        } catch (error) {

            console.error(
                "Supabase initialization error:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       AUTH
    ===================================================== */

    async function initializeAuth() {

        if (!supabaseClient) {
            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;

        }

        if (data?.session?.user) {

            currentUser =
                data.session.user;

            isAdmin =
                await checkAdmin(
                    currentUser.id
                );

        }

        supabaseClient.auth.onAuthStateChange(
            async (event, session) => {

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentUser = null;

                    isAdmin = false;

                    updateAuthUI();

                    return;

                }

                if (session?.user) {

                    currentUser =
                        session.user;

                    isAdmin =
                        await checkAdmin(
                            currentUser.id
                        );

                    updateAuthUI();

                    if (isAdmin) {

                        await loadDashboardData();

                    }

                }

            }
        );

    }


    async function checkAdmin(userId) {

        if (
            !supabaseClient ||
            !userId
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
                        userId
                    )
                    .maybeSingle();

            if (error) {

                console.error(
                    "Admin verification error:",
                    error
                );

                return false;

            }

            return !!data;

        } catch (error) {

            console.error(
                "Admin check error:",
                error
            );

            return false;

        }

    }


    function setupAuthentication() {

        const loginForm =
            $("loginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


        const logoutButton =
            $("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logoutAdmin
            );

        }


        const loginClose =
            $("closeLoginModal");

        if (loginClose) {

            loginClose.addEventListener(
                "click",
                closeLoginModal
            );

        }


        const loginModal =
            $("loginModal");

        if (loginModal) {

            loginModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        loginModal
                    ) {

                        closeLoginModal();

                    }

                }
            );

        }

    }


    async function handleLogin(event) {

        event.preventDefault();

        if (!supabaseClient) {

            showMessage(
                "loginMessage",
                "Supabase is not available.",
                true
            );

            return;

        }

        const emailInput =
            $("loginEmail");

        const passwordInput =
            $("loginPassword");

        const button =
            $("loginSubmitButton") ||
            $("loginButton");

        const email =
            emailInput?.value
                .trim() || "";

        const password =
            passwordInput?.value || "";

        if (!email || !password) {

            showMessage(
                "loginMessage",
                "ENTER EMAIL AND PASSWORD.",
                true
            );

            return;

        }

        if (button) {

            button.disabled = true;

            button.textContent =
                "SIGNING IN...";

        }

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (error) {
                throw error;
            }

            if (!data?.user) {

                throw new Error(
                    "Login failed."
                );

            }

            const admin =
                await checkAdmin(
                    data.user.id
                );

            if (!admin) {

                await supabaseClient.auth
                    .signOut();

                throw new Error(
                    "This account is not registered as an admin."
                );

            }

            currentUser =
                data.user;

            isAdmin = true;

            closeLoginModal();

            updateAuthUI();

            await loadDashboardData();

            openAdminDashboard();

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            showMessage(
                "loginMessage",
                friendlyError(error),
                true
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "SIGN IN";

            }

        }

    }


    async function logoutAdmin() {

        if (!supabaseClient) {
            return;
        }

        try {

            await supabaseClient.auth.signOut();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

        currentUser = null;

        isAdmin = false;

        closeAdminDashboard();

        updateAuthUI();

    }


    function updateAuthUI() {

        document
            .querySelectorAll(
                "[data-admin-only]"
            )
            .forEach(element => {

                element.style.display =
                    isAdmin
                        ? ""
                        : "none";

            });

        const authStatus =
            $("authStatus");

        if (authStatus) {

            authStatus.textContent =
                isAdmin
                    ? "AUTHENTICATED"
                    : "GUEST";

        }

    }


    function openLoginModal() {

        const modal =
            $("loginModal");

        if (!modal) {
            return;
        }

        modal.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

    }


    function closeLoginModal() {

        const modal =
            $("loginModal");

        if (modal) {

            modal.classList.remove(
                "active"
            );

        }

        body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        document
            .querySelectorAll(
                "a[href^='#']"
            )
            .forEach(link => {

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

                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }
                );

            });

    }


    /* =====================================================
       PUBLIC INTERACTIONS
    ===================================================== */

    function setupPublicInteractions() {

        document
            .querySelectorAll(
                "[data-open-login], .login-button, #loginButton"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        if (isAdmin) {

                            openAdminDashboard();

                        } else {

                            openLoginModal();

                        }

                    }
                );

            });


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeLoginModal();

                    closeAdminDashboard();

                    closeTeamProfile();

                    closeGalleryPreview();

                }

            }
        );

    }


    /* =====================================================
       ADMIN DASHBOARD
    ===================================================== */

    function setupAdminDashboard() {

        const closeButton =
            $("closeAdminDashboard");

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeAdminDashboard
            );

        }


        const dashboard =
            $("adminDashboard");

        if (dashboard) {

            dashboard.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        dashboard
                    ) {

                        closeAdminDashboard();

                    }

                }
            );

        }


        document
            .querySelectorAll(
                ".admin-tab"
            )
            .forEach(tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        switchAdminTab(
                            tab.dataset.adminTab
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-admin-tab]"
            )
            .forEach(element => {

                if (
                    element.classList.contains(
                        "admin-tab"
                    )
                ) {
                    return;
                }

                element.addEventListener(
                    "click",
                    () => {

                        switchAdminTab(
                            element.dataset.adminTab
                        );

                    }
                );

            });


        $("addTeamButton")
            ?.addEventListener(
                "click",
                () => openTeamAdminModal()
            );


        $("closeTeamAdminModal")
            ?.addEventListener(
                "click",
                closeTeamAdminModal
            );


        $("addEventButton")
            ?.addEventListener(
                "click",
                () => openEventAdminModal()
            );


        $("closeEventAdminModal")
            ?.addEventListener(
                "click",
                closeEventAdminModal
            );


        $("addGalleryButton")
            ?.addEventListener(
                "click",
                () => openGalleryAdminModal()
            );


        $("closeGalleryAdminModal")
            ?.addEventListener(
                "click",
                closeGalleryAdminModal
            );


        $("teamAdminForm")
            ?.addEventListener(
                "submit",
                saveTeam
            );


        $("eventAdminForm")
            ?.addEventListener(
                "submit",
                saveEvent
            );


        $("galleryAdminForm")
            ?.addEventListener(
                "submit",
                saveGallery
            );


        $("teamAdminModal")
            ?.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        $("teamAdminModal")
                    ) {

                        closeTeamAdminModal();

                    }

                }
            );


        $("eventAdminModal")
            ?.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        $("eventAdminModal")
                    ) {

                        closeEventAdminModal();

                    }

                }
            );


        $("galleryAdminModal")
            ?.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        $("galleryAdminModal")
                    ) {

                        closeGalleryAdminModal();

                    }

                }
            );

    }


    function openAdminDashboard() {

        if (!isAdmin) {

            openLoginModal();

            return;

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

        loadDashboardData();

        switchAdminTab(
            "team"
        );

    }


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


    function switchAdminTab(
        tabName
    ) {

        if (!tabName) {
            return;
        }

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
            team:
                $("adminTeamPanel"),

            events:
                $("adminEventsPanel"),

            gallery:
                $("adminGalleryPanel")
        };


        Object.entries(
            panels
        ).forEach(
            ([name, panel]) => {

                if (!panel) {
                    return;
                }

                panel.classList.toggle(
                    "active",
                    name ===
                    tabName
                );

            }
        );


        if (
            tabName ===
            "team"
        ) {

            loadAdminTeam();

        }

        if (
            tabName ===
            "events"
        ) {

            loadAdminEvents();

        }

        if (
            tabName ===
            "gallery"
        ) {

            loadAdminGallery();

        }

    }


    async function loadDashboardData() {

        if (
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }

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


        if ($("teamCount")) {

            $("teamCount").textContent =
                teamResult.count || 0;

        }

        if ($("eventCount")) {

            $("eventCount").textContent =
                eventResult.count || 0;

        }

        if ($("galleryCount")) {

            $("galleryCount").textContent =
                galleryResult.count || 0;

        }

    }


    /* =====================================================
       TEAM ADMIN
    ===================================================== */

    async function loadAdminTeam() {

        const list =
            $("adminTeamList");

        if (
            !list ||
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }

        list.innerHTML =
            `<div class="admin-loading">
                LOADING TEAM...
            </div>`;


        const {
            data,
            error
        } =
            await supabaseClient
                .from("team_members")
                .select("*")
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

            console.error(
                "Team loading error:",
                error
            );

            list.innerHTML =
                `<div class="admin-empty">
                    FAILED TO LOAD TEAM.
                </div>`;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML =
                `<div class="admin-empty">
                    NO TEAM MEMBERS YET.
                </div>`;

            return;

        }


        list.innerHTML =
            data
                .map(
                    member =>
                        createAdminTeamCard(
                            member
                        )
                )
                .join("");


        list
            .querySelectorAll(
                "[data-edit-team]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    button.dataset.editTeam
                            );

                        if (member) {

                            openTeamAdminModal(
                                member
                            );

                        }

                    }
                );

            });


        list
            .querySelectorAll(
                "[data-delete-team]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    button.dataset.deleteTeam
                            );

                        if (member) {

                            deleteTeamMember(
                                member
                            );

                        }

                    }
                );

            });

    }


    function createAdminTeamCard(
        member
    ) {

        const photo =
            member.photo_url
                ? `
                    <img
                        src="${escapeAttribute(
                            member.photo_url
                        )}"
                        alt="${escapeAttribute(
                            member.name
                        )}"
                    >
                `
                : `
                    <div class="admin-no-image">
                        NO PHOTO
                    </div>
                `;


        return `
            <article class="admin-data-card">

                <div class="admin-data-image">
                    ${photo}
                </div>

                <div class="admin-data-content">

                    <h3>
                        ${escapeHTML(
                            member.name ||
                            "Unnamed"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            member.position ||
                            "MEMBER"
                        )}
                    </p>

                    <small>
                        ${escapeHTML(
                            member.class_name ||
                            ""
                        )}
                    </small>

                    <div class="admin-card-meta">
                        ${member.active
                            ? "ACTIVE"
                            : "HIDDEN"}
                        ·
                        ORDER ${Number(
                            member.display_order
                        ) || 0}
                    </div>

                    <div class="admin-card-actions">

                        <button
                            type="button"
                            class="admin-secondary-button"
                            data-edit-team="${escapeAttribute(
                                member.id
                            )}"
                        >
                            EDIT
                        </button>

                        <button
                            type="button"
                            class="admin-danger-button"
                            data-delete-team="${escapeAttribute(
                                member.id
                            )}"
                        >
                            DELETE
                        </button>

                    </div>

                </div>

            </article>
        `;

    }


    function openTeamAdminModal(
        member = null
    ) {

        editingTeamId =
            member?.id || null;


        $("teamModalTitle") &&
            (
                $("teamModalTitle").textContent =
                    member
                        ? "EDIT MEMBER"
                        : "ADD MEMBER"
            );


        setValue(
            "adminTeamName",
            member?.name || ""
        );

        setValue(
            "adminTeamPosition",
            member?.position || ""
        );

        setValue(
            "adminTeamClass",
            member?.class_name || ""
        );

        setValue(
            "adminTeamCategory",
            member?.category || "general"
        );

        setValue(
            "adminTeamOrder",
            member?.display_order ?? 0
        );


        if ($("adminTeamActive")) {

            $("adminTeamActive").checked =
                member?.active !== false;

        }


        if ($("adminTeamPhoto")) {

            $("adminTeamPhoto").value =
                "";

        }


        setMessage(
            "teamAdminMessage",
            ""
        );


        $("teamAdminModal")
            ?.classList.add(
                "active"
            );

        body.classList.add(
            "modal-open"
        );

    }


    function closeTeamAdminModal() {

        $("teamAdminModal")
            ?.classList.remove(
                "active"
            );

        body.classList.remove(
            "modal-open"
        );

        editingTeamId = null;

    }


    async function saveTeam(
        event
    ) {

        event.preventDefault();

        if (
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        const button =
            $("saveTeamButton");

        if (button) {

            button.disabled = true;

            button.textContent =
                "SAVING...";

        }


        try {

            const name =
                getValue(
                    "adminTeamName"
                );

            const position =
                getValue(
                    "adminTeamPosition"
                );

            const className =
                getValue(
                    "adminTeamClass"
                );

            const category =
                getValue(
                    "adminTeamCategory"
                ) ||
                "general";

            const order =
                Math.max(
                    0,
                    Number(
                        getValue(
                            "adminTeamOrder"
                        )
                    ) || 0
                );

            const active =
                $("adminTeamActive")
                    ?.checked !== false;


            if (!name) {

                throw new Error(
                    "Please enter the member name."
                );

            }

            if (!position) {

                throw new Error(
                    "Please enter the member position."
                );

            }


            let photoUrl =
                null;


            if (editingTeamId) {

                const {
                    data
                } =
                    await supabaseClient
                        .from(
                            "team_members"
                        )
                        .select(
                            "photo_url"
                        )
                        .eq(
                            "id",
                            editingTeamId
                        )
                        .maybeSingle();

                photoUrl =
                    data?.photo_url ||
                    null;

            }


            const photoInput =
                $("adminTeamPhoto");

            const photoFile =
                photoInput?.files?.[0] ||
                null;


            if (photoFile) {

                validateImage(
                    photoFile,
                    8
                );

                photoUrl =
                    await uploadTeamPhoto(
                        photoFile
                    );

            }


            const payload = {

                name,

                position,

                class_name:
                    className ||
                    null,

                category,

                display_order:
                    order,

                active,

                photo_url:
                    photoUrl

            };


            if (editingTeamId) {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "team_members"
                        )
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

            } else {

                const {
                    error
                } =
                    await supabaseClient
                        .from(
                            "team_members"
                        )
                        .insert(
                            payload
                        );

                if (error) {
                    throw error;
                }

            }


            closeTeamAdminModal();

            await loadAdminTeam();

            await loadPublicTeam();

            await loadDashboardData();


            alert(
                editingTeamId
                    ? "TEAM MEMBER UPDATED."
                    : "TEAM MEMBER ADDED."
            );

        } catch (error) {

            console.error(
                "Save team error:",
                error
            );

            showMessage(
                "teamAdminMessage",
                friendlyError(error),
                true
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "SAVE MEMBER";

            }

        }

    }


    async function uploadTeamPhoto(
        file
    ) {

        const extension =
            getFileExtension(
                file.name
            );

        const fileName =
            `${crypto.randomUUID()}.${extension}`;

        const path =
            `team/${fileName}`;


        const {
            error
        } =
            await supabaseClient
                .storage
                .from(
                    TEAM_BUCKET
                )
                .upload(
                    path,
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
                .from(
                    TEAM_BUCKET
                )
                .getPublicUrl(
                    path
                );


        return data.publicUrl;

    }


    async function deleteTeamMember(
        member
    ) {

        if (
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete ${
                    member.name ||
                    "this member"
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
                    .from(
                        "team_members"
                    )
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

            await loadDashboardData();

        } catch (error) {

            console.error(
                "Delete team error:",
                error
            );

            alert(
                friendlyError(error)
            );

        }

    }


    /* =====================================================
       PUBLIC TEAM
    ===================================================== */

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
                    .from(
                        "team_members"
                    )
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


                    const photoHTML =
                        member.photo_url
                            ? `
                                <img
                                    src="${escapeAttribute(
                                        member.photo_url
                                    )}"
                                    alt="${escapeAttribute(
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
                        () =>
                            openTeamProfile(
                                member
                            )
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


    function closeTeamProfile() {

        $("teamProfile")
            ?.classList.remove(
                "active"
            );

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

                if (
                    event.target ===
                    $("teamProfile")
                ) {

                    closeTeamProfile();

                }

            }
        );


    /* =====================================================
       EVENTS ADMIN
    ===================================================== */

    function openEventAdminModal(
        eventData = null
    ) {

        editingEventId =
            eventData?.id ||
            null;


        if ($("eventModalTitle")) {

            $("eventModalTitle").textContent =
                eventData
                    ? "EDIT EVENT"
                    : "ADD EVENT";

        }


        setValue(
            "adminEventTitle",
            eventData?.title || ""
        );

        setValue(
            "adminEventDate",
            eventData?.event_date || ""
        );

        setValue(
            "adminEventDescription",
            eventData?.description || ""
        );


        /*
         * GOOGLE FORM REGISTRATION LINK
         */

        setValue(
            "adminEventRegistration",
            eventData?.registration_url ||
            ""
        );


        setValue(
            "adminEventOrder",
            eventData?.display_order ?? 0
        );


        if ($("adminEventPublished")) {

            $("adminEventPublished").checked =
                eventData?.published !== false;

        }


        if ($("adminEventPoster")) {

            $("adminEventPoster").value =
                "";

        }


        showMessage(
            "eventAdminMessage",
            ""
        );


        $("eventAdminModal")
            ?.classList.add(
                "active"
            );

        body.classList.add(
            "modal-open"
        );

    }


    function closeEventAdminModal() {

        $("eventAdminModal")
            ?.classList.remove(
                "active"
            );

        body.classList.remove(
            "modal-open"
        );

        editingEventId = null;

    }


    async function loadAdminEvents() {

        const list =
            $("adminEventsList");

        if (
            !list ||
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        list.innerHTML =
            `<div class="admin-loading">
                LOADING EVENTS...
            </div>`;


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
                )
                .order(
                    "event_date",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Events loading error:",
                error
            );

            list.innerHTML =
                `<div class="admin-empty">
                    FAILED TO LOAD EVENTS.
                </div>`;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML =
                `<div class="admin-empty">
                    NO EVENTS YET.
                </div>`;

            return;

        }


        list.innerHTML =
            data
                .map(
                    eventData =>
                        createAdminEventCard(
                            eventData
                        )
                )
                .join("");


        list
            .querySelectorAll(
                "[data-edit-event]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            data.find(
                                eventData =>
                                    eventData.id ===
                                    button.dataset.editEvent
                            );

                        if (item) {

                            openEventAdminModal(
                                item
                            );

                        }

                    }
                );

            });


        list
            .querySelectorAll(
                "[data-delete-event]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            data.find(
                                eventData =>
                                    eventData.id ===
                                    button.dataset.deleteEvent
                            );

                        if (item) {

                            deleteEvent(
                                item
                            );

                        }

                    }
                );

            });

    }


    function createAdminEventCard(
        eventData
    ) {

        const registration =
            eventData.registration_url
                ? "GOOGLE FORM CONNECTED"
                : "NO REGISTRATION LINK";


        return `
            <article class="admin-data-card">

                ${
                    eventData.poster_url
                        ? `
                            <div class="admin-data-image">
                                <img
                                    src="${escapeAttribute(
                                        eventData.poster_url
                                    )}"
                                    alt="${escapeAttribute(
                                        eventData.title
                                    )}"
                                >
                            </div>
                        `
                        : ""
                }

                <div class="admin-data-content">

                    <h3>
                        ${escapeHTML(
                            eventData.title ||
                            "EVENT"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            eventData.event_date ||
                            ""
                        )}
                    </p>

                    <small>
                        ${escapeHTML(
                            eventData.description ||
                            ""
                        )}
                    </small>

                    <div class="admin-card-meta">
                        ${
                            eventData.published
                                ? "PUBLISHED"
                                : "HIDDEN"
                        }
                        ·
                        ${registration}
                    </div>

                    <div class="admin-card-actions">

                        <button
                            type="button"
                            class="admin-secondary-button"
                            data-edit-event="${escapeAttribute(
                                eventData.id
                            )}"
                        >
                            EDIT
                        </button>

                        <button
                            type="button"
                            class="admin-danger-button"
                            data-delete-event="${escapeAttribute(
                                eventData.id
                            )}"
                        >
                            DELETE
                        </button>

                    </div>

                </div>

            </article>
        `;

    }


    async function saveEvent(
        event
    ) {

        event.preventDefault();

        if (
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        const button =
            $("saveEventButton");

        if (button) {

            button.disabled = true;

            button.textContent =
                "SAVING...";

        }


        try {

            const title =
                getValue(
                    "adminEventTitle"
                );

            const eventDate =
                getValue(
                    "adminEventDate"
                );

            const description =
                getValue(
                    "adminEventDescription"
                );


            /*
             * GOOGLE FORM LINK
             */

            const registrationUrl =
                getValue(
                    "adminEventRegistration"
                );


            const order =
                Math.max(
                    0,
                    Number(
                        getValue(
                            "adminEventOrder"
                        )
                    ) || 0
                );


            const published =
                $("adminEventPublished")
                    ?.checked !== false;


            if (!title) {

                throw new Error(
                    "Please enter an event title."
                );

            }


            let posterUrl =
                null;


            if (editingEventId) {

                const {
                    data
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

                posterUrl =
                    data?.poster_url ||
                    null;

            }


            const posterInput =
                $("adminEventPoster");

            const posterFile =
                posterInput?.files?.[0] ||
                null;


            if (posterFile) {

                validateImage(
                    posterFile,
                    8
                );

                posterUrl =
                    await fileToDataURL(
                        posterFile
                    );

            }


            const payload = {

                title,

                event_date:
                    eventDate ||
                    null,

                description:
                    description ||
                    null,

                registration_url:
                    registrationUrl ||
                    null,

                poster_url:
                    posterUrl,

                display_order:
                    order,

                published

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

            }


            closeEventAdminModal();

            await loadAdminEvents();

            await loadPublicEvents();

            await loadDashboardData();


            alert(
                editingEventId
                    ? "EVENT UPDATED."
                    : "EVENT ADDED."
            );

        } catch (error) {

            console.error(
                "Save event error:",
                error
            );

            showMessage(
                "eventAdminMessage",
                friendlyError(error),
                true
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "SAVE EVENT";

            }

        }

    }


    async function deleteEvent(
        eventData
    ) {

        const confirmed =
            window.confirm(
                `Delete ${
                    eventData.title ||
                    "this event"
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

            await loadPublicEvents();

            await loadDashboardData();

        } catch (error) {

            console.error(
                "Delete event error:",
                error
            );

            alert(
                friendlyError(error)
            );

        }

    }


    /* =====================================================
       PUBLIC EVENTS
    ===================================================== */

    async function loadPublicEvents() {

        const container =
            $("publicEventsGrid") ||
            $("eventsGrid") ||
            $("publicEvents");


        if (!container) {
            return;
        }


        if (!supabaseClient) {

            container.innerHTML =
                `<div class="events-empty">
                    EVENTS DATA UNAVAILABLE.
                </div>`;

            return;

        }


        container.innerHTML =
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


            /*
             * IMPORTANT:
             * NO EVENTS = UPDATED SOON
             */

            if (
                !data ||
                data.length === 0
            ) {

                container.innerHTML =
                    `<div class="events-empty">
                        EVENTS WILL BE UPDATED SOON.
                    </div>`;

                return;

            }


            container.innerHTML = "";


            data.forEach(
                eventData => {

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "public-event-card";


                    const date =
                        formatEventDate(
                            eventData.event_date
                        );


                    const poster =
                        eventData.poster_url
                            ? `
                                <div class="event-poster">
                                    <img
                                        src="${escapeAttribute(
                                            eventData.poster_url
                                        )}"
                                        alt="${escapeAttribute(
                                            eventData.title ||
                                            "SYNTHENOVA Event"
                                        )}"
                                        loading="lazy"
                                    >
                                </div>
                            `
                            : "";


                    /*
                     * GOOGLE FORM REGISTER BUTTON
                     *
                     * If registration_url exists:
                     * SHOW REGISTER NOW
                     *
                     * If not:
                     * DON'T SHOW BUTTON
                     */

                    const registerButton =
                        eventData.registration_url
                            ? `
                                <a
                                    class="event-register-button"
                                    href="${escapeAttribute(
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

                        <div class="event-content">

                            ${
                                date
                                    ? `
                                        <span class="event-date">
                                            ${escapeHTML(
                                                date
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

                            ${registerButton}

                        </div>
                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        } catch (error) {

            console.error(
                "Public events error:",
                error
            );

            container.innerHTML =
                `<div class="events-empty">
                    EVENTS WILL BE UPDATED SOON.
                </div>`;

        }

    }


    /* =====================================================
       GALLERY ADMIN
       MULTIPLE IMAGE UPLOAD
    ===================================================== */

    function openGalleryAdminModal(
        galleryData = null
    ) {

        editingGalleryId =
            galleryData?.id ||
            null;


        if ($("galleryModalTitle")) {

            $("galleryModalTitle").textContent =
                galleryData
                    ? "EDIT GALLERY ITEM"
                    : "ADD GALLERY ITEMS";

        }


        if ($("adminGalleryImage")) {

            $("adminGalleryImage").value =
                "";

        }


        setValue(
            "adminGalleryCaption",
            galleryData?.caption ||
            ""
        );


        setValue(
            "adminGalleryOrder",
            galleryData?.display_order ??
            0
        );


        if ($("adminGalleryPublished")) {

            $("adminGalleryPublished").checked =
                galleryData?.published !== false;

        }


        showMessage(
            "galleryAdminMessage",
            ""
        );


        $("galleryAdminModal")
            ?.classList.add(
                "active"
            );

        body.classList.add(
            "modal-open"
        );

    }


    function closeGalleryAdminModal() {

        $("galleryAdminModal")
            ?.classList.remove(
                "active"
            );

        body.classList.remove(
            "modal-open"
        );

        editingGalleryId = null;

    }


    async function loadAdminGallery() {

        const list =
            $("adminGalleryList");

        if (
            !list ||
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        list.innerHTML =
            `<div class="admin-loading">
                LOADING GALLERY...
            </div>`;


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
                    created_at
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
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Gallery loading error:",
                error
            );

            list.innerHTML =
                `<div class="admin-empty">
                    FAILED TO LOAD GALLERY.
                </div>`;

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML =
                `<div class="admin-empty">
                    NO GALLERY ITEMS YET.
                </div>`;

            return;

        }


        list.innerHTML =
            data
                .map(
                    item =>
                        createAdminGalleryCard(
                            item
                        )
                )
                .join("");


        list
            .querySelectorAll(
                "[data-edit-gallery]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            data.find(
                                galleryItem =>
                                    galleryItem.id ===
                                    button.dataset.editGallery
                            );

                        if (item) {

                            openGalleryAdminModal(
                                item
                            );

                        }

                    }
                );

            });


        list
            .querySelectorAll(
                "[data-delete-gallery]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const item =
                            data.find(
                                galleryItem =>
                                    galleryItem.id ===
                                    button.dataset.deleteGallery
                            );

                        if (item) {

                            deleteGalleryItem(
                                item
                            );

                        }

                    }
                );

            });

    }


    function createAdminGalleryCard(
        item
    ) {

        return `
            <article class="admin-data-card">

                <div class="admin-data-image">

                    <img
                        src="${escapeAttribute(
                            item.image_url
                        )}"
                        alt="${escapeAttribute(
                            item.caption ||
                            "SYNTHENOVA Gallery"
                        )}"
                    >

                </div>

                <div class="admin-data-content">

                    <h3>
                        ${escapeHTML(
                            item.caption ||
                            "GALLERY IMAGE"
                        )}
                    </h3>

                    <p>
                        ${
                            item.published
                                ? "PUBLISHED"
                                : "HIDDEN"
                        }
                    </p>

                    <small>
                        ORDER ${
                            Number(
                                item.display_order
                            ) || 0
                        }
                    </small>

                    <div class="admin-card-actions">

                        <button
                            type="button"
                            class="admin-secondary-button"
                            data-edit-gallery="${escapeAttribute(
                                item.id
                            )}"
                        >
                            EDIT
                        </button>

                        <button
                            type="button"
                            class="admin-danger-button"
                            data-delete-gallery="${escapeAttribute(
                                item.id
                            )}"
                        >
                            DELETE
                        </button>

                    </div>

                </div>

            </article>
        `;

    }


    /* =====================================================
       MULTIPLE GALLERY UPLOAD
    ===================================================== */

    async function saveGallery(
        event
    ) {

        event.preventDefault();

        if (
            !supabaseClient ||
            !isAdmin
        ) {
            return;
        }


        const button =
            $("saveGalleryButton");


        if (button) {

            button.disabled = true;

            button.textContent =
                "UPLOADING...";

        }


        try {

            const imageInput =
                $("adminGalleryImage");


            const files =
                imageInput?.files
                    ? Array.from(
                        imageInput.files
                    )
                    : [];


            /*
             * EDIT MODE
             */

            if (editingGalleryId) {

                await updateGalleryItem(
                    files[0] || null
                );

                closeGalleryAdminModal();

                await loadAdminGallery();

                await loadPublicGallery();

                await loadDashboardData();

                alert(
                    "GALLERY ITEM UPDATED."
                );

                return;

            }


            /*
             * ADD MODE
             *
             * MULTIPLE FILES
             */

            if (!files.length) {

                throw new Error(
                    "Please select at least one image."
                );

            }


            const caption =
                getValue(
                    "adminGalleryCaption"
                );


            const startOrder =
                Math.max(
                    0,
                    Number(
                        getValue(
                            "adminGalleryOrder"
                        )
                    ) || 0
                );


            const published =
                $("adminGalleryPublished")
                    ?.checked !== false;


            const total =
                files.length;


            let uploaded =
                0;


            for (
                let index = 0;
                index < total;
                index++
            ) {

                const file =
                    files[index];


                validateImage(
                    file,
                    10
                );


                if (button) {

                    button.textContent =
                        `UPLOADING ${index + 1}/${total}...`;

                }


                const imageUrl =
                    await fileToDataURL(
                        file
                    );


                const {
                    error
                } =
                    await supabaseClient
                        .from("gallery")
                        .insert({
                            image_url:
                                imageUrl,

                            caption:
                                caption ||
                                file.name,

                            display_order:
                                startOrder +
                                index,

                            published
                        });


                if (error) {
                    throw error;
                }


                uploaded++;

            }


            closeGalleryAdminModal();

            await loadAdminGallery();

            await loadPublicGallery();

            await loadDashboardData();


            alert(
                `${uploaded} IMAGE${
                    uploaded === 1
                        ? ""
                        : "S"
                } UPLOADED SUCCESSFULLY.`
            );

        } catch (error) {

            console.error(
                "Gallery upload error:",
                error
            );

            showMessage(
                "galleryAdminMessage",
                friendlyError(error),
                true
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "UPLOAD IMAGE";

            }

        }

    }


    async function updateGalleryItem(
        file
    ) {

        const caption =
            getValue(
                "adminGalleryCaption"
            );

        const order =
            Math.max(
                0,
                Number(
                    getValue(
                        "adminGalleryOrder"
                    )
                ) || 0
            );

        const published =
            $("adminGalleryPublished")
                ?.checked !== false;


        let imageUrl = null;


        if (file) {

            validateImage(
                file,
                10
            );

            imageUrl =
                await fileToDataURL(
                    file
                );

        }


        const payload = {

            caption:
                caption ||
                null,

            display_order:
                order,

            published

        };


        if (imageUrl) {

            payload.image_url =
                imageUrl;

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
                    editingGalleryId
                );


        if (error) {
            throw error;
        }

    }


    async function deleteGalleryItem(
        item
    ) {

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
                        item.id
                    );


            if (error) {
                throw error;
            }


            await loadAdminGallery();

            await loadPublicGallery();

            await loadDashboardData();

        } catch (error) {

            console.error(
                "Gallery delete error:",
                error
            );

            alert(
                friendlyError(error)
            );

        }

    }


    /* =====================================================
       PUBLIC GALLERY
    ===================================================== */

    async function loadPublicGallery() {

        const container =
            $("publicGalleryGrid") ||
            $("galleryGrid") ||
            $("publicGallery");


        if (!container) {
            return;
        }


        if (!supabaseClient) {

            container.innerHTML =
                `<div class="gallery-empty">
                    GALLERY DATA UNAVAILABLE.
                </div>`;

            return;

        }


        container.innerHTML =
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

                container.innerHTML =
                    `<div class="gallery-empty">
                        GALLERY COMING SOON.
                    </div>`;

                return;

            }


            container.innerHTML = "";


            data.forEach(
                item => {

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "gallery-item";


                    card.innerHTML = `

                        <img
                            src="${escapeAttribute(
                                item.image_url
                            )}"
                            alt="${escapeAttribute(
                                item.caption ||
                                "SYNTHENOVA Gallery"
                            )}"
                            loading="lazy"
                        >

                        ${
                            item.caption
                                ? `
                                    <div class="gallery-caption">
                                        ${escapeHTML(
                                            item.caption
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    `;


                    card.addEventListener(
                        "click",
                        () =>
                            openGalleryPreview(
                                item
                            )
                    );


                    container.appendChild(
                        card
                    );

                }
            );

        } catch (error) {

            console.error(
                "Public gallery error:",
                error
            );

            container.innerHTML =
                `<div class="gallery-empty">
                    GALLERY COMING SOON.
                </div>`;

        }

    }


    /* =====================================================
       GALLERY PREVIEW
    ===================================================== */

    function openGalleryPreview(
        item
    ) {

        let modal =
            $("galleryPreviewModal");


        if (!modal) {

            modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "galleryPreviewModal";

            modal.className =
                "gallery-preview-modal";


            modal.innerHTML = `

                <button
                    type="button"
                    class="gallery-preview-close"
                    aria-label="Close gallery"
                >
                    ×
                </button>

                <div class="gallery-preview-inner">

                    <img
                        id="galleryPreviewImage"
                        src=""
                        alt=""
                    >

                    <div
                        id="galleryPreviewCaption"
                        class="gallery-preview-caption"
                    ></div>

                </div>

            `;


            body.appendChild(
                modal
            );


            modal
                .querySelector(
                    ".gallery-preview-close"
                )
                ?.addEventListener(
                    "click",
                    closeGalleryPreview
                );


            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeGalleryPreview();

                    }

                }
            );

        }


        const image =
            $("galleryPreviewImage");

        const caption =
            $("galleryPreviewCaption");


        if (image) {

            image.src =
                item.image_url ||
                "";

            image.alt =
                item.caption ||
                "SYNTHENOVA Gallery";

        }


        if (caption) {

            caption.textContent =
                item.caption ||
                "";

        }


        modal.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

    }


    function closeGalleryPreview() {

        $("galleryPreviewModal")
            ?.classList.remove(
                "active"
            );

        body.classList.remove(
            "modal-open"
        );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function getValue(
        id
    ) {

        return (
            $(id)?.value ||
            ""
        ).trim();

    }


    function setValue(
        id,
        value
    ) {

        if ($(id)) {

            $(id).value =
                value ?? "";

        }

    }


    function showMessage(
        id,
        message,
        isError = false
    ) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.classList.toggle(
            "error",
            isError
        );

        element.classList.toggle(
            "success",
            !isError &&
            !!message
        );

    }


    function validateImage(
        file,
        maxMB
    ) {

        if (!file) {

            throw new Error(
                "No image selected."
            );

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            throw new Error(
                "Please select an image file."
            );

        }


        if (
            file.size >
            maxMB * 1024 * 1024
        ) {

            throw new Error(
                `Image must be smaller than ${maxMB} MB.`
            );

        }

    }


    function fileToDataURL(
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
                                "FAILED TO READ IMAGE."
                            )
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    function formatEventDate(
        dateString
    ) {

        if (!dateString) {
            return "";
        }

        try {

            const date =
                new Date(
                    dateString
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return dateString;

            }

            return new Intl.DateTimeFormat(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ).format(
                date
            );

        } catch {

            return dateString;

        }

    }


    function getFileExtension(
        fileName
    ) {

        const extension =
            fileName
                .split(".")
                .pop()
                ?.toLowerCase();


        if (
            [
                "jpg",
                "jpeg",
                "png",
                "webp"
            ].includes(
                extension
            )
        ) {

            return extension;

        }

        return "jpg";

    }


    function escapeHTML(
        value
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            value ?? "";

        return div.innerHTML;

    }


    function escapeAttribute(
        value
    ) {

        return escapeHTML(
            value
        )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    function friendlyError(
        error
    ) {

        if (!error) {

            return "Something went wrong.";

        }


        const message =
            error.message ||
            String(error);


        const lower =
            message.toLowerCase();


        if (
            lower.includes(
                "invalid login credentials"
            )
        ) {

            return (
                "Incorrect email or password."
            );

        }


        if (
            lower.includes(
                "row-level security"
            ) ||
            lower.includes(
                "permission denied"
            )
        ) {

            return (
                "Supabase permission denied. Check your RLS policies."
            );

        }


        if (
            lower.includes(
                "storage"
            ) ||
            lower.includes(
                "bucket"
            )
        ) {

            return (
                'Storage error. Check the "team photo" bucket policies.'
            );

        }


        return message;

    }


    /* =====================================================
       PUBLIC DEBUG API
    ===================================================== */

    window.SYNTHENOVA = {

        getUser:
            () =>
                currentUser,

        isAdmin:
            () =>
                isAdmin,

        openAdmin:
            openAdminDashboard,

        closeAdmin:
            closeAdminDashboard,

        logout:
            logoutAdmin,

        reloadTeam:
            loadPublicTeam,

        reloadEvents:
            loadPublicEvents,

        reloadGallery:
            loadPublicGallery

    };


    console.log(
        "SYNTHENOVA frontend initialized."
    );

});