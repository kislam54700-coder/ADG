/* =========================================================
   ADG — ROLES.JS
   Clean Role Assignment System
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";

const DEFAULT_BATTLE_NAME =
    "Face to Face";

const TEAM_SIZE =
    6;


/* =========================================================
   ROLES
   ========================================================= */

const ADG_ROLES = [
    {
        value: "captain",
        label: "Captain"
    },
    {
        value: "vice-captain",
        label: "Vice-Captain"
    },
    {
        value: "tank",
        label: "Tank"
    },
    {
        value: "healer",
        label: "Healer"
    },
    {
        value: "support",
        label: "Support"
    },
    {
        value: "traitor",
        label: "Traitor"
    }
];


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function getSession(key) {

    try {

        return sessionStorage.getItem(key);

    } catch (error) {

        return null;

    }

}


function setSession(key, value) {

    try {

        sessionStorage.setItem(
            key,
            value
        );

    } catch (error) {

        console.warn(
            "[ADG] Storage error:",
            error
        );

    }

}


/* =========================================================
   INITIAL SESSION
   ========================================================= */

const savedMatchId =
    getSession("adg_matchId");

const savedPlayerNumber =
    Number(
        getSession("adg_playerNumber")
    ) || null;

const savedPlayerName =
    getSession("adg_playerName") ||
    "";

const savedBattleName =
    getSession("adg_battleName") ||
    DEFAULT_BATTLE_NAME;


/* =========================================================
   STATE
   ========================================================= */

const rolesState = {

    matchId:
        savedMatchId,

    playerNumber:
        savedPlayerNumber,

    playerName:
        savedPlayerName,

    battleName:
        savedBattleName,

    team:
        [],

    assignments:
        {},

    submitted:
        false,

    locked:
        false,

    connected:
        false

};


/* =========================================================
   DOM
   ========================================================= */

const rolesTeam =
    document.getElementById(
        "rolesTeam"
    );

const rolesMessage =
    document.getElementById(
        "rolesMessage"
    );

const rolesStatus =
    document.getElementById(
        "rolesStatus"
    );

const rolesSubmitButton =
    document.getElementById(
        "submitRolesButton"
    );

const rolesProgressText =
    document.getElementById(
        "rolesProgressText"
    );

const rolesProgress =
    document.getElementById(
        "rolesProgress"
    );

const rolesConnectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const battleTitle =
    document.getElementById(
        "animeTitle"
    ) ||
    document.getElementById(
        "battleName"
    ) ||
    document.getElementById(
        "battleTitle"
    );


/* =========================================================
   SOCKET
   ========================================================= */

const rolesSocket =
    io(
        ADG_SERVER_URL,
        {
            transports: [
                "websocket",
                "polling"
            ],

            auth: {

                playerNumber:
                    savedPlayerNumber,

                matchId:
                    savedMatchId

            },

            reconnection:
                true,

            reconnectionAttempts:
                Infinity,

            reconnectionDelay:
                1000,

            reconnectionDelayMax:
                5000

        }
    );


/* =========================================================
   SAVE SESSION
   ========================================================= */

