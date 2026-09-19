/* =====================================================
   SYNTHENOVA - MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   PAGE LOADER
===================================================== */

window.addEventListener("load", () => {

    const loader = document.getElementById("pageLoader");

    if (loader) {

        setTimeout(() => {
            loader.classList.add("hide");
        }, 800);

    }

});



/* =====================================================
   SIDE MENU
===================================================== */

const menuButton =
    document.getElementById("menuButton");

const closeMenuButton =
    document.getElementById("closeMenu");

const sideMenu =
    document.getElementById("sideMenu");

const menuOverlay =
    document.getElementById("menuOverlay");


function openMenu() {

    if (!sideMenu || !menuOverlay) return;

    sideMenu.classList.add("active");

    menuOverlay.classList.add("active");

    document.body.classList.add("menu-open");

}


function closeSideMenu() {

    if (!sideMenu || !menuOverlay) return;

    sideMenu.classList.remove("active");

    menuOverlay.classList.remove("active");

    document.body.classList.remove("menu-open");

}


if (menuButton) {

    menuButton.addEventListener(
        "click",
        openMenu
    );

}


if (closeMenuButton) {

    closeMenuButton.addEventListener(
        "click",
        closeSideMenu
    );

}


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        closeSideMenu
    );

}


/* Close menu when navigation is clicked */

document
    .querySelectorAll(".menu-navigation a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeSideMenu
        );

    });



/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeSideMenu();

        closeJoinModal();

    }

});



/* =====================================================
   JOIN COMMUNITY MODAL
===================================================== */

const joinCommunity =
    document.getElementById("joinCommunity");

const joinModal =
    document.getElementById("joinModal");

const closeJoinModalButton =
    document.getElementById("closeJoinModal");

const joinForm =
    document.getElementById("joinForm");

const formMessage =
    document.getElementById("formMessage");


function openJoinModal() {

    if (!joinModal) return;

    joinModal.classList.add("active");

    document.body.classList.add("menu-open");

}


function closeJoinModal() {

    if (!joinModal) return;

    joinModal.classList.remove("active");

    document.body.classList.remove("menu-open");

}


if (joinCommunity) {

    joinCommunity.addEventListener(
        "click",
        openJoinModal
    );

}


if (closeJoinModalButton) {

    closeJoinModalButton.addEventListener(
        "click",
        closeJoinModal
    );

}


/* Click outside popup */

if (joinModal) {

    joinModal.addEventListener(
        "click",
        event => {

            if (event.target === joinModal) {

                closeJoinModal();

            }

        }
    );

}



/* =====================================================
   JOIN COMMUNITY → WHATSAPP
===================================================== */

if (joinForm) {

    joinForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document
                    .getElementById("memberName")
                    .value
                    .trim();


            const department =
                document
                    .getElementById("department")
                    .value;


            if (!name || !department) {

                if (formMessage) {

                    formMessage.textContent =
                        "Please enter your name and department.";

                }

                return;

            }


            if (formMessage) {

                formMessage.textContent =
                    "Details accepted. Redirecting...";

            }


            const whatsappLink =
                "https://chat.whatsapp.com/By96SMw1a56GRiAwx9b574?s=sw&p=a&mlu=4&ilr=4";


            setTimeout(() => {

                window.location.href =
                    whatsappLink;

            }, 700);

        }
    );

}



/* =====================================================
   SCROLL REVEAL
===================================================== */

const sections =
    document.querySelectorAll(
        ".section:not(.hero)"
    );


const sectionObserver =
    new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add(
                        "visible"
                    );

                }

            });

        },

        {
            threshold: 0.12
        }

    );


sections.forEach(section => {

    sectionObserver.observe(section);

});



/* =====================================================
   DIGITAL HUMAN
   MOUSE MOVEMENT + SCROLL MOVEMENT
===================================================== */

const heroVisual =
    document.querySelector(".hero-visual");

const humanCard =
    document.querySelector(".human-card");


let mouseX = 0;

let mouseY = 0;

let scrollY = 0;

let currentX = 0;

let currentY = 0;



/* -----------------------------------------------------
   Mouse position
----------------------------------------------------- */

document.addEventListener(
    "mousemove",
    event => {

        mouseX =
            (event.clientX / window.innerWidth) - 0.5;


        mouseY =
            (event.clientY / window.innerHeight) - 0.5;

    }
);



/* -----------------------------------------------------
   Scroll position
----------------------------------------------------- */

window.addEventListener(
    "scroll",
    () => {

        scrollY = window.scrollY;

    },
    {
        passive: true
    }
);



/* -----------------------------------------------------
   Smooth Digital Human Animation
----------------------------------------------------- */

function animateDigitalHuman() {

    if (heroVisual) {

        /*
         * Smooth mouse movement
         */

        const targetX =
            mouseX * 8;


        const targetY =
            mouseY * -5;


        currentX +=
            (targetX - currentX) * 0.06;


        currentY +=
            (targetY - currentY) * 0.06;



        /*
         * Scroll movement
         *
         * At the top:
         *      normal position
         *
         * As user scrolls:
         *      human moves upward
         */

        const scrollAmount =
            Math.min(
                scrollY * 0.55,
                480
            );


        /*
         * Fade slightly near the bottom
         * of the hero
         */

        const heroHeight =
            window.innerHeight;


        let opacity = 1;


        if (scrollY > heroHeight * 0.55) {

            opacity =
                1 -
                (
                    (scrollY - heroHeight * 0.55)
                    /
                    (heroHeight * 0.7)
                );

        }


        opacity =
            Math.max(
                0,
                Math.min(1, opacity)
            );



        /*
         * Apply movement to the WHOLE visual
         *
         * This keeps the original human-card
         * rotation intact.
         */

        heroVisual.style.transform =
            `
            translate3d(
                ${currentX}px,
                calc(-50% - ${scrollAmount}px + ${currentY}px),
                0
            )
            `;


        heroVisual.style.opacity =
            opacity;

    }


    requestAnimationFrame(
        animateDigitalHuman
    );

}


animateDigitalHuman();



/* =====================================================
   EYE TRACKING
===================================================== */

const pupils =
    document.querySelectorAll(".eye-pupil");


document.addEventListener(
    "mousemove",
    event => {

        const x =
            (event.clientX / window.innerWidth) - 0.5;


        const movement =
            x * 14;


        pupils.forEach(pupil => {

            pupil.style.transform =
                `translateX(${movement}px)`;

        });

    }
);



/* =====================================================
   DIGITAL HUMAN PARALLAX ON MOBILE
===================================================== */

window.addEventListener(
    "resize",
    () => {

        /*
         * Keep animation stable when
         * screen size changes.
         */

        if (!heroVisual) return;

        if (window.innerWidth < 600) {

            heroVisual.style.width = "84%";

        }

    }
);