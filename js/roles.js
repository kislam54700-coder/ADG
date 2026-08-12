/* =========================================================
   ADG — ROLES.JS
   Complete Role Assignment Client

   FIXES:
   - Correctly restores drafted team
   - Correctly restores role assignments
   - Synchronizes dropdowns with rolesState.assignments
   - Progress always reflects actual selected roles
   - Continue button unlocks when all 6 unique roles exist
   - Prevents duplicate roles
   - Handles server reconnect
   - Keeps Match ID and Player Number persistent
   - Private team only
   - Supports restored assignments from different formats
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


const VALID_ROLE_VALUES =
    new Set(
        ADG_ROLES.map(
            role => role.value
        )
    );


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


function setSession(key, value) {

    try {

        sessionStorage.setItem(
            key,
            value
        );

    } catch (error) {

        console.warn(
            "[ADG] Session write error:",
            error
        );

    }

}


/* =========================================================
   NORMALIZE PLAYER NUMBER
   ========================================================= */

function normalizePlayerNumber(value) {

    const number =
        Number(value);

    if (
        number === 1 ||
        number === 2
    ) {

        return number;

    }

    return null;

}


/* =========================================================
   INITIAL SESSION
   ========================================================= */

const savedPlayerNumber =
    normalizePlayerNumber(
        getSession(
            "adg_playerNumber"
        )
    );


/* =========================================================
   STATE
   ========================================================= */