function saveSession() {

    if (
        rolesState.matchId
    ) {

        setSession(
            "adg_matchId",
            rolesState.matchId
        );

    }


    if (
        rolesState.playerNumber
    ) {

        setSession(
            "adg_playerNumber",
            String(
                rolesState.playerNumber
            )
        );

    }


    if (
        rolesState.playerName
    ) {

        setSession(
            "adg_playerName",
            rolesState.playerName
        );

    }


    setSession(
        "adg_battleName",
        rolesState.battleName
    );

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showRolesMessage(
    message,
    type = "info"
) {

    const element =
        rolesMessage ||
        rolesStatus;


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        type;

}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnectionUI(
    connected
) {

    rolesState.connected =
        connected;


    if (
        !rolesConnectionStatus
    ) {

        updateSubmitButton();

        return;

    }


    if (connected) {

        rolesConnectionStatus.textContent =
            "Connected";

        rolesConnectionStatus.className =
            "connected";

    } else {

        rolesConnectionStatus.textContent =
            "Reconnecting...";

        rolesConnectionStatus.className =
            "disconnected";

    }


    updateSubmitButton();

}


/* =========================================================
   BATTLE TITLE
   ========================================================= */

function updateBattleTitle() {

    if (battleTitle) {

        battleTitle.textContent =
            rolesState.battleName ||
            DEFAULT_BATTLE_NAME;

    }

}


/* =========================================================
   MATCH CODE
   ========================================================= */

function updateMatchCode() {

    const element =
        document.getElementById(
            "matchCode"
        ) ||
        document.getElementById(
            "matchCodeValue"
        ) ||
        document.getElementById(
            "createdMatchId"
        );


    if (element) {

        element.textContent =
            rolesState.matchId ||
            "------";

    }

}


/* =========================================================
   NORMALIZE TEAM
   ========================================================= */

function normalizeTeam(team) {

    if (
        !Array.isArray(team)
    ) {

        return [];

    }


    return team
        .slice(0, TEAM_SIZE)
        .map(
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

                    ...character,

                    name:
                        String(
                            character?.name ||
                            "Unknown"
                        )

                };

            }
        );

}


/* =========================================================
   CHARACTER KEY
   ========================================================= */

function getCharacterKey(
    character
) {

    return String(
        character?.name ||
        ""
    ).trim();

}


/* =========================================================
   GET ROLE
   ========================================================= */

function getAssignedRole(
    character
) {

    const key =
        getCharacterKey(
            character
        );


    return (
        rolesState.assignments[key] ||
        ""
    );

}


/* =========================================================
   ASSIGNED COUNT
   ========================================================= */

function getAssignedCount() {

    return rolesState.team.reduce(
        (
            count,
            character
        ) => {

            return getAssignedRole(
                character
            )
                ? count + 1
                : count;

        },
        0
    );

}


/* =========================================================
   CHECK ROLE DUPLICATE
   ========================================================= */

function isRoleUsed(
    role,
    currentKey
) {

    return Object.entries(
        rolesState.assignments
    ).some(
        (
            [
                key,
                assignedRole
            ]
        ) => {

            return (
                key !== currentKey &&
                assignedRole === role
            );

        }
    );

}


/* =========================================================
   VALIDATE
   ========================================================= */

function validateAssignments() {

    if (
        rolesState.team.length !==
        TEAM_SIZE
    ) {

        return {

            valid:
                false,

            message:
                "You need exactly 6 characters."

        };

    }


    const assignedRoles =
        rolesState.team.map(
            character =>
                getAssignedRole(
                    character
                )
        );


    if (
        assignedRoles.includes("")
    ) {

        return {

            valid:
                false,

            message:
                "Assign all 6 roles."

        };

    }


    const uniqueRoles =
        new Set(
            assignedRoles
        );


    if (
        uniqueRoles.size !==
        TEAM_SIZE
    ) {

        return {

            valid:
                false,

            message:
                "Each role must be unique."

        };

    }


    const validRoleValues =
        ADG_ROLES.map(
            role =>
                role.value
        );


    const allValid =
        assignedRoles.every(
            role =>
                validRoleValues.includes(
                    role
                )
        );


    if (!allValid) {

        return {

            valid:
                false,

            message:
                "Invalid role assignment."

        };

    }


    return {

        valid:
            true,

        message:
            "Ready for battle."

    };

}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateRolesProgress() {

    const assignedCount =
        getAssignedCount();


    if (
        rolesProgressText
    ) {

        rolesProgressText.textContent =
            `${assignedCount} / ${TEAM_SIZE} Roles Assigned`;

    }


    if (
        rolesProgress
    ) {

        const percent =
            (
                assignedCount /
                TEAM_SIZE
            ) * 100;


        rolesProgress.style.width =
            `${percent}%`;

    }


    updateSubmitButton();

}


/* =========================================================
   UPDATE BUTTON
   ========================================================= */

