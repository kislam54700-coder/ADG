```javascript
/* =========================================================
   ADG — HISTORY.JS
   Match History
   No Firebase
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const historySocket = io(
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

const historyState = {

    connected: false,

    playerId: null,

    playerName: "",

    history: [],

    loading: false

};


/* =========================================================
   SESSION
   ========================================================= */

function historyGetSession(key) {

    try {

        return sessionStorage.getItem(key);

    } catch (error) {

        return null;

    }

}


historyState.playerId =
    historyGetSession(
        "adg_playerId"
    );


historyState.playerName =
    historyGetSession(
        "adg_playerName"
    ) ||
    "Player";


/* =========================================================
   DOM
   ========================================================= */

const historyContainer =
    document.getElementById(
        "historyContainer"
    );

const historyLoading =
    document.getElementById(
        "historyLoading"
    );

const historyEmpty =
    document.getElementById(
        "historyEmpty"
    );

const historyError =
    document.getElementById(
        "historyError"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const refreshHistoryButton =
    document.getElementById(
        "refreshHistory"
    );

const clearHistoryButton =
    document.getElementById(
        "clearHistory"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================================
   CONNECTION
   ========================================================= */

historySocket.on(
    "connect",
    () => {

        historyState.connected =
            true;


        historyState.playerId =
            historyState.playerId ||
            historySocket.id;


        updateConnectionStatus(
            true
        );


        requestHistory();

    }
);


historySocket.on(
    "disconnect",
    () => {

        historyState.connected =
            false;


        updateConnectionStatus(
            false
        );

    }
);


historySocket.on(
    "connect_error",
    () => {

        historyState.connected =
            false;


        updateConnectionStatus(
            false
        );


        showError(
            "Unable to connect to the game server."
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
   REQUEST HISTORY
   ========================================================= */

function requestHistory() {

    if (
        !historyState.connected
    ) {

        showError(
            "Not connected to the server."
        );

        return;

    }


    if (
        !historyState.playerId
    ) {

        showError(
            "Player information is missing."
        );

        return;

    }


    setLoading(
        true
    );


    historySocket.emit(
        "history:get",
        {
            playerId:
                historyState.playerId
        }
    );

}


/* =========================================================
   HISTORY RESPONSE
   ========================================================= */

historySocket.on(
    "history:data",
    data => {

        historyState.loading =
            false;


        setLoading(
            false
        );


        const history =
            Array.isArray(
                data
            )
                ? data
                : (
                    data?.history ||
                    data?.matches ||
                    []
                );


        historyState.history =
            history;


        renderHistory(
            history
        );

    }
);


/* =========================================================
   HISTORY ERROR
   ========================================================= */

historySocket.on(
    "history:error",
    data => {

        historyState.loading =
            false;


        setLoading(
            false
        );


        showError(
            data?.message ||
            "Unable to load match history."
        );

    }
);


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory(
    history
) {

    if (!historyContainer) {
        return;
    }


    historyContainer.innerHTML =
        "";


    hideElement(
        historyEmpty
    );


    hideElement(
        historyError
    );


    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {

        showElement(
            historyEmpty
        );

        return;

    }


    history.forEach(
        (match, index) => {

            const row =
                createHistoryRow(
                    match,
                    index
                );


            historyContainer.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   CREATE HISTORY ROW
   ========================================================= */

function createHistoryRow(
    match,
    index
) {

    const row =
        document.createElement(
            "article"
        );


    row.className =
        "history-card";


    const result =
        normalizeResult(
            match.result
        );


    row.classList.add(
        `result-${result.toLowerCase()}`
    );


    /* -----------------------------------------------------
       RESULT
       ----------------------------------------------------- */

    const resultSection =
        document.createElement(
            "div"
        );


    resultSection.className =
        "history-result";


    const resultIcon =
        document.createElement(
            "span"
        );


    resultIcon.className =
        "history-result-icon";


    resultIcon.textContent =
        getResultIcon(
            result
        );


    resultSection.appendChild(
        resultIcon
    );


    const resultText =
        document.createElement(
            "strong"
        );


    resultText.textContent =
        result;


    resultSection.appendChild(
        resultText
    );


    row.appendChild(
        resultSection
    );


    /* -----------------------------------------------------
       MATCH INFORMATION
       ----------------------------------------------------- */

    const information =
        document.createElement(
            "div"
        );


    information.className =
        "history-information";


    const anime =
        document.createElement(
            "h3"
        );


    anime.textContent =
        match.anime ||
        "One Piece";


    information.appendChild(
        anime
    );


    const opponent =
        document.createElement(
            "p"
        );


    opponent.textContent =
        `Opponent: ${
            match.opponentName ||
            match.opponent ||
            "Unknown"
        }`;


    information.appendChild(
        opponent
    );


    if (
        match.matchCode
    ) {

        const code =
            document.createElement(
                "p"
            );


        code.textContent =
            `Match: ${
                match.matchCode
            }`;


        information.appendChild(
            code
        );

    }


    row.appendChild(
        information
    );


    /* -----------------------------------------------------
       SCORE
       ----------------------------------------------------- */

    const score =
        document.createElement(
            "div"
        );


    score.className =
        "history-score";


    const playerScore =
        Number(
            match.playerScore ??
            match.myScore ??
            0
        );


    const opponentScore =
        Number(
            match.opponentScore ??
            0
        );


    if (
        match.playerScore !==
        undefined ||
        match.myScore !==
        undefined ||
        match.opponentScore !==
        undefined
    ) {

        score.textContent =
            `${playerScore} - ${opponentScore}`;

    }


    row.appendChild(
        score
    );


    /* -----------------------------------------------------
       DATE
       ----------------------------------------------------- */

    const date =
        document.createElement(
            "time"
        );


    date.className =
        "history-date";


    date.dateTime =
        getDateTimeValue(
            match.finishedAt ||
            match.date ||
            match.createdAt
        );


    date.textContent =
        formatDate(
            match.finishedAt ||
            match.date ||
            match.createdAt
        );


    row.appendChild(
        date
    );


    /* -----------------------------------------------------
       DETAILS BUTTON
       ----------------------------------------------------- */

    if (
        match.matchId ||
        match.id
    ) {

        const detailsButton =
            document.createElement(
                "button"
            );


        detailsButton.type =
            "button";


        detailsButton.className =
            "history-details-button";


        detailsButton.textContent =
            "Details";


        detailsButton.addEventListener(
            "click",
            () => {

                showMatchDetails(
                    match
                );

            }
        );


        row.appendChild(
            detailsButton
        );

    }


    return row;

}


/* =========================================================
   RESULT NORMALIZATION
   ========================================================= */

function normalizeResult(
    result
) {

    const value =
        String(
            result ||
            "DRAW"
        )
        .trim()
        .toUpperCase();


    if (
        value === "WIN" ||
        value === "WON" ||
        value === "VICTORY"
    ) {

        return "WIN";

    }


    if (
        value === "LOSS" ||
        value === "LOST" ||
        value === "DEFEAT"
    ) {

        return "LOSS";

    }


    return "DRAW";

}


/* =========================================================
   RESULT ICON
   ========================================================= */

function getResultIcon(
    result
) {

    switch (
        result
    ) {

        case "WIN":
            return "🏆";

        case "LOSS":
            return "💀";

        default:
            return "⚔️";

    }

}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Unknown date";

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

        return "Unknown date";

    }


    return date.toLocaleString(
        undefined,
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   DATE TIME VALUE
   ========================================================= */

function getDateTimeValue(
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


    return date.toISOString();

}


/* =========================================================
   MATCH DETAILS
   ========================================================= */

function showMatchDetails(
    match
) {

    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "history-modal";


    modal.setAttribute(
        "role",
        "dialog"
    );


    modal.setAttribute(
        "aria-modal",
        "true"
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "history-modal-content";


    const title =
        document.createElement(
            "h2"
        );


    title.textContent =
        "Match Details";


    content.appendChild(
        title
    );


    const details = [

        [
            "Result",
            normalizeResult(
                match.result
            )
        ],

        [
            "Anime",
            match.anime ||
            "One Piece"
        ],

        [
            "Opponent",
            match.opponentName ||
            match.opponent ||
            "Unknown"
        ],

        [
            "Match Code",
            match.matchCode ||
            "—"
        ],

        [
            "Score",
            formatScore(
                match
            )
        ],

        [
            "Date",
            formatDate(
                match.finishedAt ||
                match.date ||
                match.createdAt
            )
        ]

    ];


    details.forEach(
        item => {

            const line =
                document.createElement(
                    "p"
                );


            const label =
                document.createElement(
                    "strong"
                );


            label.textContent =
                `${item[0]}: `;


            line.appendChild(
                label
            );


            const value =
                document.createTextNode(
                    item[1]
                );


            line.appendChild(
                value
            );


            content.appendChild(
                line
            );

        }
    );


    if (
        Array.isArray(
            match.characters
        )
    ) {

        const charactersTitle =
            document.createElement(
                "h3"
            );


        charactersTitle.textContent =
            "Characters";


        content.appendChild(
            charactersTitle
        );


        const list =
            document.createElement(
                "ul"
            );


        match.characters.forEach(
            character => {

                const item =
                    document.createElement(
                        "li"
                    );


                item.textContent =
                    typeof character ===
                        "string"
                        ? character
                        : (
                            character.name ||
                            "Unknown"
                        );


                list.appendChild(
                    item
                );

            }
        );


        content.appendChild(
            list
        );

    }


    const closeButton =
        document.createElement(
            "button"
        );


    closeButton.type =
        "button";


    closeButton.className =
        "history-close-button";


    closeButton.textContent =
        "Close";


    closeButton.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );


    content.appendChild(
        closeButton
    );


    modal.appendChild(
        content
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

            }

        }
    );


    document.body.appendChild(
        modal
    );

}


/* =========================================================
   SCORE
   ========================================================= */

function formatScore(
    match
) {

    const playerScore =
        match.playerScore ??
        match.myScore;


    const opponentScore =
        match.opponentScore;


    if (
        playerScore ===
        undefined &&
        opponentScore ===
        undefined
    ) {

        return "—";

    }


    return `${
        playerScore ??
        0
    } - ${
        opponentScore ??
        0
    }`;

}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(
    loading
) {

    historyState.loading =
        loading;


    if (historyLoading) {

        historyLoading.classList.toggle(
            "hidden",
            !loading
        );

    }


    if (
        refreshHistoryButton
    ) {

        refreshHistoryButton.disabled =
            loading;

    }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
    message
) {

    if (historyError) {

        historyError.textContent =
            message;


        historyError.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ELEMENT HELPERS
   ========================================================= */

function showElement(
    element
) {

    if (element) {

        element.classList.remove(
            "hidden"
        );

    }

}


function hideElement(
    element
) {

    if (element) {

        element.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   REFRESH
   ========================================================= */

if (
    refreshHistoryButton
) {

    refreshHistoryButton.addEventListener(
        "click",
        requestHistory
    );

}


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

if (
    clearHistoryButton
) {

    clearHistoryButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Clear your local match history view?"
                );


            if (!confirmed) {

                return;

            }


            /*
             * This only clears the browser's cached history
             * if one exists. Server history is never deleted
             * without an explicit server-side operation.
             */

            historyState.history =
                [];


            renderHistory(
                []
            );

        }
    );

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (
    backButton
) {

    backButton.addEventListener(
        "click",
        () => {

            if (
                document.referrer
            ) {

                history.back();

            } else {

                window.location.href =
                    "index.html";

            }

        }
    );

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_HISTORY =
    {

        state:
            historyState,

        refresh:
            requestHistory,

        render:
            renderHistory

    };


/* =========================================================
   END OF HISTORY.JS
   ========================================================= */
```
