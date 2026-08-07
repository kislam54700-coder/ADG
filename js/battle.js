document.addEventListener("DOMContentLoaded", () => {

    const player1Battle = document.getElementById("player1Battle");
    const player2Battle = document.getElementById("player2Battle");

    const battleLog = document.getElementById("battleLog");
    const battleStatus = document.getElementById("battleStatus");
    const startBattleBtn = document.getElementById("startBattleBtn");


    const player1Team =
        JSON.parse(localStorage.getItem("player1Team")) || [];

    const player2Team =
        JSON.parse(localStorage.getItem("player2Team")) || [];


    const player1Roles =
        JSON.parse(localStorage.getItem("player1Roles")) || {};

    const player2Roles =
        JSON.parse(localStorage.getItem("player2Roles")) || {};



    const baseStats = {

        hp: 1000,
        attack: 100,
        defense: 80,
        speed: 80

    };


    let player1Fighters = [];
    let player2Fighters = [];



    function getRoleEmoji(role) {

        const emojis = {

            "Captain": "👑",
            "Vice Captain": "⚔️",
            "Tank": "🛡️",
            "Healer": "❤️",
            "Support": "⭐",
            "Wildcard": "☠️"

        };

        return emojis[role] || "🔥";

    }



    function createFighter(name, role) {

        let fighter = {

            name: name,
            role: role,
            emoji: getRoleEmoji(role),

            hp: baseStats.hp,
            maxHp: baseStats.hp,

            attack: baseStats.attack,
            defense: baseStats.defense,
            speed: baseStats.speed

        };


        applyRoleBonus(fighter);


        return fighter;

    }



    function applyRoleBonus(fighter) {


        if (fighter.role === "Captain") {

            fighter.hp *= 1.2;
            fighter.attack *= 1.2;
            fighter.defense *= 1.2;
            fighter.speed *= 1.2;

        }


        if (fighter.role === "Vice Captain") {

            fighter.hp *= 1.1;
            fighter.attack *= 1.1;
            fighter.defense *= 1.1;
            fighter.speed *= 1.1;

        }


        if (fighter.role === "Tank") {

            fighter.hp *= 1.3;
            fighter.defense *= 1.3;

        }


        if (fighter.role === "Healer") {

            fighter.hp *= 1.2;

        }


        if (fighter.role === "Support") {

            fighter.speed *= 1.15;

        }


        if (fighter.role === "Wildcard") {

            fighter.attack *= 1.25;

        }

    }



    player1Team.forEach(character => {

        player1Fighters.push(
            createFighter(
                character,
                player1Roles[character]
            )
        );

    });



    player2Team.forEach(character => {

        player2Fighters.push(
            createFighter(
                character,
                player2Roles[character]
            )
        );

    });



    function displayTeam(team, container) {


        container.innerHTML = "";


        team.forEach(fighter => {


            container.innerHTML += `

            <div class="fighter-card">

                <h3>
                ${fighter.emoji} ${fighter.name}
                </h3>

                <p>
                ${fighter.role}
                </p>


                <div class="hp-bar">

                    <div class="hp-fill"></div>

                </div>


                <p>
                ❤️ ${Math.floor(fighter.hp)}
                /
                ${Math.floor(fighter.maxHp)}
                </p>


                <p>
                ⚔️ ${Math.floor(fighter.attack)}
                🛡️ ${Math.floor(fighter.defense)}
                ⚡ ${Math.floor(fighter.speed)}
                </p>


            </div>

            `;

        });

    }



    displayTeam(
        player1Fighters,
        player1Battle
    );


    displayTeam(
        player2Fighters,
        player2Battle
    );



    battleStatus.textContent =
        "⚔️ Teams Ready!";



    battleLog.innerHTML = `

        <p>
        🏴 Player 1 and Player 2 teams loaded.
        </p>

        <p>
        🔥 Battle system ready.
        </p>

    `;



    startBattleBtn.addEventListener("click", () => {

        battleLog.innerHTML += `

        <p>
        ⚔️ Battle started!
        </p>

        `;

    });



});