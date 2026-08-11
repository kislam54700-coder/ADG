/* =========================================================
   ADG — BATTLE.JS
   Server-Authoritative Battle Client
   ========================================================= */

"use strict";


//* =========================================================
   SOCKET
   ========================================================= */

const ADG_SERVER_URL =
    "https://adg-server-t6y1.onrender.com";


const battleSocket = io(
    ADG_SERVER_URL,
    {
        transports: [
            "websocket",
            "polling"
        ]
    }
);


/* =========================================================
   CONSTANTS
   ========================================================= */

const TEAM_SIZE = 6;


/* =========================================================
   STATE
   ========================================================= */

const battleState = {

    matchId:
        null,

    playerNumber:
        null,

    anime:
        "One Piece",

    phase:
        "waiting",

    teams:
        {
            1: [],
            2: []
        },

    active:
        {
            1: null,
            2: null
        },

    winner:
        null,

    finished:
        false,

    events:
        [],

    connected:
        false

};


/* =========================================================
   SESSION
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


battleState.matchId =
    getSession(
        "adg_matchId"
    );


battleState.playerNumber =
    Number(
        getSession(
            "adg_playerNumber"
        )
    );


battleState.anime =
    getSession(
        "adg_anime"
    ) ||
    "One Piece";


/* =========================================================
   DOM
   ========================================================= */

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const battlePhase =
    document.getElementById(
        "battlePhase"
    );

const battleStatus =
    document.getElementById(
        "battleStatus"
    );

const player1Team =
    document.getElementById(
        "player1BattleTeam"
    );

const player2Team =
    document.getElementById(
        "player2BattleTeam"
    );

const player1Name =
    document.getElementById(
        "player1Name"
    );

const player2Name =
    document.getElementById(
        "player2Name"
    );

const battleLog =
    document.getElementById(
        "battleLog"
    );

const battleResult =
    document.getElementById(
        "battleResult"
    );

const battleResultIcon =
    document.getElementById(
        "battleResultIcon"
    );

const battleResultTitle =
    document.getElementById(
        "battleResultTitle"
    );

const battleResultWinner =
    document.getElementById(
        "battleResultWinner"
    );

const battleResultMessage =
    document.getElementById(
        "battleResultMessage"
    );

const rematchButton =
    document.getElementById(
        "rematchButton"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const homeButton =
    document.getElementById(
        "homeButton"
    );

const matchDetailsSection =
    document.getElementById(
        "matchDetailsSection"
    );

const matchDetailsContainer =
    document.getElementById(
        "matchDetailsContainer"
    );

const globalMessage =
    document.getElementById(
        "adgMessage"
    );


/* =========================================================
   CONNECTION
   ========================================================= */

battleSocket.on(
    "connect",
    () => {

        battleState.connected =
            true;


        updateConnectionStatus(
            true
        );


        if (
            battleState.matchId
        ) {

            battleSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        battleState.matchId
                }
            );

        }

    }
);


battleSocket.on(
    "disconnect",
    () => {

        battleState.connected =
            false;


        updateConnectionStatus(
            false
        );


        if (
            !battleState.finished
        ) {

            setBattleStatus(
                "Connection lost. Reconnecting..."
            );

        }

    }
);


