document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =========================================================
    // ELEMENTS
    // =========================================================

    const animeTitle =
        document.getElementById("animeTitle");

    const drawBtn =
        document.getElementById("drawBtn");

    const characterCard =
        document.getElementById("characterCard");

    const currentPlayerText =
        document.getElementById("currentPlayer");

    const roundCounter =
        document.getElementById("roundCounter");

    const player1List =
        document.getElementById("player1Team");

    const player2List =
        document.getElementById("player2Team");

    const p1Count =
        document.getElementById("p1Count");

    const p2Count =
        document.getElementById("p2Count");

    const nextPhaseBtn =
        document.getElementById("nextPhaseBtn");


    // =========================================================
    // SELECTED ANIME
    // =========================================================

    const selectedAnime =
        localStorage.getItem("selectedAnime");

    animeTitle.textContent =
        selectedAnime || "No Anime Selected";


    // =========================================================
    // DRAFT DATA
    // =========================================================

    let currentPlayer = 1;

    const player1Team = [];
    const player2Team = [];

    const draftedCharacters = [];


    // =========================================================
    // CONTINUE TO ROLE ASSIGNMENT
    // =========================================================

    if (nextPhaseBtn) {

        nextPhaseBtn.addEventListener(
            "click",
            () => {

                // Save again for safety
                localStorage.setItem(
                    "player1Team",
                    JSON.stringify(player1Team)
                );

                localStorage.setItem(
                    "player2Team",
                    JSON.stringify(player2Team)
                );

                window.location.href =
                    "roles.html";
            }
        );
    }


    // =========================================================
    // DRAW CHARACTER
    // =========================================================

    if (drawBtn) {

        drawBtn.addEventListener(
            "click",
            () => {

                // -------------------------------------------------
                // ONLY ONE PIECE FOR NOW
                // -------------------------------------------------

                if (
                    selectedAnime !==
                    "One Piece"
                ) {

                    return;
                }


                // -------------------------------------------------
                // MAX TEAM CHECK
                // -------------------------------------------------

                if (
                    player1Team.length >= 6 &&
                    player2Team.length >= 6
                ) {

                    return;
                }


                // -------------------------------------------------
                // RANDOM CHARACTER
                // -------------------------------------------------

                let character;

                do {

                    const randomIndex =
                        Math.floor(
                            Math.random() *
                            ONE_PIECE_CHARACTERS.length
                        );

                    character =
                        ONE_PIECE_CHARACTERS[
                            randomIndex
                        ];

                } while (
                    draftedCharacters.includes(
                        character
                    )
                );


                // Save to drafted list
                draftedCharacters.push(
                    character
                );


                // =================================================
                // CHARACTER IMAGE
                // =================================================

                const image =
                    getCharacterImage(
                        character
                    );


                // =================================================
                // SHOW DRAWN CHARACTER
                // =================================================

                if (characterCard) {

                    characterCard.innerHTML = `

                        <div class="draft-character-content">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${image}"
                                            alt="${character}"
                                            class="character-image"
                                            onerror="this.style.display='none';"
                                        >
                                      `
                                    : `
                                        <div
                                            class="character-image-placeholder"
                                        >
                                            🎭
                                        </div>
                                      `
                            }

                            <h2>
                                ${character}
                            </h2>

                            <p>
                                🎴 Drafted!
                            </p>

                        </div>

                    `;
                }


                // =================================================
                // PLAYER 1
                // =================================================

                if (
                    currentPlayer === 1
                ) {

                    player1Team.push(
                        character
                    );


                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        character;

                    if (player1List) {

                        player1List.appendChild(
                            li
                        );
                    }


                    if (p1Count) {

                        p1Count.textContent =
                            player1Team.length;
                    }


                    currentPlayer = 2;
                }


                // =================================================
                // PLAYER 2
                // =================================================

                else {

                    player2Team.push(
                        character
                    );


                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        character;

                    if (player2List) {

                        player2List.appendChild(
                            li
                        );
                    }


                    if (p2Count) {

                        p2Count.textContent =
                            player2Team.length;
                    }


                    currentPlayer = 1;
                }


                // =================================================
                // ROUND DISPLAY
                // =================================================

                if (
                    player1Team.length ===
                        player2Team.length &&
                    player1Team.length < 6
                ) {

                    if (roundCounter) {

                        roundCounter.textContent =
                            `Round ${
                                player1Team.length + 1
                            } / 6`;
                    }
                }


                // =================================================
                // TURN DISPLAY
                // =================================================

                if (
                    currentPlayer === 1
                ) {

                    if (currentPlayerText) {

                        currentPlayerText.innerHTML =
                            "<h3>Player 1 Turn</h3>";
                    }

                } else {

                    if (currentPlayerText) {

                        currentPlayerText.innerHTML =
                            "<h3>Player 2 Turn</h3>";
                    }
                }


                // =================================================
                // DRAFT COMPLETE
                // =================================================

                if (
                    player1Team.length === 6 &&
                    player2Team.length === 6
                ) {

                    // ------------------------------------------------
                    // SAVE PLAYER TEAMS
                    // ------------------------------------------------

                    localStorage.setItem(
                        "player1Team",
                        JSON.stringify(
                            player1Team
                        )
                    );

                    localStorage.setItem(
                        "player2Team",
                        JSON.stringify(
                            player2Team
                        )
                    );


                    // ------------------------------------------------
                    // DISABLE DRAW
                    // ------------------------------------------------

                    drawBtn.disabled =
                        true;

                    drawBtn.classList.add(
                        "hidden"
                    );


                    // ------------------------------------------------
                    // UPDATE STATUS
                    // ------------------------------------------------

                    if (currentPlayerText) {

                        currentPlayerText.innerHTML =
                            "<h3>✅ Draft Complete!</h3>";
                    }


                    if (roundCounter) {

                        roundCounter.textContent =
                            "Draft Complete — 6 / 6";
                    }


                    // ------------------------------------------------
                    // SHOW NEXT BUTTON
                    // ------------------------------------------------

                    if (nextPhaseBtn) {

                        nextPhaseBtn.classList.remove(
                            "hidden"
                        );
                    }
                }

            }
        );
    }

});