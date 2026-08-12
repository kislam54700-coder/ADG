/* =========================================================
   ADG — APP.JS
   Main Lobby / Match Client
   ========================================================= */

"use strict";

/* =========================================================
   SERVER
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";


/* =========================================================
   SOCKET
   ========================================================= */

const appSocket = io(
    ADG_SERVER_URL,
    {
        transports: [
            "websocket",
            "polling"
        ],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 10000
    }
);


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_DEFAULT_BATTLE_NAME =
    "Face to Face";


/* =========================================================
   STATE
   ========================================================= */

const appState = {

    connected:
        false,

    playerName:
        "",

    battleName:
        ADG_DEFAULT_BATTLE_NAME,

    matchId:
        null,

    playerNumber:
        null,

    searching:
        false,

    matched:
        false

};


/* =========================================================
   DOM
   ========================================================= */

const playerNameInput =
    document.getElementById(
        "playerName"
    );

const createMatchButton =
    document.getElementById(
        "createMatchButton"
    );

const joinMatchButton =
    document.getElementById(
        "joinMatchButton"
    );

const findMatchButton =
    document.getElementById(
        "findMatchButton"
    );

const matchIdInput =
    document.getElementById(
        "matchId"
    );

const lobbyStatus =
    document.getElementById(
        "lobbyStatus"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const selectedAnime =
    document.getElementById(
        "selectedAnime"
    );

const playerNameDisplay =
    document.getElementById(
        "playerNameDisplay"
    );


/* =========================================================
   MATCH CODE DISPLAY
   ========================================================= */

/*
 * Optional HTML elements.

 * Add these IDs to index.html if you want
 * the Match ID to appear automatically.
 */

const createdMatchId =
    document.getElementById(
        "createdMatchId"
    );

const copyMatchIdButton =
    document.getElementById(
        "copyMatchIdButton"
    );

const matchCodeBox =
    document.getElementById(
        "matchCodeBox"
    );


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

    } catch (
        error
    ) {

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

    } catch (
        error
    ) {

        console.warn(
            error
        );

    }

}


function removeSession(
    key
) {

    try {

        sessionStorage.removeItem(
            key
        );

    } catch (
        error
    ) {

        console.warn(
            error
        );

    }

}


/* =========================================================
   RESTORE SESSION
   ========================================================= */

appState.playerName =
    getSession(
        "adg_playerName"
    ) ||
    "";

appState.battleName =
    getSession(
        "adg_battleName"
    ) ||
    ADG_DEFAULT_BATTLE_NAME;

appState.matchId =
    getSession(
        "adg_matchId"
    );

appState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    ) ||
    null;


/* =========================================================
   INITIAL UI
   ========================================================= */

if (
    playerNameInput
) {

    playerNameInput.value =
        appState.playerName;

}


if (
    selectedAnime
) {

    selectedAnime.textContent =
        appState.battleName;

}


if (
    playerNameDisplay
) {

    playerNameDisplay.textContent =
        appState.playerName ||
        "Player";

}


updateConnectionUI(
    false
);

updateLobbyButtons();


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
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


    lobbyStatus.classList.remove(
        "hidden",
        "success",
        "warning",
        "error",
        "info"
    );


    if (
        type
    ) {

        lobbyStatus.classList.add(
            type
        );

    }


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                lobbyStatus.classList.add(
                    "hidden"
                );

            },
            8000
        );

}


/* =========================================================
   CONNECTION UI
   ========================================================= */

