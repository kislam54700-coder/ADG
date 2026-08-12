/* =========================================================
   ADG — DRAFT.JS
   Face to Face — Private Multiplayer Draft Client
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

    battleName:
        "Face to Face",

    anime:
        "Face to Face",

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
        false

};


/* =========================================================
   SESSION / STORAGE HELPERS
   ========================================================= */

function getStorage(key) {

    try {

        return (
            sessionStorage.getItem(key) ||
            localStorage.getItem(key)
        );

    } catch (error) {

        console.warn(
            "[ADG] Storage read failed:",
            error
        );

        return null;

    }

}


function saveStorage(key, value) {

    try {

        sessionStorage.setItem(
            key,
            String(value)
        );

        localStorage.setItem(
            key,
            String(value)
        );

    } catch (error) {

        console.warn(
            "[ADG] Storage write failed:",
            error
        );

    }

}


function removeStorage(key) {

    try {

        sessionStorage.removeItem(key);
        localStorage.removeItem(key);

    } catch (error) {

        console.warn(
            "[ADG] Storage remove failed:",
            error
        );

    }

}


/* =========================================================
   RESTORE SESSION
   ========================================================= */

draftState.matchId =
    getStorage(
        "adg_matchId"
    );

draftState.playerNumber =
    Number(
        getStorage(
            "adg_playerNumber"
        )
    ) || null;

draftState.playerName =
    getStorage(
        "adg_playerName"
    ) || "";

draftState.battleName =
    getStorage(
        "adg_battleName"
    ) ||
    "Face to Face";


draftState.anime =
    "Face to Face";


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

const draftMatchId =
    document.getElementById(
        "draftMatchId"
    );

const copyDraftMatchId =
    document.getElementById(
        "copyDraftMatchId"
    );


/* =========================================================
   INITIAL UI
   ========================================================= */

if (animeTitle) {

    animeTitle.textContent =
        "Face to Face";

}


updateMatchCodeUI();

updateDropTokenUI();

updateConnectionUI(false);

renderTeam();

setDraftWaitingUI();


/* =========================================================
   MATCH ID
   ========================================================= */

function saveMatchId(matchId) {

    if (!matchId) {
        return;
    }

    const id =
        String(matchId)
            .trim()
            .toUpperCase();

    if (!id) {
        return;
    }

    draftState.matchId =
        id;

    saveStorage(
        "adg_matchId",
        id
    );

    updateMatchCodeUI();

    console.log(
        "[ADG] Match ID:",
        id
    );

}


function updateMatchCodeUI() {

    if (!draftMatchId) {
        return;
    }

    if (draftState.matchId) {

        draftMatchId.textContent =
            draftState.matchId;

    } else {

        draftMatchId.textContent =
            "Waiting...";

    }

}


/* =========================================================
   COPY MATCH ID
   ========================================================= */

