/* =========================================================
   SYNTHENOVA
   PUBLIC FRONTEND + SUPABASE AUTH + ADMIN CONTROL CENTER
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    "use strict";


    /* =====================================================
       GLOBAL STATE
    ===================================================== */

    let supabaseClient = null;
    let currentUser = null;
    let isAdmin = false;

    let editingTeamId = null;
    let editingEventId = null;
    let editingGalleryId = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const body = document.body;


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


    function setMessage(id, message, error = false) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent = message || "";

        element.style.color = error
            ? "#9a3737"
            : "#075350";

    }


    /* =====================================================
       PAGE LOADER
    ===================================================== */

    const pageLoader = $("pageLoader");


    function hideLoader() {

        if (!pageLoader) {
            return;
        }

        pageLoader.style.opacity = "0";
        pageLoader.style.visibility = "hidden";

        setTimeout(() => {

            pageLoader.style.display = "none";

        }, 600);

    }


    window.addEventListener(
        "load",
        hideLoader
    );

    setTimeout(
        hideLoader,
        2200
    );


    /* =====================================================
       SIDE MENU
    ===================================================== */

    const menuButton = $("menuButton");
    const sideMenu = $("sideMenu");
    const menuOverlay = $("menuOverlay");
    const closeMenu = $("closeMenu");


    function openMenu() {

        sideMenu?.classList.add("active");
        menuOverlay?.classList.add("active");

        body.classList.add("menu-open");

    }


    function closeSideMenu() {

        sideMenu?.classList.remove("active");
        menuOverlay?.classList.remove("active");

        body.classList.remove("menu-open");

    }


    menuButton?.addEventListener(
        "click",
        openMenu
    );


    closeMenu?.addEventListener(
        "click",
        closeSideMenu
    );


    menuOverlay?.addEventListener(
        "click",
        closeSideMenu
    );


    document.querySelectorAll(
        ".mobile-nav a"
    ).forEach(link => {

        link.addEventListener(
            "click",
            closeSideMenu
        );

    });


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach(link => {

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

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                closeSideMenu();

            }
        );

    });


    /* =====================================================
       JOIN COMMUNITY MODAL
    ===================================================== */

    const joinModal = $("joinModal");
    const joinButton = $("joinButton");
    const contactJoinButton =
        $("contactJoinButton");

    const closeJoinModal =
        $("closeJoinModal");

    const joinForm = $("joinForm");


    function openJoinModal() {

        joinModal?.classList.add("active");

        body.classList.add(
            "modal-open"
        );

        setTimeout(() => {

            $("memberName")?.focus();

        }, 200);

    }


    function closeJoinModalFunction() {

        joinModal?.classList.remove("active");

        body.classList.remove(
            "modal-open"
        );

    }


    joinButton?.addEventListener(
        "click",
        openJoinModal
    );


    contactJoinButton?.addEventListener(
        "click",
        openJoinModal
    );


    closeJoinModal?.addEventListener(
        "click",
        closeJoinModalFunction
    );


    joinModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                joinModal
            ) {

                closeJoinModalFunction();

            }

        }
    );


    joinForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                $("memberName")?.value.trim();

            const department =
                $("department")?.value;


            if (
                !name ||
                !department
            ) {

                setMessage(
                    "formMessage",
                    "PLEASE COMPLETE ALL FIELDS.",
                    true
                );

                return;

            }


            setMessage(
                "formMessage",
                "REDIRECTING TO COMMUNITY..."
            );


            const whatsapp =
                "https://chat.whatsapp.com/By96SMw1a56GRiAwx9b574?s=sw&p=a&mlu=4&ilr=4";


            setTimeout(() => {

                window.location.href =
                    whatsapp;

            }, 700);

        }
    );


    /* =====================================================
       LOGIN MODAL
    ===================================================== */

    const loginModal = $("loginModal");
    const loginButton = $("loginButton");
    const mobileLogin = $("mobileLogin");
    const closeLoginModal =
        $("closeLoginModal");

    const loginForm = $("loginForm");
    const loginSubmitButton =
        $("loginSubmitButton");


    function openLoginModal() {

        closeSideMenu();

        loginModal?.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

        setTimeout(() => {

            $("loginEmail")?.focus();

        }, 200);

    }


    function closeLoginModalFunction() {

        loginModal?.classList.remove(
            "active"
        );

        body.classList.remove(
            "modal-open"
        );

    }


    loginButton?.addEventListener(
        "click",
        openLoginModal
    );


    mobileLogin?.addEventListener(
        "click",
        openLoginModal
    );


    closeLoginModal?.addEventListener(
        "click",
        closeLoginModalFunction
    );


    loginModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                loginModal
            ) {

                closeLoginModalFunction();

            }

        }
    );


    /* =====================================================
       SUPABASE INITIALIZATION
    ===================================================== */

    async function initializeSupabase() {

        try {

            if (!window.supabase) {

                console.error(
                    "Supabase library was not loaded."
                );

                return false;

            }


            const response =
                await fetch(
                    "/api/config"
                );


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

                console.error(
                    "Supabase configuration unavailable."
                );

                return false;

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
       ADMIN CHECK
    ===================================================== */

    async function checkAdmin(
        userId
    ) {

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
                "Admin check failed:",
                error
            );

            return false;

        }

    }


    /* =====================================================
       AUTH UI
    ===================================================== */

    function updateAuthUI() {

        const adminButton =
            $("adminButton");

        const logoutButton =
            $("logoutButton");

        const mobileAdmin =
            $("mobileAdmin");

        const mobileLogout =
            $("mobileLogout");


        if (isAdmin) {

            loginButton?.classList.add(
                "hidden"
            );

            adminButton?.classList.remove(
                "hidden"
            );

            logoutButton?.classList.remove(
                "hidden"
            );


            mobileLogin?.classList.add(
                "hidden"
            );

            mobileAdmin?.classList.remove(
                "hidden"
            );

            mobileLogout?.classList.remove(
                "hidden"
            );

        } else {

            loginButton?.classList.remove(
                "hidden"
            );

            adminButton?.classList.add(
                "hidden"
            );

            logoutButton?.classList.add(
                "hidden"
            );


            mobileLogin?.classList.remove(
                "hidden"
            );

            mobileAdmin?.classList.add(
                "hidden"
            );

            mobileLogout?.classList.add(
                "hidden"
            );

        }

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    loginForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!supabaseClient) {

                setMessage(
                    "loginMessage",
                    "DATABASE CONNECTION NOT READY.",
                    true
                );

                return;

            }


            const email =
                $("loginEmail")?.value.trim();

            const password =
                $("loginPassword")?.value;


            if (
                !email ||
                !password
            ) {

                setMessage(
                    "loginMessage",
                    "ENTER EMAIL AND PASSWORD.",
                    true
                );

                return;

            }


            if (loginSubmitButton) {

                loginSubmitButton.disabled =
                    true;

                loginSubmitButton.innerHTML =
                    "AUTHENTICATING...";

            }


            setMessage(
                "loginMessage",
                "VERIFYING CREDENTIALS..."
            );


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


                if (!data?.user) {

                    throw new Error(
                        "USER AUTHENTICATION FAILED."
                    );

                }


                currentUser =
                    data.user;


                const adminStatus =
                    await checkAdmin(
                        currentUser.id
                    );


                if (!adminStatus) {

                    await supabaseClient
                        .auth
                        .signOut();

                    currentUser = null;
                    isAdmin = false;

                    updateAuthUI();

                    setMessage(
                        "loginMessage",
                        "THIS ACCOUNT IS NOT AN AUTHORIZED ADMIN.",
                        true
                    );

                    return;

                }


                isAdmin = true;

                updateAuthUI();


                setMessage(
                    "loginMessage",
                    "ACCESS GRANTED."
                );


                setTimeout(
                    () => {

                        closeLoginModalFunction();

                        openAdminDashboard();

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                setMessage(
                    "loginMessage",
                    error.message ||
                    "LOGIN FAILED.",
                    true
                );


            } finally {

                if (loginSubmitButton) {

                    loginSubmitButton.disabled =
                        false;

                    loginSubmitButton.innerHTML =
                        `
                        AUTHENTICATE
                        <span>→</span>
                        `;

                }

            }

        }
    );


    /* =====================================================
       ADMIN DASHBOARD
    ===================================================== */

    const adminDashboard =
        $("adminDashboard");


    function openAdminDashboard() {

        if (!isAdmin) {

            openLoginModal();

            return;

        }


        adminDashboard?.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );


        loadDashboardData();

        loadAdminTeam();

    }


    function closeAdminDashboard() {

        adminDashboard?.classList.remove(
            "active"
        );

        body.classList.remove(
            "modal-open"
        );

    }


    $("adminButton")?.addEventListener(
        "click",
        openAdminDashboard
    );


    $("mobileAdmin")?.addEventListener(
        "click",
        () => {

            closeSideMenu();

            openAdminDashboard();

        }
    );


    $("closeDashboard")?.addEventListener(
        "click",
        closeAdminDashboard
    );


    adminDashboard?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                adminDashboard
            ) {

                closeAdminDashboard();

            }

        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logoutAdmin() {

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

        closeSideMenu();

    }


    $("logoutButton")?.addEventListener(
        "click",
        logoutAdmin
    );


    $("mobileLogout")?.addEventListener(
        "click",
        logoutAdmin
    );


    $("dashboardLogout")?.addEventListener(
        "click",
        logoutAdmin
    );


    /* =====================================================
       DASHBOARD COUNTS
    ===================================================== */

    async function loadDashboardData() {

        if (
            !supabaseClient ||
            !isAdmin
        ) {

            return;

        }


        try {

            const [
                teamResult,
                eventsResult,
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
                    teamResult.count ?? 0;

            }


            if ($("eventCount")) {

                $("eventCount").textContent =
                    eventsResult.count ?? 0;

            }


            if ($("galleryCount")) {

                $("galleryCount").textContent =
                    galleryResult.count ?? 0;

            }

        } catch (error) {

            console.error(
                "Dashboard count error:",
                error
            );

        }

    }


    /* =====================================================
       ADMIN TABS
    ===================================================== */

    const adminTabs =
        document.querySelectorAll(
            ".admin-tab"
        );


    const adminPanels = {

        team:
            $("adminTeamPanel"),

        events:
            $("adminEventsPanel"),

        gallery:
            $("adminGalleryPanel")

    };


    async function switchAdminTab(
        tabName
    ) {

        adminTabs.forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.adminTab ===
                    tabName
                );

            }
        );


        Object.entries(
            adminPanels
        ).forEach(
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
            tabName ===
            "team"
        ) {

            await loadAdminTeam();

        }


        if (
            tabName ===
            "events"
        ) {

            await loadAdminEvents();

        }


        if (
            tabName ===
            "gallery"
        ) {

            await loadAdminGallery();

        }

    }


    adminTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    switchAdminTab(
                        tab.dataset.adminTab
                    );

                }
            );

        }
    );


    document
        .querySelectorAll(
            "[data-admin-tab]"
        )
        .forEach(
            element => {

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

            }
        );


 /* =====================================================
   TEAM — PUBLIC
   CIRCULAR TEAM CARDS + PROFILE POPUP
===================================================== */