function updateSubmitButton() {

    if (
        !rolesSubmitButton
    ) {

        return;

    }


    const validation =
        validateAssignments();


    /*
     * IMPORTANT:
     *
     * The button should depend on role completion.
     * It must NOT remain disabled because of a temporary
     * connection UI issue.
     */

    rolesSubmitButton.disabled =
        rolesState.submitted ||
        rolesState.locked ||
        !validation.valid;

}


/* =========================================================
   RENDER TEAM
   ========================================================= */

function renderRolesTeam() {

    if (!rolesTeam) {

        return;

    }


    rolesTeam.innerHTML =
        "";


    if (
        rolesState.team.length === 0
    ) {

        rolesTeam.innerHTML =
            `
            <div class="roles-empty">
                Waiting for your drafted team...
            </div>
            `;


        updateRolesProgress();

        return;

    }


    rolesState.team.forEach(
        character => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "role-card";


            /* -----------------------------
               CHARACTER NAME
               ----------------------------- */

            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                character.name;


            /* -----------------------------
               ROLE SELECT
               ----------------------------- */

            const select =
                document.createElement(
                    "select"
                );


            select.className =
                "role-select";


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
                        role.value;

                    option.textContent =
                        role.label;


                    select.appendChild(
                        option
                    );

                }
            );


            const key =
                getCharacterKey(
                    character
                );


            select.value =
                rolesState.assignments[key] ||
                "";


            select.disabled =
                rolesState.submitted ||
                rolesState.locked;


            /* -----------------------------
               ROLE CHANGE
               ----------------------------- */

            select.addEventListener(
                "change",
                () => {

                    const selectedRole =
                        select.value;


                    /*
                     * Remove role
                     */

                    if (
                        !selectedRole
                    ) {

                        delete rolesState.assignments[
                            key
                        ];


                        updateRolesProgress();

                        return;

                    }


                    /*
                     * Duplicate check
                     */

                    if (
                        isRoleUsed(
                            selectedRole,
                            key
                        )
                    ) {

                        const previousRole =
                            rolesState.assignments[key] ||
                            "";


                        select.value =
                            previousRole;


                        showRolesMessage(
                            "That role is already assigned.",
                            "warning"
                        );


                        return;

                    }


                    /*
                     * SAVE ROLE
                     *
                     * This is the important part that
                     * updates the SAME assignments object
                     * used by validation and progress.
                     */

                    rolesState.assignments[
                        key
                    ] =
                        selectedRole;


                    console.log(
                        "[ADG] Role assigned:",
                        {
                            character:
                                key,

                            role:
                                selectedRole,

                            assignments:
                                rolesState.assignments
                        }
                    );


                    updateRolesProgress();

                }
            );


            card.appendChild(name);

            card.appendChild(select);


            rolesTeam.appendChild(
                card
            );

        }
    );


    updateRolesProgress();

}


/* =========================================================
   APPLY SERVER DATA
   ========================================================= */

function applyServerState(data) {

    if (!data) {

        return;

    }


    if (
        data.matchId
    ) {

        rolesState.matchId =
            String(
                data.matchId
            )
            .trim()
            .toUpperCase();

    }


    if (
        data.playerNumber === 1 ||
        data.playerNumber === 2
    ) {

        rolesState.playerNumber =
            Number(
                data.playerNumber
            );

    }


    if (
        data.playerName
    ) {

        rolesState.playerName =
            data.playerName;

    }


    if (
        data.battleName
    ) {

        rolesState.battleName =
            data.battleName;

    }


    if (
        Array.isArray(
            data.team
        )
    ) {

        rolesState.team =
            normalizeTeam(
                data.team
            );

    }


    if (
        data.assignments &&
        typeof data.assignments ===
        "object"
    ) {

        rolesState.assignments =
            {
                ...data.assignments
            };

    }


    if (
        typeof data.submitted ===
        "boolean"
    ) {

        rolesState.submitted =
            data.submitted;

    }


    if (
        typeof data.locked ===
        "boolean"
    ) {

        rolesState.locked =
            data.locked;

    }


    saveSession();

    updateBattleTitle();

    updateMatchCode();

    renderRolesTeam();

}


/* =========================================================
   RECONNECT MATCH
   ========================================================= */

