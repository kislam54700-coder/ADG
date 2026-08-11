```javascript
/* =========================================================
   ADG — NOTIFICATIONS.JS
   In-Game Notification Controller
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_NOTIFICATION_CONFIG = {

    duration: 3500,

    maxVisible: 4

};


/* =========================================================
   STATE
   ========================================================= */

const notificationState = {

    notifications: [],

    nextId: 1

};


/* =========================================================
   CONTAINER
   ========================================================= */

function getNotificationContainer() {

    let container =
        document.getElementById(
            "adgNotificationContainer"
        );


    if (
        container
    ) {

        return container;

    }


    container =
        document.createElement(
            "div"
        );


    container.id =
        "adgNotificationContainer";


    container.className =
        "adg-notification-container";


    container.setAttribute(
        "aria-live",
        "polite"
    );


    container.setAttribute(
        "aria-atomic",
        "false"
    );


    document.body.appendChild(
        container
    );


    return container;

}


/* =========================================================
   SHOW NOTIFICATION
   ========================================================= */

function showNotification(
    message,
    type = "info",
    duration =
        ADG_NOTIFICATION_CONFIG.duration
) {

    if (
        !message
    ) {

        return null;

    }


    const id =
        notificationState.nextId++;


    const notification = {

        id,

        message:
            String(
                message
            ),

        type,

        createdAt:
            Date.now()

    };


    notificationState.notifications.push(
        notification
    );


    renderNotification(
        notification
    );


    limitVisibleNotifications();


    if (
        duration >
        0
    ) {

        notification.timeout =
            setTimeout(
                () => {

                    removeNotification(
                        id
                    );

                },
                duration
            );

    }


    return id;

}


/* =========================================================
   RENDER
   ========================================================= */

function renderNotification(
    notification
) {

    const container =
        getNotificationContainer();


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "adg-notification";


    element.classList.add(
        `notification-${normalizeType(
            notification.type
        )}`
    );


    element.dataset.notificationId =
        notification.id;


    element.setAttribute(
        "role",
        "status"
    );


    const icon =
        document.createElement(
            "span"
        );


    icon.className =
        "notification-icon";


    icon.textContent =
        getNotificationIcon(
            notification.type
        );


    element.appendChild(
        icon
    );


    const content =
        document.createElement(
            "span"
        );


    content.className =
        "notification-message";


    content.textContent =
        notification.message;


    element.appendChild(
        content
    );


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.type =
        "button";


    closeButton.className =
        "notification-close";


    closeButton.setAttribute(
        "aria-label",
        "Close notification"
    );


    closeButton.textContent =
        "×";


    closeButton.addEventListener(
        "click",
        () => {

            removeNotification(
                notification.id
            );

        }
    );


    element.appendChild(
        closeButton
    );


    container.appendChild(
        element
    );


    requestAnimationFrame(
        () => {

            element.classList.add(
                "visible"
            );

        }
    );

}


/* =========================================================
   NORMALIZE TYPE
   ========================================================= */

function normalizeType(
    type
) {

    const allowed = [

        "info",

        "success",

        "warning",

        "error",

        "battle",

        "draft"

    ];


    const normalized =
        String(
            type ||
            "info"
        )
        .toLowerCase();


    return allowed.includes(
        normalized
    )
        ? normalized
        : "info";

}


/* =========================================================
   ICON
   ========================================================= */

function getNotificationIcon(
    type
) {

    switch (
        normalizeType(
            type
        )
    ) {

        case "success":
            return "✓";

        case "warning":
            return "⚠";

        case "error":
            return "✕";

        case "battle":
            return "⚔";

        case "draft":
            return "🎴";

        default:
            return "ℹ";

    }

}


/* =========================================================
   REMOVE
   ========================================================= */

function removeNotification(
    id
) {

    const index =
        notificationState.notifications.findIndex(
            notification =>
                notification.id ===
                id
        );


    if (
        index ===
        -1
    ) {

        return;

    }


    const notification =
        notificationState.notifications[
            index
        ];


    if (
        notification.timeout
    ) {

        clearTimeout(
            notification.timeout
        );

    }


    notificationState.notifications.splice(
        index,
        1
    );


    const element =
        document.querySelector(
            `[data-notification-id="${id}"]`
        );


    if (
        !element
    ) {

        return;

    }


    element.classList.remove(
        "visible"
    );


    setTimeout(
        () => {

            element.remove();

        },
        250
    );

}


/* =========================================================
   CLEAR ALL
   ========================================================= */

function clearNotifications() {

    [
        ...notificationState.notifications
    ]
    .forEach(
        notification => {

            removeNotification(
                notification.id
            );

        }
    );

}


/* =========================================================
   LIMIT VISIBLE
   ========================================================= */

function limitVisibleNotifications() {

    const maximum =
        ADG_NOTIFICATION_CONFIG.maxVisible;


    while (
        notificationState.notifications.length >
        maximum
    ) {

        const oldest =
            notificationState.notifications.shift();


        if (
            !oldest
        ) {

            break;

        }


        if (
            oldest.timeout
        ) {

            clearTimeout(
                oldest.timeout
            );

        }


        const element =
            document.querySelector(
                `[data-notification-id="${oldest.id}"]`
            );


        if (
            element
        ) {

            element.remove();

        }

    }

}


/* =========================================================
   QUICK METHODS
   ========================================================= */

function notifyInfo(
    message
) {

    return showNotification(
        message,
        "info"
    );

}


function notifySuccess(
    message
) {

    return showNotification(
        message,
        "success"
    );

}


function notifyWarning(
    message
) {

    return showNotification(
        message,
        "warning"
    );

}


function notifyError(
    message
) {

    return showNotification(
        message,
        "error"
    );

}


function notifyBattle(
    message
) {

    return showNotification(
        message,
        "battle"
    );

}


function notifyDraft(
    message
) {

    return showNotification(
        message,
        "draft"
    );

}


/* =========================================================
   ADG APPLICATION EVENTS
   ========================================================= */

document.addEventListener(
    "adg:notification",
    event => {

        const detail =
            event.detail ||
            {};


        showNotification(
            detail.message,
            detail.type ||
                "info",
            detail.duration ??
                ADG_NOTIFICATION_CONFIG.duration
        );

    }
);


/* =========================================================
   SOCKET EVENTS
   ========================================================= */

function initializeNotificationSocket() {

    const socket =
        window.ADG_APP?.socket?.();


    if (
        !socket
    ) {

        return;

    }


    socket.on(
        "notification",
        data => {

            if (
                !data
            ) {

                return;

            }


            showNotification(
                data.message,
                data.type ||
                    "info",
                data.duration ??
                    ADG_NOTIFICATION_CONFIG.duration
            );

        }
    );


    socket.on(
        "match:notification",
        data => {

            if (
                data?.message
            ) {

                showNotification(
                    data.message,
                    data.type ||
                        "info"
                );

            }

        }
    );


    socket.on(
        "draft:notification",
        data => {

            if (
                data?.message
            ) {

                notifyDraft(
                    data.message
                );

            }

        }
    );


    socket.on(
        "battle:notification",
        data => {

            if (
                data?.message
            ) {

                notifyBattle(
                    data.message
                );

            }

        }
    );

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_NOTIFICATIONS = {

    show:
        showNotification,

    info:
        notifyInfo,

    success:
        notifySuccess,

    warning:
        notifyWarning,

    error:
        notifyError,

    battle:
        notifyBattle,

    draft:
        notifyDraft,

    remove:
        removeNotification,

    clear:
        clearNotifications,

    state:
        notificationState

};


/* =========================================================
   INITIALIZE
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeNotificationSocket,
        {
            once: true
        }
    );

} else {

    initializeNotificationSocket();

}


/* =========================================================
   END OF NOTIFICATIONS.JS
   ========================================================= */
```