async function loadPublicTeam() {

    const teamGrid = $("publicTeamGrid");

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
        } = await supabaseClient
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
            .eq("active", true)
            .order("display_order", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            teamGrid.innerHTML = `
                <div class="team-loading">
                    TEAM WILL BE UPDATED SOON.
                </div>
            `;

            return;
        }

        teamGrid.innerHTML = "";

        data.forEach(member => {

            const card = document.createElement("article");

            card.className = "team-member";

            card.dataset.id = member.id || "";

            const photoHTML = member.photo_url
                ? `
                    <img
                        src="${escapeHTML(member.photo_url)}"
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
                    openTeamProfile(member);
                }
            );

            teamGrid.appendChild(card);

        });

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


/* =====================================================
   TEAM PROFILE POPUP
===================================================== */

function openTeamProfile(member) {

    const profile = $("teamProfile");

    if (!profile) {
        return;
    }

    const image = $("profileImage");

    const role = $("profileRole");

    const name = $("profileName");

    const className = $("profileClass");

    const category = $("profileCategory");


    /* -----------------------------------------
       PROFILE IMAGE
    ----------------------------------------- */

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


    /* -----------------------------------------
       POSITION
    ----------------------------------------- */

    if (role) {

        role.textContent =
            member.position ||
            "SYNTHENOVA TEAM";
    }


    /* -----------------------------------------
       NAME
    ----------------------------------------- */

    if (name) {

        name.textContent =
            member.name ||
            "SYNTHENOVA MEMBER";
    }


    /* -----------------------------------------
       CLASS
    ----------------------------------------- */

    if (className) {

        className.textContent =
            member.class_name ||
            "SYNTHENOVA";
    }


    /* -----------------------------------------
       CATEGORY
    ----------------------------------------- */

    if (category) {

        category.textContent =
            member.category ||
            "GENERAL";
    }


    /* -----------------------------------------
       OPEN PROFILE
    ----------------------------------------- */

    profile.classList.add("active");

    body.classList.add("modal-open");

}


/* =====================================================
   CLOSE TEAM PROFILE
===================================================== */

function closeTeamProfile() {

    const profile = $("teamProfile");

    if (profile) {

        profile.classList.remove("active");

    }

    body.classList.remove("modal-open");

}


/* =====================================================
   TEAM PROFILE CLOSE BUTTON
===================================================== */

$("closeTeamProfile")?.addEventListener(
    "click",
    closeTeamProfile
);


/* =====================================================
   CLOSE WHEN CLICKING OUTSIDE
===================================================== */

$("teamProfile")?.addEventListener(
    "click",
    event => {

        const profile =
            $("teamProfile");

        if (
            event.target === profile
        ) {

            closeTeamProfile();

        }

    }
);


/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        const profile =
            $("teamProfile");

        if (
            profile &&
            profile.classList.contains("active")
        ) {

            closeTeamProfile();

        }

    }
);
    /* =====================================================
       TEAM — ADMIN MODAL
    ===================================================== */

    const teamAdminModal =
        $("teamAdminModal");

    const teamAdminForm =
        $("teamAdminForm");


    function openTeamAdminModal(
        member = null
    ) {

        editingTeamId =
            member?.id || null;


        const title =
            $("teamModalTitle");


        if (title) {

            title.textContent =
                member
                    ? "EDIT MEMBER"
                    : "ADD MEMBER";

        }


        $("adminTeamName").value =
            member?.name || "";

        $("adminTeamPosition").value =
            member?.position || "";

        $("adminTeamClass").value =
            member?.class_name || "";

        $("adminTeamCategory").value =
            member?.category || "general";

        $("adminTeamOrder").value =
            member?.display_order ?? 0;

        $("adminTeamActive").checked =
            member?.active ?? true;

        $("adminTeamPhoto").value =
            "";


        setMessage(
            "teamAdminMessage",
            ""
        );


        teamAdminModal?.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

    }


    function closeTeamAdminModal() {

        teamAdminModal?.classList.remove(
            "active"
        );

        body.classList.remove(
            "modal-open"
        );

        editingTeamId = null;

    }


    $("addTeamButton")?.addEventListener(
        "click",
        () => {

            openTeamAdminModal();

        }
    );


    $("closeTeamAdminModal")?.addEventListener(
        "click",
        closeTeamAdminModal
    );


    teamAdminModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                teamAdminModal
            ) {

                closeTeamAdminModal();

            }

        }
    );


    /* =====================================================
       TEAM — ADMIN LIST
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

                list.innerHTML = `
                    <div class="admin-empty">
                        NO TEAM MEMBERS FOUND.
                    </div>
                `;

                return;

            }


            list.innerHTML = "";


            data.forEach(
                member => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "admin-data-item";


                    const photo =
                        member.photo_url
                            ? `
                                <img
                                    src="${escapeHTML(member.photo_url)}"
                                    alt="${escapeHTML(member.name)}"
                                >
                            `
                            : "";


                    item.innerHTML = `
                        <div class="admin-data-main">

                            <div class="admin-data-image">
                                ${photo}
                            </div>

                            <div class="admin-data-info">

                                <strong>
                                    ${escapeHTML(
                                        member.name ||
                                        "Unnamed"
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        member.position ||
                                        "MEMBER"
                                    )}

                                    ${
                                        member.class_name
                                            ? " • " +
                                              escapeHTML(
                                                  member.class_name
                                              )
                                            : ""
                                    }

                                    ${
                                        member.active
                                            ? " • ACTIVE"
                                            : " • INACTIVE"
                                    }
                                </span>

                            </div>

                        </div>

                        <div class="admin-data-actions">

                            <button
                                type="button"
                                class="admin-small-button"
                                data-action="edit"
                            >
                                EDIT
                            </button>

                            <button
                                type="button"
                                class="admin-small-button delete"
                                data-action="delete"
                            >
                                DELETE
                            </button>

                        </div>
                    `;


                    item
                        .querySelector(
                            '[data-action="edit"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                openTeamAdminModal(
                                    member
                                );

                            }
                        );


                    item
                        .querySelector(
                            '[data-action="delete"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                deleteTeamMember(
                                    member
                                );

                            }
                        );


                    list.appendChild(
                        item
                    );

                }
            );


        } catch (error) {

            console.error(
                "Admin team error:",
                error
            );


            list.innerHTML = `
                <div class="admin-empty">
                    FAILED TO LOAD TEAM.
                </div>
            `;

        }

    }


    /* =====================================================
       TEAM PHOTO UPLOAD
       BUCKET: team photo
    ===================================================== */

    async function uploadTeamPhoto(
        file
    ) {

        if (!file) {
            return null;
        }


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
            error
        } =
            await supabaseClient
                .storage
                .from("team photo")
                .upload(
                    filePath,
                    file,
                    {
                        upsert: false
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


    /* =====================================================
       SAVE TEAM
    ===================================================== */

    teamAdminForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !supabaseClient ||
                !isAdmin
            ) {

                return;

            }


            const name =
                $("adminTeamName")
                    ?.value.trim();

            const position =
                $("adminTeamPosition")
                    ?.value.trim();

            const className =
                $("adminTeamClass")
                    ?.value.trim();

            const category =
                $("adminTeamCategory")
                    ?.value ||
                "general";

            const displayOrder =
                Number(
                    $("adminTeamOrder")
                        ?.value
                ) || 0;

            const active =
                $("adminTeamActive")
                    ?.checked ??
                true;

            const file =
                $("adminTeamPhoto")
                    ?.files?.[0] ||
                null;


            if (
                !name ||
                !position
            ) {

                setMessage(
                    "teamAdminMessage",
                    "NAME AND POSITION ARE REQUIRED.",
                    true
                );

                return;

            }


            const saveButton =
                $("saveTeamButton");


            if (saveButton) {

                saveButton.disabled = true;

                saveButton.textContent =
                    "SAVING...";

            }


            try {

                let photoUrl = null;


                if (editingTeamId) {

                    const {
                        data,
                        error
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
                            .single();


                    if (error) {
                        throw error;
                    }


                    photoUrl =
                        data?.photo_url ||
                        null;

                }


                if (file) {

                    photoUrl =
                        await uploadTeamPhoto(
                            file
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
                        displayOrder,

                    active,

                    photo_url:
                        photoUrl

                };


                let result;


                if (editingTeamId) {

                    result =
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

                } else {

                    result =
                        await supabaseClient
                            .from(
                                "team_members"
                            )
                            .insert(
                                payload
                            );

                }


                if (result.error) {
                    throw result.error;
                }


                setMessage(
                    "teamAdminMessage",
                    "MEMBER SAVED."
                );


                await loadAdminTeam();

                await loadDashboardData();

                await loadPublicTeam();


                setTimeout(
                    closeTeamAdminModal,
                    500
                );


            } catch (error) {

                console.error(
                    "Team save error:",
                    error
                );


                setMessage(
                    "teamAdminMessage",
                    error.message ||
                    "FAILED TO SAVE MEMBER.",
                    true
                );

            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "SAVE MEMBER";

                }

            }

        }
    );


    /* =====================================================
       DELETE TEAM
    ===================================================== */

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

            await loadDashboardData();

            await loadPublicTeam();


        } catch (error) {

            console.error(
                "Team delete error:",
                error
            );


            alert(
                error.message ||
                "FAILED TO DELETE MEMBER."
            );

        }

    }


    /* =====================================================
       EVENTS — ADMIN MODAL
    ===================================================== */

    const eventAdminModal =
        $("eventAdminModal");

    const eventAdminForm =
        $("eventAdminForm");


    function openEventAdminModal(
        eventData = null
    ) {

        editingEventId =
            eventData?.id ||
            null;


        const title =
            $("eventModalTitle");


        if (title) {

            title.textContent =
                eventData
                    ? "EDIT EVENT"
                    : "ADD EVENT";

        }


        $("adminEventTitle").value =
            eventData?.title || "";

        $("adminEventDate").value =
            eventData?.event_date || "";

        $("adminEventDescription").value =
            eventData?.description || "";

        $("adminEventPoster").value =
            "";

        $("adminEventOrder").value =
            eventData?.display_order ??
            0;

        $("adminEventPublished").checked =
            eventData?.published ??
            true;


        setMessage(
            "eventAdminMessage",
            ""
        );


        eventAdminModal?.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

    }


    function closeEventAdminModal() {

        eventAdminModal?.classList.remove(
            "active"
        );

        body.classList.remove(
            "modal-open"
        );

        editingEventId = null;

    }


    $("addEventButton")?.addEventListener(
        "click",
        () => {

            openEventAdminModal();

        }
    );


    $("closeEventAdminModal")?.addEventListener(
        "click",
        closeEventAdminModal
    );


    eventAdminModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                eventAdminModal
            ) {

                closeEventAdminModal();

            }

        }
    );


    /* =====================================================
       EVENTS — ADMIN LIST
    ===================================================== */

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
                throw error;
            }


            if (
                !data ||
                data.length === 0
            ) {

                list.innerHTML = `
                    <div class="admin-empty">
                        NO EVENTS FOUND.
                    </div>
                `;

                return;

            }


            list.innerHTML = "";


            data.forEach(
                eventData => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "admin-data-item";


                    item.innerHTML = `
                        <div class="admin-data-main">

                            <div class="admin-data-info">

                                <strong>
                                    ${escapeHTML(
                                        eventData.title ||
                                        "Untitled event"
                                    )}
                                </strong>

                                <span>
                                    ${
                                        escapeHTML(
                                            eventData.event_date ||
                                            "NO DATE"
                                        )
                                    }

                                    •

                                    ${
                                        eventData.published
                                            ? "PUBLISHED"
                                            : "DRAFT"
                                    }
                                </span>

                            </div>

                        </div>

                        <div class="admin-data-actions">

                            <button
                                type="button"
                                class="admin-small-button"
                                data-action="edit"
                            >
                                EDIT
                            </button>

                            <button
                                type="button"
                                class="admin-small-button delete"
                                data-action="delete"
                            >
                                DELETE
                            </button>

                        </div>
                    `;


                    item
                        .querySelector(
                            '[data-action="edit"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                openEventAdminModal(
                                    eventData
                                );

                            }
                        );


                    item
                        .querySelector(
                            '[data-action="delete"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                deleteEvent(
                                    eventData
                                );

                            }
                        );


                    list.appendChild(
                        item
                    );

                }
            );


        } catch (error) {

            console.error(
                "Admin events error:",
                error
            );


            list.innerHTML = `
                <div class="admin-empty">
                    FAILED TO LOAD EVENTS.
                </div>
            `;

        }

    }


    /* =====================================================
       SAVE EVENT
    ===================================================== */

    eventAdminForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !supabaseClient ||
                !isAdmin
            ) {

                return;

            }


            const title =
                $("adminEventTitle")
                    ?.value.trim();

            const date =
                $("adminEventDate")
                    ?.value;

            const description =
                $("adminEventDescription")
                    ?.value.trim();

            const displayOrder =
                Number(
                    $("adminEventOrder")
                        ?.value
                ) || 0;

            const published =
                $("adminEventPublished")
                    ?.checked ??
                true;


            if (
                !title ||
                !date
            ) {

                setMessage(
                    "eventAdminMessage",
                    "TITLE AND DATE ARE REQUIRED.",
                    true
                );

                return;

            }


            const saveButton =
                $("saveEventButton");


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "SAVING...";

            }


            try {

                const payload = {

                    title,

                    event_date:
                        date,

                    description:
                        description ||
                        null,

                    display_order:
                        displayOrder,

                    published

                };


                let result;


                if (editingEventId) {

                    result =
                        await supabaseClient
                            .from("events")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                editingEventId
                            );

                } else {

                    result =
                        await supabaseClient
                            .from("events")
                            .insert(
                                payload
                            );

                }


                if (result.error) {
                    throw result.error;
                }


                setMessage(
                    "eventAdminMessage",
                    "EVENT SAVED."
                );


                await loadAdminEvents();

                await loadDashboardData();


                setTimeout(
                    closeEventAdminModal,
                    500
                );


            } catch (error) {

                console.error(
                    "Event save error:",
                    error
                );


                setMessage(
                    "eventAdminMessage",
                    error.message ||
                    "FAILED TO SAVE EVENT.",
                    true
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
    );


    /* =====================================================
       DELETE EVENT
    ===================================================== */

    async function deleteEvent(
        eventData
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

            await loadDashboardData();


        } catch (error) {

            console.error(
                "Event delete error:",
                error
            );


            alert(
                error.message ||
                "FAILED TO DELETE EVENT."
            );

        }

    }


    /* =====================================================
       GALLERY — ADMIN MODAL
    ===================================================== */

    const galleryAdminModal =
        $("galleryAdminModal");

    const galleryAdminForm =
        $("galleryAdminForm");


    function openGalleryAdminModal(
        galleryData = null
    ) {

        editingGalleryId =
            galleryData?.id ||
            null;


        const title =
            $("galleryModalTitle");


        if (title) {

            title.textContent =
                galleryData
                    ? "EDIT GALLERY ITEM"
                    : "ADD GALLERY ITEM";

        }


        $("adminGalleryImage").value =
            "";

        $("adminGalleryCaption").value =
            galleryData?.caption ||
            "";

        $("adminGalleryOrder").value =
            galleryData?.display_order ??
            0;

        $("adminGalleryPublished").checked =
            galleryData?.published ??
            true;


        setMessage(
            "galleryAdminMessage",
            ""
        );


        galleryAdminModal?.classList.add(
            "active"
        );

        body.classList.add(
            "modal-open"
        );

    }


    function closeGalleryAdminModal() {

        galleryAdminModal?.classList.remove(
            "active"
        );

        body.classList.remove(
            "modal-open"
        );

        editingGalleryId = null;

    }


    $("addGalleryButton")?.addEventListener(
        "click",
        () => {

            openGalleryAdminModal();

        }
    );


    $("closeGalleryAdminModal")
        ?.addEventListener(
            "click",
            closeGalleryAdminModal
        );


    galleryAdminModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                galleryAdminModal
            ) {

                closeGalleryAdminModal();

            }

        }
    );


    /* =====================================================
       IMAGE TO DATA URL
       Used because the current Gallery table
       stores image_url directly.
    ===================================================== */

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


    /* =====================================================
       GALLERY — ADMIN LIST
    ===================================================== */

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
                throw error;
            }


            if (
                !data ||
                data.length === 0
            ) {

                list.innerHTML = `
                    <div class="admin-empty">
                        NO GALLERY ITEMS YET.
                    </div>
                `;

                return;

            }


            list.innerHTML = "";


            data.forEach(
                item => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "admin-gallery-item";


                    card.innerHTML = `
                        <img
                            class="admin-gallery-preview"
                            src="${escapeHTML(item.image_url || "")}"
                            alt="${escapeHTML(item.caption || "Gallery image")}"
                        >

                        <div class="admin-gallery-content">

                            <div class="admin-item-title">
                                ${escapeHTML(
                                    item.caption ||
                                    "UNTITLED IMAGE"
                                )}
                            </div>

                            <div class="admin-item-meta">

                                <span>
                                    ORDER:
                                    ${item.display_order ?? 0}
                                </span>

                                <span>
                                    STATUS:
                                    ${
                                        item.published
                                            ? "PUBLISHED"
                                            : "HIDDEN"
                                    }
                                </span>

                            </div>

                        </div>

                        <div class="admin-item-actions">

                            <button
                                type="button"
                                class="admin-secondary-button"
                                data-action="edit"
                            >
                                EDIT
                            </button>

                            <button
                                type="button"
                                class="admin-danger-button"
                                data-action="delete"
                            >
                                DELETE
                            </button>

                        </div>
                    `;


                    card
                        .querySelector(
                            '[data-action="edit"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                openGalleryAdminModal(
                                    item
                                );

                            }
                        );


                    card
                        .querySelector(
                            '[data-action="delete"]'
                        )
                        ?.addEventListener(
                            "click",
                            () => {

                                deleteGalleryItem(
                                    item
                                );

                            }
                        );


                    list.appendChild(
                        card
                    );

                }
            );


        } catch (error) {

            console.error(
                "Admin gallery error:",
                error
            );


            list.innerHTML = `
                <div class="admin-empty">
                    FAILED TO LOAD GALLERY.
                </div>
            `;

        }

    }


    /* =====================================================
       SAVE GALLERY
    ===================================================== */

    galleryAdminForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !supabaseClient ||
                !isAdmin
            ) {

                return;

            }


            const file =
                $("adminGalleryImage")
                    ?.files?.[0] ||
                null;

            const caption =
                $("adminGalleryCaption")
                    ?.value.trim() ||
                "";

            const displayOrder =
                Number(
                    $("adminGalleryOrder")
                        ?.value
                ) || 0;

            const published =
                $("adminGalleryPublished")
                    ?.checked ??
                true;


            const saveButton =
                $("saveGalleryButton");


            if (
                !editingGalleryId &&
                !file
            ) {

                setMessage(
                    "galleryAdminMessage",
                    "PLEASE SELECT AN IMAGE.",
                    true
                );

                return;

            }


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "SAVING...";

            }


            try {

                let imageUrl = null;


                /*
                    Editing:
                    preserve current image unless
                    a new image is selected.
                */

                if (editingGalleryId) {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("gallery")
                            .select(
                                "image_url"
                            )
                            .eq(
                                "id",
                                editingGalleryId
                            )
                            .single();


                    if (error) {
                        throw error;
                    }


                    imageUrl =
                        data?.image_url ||
                        null;

                }


                if (file) {

                    imageUrl =
                        await fileToDataURL(
                            file
                        );

                }


                if (!imageUrl) {

                    throw new Error(
                        "GALLERY IMAGE IS REQUIRED."
                    );

                }


                const payload = {

                    image_url:
                        imageUrl,

                    caption,

                    display_order:
                        displayOrder,

                    published

                };


                let result;


                if (editingGalleryId) {

                    result =
                        await supabaseClient
                            .from("gallery")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                editingGalleryId
                            );

                } else {

                    result =
                        await supabaseClient
                            .from("gallery")
                            .insert(
                                payload
                            );

                }


                if (result.error) {
                    throw result.error;
                }


                setMessage(
                    "galleryAdminMessage",
                    "GALLERY ITEM SAVED."
                );


                await loadAdminGallery();

                await loadDashboardData();

                await loadPublicGallery();


                setTimeout(
                    closeGalleryAdminModal,
                    500
                );


            } catch (error) {

                console.error(
                    "Gallery save error:",
                    error
                );


                setMessage(
                    "galleryAdminMessage",
                    error.message ||
                    "FAILED TO SAVE GALLERY ITEM.",
                    true
                );

            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "SAVE GALLERY";

                }

            }

        }
    );


    /* =====================================================
       DELETE GALLERY
    ===================================================== */

    async function deleteGalleryItem(
        galleryData
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
                    galleryData.caption ||
                    "this gallery image"
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

            await loadDashboardData();

            await loadPublicGallery();


        } catch (error) {

            console.error(
                "Gallery delete error:",
                error
            );


            alert(
                error.message ||
                "FAILED TO DELETE GALLERY ITEM."
            );

        }

    }


    /* =====================================================
       GALLERY — PUBLIC
    ===================================================== */

    async function loadPublicGallery() {

        const galleryGrid =
            $("publicGalleryGrid");


        if (!galleryGrid) {
            return;
        }


        if (!supabaseClient) {

            galleryGrid.innerHTML = `
                <div class="gallery-empty">
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
                    <div class="gallery-empty">
                        GALLERY COMING SOON.
                    </div>
                `;

                return;

            }


            galleryGrid.innerHTML = "";


            data.forEach(
                item => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "gallery-item";


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        item.image_url ||
                        "";

                    image.alt =
                        item.caption ||
                        "SYNTHENOVA Gallery";

                    image.loading =
                        "lazy";


                    const overlay =
                        document.createElement(
                            "div"
                        );


                    overlay.className =
                        "gallery-overlay";


                    if (item.caption) {

                        const caption =
                            document.createElement(
                                "span"
                            );


                        caption.textContent =
                            item.caption;


                        overlay.appendChild(
                            caption
                        );

                    }


                    card.appendChild(
                        image
                    );

                    card.appendChild(
                        overlay
                    );


                    card.addEventListener(
                        "click",
                        () => {

                            openGalleryPreview(
                                item
                            );

                        }
                    );


                    galleryGrid.appendChild(
                        card
                    );

                }
            );


        } catch (error) {

            console.error(
                "Public gallery error:",
                error
            );


            galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    UNABLE TO LOAD GALLERY.
                </div>
            `;

        }

    }


    /* =====================================================
       GALLERY PREVIEW
    ===================================================== */

    function openGalleryPreview(
        item
    ) {

        if (!item) {
            return;
        }


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
       PUBLIC EVENTS
       
       The existing project does not have a confirmed
       publicEventsGrid ID, so this function supports
       common IDs without breaking the page.
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

            container.innerHTML = `
                <div class="events-empty">
                    EVENTS DATA UNAVAILABLE.
                </div>
            `;

            return;

        }


        container.innerHTML = `
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

                container.innerHTML = `
                    <div class="events-empty">
                        EVENTS WILL BE UPDATED SOON.
                    </div>
                `;

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
                        "event-card";


                    const date =
                        eventData.event_date
                            ? new Date(
                                `${eventData.event_date}T00:00:00`
                            )
                            : null;


                    const formattedDate =
                        date &&
                        !Number.isNaN(
                            date.getTime()
                        )
                            ? date.toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            )
                            : eventData.event_date ||
                              "";


                    card.innerHTML = `
                        ${
                            eventData.poster_url
                                ? `
                                    <div class="event-poster">
                                        <img
                                            src="${escapeHTML(eventData.poster_url)}"
                                            alt="${escapeHTML(eventData.title || "Event")}"
                                            loading="lazy"
                                        >
                                    </div>
                                `
                                : ""
                        }

                        <div class="event-content">

                            <span class="event-date">
                                ${escapeHTML(
                                    formattedDate
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
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                eventData.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

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


            container.innerHTML = `
                <div class="events-empty">
                    UNABLE TO LOAD EVENTS.
                </div>
            `;

        }

    }


    /* =====================================================
       NAV ACTIVE STATE
    ===================================================== */

    const sections =
        document.querySelectorAll(
            "main section[id]"
        );


    const navLinks =
        document.querySelectorAll(
            ".nav-link"
        );


    function updateActiveNav() {

        let current =
            "home";


        sections.forEach(
            section => {

                const rect =
                    section.getBoundingClientRect();


                if (
                    rect.top <= 180 &&
                    rect.bottom >= 180
                ) {

                    current =
                        section.id;

                }

            }
        );


        navLinks.forEach(
            link => {

                link.classList.remove(
                    "active"
                );


                if (
                    link.getAttribute(
                        "href"
                    ) ===
                    `#${current}`
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    window.addEventListener(
        "scroll",
        updateActiveNav,
        {
            passive: true
        }
    );


    /* =====================================================
       AUTH SESSION RESTORE
    ===================================================== */

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


            const session =
                data?.session;


            if (
                !session?.user
            ) {

                currentUser = null;
                isAdmin = false;

                updateAuthUI();

                return;

            }


            currentUser =
                session.user;


            const adminStatus =
                await checkAdmin(
                    currentUser.id
                );


            if (adminStatus) {

                isAdmin = true;

            } else {

                isAdmin = false;

                await supabaseClient
                    .auth
                    .signOut();

                currentUser = null;

            }


            updateAuthUI();


        } catch (error) {

            console.error(
                "Session initialization error:",
                error
            );

        }

    }


    /* =====================================================
       AUTH STATE LISTENER
    ===================================================== */

    function listenForAuthChanges() {

        if (!supabaseClient) {
            return;
        }


        supabaseClient.auth
            .onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    console.log(
                        "AUTH EVENT:",
                        event
                    );


                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        currentUser = null;
                        isAdmin = false;

                        updateAuthUI();

                        return;

                    }


                    if (
                        session?.user
                    ) {

                        currentUser =
                            session.user;


                        const adminStatus =
                            await checkAdmin(
                                currentUser.id
                            );


                        if (adminStatus) {

                            isAdmin = true;

                        } else {

                            isAdmin = false;

                        }


                        updateAuthUI();

                    }

                }
            );

    }


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeSideMenu();

            closeJoinModalFunction();

            closeLoginModalFunction();

            closeTeamProfile();

            closeTeamAdminModal();

            closeEventAdminModal();

            closeGalleryAdminModal();

            closeGalleryPreview();

            closeAdminDashboard();

        }
    );


    /* =====================================================
       INITIALIZE SUPABASE
    ===================================================== */

    const supabaseReady =
        await initializeSupabase();


    if (supabaseReady) {

        await initializeAuth();

        listenForAuthChanges();

        await loadPublicTeam();

        await loadPublicGallery();

        await loadPublicEvents();

    } else {

        console.warn(
            "SYNTHENOVA Supabase is not ready."
        );

    }


    updateAuthUI();

    updateActiveNav();


    /* =====================================================
       DEBUG API
    ===================================================== */

    window.SYNTHENOVA = {

        getSupabase:
            () => supabaseClient,

        getUser:
            () => currentUser,

        isAdmin:
            () => isAdmin,

        openAdmin:
            () => openAdminDashboard(),

        closeAdmin:
            () => closeAdminDashboard(),

        logout:
            () => logoutAdmin(),

        loadTeam:
            () => loadPublicTeam(),

        loadEvents:
            () => loadPublicEvents(),

        loadGallery:
            () => loadPublicGallery(),

        loadAdminTeam:
            () => loadAdminTeam(),

        loadAdminEvents:
            () => loadAdminEvents(),

        loadAdminGallery:
            () => loadAdminGallery(),

        refreshDashboard:
            () => loadDashboardData()

    };


    /* =====================================================
       FINAL STATUS
    ===================================================== */

    console.log(
        "%c SYNTHENOVA ",
        "font-size:18px;font-weight:bold;"
    );

    console.log(
        "SYNTHENOVA frontend initialized."
    );

    console.log(
        "Supabase:",
        supabaseClient
            ? "CONNECTED"
            : "NOT CONNECTED"
    );

    console.log(
        "Admin:",
        isAdmin
            ? "AUTHORIZED"
            : "NOT AUTHORIZED"
    );

});