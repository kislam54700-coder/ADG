/* =========================================================
   ADG — DRAFT.JS
   Anime Battle — Face to Face
   Private Online Multiplayer Draft Client
   ========================================================= */

"use strict";

/* =========================================================
   SOCKET
   ========================================================= */

const ADG_DRAFT_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";

const draftSocket = io(
    ADG_DRAFT_SERVER_URL,
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
   CONFIGURATION
   ========================================================= */

const ADG_DRAFT_CONFIG = {

    battleName:
        "Face to Face",

    teamSize:
        6,

    imageDirectory:
        "assets/characters/",

    rolesPage:
        "roles.html"

};


/* =========================================================
   STATE
   ========================================================= */

const draftState = {

    battleName:
        ADG_DRAFT_CONFIG.battleName,

    matchId:
        null,

    playerNumber:
        null,

    playerName:
        "",

    team:
        [],

    currentCharacter:
        null,

    dropToken:
        true,

    drawing:
        false,

    myTurn:
        false,

    draftComplete:
        false,

    connected:
        false,

    reconnecting:
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
            "ADG session read failed:",
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
            "ADG session write failed:",
            error
        );

    }

}


function removeSession(key) {

    try {

        sessionStorage.removeItem(key);

    } catch (error) {

        console.warn(
            "ADG session remove failed:",
            error
        );

    }

}


/* =========================================================
   RESTORE SESSION
   ========================================================= */

draftState.matchId =
    getSession(
        "adg_matchId"
    );

draftState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    ) || null;

draftState.playerName =
    getSession(
        "adg_playerName"
    ) || "";


/*
 * Battle name is always Face to Face.
 *
 * The client does not allow the player to change it.
 */

draftState.battleName =
    ADG_DRAFT_CONFIG.battleName;


/* =========================================================
   DOM
   ========================================================= */

const animeTitle =
    document.getElementById(
        "animeTitle"
    );

const draftTurn =
    document.getElementById(
        "draftTurn"
    );

const characterCard =
    document.getElementById(
        "characterCard"
    );

const characterImage =
    document.getElementById(
        "characterImage"
    );

const characterImageFallback =
    document.getElementById(
        "characterImageFallback"
    );

const characterName =
    document.getElementById(
        "characterName"
    );

const draftMessage =
    document.getElementById(
        "draftMessage"
    );

const draftTeam =
    document.getElementById(
        "draftTeam"
    );

const drawButton =
    document.getElementById(
        "drawCharacterButton"
    );

const dropButton =
    document.getElementById(
        "dropCharacterButton"
    );

const dropTokenCount =
    document.getElementById(
        "dropTokenCount"
    );

const draftStatus =
    document.getElementById(
        "draftStatus"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const globalMessage =
    document.getElementById(
        "adgMessage"
    );


/* =========================================================
   INITIAL UI
   ========================================================= */

/*
 * The existing HTML uses #animeTitle.
 *
 * We reuse that element as the Battle Name display.
 * No anime-selection logic exists here.
 */

if (animeTitle) {

    animeTitle.textContent =
        draftState.battleName;

}


updateConnectionUI(
    false
);

updateDropTokenUI();

renderTeam();

clearCurrentCharacter();

setDraftWaitingUI();


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = ""
) {

    const element =
        globalMessage ||
        draftStatus;

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
   CONNECTION UI
   ========================================================= */

function updateConnectionUI(
    connected
) {

    draftState.connected =
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
            "Disconnected";

        connectionStatus.classList.add(
            "disconnected"
        );

    }

}


/* =========================================================
   RECONNECT TO MATCH
   ========================================================= */

function reconnectToMatch() {

    if (!draftState.matchId) {

        showMessage(
            "Match information is missing.",
            "error"
        );

        return;

    }


    draftState.reconnecting =
        true;


    draftSocket.emit(
        "match:reconnect",
        {
            matchId:
                draftState.matchId
        }
    );

}


/* =========================================================
   SOCKET CONNECT
   ========================================================= */

draftSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );


        draftState.reconnecting =
            false;


        /*
         * Every connection/reconnection attempts
         * to restore the existing match.
         */

        reconnectToMatch();

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