function reconnectToMatch() {

    if (
        !rolesState.matchId
    ) {

        return;

    }


    rolesSocket.emit(
        "match:reconnect",
        {

            matchId:
                rolesState.matchId,

            playerNumber:
                rolesState.playerNumber

        }
    );

}


/* =========================================================
   SOCKET EVENTS
   ========================================================= */

rolesSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );

        reconnectToMatch();

    }
);


rolesSocket.on(
    "disconnect",
    () => {

        updateConnectionUI(
            false
        );

    }
);


rolesSocket.on(
    "match:reconnected",
    data => {

        applyServerState(
            data
        );

    }
);


rolesSocket.on(
    "draft:state",
    data => {

        applyServerState(
            data
        );

    }
);


rolesSocket.on(
    "roles:state",
    data => {

        applyServerState(
            data
        );

    }
);


rolesSocket.on(
    "match:roles",
    data => {

        applyServerState(
            data
        );

    }
);


rolesSocket.on(
    "roles:error",
    data => {

        rolesState.submitted =
            false;


        rolesState.locked =
            false;


        updateSubmitButton();


        showRolesMessage(
            data?.message ||
            "Role assignment failed.",
            "error"
        );

    }
);


rolesSocket.on(
    "role:error",
    data => {

        rolesState.submitted =
            false;


        rolesState.locked =
            false;


        updateSubmitButton();


        showRolesMessage(
            data?.message ||
            "Role assignment failed.",
            "error"
        );

    }
);


/* =========================================================
   BATTLE READY
   ========================================================= */

rolesSocket.on(
    "match:battle",
    data => {

        if (
            data?.matchId
        ) {

            rolesState.matchId =
                String(
                    data.matchId
                )
                .trim()
                .toUpperCase();

        }


        saveSession();


        window.location.href =
            "game.html";

    }
);


/* =========================================================
   SUBMIT / CONTINUE
   ========================================================= */

function submitRoles() {

    const validation =
        validateAssignments();


    if (
        !validation.valid
    ) {

        showRolesMessage(
            validation.message,
            "warning"
        );

        updateSubmitButton();

        return;

    }


    /*
     * Prevent double click.
     */

    if (
        rolesState.submitted
    ) {

        return;

    }


    rolesState.submitted =
        true;


    updateSubmitButton();


    const payload = {

        matchId:
            rolesState.matchId,

        playerNumber:
            rolesState.playerNumber,

        assignments:
            {
                ...rolesState.assignments
            }

    };


    console.log(
        "[ADG] Sending roles:",
        payload
    );


    /*
     * Send to server if connected.
     */

    if (
        rolesSocket.connected
    ) {

        rolesSocket.emit(
            "roles:assign",
            payload
        );

    }


    showRolesMessage(
        "Roles ready. Entering Battle Arena...",
        "success"
    );


    /*
     * IMPORTANT FALLBACK
     *
     * Your old issue was that the button could submit
     * but then wait forever for a server event.
     *
     * The game page can reconnect using the saved
     * match ID and player number.
     */

    setTimeout(
        () => {

            saveSession();

            window.location.href =
                "game.html";

        },
        600
    );

}


/* =========================================================
   BUTTON EVENT
   ========================================================= */

if (
    rolesSubmitButton
) {

    rolesSubmitButton.addEventListener(
        "click",
        submitRoles
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
   INITIALIZE
   ========================================================= */

updateBattleTitle();

updateMatchCode();

renderRolesTeam();

updateRolesProgress();

updateConnectionUI(
    rolesSocket.connected
);


/* =========================================================
   GLOBAL DEBUG
   ========================================================= */

window.ADG_ROLES_STATE =
    rolesState;


window.ADG_ROLES =
    {

        state:
            rolesState,

        roles:
            ADG_ROLES,

        validate:
            validateAssignments,

        submit:
            submitRoles,

        reconnect:
            reconnectToMatch

    };


console.log(
    "[ADG] Roles system ready",
    rolesState
);


/* =========================================================
   END OF ROLES.JS
   ========================================================= */