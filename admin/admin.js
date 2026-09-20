"use strict";

/* =========================================================
   SYNTHENOVA ADMIN PANEL
   TEAM PHOTO BUCKET
   IMPORTANT:
   Supabase Storage bucket = "team photo"
========================================================= */

const TEAM_PHOTO_BUCKET = "team photo";

let supabaseClient = null;

let currentTeam = [];

let editingTeamId = null;

let selectedPhotoFile = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await initializeSupabase();

            setupLogin();

            setupLogout();

            setupNavigation();

            setupTeam();

            await checkSession();

        } catch (error) {

            console.error(
                "Initialization error:",
                error
            );

            showLoginMessage(
                getFriendlyError(error),
                true
            );

        }

    }
);


/* =========================================================
   SUPABASE INITIALIZATION
========================================================= */

async function initializeSupabase() {

    const response = await fetch(
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

    const config = await response.json();

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

}


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

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

        showLogin();

        return;

    }

    if (!data.session) {

        showLogin();

        return;

    }

    const isAdmin =
        await verifyAdmin(
            data.session.user.id
        );

    if (!isAdmin) {

        await supabaseClient.auth.signOut();

        showLogin();

        showLoginMessage(
            "This account is not registered as an admin.",
            true
        );

        return;

    }

    showAdmin();

    await loadAllData();

}


/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin(userId) {

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

}


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById(
                        "loginEmail"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;

            const button =
                document.getElementById(
                    "loginButton"
                );

            button.disabled = true;

            button.textContent =
                "SIGNING IN...";

            clearLoginMessage();

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

                if (!data.user) {

                    throw new Error(
                        "Login failed."
                    );

                }

                const isAdmin =
                    await verifyAdmin(
                        data.user.id
                    );

                if (!isAdmin) {

                    await supabaseClient.auth
                        .signOut();

                    throw new Error(
                        "This account is not registered as an admin."
                    );

                }

                showAdmin();

                await loadAllData();

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                showLoginMessage(
                    getFriendlyError(error),
                    true
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "SIGN IN";

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            button.textContent =
                "LOGGING OUT...";

            try {

                await supabaseClient.auth
                    .signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "LOGOUT";

                showLogin();

            }

        }
    );

}


/* =========================================================
   UI VISIBILITY
========================================================= */

function showAdmin() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const adminApp =
        document.getElementById(
            "adminApp"
        );

    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

    }

    if (adminApp) {

        adminApp.classList.remove(
            "hidden"
        );

    }

}


function showLogin() {

    const adminApp =
        document.getElementById(
            "adminApp"
        );

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    if (adminApp) {

        adminApp.classList.add(
            "hidden"
        );

    }

    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "loginMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.classList.toggle(
        "error",
        isError
    );

}


function clearLoginMessage() {

    const element =
        document.getElementById(
            "loginMessage"
        );

    if (!element) {
        return;
    }

    element.textContent = "";

    element.classList.remove(
        "error"
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            "[data-section]"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    switchSection(
                        button.dataset.section
                    );

                }
            );

        }
    );

}


function switchSection(
    section
) {

    document
        .querySelectorAll(
            ".content-section"
        )
        .forEach(
            sectionElement => {

                sectionElement.classList.remove(
                    "active"
                );

            }
        );

    const target =
        document.getElementById(
            section + "Section"
        );

    if (target) {

        target.classList.add(
            "active"
        );

    }

    document
        .querySelectorAll(
            ".sidebar-button, .nav-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    section
                );

            }
        );

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadAllData() {

    await Promise.all([
        loadTeam(),
        updateCounts()
    ]);

}


/* =========================================================
   TEAM SETUP
========================================================= */

function setupTeam() {

    const addButton =
        document.getElementById(
            "addTeamButton"
        );

    const closeButton =
        document.getElementById(
            "closeTeamModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelTeamButton"
        );

    const photoInput =
        document.getElementById(
            "teamPhoto"
        );

    const form =
        document.getElementById(
            "teamForm"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                openTeamModal();

            }
        );

    }

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeTeamModal
        );

    }

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeTeamModal
        );

    }

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            handlePhotoSelect
        );

    }

    if (form) {

        form.addEventListener(
            "submit",
            saveTeam
        );

    }

    const modal =
        document.getElementById(
            "teamModal"
        );

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeTeamModal();

                }

            }
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeTeamModal();

            }

        }
    );

}


/* =========================================================
   LOAD TEAM
========================================================= */

