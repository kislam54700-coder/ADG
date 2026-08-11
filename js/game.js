```javascript
/* =========================================================
   ADG — GAME.JS
   Private Online Multiplayer Battle Client
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const gameSocket = io(
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

const TEAM_SIZE = 6;

const MAX_ROUNDS = 50;


/* =========================================================
   STATE
   ========================================================= */

const gameState = {

    matchId:
        null,

    playerNumber:
        null,

    playerName:
        "",

    anime:
        "One Piece",

    myTeam:
        [],

    opponentTeam:
        [],

    myHp:
        0,

    opponentHp:
        0,

    round:
        0,

    maxRounds:
        MAX_ROUNDS,

    battleStarted:
        false,

    battleFinished:
        false,

    connected:
        false,

    waiting:
        true,

    winner:
        null,

    battleLog:
        []

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

gameState.matchId =
    getSession(
        "adg_matchId"
    );


gameState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    );


gameState.playerName =
    getSession(
        "adg_playerName"
    ) ||
    "";


gameState.anime =
    getSession(
        "adg_anime"
    ) ||
    "One Piece";


/* =========================================================
   DOM
   ========================================================= */

const gameAnimeTitle =
    document.getElementById(
        "animeTitle"
    );


const gameConnectionStatus =
    document.getElementById(
        "connectionStatus"
    );


const gameStatus =
    document.getElementById(
        "gameStatus"
    );


const gameRound =
    document.getElementById(
        "battleRound"
    );


const gameLog =
    document.getElementById(
        "battleLog"
    );


const gameMessage =
    document.getElementById(
        "battleMessage"
    );


const myTeamContainer =
    document.getElementById(
        "myTeam"
    );


const opponentTeamContainer =
    document.getElementById(
        "opponentTeam"
    );


const myHpBar =
    document.getElementById(
        "myHpBar"
    );


const opponentHpBar =
    document.getElementById(
        "opponentHpBar"
    );


const myHpText =
    document.getElementById(
        "myHpText"
    );


const opponentHpText =
    document.getElementById(
        "opponentHpText"
    );


const battleStartButton =
    document.getElementById(
        "battleStartButton"
    );


const leaveBattleButton =
    document.getElementById(
        "leaveBattleButton"
    );


/* =========================================================
   INITIAL UI
   ========================================================= */

if (
    gameAnimeTitle
) {

    gameAnimeTitle.textContent =
        gameState.anime;

}


updateConnectionUI(
    false
);

renderTeams();

updateHpUI();

updateRoundUI();

setWaitingUI();


/* =========================================================
   MESSAGE
   ========================================================= */

function showGameMessage(
    message,
    type = ""
) {

    const element =
        gameMessage ||
        gameStatus;


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
        showGameMessage.timer
    );


    showGameMessage.timer =
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

    gameState.connected =
        connected;


    if (
        !gameConnectionStatus
    ) {

        return;

    }


    gameConnectionStatus.classList.remove(
        "connected",
        "disconnected"
    );


    if (
        connected
    ) {

        gameConnectionStatus.textContent =
            "Connected";


        gameConnectionStatus.classList.add(
            "connected"
        );

    } else {

        gameConnectionStatus.textContent =
            "Disconnected";


        gameConnectionStatus.classList.add(
            "disconnected"
        );

    }

}


/* =========================================================
   SOCKET CONNECT
   ========================================================= */

gameSocket.on(
    "connect",
    () => {

        updateConnectionUI(
            true
        );


        if (
            gameState.matchId
        ) {

            gameSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        gameState.matchId
                }
            );

        } else {

            showGameMessage(
                "Match information is missing.",
                "error"
            );

        }

    }
);


/* =========================================================
   SOCKET DISCONNECT
   ========================================================= */

gameSocket.on(
    "disconnect",
    () => {

        updateConnectionUI(
            false
        );


        showGameMessage(
            "Connection lost. Reconnecting...",
            "error"
        );

    }
);


/* =========================================================
   SERVER — BATTLE STATE
   ========================================================= */

gameSocket.on(
    "battle:state",
    data => {

        if (
            !data
        ) {

            return;

        }


        updateBattleState(
            data
        );

    }
);


/* =========================================================
   SERVER — BATTLE START
   ========================================================= */

gameSocket.on(
    "battle:start",
    data => {

        gameState.battleStarted =
            true;


        gameState.waiting =
            false;


        if (
            data
        ) {

            updateBattleState(
                data
            );

        }


        setBattleStartedUI();


        showGameMessage(
            "⚔️ Battle started!",
            "success"
        );


        playSound(
            "battle-start"
        );

    }
);


/* =========================================================
   SERVER — ROUND
   ========================================================= */

gameSocket.on(
    "battle:round",
    data => {

        if (
            !data
        ) {

            return;

        }


        if (
            typeof data.round ===
            "number"
        ) {

            gameState.round =
                data.round;

        }


        if (
            data.log
        ) {

            addBattleLog(
                data.log
            );

        }


        updateBattleState(
            data
        );


        playSound(
            "hit"
        );

    }
);


/* =========================================================
   SERVER — BATTLE LOG
   ========================================================= */

gameSocket.on(
    "battle:log",
    data => {

        if (
            !data
        ) {

            return;

        }


        if (
            Array.isArray(
                data.logs
            )
        ) {

            data.logs.forEach(
                log =>
                    addBattleLog(
                        log
                    )
            );

        } else if (
            data.message
        ) {

            addBattleLog(
                data.message
            );

        }

    }
);


/* =========================================================
   SERVER — BATTLE COMPLETE
   ========================================================= */

gameSocket.on(
    "battle:complete",
    data => {

        gameState.battleFinished =
            true;


        gameState.battleStarted =
            false;


        gameState.waiting =
            false;


        if (
            data
        ) {

            updateBattleState(
                data
            );

        }


        gameState.winner =
            data?.winner ||
            null;


        setBattleCompleteUI(
            data
        );


        playSound(
            "victory"
        );

    }
);


/* =========================================================
   SERVER — MATCH ERROR
   ========================================================= */

gameSocket.on(
    "match:error",
    data => {

        showGameMessage(
            data?.message ||
            "Match error.",
            "error"
        );

    }
);


/* =========================================================
   SERVER — BATTLE ERROR
   ========================================================= */

gameSocket.on(
    "battle:error",
    data => {

        showGameMessage(
            data?.message ||
            "Battle action was rejected.",
            "error"
        );

    }
);


/* =========================================================
   UPDATE BATTLE STATE
   ========================================================= */

function updateBattleState(
    data
) {

    if (
        data.matchId
    ) {

        gameState.matchId =
            data.matchId;


        setSession(
            "adg_matchId",
            data.matchId
        );

    }


    if (
        data.anime
    ) {

        gameState.anime =
            data.anime;


        if (
            gameAnimeTitle
        ) {

            gameAnimeTitle.textContent =
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

        gameState.playerNumber =
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
        Array.isArray(
            data.myTeam
        )
    ) {

        gameState.myTeam =
            normalizeTeam(
                data.myTeam
            );

    }


    if (
        Array.isArray(
            data.opponentTeam
        )
    ) {

        gameState.opponentTeam =
            normalizeTeam(
                data.opponentTeam
            );

    }


    if (
        typeof data.myHp ===
        "number"
    ) {

        gameState.myHp =
            Math.max(
                0,
                data.myHp
            );

    }


    if (
        typeof data.opponentHp ===
        "number"
    ) {

        gameState.opponentHp =
            Math.max(
                0,
                data.opponentHp
            );

    }


    if (
        typeof data.round ===
        "number"
    ) {

        gameState.round =
            data.round;

    }


    if (
        typeof data.maxRounds ===
        "number"
    ) {

        gameState.maxRounds =
            data.maxRounds;

    }


    if (
        Array.isArray(
            data.logs
        )
    ) {

        gameState.battleLog =
            data.logs.slice();

        renderBattleLog();

    }


    renderTeams();

    updateHpUI();

    updateRoundUI();

}


/* =========================================================
   NORMALIZE TEAM
   ========================================================= */

function normalizeTeam(
    team
) {

    return team
        .slice(
            0,
            TEAM_SIZE
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
   RENDER TEAMS
   ========================================================= */

function renderTeams() {

    renderTeam(
        myTeamContainer,
        gameState.myTeam,
        "You"
    );


    renderTeam(
        opponentTeamContainer,
        gameState.opponentTeam,
        "Opponent"
    );

}


/* =========================================================
   RENDER SINGLE TEAM
   ========================================================= */

function renderTeam(
    container,
    team,
    label
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    if (
        team.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "battle-team-empty";


        empty.textContent =
            `${label} team is waiting...`;


        container.appendChild(
            empty
        );


        return;

    }


    team.forEach(
        (
            character,
            index
        ) => {

            container.appendChild(
                createBattleCharacterCard(
                    character,
                    index
                )
            );

        }
    );


    for (
        let i =
            team.length;
        i < TEAM_SIZE;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "battle-character-card empty";


        empty.textContent =
            "—";


        container.appendChild(
            empty
        );

    }

}


/* =========================================================
   CHARACTER CARD
   ========================================================= */

function createBattleCharacterCard(
    character,
    index
) {

    const name =
        character?.name ||
        "Unknown";


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "battle-character-card";


    card.dataset.index =
        String(
            index
        );


    if (
        character?.alive === false ||
        character?.hp === 0
    ) {

        card.classList.add(
            "defeated"
        );

    }


    const image =
        document.createElement(
            "img"
        );


    image.className =
        "battle-character-image";


    image.alt =
        name;


    image.loading =
        "lazy";


    const fallback =
        document.createElement(
            "div"
        );


    fallback.className =
        "battle-character-fallback";


    fallback.textContent =
        name
            .charAt(0)
            .toUpperCase();


    const candidates =
        typeof getCharacterImageCandidates ===
            "function"
            ? getCharacterImageCandidates(
                name,
                gameState.anime
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
            "span"
        );


    nameElement.className =
        "battle-character-name";


    nameElement.textContent =
        name;


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
   HP UI
   ========================================================= */

function updateHpUI() {

    updateSingleHp(
        myHpBar,
        myHpText,
        gameState.myHp
    );


    updateSingleHp(
        opponentHpBar,
        opponentHpText,
        gameState.opponentHp
    );

}


/* =========================================================
   SINGLE HP
   ========================================================= */

function updateSingleHp(
    bar,
    text,
    hp
) {

    if (
        bar
    ) {

        const percentage =
            Math.max(
                0,
                Math.min(
                    100,
                    hp
                )
            );


        bar.style.width =
            `${percentage}%`;

    }


    if (
        text
    ) {

        text.textContent =
            `${Math.max(
                0,
                Math.round(
                    hp
                )
            )}%`;

    }

}


/* =========================================================
   ROUND UI
   ========================================================= */

function updateRoundUI() {

    if (
        !gameRound
    ) {

        return;

    }


    gameRound.textContent =
        `Round ${gameState.round} / ${gameState.maxRounds}`;

}


/* =========================================================
   BATTLE LOG
   ========================================================= */

function addBattleLog(
    message
) {

    if (
        !message
    ) {

        return;

    }


    gameState.battleLog.push(
        String(
            message
        )
    );


    if (
        gameState.battleLog.length >
        200
    ) {

        gameState.battleLog =
            gameState.battleLog.slice(
                -200
            );

    }


    renderBattleLog();

}


/* =========================================================
   RENDER BATTLE LOG
   ========================================================= */

function renderBattleLog() {

    if (
        !gameLog
    ) {

        return;

    }


    gameLog.innerHTML =
        "";


    gameState.battleLog.forEach(
        message => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "battle-log-entry";


            item.textContent =
                message;


            gameLog.appendChild(
                item
            );

        }
    );


    gameLog.scrollTop =
        gameLog.scrollHeight;

}


/* =========================================================
   WAITING UI
   ========================================================= */

function setWaitingUI() {

    if (
        gameStatus
    ) {

        gameStatus.textContent =
            "Waiting for both players...";

    }


    if (
        battleStartButton
    ) {

        battleStartButton.disabled =
            true;

    }

}


/* =========================================================
   BATTLE STARTED UI
   ========================================================= */

function setBattleStartedUI() {

    if (
        gameStatus
    ) {

        gameStatus.textContent =
            "⚔️ Battle in progress";

        gameStatus.classList.remove(
            "waiting",
            "complete"
        );

        gameStatus.classList.add(
            "active"
        );

    }


    if (
        battleStartButton
    ) {

        battleStartButton.disabled =
            true;

    }

}


/* =========================================================
   BATTLE COMPLETE UI
   ========================================================= */

function setBattleCompleteUI(
    data
) {

    if (
        gameStatus
    ) {

        const winner =
            data?.winner;


        if (
            winner ===
            gameState.playerNumber
        ) {

            gameStatus.textContent =
                "🏆 YOU WIN!";

            gameStatus.className =
                "game-status victory";

        } else if (
            winner
        ) {

            gameStatus.textContent =
                "💀 YOU LOSE";

            gameStatus.className =
                "game-status defeat";

        } else {

            gameStatus.textContent =
                "🤝 DRAW";

            gameStatus.className =
                "game-status draw";

        }

    }


    if (
        gameMessage
    ) {

        gameMessage.textContent =
            data?.message ||
            "Battle finished.";

    }


    if (
        leaveBattleButton
    ) {

        leaveBattleButton.disabled =
            false;

    }

}


/* =========================================================
   START BATTLE
   ========================================================= */

function startBattle() {

    if (
        !gameState.connected
    ) {

        showGameMessage(
            "You are not connected to the server.",
            "error"
        );

        return;

    }


    if (
        gameState.battleStarted ||
        gameState.battleFinished
    ) {

        return;

    }


    gameSocket.emit(
        "battle:start",
        {
            matchId:
                gameState.matchId
        }
    );

}


/* =========================================================
   LEAVE BATTLE
   ========================================================= */

function leaveBattle() {

    if (
        !gameState.matchId
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Leave this battle?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    gameSocket.emit(
        "match:leave",
        {
            matchId:
                gameState.matchId
        }
    );


    try {

        sessionStorage.removeItem(
            "adg_matchId"
        );

        sessionStorage.removeItem(
            "adg_playerNumber"
        );

    } catch (
        error
    ) {

        console.warn(
            error
        );

    }


    window.location.href =
        "index.html";

}


/* =========================================================
   BUTTONS
   ========================================================= */

if (
    battleStartButton
) {

    battleStartButton.addEventListener(
        "click",
        startBattle
    );

}


if (
    leaveBattleButton
) {

    leaveBattleButton.addEventListener(
        "click",
        leaveBattle
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
            !gameSocket.connected
        ) {

            gameSocket.connect();

        }

    }
);


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
   GLOBAL ACCESS
   ========================================================= */

window.ADG_GAME_STATE =
    gameState;


window.ADG_GAME = {

    state:
        gameState,

    start:
        startBattle,

    leave:
        leaveBattle,

    addLog:
        addBattleLog

};


/* =========================================================
   END OF GAME.JS
   ========================================================= */
```
