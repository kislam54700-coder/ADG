/* =========================================================
   ADG — ROLES.JS
   Face to Face — Private Role Assignment Client
   ========================================================= */

"use strict";


/* =========================================================
   CONSTANTS
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";


const ADG_ANIME_NAME =
    "Face to Face";


const ADG_ROLES = [
    "Captain",
    "Vice Captain",
    "Tank",
    "Healer",
    "Support",
    "Traitor"
];


/* =========================================================
   SOCKET
   ========================================================= */

const rolesSocket = io(
    ADG_SERVER_URL,
    {
        transports: [
            "websocket",
            "polling"
        ],

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000
    }
);


/* =========================================================
   STATE
   ========================================================= */

const rolesState = {

    matchId:
        null,

    playerNumber:
        null,

    playerName:
        "",

    anime:
        ADG_ANIME_NAME,

    team:
        [],

    roles:
        {},

    connected:
        false,

    complete:
        false
};


/* =========================================================
   SESSION HELPERS
   ========================================================= */

function getSession(key) {

    try {

        return sessionStorage.getItem(key);

    } catch (error) {

        console.warn(
            "Session read error:",
            error
        );

        return null;
    }
}


function setSession(key, value) {

    try {

        sessionStorage.setItem(
            key,
            String(value)
        );

    } catch (error) {

        console.warn(
            "Session write error:",
            error
        );
    }
}


/* =========================================================
   RESTORE SESSION
   ========================================================= */

rolesState.matchId =
    getSession("adg_matchId");


rolesState.playerNumber =
    Number(
        getSession("adg_playerNumber")
    );


rolesState.playerName =
    getSession("adg_playerName") ||
    "";


/*
 * IMPORTANT:
 *
 * ADG no longer has anime selection.
 *
 * The game is always:
 *
 * FACE TO FACE
 */

rolesState.anime =
    ADG_ANIME_NAME;


setSession(
    "adg_anime",
    ADG_ANIME_NAME
);


/* =========================================================
   DOM
   ========================================================= */

const animeTitle =
    document.getElementById(
        "animeTitle"
    );


const matchCode =
    document.getElementById(
        "matchCode"
    );


const copyMatchCodeButton =
    document.getElementById(
        "copyMatchCodeButton"
    );


const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );


const roleProgress =
    document.getElementById(
        "roleProgress"
    );


const roleInstruction =
    document.getElementById(
        "roleInstruction"
    );


const rolesTeam =
    document.getElementById(
        "rolesTeam"
    );


const continueButton =
    document.getElementById(
        "continueButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const rolesStatus =
    document.getElementById(
        "rolesStatus"
    );


const globalMessage =
    document.getElementById(
        "adgMessage"
    );


/* =========================================================
   INITIAL UI
   ========================================================= */

if (animeTitle) {

    animeTitle.textContent =
        ADG_ANIME_NAME;
}


showMatchCode();


renderTeam();

updateProgress();

updateConnectionUI(
    false
);


/* =========================================================
   MATCH CODE
   ========================================================= */

function showMatchCode() {

    if (!matchCode) {
        return;
    }


    if (rolesState.matchId) {

        matchCode.textContent =
            rolesState.matchId;

    } else {

        matchCode.textContent =
            "Unavailable";
    }
}


/* =========================================================
   COPY MATCH CODE
   ========================================================= */

if (copyMatchCodeButton) {

    copyMatchCodeButton.addEventListener(
        "click",
        async () => {

            if (!rolesState.matchId) {

                showMessage(
                    "Match code is unavailable.",
                    "error"
                );

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    rolesState.matchId
                );


                showMessage(
                    "Match code copied.",
                    "success"
                );

            } catch (error) {

                showMessage(
                    "Could not copy match code.",
                    "error"
                );
            }
        }
    );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = ""
) {

    const element =
        globalMessage ||
        rolesStatus;


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden",
        "success",
        "warning",
        "error",
        "info"
    );


    if (type) {

        element.classList.add(
            type
        );
    }


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                element.classList.add(
                    "hidden"
                );

            },
            4000
        );
}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnectionUI(
    connected
) {

    rolesState.connected =
        connected;


    if (!connectionStatus) {
        return;
    }


    connectionStatus.classList.remove(
        "connected",
        "disconnected"
    );


    if (connected) {

        connectionStatus.textContent =
            "Connected";

        connectionStatus.classList.add(
            "connected"
        );

    } else {

        connectionStatus.textContent =
            "Connecting...";

        connectionStatus.classList.add(
            "disconnected"
        );
    }
}


/* =========================================================
   SOCKET CONNECT
   ========================================================= */

rolesSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );


        showMatchCode();


        /*
         * Reconnect to the existing match.
         *
         * Match ID is taken from sessionStorage.
         */

        if (!rolesState.matchId) {

            updateConnectionUI(
                true
            );


            showMessage(
                "Match code is missing.",
                "error"
            );

            return;
        }


        rolesSocket.emit(
            "match:reconnect",
            {
                matchId:
                    rolesState.matchId
            }
        );
    }
);


