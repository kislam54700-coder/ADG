```javascript
/* =========================================================
   ADG — ROLES.JS
   Private Online Multiplayer Role Assignment Client
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const rolesSocket = io(
    window.location.origin,
    {
        transports: [
            "websocket",
            "polling"
        ]
    }
);


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_ROLES = [
    "Captain",
    "Vice-Captain",
    "Tank",
    "Healer",
    "Support",
    "Traitor"
];


const REQUIRED_TEAM_SIZE = 6;


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
        "One Piece",

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
   SESSION HELPERS
   ========================================================= */

function getSession(
    key
) {

    try {

        return sessionStorage.getItem(
            key
        );

    } catch (error) {

        console.warn(
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
            value
        );

    } catch (error) {

        console.warn(
            error
        );

    }

}


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
    );


rolesState.playerName =
    getSession(
        "adg_playerName"
    ) ||
    "";


rolesState.anime =
    getSession(
        "adg_anime"
    ) ||
    "One Piece";


/* =========================================================
   DOM
   ========================================================= */

const rolesAnimeTitle =
    document.getElementById(
        "animeTitle"
    );


const rolesTeam =
    document.getElementById(
        "rolesTeam"
    );


const rolesMessage =
    document.getElementById(
        "rolesMessage"
    );


const rolesSubmitButton =
    document.getElementById(
        "submitRolesButton"
    );


const rolesStatus =
    document.getElementById(
        "rolesStatus"
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
   INITIAL UI
   ========================================================= */

if (
    rolesAnimeTitle
) {

    rolesAnimeTitle.textContent =
        rolesState.anime;

}


renderRolesTeam();

updateRolesProgress();

updateSubmitButton();

updateConnectionUI(
    false
);


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


    if (
        !rolesConnectionStatus
    ) {

        return;

    }


    rolesConnectionStatus.classList.remove(
        "connected",
        "disconnected"
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
            "Disconnected";


        rolesConnectionStatus.classList.add(
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


        if (
            rolesState.matchId
        ) {

            rolesSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        rolesState.matchId
                }
            );

        } else {

            showRolesMessage(
                "Match information is missing.",
                "error"
            );

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


        showRolesMessage(
            "Connection lost. Reconnecting...",
            "error"
        );

    }
);


/* =========================================================
   SERVER — ROLES STATE
   ========================================================= */

rolesSocket.on(
    "roles:state",
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
                data.matchId;


            setSession(
                "adg_matchId",
                data.matchId
            );

        }


        if (
            data.anime
        ) {

            rolesState.anime =
                data.anime;


            if (
                rolesAnimeTitle
            ) {

                rolesAnimeTitle.textContent =
                    data.anime;

            }


            setSession(
                "adg_anime",
                data.anime
            );

        }


        if (
            data.playerNumber
        ) {

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


        /*
         * Only this player's team is accepted.
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


        renderRolesTeam();

        updateRolesProgress();

        updateSubmitButton();


        if (
            rolesState.submitted
        ) {

            showRolesMessage(
                "Your roles have been submitted.",
                "success"
            );

        }

    }
);


/* =========================================================
   SERVER — ROLE ERROR
   ========================================================= */

rolesSocket.on(
    "roles:error",
    data => {

        showRolesMessage(
            data?.message ||
            "Role assignment was rejected.",
            "error"
        );


        rolesState.submitted =
            false;


        updateSubmitButton();

    }
);


/* =========================================================
   SERVER — ROLES COMPLETE
   ========================================================= */

rolesSocket.on(
    "roles:complete",
    data => {

        rolesState.submitted =
            true;


        rolesState.locked =
            true;


        if (
            Array.isArray(
                data?.team
            )
        ) {

            rolesState.team =
                normalizeTeam(
                    data.team
                );

        }


        if (
            data?.assignments
        ) {

            rolesState.assignments =
                {
                    ...data.assignments
                };

        }


        renderRolesTeam();

        updateRolesProgress();

        updateSubmitButton();


        showRolesMessage(
            "Roles locked. Preparing battle...",
            "success"
        );

    }
);


/* =========================================================
   SERVER — BATTLE READY
   ========================================================= */

rolesSocket.on(
    "match:battle",
    data => {

        if (
            data?.matchId
        ) {

            rolesState.matchId =
                data.matchId;


            setSession(
                "adg_matchId",
                data.matchId
            );

        }


        window.location.href =
            "game.html";

    }
);


/* =========================================================
   SERVER — MATCH ERROR
   ========================================================= */

rolesSocket.on(
    "match:error",
    data => {

        showRolesMessage(
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

    return team
        .slice(
            0,
            REQUIRED_TEAM_SIZE
        )
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

                    ...character

                };

            }
        );

}


/* =========================================================
   FIND CHARACTER ID
   ========================================================= */

function getCharacterKey(
    character,
    index
) {

    if (
        character?.id
    ) {

        return String(
            character.id
        );

    }


    if (
        character?.name
    ) {

        return String(
            character.name
        );

    }


    return `character_${index}`;

}


/* =========================================================
   GET CHARACTER ROLE
   ========================================================= */

function getAssignedRole(
    character,
    index
) {

    const key =
        getCharacterKey(
            character,
            index
        );


    return (
        rolesState.assignments[
            key
        ] ||
        ""
    );

}


/* =========================================================
   SET CHARACTER ROLE
   ========================================================= */

function setCharacterRole(
    character,
    index,
    role
) {

    if (
        rolesState.locked
    ) {

        return false;

    }


    if (
        !ADG_ROLES.includes(
            role
        )
    ) {

        return false;

    }


    const key =
        getCharacterKey(
            character,
            index
        );


    rolesState.assignments[
        key
    ] =
        role;


    return true;

}


/* =========================================================
   ROLE COUNTS
   ========================================================= */

function getRoleCounts() {

    const counts = {};


    ADG_ROLES.forEach(
        role => {

            counts[
                role
            ] = 0;

        }
    );


    Object.values(
        rolesState.assignments
    )
    .forEach(
        role => {

            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    role
                )
            ) {

                counts[
                    role
                ]++;

            }

        }
    );


    return counts;

}


/* =========================================================
   VALIDATE ASSIGNMENTS
   ========================================================= */

function validateAssignments() {

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
            (
                character,
                index
            ) =>
                getAssignedRole(
                    character,
                    index
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
                role
            )
        ) {

            return {

                valid:
                    false,

                message:
                    `Missing role: ${role}.`

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
            "Waiting for your drafted team...";


        rolesTeam.appendChild(
            empty
        );

    }

}


/* =========================================================
   CREATE ROLE CARD
   ========================================================= */

function createRoleCard(
    character,
    index
) {

    const name =
        character?.name ||
        "Unknown";


    const key =
        getCharacterKey(
            character,
            index
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "roles-card";


    card.dataset.character =
        key;


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
        typeof getCharacterImageCandidates ===
            "function"
            ? getCharacterImageCandidates(
                name,
                rolesState.anime
            )
            : [
                `assist/characters/one-piece/${name}.jpg`
            ];


    let imageIndex =
        0;


    const tryImage =
        () => {

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

        };


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


    tryImage();


    const nameElement =
        document.createElement(
            "h3"
        );


    nameElement.className =
        "roles-character-name";


    nameElement.textContent =
        name;


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
                role;


            option.textContent =
                role;


            roleSelect.appendChild(
                option
            );

        }
    );


    const assignedRole =
        getAssignedRole(
            character,
            index
        );


    if (
        assignedRole
    ) {

        roleSelect.value =
            assignedRole;

    }


    roleSelect.disabled =
        rolesState.locked ||
        rolesState.submitted;


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
                roleSelect.value;


            /*
             * Prevent duplicate roles locally.
             * The server remains authoritative.
             */

            if (
                selectedRole &&
                isRoleAlreadyAssigned(
                    selectedRole,
                    key
                )
            ) {

                roleSelect.value =
                    assignedRole;


                showRolesMessage(
                    `${selectedRole} is already assigned.`,
                    "warning"
                );


                return;

            }


            if (
                selectedRole
            ) {

                setCharacterRole(
                    character,
                    index,
                    selectedRole
                );

            } else {

                delete rolesState.assignments[
                    key
                ];

            }


            updateRolesProgress();

            updateSubmitButton();

        }
    );


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
   CHECK DUPLICATE ROLE
   ========================================================= */

function isRoleAlreadyAssigned(
    role,
    exceptKey
) {

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
   PROGRESS
   ========================================================= */

function updateRolesProgress() {

    const assigned =
        rolesState.team.filter(
            (
                character,
                index
            ) =>
                Boolean(
                    getAssignedRole(
                        character,
                        index
                    )
                )
        ).length;


    const total =
        rolesState.team.length;


    if (
        rolesProgressText
    ) {

        rolesProgressText.textContent =
            `${assigned}/${REQUIRED_TEAM_SIZE} Roles Assigned`;

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
                ) *
                100
            );


        rolesProgress.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   SUBMIT BUTTON
   ========================================================= */

function updateSubmitButton() {

    if (
        !rolesSubmitButton
    ) {

        return;

    }


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


    rolesState.submitted =
        true;


    updateSubmitButton();


    rolesSocket.emit(
        "roles:submit",
        {
            matchId:
                rolesState.matchId,

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
            submitRoles

    };


/* =========================================================
   END OF ROLES.JS
   ========================================================= */
```
