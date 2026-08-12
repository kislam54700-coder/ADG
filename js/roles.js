/* =========================================================
   ADG — ROLES.JS
   Private Online Multiplayer Role Assignment

   FIXES:
   - Match ID persists
   - Player number persists
   - Reconnect restores match
   - Private team restoration
   - Selected roles sync correctly
   - Progress updates correctly
   - 6 / 6 enables Battle Arena
   - Duplicate roles prevented
   - Assignments sent correctly to server
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";

const DEFAULT_BATTLE_NAME =
    "Face to Face";

const REQUIRED_TEAM_SIZE =
    6;


/* =========================================================
   ROLES
   Server values remain lowercase.
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
   SESSION HELPERS
   ========================================================= */

function getSession(key) {

    try {

        return sessionStorage.getItem(key);

    } catch (error) {

        console.warn(
            "[ADG] Session read error:",
            error
        );

        return null;

    }

}


function setSession(
    key,
    value
) {

    try {

        sessionStorage.setItem(
            key,
            String(value)
        );

    } catch (error) {

        console.warn(
            "[ADG] Session write error:",
            error
        );

    }

}


/* =========================================================
   RESTORE SAVED PLAYER BEFORE SOCKET
   ========================================================= */

const savedPlayerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    ) || null;


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
                    savedPlayerNumber
            },

            reconnection: true,

            reconnectionAttempts:
                Infinity,

            reconnectionDelay:
                1000,

            reconnectionDelayMax:
                5000
        }
    );


/* =========================================================
   STATE
   ========================================================= */

const rolesState = {

    matchId:
        null,

    playerNumber:
        savedPlayerNumber,

    playerName:
        "",

    battleName:
        DEFAULT_BATTLE_NAME,

    team:
        [],

    assignments:
        {},

    submitted:
        false,

    locked:
        false,

    connected:
        false,

    restoring:
        false

};


/* =========================================================
   RESTORE SESSION
   ========================================================= */

rolesState.matchId =
    getSession(
        "adg_matchId"
    );


rolesState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    ) ||
    rolesState.playerNumber ||
    null;


rolesState.playerName =
    getSession(
        "adg_playerName"
    ) ||
    "";


rolesState.battleName =
    getSession(
        "adg_battleName"
    ) ||
    DEFAULT_BATTLE_NAME;


/* =========================================================
   SAVE CORE SESSION
   ========================================================= */