if (copyDraftMatchId) {

    copyDraftMatchId.addEventListener(
        "click",
        async () => {

            const matchId =
                draftState.matchId;

            if (!matchId) {

                showMessage(
                    "Match code is not available yet.",
                    "warning"
                );

                return;

            }

            try {

                await navigator.clipboard.writeText(
                    matchId
                );

                copyDraftMatchId.textContent =
                    "✓ Copied";

                setTimeout(
                    () => {

                        copyDraftMatchId.textContent =
                            "📋 Copy";

                    },
                    1500
                );

            } catch (error) {

                console.warn(
                    "[ADG] Clipboard failed:",
                    error
                );

                showMessage(
                    `Match Code: ${matchId}`,
                    "info"
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

        console.log(
            "[ADG] Draft socket connected:",
            draftSocket.id
        );

        updateConnectionUI(
            true
        );

        /*
         * NEVER create a new match here.
         *
         * If a Match ID already exists,
         * reconnect to that exact match.
         */

        const matchId =
            draftState.matchId ||
            getStorage(
                "adg_matchId"
            );

        if (matchId) {

            saveMatchId(
                matchId
            );

            draftSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        matchId
                }
            );

        } else {

            showMessage(
                "Waiting for match information...",
                "warning"
            );

        }

    }
);


/* =========================================================
   SOCKET RECONNECTING
   ========================================================= */

draftSocket.io.on(
    "reconnect_attempt",
    () => {

        if (connectionStatus) {

            connectionStatus.textContent =
                "Reconnecting...";

        }

    }
);


/* =========================================================
   SOCKET RECONNECTED
   ========================================================= */

draftSocket.io.on(
    "reconnect",
    () => {

        console.log(
            "[ADG] Socket reconnected."
        );

        updateConnectionUI(
            true
        );

        if (draftState.matchId) {

            draftSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        draftState.matchId
                }
            );

        }

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

draftSocket.on(
    "disconnect",
    reason => {

        console.log(
            "[ADG] Draft disconnected:",
            reason
        );

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
   SERVER — MATCH RECONNECTED
   ========================================================= */

draftSocket.on(
    "match:reconnected",
    data => {

        console.log(
            "[ADG] Match reconnected:",
            data
        );

        if (!data) {
            return;
        }

        if (data.matchId) {

            saveMatchId(
                data.matchId
            );

        }

        if (
            typeof data.playerNumber ===
            "number"
        ) {

            draftState.playerNumber =
                data.playerNumber;

            saveStorage(
                "adg_playerNumber",
                data.playerNumber
            );

        }

        updateMatchCodeUI();

    }
);


/* =========================================================
   SERVER — DRAFT STATE
   ========================================================= */

draftSocket.on(
    "draft:state",
    data => {

        if (!data) {
            return;
        }

        if (data.matchId) {

            saveMatchId(
                data.matchId
            );

        }

        if (
            typeof data.playerNumber ===
            "number"
        ) {

            draftState.playerNumber =
                data.playerNumber;

            saveStorage(
                "adg_playerNumber",
                data.playerNumber
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

        renderTeam();

        updateDropTokenUI();

        updateTurnUI();

        if (
            draftState.draftComplete
        ) {

            finishDraftUI();

        }

    }
);


/* =========================================================
   SERVER — TURN
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

        playSound(
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
   SERVER — ROLES
   ========================================================= */

draftSocket.on(
    "match:roles",
    data => {

        if (
            data?.matchId
        ) {

            saveMatchId(
                data.matchId
            );

        }

        /*
         * Match ID remains stored.
         */

        window.location.href =
            "roles.html";

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

        showMessage(
            data?.message ||
            "Match error.",
            "error"
        );

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
            "Match ID is missing.",
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

    if (
        !draftState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }

    const name =
        draftState.currentCharacter?.name ||
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
        !draftState.connected
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
        draftState.dropToken &&
        draftState.team.length === TEAM_SIZE &&
        draftState.myTurn &&
        !draftState.drawing &&
        !draftState.draftComplete &&
        draftState.connected;

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

    if (
        draftState.dropToken
    ) {

        dropTokenCount.classList.remove(
            "used"
        );

    } else {

        dropTokenCount.classList.add(
            "used"
        );

    }

    updateDropButton();

}


/* =========================================================
   CURRENT CHARACTER
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
        getImageCandidates(
            name
        );

    let index =
        0;

    const tryImage =
        () => {

            if (
                index >=
                candidates.length
            ) {

                characterImage.src =
                    "";

                characterImage.classList.add(
                    "hidden"
                );

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

                return;

            }

            characterImage.src =
                candidates[index++];

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
        tryImage;

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

    tryImage();

}


/* =========================================================
   IMAGE CANDIDATES
   ========================================================= */

function getImageCandidates(
    name
) {

    const encoded =
        encodeURIComponent(
            name
        );

    return [

        `assets/characters/${encoded}.jpg`,

        `assets/characters/${encoded}.jpeg`,

        `assets/characters/${encoded}.png`,

        `assets/characters/${encoded}.webp`

    ];

}


/* =========================================================
   PRIVATE TEAM
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
   EMPTY SLOT
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
   TEAM CARD
   ========================================================= */

function createTeamCard(
    character,
    index
) {

    const name =
        typeof character ===
        "string"

            ? character

            : character?.name ||
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


    const candidates =
        getImageCandidates(
            name
        );

    let imageIndex =
        0;


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


    image.classList.add(
        "hidden"
    );

    fallback.classList.remove(
        "hidden"
    );

    tryImage();


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

        if (
            draftState.connected &&
            draftState.matchId
        ) {

            draftTurn.textContent =
                "Waiting for match...";

        } else {

            draftTurn.textContent =
                "Reconnecting...";

        }

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
   CHARACTER NORMALIZATION
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

    return {
        ...character
    };

}


function normalizeTeam(
    team
) {

    return team.map(
        normalizeCharacter
    );

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

        if (
            !document.hidden &&
            draftSocket.connected &&
            draftState.matchId
        ) {

            draftSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        draftState.matchId
                }
            );

        }

    }
);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_DRAFT_STATE =
    draftState;


/* =========================================================
   END OF ADG DRAFT.JS
   ========================================================= */