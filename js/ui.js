```javascript id="n6f8q2"
/* =========================================================
   ADG — UI.JS
   Shared User Interface Utilities
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const adgUIState = {

    modalOpen: false,

    currentModal: null,

    toastTimer: null

};


/* =========================================================
   ELEMENT HELPERS
   ========================================================= */

function ui(
    selector,
    parent = document
) {

    return parent.querySelector(
        selector
    );

}


function uiAll(
    selector,
    parent = document
) {

    return [
        ...parent.querySelectorAll(
            selector
        )
    ];

}


/* =========================================================
   SHOW / HIDE
   ========================================================= */

function showElement(
    element
) {

    if (!element) {
        return;
    }


    element.classList.remove(
        "hidden"
    );


    element.removeAttribute(
        "hidden"
    );

}


function hideElement(
    element
) {

    if (!element) {
        return;
    }


    element.classList.add(
        "hidden"
    );


    element.setAttribute(
        "hidden",
        ""
    );

}


function toggleElement(
    element,
    visible
) {

    if (
        visible
    ) {

        showElement(
            element
        );

    } else {

        hideElement(
            element
        );

    }

}


/* =========================================================
   TEXT
   ========================================================= */

function setText(
    element,
    text
) {

    if (!element) {
        return;
    }


    element.textContent =
        text ?? "";

}


function setHTML(
    element,
    html
) {

    if (!element) {
        return;
    }


    element.innerHTML =
        html ?? "";

}


/* =========================================================
   CLASS HELPERS
   ========================================================= */

function addClass(
    element,
    className
) {

    if (!element) {
        return;
    }


    element.classList.add(
        className
    );

}


function removeClass(
    element,
    className
) {

    if (!element) {
        return;
    }


    element.classList.remove(
        className
    );

}


function toggleClass(
    element,
    className,
    force
) {

    if (!element) {
        return;
    }


    element.classList.toggle(
        className,
        force
    );

}


/* =========================================================
   ATTRIBUTE HELPERS
   ========================================================= */

function setAttribute(
    element,
    name,
    value
) {

    if (!element) {
        return;
    }


    element.setAttribute(
        name,
        value
    );

}


function removeAttribute(
    element,
    name
) {

    if (!element) {
        return;
    }


    element.removeAttribute(
        name
    );

}


/* =========================================================
   DISABLE / ENABLE
   ========================================================= */

function setDisabled(
    element,
    disabled
) {

    if (!element) {
        return;
    }


    element.disabled =
        Boolean(
            disabled
        );


    element.classList.toggle(
        "disabled",
        Boolean(
            disabled
        )
    );

}


/* =========================================================
   LOADING BUTTON
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {
        return;
    }


    if (
        loading
    ) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.textContent =
            loadingText;


        button.disabled =
            true;


        button.classList.add(
            "loading"
        );

    } else {

        button.textContent =
            button.dataset.originalText ||
            button.textContent;


        button.disabled =
            false;


        button.classList.remove(
            "loading"
        );

    }

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "info",
    duration = 3000
) {

    if (
        window.ADG_NOTIFICATIONS
    ) {

        return window.ADG_NOTIFICATIONS.show(
            message,
            type,
            duration
        );

    }


    let toast =
        document.getElementById(
            "adgToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "adgToast";


        toast.className =
            "adg-toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.dataset.type =
        type;


    toast.classList.add(
        "visible"
    );


    clearTimeout(
        adgUIState.toastTimer
    );


    adgUIState.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "visible"
                );

            },
            duration
        );

}


/* =========================================================
   MODAL
   ========================================================= */

function createModal(
    options = {}
) {

    const {

        title =
            "",

        content =
            "",

        confirmText =
            "Confirm",

        cancelText =
            "Cancel",

        showCancel =
            true,

        closeOnBackdrop =
            true,

        onConfirm =
            null,

        onCancel =
            null

    } = options;


    closeModal();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "adg-modal-overlay";


    overlay.setAttribute(
        "role",
        "presentation"
    );


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "adg-modal";


    modal.setAttribute(
        "role",
        "dialog"
    );


    modal.setAttribute(
        "aria-modal",
        "true"
    );


    if (
        title
    ) {

        const heading =
            document.createElement(
                "h2"
            );


        heading.className =
            "adg-modal-title";


        heading.textContent =
            title;


        modal.appendChild(
            heading
        );

    }


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "adg-modal-body";


    if (
        typeof content ===
        "string"
    ) {

        body.textContent =
            content;

    } else if (
        content instanceof
        Node
    ) {

        body.appendChild(
            content
        );

    }


    modal.appendChild(
        body
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "adg-modal-actions";


    if (
        showCancel
    ) {

        const cancel =
            document.createElement(
                "button"
            );


        cancel.type =
            "button";


        cancel.className =
            "adg-modal-cancel";


        cancel.textContent =
            cancelText;


        cancel.addEventListener(
            "click",
            () => {

                closeModal();


                if (
                    typeof onCancel ===
                    "function"
                ) {

                    onCancel();

                }

            }
        );


        actions.appendChild(
            cancel
        );

    }


    const confirm =
        document.createElement(
            "button"
        );


    confirm.type =
        "button";


    confirm.className =
        "adg-modal-confirm";


    confirm.textContent =
        confirmText;


    confirm.addEventListener(
        "click",
        () => {

            let result;


            if (
                typeof onConfirm ===
                "function"
            ) {

                result =
                    onConfirm();

            }


            if (
                result !==
                false
            ) {

                closeModal();

            }

        }
    );


    actions.appendChild(
        confirm
    );


    modal.appendChild(
        actions
    );


    overlay.appendChild(
        modal
    );


    if (
        closeOnBackdrop
    ) {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    closeModal();

                }

            }
        );

    }


    document.body.appendChild(
        overlay
    );


    adgUIState.modalOpen =
        true;


    adgUIState.currentModal =
        overlay;


    document.body.classList.add(
        "modal-open"
    );


    return overlay;

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    if (
        adgUIState.currentModal
    ) {

        adgUIState.currentModal.remove();

    }


    adgUIState.currentModal =
        null;


    adgUIState.modalOpen =
        false;


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   CONFIRM DIALOG
   ========================================================= */

function confirmDialog(
    message,
    onConfirm,
    options = {}
) {

    return createModal(
        {

            title:
                options.title ||
                "Confirm",

            content:
                message,

            confirmText:
                options.confirmText ||
                "Confirm",

            cancelText:
                options.cancelText ||
                "Cancel",

            onConfirm

        }
    );

}


/* =========================================================
   PLAYER NAME
   ========================================================= */

function getPlayerName() {

    if (
        window.ADG_STORAGE
    ) {

        return window.ADG_STORAGE.player.getName();

    }


    try {

        return (
            sessionStorage.getItem(
                "adg_playerName"
            ) ||
            "Player"
        );

    } catch (error) {

        return "Player";

    }

}


/* =========================================================
   MATCH CODE
   ========================================================= */

function getMatchCode() {

    if (
        window.ADG_STORAGE
    ) {

        return window.ADG_STORAGE.match.getCode();

    }


    try {

        return sessionStorage.getItem(
            "adg_matchCode"
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   UPDATE PLAYER UI
   ========================================================= */

function updatePlayerUI() {

    const name =
        getPlayerName();


    uiAll(
        "[data-player-name]"
    )
    .forEach(
        element => {

            setText(
                element,
                name
            );

        }
    );


    const code =
        getMatchCode();


    uiAll(
        "[data-match-code]"
    )
    .forEach(
        element => {

            setText(
                element,
                code ||
                "------"
            );

        }
    );

}


/* =========================================================
   COPY TEXT
   ========================================================= */

async function copyText(
    text
) {

    if (
        !text
    ) {

        return false;

    }


    try {

        await navigator.clipboard.writeText(
            String(
                text
            )
        );


        showToast(
            "Copied!",
            "success"
        );


        return true;

    } catch (error) {

        showToast(
            String(
                text
            ),
            "info"
        );


        return false;

    }

}


/* =========================================================
   COPY MATCH CODE
   ========================================================= */

function copyMatchCode() {

    const code =
        getMatchCode();


    if (
        !code
    ) {

        showToast(
            "No match code available.",
            "error"
        );


        return;

    }


    copyText(
        code
    );

}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape" &&
            adgUIState.modalOpen
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   COPY BUTTONS
   ========================================================= */

function initializeCopyButtons() {

    uiAll(
        "[data-copy]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    copyText(
                        button.dataset.copy
                    );

                }
            );

        }
    );


    uiAll(
        "[data-copy-match]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                copyMatchCode
            );

        }
    );

}


/* =========================================================
   BACK BUTTONS
   ========================================================= */

function initializeBackButtons() {

    uiAll(
        "[data-adg-back]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        window.history.length >
                        1
                    ) {

                        window.history.back();

                    } else {

                        window.location.href =
                            "index.html";

                    }

                }
            );

        }
    );

}


/* =========================================================
   HOME BUTTONS
   ========================================================= */

function initializeHomeButtons() {

    uiAll(
        "[data-adg-home]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "index.html";

                }
            );

        }
    );

}


/* =========================================================
   ANIME TITLE
   ========================================================= */

function updateAnimeTitle() {

    let anime =
        "One Piece";


    if (
        window.ADG_STORAGE
    ) {

        anime =
            window.ADG_STORAGE.match.getAnime() ||
            anime;

    } else {

        try {

            anime =
                sessionStorage.getItem(
                    "adg_anime"
                ) ||
                anime;

        } catch (error) {}

    }


    uiAll(
        "[data-anime-title]"
    )
    .forEach(
        element => {

            setText(
                element,
                anime
            );

        }
    );

}


/* =========================================================
   ONLINE STATUS
   ========================================================= */

function updateOnlineStatus() {

    const online =
        navigator.onLine;


    uiAll(
        "[data-online-status]"
    )
    .forEach(
        element => {

            setText(
                element,
                online
                    ? "🟢 Online"
                    : "🔴 Offline"
            );


            toggleClass(
                element,
                "online",
                online
            );


            toggleClass(
                element,
                "offline",
                !online
            );

        }
    );

}


window.addEventListener(
    "online",
    updateOnlineStatus
);


window.addEventListener(
    "offline",
    updateOnlineStatus
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_UI = {

    state:
        adgUIState,

    query:
        ui,

    queryAll:
        uiAll,

    show:
        showElement,

    hide:
        hideElement,

    toggle:
        toggleElement,

    setText,

    setHTML,

    addClass,

    removeClass,

    toggleClass,

    setAttribute,

    removeAttribute,

    setDisabled,

    setButtonLoading,

    toast:
        showToast,

    modal:
        createModal,

    closeModal,

    confirm:
        confirmDialog,

    copy:
        copyText,

    copyMatchCode,

    updatePlayerUI,

    updateAnimeTitle,

    updateOnlineStatus

};


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeUI() {

    initializeCopyButtons();

    initializeBackButtons();

    initializeHomeButtons();

    updatePlayerUI();

    updateAnimeTitle();

    updateOnlineStatus();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeUI,
        {
            once: true
        }
    );

} else {

    initializeUI();

}


/* =========================================================
   END OF UI.JS
   ========================================================= */
```
