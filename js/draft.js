/* =========================================================
   ADG — DRAFT.JS
   Private Online Multiplayer Draft Client
   Clean / Reconnect-Safe Version
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";

const TEAM_SIZE = 6;


/* =========================================================
   SOCKET
   ========================================================= */

const draftSocket = io(
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

const draftState = {

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
            "Unable to read session:",
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
            "Unable to save session:",
            error
        );
    }
}


function removeSession(key) {

    try {

        sessionStorage.removeItem(key);

    } catch (error) {

        console.warn(
            "Unable to remove session:",
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

draftState.anime =
    getSession(
        "adg_anime"
    ) || "One Piece";


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

if (animeTitle) {

    animeTitle.textContent =
        draftState.anime;
}


renderTeam();

updateDropTokenUI();

updateConnectionUI(
    false
);

setDraftWaitingUI();


/* =========================================================
   MESSAGE SYSTEM
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
            4000
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
   SOCKET CONNECT
   ========================================================= */

draftSocket.on(
    "connect",
    () => {

        draftState.connected =
            true;

        draftState.reconnecting =
            false;

        updateConnectionUI(
            true
        );

        /*
         * The player must already have a match ID
         * from the lobby.
         */

        if (!draftState.matchId) {

            showMessage(
                "Match information is missing. Returning to lobby...",
                "error"
            );

            setTimeout(
                () => {

                    window.location.href =
                        "index.html";

                },
                1200
            );

            return;
        }


        /*
         * Reconnect to the existing match.
         *
         * The server should identify the player using
         * the match ID + socket/session information.
         */

        draftSocket.emit(
            "match:reconnect",
            {
                matchId:
                    draftState.matchId,

                playerNumber:
                    draftState.playerNumber
            }
        );

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

draftSocket.on(
    "disconnect",
    () => {

        draftState.connected =
            false;

        draftState.reconnecting =
            true;

        draftState.drawing =
            false;

        draftState.myTurn =
            false;

        updateConnectionUI(
            false
        );

        setDraftWaitingUI();

        showMessage(
            "Connection lost. Reconnecting...",
            "error"
        );
    }
);


/* =========================================================
   SOCKET CONNECT ERROR
   ========================================================= */

draftSocket.on(
    "connect_error",
    error => {

        draftState.connected =
            false;

        updateConnectionUI(
            false
        );

        console.warn(
            "ADG draft socket error:",
            error
        );

        showMessage(
            "Unable to connect to the game server.",
            "error"
        );
    }
);


/* =========================================================
   MATCH RECONNECTED
   ========================================================= */

draftSocket.on(
    "match:reconnected",
    data => {

        if (!data) {
            return;
        }

        applyMatchData(
            data
        );

        showMessage(
            "Reconnected to your match.",
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
            data.matchId;

        setSession(
            "adg_matchId",
            data.matchId
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
            data.playerName;

        setSession(
            "adg_playerName",
            data.playerName
        );
    }

    if (data.anime) {

        draftState.anime =
            data.anime;

        setSession(
            "adg_anime",
            data.anime
        );

        if (animeTitle) {

            animeTitle.textContent =
                data.anime;
        }
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


    applyMatchData(
        data
    );


    /*
     * PRIVATE TEAM ONLY
     */

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
        data.currentCharacter
    ) {

        draftState.currentCharacter =
            normalizeCharacter(
                data.currentCharacter
            );

    }


    renderCurrentCharacter();

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
            ...character
        };
    }

    return null;
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
        .map(
            normalizeCharacter
        )
        .filter(
            character =>
                character &&
                character.name
        )
        .slice(
            0,
            TEAM_SIZE
        );
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
            typeof data.playerNumber ===
            "number"
        ) {

            draftState.myTurn =
                data.playerNumber ===
                draftState.playerNumber;
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


        playADGSound(
            "draft"
        );
    }
);


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

        draftState.dropToken =
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


        clearCurrentCharacter();

        renderTeam();

        updateDropTokenUI();

        updateTurnUI();


        showMessage(
            "Character dropped. Draw your replacement.",
            "warning"
        );


        playADGSound(
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


        playADGSound(
            "victory"
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
                data.matchId;

            setSession(
                "adg_matchId",
                data.matchId
            );
        }


        /*
         * Small delay gives the UI time to display
         * the completed draft message.
         */

        setTimeout(
            () => {

                window.location.href =
                    "roles.html";

            },
            400
        );
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
        !draftState.matchId
    ) {

        showMessage(
            "Match information is missing.",
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
        TEAM_SIZE
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


    playADGSound(
        "button"
    );


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
        TEAM_SIZE
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


    const character =
        draftState.currentCharacter;


    const name =
        character?.name ||
        null;


    draftState.drawing =
        true;


    updateTurnUI();


    draftSocket.emit(
        "draft:drop",
        {
            matchId:
                draftState.matchId,

            character:
                name
        }
    );


    playADGSound(
        "button"
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
        !draftState.connected
    ) {

        draftTurn.textContent =
            "Connecting...";

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
            "🎲 Drawing...";

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
            TEAM_SIZE
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
        draftState.connected &&
        draftState.dropToken &&
        draftState.team.length ===
            TEAM_SIZE &&
        draftState.myTurn &&
        !draftState.drawing &&
        !draftState.draftComplete;


    dropButton.disabled =
        !canDrop;


    if (
        draftState.team.length !==
        TEAM_SIZE
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
        draftState.drawing
    ) {

        dropButton.title =
            "Waiting for server...";

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
            "Character drawn. Waiting for the draft action.";
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


    if (characterImage) {

        characterImage.src =
            "";

        characterImage.classList.add(
            "hidden"
        );
    }


    if (characterImageFallback) {

        characterImageFallback.classList.remove(
            "hidden"
        );

        const letter =
            characterImageFallback.querySelector(
                "span"
            );

        if (letter) {

            letter.textContent =
                "?";
        }
    }


    if (characterCard) {

        characterCard.classList.remove(
            "character-drawn"
        );
    }
}


/* =========================================================
   CHARACTER IMAGE
   ========================================================= */

function setCharacterImage(
    name
) {

    if (!characterImage) {
        return;
    }


    const candidates =
        typeof getCharacterImageCandidates ===
        "function"
            ? getCharacterImageCandidates(
                name,
                draftState.anime
            )
            : [
                `assist/characters/one-piece/${name}.jpg`
            ];


    if (
        !Array.isArray(
            candidates
        ) ||
        candidates.length === 0
    ) {

        showCharacterImageFallback(
            name
        );

        return;
    }


    let index =
        0;


    characterImage.classList.add(
        "hidden"
    );


    if (characterImageFallback) {

        characterImageFallback.classList.remove(
            "hidden"
        );
    }


    const tryNextImage =
        () => {

            if (
                index >=
                candidates.length
            ) {

                showCharacterImageFallback(
                    name
                );

                return;
            }


            characterImage.src =
                candidates[
                    index++
                ];
        };


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
        tryNextImage;


    tryNextImage();
}


/* =========================================================
   CHARACTER IMAGE FALLBACK
   ========================================================= */

function showCharacterImageFallback(
    name
) {

    if (characterImage) {

        characterImage.src =
            "";

        characterImage.classList.add(
            "hidden"
        );
    }


    if (characterImageFallback) {

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
   RENDER PRIVATE TEAM
   ========================================================= */

function renderTeam() {

    if (!draftTeam) {
        return;
    }


    draftTeam.innerHTML =
        "";


    for (
        let i = 0;
        i < TEAM_SIZE;
        i++
    ) {

        if (
            draftState.team[i]
        ) {

            draftTeam.appendChild(
                createTeamCard(
                    draftState.team[i],
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
   CREATE EMPTY SLOT
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
        normalized?.name ||
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


    const candidates =
        typeof getCharacterImageCandidates ===
        "function"
            ? getCharacterImageCandidates(
                name,
                draftState.anime
            )
            : [
                `assist/characters/one-piece/${name}.jpg`
            ];


    let imageIndex =
        0;


    const tryNextImage =
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
        tryNextImage;


    tryNextImage();


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
            draftState.connected
                ? "Waiting for opponent..."
                : "Waiting for connection...";

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

function playADGSound(
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

        draftState.draftComplete =
            true;


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


/* =========================================================
   END OF DRAFT.JS
   ========================================================= */

