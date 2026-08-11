```javascript
/* =========================================================
   ADG — VICTORY.JS
   Victory / Defeat / Post-Match Client
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const victorySocket = io(
    window.location.origin,
    {
        transports: [
            "websocket",
            "polling"
        ]
    }
);


/* =========================================================
   STATE
   ========================================================= */

const victoryState = {

    connected: false,

    matchId: null,

    playerId: null,

    playerNumber: null,

    result: null,

    winner: null,

    loser: null,

    anime: "One Piece",

    rematchRequested: false

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

        return null;

    }

}


function saveSession(
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
            "Unable to save session data.",
            error
        );

    }

}


/* =========================================================
   LOAD SESSION
   ========================================================= */

victoryState.matchId =
    getSession(
        "adg_matchId"
    );

victoryState.playerId =
    getSession(
        "adg_playerId"
    );

victoryState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    );

victoryState.anime =
    getSession(
        "adg_anime"
    ) ||
    "One Piece";


/* =========================================================
   DOM
   ========================================================= */

const resultTitle =
    document.getElementById(
        "resultTitle"
    );

const resultSubtitle =
    document.getElementById(
        "resultSubtitle"
    );

const resultIcon =
    document.getElementById(
        "resultIcon"
    );

const winnerName =
    document.getElementById(
        "winnerName"
    );

const loserName =
    document.getElementById(
        "loserName"
    );

const rematchButton =
    document.getElementById(
        "rematchButton"
    );

const homeButton =
    document.getElementById(
        "homeButton"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const resultMessage =
    document.getElementById(
        "resultMessage"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const characterDetails =
    document.getElementById(
        "characterDetails"
    );

const matchHistory =
    document.getElementById(
        "matchHistory"
    );


/* =========================================================
   CONNECTION
   ========================================================= */

victorySocket.on(
    "connect",
    () => {

        victoryState.connected =
            true;

        updateConnectionStatus(
            true
        );

        requestResult();

    }
);


victorySocket.on(
    "disconnect",
    () => {

        victoryState.connected =
            false;

        updateConnectionStatus(
            false
        );

    }
);


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnectionStatus(
    connected
) {

    if (!connectionStatus) {
        return;
    }


    connectionStatus.textContent =
        connected
            ? "🟢 Connected"
            : "🔴 Disconnected";


    connectionStatus.classList.toggle(
        "connected",
        connected
    );


    connectionStatus.classList.toggle(
        "disconnected",
        !connected
    );

}


/* =========================================================
   REQUEST RESULT
   ========================================================= */

function requestResult() {

    if (
        !victoryState.matchId
    ) {

        showMessage(
            "Match information is missing.",
            "error"
        );

        return;

    }


    victorySocket.emit(
        "match:result",
        {
            matchId:
                victoryState.matchId
        }
    );

}


/* =========================================================
   RESULT RECEIVED
   ========================================================= */

victorySocket.on(
    "match:result",
    data => {

        if (!data) {
            return;
        }


        applyResult(
            data
        );

    }
);


/* =========================================================
   BATTLE FINISHED
   ========================================================= */

victorySocket.on(
    "battle:finished",
    data => {

        if (!data) {
            return;
        }


        applyResult(
            data
        );

    }
);


/* =========================================================
   APPLY RESULT
   ========================================================= */

function applyResult(
    data
) {

    if (
        data.matchId
    ) {

        victoryState.matchId =
            data.matchId;

        saveSession(
            "adg_matchId",
            data.matchId
        );

    }


    if (
        data.anime
    ) {

        victoryState.anime =
            data.anime;

    }


    victoryState.winner =
        data.winner ||
        null;


    victoryState.loser =
        data.loser ||
        null;


    victoryState.result =
        determinePlayerResult(
            data
        );


    renderResult(
        data
    );


    renderCharacterDetails(
        data
    );


    renderMatchHistory(
        data
    );


    playResultSound();

}


/* =========================================================
   DETERMINE RESULT
   ========================================================= */

function determinePlayerResult(
    data
) {

    const winnerId =
        getEntityId(
            data.winner
        );


    const loserId =
        getEntityId(
            data.loser
        );


    const playerId =
        String(
            victoryState.playerId ||
            ""
        );


    if (
        winnerId &&
        winnerId ===
        playerId
    ) {

        return "WIN";

    }


    if (
        loserId &&
        loserId ===
        playerId
    ) {

        return "LOSS";

    }


    const winnerNumber =
        Number(
            data.winnerPlayerNumber ||
            data.winnerNumber ||
            0
        );


    if (
        winnerNumber &&
        winnerNumber ===
        victoryState.playerNumber
    ) {

        return "WIN";

    }


    const loserNumber =
        Number(
            data.loserPlayerNumber ||
            data.loserNumber ||
            0
        );


    if (
        loserNumber &&
        loserNumber ===
        victoryState.playerNumber
    ) {

        return "LOSS";

    }


    if (
        data.result
    ) {

        const result =
            String(
                data.result
            ).toUpperCase();


        if (
            result === "WIN" ||
            result === "LOSS" ||
            result === "DRAW"
        ) {

            return result;

        }

    }


    return "DRAW";

}


/* =========================================================
   ENTITY ID
   ========================================================= */

function getEntityId(
    entity
) {

    if (!entity) {
        return null;
    }


    if (
        typeof entity ===
        "string" ||
        typeof entity ===
        "number"
    ) {

        return String(
            entity
        );

    }


    return String(
        entity.id ||
        entity.playerId ||
        entity.socketId ||
        ""
    ) || null;

}


/* =========================================================
   ENTITY NAME
   ========================================================= */

function getEntityName(
    entity,
    fallback
) {

    if (!entity) {

        return (
            fallback ||
            "Player"
        );

    }


    if (
        typeof entity ===
        "string"
    ) {

        return entity;

    }


    return (
        entity.name ||
        entity.playerName ||
        entity.username ||
        fallback ||
        "Player"
    );

}


/* =========================================================
   RENDER RESULT
   ========================================================= */

function renderResult(
    data
) {

    document.body.classList.remove(
        "victory-theme",
        "defeat-theme",
        "draw-theme"
    );


    if (
        victoryState.result ===
        "WIN"
    ) {

        document.body.classList.add(
            "victory-theme"
        );


        if (resultIcon) {

            resultIcon.textContent =
                "🏆";

        }


        if (resultTitle) {

            resultTitle.textContent =
                "VICTORY";

        }


        if (resultSubtitle) {

            resultSubtitle.textContent =
                "YOU WON THE BATTLE";

        }

    } else if (
        victoryState.result ===
        "LOSS"
    ) {

        document.body.classList.add(
            "defeat-theme"
        );


        if (resultIcon) {

            resultIcon.textContent =
                "💀";

        }


        if (resultTitle) {

            resultTitle.textContent =
                "DEFEAT";

        }


        if (resultSubtitle) {

            resultSubtitle.textContent =
                "YOU LOST THE BATTLE";

        }

    } else {

        document.body.classList.add(
            "draw-theme"
        );


        if (resultIcon) {

            resultIcon.textContent =
                "⚔️";

        }


        if (resultTitle) {

            resultTitle.textContent =
                "DRAW";

        }


        if (resultSubtitle) {

            resultSubtitle.textContent =
                "THE BATTLE ENDED IN A DRAW";

        }

    }


    const winner =
        getEntityName(
            data.winner,
            data.winnerName ||
            "Player 1"
        );


    const loser =
        getEntityName(
            data.loser,
            data.loserName ||
            "Player 2"
        );


    if (winnerName) {

        winnerName.textContent =
            winner;

    }


    if (loserName) {

        loserName.textContent =
            loser;

    }

}


/* =========================================================
   CHARACTER DETAILS
   ========================================================= */

function renderCharacterDetails(
    data
) {

    if (!characterDetails) {
        return;
    }


    characterDetails.innerHTML =
        "";


    const characters =
        data.characterDetails ||
        data.characters ||
        data.stats ||
        [];


    if (
        !Array.isArray(
            characters
        ) ||
        characters.length ===
        0
    ) {

        return;

    }


    characters.forEach(
        character => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "post-match-character";


            const image =
                document.createElement(
                    "img"
                );


            image.alt =
                character.name ||
                "Character";


            image.src =
                getCharacterImage(
                    character.name
                );


            image.onerror =
                () => {

                    image.style.display =
                        "none";

                };


            card.appendChild(
                image
            );


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "post-match-character-info";


            const name =
                document.createElement(
                    "h3"
                );


            name.textContent =
                character.name ||
                "Unknown";


            info.appendChild(
                name
            );


            const role =
                document.createElement(
                    "p"
                );


            role.textContent =
                `Role: ${
                    character.role ||
                    "Unknown"
                }`;


            info.appendChild(
                role
            );


            const hp =
                document.createElement(
                    "p"
                );


            hp.textContent =
                `HP: ${
                    character.hp ??
                    character.finalHp ??
                    0
                }`;


            info.appendChild(
                hp
            );


            const damageDealt =
                document.createElement(
                    "p"
                );


            damageDealt.textContent =
                `Damage Dealt: ${
                    character.damageDealt ??
                    0
                }`;


            info.appendChild(
                damageDealt
            );


            const damageReceived =
                document.createElement(
                    "p"
                );


            damageReceived.textContent =
                `Damage Received: ${
                    character.damageReceived ??
                    0
                }`;


            info.appendChild(
                damageReceived
            );


            const attacks =
                document.createElement(
                    "p"
                );


            attacks.textContent =
                `Attacks: ${
                    character.attacks ??
                    0
                }`;


            info.appendChild(
                attacks
            );


            const specials =
                document.createElement(
                    "p"
                );


            specials.textContent =
                `Specials: ${
                    character.specials ??
                    0
                }`;


            info.appendChild(
                specials
            );


            const kos =
                document.createElement(
                    "p"
                );


            kos.textContent =
                `KOs: ${
                    character.kos ??
                    0
                }`;


            info.appendChild(
                kos
            );


            card.appendChild(
                info
            );


            characterDetails.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CHARACTER IMAGE
   ========================================================= */

function getCharacterImage(
    name
) {

    if (!name) {

        return "";

    }


    const aliases = {

        "Monkey D. Luffy":
            "Luffy",

        "Roronoa Zoro":
            "Zoro",

        "Vinsmoke Sanji":
            "Sanji",

        "Nico Robin":
            "Robin",

        "Tony Tony Chopper":
            "Chopper",

        "Edward Newgate":
            "Whitebeard",

        "Marshall D. Teach":
            "Blackbeard",

        "Charlotte Linlin":
            "Big Mom",

        "Dracule Mihawk":
            "Mihawk",

        "Donquixote Doflamingo":
            "Doflamingo"

    };


    const filename =
        aliases[name] ||
        name;


    return (
        "assist/characters/one-piece/" +
        filename +
        ".jpg"
    );

}


/* =========================================================
   MATCH HISTORY
   ========================================================= */

function renderMatchHistory(
    data
) {

    if (!matchHistory) {
        return;
    }


    matchHistory.innerHTML =
        "";


    const history =
        data.matchHistory ||
        [];


    if (
        !Array.isArray(
            history
        ) ||
        history.length ===
        0
    ) {

        const empty =
            document.createElement(
                "p"
            );


        empty.textContent =
            "No previous matches available.";


        matchHistory.appendChild(
            empty
        );


        return;

    }


    history.forEach(
        match => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "match-history-row";


            const result =
                document.createElement(
                    "strong"
                );


            result.textContent =
                String(
                    match.result ||
                    "MATCH"
                ).toUpperCase();


            row.appendChild(
                result
            );


            const opponent =
                document.createElement(
                    "span"
                );


            opponent.textContent =
                match.opponentName ||
                "Opponent";


            row.appendChild(
                opponent
            );


            const date =
                document.createElement(
                    "time"
                );


            date.textContent =
                formatDate(
                    match.finishedAt ||
                    match.date
                );


            row.appendChild(
                date
            );


            matchHistory.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        undefined,
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"
        }
    );

}


/* =========================================================
   RESULT SOUND
   ========================================================= */

function playResultSound() {

    if (
        !window.ADG_SOUND
    ) {

        return;

    }


    if (
        victoryState.result ===
        "WIN"
    ) {

        window.ADG_SOUND.play(
            "victory"
        );

    } else if (
        victoryState.result ===
        "LOSS"
    ) {

        window.ADG_SOUND.play(
            "defeat"
        );

    }

}


/* =========================================================
   REMATCH
   ========================================================= */

if (rematchButton) {

    rematchButton.addEventListener(
        "click",
        requestRematch
    );

}


function requestRematch() {

    if (
        victoryState.rematchRequested
    ) {

        return;

    }


    if (
        !victoryState.connected
    ) {

        showMessage(
            "You are disconnected from the server.",
            "error"
        );

        return;

    }


    if (
        !victoryState.matchId
    ) {

        showMessage(
            "Match information is missing.",
            "error"
        );

        return;

    }


    victoryState.rematchRequested =
        true;


    rematchButton.disabled =
        true;


    rematchButton.textContent =
        "Waiting for opponent...";


    victorySocket.emit(
        "match:rematch",
        {
            matchId:
                victoryState.matchId
        }
    );


    showMessage(
        "Rematch request sent.",
        "info"
    );

}


/* =========================================================
   REMATCH ACCEPTED
   ========================================================= */

victorySocket.on(
    "match:rematch-ready",
    data => {

        const newMatchId =
            data?.matchId ||
            victoryState.matchId;


        saveSession(
            "adg_matchId",
            newMatchId
        );


        if (
            data?.playerNumber
        ) {

            saveSession(
                "adg_playerNumber",
                data.playerNumber
            );

        }


        /*
         * The new match starts with completely fresh
         * server-side teams, roles, HP, defeat states,
         * winner state and draft state.
         */

        showMessage(
            "Rematch ready! Starting a new draft...",
            "success"
        );


        setTimeout(
            () => {

                window.location.href =
                    "draft.html";

            },
            700
        );

    }
);


/* =========================================================
   OPPONENT REMATCH REQUEST
   ========================================================= */

victorySocket.on(
    "match:rematch-request",
    () => {

        showMessage(
            "Opponent wants a rematch.",
            "info"
        );


        /*
         * Automatically accept because the rematch is a
         * two-player session. The server creates a fresh
         * match state.
         */

        victorySocket.emit(
            "match:rematch-accept",
            {
                matchId:
                    victoryState.matchId
            }
        );

    }
);


/* =========================================================
   REMATCH ERROR
   ========================================================= */

victorySocket.on(
    "match:rematch-error",
    data => {

        victoryState.rematchRequested =
            false;


        if (rematchButton) {

            rematchButton.disabled =
                false;

            rematchButton.textContent =
                "REMATCH";

        }


        showMessage(
            data?.message ||
            "Unable to start rematch.",
            "error"
        );

    }
);


/* =========================================================
   HOME
   ========================================================= */

if (homeButton) {

    homeButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "index.html";

        }
    );

}


/* =========================================================
   PROFILE
   ========================================================= */

if (profileButton) {

    profileButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "profile.html";

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

    if (!resultMessage) {
        return;
    }


    resultMessage.textContent =
        message;


    resultMessage.className =
        "result-message";


    if (type) {

        resultMessage.classList.add(
            type
        );

    }


    resultMessage.classList.remove(
        "hidden"
    );


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                resultMessage.classList.add(
                    "hidden"
                );

            },
            5000
        );

}


/* =========================================================
   CLEAN OLD MATCH STATE
   ========================================================= */

function clearOldBattleState() {

    /*
     * These values are intentionally not reused for the
     * next match. The server creates a fresh match state.
     */

    try {

        sessionStorage.removeItem(
            "adg_battleState"
        );

        sessionStorage.removeItem(
            "adg_winner"
        );

        sessionStorage.removeItem(
            "adg_loser"
        );

    } catch (error) {

        console.warn(
            "Unable to clear old battle state.",
            error
        );

    }

}


clearOldBattleState();


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_VICTORY_STATE =
    victoryState;


/* =========================================================
   END OF VICTORY.JS
   ========================================================= */
```
