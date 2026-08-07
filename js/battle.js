document.addEventListener("DOMContentLoaded", () => {

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


    let player1Fighters = [];
    let player2Fighters = [];


    const baseStats = {

        hp: 1000,
        attack: 100,
        defense: 80,
        speed: 80

    };


    function createFighter(name, role) {

        let fighter = {

            name: name,
            role: role,

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



    function log(message) {

        battleLog.innerHTML +=
            `<p>${message}</p>`;

        battleLog.scrollTop =
            battleLog.scrollHeight;

    }



    function attack(attacker, defender) {


        let damage =
            attacker.attack -
            defender.defense * 0.5;


        damage =
            Math.floor(
                damage *
                (0.85 + Math.random() * 0.3)
            );


        if (damage < 1) {
            damage = 1;
        }


        defender.hp -= damage;


        log(
            `⚔ ${attacker.name} attacked ${defender.name} for ${damage} damage`
        );


        if (defender.hp < 0) {
            defender.hp = 0;
        }


    }



    function getAlive(team) {

        return team.filter(
            fighter => fighter.hp > 0
        );

    }



    async function startBattle() {


        startBattleBtn.disabled = true;

        battleStatus.textContent =
            "⚔ Battle Started";


        let round = 1;


        while (
            getAlive(player1Fighters).length > 0 &&
            getAlive(player2Fighters).length > 0
        ) {


            log(
                `----- Round ${round} -----`
            );


            let p1 =
                getAlive(player1Fighters)[0];


            let p2 =
                getAlive(player2Fighters)[0];


            if (p1.speed >= p2.speed) {

                attack(p1, p2);

                if (p2.hp > 0) {
                    attack(p2, p1);
                }

            } else {

                attack(p2, p1);

                if (p1.hp > 0) {
                    attack(p1, p2);
                }

            }


            await new Promise(
                resolve =>
                setTimeout(resolve, 700)
            );


            round++;

        }



        if (
            getAlive(player1Fighters).length > 0
        ) {

            battleStatus.textContent =
                "🏆 Player 1 Wins!";

        } else {

            battleStatus.textContent =
                "🏆 Player 2 Wins!";

        }

    }



    startBattleBtn.addEventListener(
        "click",
        startBattle
    );


});