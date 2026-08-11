```javascript
/* =========================================================
   ADG — DRAFT.JS
   Private Online Multiplayer Draft Client
   ========================================================= */

"use strict";


/* =========================================================
   SOCKET
   ========================================================= */

const draftSocket = io(
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
        false

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
   RESTORE MATCH INFORMATION
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
    );


draftState.playerName =
    getSession(
        "adg_playerName"
    ) ||
    "";


draftState.anime =
    getSession(
        "adg_anime"
    ) ||
    "One Piece";


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


updateDropTokenUI();

updateConnectionUI(
    false
);

renderTeam();

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

        updateConnectionUI(
            true
        );


        /*
         * Reconnect to the existing match.
         *
         * The server must restore the player based on the
         * match ID rather than trusting the client for team
         * ownership.
         */

        if (
            draftState.matchId
        ) {

            draftSocket.emit(
                "match:reconnect",
                {
                    matchId:
                        draftState.matchId
                }
            );

        } else {

            showMessage(
                "Match information is missing.",
                "error"
            );

        }

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


        setDraftWaitingUI();


        showMessage(
            "Connection lost. Reconnecting...",
            "error"
        );

    }
);


/* =========================================================
   SERVER — PRIVATE DRAFT STATE
   ========================================================= */

draftSocket.on(
    "draft:state",
    data => {

        if (!data) {
            return;
        }


        /*
         * IMPORTANT:
         *
         * The server should send ONLY this player's team.
         *
         * No opponent team is accepted or rendered here.
         */


        if (
            Array.isArray(
                data.team
            )
        ) {

            draftState.team =
                data.team.map(
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


        if (data.anime) {

            draftState.anime =
                data.anime;


            if (animeTitle) {

                animeTitle.textContent =
                    data.anime;

            }


            setSession(
                "adg_anime",
                data.anime
            );

        }


        if (data.playerNumber) {

            draftState.playerNumber =
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


        if (data.matchId) {

            draftState.matchId =
                data.matchId;


            setSession(
                "adg_matchId",
                data.matchId
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
);


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


        /*
         * Only the character assigned to this player is
         * expected here.
         */

        if (data.character) {

            draftState.currentCharacter =
                typeof data.character ===
                    "string"
                    ? {
                        name:
                            data.character
                    }
                    : {
                        ...data.character
                    };

        }


        if (
            Array.isArray(
                data.team
            )
        ) {

            draftState.team =
                data.team.map(
                    character =>
                        typeof character ===
                            "string"
                            ? {
                                name:
                                    character
                            }
                            : {
                                ...character
                            }
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


        if (
            data.message
        ) {

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
                data.team.map(
                    character =>
                        typeof character ===
                            "string"
                            ? {
                                name:
                                    character
                            }
                            : {
                                ...character
                            }
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


        if (
            Array.isArray(
                data?.team
            )
        ) {

            draftState.team =
                data.team.map(
                    character =>
                        typeof character ===
                            "string"
                            ? {
                                name:
                                    character
                            }
                            : {
                                ...character
                            }
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
                data.matchId;


            setSession(
                "adg_matchId",
                data.matchId
            );

        }


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
        6
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


    if (
        !draftState.connected
    ) {

        showMessage(
            "You are not connected to the server.",
            "error"
        );

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
        6
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


    /*
     * The server remains authoritative about which character
     * is actually dropped.
     *
     * The client only sends the requested character name.
     */

    draftSocket.emit(
        "draft:drop",
        {
            matchId:
                draftState.matchId,

            character:
                characterName
        }
    );


    draftState.drawing =
        true;


    updateTurnUI();

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

        return;

    }


    if (
        draftState.drawing
    ) {

        draftTurn.textContent =
            "Drawing...";

        draftTurn.className =
            "draft-turn waiting";

        return;

    }


    if (
        draftState.myTurn
    ) {

        draftTurn.textContent =
            "🔥 YOUR TURN";

        draftTurn.className =
            "draft-turn your-turn";


        if (draftState.team.length < 6) {

            setButtonEnabled(
                drawButton,
                true
            );

        } else {

            setButtonEnabled(
                drawButton,
                false
            );

        }

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
        draftState.team.length === 6 &&
        draftState.myTurn &&
        !draftState.drawing &&
        !draftState.draftComplete;


    dropButton.disabled =
        !canDrop;


    if (
        draftState.team.length !==
        6
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


    if (draftState.dropToken) {

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


    if (
        characterImageFallback
    ) {

        characterImageFallback.classList.remove(
            "hidden"
        );

    }


    if (characterCard) {

        characterCard.classList.remove(
            "character-drawn"
        );

    }

}


/* =========================================================
   SET CHARACTER IMAGE
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
        tryImage;


    if (
        characterImageFallback
    ) {

        characterImageFallback.classList.remove(
            "hidden"
        );

    }


    characterImage.classList.add(
        "hidden"
    );


    tryImage();

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


    if (
        draftState.team.length ===
        0
    ) {

        for (
            let i = 0;
            i < 6;
            i++
        ) {

            draftTeam.appendChild(
                createEmptySlot(
                    i + 1
                )
            );

        }

        return;

    }


    draftState.team.forEach(
        (character, index) => {

            draftTeam.appendChild(
                createTeamCard(
                    character,
                    index
                )
            );

        }
    );


    /*
     * Fill remaining slots.
     */

    for (
        let i =
            draftState.team.length;
        i < 6;
        i++
    ) {

        draftTeam.appendChild(
            createEmptySlot(
                i + 1
            )
        );

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


    tryImage();


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "draft-slot-number";


    number.textContent =
        String(index + 1);


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

    if (
        draftTurn &&
        !draftState.myTurn
    ) {

        draftTurn.textContent =
            "Waiting for match...";

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
   MATCH EXIT
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
```
