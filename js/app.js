/* =========================================================
   ADG — APP.JS
   Main Application / Match Lobby Client
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";


const appSocket = io(
    ADG_SERVER_URL,
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

const ADG_DEFAULT_ANIME =
    "One Piece";


/* =========================================================
   STATE
   ========================================================= */

const appState = {

    connected:
        false,

    playerName:
        "",

    anime:
        ADG_DEFAULT_ANIME,

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


const animeButtons =
    document.querySelectorAll(
        "[data-anime]"
    );


const createMatchButton =
    document.getElementById(
        "createMatchButton"
    );


const joinMatchButton =
    document.getElementById(
        "joinMatchButton"
    );


const matchIdInput =
    document.getElementById(
        "matchId"
    );


const findMatchButton =
    document.getElementById(
        "findMatchButton"
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


appState.anime =
    getSession(
        "adg_anime"
    ) ||
    ADG_DEFAULT_ANIME;


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
        appState.anime;

}


if (
    playerNameDisplay
) {

    playerNameDisplay.textContent =
        appState.playerName ||
        "Player";

}


selectAnimeButton(
    appState.anime
);

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
            5000
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
   SOCKET CONNECT
   ========================================================= */

appSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );


        updateLobbyButtons();

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


        showMessage(
            "Connection lost. Reconnecting...",
            "error"
        );

    }
);


/* =========================================================
   SOCKET ERROR
   ========================================================= */

appSocket.on(
    "connect_error",
    error => {

        updateConnectionUI(
            false
        );


        console.warn(
            "ADG socket connection error:",
            error
        );


        showMessage(
            "Unable to connect to the game server.",
            "error"
        );

    }
);


/* =========================================================
   ANIME SELECTION
   ========================================================= */

animeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const anime =
                    button.dataset.anime;


                if (
                    !anime
                ) {

                    return;

                }


                if (
                    button.disabled
                ) {

                    return;

                }


                selectAnime(
                    anime
                );

            }
        );

    }
);


/* =========================================================
   SELECT ANIME
   ========================================================= */

function selectAnime(
    anime
) {

    appState.anime =
        anime;


    setSession(
        "adg_anime",
        anime
    );


    selectAnimeButton(
        anime
    );


    if (
        selectedAnime
    ) {

        selectedAnime.textContent =
            anime;

    }

}


/* =========================================================
   SELECT ANIME BUTTON UI
   ========================================================= */

function selectAnimeButton(
    anime
) {

    animeButtons.forEach(
        button => {

            const isSelected =
                button.dataset.anime ===
                anime;


            button.classList.toggle(
                "selected",
                isSelected
            );

            button.setAttribute(
                "aria-pressed",
                String(
                    isSelected
                )
            );

        }
    );

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
        name.length <
        2
    ) {

        return {

            valid:
                false,

            message:
                "Player name must contain at least 2 characters."

        };

    }


    if (
        name.length >
        24
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
        value.length >
        64
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
   UPDATE LOBBY BUTTONS
   ========================================================= */

function updateLobbyButtons() {

    const nameValid =
        validatePlayerName()
            .valid;


    const disabled =
        !appState.connected ||
        !nameValid ||
        appState.searching;


    if (
        createMatchButton
    ) {

        createMatchButton.disabled =
            disabled;

    }


    if (
        findMatchButton
    ) {

        findMatchButton.disabled =
            disabled;

    }


    if (
        joinMatchButton
    ) {

        joinMatchButton.disabled =
            !appState.connected ||
            !nameValid ||
            !validateMatchId().valid ||
            appState.searching;

    }

}


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


    appState.searching =
        true;


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

            anime:
                appState.anime
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


    appState.searching =
        true;


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

            anime:
                appState.anime
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
        matchIdInput.value.trim();


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
   CREATE BUTTON
   ========================================================= */

if (
    createMatchButton
) {

    createMatchButton.addEventListener(
        "click",
        createMatch
    );

}


/* =========================================================
   FIND BUTTON
   ========================================================= */

if (
    findMatchButton
) {

    findMatchButton.addEventListener(
        "click",
        findMatch
    );

}


/* =========================================================
   JOIN BUTTON
   ========================================================= */

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


        showMessage(
            `Match created: ${appState.matchId}`,
            "success"
        );

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


        setTimeout(
            () => {

                window.location.href =
                    "draft.html";

            },
            500
        );

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


        showMessage(
            data?.message ||
            "Waiting for another player...",
            "info"
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
        data.playerNumber
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

    }


    if (
        data.anime
    ) {

        appState.anime =
            data.anime;


        setSession(
            "adg_anime",
            data.anime
        );


        selectAnimeButton(
            data.anime
        );


        if (
            selectedAnime
        ) {

            selectedAnime.textContent =
                data.anime;

        }

    }


    updateLobbyButtons();

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
        "match:cancel"
    );


    updateLobbyButtons();


    showMessage(
        "Match search cancelled.",
        "info"
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

if (
    matchIdInput
) {

    matchIdInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                joinMatch();

            }

        }
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
            !appSocket.connected
        ) {

            appSocket.connect();

        }

    }
);


/* =========================================================
   CLEAR OLD SESSION
   ========================================================= */

function clearMatchSession() {

    removeSession(
        "adg_matchId"
    );

    removeSession(
        "adg_playerNumber"
    );

}


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

    selectAnime,

    clearMatchSession

};


/* =========================================================
   END OF APP.JS
   ========================================================= */
```
