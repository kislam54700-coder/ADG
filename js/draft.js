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

    drawBtn.addEventListener("click", () => {

        if (selectedAnime !== "One Piece") return;

        let character;

        do {

            const randomIndex = Math.floor(
                Math.random() * ONE_PIECE_CHARACTERS.length
            );

            character = ONE_PIECE_CHARACTERS[randomIndex];

        } while (draftedCharacters.includes(character));

        draftedCharacters.push(character);

        characterCard.innerHTML = `
            <h2>${character}</h2>
            <p>Drafted!</p>
        `;

        if (currentPlayer === 1) {

            player1Team.push(character);

            const li = document.createElement("li");
            li.textContent = character;
            player1List.appendChild(li);

            p1Count.textContent = player1Team.length;

            currentPlayer = 2;

        } else {

            player2Team.push(character);

            const li = document.createElement("li");
            li.textContent = character;
            player2List.appendChild(li);

            p2Count.textContent = player2Team.length;

            currentPlayer = 1;

        }

        if (player1Team.length === player2Team.length && player1Team.length < 6) {

            roundCounter.textContent =
                `Round ${player1Team.length + 1} / 6`;

        }

        if (currentPlayer === 1) {

            currentPlayerText.innerHTML = "<h3>Player 1 Turn</h3>";

        } else {

            currentPlayerText.innerHTML = "<h3>Player 2 Turn</h3>";

        }

        if (
            player1Team.length === 6 &&
            player2Team.length === 6
        ) {

            drawBtn.disabled = true;

            currentPlayerText.innerHTML =
                "<h3>Draft Complete!</h3>";

            nextPhaseBtn.classList.remove("hidden");

        }

    });

});