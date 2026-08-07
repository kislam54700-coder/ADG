document.addEventListener("DOMContentLoaded", () => {

    const player1Battle =
        document.getElementById("player1Battle");

    const player2Battle =
        document.getElementById("player2Battle");

    const battleLog =
        document.getElementById("battleLog");

    const battleStatus =
        document.getElementById("battleStatus");


    const player1Team =
        JSON.parse(localStorage.getItem("player1Team")) || [];

    const player2Team =
        JSON.parse(localStorage.getItem("player2Team")) || [];


    const player1Roles =
        JSON.parse(localStorage.getItem("player1Roles")) || {};

    const player2Roles =
        JSON.parse(localStorage.getItem("player2Roles")) || {};



    function createFighterCard(character, role) {

        return `
        <div class="character-card">

            <h3>${character}</h3>

            <p>Role: ${role}</p>

            <div>
                ❤️ HP:
                <span class="hp">
                    100
                </span>
            </div>

        </div>
        `;
    }



    player1Team.forEach(character => {

        player1Battle.innerHTML +=
            createFighterCard(
                character,
                player1Roles[character]
            );

    });



    player2Team.forEach(character => {

        player2Battle.innerHTML +=
            createFighterCard(
                character,
                player2Roles[character]
            );

    });



    battleStatus.textContent =
        "Teams Ready ⚔";


    battleLog.innerHTML = `
        <p>
        Player 1 and Player 2 teams loaded.
        </p>
        <p>
        Battle system coming next...
        </p>
    `;


});