function updateConnectionUI(
    connected
) {

    appState.connected =
        connected;


    if (
        !connectionStatus
    ) {

        return;

    }


    connectionStatus.classList.remove(
        "connected",
        "disconnected"
    );


    if (
        connected
    ) {

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
   UPDATE LOBBY BUTTONS
   ========================================================= */

function updateLobbyButtons() {

    const nameValid =
        validatePlayerName()
            .valid;


    const serverUnavailable =
        !appState.connected;


    if (
        createMatchButton
    ) {

        createMatchButton.disabled =
            serverUnavailable ||
            !nameValid ||
            appState.searching;

    }


    if (
        findMatchButton
    ) {

        findMatchButton.disabled =
            serverUnavailable ||
            !nameValid ||
            appState.searching;

    }


    if (
        joinMatchButton
    ) {

        joinMatchButton.disabled =
            serverUnavailable ||
            !nameValid ||
            !validateMatchId().valid ||
            appState.searching;

    }

}


/* =========================================================
   VALIDATE PLAYER NAME
   ========================================================= */

function validatePlayerName() {

    const name =
        appState.playerName
            .trim();


    if (
        !name
    ) {

        return {

            valid:
                false,

            message:
                "Enter your player name."

        };

    }


    if (
        name.length < 2
    ) {

        return {

            valid:
                false,

            message:
                "Player name must contain at least 2 characters."

        };

    }


    if (
        name.length > 24
    ) {

        return {

            valid:
                false,

            message:
                "Player name must not exceed 24 characters."

        };

    }


    return {

        valid:
            true,

        message:
            ""

    };

}


/* =========================================================
   VALIDATE MATCH ID
   ========================================================= */

function validateMatchId() {

    const value =
        matchIdInput
            ? matchIdInput.value.trim()
            : "";


    if (
        !value
    ) {

        return {

            valid:
                false,

            message:
                "Enter a Match ID."

        };

    }


    if (
        value.length > 64
    ) {

        return {

            valid:
                false,

            message:
                "Invalid Match ID."

        };

    }


    return {

        valid:
            true,

        message:
            ""

    };

}


/* =========================================================
   PLAYER NAME
   ========================================================= */

if (
    playerNameInput
) {

    playerNameInput.addEventListener(
        "input",
        () => {

            appState.playerName =
                playerNameInput.value
                    .trim();


            setSession(
                "adg_playerName",
                appState.playerName
            );


            if (
                playerNameDisplay
            ) {

                playerNameDisplay.textContent =
                    appState.playerName ||
                    "Player";

            }


            updateLobbyButtons();

        }
    );

}


/* =========================================================
   MATCH ID INPUT
   ========================================================= */

if (
    matchIdInput
) {

    matchIdInput.addEventListener(
        "input",
        () => {

            updateLobbyButtons();

        }
    );


    matchIdInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                joinMatch();

            }

        }
    );

}


/* =========================================================
   SOCKET CONNECT
   ========================================================= */

appSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );


        updateLobbyButtons();


        /*
         * If the player already has an active match,
         * tell the server that this socket belongs
         * to that match.
         */

        if (
            appState.matchId &&
            appState.playerNumber
        ) {

            appSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        appState.matchId,

                    playerNumber:
                        appState.playerNumber,

                    playerName:
                        appState.playerName
                }
            );

        }

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

appSocket.on(
    "disconnect",
    () => {

        updateConnectionUI(
            false
        );


        updateLobbyButtons();


        if (
            appState.matched
        ) {

            showMessage(
                "Connection lost. Reconnecting...",
                "warning"
            );

        }

    }
);


/* =========================================================
   SOCKET ERROR
   ========================================================= */

appSocket.on(
    "connect_error",
    error => {

        console.warn(
            "ADG connection error:",
            error
        );


        updateConnectionUI(
            false
        );


        updateLobbyButtons();


        showMessage(
            "Unable to connect to the ADG server.",
            "error"
        );

    }
);


/* =========================================================
   CREATE MATCH
   ========================================================= */

