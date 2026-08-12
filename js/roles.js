/* =========================================================
   ADG — ROLES.JS
   Clean Online Multiplayer Role Assignment Client

   RULES
   - Battle name: Face to Face
   - No anime selection
   - Match ID persists across reload/reconnect
   - Player number persists across reload/reconnect
   - Private team only
   - Exactly 6 characters
   - Exactly 6 unique roles
   - Server role values are lowercase
   - Character images: assets/characters/
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";

const DEFAULT_BATTLE_NAME =
    "Face to Face";

const TEAM_SIZE = 6;


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
   SESSION HELPERS
   ========================================================= */

function getSession(key) {
    try {
        return sessionStorage.getItem(key);
    } catch (error) {
        console.warn("[ADG] Session read error:", error);
        return null;
    }
}


function setSession(key, value) {
    try {
        sessionStorage.setItem(key, String(value));
    } catch (error) {
        console.warn("[ADG] Session write error:", error);
    }
}


function removeSession(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.warn("[ADG] Session remove error:", error);
    }
}


/* =========================================================
   RESTORE SESSION FIRST
   ========================================================= */

const storedMatchId =
    getSession("adg_matchId");

const storedPlayerNumber =
    Number(
        getSession("adg_playerNumber")
    ) || null;

const storedPlayerName =
    getSession("adg_playerName") || "";


/* =========================================================
   STATE
   ========================================================= */

const rolesState = {

    matchId:
        storedMatchId
            ? String(storedMatchId).trim().toUpperCase()
            : null,

    playerNumber:
        storedPlayerNumber,

    playerName:
        storedPlayerName,

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

    reconnecting:
        false

};


/* =========================================================
   SOCKET.IO
   ========================================================= */

if (
    typeof io !== "function"
) {

    console.error(
        "[ADG] Socket.IO was not loaded."
    );

    throw new Error(
        "Socket.IO is required before roles.js."
    );

}


/*
 * IMPORTANT:
 * playerNumber is placed inside auth BEFORE connecting.
 * This allows the server to identify the player immediately.
 */

const rolesSocket = io(
    ADG_SERVER_URL,
    {
        transports: [
            "websocket",
            "polling"
        ],

        autoConnect: true,

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000,

        timeout: 10000,

        auth: {
            playerNumber:
                rolesState.playerNumber
        }
    }
);


/* =========================================================
   DOM
   ========================================================= */

const battleTitleElement =
    document.getElementById("animeTitle") ||
    document.getElementById("battleName") ||
    document.getElementById("battleTitle");

const rolesTeamElement =
    document.getElementById("rolesTeam");

const rolesMessageElement =
    document.getElementById("rolesMessage");

const rolesStatusElement =
    document.getElementById("rolesStatus");

const submitRolesButton =
    document.getElementById("submitRolesButton");

const connectionStatusElement =
    document.getElementById("connectionStatus");

const rolesProgressElement =
    document.getElementById("rolesProgress");

const rolesProgressTextElement =
    document.getElementById("rolesProgressText");


/* =========================================================
   SESSION SAVE
   ========================================================= */