/* =========================================================
   SOCKET RECONNECTING
   ========================================================= */

rolesSocket.io.on(
    "reconnect_attempt",
    () => {

        if (connectionStatus) {

            connectionStatus.textContent =
                "Reconnecting...";
        }
    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

rolesSocket.on(
    "disconnect",
    () => {

        updateConnectionUI(
            false
        );


        showMessage(
            "Connection lost. Reconnecting...",
            "error"
        );
    }
);


/* =========================================================
   SERVER — MATCH RECONNECTED
   ========================================================= */

rolesSocket.on(
    "match:reconnected",
    data => {

        if (!data) {
            return;
        }


        if (data.matchId) {

            rolesState.matchId =
                data.matchId;

            setSession(
                "adg_matchId",
                data.matchId
            );
        }


        if (data.playerNumber) {

            rolesState.playerNumber =
                Number(
                    data.playerNumber
                );

            setSession(
                "adg_playerNumber",
                String(
                    data.playerNumber
                )
            );
        }


        if (Array.isArray(data.team)) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );
        }


        if (data.roles) {

            rolesState.roles =
                normalizeRoles(
                    data.roles
                );
        }


        showMatchCode();

        renderTeam();

        updateProgress();
    }
);


/* =========================================================
   SERVER — ROLES STATE
   ========================================================= */

rolesSocket.on(
    "roles:state",
    data => {

        if (!data) {
            return;
        }


        if (data.matchId) {

            rolesState.matchId =
                data.matchId;

            setSession(
                "adg_matchId",
                data.matchId
            );
        }


        if (data.playerNumber) {

            rolesState.playerNumber =
                Number(
                    data.playerNumber
                );

            setSession(
                "adg_playerNumber",
                String(
                    data.playerNumber
                )
            );
        }


        if (Array.isArray(data.team)) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );
        }


        if (data.roles) {

            rolesState.roles =
                normalizeRoles(
                    data.roles
                );
        }


        if (
            typeof data.complete ===
            "boolean"
        ) {

            rolesState.complete =
                data.complete;
        }


        showMatchCode();

        renderTeam();

        updateProgress();
    }
);


/* =========================================================
   SERVER — MATCH ROLES
   ========================================================= */

rolesSocket.on(
    "match:roles",
    data => {

        if (!data) {
            return;
        }


        if (data.matchId) {

            rolesState.matchId =
                data.matchId;

            setSession(
                "adg_matchId",
                data.matchId
            );
        }


        if (Array.isArray(data.team)) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );
        }


        if (data.roles) {

            rolesState.roles =
                normalizeRoles(
                    data.roles
                );
        }


        showMatchCode();

        renderTeam();

        updateProgress();
    }
);


/* =========================================================
   SERVER — ROLE ASSIGNED
   ========================================================= */

rolesSocket.on(
    "roles:assigned",
    data => {

        if (!data) {
            return;
        }


        if (data.roles) {

            rolesState.roles =
                normalizeRoles(
                    data.roles
                );
        }


        if (Array.isArray(data.team)) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );
        }


        renderTeam();

        updateProgress();
    }
);


/* =========================================================
   SERVER — ROLES COMPLETE
   ========================================================= */

rolesSocket.on(
    "roles:complete",
    data => {

        rolesState.complete =
            true;


        if (data?.roles) {

            rolesState.roles =
                normalizeRoles(
                    data.roles
                );
        }


        if (Array.isArray(data?.team)) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );
        }


        renderTeam();

        updateProgress();


        showMessage(
            "Roles complete. Preparing Battle Arena...",
            "success"
        );


        /*
         * Give the server a moment to update
         * both players before moving.
         */

        setTimeout(
            () => {

                window.location.href =
                    "game.html";

            },
            700
        );
    }
);


/* =========================================================
   SERVER — ROLE ERROR
   ========================================================= */

rolesSocket.on(
    "roles:error",
    data => {

        showMessage(
            data?.message ||
            "Role assignment failed.",
            "error"
        );
    }
);


/* =========================================================
   SERVER — MATCH ERROR
   ========================================================= */

rolesSocket.on(
    "match:error",
    data => {

        showMessage(
            data?.message ||
            "Match error.",
            "error"
        );
    }
);


/* =========================================================
   NORMALIZE TEAM
   ========================================================= */

function normalizeTeam(
    team
) {

    if (!Array.isArray(team)) {
        return [];
    }


    return team.map(
        character => {

            if (
                typeof character ===
                "string"
            ) {

                return {
                    name:
                        character
                };
            }


            return {
                ...character
            };
        }
    );
}


/* =========================================================
   NORMALIZE ROLES
   ========================================================= */

function normalizeRoles(
    roles
) {

    if (!roles) {
        return {};
    }


    /*
     * Object format:
     *
     * {
     *     "Luffy": "Captain",
     *     "Zoro": "Tank"
     * }
     */


    if (
        typeof roles ===
        "object" &&
        !Array.isArray(roles)
    ) {

        return {
            ...roles
        };
    }


    return {};
}


