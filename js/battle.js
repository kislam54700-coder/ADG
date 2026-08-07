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


    const MAX_ROUNDS = 50;

    let round = 1;

    let player1Fighters = [];
    let player2Fighters = [];


    // =========================
    // ROLE EMOJIS
    // =========================

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


    // =========================
    // CREATE FIGHTER
    // =========================

    function createFighter(name, role) {

        const fighter = {

            name: name,
            role: role,
            emoji: getRoleEmoji(role),

            hp: baseStats.hp,
            maxHp: baseStats.hp,

            attack: baseStats.attack,
            defense: baseStats.defense,
            speed: baseStats.speed,

            alive: true,

            abilityUsed: false,

            protecting: false,

            assistReady: true

        };


        applyRoleBonus(fighter);

        fighter.maxHp = fighter.hp;

        return fighter;

    }


    // =========================
    // ROLE STAT BONUSES
    // =========================

    function applyRoleBonus(fighter) {

        if (fighter.role === "Captain") {

            fighter.hp *= 1.20;
            fighter.attack *= 1.20;
            fighter.defense *= 1.20;
            fighter.speed *= 1.20;

        }


        if (fighter.role === "Vice Captain") {

            fighter.hp *= 1.10;
            fighter.attack *= 1.10;
            fighter.defense *= 1.10;
            fighter.speed *= 1.10;

        }


        if (fighter.role === "Tank") {

            fighter.hp *= 1.30;
            fighter.defense *= 1.30;

        }


        if (fighter.role === "Healer") {

            fighter.hp *= 1.20;

        }


        if (fighter.role === "Support") {

            fighter.speed *= 1.15;

        }


        if (fighter.role === "Wildcard") {

            fighter.attack *= 1.25;

        }

    }


    // =========================
    // LOAD TEAMS
    // =========================

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


    // =========================
    // DISPLAY TEAM
    // =========================

    function displayTeam(team, container) {

        container.innerHTML = "";


        team.forEach((fighter, index) => {

            const hpPercent =
                Math.max(
                    0,
                    (fighter.hp / fighter.maxHp) * 100
                );


            const cardClass =
                fighter.hp <= 0
                    ? "fighter-card dead"
                    : fighter.protecting
                        ? "fighter-card active"
                        : "fighter-card";


            container.innerHTML += `

                <div
                    class="${cardClass}"
                    id="${container.id}-fighter-${index}"
                >

                    <h3>
                        ${fighter.emoji}
                        ${fighter.name}
                    </h3>

                    <p>
                        ${fighter.role}
                    </p>

                    <div class="hp-bar">

                        <div
                            class="hp-fill"
                            style="width: ${hpPercent}%"
                        ></div>

                    </div>

                    <p>
                        ❤️
                        ${Math.floor(fighter.hp)}
                        /
                        ${Math.floor(fighter.maxHp)}
                    </p>

                    <p>
                        ⚔️ ${Math.floor(fighter.attack)}
                        🛡️ ${Math.floor(fighter.defense)}
                        ⚡ ${Math.floor(fighter.speed)}
                    </p>

                    ${
                        fighter.protecting
                            ? "<p>🛡️ Protecting!</p>"
                            : ""
                    }

                </div>

            `;

        });

    }


    function updateBattleUI() {

        displayTeam(
            player1Fighters,
            player1Battle
        );

        displayTeam(
            player2Fighters,
            player2Battle
        );

    }


    // =========================
    // BATTLE LOG
    // =========================

    function logBattle(message) {

        battleLog.innerHTML += `
            <p>${message}</p>
        `;

        battleLog.scrollTop =
            battleLog.scrollHeight;

    }


    // =========================
    // ALIVE FIGHTERS
    // =========================

    function getAliveFighters(team) {

        return team.filter(
            fighter => fighter.hp > 0
        );

    }


    // =========================
    // RANDOM TARGET
    // =========================

    function chooseTarget(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        const randomIndex =
            Math.floor(
                Math.random() * alive.length
            );

        return alive[randomIndex];

    }


    // =========================
    // CAPTAIN COMMAND
    // =========================

    function captainAbility(
        captain,
        team
    ) {

        if (captain.abilityUsed) {
            return;
        }


        captain.abilityUsed = true;


        team.forEach(fighter => {

            if (fighter.hp > 0) {

                fighter.attack *= 1.10;

            }

        });


        logBattle(
            `👑 ${captain.name} used Command! Team attack +10%!`
        );

    }


    // =========================
    // VICE CAPTAIN ASSIST
    // =========================

    function viceCaptainAssist(
        viceCaptain,
        enemyTeam
    ) {

        if (!viceCaptain.assistReady) {
            return;
        }


        // 35% chance

        if (Math.random() > 0.35) {
            return;
        }


        const target =
            chooseTarget(enemyTeam);


        if (!target) {
            return;
        }


        const damage =
            Math.floor(
                viceCaptain.attack * 0.50
            );


        target.hp -= damage;


        if (target.hp < 0) {
            target.hp = 0;
        }


        logBattle(
            `⚔️ ${viceCaptain.name} performed Assist! 💥 ${damage} bonus damage!`
        );


        if (target.hp <= 0) {

            target.alive = false;

            logBattle(
                `💀 ${target.name} was defeated by Assist!`
            );

        }


        viceCaptain.assistReady = false;

    }


    // =========================
    // TANK PROTECTION
    // =========================

    function tankAbility(
        tank,
        team
    ) {

        if (tank.abilityUsed) {
            return;
        }


        const allies =
            getAliveFighters(team)
                .filter(
                    fighter =>
                        fighter !== tank
                );


        if (allies.length === 0) {
            return;
        }


        // Protect the teammate
        // with the lowest HP percentage

        allies.sort(
            (a, b) =>
                (a.hp / a.maxHp) -
                (b.hp / b.maxHp)
        );


        const target =
            allies[0];


        tank.abilityUsed = true;
        tank.protecting = true;


        target.protectedBy = tank;


        logBattle(
            `🛡️ ${tank.name} is protecting ${target.name}!`
        );

    }


    // =========================
    // HEALER
    // =========================

    function healerAbility(
        healer,
        team
    ) {

        const allies =
            getAliveFighters(team)
                .filter(
                    fighter =>
                        fighter !== healer &&
                        fighter.hp < fighter.maxHp * 0.70
                );


        if (allies.length === 0) {

            return false;

        }


        allies.sort(
            (a, b) =>
                (a.hp / a.maxHp) -
                (b.hp / b.maxHp)
        );


        const target =
            allies[0];


        const healAmount =
            Math.floor(
                target.maxHp * 0.20
            );


        target.hp =
            Math.min(
                target.maxHp,
                target.hp + healAmount
            );


        logBattle(
            `❤️ ${healer.name} healed ${target.name} +${healAmount} HP!`
        );


        return true;

    }


    // =========================
    // SUPPORT BUFF
    // =========================

    function supportAbility(
        support,
        team
    ) {

        if (support.abilityUsed) {
            return;
        }


        support.abilityUsed = true;


        team.forEach(fighter => {

            if (fighter.hp > 0) {

                fighter.speed *= 1.10;
                fighter.attack *= 1.05;

            }

        });


        logBattle(
            `⭐ ${support.name} used Team Buff! Attack +5%, Speed +10%!`
        );

    }


    // =========================
    // WILDCARD
    // =========================

    function wildcardAbility(
        fighter
    ) {

        if (fighter.abilityUsed) {
            return;
        }


        fighter.abilityUsed = true;


        const random =
            Math.floor(
                Math.random() * 3
            );


        if (random === 0) {

            fighter.attack *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated Berserker! Attack +25%!`
            );

        }


        else if (random === 1) {

            fighter.defense *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated Guardian! Defense +25%!`
            );

        }


        else {

            fighter.speed *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated Assassin! Speed +25%!`
            );

        }

    }


    // =========================
    // ROLE ABILITIES
    // =========================

    function useRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (fighter.hp <= 0) {
            return;
        }


        if (fighter.role === "Captain") {

            captainAbility(
                fighter,
                ownTeam
            );

        }


        else if (
            fighter.role === "Vice Captain"
        ) {

            viceCaptainAssist(
                fighter,
                enemyTeam
            );

        }


        else if (
            fighter.role === "Tank"
        ) {

            tankAbility(
                fighter,
                ownTeam
            );

        }


        else if (
            fighter.role === "Healer"
        ) {

            healerAbility(
                fighter,
                ownTeam
            );

        }


        else if (
            fighter.role === "Support"
        ) {

            supportAbility(
                fighter,
                ownTeam
            );

        }


        else if (
            fighter.role === "Wildcard"
        ) {

            wildcardAbility(
                fighter
            );

        }

    }


    // =========================
    // DAMAGE
    // =========================

    function attack(
        attacker,
        defender
    ) {

        let damage =
            attacker.attack -
            (defender.defense * 0.5);


        damage =
            Math.floor(
                damage *
                (0.85 + Math.random() * 0.30)
            );


        if (damage < 1) {
            damage = 1;
        }


        // Check Tank protection

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0
        ) {

            const tank =
                defender.protectedBy;


            damage =
                Math.floor(
                    damage * 0.50
                );


            logBattle(
                `🛡️ ${tank.name} protected ${defender.name}! Damage reduced by 50%!`
            );

        }


        // Tank takes reduced damage

        if (
            defender.role === "Tank" &&
            !defender.protectedBy
        ) {

            damage =
                Math.floor(
                    damage * 0.70
                );


            logBattle(
                `🛡️ ${defender.name} reduced incoming damage by 30%!`
            );

        }


        defender.hp -= damage;


        if (defender.hp < 0) {
            defender.hp = 0;
        }


        logBattle(
            `⚔️ ${attacker.emoji} ${attacker.name} attacked ${defender.emoji} ${defender.name} 💥 ${damage} damage!`
        );


        if (defender.hp <= 0) {

            defender.alive = false;


            logBattle(
                `💀 ${defender.emoji} ${defender.name} has been defeated!`
            );

        }

    }


    // =========================
    // ATTACK ORDER
    // =========================

    function getAttackOrder() {

        const allFighters = [

            ...getAliveFighters(
                player1Fighters
            ),

            ...getAliveFighters(
                player2Fighters
            )

        ];


        return allFighters.sort(
            (a, b) =>
                b.speed - a.speed
        );

    }


    // =========================
    // START BATTLE
    // =========================

    async function startBattle() {

        startBattleBtn.disabled = true;

        battleLog.innerHTML = "";

        battleStatus.textContent =
            "🔥 Battle Started!";


        logBattle(
            "🔥 6 vs 6 Team Battle!"
        );


        while (

            getAliveFighters(
                player1Fighters
            ).length > 0 &&

            getAliveFighters(
                player2Fighters
            ).length > 0 &&

            round <= MAX_ROUNDS

        ) {


            logBattle(
                `⚔️ ROUND ${round}`
            );


            // Reset protection from previous round

            player1Fighters.forEach(
                fighter => {
                    fighter.protecting = false;
                    fighter.protectedBy = null;
                }
            );


            player2Fighters.forEach(
                fighter => {
                    fighter.protecting = false;
                    fighter.protectedBy = null;
                }
            );


            const attackOrder =
                getAttackOrder();


            for (
                const attacker
                of attackOrder
            ) {


                if (
                    attacker.hp <= 0
                ) {
                    continue;
                }


                const isPlayer1 =
                    player1Fighters.includes(
                        attacker
                    );


                const ownTeam =
                    isPlayer1
                        ? player1Fighters
                        : player2Fighters;


                const enemyTeam =
                    isPlayer1
                        ? player2Fighters
                        : player1Fighters;


                // Role ability

                useRoleAbility(
                    attacker,
                    ownTeam,
                    enemyTeam
                );


                updateBattleUI();


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            400
                        )
                );


                // Healer may have used
                // its turn on healing.
                //
                // Check whether healer
                // actually healed before
                // attacking.

                let healed = false;


                if (
                    attacker.role === "Healer"
                ) {

                    healed =
                        healerAbility(
                            attacker,
                            ownTeam
                        );

                }


                if (healed) {

                    updateBattleUI();

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                400
                            )
                    );

                }


                const defender =
                    chooseTarget(
                        enemyTeam
                    );


                if (!defender) {
                    break;
                }


                attack(
                    attacker,
                    defender
                );


                updateBattleUI();


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            600
                        )
                );


                if (

                    getAliveFighters(
                        player1Fighters
                    ).length === 0 ||

                    getAliveFighters(
                        player2Fighters
                    ).length === 0

                ) {

                    break;

                }

            }


            round++;

        }


        // =========================
        // RESULT
        // =========================

        const p1Alive =
            getAliveFighters(
                player1Fighters
            ).length;


        const p2Alive =
            getAliveFighters(
                player2Fighters
            ).length;


        if (p1Alive === 0) {

            battleStatus.textContent =
                "🏆 Player 2 Wins!";

            logBattle(
                "🏆 Player 2 wins!"
            );

        }


        else if (p2Alive === 0) {

            battleStatus.textContent =
                "🏆 Player 1 Wins!";

            logBattle(
                "🏆 Player 1 wins!"
            );

        }


        else {

            logBattle(
                "⏱️ 50 rounds reached!"
            );


            const p1HP =
                getAliveFighters(
                    player1Fighters
                ).reduce(
                    (total, fighter) =>
                        total + fighter.hp,
                    0
                );


            const p2HP =
                getAliveFighters(
                    player2Fighters
                ).reduce(
                    (total, fighter) =>
                        total + fighter.hp,
                    0
                );


            if (p1HP >= p2HP) {

                battleStatus.textContent =
                    "🏆 Player 1 Wins by HP!";

                logBattle(
                    "🏆 Player 1 wins by remaining HP!"
                );

            }

            else {

                battleStatus.textContent =
                    "🏆 Player 2 Wins by HP!";

                logBattle(
                    "🏆 Player 2 wins by remaining HP!"
                );

            }

        }

    }


    // =========================
    // INITIAL DISPLAY
    // =========================

    updateBattleUI();


    battleStatus.textContent =
        "⚔️ Teams Ready!";


    battleLog.innerHTML = `

        <p>
            🏴 Player 1 and Player 2 teams loaded.
        </p>

        <p>
            🎭 Smart role abilities ready.
        </p>

    `;


    // =========================
    // START BUTTON
    // =========================

    startBattleBtn.addEventListener(
        "click",
        startBattle
    );

});