function saveSession() {

    if (rolesState.matchId) {

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

    if (rolesState.playerName) {

        setSession(
            "adg_playerName",
            rolesState.playerName
        );

    }

    setSession(
        "adg_battleName",
        DEFAULT_BATTLE_NAME
    );

}


/* =========================================================
   MATCH CODE DISPLAY
   ========================================================= */

function getMatchCodeElement() {

    return (
        document.getElementById("matchCode") ||
        document.getElementById("matchCodeValue") ||
        document.getElementById("createdMatchId")
    );

}


function ensureMatchCodeDisplay() {

    let codeElement =
        getMatchCodeElement();

    if (codeElement) {

        updateMatchCodeDisplay();

        return;

    }


    const parent =
        battleTitleElement?.parentElement ||
        document.querySelector(".draft-header") ||
        document.querySelector("main") ||
        document.body;


    if (!parent) {
        return;
    }


    const wrapper =
        document.createElement("div");

    wrapper.id =
        "adgMatchCodeWrapper";

    wrapper.className =
        "adg-match-code";


    const label =
        document.createElement("span");

    label.textContent =
        "MATCH CODE: ";


    codeElement =
        document.createElement("strong");

    codeElement.id =
        "matchCodeValue";


    const copyButton =
        document.createElement("button");

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


    wrapper.appendChild(label);
    wrapper.appendChild(codeElement);
    wrapper.appendChild(copyButton);

    parent.appendChild(wrapper);

    updateMatchCodeDisplay();

}


function updateMatchCodeDisplay() {

    const codeElement =
        getMatchCodeElement();

    if (!codeElement) {
        return;
    }


    codeElement.textContent =
        rolesState.matchId ||
        "------";

}


async function copyMatchCode() {

    if (!rolesState.matchId) {

        showMessage(
            "Match code is not available yet.",
            "warning"
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

        const input =
            document.createElement("input");

        input.value =
            rolesState.matchId;

        document.body.appendChild(input);

        input.select();

        try {

            document.execCommand("copy");

            showMessage(
                "Match code copied.",
                "success"
            );

        } catch (copyError) {

            showMessage(
                `Match Code: ${rolesState.matchId}`,
                "info"
            );

        }

        input.remove();

    }

}


/* =========================================================
   BATTLE NAME
   ========================================================= */

function setBattleName() {

    rolesState.battleName =
        DEFAULT_BATTLE_NAME;


    if (battleTitleElement) {

        battleTitleElement.textContent =
            DEFAULT_BATTLE_NAME;

    }


    setSession(
        "adg_battleName",
        DEFAULT_BATTLE_NAME
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
        rolesMessageElement ||
        rolesStatusElement;

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
            5000
        );

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function updateConnectionStatus(
    connected,
    reconnecting = false
) {

    rolesState.connected =
        Boolean(connected);

    rolesState.reconnecting =
        Boolean(reconnecting);


    if (!connectionStatusElement) {

        updateSubmitButton();

        return;

    }


    connectionStatusElement.classList.remove(
        "connected",
        "disconnected",
        "reconnecting"
    );


    if (connected) {

        connectionStatusElement.textContent =
            "Connected";

        connectionStatusElement.classList.add(
            "connected"
        );

    } else if (reconnecting) {

        connectionStatusElement.textContent =
            "Reconnecting...";

        connectionStatusElement.classList.add(
            "reconnecting"
        );

    } else {

        connectionStatusElement.textContent =
            "Disconnected";

        connectionStatusElement.classList.add(
            "disconnected"
        );

    }


    updateSubmitButton();

}


/* =========================================================
   SOCKET CONNECT
   ========================================================= */

rolesSocket.on(
    "connect",
    () => {

        console.log(
            "[ADG] Socket connected:",
            rolesSocket.id
        );


        updateConnectionStatus(
            true,
            false
        );


        /*
         * IMPORTANT:
         * Socket.IO may reconnect with a new socket ID.
         *
         * Send the persistent match ID and player number
         * again so the server can restore the player.
         */

        if (
            rolesState.matchId &&
            (
                rolesState.playerNumber === 1 ||
                rolesState.playerNumber === 2
            )
        ) {

            reconnectToMatch();

        } else {

            showMessage(
                "Connected. Waiting for match information...",
                "info"
            );

        }

    }
);


/* =========================================================
   SOCKET CONNECT ERROR
   ========================================================= */

rolesSocket.on(
    "connect_error",
    error => {

        console.warn(
            "[ADG] Connection error:",
            error?.message || error
        );


        updateConnectionStatus(
            false,
            true
        );

    }
);


/* =========================================================
   SOCKET RECONNECT ATTEMPT
   ========================================================= */

rolesSocket.io.on(
    "reconnect_attempt",
    () => {

        updateConnectionStatus(
            false,
            true
        );

    }
);


/* =========================================================
   SOCKET RECONNECT
   ========================================================= */

rolesSocket.io.on(
    "reconnect",
    () => {

        updateConnectionStatus(
            true,
            false
        );


        /*
         * connect event normally handles restoration.
         * This additional call is harmless and ensures
         * persistent match restoration.
         */

        if (
            rolesState.matchId &&
            (
                rolesState.playerNumber === 1 ||
                rolesState.playerNumber === 2
            )
        ) {

            reconnectToMatch();

        }

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

rolesSocket.on(
    "disconnect",
    reason => {

        console.warn(
            "[ADG] Disconnected:",
            reason
        );


        updateConnectionStatus(
            false,
            true
        );


        if (
            reason !== "io client disconnect"
        ) {

            showMessage(
                "Connection lost. Reconnecting...",
                "warning"
            );

        }

    }
);


/* =========================================================
   RECONNECT TO EXISTING MATCH
   ========================================================= */

function reconnectToMatch() {

    if (!rolesState.matchId) {

        console.warn(
            "[ADG] No match ID available for reconnect."
        );

        return;

    }


    if (
        rolesState.playerNumber !== 1 &&
        rolesState.playerNumber !== 2
    ) {

        console.warn(
            "[ADG] No valid player number available."
        );

        return;

    }


    rolesState.reconnecting =
        true;


    console.log(
        "[ADG] Restoring match:",
        rolesState.matchId,
        "Player:",
        rolesState.playerNumber
    );


    /*
     * Send BOTH values.
     *
     * This is the important part for your server.
     */

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
   MATCH RECONNECTED
   ========================================================= */

rolesSocket.on(
    "match:reconnected",
    data => {

        console.log(
            "[ADG] Match restored:",
            data
        );


        if (!data) {
            return;
        }


        applyServerMatchData(
            data
        );


        rolesState.reconnecting =
            false;


        updateConnectionStatus(
            true,
            false
        );


        showMessage(
            "Match restored.",
            "success"
        );

    }
);


/* =========================================================
   APPLY SERVER MATCH DATA
   ========================================================= */

function applyServerMatchData(
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

    }


    if (
        data.playerName
    ) {

        rolesState.playerName =
            String(
                data.playerName
            );

    }


    /*
     * NEVER restore an anime name.
     */

    setBattleName();


    if (
        Array.isArray(data.team)
    ) {

        rolesState.team =
            normalizeTeam(
                data.team
            );

    }


    if (
        data.assignments &&
        typeof data.assignments === "object" &&
        !Array.isArray(data.assignments)
    ) {

        rolesState.assignments =
            {
                ...data.assignments
            };

    }


    if (
        typeof data.submitted === "boolean"
    ) {

        rolesState.submitted =
            data.submitted;

    }


    if (
        typeof data.locked === "boolean"
    ) {

        rolesState.locked =
            data.locked;

    }


    if (
        typeof data.complete === "boolean" &&
        data.complete
    ) {

        rolesState.submitted =
            true;

        rolesState.locked =
            true;

    }


    saveSession();

    ensureMatchCodeDisplay();

    renderRolesTeam();

    updateRolesProgress();

    updateSubmitButton();

}


/* =========================================================
   DRAFT STATE
   ========================================================= */

rolesSocket.on(
    "draft:state",
    data => {

        console.log(
            "[ADG] Draft state received:",
            data
        );


        if (!data) {
            return;
        }


        applyServerMatchData(
            data
        );

    }
);


/* =========================================================
   ROLES STATE
   ========================================================= */

rolesSocket.on(
    "roles:state",
    data => {

        console.log(
            "[ADG] Roles state received:",
            data
        );


        if (!data) {
            return;
        }


        applyServerMatchData(
            data
        );


        if (
            rolesState.submitted
        ) {

            showMessage(
                "Your roles are submitted. Waiting for the other player.",
                "success"
            );

        }

    }
);


/* =========================================================
   MATCH ROLES
   ========================================================= */

rolesSocket.on(
    "match:roles",
    data => {

        console.log(
            "[ADG] Match roles:",
            data
        );


        if (
            data?.matchId
        ) {

            rolesState.matchId =
                String(
                    data.matchId
                )
                .trim()
                .toUpperCase();

            saveSession();

        }


        /*
         * Always Face to Face.
         */

        setBattleName();

        ensureMatchCodeDisplay();

    }
);


/* =========================================================
   ROLE ERRORS
   ========================================================= */

function handleRoleError(
    data
) {

    rolesState.submitted =
        false;

    rolesState.locked =
        false;


    updateSubmitButton();


    showMessage(
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

        showMessage(
            data?.message ||
            "Match error.",
            "error"
        );


        updateSubmitButton();

    }
);


/* =========================================================
   BATTLE READY
   ========================================================= */

rolesSocket.on(
    "match:battle",
    data => {

        console.log(
            "[ADG] Battle ready:",
            data
        );


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


        /*
         * Keep match ID in session.
         * game.js can use the same ID.
         */

        window.location.href =
            "game.html";

    }
);


/* =========================================================
   NORMALIZE CHARACTER
   ========================================================= */

function normalizeCharacter(
    character
) {

    if (
        typeof character === "string"
    ) {

        return {
            name:
                character.trim()
        };

    }


    if (
        character &&
        typeof character === "object"
    ) {

        return {
            ...character,

            name:
                String(
                    character.name ||
                    "Unknown"
                ).trim()

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

    if (!Array.isArray(team)) {

        return [];

    }


    return team
        .slice(0, TEAM_SIZE)
        .map(normalizeCharacter)
        .filter(
            character =>
                character.name &&
                character.name !== "Unknown"
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
   DUPLICATE ROLE CHECK
   ========================================================= */

function isRoleAlreadyAssigned(
    role,
    exceptKey
) {

    return Object.entries(
        rolesState.assignments
    ).some(
        (
            [key, assignedRole]
        ) =>
            key !== exceptKey &&
            assignedRole === role
    );

}


/* =========================================================
   VALIDATE ROLES
   ========================================================= */

function validateAssignments() {

    if (
        rolesState.team.length !== TEAM_SIZE
    ) {

        return {
            valid: false,
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
            role => !role
        )
    ) {

        return {
            valid: false,
            message:
                "Assign one role to every character."
        };

    }


    const uniqueRoles =
        new Set(
            assignedRoles
        );


    if (
        uniqueRoles.size !== TEAM_SIZE
    ) {

        return {
            valid: false,
            message:
                "Each role can only be used once."
        };

    }


    for (
        const role of ADG_ROLES
    ) {

        if (
            !assignedRoles.includes(
                role.value
            )
        ) {

            return {
                valid: false,
                message:
                    `Missing role: ${role.label}.`
            };

        }

    }


    return {
        valid: true,
        message:
            "All roles assigned."
    };

}


/* =========================================================
   CREATE IMAGE PATHS
   ========================================================= */

function getImageCandidates(
    name
) {

    const candidates = [];

    /*
     * Use database helper if available.
     */

    if (
        typeof getCharacterImageCandidates ===
        "function"
    ) {

        try {

            const result =
                getCharacterImageCandidates(
                    name
                );

            if (
                Array.isArray(result)
            ) {

                result.forEach(
                    path => {

                        if (
                            path &&
                            !candidates.includes(path)
                        ) {

                            candidates.push(path);

                        }

                    }
                );

            }

        } catch (error) {

            console.warn(
                "[ADG] Database image helper failed:",
                error
            );

        }

    }


    /*
     * Required location.
     */

    const safeName =
        encodeURIComponent(
            name
        );


    [
        `.jpg`,
        `.jpeg`,
        `.png`,
        `.webp`
    ].forEach(
        extension => {

            const path =
                `assets/characters/${safeName}${extension}`;

            if (
                !candidates.includes(path)
            ) {

                candidates.push(path);

            }

        }
    );


    return candidates;

}


/* =========================================================
   CREATE ROLE CARD
   ========================================================= */

function createRoleCard(
    character
) {

    const name =
        character.name;


    const key =
        getCharacterKey(
            character
        );


    const card =
        document.createElement("div");

    card.className =
        "roles-card";

    card.dataset.character =
        key;


    /* IMAGE */

    const image =
        document.createElement("img");

    image.className =
        "roles-character-image";

    image.alt =
        name;

    image.loading =
        "lazy";


    const fallback =
        document.createElement("div");

    fallback.className =
        "roles-image-fallback";

    fallback.textContent =
        name.charAt(0).toUpperCase();


    let imageIndex = 0;

    const candidates =
        getImageCandidates(
            name
        );


    function tryNextImage() {

        if (
            imageIndex >= candidates.length
        ) {

            image.classList.add("hidden");

            fallback.classList.remove("hidden");

            return;

        }


        image.src =
            candidates[imageIndex++];

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
        tryNextImage;


    image.classList.add(
        "hidden"
    );


    tryNextImage();


    /* NAME */

    const nameElement =
        document.createElement("h3");

    nameElement.className =
        "roles-character-name";

    nameElement.textContent =
        name;


    /* ROLE SELECT */

    const roleSelect =
        document.createElement("select");

    roleSelect.className =
        "role-select";

    roleSelect.dataset.character =
        key;


    const emptyOption =
        document.createElement("option");

    emptyOption.value =
        "";

    emptyOption.textContent =
        "Select Role";

    roleSelect.appendChild(
        emptyOption
    );


    ADG_ROLES.forEach(
        role => {

            const option =
                document.createElement("option");

            option.value =
                role.value;

            option.textContent =
                role.label;

            roleSelect.appendChild(
                option
            );

        }
    );


    const currentRole =
        getAssignedRole(
            character
        );


    roleSelect.value =
        currentRole || "";


    roleSelect.disabled =
        rolesState.locked ||
        rolesState.submitted;


    /* ROLE CHANGE */

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
                rolesState.assignments[key] ||
                "";


            const selectedRole =
                roleSelect.value;


            if (!selectedRole) {

                delete rolesState.assignments[
                    key
                ];

                updateRolesProgress();

                updateSubmitButton();

                return;

            }


            if (
                isRoleAlreadyAssigned(
                    selectedRole,
                    key
                )
            ) {

                roleSelect.value =
                    previousRole;


                const duplicateRole =
                    ADG_ROLES.find(
                        role =>
                            role.value ===
                            selectedRole
                    );


                showMessage(
                    `${duplicateRole?.label || selectedRole} is already assigned.`,
                    "warning"
                );

                return;

            }


            rolesState.assignments[key] =
                selectedRole;


            updateRolesProgress();

            updateSubmitButton();

        }
    );


    card.appendChild(image);

    card.appendChild(fallback);

    card.appendChild(nameElement);

    card.appendChild(roleSelect);


    return card;

}


/* =========================================================
   RENDER TEAM
   ========================================================= */

function renderRolesTeam() {

    if (!rolesTeamElement) {
        return;
    }


    rolesTeamElement.innerHTML =
        "";


    if (
        rolesState.team.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "roles-empty";

        empty.textContent =
            rolesState.reconnecting
                ? "Restoring your team..."
                : "Waiting for your drafted team...";

        rolesTeamElement.appendChild(
            empty
        );

        return;

    }


    rolesState.team.forEach(
        character => {

            rolesTeamElement.appendChild(
                createRoleCard(
                    character
                )
            );

        }
    );

}


/* =========================================================
   PROGRESS
   ========================================================= */

function updateRolesProgress() {

    const assigned =
        rolesState.team.filter(
            character =>
                Boolean(
                    getAssignedRole(
                        character
                    )
                )
        ).length;


    if (
        rolesProgressTextElement
    ) {

        rolesProgressTextElement.textContent =
            `${assigned}/${TEAM_SIZE} Roles Assigned`;

    }


    if (
        rolesProgressElement
    ) {

        const percentage =
            (
                assigned /
                TEAM_SIZE
            ) * 100;


        rolesProgressElement.style.width =
            `${Math.min(
                100,
                percentage
            )}%`;

    }

}


/* =========================================================
   SUBMIT BUTTON
   ========================================================= */

function updateSubmitButton() {

    if (!submitRolesButton) {
        return;
    }


    const validation =
        validateAssignments();


    submitRolesButton.disabled =
        rolesState.locked ||
        rolesState.submitted ||
        !rolesState.connected ||
        !validation.valid;

}


/* =========================================================
   SUBMIT ROLES
   ========================================================= */

function submitRoles() {

    if (
        rolesState.locked ||
        rolesState.submitted
    ) {

        return;

    }


    if (
        !rolesState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    if (!rolesState.matchId) {

        showMessage(
            "Match Code is missing.",
            "error"
        );

        return;

    }


    if (
        rolesState.playerNumber !== 1 &&
        rolesState.playerNumber !== 2
    ) {

        showMessage(
            "Player information is missing.",
            "error"
        );

        return;

    }


    const validation =
        validateAssignments();


    if (!validation.valid) {

        showMessage(
            validation.message,
            "warning"
        );

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
        "[ADG] Submitting roles:",
        payload
    );


    rolesSocket.emit(
        "roles:assign",
        payload
    );


    showMessage(
        "Roles submitted. Waiting for the other player.",
        "info"
    );

}


/* =========================================================
   SUBMIT EVENT
   ========================================================= */

if (submitRolesButton) {

    submitRolesButton.addEventListener(
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

            updateConnectionStatus(
                false,
                true
            );

            rolesSocket.connect();

        }

    }
);


/* =========================================================
   INITIALIZE UI
   ========================================================= */

setBattleName();

ensureMatchCodeDisplay();

renderRolesTeam();

updateRolesProgress();

updateSubmitButton();


/*
 * If Socket.IO has already connected before this code
 * finishes, make sure the UI reflects it.
 */

if (rolesSocket.connected) {

    updateConnectionStatus(
        true,
        false
    );

}


/* =========================================================
   GLOBAL ADG ACCESS
   ========================================================= */

window.ADG_ROLES_STATE =
    rolesState;


window.ADG_ROLES =
    {

        list:
            ADG_ROLES,

        state:
            rolesState,

        socket:
            rolesSocket,

        validate:
            validateAssignments,

        submit:
            submitRoles,

        reconnect:
            reconnectToMatch,

        copyMatchCode:
            copyMatchCode

    };


/* =========================================================
   END OF ROLES.JS
   ========================================================= */