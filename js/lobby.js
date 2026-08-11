```javascript
/* =========================================================
   ADG — LOBBY.JS
   Multiplayer Lobby Controller
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const lobbySocket = io(
    window.location.origin,
    {
        transports: [
            "websocket",
            "polling"
        ],
        reconnection: true
    }
);


/* =========================================================
   STATE
   ========================================================= */

const lobbyState = {

    connected: false,

    playerId: null,

    playerName: "",

    matchId: null,

    matchCode: null,

    anime: "One Piece",

    playerNumber: null,

    opponentJoined: false

};


/* =========================================================
   SESSION
   ========================================================= */

function lobbyGet(
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


function lobbySet(
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
            "Unable to save lobby session.",
            error
        );

    }

}


lobbyState.playerId =
    lobbyGet(
        "adg_playerId"
    );

lobbyState.playerName =
    lobbyGet(
        "adg_playerName"
    ) ||
    "Player";

lobbyState.matchId =
    lobbyGet(
        "adg_matchId"
    );

lobbyState.matchCode =
    lobbyGet(
        "adg_matchCode"
    );

lobbyState.anime =
    lobbyGet(
        "adg_anime"
    ) ||
    "One Piece";

lobbyState.playerNumber =
    Number(
        lobbyGet(
            "adg_playerNumber"
        )
    ) || null;


/* =========================================================
   DOM
   ========================================================= */

const lobbyStatus =
    document.getElementById(
        "lobbyStatus"
    );

const matchCodeElement =
    document.getElementById(
        "matchCode"
    );

const animeElement =
    document.getElementById(
        "lobbyAnime"
    );

const playerNameElement =
    document.getElementById(
        "lobbyPlayerName"
    );

const opponentElement =
    document.getElementById(
        "lobbyOpponent"
    );

const connectionElement =
    document.getElementById(
        "connectionStatus"
    );

const copyCodeButton =
    document.getElementById(
        "copyMatchCode"
    );

const cancelButton =
    document.getElementById(
        "cancelMatch"
    );


/* =========================================================
   CONNECTION
   ========================================================= */

lobbySocket.on(
    "connect",
    () => {

        lobbyState.connected =
            true;


        lobbyState.playerId =
            lobbyState.playerId ||
            lobbySocket.id;


        lobbySet(
            "adg_playerId",
            lobbyState.playerId
        );


        updateConnection(
            true
        );


        identifyPlayer();

        requestMatchState();

    }
);


lobbySocket.on(
    "disconnect",
    () => {

        lobbyState.connected =
            false;


        updateConnection(
            false
        );


        updateStatus(
            "Disconnected from server.",
            "error"
        );

    }
);


lobbySocket.on(
    "connect_error",
    () => {

        lobbyState.connected =
            false;


        updateConnection(
            false
        );


        updateStatus(
            "Unable to connect to the game server.",
            "error"
        );

    }
);


/* =========================================================
   IDENTIFY PLAYER
   ========================================================= */

function identifyPlayer() {

    lobbySocket.emit(
        "player:identify",
        {
            playerId:
                lobbyState.playerId,

            playerName:
                lobbyState.playerName
        }
    );

}


/* =========================================================
   REQUEST MATCH STATE
   ========================================================= */

function requestMatchState() {

    if (
        !lobbyState.matchId
    ) {

        updateStatus(
            "No active match found.",
            "error"
        );

        return;

    }


    lobbySocket.emit(
        "match:state",
        {
            matchId:
                lobbyState.matchId
        }
    );

}


/* =========================================================
   MATCH STATE
   ========================================================= */

lobbySocket.on(
    "match:state",
    data => {

        if (!data) {
            return;
        }


        applyMatchData(
            data
        );

    }
);


/* =========================================================
   MATCH CREATED
   ========================================================= */

lobbySocket.on(
    "match:created",
    data => {

        if (!data) {
            return;
        }


        applyMatchData(
            data
        );


        updateStatus(
            "Match created. Waiting for opponent...",
            "waiting"
        );

    }
);


/* =========================================================
   MATCH JOINED
   ========================================================= */

lobbySocket.on(
    "match:joined",
    data => {

        if (!data) {
            return;
        }


        applyMatchData(
            data
        );


        lobbyState.opponentJoined =
            true;


        updateStatus(
            "Opponent joined the match.",
            "success"
        );

    }
);


/* =========================================================
   OPPONENT JOINED
   ========================================================= */

lobbySocket.on(
    "match:opponent-joined",
    data => {

        lobbyState.opponentJoined =
            true;


        if (
            data
        ) {

            applyOpponentData(
                data
            );

        }


        updateStatus(
            "Opponent joined. Preparing draft...",
            "success"
        );

    }
);


/* =========================================================
   DRAFT START
   ========================================================= */

lobbySocket.on(
    "draft:start",
    data => {

        if (
            data?.matchId
        ) {

            lobbyState.matchId =
                data.matchId;

            lobbySet(
                "adg_matchId",
                data.matchId
            );

        }


        if (
            data?.anime
        ) {

            lobbyState.anime =
                data.anime;

            lobbySet(
                "adg_anime",
                data.anime
            );

        }


        if (
            data?.playerNumber
        ) {

            lobbyState.playerNumber =
                Number(
                    data.playerNumber
                );

            lobbySet(
                "adg_playerNumber",
                data.playerNumber
            );

        }


        updateStatus(
            "Both players are ready. Starting draft...",
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
   MATCH ERROR
   ========================================================= */

lobbySocket.on(
    "match:error",
    data => {

        updateStatus(
            data?.message ||
            "Match error.",
            "error"
        );

    }
);


/* =========================================================
   SERVER ERROR
   ========================================================= */

lobbySocket.on(
    "server:error",
    data => {

        updateStatus(
            data?.message ||
            "Server error.",
            "error"
        );

    }
);


/* =========================================================
   APPLY MATCH DATA
   ========================================================= */

function applyMatchData(
    data
) {

    const matchId =
        data.matchId ||
        data.id;


    if (
        matchId
    ) {

        lobbyState.matchId =
            matchId;

        lobbySet(
            "adg_matchId",
            matchId
        );

    }


    if (
        data.matchCode
    ) {

        lobbyState.matchCode =
            data.matchCode;

        lobbySet(
            "adg_matchCode",
            data.matchCode
        );

    }


    if (
        data.anime
    ) {

        lobbyState.anime =
            data.anime;

        lobbySet(
            "adg_anime",
            data.anime
        );

    }


    if (
        data.playerNumber
    ) {

        lobbyState.playerNumber =
            Number(
                data.playerNumber
            );

        lobbySet(
            "adg_playerNumber",
            data.playerNumber
        );

    }


    if (
        data.opponent
    ) {

        lobbyState.opponentJoined =
            true;

        applyOpponentData(
            data.opponent
        );

    }


    renderLobby();

}


/* =========================================================
   OPPONENT DATA
   ========================================================= */

function applyOpponentData(
    opponent
) {

    if (
        !opponentElement ||
        !opponent
    ) {

        return;

    }


    const name =
        typeof opponent ===
            "string"
            ? opponent
            : (
                opponent.name ||
                opponent.playerName ||
                "Opponent"
            );


    opponentElement.textContent =
        name;


    opponentElement.classList.add(
        "joined"
    );

}


/* =========================================================
   RENDER LOBBY
   ========================================================= */

function renderLobby() {

    if (
        matchCodeElement
    ) {

        matchCodeElement.textContent =
            lobbyState.matchCode ||
            "------";

    }


    if (
        animeElement
    ) {

        animeElement.textContent =
            lobbyState.anime;

    }


    if (
        playerNameElement
    ) {

        playerNameElement.textContent =
            lobbyState.playerName;

    }


    if (
        lobbyState.opponentJoined
    ) {

        if (
            opponentElement &&
            !opponentElement.textContent
        ) {

            opponentElement.textContent =
                "Opponent joined";

        }

    }


    updatePlayerNumber();

}


/* =========================================================
   PLAYER NUMBER
   ========================================================= */

function updatePlayerNumber() {

    const elements =
        document.querySelectorAll(
            "[data-player-number]"
        );


    elements.forEach(
        element => {

            if (
                lobbyState.playerNumber
            ) {

                element.textContent =
                    `Player ${lobbyState.playerNumber}`;

            } else {

                element.textContent =
                    "Player";

            }

        }
    );

}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnection(
    connected
) {

    if (
        !connectionElement
    ) {

        return;

    }


    connectionElement.textContent =
        connected
            ? "🟢 Connected"
            : "🔴 Disconnected";


    connectionElement.classList.toggle(
        "connected",
        connected
    );


    connectionElement.classList.toggle(
        "disconnected",
        !connected
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function updateStatus(
    message,
    type = ""
) {

    if (
        !lobbyStatus
    ) {

        return;

    }


    lobbyStatus.textContent =
        message;


    lobbyStatus.className =
        "lobby-status";


    if (
        type
    ) {

        lobbyStatus.classList.add(
            type
        );

    }

}


/* =========================================================
   COPY CODE
   ========================================================= */

async function copyMatchCode() {

    const code =
        lobbyState.matchCode;


    if (
        !code
    ) {

        updateStatus(
            "Match code is not available.",
            "error"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            code
        );


        updateStatus(
            "Match code copied!",
            "success"
        );

    } catch (error) {

        updateStatus(
            `Match code: ${code}`,
            "info"
        );

    }

}


if (
    copyCodeButton
) {

    copyCodeButton.addEventListener(
        "click",
        copyMatchCode
    );

}


/* =========================================================
   CANCEL MATCH
   ========================================================= */

function cancelMatch() {

    if (
        !lobbyState.matchId
    ) {

        window.location.href =
            "index.html";

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to leave this match?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    if (
        lobbyState.connected
    ) {

        lobbySocket.emit(
            "match:cancel",
            {
                matchId:
                    lobbyState.matchId
            }
        );

    }


    clearLobbySession();


    window.location.href =
        "index.html";

}


if (
    cancelButton
) {

    cancelButton.addEventListener(
        "click",
        cancelMatch
    );

}


/* =========================================================
   CLEAR LOBBY SESSION
   ========================================================= */

function clearLobbySession() {

    try {

        sessionStorage.removeItem(
            "adg_matchId"
        );

        sessionStorage.removeItem(
            "adg_matchCode"
        );

        sessionStorage.removeItem(
            "adg_playerNumber"
        );

    } catch (error) {

        console.warn(
            "Unable to clear lobby session.",
            error
        );

    }


    lobbyState.matchId =
        null;

    lobbyState.matchCode =
        null;

    lobbyState.playerNumber =
        null;

}


/* =========================================================
   AUTO REFRESH MATCH STATE
   ========================================================= */

let lobbyRefreshTimer =
    null;


function startLobbyRefresh() {

    if (
        lobbyRefreshTimer
    ) {

        clearInterval(
            lobbyRefreshTimer
        );

    }


    lobbyRefreshTimer =
        setInterval(
            () => {

                if (
                    lobbyState.connected &&
                    lobbyState.matchId &&
                    !lobbyState.opponentJoined
                ) {

                    requestMatchState();

                }

            },
            5000
        );

}


startLobbyRefresh();


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            requestMatchState();

        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

renderLobby();

updateConnection(
    false
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_LOBBY = {

    state:
        lobbyState,

    refresh:
        requestMatchState,

    copyCode:
        copyMatchCode,

    cancel:
        cancelMatch

};


/* =========================================================
   END OF LOBBY.JS
   ========================================================= */
```