draftSocket.on(
    "disconnect",
    () => {

        updateConnectionUI(
            false
        );


        draftState.reconnecting =
            true;


        draftState.drawing =
            false;


        setDraftWaitingUI();


        showMessage(
            "Connection lost. Reconnecting...",
            "error"
        );

    }
);


/* =========================================================
   SOCKET CONNECTION ERROR
   ========================================================= */

draftSocket.on(
    "connect_error",
    error => {

        updateConnectionUI(
            false
        );


        console.warn(
            "ADG draft socket connection error:",
            error
        );

    }
);


/* =========================================================
   MATCH RECONNECTED
   ========================================================= */

draftSocket.on(
    "match:reconnected",
    data => {

        draftState.reconnecting =
            false;


        applyMatchData(
            data
        );


        showMessage(
            "Match reconnected.",
            "success"
        );

    }
);


/* =========================================================
   PRIVATE DRAFT STATE
   ========================================================= */

draftSocket.on(
    "draft:state",
    data => {

        if (!data) {

            return;

        }


        applyDraftState(
            data
        );

    }
);


/* =========================================================
   APPLY MATCH DATA
   ========================================================= */

function applyMatchData(
    data
) {

    if (!data) {

        return;

    }


    if (data.matchId) {

        draftState.matchId =
            String(
                data.matchId
            );


        setSession(
            "adg_matchId",
            draftState.matchId
        );

    }


    if (
        data.playerNumber !==
        undefined &&
        data.playerNumber !==
        null
    ) {

        draftState.playerNumber =
            Number(
                data.playerNumber
            );


        setSession(
            "adg_playerNumber",
            draftState.playerNumber
        );

    }


    if (data.playerName) {

        draftState.playerName =
            String(
                data.playerName
            );


        setSession(
            "adg_playerName",
            draftState.playerName
        );

    }


    /*
     * Battle name is intentionally fixed.
     */

    draftState.battleName =
        ADG_DRAFT_CONFIG.battleName;


    if (animeTitle) {

        animeTitle.textContent =
            draftState.battleName;

    }


    /*
     * Some server implementations may send the
     * current draft state together with reconnect data.
     */

    if (
        data.draft &&
        typeof data.draft ===
        "object"
    ) {

        applyDraftState(
            data.draft
        );

    } else if (
        Array.isArray(
            data.team
        ) ||
        data.myTurn !== undefined ||
        data.draftComplete !== undefined
    ) {

        applyDraftState(
            data
        );

    }

}


/* =========================================================
   APPLY DRAFT STATE
   ========================================================= */

function applyDraftState(
    data
) {

    if (!data) {

        return;

    }


    if (
        Array.isArray(
            data.team
        )
    ) {

        draftState.team =
            normalizeTeam(
                data.team
            );

    }


    if (
        typeof data.dropToken ===
        "boolean"
    ) {

        draftState.dropToken =
            data.dropToken;

    }


    if (
        typeof data.myTurn ===
        "boolean"
    ) {

        draftState.myTurn =
            data.myTurn;

    }


    if (
        typeof data.draftComplete ===
        "boolean"
    ) {

        draftState.draftComplete =
            data.draftComplete;

    }


    if (
        data.playerNumber !==
        undefined &&
        data.playerNumber !==
        null
    ) {

        draftState.playerNumber =
            Number(
                data.playerNumber
            );


        setSession(
            "adg_playerNumber",
            draftState.playerNumber
        );

    }


    if (data.matchId) {

        draftState.matchId =
            String(
                data.matchId
            );


        setSession(
            "adg_matchId",
            draftState.matchId
        );

    }


    renderTeam();

    updateDropTokenUI();

    updateTurnUI();


    if (
        draftState.draftComplete
    ) {

        finishDraftUI();

    }

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


    const seen =
        new Set();

    const normalized =
        [];


    for (
        const character
        of team
    ) {

        const normalizedCharacter =
            typeof character ===
            "string"

                ? {
                    name:
                        character
                }

                : {
                    ...character
                };


        const name =
            String(
                normalizedCharacter.name ||
                ""
            ).trim();


        if (!name) {

            continue;

        }


        /*
         * Prevent duplicate characters on the
         * client even if bad duplicate data is sent.
         */

        const key =
            name.toLowerCase();


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(
            key
        );


        normalizedCharacter.name =
            name;


        normalized.push(
            normalizedCharacter
        );


        if (
            normalized.length >=
            ADG_DRAFT_CONFIG.teamSize
        ) {

            break;

        }

    }


    return normalized;

}