battleSocket.on(
    "connect_error",
    () => {

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
   SERVER — BATTLE STATE
   ========================================================= */

battleSocket.on(
    "battle:state",
    data => {

        if (!data) {
            return;
        }


        /*
         * Unlike Draft/Role pages, both teams are allowed
         * here because the server has entered the Battle
         * phase.
         */

        if (
            data.matchId
        ) {

            battleState.matchId =
                data.matchId;

            saveSession(
                "adg_matchId",
                data.matchId
            );

        }


        if (
            data.anime
        ) {

            battleState.anime =
                data.anime;

        }


        if (
            data.phase
        ) {

            battleState.phase =
                data.phase;

        }


        if (
            data.teams
        ) {

            battleState.teams =
                normalizeTeams(
                    data.teams
                );

        }


        if (
            data.active
        ) {

            battleState.active =
                normalizeActive(
                    data.active
                );

        }


        if (
            typeof data.winner ===
            "number"
        ) {

            battleState.winner =
                data.winner;

        }


        if (
            typeof data.finished ===
            "boolean"
        ) {

            battleState.finished =
                data.finished;

        }


        updateBattleHeader();

        renderBattleTeams();


        if (
            data.log
        ) {

            addBattleLog(
                data.log,
                "system"
            );

        }


        if (
            battleState.finished &&
            battleState.winner
        ) {

            showBattleResult(
                battleState.winner
            );

        }

    }
);


/* =========================================================
   SERVER — BATTLE START
   ========================================================= */

battleSocket.on(
    "battle:start",
    data => {

        battleState.phase =
            "battle";

        battleState.finished =
            false;

        battleState.winner =
            null;


        if (
            data?.teams
        ) {

            battleState.teams =
                normalizeTeams(
                    data.teams
                );

        }


        if (
            data?.active
        ) {

            battleState.active =
                normalizeActive(
                    data.active
                );

        }


        updateBattleHeader();

        renderBattleTeams();

        addBattleLog(
            "⚔️ BATTLE STARTED!",
            "system"
        );


        playSound(
            "battle"
        );

    }
);


/* =========================================================
   SERVER — BATTLE EVENT
   ========================================================= */

battleSocket.on(
    "battle:event",
    event => {

        if (!event) {
            return;
        }


        battleState.events.push(
            event
        );


        processBattleEvent(
            event
        );

    }
);


/* =========================================================
   SERVER — BATTLE UPDATE
   ========================================================= */

battleSocket.on(
    "battle:update",
    data => {

        if (!data) {
            return;
        }


        if (
            data.teams
        ) {

            battleState.teams =
                normalizeTeams(
                    data.teams
                );

        }


        if (
            data.active
        ) {

            battleState.active =
                normalizeActive(
                    data.active
                );

        }


        if (
            typeof data.phase ===
            "string"
        ) {

            battleState.phase =
                data.phase;

        }


        if (
            typeof data.winner ===
            "number"
        ) {

            battleState.winner =
                data.winner;

        }


        if (
            typeof data.finished ===
            "boolean"
        ) {

            battleState.finished =
                data.finished;

        }


        renderBattleTeams();

        updateBattleHeader();


        if (
            battleState.finished &&
            battleState.winner
        ) {

            showBattleResult(
                battleState.winner
            );

        }

    }
);


/* =========================================================
   SERVER — CHARACTER DEFEATED
   ========================================================= */

battleSocket.on(
    "battle:defeat",
    data => {

        if (!data) {
            return;
        }


        const player =
            Number(
                data.playerNumber
            );


        const characterId =
            data.characterId;


        const character =
            findCharacter(
                player,
                characterId,
                data.characterName
            );


        if (character) {

            character.defeated =
                true;

            character.hp =
                0;

        }


        renderBattleTeams();


        const name =
            data.characterName ||
            character?.name ||
            "Character";


        addBattleLog(
            `💥 ${name} has been defeated!`,
            "defeat"
        );


        playSound(
            "defeat"
        );


        animateDefeat(
            player,
            characterId,
            data.characterName
        );

    }
);


/* =========================================================
   SERVER — BATTLE FINISHED
   ========================================================= */

battleSocket.on(
    "battle:finished",
    data => {

        battleState.finished =
            true;


        battleState.phase =
            "finished";


        battleState.winner =
            Number(
                data?.winner
            );


        renderBattleTeams();

        updateBattleHeader();


        if (
            battleState.winner
        ) {

            showBattleResult(
                battleState.winner
            );

        }

    }
);


/* =========================================================
   SERVER — MATCH DETAILS
   ========================================================= */

battleSocket.on(
    "battle:details",
    data => {

        if (!data) {
            return;
        }


        renderMatchDetails(
            data
        );

    }
);


/* =========================================================
   SERVER — REMATCH
   ========================================================= */

battleSocket.on(
    "rematch:created",
    data => {

        if (
            data?.matchId
        ) {

            battleState.matchId =
                data.matchId;


            saveSession(
                "adg_matchId",
                data.matchId
            );

        }


        battleState.finished =
            false;

        battleState.winner =
            null;


        hideBattleResult();


        window.location.href =
            "draft.html";

    }
);


/* =========================================================
   SERVER — BATTLE ERROR
   ========================================================= */

battleSocket.on(
    "battle:error",
    data => {

        showMessage(
            data?.message ||
            "Battle action failed.",
            "error"
        );

    }
);


/* =========================================================
   NORMALIZE TEAMS
   ========================================================= */

function normalizeTeams(
    teams
) {

    return {

        1:
            normalizeTeam(
                teams[1] ||
                teams["1"] ||
                []
            ),

        2:
            normalizeTeam(
                teams[2] ||
                teams["2"] ||
                []

            )

    };

}


function normalizeTeam(
    team
) {

    if (
        !Array.isArray(
            team
        )
    ) {

        return [];

    }


    return team.map(
        character => {

            if (
                typeof character ===
                "string"
            ) {

                return {
                    name:
                        character,

                    hp:
                        0,

                    maxHp:
                        0,

                    defeated:
                        false,

                    role:
                        null

                };

            }


            return {
                ...character
            };

        }
    );

}


function normalizeActive(
    active
) {

    return {

        1:
            active[1] ??
            active["1"] ??
            null,

        2:
            active[2] ??
            active["2"] ??
            null

    };

}


/* =========================================================
   HEADER
   ========================================================= */

function updateBattleHeader() {

    if (battlePhase) {

        if (
            battleState.finished
        ) {

            battlePhase.textContent =
                "🏁 BATTLE FINISHED";

        } else if (
            battleState.phase ===
            "battle"
        ) {

            battlePhase.textContent =
                "⚔️ BATTLE IN PROGRESS";

        } else {

            battlePhase.textContent =
                "PREPARING BATTLE...";

        }

    }


    if (battleStatus) {

        if (
            battleState.finished
        ) {

            battleStatus.textContent =
                "The battle has ended.";

        } else if (
            battleState.phase ===
            "battle"
        ) {

            battleStatus.textContent =
                "The server is controlling the battle.";

        } else {

            battleStatus.textContent =
                "Waiting for battle to start...";

        }

    }

}


/* =========================================================
   RENDER BOTH TEAMS
   ========================================================= */

function renderBattleTeams() {

    if (player1Team) {

        renderBattleTeam(
            player1Team,
            1
        );

    }


    if (player2Team) {

        renderBattleTeam(
            player2Team,
            2
        );

    }


    updateActiveCards();

}


/* =========================================================
   RENDER ONE TEAM
   ========================================================= */

function renderBattleTeam(
    container,
    playerNumber
) {

    if (!container) {
        return;
    }


    const title =
        playerNumber === 1
            ? "PLAYER 1"
            : "PLAYER 2";


    const playerName =
        playerNumber === 1
            ? player1Name
            : player2Name;


    if (playerName) {

        const serverName =
            battleState.teams[
                playerNumber
            ]?.playerName;


        playerName.textContent =
            serverName ||
            title;

    }


    /*
     * Preserve the heading.
     */

    const heading =
        playerName;


    container.innerHTML =
        "";


    if (heading) {

        container.appendChild(
            heading
        );

    }


    const team =
        battleState.teams[
            playerNumber
        ] || [];


    team.forEach(
        (character, index) => {

            const card =
                createBattleCard(
                    character,
                    playerNumber,
                    index
                );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE BATTLE CARD
   ========================================================= */

function createBattleCard(
    character,
    playerNumber,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "battle-character-card";


    const characterId =
        character.id ||
        `${playerNumber}-${index}`;


    card.dataset.player =
        playerNumber;


    card.dataset.characterId =
        characterId;


    if (
        character.defeated ||
        Number(
            character.hp
        ) <= 0
    ) {

        card.classList.add(
            "defeated"
        );

    }


    const imageWrapper =
        document.createElement(
            "div"
        );


    imageWrapper.className =
        "battle-character-image";


    const image =
        document.createElement(
            "img"
        );


    image.alt =
        character.name ||
        "Character";


    image.loading =
        "lazy";


    const fallback =
        document.createElement(
            "div"
        );


    fallback.className =
        "battle-image-fallback";


    fallback.textContent =
        (
            character.name ||
            "?"
        )
        .charAt(0)
        .toUpperCase();


    const candidates =
        typeof getCharacterImageCandidates ===
            "function"
            ? getCharacterImageCandidates(
                character.name,
                battleState.anime
            )
            : [
                `assist/characters/one-piece/${character.name}.jpg`
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


    imageWrapper.appendChild(
        image
    );

    imageWrapper.appendChild(
        fallback
    );


    card.appendChild(
        imageWrapper
    );


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "battle-character-info";


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
            "div"
        );


    role.className =
        "battle-role";


    if (
        character.role
    ) {

        const roleData =
            typeof getRole ===
                "function"
                ? getRole(
                    character.role
                )
                : null;


        role.textContent =
            roleData
                ? `${roleData.icon} ${roleData.name}`
                : character.role;

    } else {

        role.textContent =
            "Role";

    }


    info.appendChild(
        role
    );


    const hpContainer =
        document.createElement(
            "div"
        );


    hpContainer.className =
        "battle-hp";


    const hpHeader =
        document.createElement(
            "div"
        );


    hpHeader.className =
        "battle-hp-header";


    const hpLabel =
        document.createElement(
            "span"
        );


    hpLabel.textContent =
        "HP";


    const hpValue =
        document.createElement(
            "strong"
        );


    const hp =
        Math.max(
            0,
            Number(
                character.hp ||
                0
            )
        );


    const maxHp =
        Math.max(
            1,
            Number(
                character.maxHp ||
                hp ||
                1
            )
        );


    hpValue.textContent =
        `${hp} / ${maxHp}`;


    hpHeader.appendChild(
        hpLabel
    );

    hpHeader.appendChild(
        hpValue
    );


    const hpBar =
        document.createElement(
            "div"
        );


    hpBar.className =
        "battle-hp-bar";


    const hpFill =
        document.createElement(
            "div"
        );


    hpFill.className =
        "battle-hp-fill";


    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                (
                    hp /
                    maxHp
                ) *
                100
            )
        );


    hpFill.style.width =
        `${percentage}%`;


    hpBar.appendChild(
        hpFill
    );


    hpContainer.appendChild(
        hpHeader
    );

    hpContainer.appendChild(
        hpBar
    );


    info.appendChild(
        hpContainer
    );


    const status =
        document.createElement(
            "div"
        );


    status.className =
        "battle-character-status";


    if (
        character.defeated ||
        hp <= 0
    ) {

        status.textContent =
            "💀 DEFEATED";

        status.classList.add(
            "defeated"
        );

    } else {

        status.textContent =
            "● ACTIVE";

    }


    info.appendChild(
        status
    );


    card.appendChild(
        info
    );


    return card;

}


/* =========================================================
   ACTIVE CARD
   ========================================================= */

function updateActiveCards() {

    document
        .querySelectorAll(
            ".battle-character-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "active"
                );


                const player =
                    Number(
                        card.dataset.player
                    );


                const characterId =
                    card.dataset.characterId;


                const active =
                    battleState.active[
                        player
                    ];


                if (
                    active !== null &&
                    String(
                        active
                    ) ===
                    String(
                        characterId
                    )
                ) {

                    card.classList.add(
                        "active"
                    );

                }

            }
        );

}


/* =========================================================
   PROCESS BATTLE EVENT
   ========================================================= */

function processBattleEvent(
    event
) {

    const type =
        event.type ||
        "system";


    switch (type) {

        case "attack":

            handleAttackEvent(
                event
            );

            break;


        case "hit":

        case "damage":

            handleDamageEvent(
                event
            );

            break;


        case "special":

            handleSpecialEvent(
                event
            );

            break;


        case "defeat":

            handleDefeatEvent(
                event
            );

            break;


        case "victory":

            handleVictoryEvent(
                event
            );

            break;


        default:

            if (
                event.message
            ) {

                addBattleLog(
                    event.message,
                    "system"
                );

            }

            break;

    }

}


/* =========================================================
   ATTACK EVENT
   ========================================================= */

function handleAttackEvent(
    event
) {

    const attacker =
        event.attackerName ||
        "Character";


    const defender =
        event.defenderName ||
        "opponent";


    addBattleLog(
        `⚔️ ${attacker} attacks ${defender}!`,
        "attack"
    );


    playSound(
        "attack"
    );


    animateAttack(
        event
    );

}


/* =========================================================
   DAMAGE EVENT
   ========================================================= */

function handleDamageEvent(
    event
) {

    const attacker =
        event.attackerName ||
        "Attacker";


    const damage =
        Number(
            event.damage ||
            0
        );


    const critical =
        event.critical
            ? " 💥 CRITICAL!"
            : "";


    addBattleLog(
        `💥 ${attacker} deals ${damage} damage!${critical}`,
        event.critical
            ? "critical"
            : "damage"
    );


    playSound(
        event.critical
            ? "special"
            : "hit"
    );


    if (
        event.targetPlayer &&
        (
            event.targetCharacterId ||
            event.targetCharacterName
        )
    ) {

        animateDamage(
            event.targetPlayer,
            event.targetCharacterId,
            event.targetCharacterName
        );

    }

}


/* =========================================================
   SPECIAL EVENT
   ========================================================= */

function handleSpecialEvent(
    event
) {

    const name =
        event.attackerName ||
        "Character";


    addBattleLog(
        `⭐ ${name} uses a special action!`,
        "special"
    );


    playSound(
        "special"
    );


    animateSpecial(
        event
    );

}


/* =========================================================
   DEFEAT EVENT
   ========================================================= */

function handleDefeatEvent(
    event
) {

    const player =
        Number(
            event.playerNumber
        );


    const character =
        event.characterName ||
        "Character";


    addBattleLog(
        `💀 ${character} has been defeated!`,
        "defeat"
    );


    playSound(
        "defeat"
    );


    animateDefeat(
        player,
        event.characterId,
        character
    );

}


/* =========================================================
   VICTORY EVENT
   ========================================================= */

function handleVictoryEvent(
    event
) {

    const winner =
        Number(
            event.winner
        );


    if (
        winner
    ) {

        battleState.winner =
            winner;

        battleState.finished =
            true;

        showBattleResult(
            winner
        );

    }

}


/* =========================================================
   FIND CHARACTER
   ========================================================= */

function findCharacter(
    playerNumber,
    characterId,
    characterName
) {

    const team =
        battleState.teams[
            playerNumber
        ] || [];


    return team.find(
        character => {

            if (
                characterId &&
                character.id
            ) {

                return String(
                    character.id
                ) ===
                String(
                    characterId
                );

            }


            if (
                characterName
            ) {

                return character.name ===
                    characterName;

            }


            return false;

        }
    );

}


/* =========================================================
   ATTACK ANIMATION
   ========================================================= */

function animateAttack(
    event
) {

    const player =
        Number(
            event.attackerPlayer
        );


    const id =
        event.attackerCharacterId;


    const name =
        event.attackerName;


    const card =
        findCard(
            player,
            id,
            name
        );


    if (!card) {
        return;
    }


    card.classList.remove(
        "attack-animation"
    );


    void card.offsetWidth;


    card.classList.add(
        "attack-animation"
    );


    setTimeout(
        () => {

            card.classList.remove(
                "attack-animation"
            );

        },
        800
    );

}


/* =========================================================
   DAMAGE ANIMATION
   ========================================================= */

function animateDamage(
    player,
    characterId,
    characterName
) {

    const card =
        findCard(
            player,
            characterId,
            characterName
        );


    if (!card) {
        return;
    }


    card.classList.remove(
        "hit-animation"
    );


    void card.offsetWidth;


    card.classList.add(
        "hit-animation"
    );


    setTimeout(
        () => {

            card.classList.remove(
                "hit-animation"
            );

        },
        700
    );

}


/* =========================================================
   SPECIAL ANIMATION
   ========================================================= */

function animateSpecial(
    event
) {

    const player =
        Number(
            event.attackerPlayer
        );


    const card =
        findCard(
            player,
            event.attackerCharacterId,
            event.attackerName
        );


    if (!card) {
        return;
    }


    card.classList.remove(
        "special-animation"
    );


    void card.offsetWidth;


    card.classList.add(
        "special-animation"
    );


    setTimeout(
        () => {

            card.classList.remove(
                "special-animation"
            );

        },
        1000
    );

}


/* =========================================================
   DEFEAT ANIMATION
   =========================================================

   Sequence:

   1. defeated
   2. broken/shattered
   3. remain approximately 3 seconds
   4. fade away
   5. remove from active battlefield

   The server remains authoritative about the actual
   defeated state.
   ========================================================= */

function animateDefeat(
    player,
    characterId,
    characterName
) {

    const card =
        findCard(
            player,
            characterId,
            characterName
        );


    if (!card) {
        return;
    }


    if (
        card.dataset.defeatAnimation ===
        "true"
    ) {

        return;

    }


    card.dataset.defeatAnimation =
        "true";


    card.classList.add(
        "defeat-state"
    );


    /*
     * Create the visual broken-piece effect.
     */

    createShatterEffect(
        card
    );


    /*
     * Approximately 3-second defeated state.
     */

    setTimeout(
        () => {

            card.classList.add(
                "defeat-fade"
            );

        },
        3000
    );


    /*
     * Remove after fade.

     * We do not change the server state here.
     * This is purely presentation.
     */

    setTimeout(
        () => {

            card.classList.add(
                "removed-from-battle"
            );


            setTimeout(
                () => {

                    if (
                        card.parentNode
                    ) {

                        card.parentNode.removeChild(
                            card
                        );

                    }

                },
                500
            );

        },
        3800
    );

}


/* =========================================================
   SHATTER EFFECT
   ========================================================= */

function createShatterEffect(
    card
) {

    const existing =
        card.querySelector(
            ".battle-shatter"
        );


    if (existing) {
        return;
    }


    const effect =
        document.createElement(
            "div"
        );


    effect.className =
        "battle-shatter";


    const symbols = [
        "◆",
        "◇",
        "✦",
        "✧",
        "•",
        "╳",
        "⬟",
        "△"
    ];


    symbols.forEach(
        (symbol, index) => {

            const piece =
                document.createElement(
                    "span"
                );


            piece.className =
                "shatter-piece";


            piece.textContent =
                symbol;


            piece.style.setProperty(
                "--piece-index",
                String(index)
            );


            effect.appendChild(
                piece
            );

        }
    );


    card.appendChild(
        effect
    );

}


/* =========================================================
   FIND DOM CARD
   ========================================================= */

function findCard(
    player,
    characterId,
    characterName
) {

    const cards =
        document.querySelectorAll(
            ".battle-character-card"
        );


    for (
        const card of cards
    ) {

        if (
            Number(
                card.dataset.player
            ) !==
            Number(
                player
            )
        ) {

            continue;

        }


        if (
            characterId &&
            String(
                card.dataset.characterId
            ) ===
            String(
                characterId
            )
        ) {

            return card;

        }


        if (
            characterName
        ) {

            const nameElement =
                card.querySelector(
                    ".battle-character-info h3"
                );


            if (
                nameElement &&
                nameElement.textContent ===
                    characterName
            ) {

                return card;

            }

        }

    }


    return null;

}


/* =========================================================
   BATTLE LOG
   ========================================================= */

function addBattleLog(
    message,
    type = "system"
) {

    if (!battleLog) {
        return;
    }


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "battle-log-entry";


    if (type) {

        entry.classList.add(
            type
        );

    }


    entry.textContent =
        message;


    battleLog.appendChild(
        entry
    );


    while (
        battleLog.children.length >
        100
    ) {

        battleLog.removeChild(
            battleLog.firstChild
        );

    }


    battleLog.scrollTop =
        battleLog.scrollHeight;

}


/* =========================================================
   BATTLE RESULT
   ========================================================= */

function showBattleResult(
    winner
) {

    if (!battleResult) {
        return;
    }


    const playerWon =
        Number(
            winner
        ) ===
        Number(
            battleState.playerNumber
        );


    battleResult.classList.remove(
        "hidden",
        "victory",
        "defeat"
    );


    if (playerWon) {

        battleResult.classList.add(
            "victory"
        );


        if (battleResultIcon) {

            battleResultIcon.textContent =
                "🏆";

        }


        if (battleResultTitle) {

            battleResultTitle.textContent =
                "VICTORY";

        }


        if (battleResultWinner) {

            battleResultWinner.textContent =
                `PLAYER ${winner} WINS`;

        }


        if (battleResultMessage) {

            battleResultMessage.textContent =
                "Congratulations! Your team won the battle.";

        }


        playSound(
            "victory"
        );

    } else {

        battleResult.classList.add(
            "defeat"
        );


        if (battleResultIcon) {

            battleResultIcon.textContent =
                "💀";

        }


        if (battleResultTitle) {

            battleResultTitle.textContent =
                "DEFEAT";

        }


        if (battleResultWinner) {

            battleResultWinner.textContent =
                `PLAYER ${winner} WINS`;

        }


        if (battleResultMessage) {

            battleResultMessage.textContent =
                "Your team has been defeated.";

        }


        playSound(
            "defeat"
        );

    }

}


/* =========================================================
   HIDE RESULT
   ========================================================= */

function hideBattleResult() {

    if (!battleResult) {
        return;
    }


    battleResult.classList.add(
        "hidden"
    );

}


/* =========================================================
   MATCH DETAILS
   ========================================================= */

function renderMatchDetails(
    data
) {

    if (
        !matchDetailsSection ||
        !matchDetailsContainer
    ) {

        return;

    }


    const details =
        data.characters ||
        data.teams ||
        [];


    matchDetailsContainer.innerHTML =
        "";


    if (
        Array.isArray(
            details
        )
    ) {

        details.forEach(
            character => {

                matchDetailsContainer.appendChild(
                    createDetailCard(
                        character
                    )
                );

            }
        );

    } else {

        Object.values(
            details
        )
        .flat()
        .forEach(
            character => {

                matchDetailsContainer.appendChild(
                    createDetailCard(
                        character
                    )
                );

            }
        );

    }


    matchDetailsSection.classList.remove(
        "hidden"
    );

}


/* =========================================================
   DETAIL CARD
   ========================================================= */

function createDetailCard(
    character
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "match-detail-card";


    const name =
        document.createElement(
            "h3"
        );


    name.textContent =
        character?.name ||
        "Unknown";


    card.appendChild(
        name
    );


    const stats = [
        [
            "Role",
            character?.role ||
            "-"
        ],

        [
            "HP",
            character?.maxHp ??
            character?.hp ??
            "-"
        ],

        [
            "Damage Dealt",
            character?.damageDealt ??
            0
        ],

        [
            "Damage Received",
            character?.damageReceived ??
            0
        ],

        [
            "Attacks",
            character?.attacks ??
            0
        ],

        [
            "Specials",
            character?.specials ??
            0
        ],

        [
            "KOs",
            character?.kos ??
            0
        ]

    ];


    stats.forEach(
        ([label, value]) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "match-detail-row";


            const labelElement =
                document.createElement(
                    "span"
                );


            labelElement.textContent =
                label;


            const valueElement =
                document.createElement(
                    "strong"
                );


            valueElement.textContent =
                value;


            row.appendChild(
                labelElement
            );

            row.appendChild(
                valueElement
            );


            card.appendChild(
                row
            );

        }
    );


    return card;

}


/* =========================================================
   REMATCH
   ========================================================= */

if (rematchButton) {

    rematchButton.addEventListener(
        "click",
        () => {

            if (
                !battleState.finished
            ) {

                return;

            }


            rematchButton.disabled =
                true;


            battleSocket.emit(
                "rematch:request",
                {
                    matchId:
                        battleState.matchId
                }
            );


            addBattleLog(
                "🔄 Rematch requested...",
                "system"
            );

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
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = ""
) {

    if (!globalMessage) {
        return;
    }


    globalMessage.textContent =
        message;


    globalMessage.className =
        "adg-message";


    if (type) {

        globalMessage.classList.add(
            type
        );

    }


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                globalMessage.classList.add(
                    "hidden"
                );

            },
            4000
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
   SESSION SAVE
   ========================================================= */

function saveSession(
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
   INITIALIZE
   ========================================================= */

updateConnectionStatus(
    false
);

updateBattleHeader();


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.ADG_BATTLE_STATE =
    battleState;


/* =========================================================
   END OF BATTLE.JS
   ========================================================= */
```