function createMatch() {

    const validation =
        validatePlayerName();


    if (
        !validation.valid
    ) {

        showMessage(
            validation.message,
            "warning"
        );

        return;

    }


    if (
        !appState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    clearMatchSession();


    appState.searching =
        true;


    appState.matched =
        false;


    updateLobbyButtons();


    showMessage(
        "Creating match...",
        "info"
    );


    appSocket.emit(
        "match:create",
        {
            playerName:
                appState.playerName,

            battleName:
                appState.battleName
        }
    );

}


/* =========================================================
   FIND MATCH
   ========================================================= */

function findMatch() {

    const validation =
        validatePlayerName();


    if (
        !validation.valid
    ) {

        showMessage(
            validation.message,
            "warning"
        );

        return;

    }


    if (
        !appState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    clearMatchSession();


    appState.searching =
        true;


    appState.matched =
        false;


    updateLobbyButtons();


    showMessage(
        "Searching for an available opponent...",
        "info"
    );


    appSocket.emit(
        "match:find",
        {
            playerName:
                appState.playerName,

            battleName:
                appState.battleName
        }
    );

}


/* =========================================================
   JOIN MATCH
   ========================================================= */

function joinMatch() {

    const nameValidation =
        validatePlayerName();


    if (
        !nameValidation.valid
    ) {

        showMessage(
            nameValidation.message,
            "warning"
        );

        return;

    }


    const matchValidation =
        validateMatchId();


    if (
        !matchValidation.valid
    ) {

        showMessage(
            matchValidation.message,
            "warning"
        );

        return;

    }


    if (
        !appState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    const id =
        matchIdInput.value
            .trim();


    appState.searching =
        true;


    updateLobbyButtons();


    showMessage(
        "Joining match...",
        "info"
    );


    appSocket.emit(
        "match:join",
        {
            matchId:
                id,

            playerName:
                appState.playerName
        }
    );

}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

if (
    createMatchButton
) {

    createMatchButton.addEventListener(
        "click",
        createMatch
    );

}


if (
    findMatchButton
) {

    findMatchButton.addEventListener(
        "click",
        findMatch
    );

}


if (
    joinMatchButton
) {

    joinMatchButton.addEventListener(
        "click",
        joinMatch
    );

}


/* =========================================================
   SERVER — MATCH CREATED
   ========================================================= */

appSocket.on(
    "match:created",
    data => {

        appState.searching =
            false;


        handleMatchData(
            data
        );


        displayMatchId();


        showMessage(
            `Match created. Share this Match ID: ${appState.matchId}`,
            "success"
        );


        updateLobbyButtons();

    }
);


/* =========================================================
   SERVER — MATCH WAITING
   ========================================================= */

appSocket.on(
    "match:waiting",
    data => {

        appState.searching =
            false;


        handleMatchData(
            data
        );


        displayMatchId();


        showMessage(
            data?.message ||
            `Waiting for opponent. Match ID: ${appState.matchId}`,
            "info"
        );


        updateLobbyButtons();

    }
);


/* =========================================================
   SERVER — MATCH JOINED
   ========================================================= */

appSocket.on(
    "match:joined",
    data => {

        appState.searching =
            false;


        handleMatchData(
            data
        );


        showMessage(
            "Successfully joined the match.",
            "success"
        );


        updateLobbyButtons();

    }
);


/* =========================================================
   SERVER — MATCH FOUND
   ========================================================= */

appSocket.on(
    "match:found",
    data => {

        appState.searching =
            false;


        handleMatchData(
            data
        );


        showMessage(
            "Opponent found!",
            "success"
        );


        updateLobbyButtons();

    }
);


/* =========================================================
   SERVER — MATCH READY
   ========================================================= */

appSocket.on(
    "match:ready",
    data => {

        appState.searching =
            false;


        appState.matched =
            true;


        handleMatchData(
            data
        );


        showMessage(
            "Match ready. Starting draft...",
            "success"
        );


        updateLobbyButtons();


        setTimeout(
            () => {

                window.location.href =
                    "draft.html";

            },
            800
        );

    }
);


/* =========================================================
   SERVER — MATCH ERROR
   ========================================================= */

appSocket.on(
    "match:error",
    data => {

        appState.searching =
            false;


        updateLobbyButtons();


        showMessage(
            data?.message ||
            "Unable to process the match request.",
            "error"
        );

    }
);


/* =========================================================
   SERVER — MATCH ENDED
   ========================================================= */

appSocket.on(
    "match:ended",
    data => {

        appState.searching =
            false;


        appState.matched =
            false;


        showMessage(
            data?.message ||
            "The match has ended.",
            "warning"
        );


        clearMatchSession();


        updateLobbyButtons();

    }
);


/* =========================================================
   HANDLE MATCH DATA
   ========================================================= */

function handleMatchData(
    data
) {

    if (
        !data
    ) {

        return;

    }


    if (
        data.matchId
    ) {

        appState.matchId =
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

        appState.playerNumber =
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


    if (
        data.playerName
    ) {

        appState.playerName =
            data.playerName;


        setSession(
            "adg_playerName",
            data.playerName
        );


        if (
            playerNameInput
        ) {

            playerNameInput.value =
                data.playerName;

        }


        if (
            playerNameDisplay
        ) {

            playerNameDisplay.textContent =
                data.playerName;

        }

    }


    /*
     * Battle name.
     *
     * Supports both battleName and older anime
     * fields so the client does not break if the
     * server still sends anime temporarily.
     */

    const battleName =
        data.battleName ||
        data.anime;


    if (
        battleName
    ) {

        appState.battleName =
            battleName;


        setSession(
            "adg_battleName",
            battleName
        );


        if (
            selectedAnime
        ) {

            selectedAnime.textContent =
                battleName;

        }

    }


    displayMatchId();


    updateLobbyButtons();

}


/* =========================================================
   DISPLAY MATCH ID
   ========================================================= */

function displayMatchId() {

    if (
        !appState.matchId
    ) {

        return;

    }


    /*
     * If you add:
     *
     * id="createdMatchId"
     *
     * this will display the generated code.
     */

    if (
        createdMatchId
    ) {

        createdMatchId.textContent =
            appState.matchId;

    }


    /*
     * Show the Match ID container.
     */

    if (
        matchCodeBox
    ) {

        matchCodeBox.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   COPY MATCH ID
   ========================================================= */

async function copyMatchId() {

    if (
        !appState.matchId
    ) {

        showMessage(
            "No Match ID available.",
            "warning"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            appState.matchId
        );


        showMessage(
            "Match ID copied!",
            "success"
        );

    } catch (
        error
    ) {

        console.warn(
            error
        );


        /*
         * Fallback for browsers where
         * navigator.clipboard is unavailable.
         */

        const textArea =
            document.createElement(
                "textarea"
            );


        textArea.value =
            appState.matchId;


        document.body.appendChild(
            textArea
        );


        textArea.select();


        try {

            document.execCommand(
                "copy"
            );


            showMessage(
                "Match ID copied!",
                "success"
            );

        } catch (
            copyError
        ) {

            showMessage(
                `Match ID: ${appState.matchId}`,
                "info"
            );

        }


        document.body.removeChild(
            textArea
        );

    }

}


if (
    copyMatchIdButton
) {

    copyMatchIdButton.addEventListener(
        "click",
        copyMatchId
    );

}


/* =========================================================
   CANCEL SEARCH
   ========================================================= */

function cancelSearch() {

    if (
        !appState.searching
    ) {

        return;

    }


    appState.searching =
        false;


    appSocket.emit(
        "match:cancel",
        {
            matchId:
                appState.matchId
        }
    );


    updateLobbyButtons();


    showMessage(
        "Match search cancelled.",
        "info"
    );

}


/* =========================================================
   CLEAR MATCH SESSION
   ========================================================= */

function clearMatchSession() {

    appState.matchId =
        null;


    appState.playerNumber =
        null;


    appState.matched =
        false;


    removeSession(
        "adg_matchId"
    );


    removeSession(
        "adg_playerNumber"
    );


    if (
        createdMatchId
    ) {

        createdMatchId.textContent =
            "";

    }


    if (
        matchCodeBox
    ) {

        matchCodeBox.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden &&
            !appSocket.connected
        ) {

            appSocket.connect();

        }

    }
);


/* =========================================================
   BEFORE UNLOAD
   ========================================================= */

/*
 * Do not disconnect manually here.
 *
 * Socket.IO should handle reconnection automatically,
 * especially when navigating from index.html to draft.html.
 */


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_APP_STATE =
    appState;


window.ADG_APP = {

    state:
        appState,

    createMatch,

    findMatch,

    joinMatch,

    cancelSearch,

    copyMatchId,

    clearMatchSession

};


/* =========================================================
   END OF APP.JS
   ========================================================= */