/* =========================================================
   SERVER — TURN UPDATE
   ========================================================= */

draftSocket.on(
    "draft:turn",
    data => {

        if (!data) {

            return;

        }


        if (
            data.playerNumber !==
            undefined &&
            data.playerNumber !==
            null
        ) {

            draftState.myTurn =
                Number(
                    data.playerNumber
                ) ===
                Number(
                    draftState.playerNumber
                );

        }


        if (
            typeof data.myTurn ===
            "boolean"
        ) {

            draftState.myTurn =
                data.myTurn;

        }


        updateTurnUI();

    }
);


/* =========================================================
   SERVER — CHARACTER DRAWN
   ========================================================= */

draftSocket.on(
    "draft:character",
    data => {

        if (!data) {

            return;

        }


        draftState.drawing =
            false;


        if (data.character) {

            draftState.currentCharacter =
                normalizeCharacter(
                    data.character
                );

        }


        if (
            Array.isArray(
                data.team
            )
        ) {

            draftState.team =
                normalizeTeam(
                    data.team
                );

        }


        if (
            typeof data.dropToken ===
            "boolean"
        ) {

            draftState.dropToken =
                data.dropToken;

        }


        renderCurrentCharacter();

        renderTeam();

        updateDropTokenUI();

        updateTurnUI();


        if (data.message) {

            showMessage(
                data.message,
                "success"
            );

        }


        playSound(
            "draft"
        );

    }
);


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
                ).trim()
        };

    }


    return {
        name:
            "Unknown"
    };

}


/* =========================================================
   SERVER — DROP SUCCESS
   ========================================================= */

draftSocket.on(
    "draft:dropped",
    data => {

        draftState.drawing =
            false;


        draftState.currentCharacter =
            null;


        if (
            Array.isArray(
                data?.team
            )
        ) {

            draftState.team =
                normalizeTeam(
                    data.team
                );

        }


        draftState.dropToken =
            false;


        clearCurrentCharacter();

        renderTeam();

        updateDropTokenUI();

        updateTurnUI();


        showMessage(
            "Character dropped. Draw your replacement.",
            "warning"
        );


        playSound(
            "button"
        );

    }
);


/* =========================================================
   SERVER — DRAFT COMPLETE
   ========================================================= */

draftSocket.on(
    "draft:complete",
    data => {

        draftState.draftComplete =
            true;


        draftState.myTurn =
            false;


        draftState.drawing =
            false;


        if (
            Array.isArray(
                data?.team
            )
        ) {

            draftState.team =
                normalizeTeam(
                    data.team
                );

        }


        renderTeam();

        finishDraftUI();


        showMessage(
            "Draft complete. Preparing Role Assignment...",
            "success"
        );

    }
);


/* =========================================================
   SERVER — ROLES PHASE
   ========================================================= */

draftSocket.on(
    "match:roles",
    data => {

        if (
            data?.matchId
        ) {

            draftState.matchId =
                String(
                    data.matchId
                );


            setSession(
                "adg_matchId",
                draftState.matchId
            );

        }


        window.location.href =
            ADG_DRAFT_CONFIG.rolesPage;

    }
);


/* =========================================================
   SERVER — DRAFT ERROR
   ========================================================= */

draftSocket.on(
    "draft:error",
    data => {

        draftState.drawing =
            false;


        showMessage(
            data?.message ||
            "Draft action was rejected.",
            "error"
        );


        updateTurnUI();

    }
);


/* =========================================================
   SERVER — MATCH ERROR
   ========================================================= */

draftSocket.on(
    "match:error",
    data => {

        draftState.drawing =
            false;


        showMessage(
            data?.message ||
            "Match error.",
            "error"
        );


        updateTurnUI();

    }
);


/* =========================================================
   DRAW BUTTON
   ========================================================= */

if (drawButton) {

    drawButton.addEventListener(
        "click",
        drawCharacter
    );

}