/* =========================================================
   RENDER TEAM
   ========================================================= */

function renderTeam() {

    if (!rolesTeam) {
        return;
    }


    rolesTeam.innerHTML =
        "";


    if (
        rolesState.team.length ===
        0
    ) {

        rolesTeam.innerHTML = `
            <div class="draft-team-slot empty">
                <div class="draft-slot-question">
                    ?
                </div>

                <span>
                    Waiting for team...
                </span>
            </div>
        `;

        return;
    }


    rolesState.team.forEach(
        (
            character,
            index
        ) => {

            rolesTeam.appendChild(
                createRoleCard(
                    character,
                    index
                )
            );
        }
    );
}


/* =========================================================
   CREATE ROLE CARD
   ========================================================= */

function createRoleCard(
    character,
    index
) {

    const name =
        typeof character ===
        "string"
            ? character
            : character?.name ||
              "Unknown";


    const currentRole =
        rolesState.roles[name] ||
        "";


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "draft-team-slot filled";


    card.dataset.character =
        name;


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "draft-slot-number";


    number.textContent =
        String(index + 1);


    const content =
        document.createElement(
            "div"
        );


    content.style.width =
        "100%";


    const nameElement =
        document.createElement(
            "strong"
        );


    nameElement.textContent =
        name;


    nameElement.style.display =
        "block";


    nameElement.style.marginBottom =
        "10px";


    content.appendChild(
        nameElement
    );


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "role-select";


    select.dataset.character =
        name;


    const emptyOption =
        document.createElement(
            "option"
        );


    emptyOption.value =
        "";


    emptyOption.textContent =
        "Select Role";


    select.appendChild(
        emptyOption
    );


    ADG_ROLES.forEach(
        role => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                role;


            option.textContent =
                role;


            if (
                role ===
                currentRole
            ) {

                option.selected =
                    true;
            }


            select.appendChild(
                option
            );
        }
    );


    select.addEventListener(
        "change",
        () => {

            assignRole(
                name,
                select.value
            );
        }
    );


    content.appendChild(
        select
    );


    card.appendChild(
        number
    );


    card.appendChild(
        content
    );


    return card;
}


/* =========================================================
   ASSIGN ROLE
   ========================================================= */

function assignRole(
    character,
    role
) {

    if (!role) {
        return;
    }


    /*
     * Prevent duplicate roles locally.
     */

    for (
        const [
            existingCharacter,
            existingRole
        ] of Object.entries(
            rolesState.roles
        )
    ) {

        if (
            existingCharacter !==
                character &&
            existingRole ===
                role
        ) {

            showMessage(
                `${role} is already assigned.`,
                "warning"
            );


            renderTeam();

            return;
        }
    }


    rolesState.roles[
        character
    ] = role;


    renderTeam();

    updateProgress();


    rolesSocket.emit(
        "roles:assign",
        {
            matchId:
                rolesState.matchId,

            character:
                character,

            role:
                role
        }
    );
}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateProgress() {

    const assigned =
        Object.keys(
            rolesState.roles
        ).filter(
            character =>
                rolesState.roles[
                    character
                ]
        ).length;


    if (roleProgress) {

        roleProgress.textContent =
            `${assigned} / 6 Roles Assigned`;


        roleProgress.className =
            assigned === 6
                ? "draft-turn your-turn"
                : "draft-turn waiting";
    }


    const allAssigned =
        rolesState.team.length === 6 &&
        assigned === 6;


    if (continueButton) {

        continueButton.disabled =
            !allAssigned;
    }


    if (roleInstruction) {

        if (allAssigned) {

            roleInstruction.textContent =
                "✓ All six roles assigned. You can continue.";

        } else {

            roleInstruction.textContent =
                "Assign all six unique roles to continue.";
        }
    }
}


/* =========================================================
   CONTINUE TO BATTLE
   ========================================================= */

if (continueButton) {

    continueButton.addEventListener(
        "click",
        () => {

            const assigned =
                Object.keys(
                    rolesState.roles
                ).length;


            if (
                rolesState.team.length !==
                6 ||
                assigned !==
                6
            ) {

                showMessage(
                    "Assign all six roles first.",
                    "warning"
                );

                return;
            }


            rolesState.complete =
                true;


            rolesSocket.emit(
                "roles:complete",
                {
                    matchId:
                        rolesState.matchId,

                    roles:
                        rolesState.roles
                }
            );


            showMessage(
                "Waiting for opponent...",
                "info"
            );
        }
    );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            /*
             * Do NOT delete match ID.
             *
             * The match code must survive navigation.
             */

            window.location.href =
                "draft.html";
        }
    );
}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden &&
            !rolesSocket.connected
        ) {

            rolesSocket.connect();
        }
    }
);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_ROLES_STATE =
    rolesState;


/* =========================================================
   END OF ROLES.JS
   ========================================================= */