async function loadTeam() {

    const grid =
        document.getElementById(
            "teamGrid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML = `
        <div class="loading">
            Loading team...
        </div>
    `;

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

        grid.innerHTML = `
            <div class="loading">
                Failed to load team.
                <br>
                ${escapeHTML(error.message)}
            </div>
        `;

        return;

    }

    currentTeam =
        data || [];

    renderTeam(
        currentTeam
    );

    const count =
        document.getElementById(
            "teamCount"
        );

    if (count) {

        count.textContent =
            currentTeam.length;

    }

}


/* =========================================================
   RENDER TEAM
========================================================= */

function renderTeam(
    members
) {

    const grid =
        document.getElementById(
            "teamGrid"
        );

    if (!grid) {
        return;
    }

    if (!members.length) {

        grid.innerHTML = `
            <div class="loading">
                No team members yet.
            </div>
        `;

        return;

    }

    grid.innerHTML =
        members
            .map(
                createTeamCard
            )
            .join("");

    grid
        .querySelectorAll(
            "[data-edit-team]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const member =
                            currentTeam.find(
                                item =>
                                    item.id ===
                                    button.dataset.editTeam
                            );

                        if (member) {

                            openTeamModal(
                                member
                            );

                        }

                    }
                );

            }
        );

    grid
        .querySelectorAll(
            "[data-delete-team]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteTeam(
                            button.dataset.deleteTeam
                        );

                    }
                );

            }
        );

}


/* =========================================================
   TEAM CARD
========================================================= */

function createTeamCard(
    member
) {

    const photo =
        member.photo_url
            ?
            `
            <img
                class="team-photo"
                src="${escapeAttribute(
                    member.photo_url
                )}"
                alt="${escapeAttribute(
                    member.name
                )}"
                loading="lazy"
            >
            `
            :
            `
            <div class="team-photo-placeholder">
                NO PHOTO
            </div>
            `;

    const activeText =
        member.active !== false
            ? "ACTIVE"
            : "HIDDEN";

    return `
        <article class="team-card">

            ${photo}

            <div class="team-info">

                <h3>
                    ${escapeHTML(
                        member.name
                    )}
                </h3>

                <div class="team-position">
                    ${escapeHTML(
                        member.position
                    )}
                </div>

                <div class="team-class">
                    ${escapeHTML(
                        member.class_name ||
                        "No class"
                    )}
                </div>

                <div class="team-meta">

                    <span class="team-category">
                        ${escapeHTML(
                            member.category ||
                            "general"
                        )}
                    </span>

                    <span class="team-order">
                        #${Number(
                            member.display_order
                        ) || 0}
                    </span>

                </div>

                <div class="team-meta">

                    <span class="team-category">
                        ${activeText}
                    </span>

                    <span class="team-order">
                        ${
                            member.photo_url
                                ? "PHOTO"
                                : "NO PHOTO"
                        }
                    </span>

                </div>

                <div class="team-actions">

                    <button
                        class="edit-button"
                        data-edit-team="${escapeAttribute(
                            member.id
                        )}"
                        type="button"
                    >
                        EDIT
                    </button>

                    <button
                        class="delete-button"
                        data-delete-team="${escapeAttribute(
                            member.id
                        )}"
                        type="button"
                    >
                        DELETE
                    </button>

                </div>

            </div>

        </article>
    `;

}


/* =========================================================
   OPEN TEAM MODAL
========================================================= */

function openTeamModal(
    member = null
) {

    editingTeamId =
        member?.id ||
        null;

    selectedPhotoFile =
        null;

    const form =
        document.getElementById(
            "teamForm"
        );

    if (form) {

        form.reset();

    }

    const active =
        document.getElementById(
            "teamActive"
        );

    if (active) {

        active.checked =
            true;

    }

    const order =
        document.getElementById(
            "teamOrder"
        );

    if (order) {

        order.value =
            0;

    }

    const id =
        document.getElementById(
            "teamId"
        );

    if (id) {

        id.value =
            member?.id ||
            "";

    }

    const preview =
        document.getElementById(
            "photoPreview"
        );

    if (preview) {

        preview.innerHTML = `
            <span>
                PHOTO
            </span>
        `;

    }

    if (member) {

        document
            .getElementById(
                "teamModalTitle"
            )
            .textContent =
            "Edit Member";

        document
            .getElementById(
                "teamName"
            )
            .value =
            member.name ||
            "";

        document
            .getElementById(
                "teamPosition"
            )
            .value =
            member.position ||
            "";

        document
            .getElementById(
                "teamClass"
            )
            .value =
            member.class_name ||
            "";

        document
            .getElementById(
                "teamCategory"
            )
            .value =
            member.category ||
            "general";

        document
            .getElementById(
                "teamOrder"
            )
            .value =
            Number(
                member.display_order
            ) || 0;

        document
            .getElementById(
                "teamActive"
            )
            .checked =
            member.active !== false;

        if (
            member.photo_url &&
            preview
        ) {

            preview.innerHTML = `
                <img
                    src="${escapeAttribute(
                        member.photo_url
                    )}"
                    alt="Current photo"
                >
            `;

        }

    } else {

        document
            .getElementById(
                "teamModalTitle"
            )
            .textContent =
            "Add Member";

    }

    showTeamFormMessage("");

    const modal =
        document.getElementById(
            "teamModal"
        );

    if (modal) {

        modal.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   CLOSE TEAM MODAL
========================================================= */

function closeTeamModal() {

    const modal =
        document.getElementById(
            "teamModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

    selectedPhotoFile =
        null;

    editingTeamId =
        null;

    const input =
        document.getElementById(
            "teamPhoto"
        );

    if (input) {

        input.value =
            "";

    }

}


/* =========================================================
   PHOTO SELECT
========================================================= */

function handlePhotoSelect(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        event.target.value =
            "";

        showTeamFormMessage(
            "Please select an image file.",
            true
        );

        return;

    }

    if (
        file.size >
        8 * 1024 * 1024
    ) {

        event.target.value =
            "";

        showTeamFormMessage(
            "Image must be smaller than 8 MB.",
            true
        );

        return;

    }

    selectedPhotoFile =
        file;

    const reader =
        new FileReader();

    reader.onload =
        () => {

            const preview =
                document.getElementById(
                    "photoPreview"
                );

            if (preview) {

                preview.innerHTML = `
                    <img
                        src="${reader.result}"
                        alt="Selected photo"
                    >
                `;

            }

        };

    reader.readAsDataURL(
        file
    );

}


/* =========================================================
   SAVE TEAM
========================================================= */

async function saveTeam(
    event
) {

    event.preventDefault();

    const button =
        document.getElementById(
            "saveTeamButton"
        );

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "SAVING...";

    }

    showTeamFormMessage("");

    const wasEditing =
        !!editingTeamId;

    try {

        const name =
            document
                .getElementById(
                    "teamName"
                )
                .value
                .trim();

        const position =
            document
                .getElementById(
                    "teamPosition"
                )
                .value
                .trim();

        const className =
            document
                .getElementById(
                    "teamClass"
                )
                .value
                .trim();

        const category =
            document
                .getElementById(
                    "teamCategory"
                )
                .value;

        const displayOrder =
            Math.max(
                0,
                Number(
                    document
                        .getElementById(
                            "teamOrder"
                        )
                        .value
                ) || 0
            );

        const active =
            document
                .getElementById(
                    "teamActive"
                )
                .checked;

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

        const existingMember =
            editingTeamId
                ?
                currentTeam.find(
                    item =>
                        item.id ===
                        editingTeamId
                )
                :
                null;

        let photoUrl =
            existingMember?.photo_url ||
            null;

        /*
         * Upload new photo first.
         */
        if (selectedPhotoFile) {

            photoUrl =
                await uploadTeamPhoto(
                    selectedPhotoFile
                );

        }

        const payload = {

            name:
                name,

            position:
                position,

            class_name:
                className ||
                null,

            category:
                category,

            display_order:
                displayOrder,

            active:
                active,

            photo_url:
                photoUrl

        };

        /*
         * UPDATE
         */

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

        }

        /*
         * INSERT
         */

        else {

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

        closeTeamModal();

        await loadTeam();

        await updateCounts();

        showTeamMessage(
            wasEditing
                ? "Member updated successfully."
                : "Member added successfully.",
            false
        );

    } catch (error) {

        console.error(
            "Save team error:",
            error
        );

        showTeamFormMessage(
            getFriendlyError(error),
            true
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "SAVE MEMBER";

        }

    }

}


/* =========================================================
   UPLOAD TEAM PHOTO

   BUCKET:
   "team photo"
========================================================= */

async function uploadTeamPhoto(
    file
) {

    if (!file) {

        throw new Error(
            "No photo selected."
        );

    }

    const extension =
        getFileExtension(
            file.name
        );

    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `team/${fileName}`;

    console.log(
        "Uploading team photo:",
        {
            bucket:
                TEAM_PHOTO_BUCKET,

            path:
                filePath
        }
    );

    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                TEAM_PHOTO_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );

    if (error) {

        console.error(
            "Storage upload error:",
            error
        );

        throw new Error(
            `Photo upload failed: ${error.message}`
        );

    }

    const {
        data
    } =
        supabaseClient
            .storage
            .from(
                TEAM_PHOTO_BUCKET
            )
            .getPublicUrl(
                filePath
            );

    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Photo uploaded, but public URL could not be generated."
        );

    }

    console.log(
        "Team photo URL:",
        data.publicUrl
    );

    return data.publicUrl;

}


/* =========================================================
   DELETE TEAM
========================================================= */

async function deleteTeam(
    id
) {

    const member =
        currentTeam.find(
            item =>
                item.id ===
                id
        );

    if (!member) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete ${member.name} from the team?`
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
                    id
                );

        if (error) {
            throw error;
        }

        await deleteTeamPhoto(
            member.photo_url
        );

        await loadTeam();

        await updateCounts();

        showTeamMessage(
            "Member deleted successfully.",
            false
        );

    } catch (error) {

        console.error(
            "Delete team error:",
            error
        );

        showTeamMessage(
            getFriendlyError(error),
            true
        );

    }

}