/* =========================================================
   DRAW CHARACTER
   ========================================================= */

function drawCharacter() {

    if (
        draftState.draftComplete
    ) {

        return;

    }


    if (
        !draftState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    if (
        !draftState.myTurn
    ) {

        showMessage(
            "It is not your turn.",
            "warning"
        );

        return;

    }


    if (
        draftState.team.length >=
        ADG_DRAFT_CONFIG.teamSize
    ) {

        showMessage(
            "Your team already has 6 characters.",
            "warning"
        );

        return;

    }


    if (
        draftState.drawing
    ) {

        return;

    }


    draftState.drawing =
        true;


    updateTurnUI();


    draftSocket.emit(
        "draft:draw",
        {
            matchId:
                draftState.matchId
        }
    );

}


/* =========================================================
   DROP BUTTON
   ========================================================= */

if (dropButton) {

    dropButton.addEventListener(
        "click",
        dropCharacter
    );

}


/* =========================================================
   DROP CHARACTER
   ========================================================= */

function dropCharacter() {

    if (
        !draftState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    if (
        draftState.draftComplete
    ) {

        return;

    }


    if (
        !draftState.dropToken
    ) {

        showMessage(
            "Your Drop Token has already been used.",
            "warning"
        );

        return;

    }


    if (
        draftState.team.length !==
        ADG_DRAFT_CONFIG.teamSize
    ) {

        showMessage(
            "You can use the Drop Token only after drafting 6 characters.",
            "warning"
        );

        return;

    }


    if (
        !draftState.myTurn
    ) {

        showMessage(
            "It is not your turn.",
            "warning"
        );

        return;

    }


    if (
        draftState.drawing
    ) {

        return;

    }


    const characterName =
        draftState.currentCharacter?.name ||
        null;


    if (!characterName) {

        showMessage(
            "There is no character to drop.",
            "warning"
        );

        return;

    }


    draftState.drawing =
        true;


    updateTurnUI();


    draftSocket.emit(
        "draft:drop",
        {
            matchId:
                draftState.matchId,

            character:
                characterName
        }
    );

}


/* =========================================================
   UPDATE TURN UI
   ========================================================= */

function updateTurnUI() {

    if (!draftTurn) {

        return;

    }


    if (
        draftState.draftComplete
    ) {

        draftTurn.textContent =
            "✓ DRAFT COMPLETE";

        draftTurn.className =
            "draft-turn complete";


        setButtonEnabled(
            drawButton,
            false
        );


        updateDropButton();

        return;

    }


    if (
        draftState.reconnecting
    ) {

        draftTurn.textContent =
            "Reconnecting...";

        draftTurn.className =
            "draft-turn waiting";


        setButtonEnabled(
            drawButton,
            false
        );


        updateDropButton();

        return;

    }


    if (
        draftState.drawing
    ) {

        draftTurn.textContent =
            "Drawing...";

        draftTurn.className =
            "draft-turn waiting";


        setButtonEnabled(
            drawButton,
            false
        );


        updateDropButton();

        return;

    }


    if (
        draftState.myTurn
    ) {

        draftTurn.textContent =
            "🔥 YOUR TURN";

        draftTurn.className =
            "draft-turn your-turn";


        setButtonEnabled(
            drawButton,
            draftState.team.length <
            ADG_DRAFT_CONFIG.teamSize
        );

    } else {

        draftTurn.textContent =
            "⏳ OPPONENT'S TURN";

        draftTurn.className =
            "draft-turn opponent-turn";


        setButtonEnabled(
            drawButton,
            false
        );

    }


    updateDropButton();

}


/* =========================================================
   DROP BUTTON UI
   ========================================================= */

function updateDropButton() {

    if (!dropButton) {

        return;

    }


    const canDrop =
        draftState.dropToken &&
        draftState.team.length ===
            ADG_DRAFT_CONFIG.teamSize &&
        draftState.myTurn &&
        !draftState.drawing &&
        !draftState.draftComplete &&
        !!draftState.currentCharacter;


    dropButton.disabled =
        !canDrop;


    if (
        draftState.team.length !==
        ADG_DRAFT_CONFIG.teamSize
    ) {

        dropButton.title =
            "Available after you draft 6 characters.";

    } else if (
        !draftState.dropToken
    ) {

        dropButton.title =
            "Drop Token already used.";

    } else if (
        !draftState.myTurn
    ) {

        dropButton.title =
            "You can only drop during your turn.";

    } else if (
        !draftState.currentCharacter
    ) {

        dropButton.title =
            "Draw a character before using Drop Token.";

    } else {

        dropButton.title =
            "Use your one Drop Token to redraw.";

    }

}


/* =========================================================
   DROP TOKEN UI
   ========================================================= */

function updateDropTokenUI() {

    if (!dropTokenCount) {

        return;

    }


    dropTokenCount.textContent =
        draftState.dropToken
            ? "1"
            : "0";


    dropTokenCount.classList.toggle(
        "used",
        !draftState.dropToken
    );


    updateDropButton();

}


/* =========================================================
   CHARACTER IMAGE PATH
   ========================================================= */

function getCharacterImagePath(
    name
) {

    /*
     * Character filenames are expected to match
     * the character name.
     *
     * Example:
     *
     * assets/characters/Goku.jpg
     * assets/characters/Naruto Uzumaki.jpg
     */

    return (
        ADG_DRAFT_CONFIG.imageDirectory +
        name +
        ".jpg"
    );

}


/* =========================================================
   CHARACTER IMAGE FALLBACK
   ========================================================= */

function showCharacterFallback(
    name
) {

    if (
        characterImage
    ) {

        characterImage.src =
            "";

        characterImage.classList.add(
            "hidden"
        );

    }


    if (
        characterImageFallback
    ) {

        characterImageFallback.classList.remove(
            "hidden"
        );


        const letter =
            characterImageFallback.querySelector(
                "span"
            );


        if (letter) {

            letter.textContent =
                name
                    .charAt(0)
                    .toUpperCase();

        }

    }

}


/* =========================================================
   SET CURRENT CHARACTER IMAGE
   ========================================================= */

function setCharacterImage(
    name
) {

    if (!characterImage) {

        return;

    }


    const imagePath =
        getCharacterImagePath(
            name
        );


    characterImage.classList.add(
        "hidden"
    );


    if (
        characterImageFallback
    ) {

        characterImageFallback.classList.remove(
            "hidden"
        );

    }


    characterImage.onload =
        () => {

            characterImage.classList.remove(
                "hidden"
            );


            if (
                characterImageFallback
            ) {

                characterImageFallback.classList.add(
                    "hidden"
                );

            }

        };


    characterImage.onerror =
        () => {

            showCharacterFallback(
                name
            );

        };


    characterImage.src =
        imagePath;

}


/* =========================================================
   RENDER CURRENT CHARACTER
   ========================================================= */

function renderCurrentCharacter() {

    const character =
        draftState.currentCharacter;


    if (!character) {

        clearCurrentCharacter();

        return;

    }


    const name =
        character.name ||
        "Unknown";


    if (characterName) {

        characterName.textContent =
            name;

    }


    if (draftMessage) {

        draftMessage.textContent =
            "Character drawn. Waiting for the next draft action.";

    }


    setCharacterImage(
        name
    );


    if (characterCard) {

        characterCard.classList.add(
            "character-drawn"
        );

    }

}


/* =========================================================
   CLEAR CURRENT CHARACTER
   ========================================================= */

function clearCurrentCharacter() {

    draftState.currentCharacter =
        null;


    if (characterName) {

        characterName.textContent =
            "Waiting for draw...";

    }


    if (draftMessage) {

        draftMessage.textContent =
            "Your character will appear here.";

    }


    showCharacterFallback(
        "?"
    );


    if (characterCard) {

        characterCard.classList.remove(
            "character-drawn"
        );

    }

}


/* =========================================================
   RENDER PRIVATE TEAM
   ========================================================= */

function renderTeam() {

    if (!draftTeam) {

        return;

    }


    draftTeam.innerHTML =
        "";


    const team =
        normalizeTeam(
            draftState.team
        );


    draftState.team =
        team;


    for (
        let i = 0;
        i < ADG_DRAFT_CONFIG.teamSize;
        i++
    ) {

        if (
            team[i]
        ) {

            draftTeam.appendChild(
                createTeamCard(
                    team[i],
                    i
                )
            );

        } else {

            draftTeam.appendChild(
                createEmptySlot(
                    i + 1
                )
            );

        }

    }

}


/* =========================================================
   CREATE EMPTY TEAM SLOT
   ========================================================= */

function createEmptySlot(
    slotNumber
) {

    const slot =
        document.createElement(
            "div"
        );


    slot.className =
        "draft-team-slot empty";


    slot.innerHTML = `
        <div class="draft-slot-number">
            ${slotNumber}
        </div>

        <div class="draft-slot-question">
            ?
        </div>

        <span>
            Empty
        </span>
    `;


    return slot;

}


/* =========================================================
   CREATE TEAM CARD
   ========================================================= */

function createTeamCard(
    character,
    index
) {

    const normalized =
        normalizeCharacter(
            character
        );


    const name =
        normalized.name ||
        "Unknown";


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "draft-team-slot filled";


    card.dataset.character =
        name;


    const image =
        document.createElement(
            "img"
        );


    image.alt =
        name;


    image.loading =
        "lazy";


    image.className =
        "hidden";


    const fallback =
        document.createElement(
            "div"
        );


    fallback.className =
        "draft-card-fallback";


    fallback.textContent =
        name
            .charAt(0)
            .toUpperCase();


    const imagePath =
        getCharacterImagePath(
            name
        );


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
        () => {

            image.classList.add(
                "hidden"
            );

            fallback.classList.remove(
                "hidden"
            );

        };


    image.src =
        imagePath;


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "draft-slot-number";


    number.textContent =
        String(
            index + 1
        );


    const nameElement =
        document.createElement(
            "span"
        );


    nameElement.className =
        "draft-character-name";


    nameElement.textContent =
        name;


    card.appendChild(
        number
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


    return card;

}


/* =========================================================
   WAITING UI
   ========================================================= */

function setDraftWaitingUI() {

    if (draftTurn) {

        draftTurn.textContent =
            draftState.reconnecting
                ? "Reconnecting..."
                : "Waiting for match...";

        draftTurn.className =
            "draft-turn waiting";

    }


    setButtonEnabled(
        drawButton,
        false
    );


    updateDropButton();

}


/* =========================================================
   COMPLETE UI
   ========================================================= */

function finishDraftUI() {

    draftState.draftComplete =
        true;


    draftState.myTurn =
        false;


    draftState.drawing =
        false;


    if (draftTurn) {

        draftTurn.textContent =
            "✓ DRAFT COMPLETE";

        draftTurn.className =
            "draft-turn complete";

    }


    setButtonEnabled(
        drawButton,
        false
    );


    if (dropButton) {

        dropButton.disabled =
            true;

    }


    if (draftMessage) {

        draftMessage.textContent =
            "Draft complete. Waiting for Role Assignment.";

    }

}


/* =========================================================
   BUTTON HELPER
   ========================================================= */

function setButtonEnabled(
    button,
    enabled
) {

    if (!button) {

        return;

    }


    button.disabled =
        !enabled;

}


/* =========================================================
   SOUND
   ========================================================= */

function playSound(
    soundName
) {

    if (
        window.ADG_SOUND &&
        typeof window.ADG_SOUND.play ===
        "function"
    ) {

        window.ADG_SOUND.play(
            soundName
        );

    }

}


/* =========================================================
   MATCH ENDED
   ========================================================= */

draftSocket.on(
    "match:ended",
    data => {

        draftState.drawing =
            false;


        draftState.myTurn =
            false;


        draftState.reconnecting =
            false;


        setDraftWaitingUI();


        showMessage(
            data?.message ||
            "The match has ended.",
            "error"
        );

    }
);


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden &&
            !draftSocket.connected
        ) {

            draftSocket.connect();

        }

    }
);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_DRAFT_STATE =
    draftState;

window.ADG_DRAFT = {

    state:
        draftState,

    socket:
        draftSocket,

    draw:
        drawCharacter,

    drop:
        dropCharacter,

    reconnect:
        reconnectToMatch

};


/* =========================================================
   END OF DRAFT.JS
   ========================================================= */