const rolesState = {

    matchId:
        getSession(
            "adg_matchId"
        ),

    playerNumber:
        savedPlayerNumber,

    playerName:
        getSession(
            "adg_playerName"
        ) ||
        "",

    battleName:
        getSession(
            "adg_battleName"
        ) ||
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
                    rolesState.playerNumber
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
   SESSION SAVE
   ========================================================= */

function saveCoreSession() {

    if (
        rolesState.matchId
    ) {

        setSession(
            "adg_matchId",
            String(
                rolesState.matchId
            )
        );

    }


    if (
        rolesState.playerNumber === 1 ||
        rolesState.playerNumber === 2
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
        rolesState.battleName ||
        DEFAULT_BATTLE_NAME
    );

}


/* =========================================================
   NORMALIZE BATTLE NAME
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
   NORMALIZE CHARACTER
   ========================================================= */

function normalizeCharacter(character) {

    if (
        typeof character ===
        "string"
    ) {

        return {
            name:
                character.trim()
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
                    character.characterName ||
                    character.id ||
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

function normalizeTeam(team) {

    if (
        !Array.isArray(team)
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

   IMPORTANT:
   We use a normalized version of the name internally.

   This prevents:
   "Monkey D. Luffy"
   and
   "Monkey D. Luffy "

   from becoming different characters.
   ========================================================= */

function getCharacterKey(character) {

    const name =
        typeof character ===
        "string"
            ? character
            : character?.name;


    return String(
        name ||
        ""
    )
    .trim();

}


/* =========================================================
   NORMALIZE ROLE
   ========================================================= */

function normalizeRole(role) {

    if (
        role === null ||
        role === undefined
    ) {

        return "";

    }


    const value =
        String(role)
        .trim()
        .toLowerCase();


    if (
        VALID_ROLE_VALUES.has(value)
    ) {

        return value;

    }


    /*
     * Support labels from old/restored data.
     */

    const matchedRole =
        ADG_ROLES.find(
            item =>
                item.label
                    .toLowerCase() ===
                value
        );


    if (
        matchedRole
    ) {

        return matchedRole.value;

    }


    return "";

}


/* =========================================================
   NORMALIZE ASSIGNMENTS

   Supports formats like:

   {
       "Luffy": "captain"
   }

   OR

   [
       {
           character: "Luffy",
           role: "captain"
       }
   ]

   OR

   {
       "Luffy": {
           role: "captain"
       }
   }
   ========================================================= */

function normalizeAssignments(assignments) {

    const normalized =
        {};


    if (
        !assignments
    ) {

        return normalized;

    }


    /*
     * ARRAY FORMAT
     */

    if (
        Array.isArray(assignments)
    ) {

        assignments.forEach(
            item => {

                if (
                    !item ||
                    typeof item !==
                    "object"
                ) {

                    return;

                }


                const characterName =
                    String(
                        item.character ||
                        item.name ||
                        item.characterName ||
                        ""
                    )
                    .trim();


                const role =
                    normalizeRole(
                        item.role ||
                        item.value
                    );


                if (
                    characterName &&
                    role
                ) {

                    normalized[
                        characterName
                    ] =
                        role;

                }

            }
        );


        return normalized;

    }


    /*
     * OBJECT FORMAT
     */

    if (
        typeof assignments ===
        "object"
    ) {

        Object.entries(
            assignments
        )
        .forEach(
            (
                [
                    key,
                    value
                ]
            ) => {

                const characterName =
                    String(
                        key
                    )
                    .trim();


                let role =
                    "";


                if (
                    typeof value ===
                    "string"
                ) {

                    role =
                        normalizeRole(
                            value
                        );

                } else if (
                    value &&
                    typeof value ===
                    "object"
                ) {

                    role =
                        normalizeRole(
                            value.role ||
                            value.value
                        );

                }


                if (
                    characterName &&
                    role
                ) {

                    normalized[
                        characterName
                    ] =
                        role;

                }

            }
        );

    }


    return normalized;

}


/* =========================================================
   SYNCHRONIZE ASSIGNMENTS WITH TEAM

   THIS IS THE MAIN FIX.

   The server may return assignments with slightly
   different key formats.

   This function maps assignments back to the exact
   character names currently inside rolesState.team.
   ========================================================= */

function synchronizeAssignments() {

    const currentAssignments =
        normalizeAssignments(
            rolesState.assignments
        );


    const synchronized =
        {};


    rolesState.team.forEach(
        character => {

            const exactKey =
                getCharacterKey(
                    character
                );


            if (
                !exactKey
            ) {

                return;

            }


            /*
             * Exact match first.
             */

            let role =
                currentAssignments[
                    exactKey
                ] ||
                "";


            /*
             * Case-insensitive fallback.
             */

            if (
                !role
            ) {

                const foundEntry =
                    Object.entries(
                        currentAssignments
                    )
                    .find(
                        (
                            [
                                savedKey
                            ]
                        ) =>

                            savedKey
                                .trim()
                                .toLowerCase() ===
                            exactKey
                                .trim()
                                .toLowerCase()
                    );


                if (
                    foundEntry
                ) {

                    role =
                        foundEntry[1];

                }

            }


            role =
                normalizeRole(
                    role
                );


            if (
                role
            ) {

                synchronized[
                    exactKey
                ] =
                    role;

            }

        }
    );


    rolesState.assignments =
        synchronized;

}


/* =========================================================
   GET ASSIGNED ROLE
   ========================================================= */

function getAssignedRole(character) {

    const key =
        getCharacterKey(
            character
        );


    if (
        !key
    ) {

        return "";

    }


    return normalizeRole(
        rolesState.assignments[
            key
        ]
    );

}


/* =========================================================
   SET CHARACTER ROLE
   ========================================================= */

function setCharacterRole(
    character,
    role
) {

    if (
        rolesState.locked ||
        rolesState.submitted
    ) {

        return false;

    }


    const key =
        getCharacterKey(
            character
        );


    const normalizedRole =
        normalizeRole(
            role
        );


    if (
        !key ||
        !normalizedRole
    ) {

        return false;

    }


    rolesState.assignments[
        key
    ] =
        normalizedRole;


    synchronizeAssignments();


    return true;

}


/* =========================================================
   CHECK DUPLICATE ROLE
   ========================================================= */

function isRoleAlreadyAssigned(
    role,
    exceptKey
) {

    const normalizedRole =
        normalizeRole(
            role
        );


    if (
        !normalizedRole
    ) {

        return false;

    }


    return rolesState.team.some(
        character => {

            const key =
                getCharacterKey(
                    character
                );


            if (
                key ===
                exceptKey
            ) {

                return false;

            }


            return (
                getAssignedRole(
                    character
                ) ===
                normalizedRole
            );

        }
    );

}


/* =========================================================
   COUNT ASSIGNED ROLES

   Only counts assignments belonging to the current team.

   This prevents old assignments from affecting progress.
   ========================================================= */

function getAssignedCount() {

    return rolesState.team.filter(
        character =>
            Boolean(
                getAssignedRole(
                    character
                )
            )
    ).length;

}


/* =========================================================
   VALIDATE ASSIGNMENTS
   ========================================================= */

function validateAssignments() {

    synchronizeAssignments();


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


    const allRequiredRoles =
        ADG_ROLES.every(
            role =>
                assignedRoles.includes(
                    role.value
                )
        );


    if (
        !allRequiredRoles
    ) {

        return {
            valid:
                false,

            message:
                "All six unique roles are required."
        };

    }


    return {
        valid:
            true,

        message:
            "All roles assigned."
    };

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
        Boolean(
            connected
        );


    if (
        rolesConnectionStatus
    ) {

        rolesConnectionStatus.classList.remove(
            "connected",
            "disconnected"
        );


        if (
            rolesState.connected
        ) {

            rolesConnectionStatus.textContent =
                "Connected";

            rolesConnectionStatus.classList.add(
                "connected"
            );

        } else {

            rolesConnectionStatus.textContent =
                "Disconnected";

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

    const codeElement =
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
                "textarea"
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
   CONNECT COPY BUTTON IF PRESENT
   ========================================================= */

const copyMatchCodeButton =
    document.getElementById(
        "copyMatchCodeButton"
    );


if (
    copyMatchCodeButton
) {

    copyMatchCodeButton.addEventListener(
        "click",
        copyMatchCode
    );

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


    synchronizeAssignments();


    rolesTeam.innerHTML =
        "";


    if (
        rolesState.team.length ===
        0
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


        updateRolesProgress();
        updateSubmitButton();

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


    updateRolesProgress();
    updateSubmitButton();

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


    /*
     * Support both CSS class names.
     */

    card.className =
        "role-card roles-card";


    card.dataset.character =
        key;


    /* -----------------------------------------------------
       IMAGE
       ----------------------------------------------------- */

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


    /*
     * Database helper if available.
     */

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


    /*
     * Direct image paths.
     */

    const encodedName =
        encodeURIComponent(
            name
        );


    const imagePaths = [
        `assets/characters/${encodedName}.jpg`,
        `assets/characters/${encodedName}.png`,
        `assets/characters/${encodedName}.webp`
    ];


    imagePaths.forEach(
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


    function tryNextImage() {

        if (
            imageIndex >=
            candidates.length
        ) {

            image.style.display =
                "none";


            fallback.style.display =
                "flex";

            return;

        }


        image.src =
            candidates[
                imageIndex++
            ];

    }


    image.onload =
        () => {

            image.style.display =
                "block";


            fallback.style.display =
                "none";

        };


    image.onerror =
        tryNextImage;


    fallback.style.display =
        "flex";


    tryNextImage();


    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

    const nameElement =
        document.createElement(
            "h3"
        );


    nameElement.className =
        "roles-character-name";


    nameElement.textContent =
        name;


    /* -----------------------------------------------------
       ROLE SELECT
       ----------------------------------------------------- */

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


    /*
     * IMPORTANT:
     * Read directly from synchronized state.
     */

    const assignedRole =
        getAssignedRole(
            character
        );


    roleSelect.value =
        assignedRole;


    roleSelect.disabled =
        rolesState.locked ||
        rolesState.submitted;


    /* -----------------------------------------------------
       CHANGE EVENT
       ----------------------------------------------------- */

    roleSelect.addEventListener(
        "change",
        () => {

            if (
                rolesState.locked ||
                rolesState.submitted
            ) {

                return;

            }


            const selectedRole =
                normalizeRole(
                    roleSelect.value
                );


            /*
             * Remove assignment.
             */

            if (
                !selectedRole
            ) {

                delete rolesState.assignments[
                    key
                ];


                synchronizeAssignments();

                updateRolesProgress();

                updateSubmitButton();

                return;

            }


            /*
             * Prevent duplicate.
             */

            if (
                isRoleAlreadyAssigned(
                    selectedRole,
                    key
                )
            ) {

                const previousRole =
                    getAssignedRole(
                        character
                    );


                roleSelect.value =
                    previousRole ||
                    "";


                const roleInfo =
                    ADG_ROLES.find(
                        item =>
                            item.value ===
                            selectedRole
                    );


                showRolesMessage(
                    `${
                        roleInfo?.label ||
                        selectedRole
                    } is already assigned.`,
                    "warning"
                );


                return;

            }


            /*
             * SAVE ROLE
             */

            rolesState.assignments[
                key
            ] =
                selectedRole;


            /*
             * THIS IS IMPORTANT.
             * Immediately synchronize the assignment
             * before calculating progress.
             */

            synchronizeAssignments();


            /*
             * Update UI immediately.
             */

            updateRolesProgress();

            updateSubmitButton();

        }
    );


    /* -----------------------------------------------------
       CARD CONTENT
       ----------------------------------------------------- */

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

   FIX:
   Progress is calculated directly from the current team
   and current assignments.
   ========================================================= */

function updateRolesProgress() {

    synchronizeAssignments();


    const assigned =
        getAssignedCount();


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
                Math.round(
                    (
                        assigned /
                        REQUIRED_TEAM_SIZE
                    ) *
                    100
                )
            );


        rolesProgress.style.width =
            `${percentage}%`;

    }


    /*
     * Update button every time progress changes.
     */

    updateSubmitButton();

}


/* =========================================================
   UPDATE CONTINUE BUTTON
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
     * The button is enabled ONLY when:
     *
     * 1. Connected
     * 2. Exactly 6 characters
     * 3. All 6 have roles
     * 4. All roles are unique
     * 5. Not already submitted
     */

    const canSubmit =
        rolesState.connected &&
        !rolesState.submitted &&
        !rolesState.locked &&
        validation.valid;


    rolesSubmitButton.disabled =
        !canSubmit;


    /*
     * Helpful state class.
     */

    rolesSubmitButton.classList.toggle(
        "ready",
        canSubmit
    );

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


    /*
     * Final synchronization before sending.
     */

    synchronizeAssignments();


    const validation =
        validateAssignments();


    if (
        !validation.valid
    ) {

        showRolesMessage(
            validation.message,
            "warning"
        );

        updateRolesProgress();

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
        "[ADG] Sending role assignments:",
        payload
    );


    rolesSocket.emit(
        "roles:assign",
        payload
    );


    showRolesMessage(
        "Roles submitted. Waiting for the other player.",
        "info"
    );

}


/* =========================================================
   SUBMIT BUTTON
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


    renderRolesTeam();


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

        updateConnectionUI(
            false
        );


        rolesState.restoring =
            false;


        showRolesMessage(
            "Connection lost. Reconnecting...",
            "error"
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


        applyServerState(
            data
        );


        rolesState.restoring =
            false;


        showRolesMessage(
            "Match restored.",
            "success"
        );

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


        applyServerState(
            data
        );


        rolesState.restoring =
            false;

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


        applyServerState(
            data
        );


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
   APPLY SERVER STATE

   ONE central function handles ALL server state.

   This prevents draft:state and roles:state from behaving
   differently.
   ========================================================= */

function applyServerState(data) {

    if (
        !data ||
        typeof data !==
        "object"
    ) {

        return;

    }


    /*
     * MATCH ID
     */

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


    /*
     * PLAYER NUMBER
     */

    const serverPlayerNumber =
        normalizePlayerNumber(
            data.playerNumber
        );


    if (
        serverPlayerNumber
    ) {

        rolesState.playerNumber =
            serverPlayerNumber;

    }


    /*
     * PLAYER NAME
     */

    if (
        data.playerName
    ) {

        rolesState.playerName =
            String(
                data.playerName
            );

    }


    /*
     * BATTLE NAME
     */

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


    /*
     * TEAM
     */

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


    /*
     * ASSIGNMENTS

     * IMPORTANT:
     * Only replace assignments when the server
     * actually sends them.
     */

    if (
        data.assignments !==
        undefined
    ) {

        rolesState.assignments =
            normalizeAssignments(
                data.assignments
            );

    }


    /*
     * SUBMITTED
     */

    if (
        typeof data.submitted ===
        "boolean"
    ) {

        rolesState.submitted =
            data.submitted;

    }


    /*
     * LOCKED
     */

    if (
        typeof data.locked ===
        "boolean"
    ) {

        rolesState.locked =
            data.locked;

    }


    /*
     * COMPLETE
     */

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


    /*
     * CRITICAL FIX:
     * Synchronize assignments AFTER team is restored.
     */

    synchronizeAssignments();


    saveCoreSession();


    createMatchCodeDisplay();


    renderRolesTeam();


    updateRolesProgress();


    updateSubmitButton();


    console.log(
        "[ADG] Roles state updated:",
        {
            team:
                rolesState.team,

            assignments:
                rolesState.assignments,

            assignedCount:
                getAssignedCount(),

            validation:
                validateAssignments()
        }
    );

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


        applyServerState(
            data
        );

    }
);


/* =========================================================
   ROLE ERROR
   ========================================================= */

function handleRoleError(data) {

    rolesState.submitted =
        false;

    rolesState.locked =
        false;


    updateRolesProgress();


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


        showRolesMessage(
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
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden
        ) {

            if (
                !rolesSocket.connected
            ) {

                rolesSocket.connect();

            } else {

                reconnectToMatch();

            }

        }

    }
);


/* =========================================================
   INITIALIZE UI
   ========================================================= */

updateBattleName(
    rolesState.battleName
);


createMatchCodeDisplay();


updateConnectionUI(
    false
);


renderRolesTeam();


updateRolesProgress();


updateSubmitButton();


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
            synchronizeAssignments

    };


/* =========================================================
   END OF ROLES.JS
   ========================================================= */