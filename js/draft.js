document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    // ========================================================
    // ELEMENTS
    // ========================================================

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


    // ========================================================
    // SELECTED ANIME
    // ========================================================

    const selectedAnime =
        localStorage.getItem("selectedAnime");

    if (animeTitle) {

        animeTitle.textContent =
            selectedAnime || "No Anime Selected";
    }


    // ========================================================
    // VALIDATE DATABASE
    // ========================================================

    if (
        typeof ONE_PIECE_CHARACTERS ===
        "undefined"
    ) {

        console.error(
            "❌ ONE_PIECE_CHARACTERS is not available."
        );

        if (currentPlayerText) {

            currentPlayerText.innerHTML =
                "<h3>❌ Database failed to load.</h3>";
        }

        if (drawBtn) {
            drawBtn.disabled = true;
        }

        return;
    }


    // ========================================================
    // DRAFT DATA
    // ========================================================

    let currentPlayer = 1;

    const player1Team = [];
    const player2Team = [];

    const draftedCharacters = [];


    // ========================================================
    // UPDATE COUNTERS
    // ========================================================

    function updateCounts() {

        if (p1Count) {

            p1Count.textContent =
                player1Team.length;
        }

        if (p2Count) {

            p2Count.textContent =
                player2Team.length;
        }
    }


    // ========================================================
    // UPDATE TURN
    // ========================================================

    function updateTurnDisplay() {

        if (!currentPlayerText) {
            return;
        }

        if (
            currentPlayer === 1
        ) {

            currentPlayerText.innerHTML =
                "<h3>Player 1 Turn</h3>";

        } else {

            currentPlayerText.innerHTML =
                "<h3>Player 2 Turn</h3>";
        }
    }


    // ========================================================
    // UPDATE ROUND
    // ========================================================

    function updateRoundDisplay() {

        if (!roundCounter) {
            return;
        }


        if (
            player1Team.length === 6 &&
            player2Team.length === 6
        ) {

            roundCounter.textContent =
                "Draft Complete — 6 / 6";

            return;
        }


        const totalDrafted =
            player1Team.length +
            player2Team.length;


        const round =
            Math.floor(
                totalDrafted / 2
            ) + 1;


        roundCounter.textContent =
            `Round ${Math.min(round, 6)} / 6`;
    }


    // ========================================================
    // CREATE TEAM LIST ITEM
    // ========================================================

    function addTeamCharacter(
        character,
        playerNumber
    ) {

        const list =
            playerNumber === 1
                ? player1List
                : player2List;


        if (!list) {
            return;
        }


        const li =
            document.createElement("li");


        li.textContent =
            character;


        list.appendChild(li);
    }


    // ========================================================
    // SHOW CHARACTER
    // ========================================================

    function showDrawnCharacter(
        character
    ) {

        if (!characterCard) {
            return;
        }


        characterCard.innerHTML = "";


        const content =
            document.createElement("div");


        content.className =
            "draft-character-content";


        // ----------------------------------------------------
        // IMAGE
        // ----------------------------------------------------

        const image =
            document.createElement("img");


        image.className =
            "character-image";


        image.alt =
            character;


        const imageURL =
            getCharacterImage(character);


        if (imageURL) {

            image.src =
                imageURL;

        } else {

            image.src =
                createFallbackImage(
                    character
                );
        }


        image.onerror =
            function () {

                this.onerror = null;

                this.src =
                    createFallbackImage(
                        character
                    );
            };


        // ----------------------------------------------------
        // NAME
        // ----------------------------------------------------

        const name =
            document.createElement("h2");


        name.textContent =
            character;


        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        const status =
            document.createElement("p");


        status.textContent =
            "🎴 Drafted!";


        // ----------------------------------------------------
        // BUILD
        // ----------------------------------------------------

        content.appendChild(
            image
        );

        content.appendChild(
            name
        );

        content.appendChild(
            status
        );


        characterCard.appendChild(
            content
        );
    }


    // ========================================================
    // FALLBACK IMAGE
    // ========================================================

    function createFallbackImage(
        character
    ) {

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg"
                 width="300"
                 height="380"
                 viewBox="0 0 300 380">

                <rect
                    width="300"
                    height="380"
                    fill="#171717"
                />

                <text
                    x="150"
                    y="150"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    font-size="60">
                    🎴
                </text>

                <text
                    x="150"
                    y="230"
                    text-anchor="middle"
                    fill="white"
                    font-size="20">
                    ${escapeHTML(character)}
                </text>

            </svg>
        `;


        return (
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg)
        );
    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ========================================================
    // SAVE TEAMS
    // ========================================================

    function saveTeams() {

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
    }


    // ========================================================
    // NEXT PHASE
    // ========================================================

    if (nextPhaseBtn) {

        nextPhaseBtn.addEventListener(
            "click",
            () => {

                if (
                    player1Team.length !== 6 ||
                    player2Team.length !== 6
                ) {

                    return;
                }


                saveTeams();


                window.location.href =
                    "roles.html";
            }
        );
    }


    // ========================================================
    // DRAW CHARACTER
    // ========================================================

    if (drawBtn) {

        drawBtn.addEventListener(
            "click",
            () => {


                // ------------------------------------------------
                // CHECK ANIME
                // ------------------------------------------------

                if (
                    selectedAnime !==
                    "One Piece"
                ) {

                    if (currentPlayerText) {

                        currentPlayerText.innerHTML =
                            "<h3>⚠️ One Piece is currently available.</h3>";
                    }

                    return;
                }


                // ------------------------------------------------
                // CHECK COMPLETE
                // ------------------------------------------------

                if (
                    player1Team.length >= 6 &&
                    player2Team.length >= 6
                ) {

                    return;
                }


                // ------------------------------------------------
                // GET RANDOM CHARACTER
                // ------------------------------------------------

                const character =
                    getRandomOnePieceCharacter(
                        draftedCharacters
                    );


                if (!character) {

                    console.error(
                        "❌ No characters available."
                    );

                    return;
                }


                // ------------------------------------------------
                // SAVE DRAFTED CHARACTER
                // ------------------------------------------------

                draftedCharacters.push(
                    character
                );


                // ------------------------------------------------
                // SHOW CHARACTER
                // ------------------------------------------------

                showDrawnCharacter(
                    character
                );


                // ------------------------------------------------
                // PLAYER 1
                // ------------------------------------------------

                if (
                    currentPlayer === 1
                ) {

                    player1Team.push(
                        character
                    );


                    addTeamCharacter(
                        character,
                        1
                    );


                    currentPlayer = 2;

                }


                // ------------------------------------------------
                // PLAYER 2
                // ------------------------------------------------

                else {

                    player2Team.push(
                        character
                    );


                    addTeamCharacter(
                        character,
                        2
                    );


                    currentPlayer = 1;
                }


                // ------------------------------------------------
                // UPDATE UI
                // ------------------------------------------------

                updateCounts();

                updateRoundDisplay();

                updateTurnDisplay();


                // ------------------------------------------------
                // CHECK COMPLETE
                // ------------------------------------------------

                if (
                    player1Team.length === 6 &&
                    player2Team.length === 6
                ) {

                    saveTeams();


                    drawBtn.disabled =
                        true;


                    drawBtn.classList.add(
                        "hidden"
                    );


                    if (currentPlayerText) {

                        currentPlayerText.innerHTML =
                            "<h3>✅ Draft Complete!</h3>";
                    }


                    if (roundCounter) {

                        roundCounter.textContent =
                            "Draft Complete — 6 / 6";
                    }


                    if (nextPhaseBtn) {

                        nextPhaseBtn.classList.remove(
                            "hidden"
                        );

                        nextPhaseBtn.disabled =
                            false;
                    }

                }
            }
        );
    }


    // ========================================================
    // INITIAL STATE
    // ========================================================

    updateCounts();

    updateRoundDisplay();

    updateTurnDisplay();


    if (nextPhaseBtn) {

        nextPhaseBtn.classList.add(
            "hidden"
        );

        nextPhaseBtn.disabled =
            true;
    }

});