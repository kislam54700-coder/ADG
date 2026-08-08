document.addEventListener("DOMContentLoaded", () => {

    const animeTitle = document.getElementById("animeTitle");
    const drawBtn = document.getElementById("drawBtn");
    const characterCard = document.getElementById("characterCard");

    const currentPlayerText = document.getElementById("currentPlayer");
    const roundCounter = document.getElementById("roundCounter");

    const player1List = document.getElementById("player1Team");
    const player2List = document.getElementById("player2Team");

    const p1Count = document.getElementById("p1Count");
    const p2Count = document.getElementById("p2Count");

    const nextPhaseBtn = document.getElementById("nextPhaseBtn");

    const selectedAnime = localStorage.getItem("selectedAnime");

    animeTitle.textContent = selectedAnime || "No Anime Selected";

    let currentPlayer = 1;

    const player1Team = [];
    const player2Team = [];

    const draftedCharacters = [];

    // Continue button
    nextPhaseBtn.addEventListener("click", () => {
        window.location.href = "roles.html";
    });

    // Draw button
    drawBtn.addEventListener("click", () => {

        if (selectedAnime !== "One Piece") return;

        let character;

        // Prevent duplicate characters
        do {

            const randomIndex = Math.floor(
                Math.random() * ONE_PIECE_CHARACTERS.length
            );

            character = ONE_PIECE_CHARACTERS[randomIndex];

        } while (draftedCharacters.includes(character));

        draftedCharacters.push(character);

        // Show drawn character
        const image = getCharacterImage(character);

characterCard.innerHTML = `
    <div class="drawn-character">

        ${
            image
            ? `
                <img
                    src="${image}"
                    alt="${character}"
                    class="character-image"
                >
              `
            : `
                <div class="character-image-placeholder">
                    🎭
                </div>
              `
        }

        <h2>${character}</h2>

        <p>Drafted!</p>

    </div>
`;

        // Player 1
        if (currentPlayer === 1) {

            player1Team.push(character);

            const li = document.createElement("li");
            li.textContent = character;
            player1List.appendChild(li);

            p1Count.textContent = player1Team.length;

            currentPlayer = 2;

        }

        // Player 2
        else {

            player2Team.push(character);

            const li = document.createElement("li");
            li.textContent = character;
            player2List.appendChild(li);

            p2Count.textContent = player2Team.length;

            currentPlayer = 1;

        }

        // Update round after both players draw
        if (
            player1Team.length === player2Team.length &&
            player1Team.length < 6
        ) {

            roundCounter.textContent =
                `Round ${player1Team.length + 1} / 6`;

        }

        // Update turn text
        if (currentPlayer === 1) {

            currentPlayerText.innerHTML =
                "<h3>Player 1 Turn</h3>";

        } else {

            currentPlayerText.innerHTML =
                "<h3>Player 2 Turn</h3>";

        }

        // Draft finished
        if (
            player1Team.length === 6 &&
            player2Team.length === 6
        ) {

            // Save teams
            localStorage.setItem(
                "player1Team",
                JSON.stringify(player1Team)
            );

            localStorage.setItem(
                "player2Team",
                JSON.stringify(player2Team)
            );

            drawBtn.disabled = true;
            drawBtn.classList.add("hidden");

            currentPlayerText.innerHTML =
                "<h3>✅ Draft Complete!</h3>";

            nextPhaseBtn.classList.remove("hidden");

        }

    });

});