function saveCoreSession() {

    if (
        rolesState.matchId
    ) {

        setSession(
            "adg_matchId",
            rolesState.matchId
        );

    }


    if (
        rolesState.playerNumber === 1 ||
        rolesState.playerNumber === 2
    ) {

        setSession(
            "adg_playerNumber",
            rolesState.playerNumber
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
        rolesState.battleName ||
        DEFAULT_BATTLE_NAME
    );

}


/* =========================================================
   DOM
   ========================================================= */

const rolesBattleTitle =
    document.getElementById(
        "animeTitle"
    ) ||
    document.getElementById(
        "battleName"
    ) ||
    document.getElementById(
        "battleTitle"
    );


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


const rolesConnectionStatus =
    document.getElementById(
        "connectionStatus"
    );


const rolesProgress =
    document.getElementById(
        "rolesProgress"
    );


const rolesProgressText =
    document.getElementById(
        "rolesProgressText"
    );


/* =========================================================
   UPDATE BATTLE NAME
   ========================================================= */

function updateBattleName(value) {

    const name =
        String(
            value ||
            DEFAULT_BATTLE_NAME
        )
        .trim()
        .slice(
            0,
            64
        );


    rolesState.battleName =
        name ||
        DEFAULT_BATTLE_NAME;


    if (
        rolesBattleTitle
    ) {

        rolesBattleTitle.textContent =
            rolesState.battleName;

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
    type = ""
) {

    const element =
        rolesMessage ||
        rolesStatus;


    if (
        !element
    ) {

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


    if (
        type
    ) {

        element.classList.add(
            type
        );

    }


    clearTimeout(
        showRolesMessage.timer
    );


    showRolesMessage.timer =
        setTimeout(
            () => {

                element.classList.add(
                    "hidden"
                );

            },
            5000
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


    if (
        rolesConnectionStatus
    ) {

        rolesConnectionStatus.classList.remove(
            "connected",
            "disconnected",
            "connecting"
        );


        if (
            connected
        ) {

            rolesConnectionStatus.textContent =
                "Connected";

            rolesConnectionStatus.classList.add(
                "connected"
            );

        } else {

            rolesConnectionStatus.textContent =
                "Reconnecting...";

            rolesConnectionStatus.classList.add(
                "disconnected"
            );

        }

    }


    updateSubmitButton();

}


/* =========================================================
   MATCH CODE DISPLAY
   ========================================================= */

function createMatchCodeDisplay() {

    let codeElement =
        document.getElementById(
            "matchCode"
        ) ||
        document.getElementById(
            "matchCodeValue"
        ) ||
        document.getElementById(
            "createdMatchId"
        );


    if (
        !codeElement
    ) {

        const parent =
            rolesBattleTitle?.parentElement ||
            document.querySelector(
                ".draft-header"
            ) ||
            document.querySelector(
                ".role-header"
            ) ||
            document.querySelector(
                "main"
            );


        if (
            parent
        ) {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.id =
                "adgMatchCodeWrapper";

            wrapper.className =
                "adg-match-code";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                "MATCH CODE ";


            codeElement =
                document.createElement(
                    "strong"
                );


            codeElement.id =
                "matchCodeValue";


            const copyButton =
                document.createElement(
                    "button"
                );


            copyButton.type =
                "button";

            copyButton.id =
                "copyMatchCodeButton";

            copyButton.textContent =
                "📋 Copy";


            copyButton.addEventListener(
                "click",
                copyMatchCode
            );


            wrapper.appendChild(
                label
            );

            wrapper.appendChild(
                codeElement
            );

            wrapper.appendChild(
                copyButton
            );


            parent.appendChild(
                wrapper
            );

        }

    }


    if (
        codeElement
    ) {

        codeElement.textContent =
            rolesState.matchId ||
            "------";

    }

}


/* =========================================================
   COPY MATCH CODE
   ========================================================= */

async function copyMatchCode() {

    if (
        !rolesState.matchId
    ) {

        showRolesMessage(
            "Match code is not available.",
            "warning"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            rolesState.matchId
        );


        showRolesMessage(
            "Match code copied.",
            "success"
        );

    } catch (error) {

        const input =
            document.createElement(
                "input"
            );


        input.value =
            rolesState.matchId;


        document.body.appendChild(
            input
        );


        input.select();


        try {

            document.execCommand(
                "copy"
            );


            showRolesMessage(
                "Match code copied.",
                "success"
            );

        } catch (copyError) {

            showRolesMessage(
                `Match Code: ${rolesState.matchId}`,
                "info"
            );

        }


        input.remove();

    }

}


/* =========================================================
   NORMALIZE CHARACTER
   ========================================================= */

function normalizeCharacter(
    character
) {

    if (
        typeof character ===
        "string"
    ) {

        return {
            name:
                character
        };

    }


    if (
        character &&
        typeof character ===
        "object"
    ) {

        return {
            ...character,

            name:
                String(
                    character.name ||
                    "Unknown"
                )
                .trim()
        };

    }


    return {
        name:
            "Unknown"
    };

}


/* =========================================================
   NORMALIZE TEAM
   ========================================================= */

function normalizeTeam(
    team
) {

    if (
        !Array.isArray(
            team
        )
    ) {

        return [];

    }


    return team
        .slice(
            0,
            REQUIRED_TEAM_SIZE
        )
        .map(
            normalizeCharacter
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
    )
    .trim();

}


/* =========================================================
   GET ASSIGNED ROLE
   ========================================================= */

function getAssignedRole(
    character
) {

    const key =
        getCharacterKey(
            character
        );


    return (
        rolesState.assignments[
            key
        ] ||
        ""
    );

}


/* =========================================================
   SYNC ASSIGNMENTS FROM UI
   IMPORTANT FIX
   ========================================================= */

function syncAssignmentsFromUI() {

    if (
        !rolesTeam
    ) {

        return;

    }


    const selects =
        rolesTeam.querySelectorAll(
            ".role-select"
        );


    const assignments =
        {};


    selects.forEach(
        select => {

            const characterKey =
                String(
                    select.dataset.character ||
                    ""
                )
                .trim();


            const role =
                String(
                    select.value ||
                    ""
                )
                .trim();


            const validRole =
                ADG_ROLES.some(
                    item =>
                        item.value ===
                        role
                );


            if (
                characterKey &&
                validRole
            ) {

                assignments[
                    characterKey
                ] =
                    role;

            }

        }
    );


    /*
     * Only replace assignments when
     * role cards actually exist.
     */

    if (
        selects.length > 0
    ) {

        rolesState.assignments =
            assignments;

    }

}


/* =========================================================
   CHECK DUPLICATE ROLE
   ========================================================= */

function isRoleAlreadyAssigned(
    role,
    exceptKey
) {

    syncAssignmentsFromUI();


    return Object.entries(
        rolesState.assignments
    )
    .some(
        (
            [
                key,
                assignedRole
            ]
        ) =>

            key !==
            exceptKey &&

            assignedRole ===
            role
    );

}


/* =========================================================
   VALIDATE ASSIGNMENTS
   ========================================================= */

function validateAssignments() {

    /*
     * IMPORTANT:
     * Always read the actual selected values
     * before validating.
     */

    syncAssignmentsFromUI();


    if (
        rolesState.team.length !==
        REQUIRED_TEAM_SIZE
    ) {

        return {

            valid:
                false,

            message:
                "You must have exactly 6 characters."

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
        assignedRoles.some(
            role =>
                !role
        )
    ) {

        return {

            valid:
                false,

            message:
                "Assign one role to every character."

        };

    }


    const uniqueRoles =
        new Set(
            assignedRoles
        );


    if (
        uniqueRoles.size !==
        REQUIRED_TEAM_SIZE
    ) {

        return {

            valid:
                false,

            message:
                "Each role can only be used once."

        };

    }


    for (
        const role of
        ADG_ROLES
    ) {

        if (
            !assignedRoles.includes(
                role.value
            )
        ) {

            return {

                valid:
                    false,

                message:
                    `Missing role: ${role.label}.`

            };

        }

    }


    return {

        valid:
            true,

        message:
            "All roles assigned."

    };

}


/* =========================================================
   RENDER TEAM
   ========================================================= */

function renderRolesTeam() {

    if (
        !rolesTeam
    ) {

        return;

    }


    rolesTeam.innerHTML =
        "";


    if (
        rolesState.team.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "roles-empty";


        empty.textContent =
            rolesState.restoring
                ? "Restoring your team..."
                : "Waiting for your drafted team...";


        rolesTeam.appendChild(
            empty
        );


        return;

    }


    rolesState.team.forEach(
        character => {

            rolesTeam.appendChild(
                createRoleCard(
                    character
                )
            );

        }
    );

}


/* =========================================================
   CREATE ROLE CARD
   ========================================================= */

function createRoleCard(
    character
) {

    const name =
        character?.name ||
        "Unknown";


    const key =
        getCharacterKey(
            character
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "roles-card role-card";

    card.dataset.character =
        key;


    /* =====================================================
       IMAGE
       ===================================================== */

    const image =
        document.createElement(
            "img"
        );


    image.className =
        "roles-character-image";

    image.alt =
        name;

    image.loading =
        "lazy";


    const fallback =
        document.createElement(
            "div"
        );


    fallback.className =
        "roles-image-fallback";


    fallback.textContent =
        name
            .charAt(0)
            .toUpperCase();


    const candidates =
        [];


    if (
        typeof getCharacterImageCandidates ===
        "function"
    ) {

        try {

            const helperCandidates =
                getCharacterImageCandidates(
                    name,
                    rolesState.battleName
                );


            if (
                Array.isArray(
                    helperCandidates
                )
            ) {

                helperCandidates.forEach(
                    path => {

                        if (
                            path &&
                            !candidates.includes(
                                path
                            )
                        ) {

                            candidates.push(
                                path
                            );

                        }

                    }
                );

            }

        } catch (error) {

            console.warn(
                "[ADG] Image helper error:",
                error
            );

        }

    }


    const encodedName =
        encodeURIComponent(
            name
        );


    const directPaths = [

        `assets/characters/${encodedName}.jpg`,

        `assets/characters/${encodedName}.png`,

        `assets/characters/${encodedName}.webp`

    ];


    directPaths.forEach(
        path => {

            if (
                !candidates.includes(
                    path
                )
            ) {

                candidates.push(
                    path
                );

            }

        }
    );


    let imageIndex =
        0;


    function tryImage() {

        if (
            imageIndex >=
            candidates.length
        ) {

            image.classList.add(
                "hidden"
            );

            fallback.classList.remove(
                "hidden"
            );

            return;

        }


        image.src =
            candidates[
                imageIndex++
            ];

    }


    image.onload =
        () => {

            image.classList.remove(
                "hidden"
            );

            fallback.classList.add(
                "hidden"
            );

        };


    image.onerror =
        tryImage;


    image.classList.add(
        "hidden"
    );


    tryImage();


    /* =====================================================
       NAME
       ===================================================== */

    const nameElement =
        document.createElement(
            "h3"
        );


    nameElement.className =
        "roles-character-name";


    nameElement.textContent =
        name;


    /* =====================================================
       ROLE SELECT
       ===================================================== */

    const roleSelect =
        document.createElement(
            "select"
        );


    roleSelect.className =
        "role-select";


    roleSelect.dataset.character =
        key;


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value =
        "";

    defaultOption.textContent =
        "Select Role";


    roleSelect.appendChild(
        defaultOption
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


            roleSelect.appendChild(
                option
            );

        }
    );


    const savedRole =
        getAssignedRole(
            character
        );


    if (
        savedRole
    ) {

        roleSelect.value =
            savedRole;

    }


    roleSelect.disabled =
        rolesState.locked ||
        rolesState.submitted;


    /* =====================================================
       ROLE CHANGE
       ===================================================== */

    roleSelect.addEventListener(
        "change",
        () => {

            if (
                rolesState.locked ||
                rolesState.submitted
            ) {

                return;

            }


            const previousRole =
                rolesState.assignments[
                    key
                ] ||
                "";


            const selectedRole =
                roleSelect.value;


            /*
             * Remove role.
             */

            if (
                !selectedRole
            ) {

                delete rolesState.assignments[
                    key
                ];


                updateRolesProgress();

                updateSubmitButton();

                return;

            }


            /*
             * Prevent duplicate role.
             */

            if (
                isRoleAlreadyAssigned(
                    selectedRole,
                    key
                )
            ) {

                roleSelect.value =
                    previousRole;


                const duplicate =
                    ADG_ROLES.find(
                        item =>
                            item.value ===
                            selectedRole
                    );


                showRolesMessage(
                    `${duplicate?.label || selectedRole} is already assigned.`,
                    "warning"
                );


                return;

            }


            /*
             * Save selected role.
             */

            rolesState.assignments[
                key
            ] =
                selectedRole;


            /*
             * Sync, progress and validation.
             */

            updateRolesProgress();

            updateSubmitButton();

        }
    );


    /* =====================================================
       APPEND
       ===================================================== */

    card.appendChild(
        image
    );

    card.appendChild(
        fallback
    );

    card.appendChild(
        nameElement
    );

    card.appendChild(
        roleSelect
    );


    return card;

}


/* =========================================================
   UPDATE PROGRESS
   ========================================================= */

function updateRolesProgress() {

    /*
     * IMPORTANT:
     * Read the currently selected roles.
     */

    syncAssignmentsFromUI();


    const assigned =
        rolesState.team.filter(
            character =>
                Boolean(
                    getAssignedRole(
                        character
                    )
                )
        )
        .length;


    if (
        rolesProgressText
    ) {

        rolesProgressText.textContent =
            `${assigned} / ${REQUIRED_TEAM_SIZE} Roles Assigned`;

    }


    if (
        rolesProgress
    ) {

        const percentage =
            Math.min(
                100,
                (
                    assigned /
                    REQUIRED_TEAM_SIZE
                ) * 100
            );


        rolesProgress.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   UPDATE SUBMIT BUTTON
   ========================================================= */

function updateSubmitButton() {

    if (
        !rolesSubmitButton
    ) {

        return;

    }


    /*
     * Validation automatically syncs UI.
     */

    const validation =
        validateAssignments();


    rolesSubmitButton.disabled =
        rolesState.locked ||
        rolesState.submitted ||
        !rolesState.connected ||
        !validation.valid;

}


/* =========================================================
   SUBMIT ROLES
   ========================================================= */

function submitRoles() {

    /*
     * Final sync before sending to server.
     */

    syncAssignmentsFromUI();


    if (
        rolesState.locked ||
        rolesState.submitted
    ) {

        return;

    }


    if (
        !rolesState.connected
    ) {

        showRolesMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    if (
        !rolesState.matchId
    ) {

        showRolesMessage(
            "Match Code is missing.",
            "error"
        );

        return;

    }


    const validation =
        validateAssignments();


    if (
        !validation.valid
    ) {

        showRolesMessage(
            validation.message,
            "warning"
        );

        return;

    }


    /*
     * Prevent double submit.
     */

    rolesState.submitted =
        true;


    updateSubmitButton();


    rolesSocket.emit(
        "roles:assign",
        {
            matchId:
                rolesState.matchId,

            playerNumber:
                rolesState.playerNumber,

            assignments:
                {
                    ...rolesState.assignments
                }
        }
    );


    showRolesMessage(
        "Roles submitted. Waiting for the other player.",
        "info"
    );

}


/* =========================================================
   RECONNECT TO MATCH
   ========================================================= */

function reconnectToMatch() {

    if (
        !rolesState.matchId
    ) {

        return;

    }


    if (
        rolesState.playerNumber !== 1 &&
        rolesState.playerNumber !== 2
    ) {

        return;

    }


    rolesState.restoring =
        true;


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
   SOCKET CONNECT
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


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

rolesSocket.on(
    "disconnect",
    () => {

        rolesState.restoring =
            false;


        updateConnectionUI(
            false
        );

    }
);


/* =========================================================
   MATCH RECONNECTED
   ========================================================= */

rolesSocket.on(
    "match:reconnected",
    data => {

        if (
            !data
        ) {

            rolesState.restoring =
                false;

            return;

        }


        rolesState.restoring =
            false;


        applyServerData(
            data
        );


        saveCoreSession();

        createMatchCodeDisplay();

        renderRolesTeam();

        updateRolesProgress();

        updateSubmitButton();

    }
);


/* =========================================================
   DRAFT STATE
   ========================================================= */

rolesSocket.on(
    "draft:state",
    data => {

        if (
            !data
        ) {

            return;

        }


        rolesState.restoring =
            false;


        applyServerData(
            data
        );


        saveCoreSession();

        createMatchCodeDisplay();

        renderRolesTeam();

        updateRolesProgress();

        updateSubmitButton();

    }
);


/* =========================================================
   ROLES STATE
   ========================================================= */

rolesSocket.on(
    "roles:state",
    data => {

        if (
            !data
        ) {

            return;

        }


        rolesState.restoring =
            false;


        applyServerData(
            data
        );


        saveCoreSession();

        createMatchCodeDisplay();

        renderRolesTeam();

        updateRolesProgress();

        updateSubmitButton();


        if (
            rolesState.submitted
        ) {

            showRolesMessage(
                "Your roles have been submitted. Waiting for the other player.",
                "success"
            );

        }

    }
);


/* =========================================================
   APPLY SERVER DATA
   ========================================================= */

function applyServerData(
    data
) {

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


        /*
         * Update Socket.IO auth for future reconnects.
         */

        rolesSocket.auth =
            {
                ...rolesSocket.auth,

                playerNumber:
                    rolesState.playerNumber
            };

    }


    if (
        data.playerName
    ) {

        rolesState.playerName =
            String(
                data.playerName
            );

    }


    if (
        data.battleName
    ) {

        updateBattleName(
            data.battleName
        );

    } else {

        updateBattleName(
            DEFAULT_BATTLE_NAME
        );

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
        "object" &&
        !Array.isArray(
            data.assignments
        )
    ) {

        rolesState.assignments =
            {
                ...data.assignments
            };

    }


    if (
        typeof data.complete ===
        "boolean" &&
        data.complete
    ) {

        rolesState.submitted =
            true;

        rolesState.locked =
            true;

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

}


/* =========================================================
   MATCH ROLES
   ========================================================= */

rolesSocket.on(
    "match:roles",
    data => {

        if (
            !data
        ) {

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
            data.battleName
        ) {

            updateBattleName(
                data.battleName
            );

        }


        saveCoreSession();

        createMatchCodeDisplay();

    }
);


/* =========================================================
   ROLE ERROR
   ========================================================= */

function handleRoleError(
    data
) {

    rolesState.submitted =
        false;

    rolesState.locked =
        false;


    updateSubmitButton();


    showRolesMessage(
        data?.message ||
        "Role assignment was rejected.",
        "error"
    );

}


rolesSocket.on(
    "role:error",
    handleRoleError
);


rolesSocket.on(
    "roles:error",
    handleRoleError
);


/* =========================================================
   MATCH ERROR
   ========================================================= */

rolesSocket.on(
    "match:error",
    data => {

        rolesState.restoring =
            false;


        /*
         * Do not unlock submitted roles unless
         * this is actually a role submission error.
         */

        showRolesMessage(
            data?.message ||
            "Match error.",
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


        saveCoreSession();


        window.location.href =
            "game.html";

    }
);


/* =========================================================
   SUBMIT BUTTON EVENT
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
   INITIAL UI
   ========================================================= */

updateBattleName(
    rolesState.battleName
);

createMatchCodeDisplay();

renderRolesTeam();

updateRolesProgress();

updateSubmitButton();

updateConnectionUI(
    rolesSocket.connected
);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_ROLES_STATE =
    rolesState;


window.ADG_ROLES =
    {

        list:
            ADG_ROLES,

        state:
            rolesState,

        validate:
            validateAssignments,

        submit:
            submitRoles,

        reconnect:
            reconnectToMatch,

        sync:
            syncAssignmentsFromUI

    };


/* =========================================================
   END OF ROLES.JS
   ========================================================= */