/* =========================================================
   DELETE PHOTO
   BUCKET:
   "team photo"
========================================================= */

async function deleteTeamPhoto(
    photoUrl
) {

    if (!photoUrl) {
        return;
    }

    try {

        const encodedMarker =
            "/storage/v1/object/public/team%20photo/";

        const decodedMarker =
            "/storage/v1/object/public/team photo/";

        let filePath =
            null;

        if (
            photoUrl.includes(
                encodedMarker
            )
        ) {

            filePath =
                decodeURIComponent(
                    photoUrl.split(
                        encodedMarker
                    )[1]
                );

        } else if (
            photoUrl.includes(
                decodedMarker
            )
        ) {

            filePath =
                photoUrl.split(
                    decodedMarker
                )[1];

        }

        if (!filePath) {

            console.warn(
                "Could not determine storage file path."
            );

            return;

        }

        const {
            error
        } =
            await supabaseClient
                .storage
                .from(
                    TEAM_PHOTO_BUCKET
                )
                .remove([
                    filePath
                ]);

        if (error) {

            console.warn(
                "Could not delete old photo:",
                error
            );

        }

    } catch (error) {

        console.warn(
            "Photo cleanup error:",
            error
        );

    }

}


/* =========================================================
   COUNTS
========================================================= */

async function updateCounts() {

    try {

        const [
            teamResult,
            eventResult,
            galleryResult
        ] =
            await Promise.all([

                supabaseClient
                    .from(
                        "team_members"
                    )
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    ),

                supabaseClient
                    .from(
                        "events"
                    )
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    ),

                supabaseClient
                    .from(
                        "gallery"
                    )
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )

            ]);

        const teamCount =
            document.getElementById(
                "teamCount"
            );

        const eventCount =
            document.getElementById(
                "eventCount"
            );

        const galleryCount =
            document.getElementById(
                "galleryCount"
            );

        if (teamCount) {

            teamCount.textContent =
                teamResult.count ||
                0;

        }

        if (eventCount) {

            eventCount.textContent =
                eventResult.count ||
                0;

        }

        if (galleryCount) {

            galleryCount.textContent =
                galleryResult.count ||
                0;

        }

    } catch (error) {

        console.error(
            "Count update error:",
            error
        );

    }

}


