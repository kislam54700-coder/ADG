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

            fighter.hp *= 2.5;
            fighter.attack *= 2.5;
            fighter.defense *= 2.5;
            fighter.speed *= 2.5;

        }


        if (fighter.role === "Vice Captain") {

            fighter.hp *= 2.0;
            fighter.attack *= 2.0;
            fighter.defense *= 2.0;
            fighter.speed *= 2.0;

        }


        if (fighter.role === "Tank") {

            fighter.hp *= 2.2;
            fighter.defense *= 2.2;

        }


        if (fighter.role === "Healer") {

            fighter.hp *= 1.5;

        }


        if (fighter.role === "Support") {

            fighter.speed *= 1.2;

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

            <div class="fighter-card ${fighter.hp <= 0 ? "dead" : ""}">

                <h3>
                ${fighter.emoji} ${fighter.name}
                </h3>

                <p>
                ${fighter.role}
                </p>


                <div class="hp-bar">

                 <div 
                    class="hp-fill"
                    style="width:${(fighter.hp / fighter.maxHp) * 100}%">
                 </div>


                <p>
                ❤️ ${Math.floor(fighter.hp)} / ${Math.floor(fighter.maxHp)}
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

let round = 1;

let p1Index = 0;
let p2Index = 0;


function logBattle(message) {

    battleLog.innerHTML += `
        <p>${message}</p>
    `;

}



function attack(attacker, defender) {


    let damage =
        attacker.attack -
        (defender.defense * 0.5);


    damage =
        Math.floor(
            damage *
            (0.85 + Math.random() * 0.3)
        );


    if (damage < 1) {
        damage = 1;
    }


    defender.hp -= damage;


    if (defender.hp < 0) {
        defender.hp = 0;
    }


    logBattle(
        `⚔️ ${attacker.name} attacked ${defender.name} 💥 ${damage} damage`
    );


}



function updateHP() {

    displayTeam(
        player1Fighters,
        player1Battle
    );


    displayTeam(
        player2Fighters,
        player2Battle
    );

}



async function startBattle() {


    logBattle(
        "🔥 Battle Started!"
    );


    while (

        player1Fighters[p1Index].hp > 0 &&
        player2Fighters[p2Index].hp > 0

    ) {


        logBattle(
            `⚔️ ROUND ${round}`
        );


        let p1 =
        player1Fighters[p1Index];


        let p2 =
        player2Fighters[p2Index];


        if (p1.speed >= p2.speed) {


            attack(p1,p2);

            updateHP();


            if (p2.hp <= 0) {

    logBattle(
        `💀 ${p2.emoji} ${p2.name} has been defeated!`
    );

    p2Index++;

    if (p2Index < player2Fighters.length) {

        const next = player2Fighters[p2Index];

        logBattle(
            `⚡ ${next.emoji} ${next.name} enters the battle!`
        );

    }

}


            else {

                attack(p2,p1);

                updateHP();

            }


        }

        else {


            attack(p2,p1);

            updateHP();


            if (p1.hp <= 0) {

    logBattle(
        `💀 ${p1.emoji} ${p1.name} has been defeated!`
    );

    p1Index++;

    if (p1Index < player1Fighters.length) {

        const next = player1Fighters[p1Index];

        logBattle(
            `⚡ ${next.emoji} ${next.name} enters the battle!`
        );

    }

}


            else {

                attack(p1,p2);

                updateHP();

            }

        }


        round++;


        await new Promise(
            resolve =>
            setTimeout(resolve,800)
        );


    }


    if (p1Index >= player1Fighters.length) {

        battleStatus.textContent =
        "🏆 Player 2 Wins!";

    }

    else {

        battleStatus.textContent =
        "🏆 Player 1 Wins!";

    }


}

    startBattleBtn.addEventListener("click", () => {

    startBattleBtn.disabled = true;

    battleLog.innerHTML = "";

    startBattle();

});



});