/* =========================================================
   TEAM MESSAGE
========================================================= */

function showTeamMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "teamMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.classList.toggle(
        "error",
        isError
    );

    element.classList.toggle(
        "success",
        !isError &&
        !!message
    );

    if (message) {

        setTimeout(
            () => {

                element.textContent =
                    "";

                element.classList.remove(
                    "success",
                    "error"
                );

            },
            4000
        );

    }

}


/* =========================================================
   TEAM FORM MESSAGE
========================================================= */

function showTeamFormMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "teamFormMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

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


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
    fileName
) {

    const parts =
        fileName
            .split(".")
            .filter(Boolean);

    if (!parts.length) {

        return "jpg";

    }

    const extension =
        parts[
            parts.length - 1
        ]
            .toLowerCase();

    const allowed = [
        "jpg",
        "jpeg",
        "png",
        "webp"
    ];

    if (
        !allowed.includes(
            extension
        )
    ) {

        return "jpg";

    }

    return extension;

}


/* =========================================================
   FRIENDLY ERROR
========================================================= */

function getFriendlyError(
    error
) {

    if (!error) {

        return (
            "Something went wrong."
        );

    }

    const message =
        error.message ||
        String(error);

    const lower =
        message.toLowerCase();

    if (
        lower.includes(
            "row-level security"
        )
    ) {

        return (
            "Permission denied by Supabase. " +
            "Check the team_members RLS policy."
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
            'Storage permission error. ' +
            'Make sure the "team photo" bucket ' +
            'has the correct Storage policies.'
        );

    }

    if (
        lower.includes(
            "duplicate"
        )
    ) {

        return (
            "This record already exists."
        );

    }

    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Incorrect email or password."
        );

    }

    return message;

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ??
        "";

    return div.innerHTML;

}


/* =========================================================
   ATTRIBUTE ESCAPING
========================================================= */

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