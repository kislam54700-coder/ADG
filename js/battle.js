document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const player1Battle = document.getElementById("player1Battle");
    const player2Battle = document.getElementById("player2Battle");

    const battleLog = document.getElementById("battleLog");
    const battleStatus = document.getElementById("battleStatus");

    const startBattleBtn =
        document.getElementById("startBattleBtn");


    // =========================================================
    // LOAD DATA
    // =========================================================

    const player1Team =
        JSON.parse(localStorage.getItem("player1Team")) || [];

    const player2Team =
        JSON.parse(localStorage.getItem("player2Team")) || [];


    const player1Roles =
        JSON.parse(localStorage.getItem("player1Roles")) || {};

    const player2Roles =
        JSON.parse(localStorage.getItem("player2Roles")) || {};


    // =========================================================
    // SETTINGS
    // =========================================================

    const MAX_ROUNDS = 50;

    const BASE_HP = 1000;
    const BASE_ATTACK = 100;
    const BASE_DEFENSE = 80;
    const BASE_SPEED = 80;


    let round = 1;

    let player1Fighters = [];
    let player2Fighters = [];

    let battleRunning = false;


    // =========================================================
    // ROLE EMOJIS
    // =========================================================

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


    // =========================================================
    // CREATE FIGHTER
    // =========================================================

    function createFighter(name, role) {

        const fighter = {

            name: name,
            role: role || "Wildcard",

            emoji: getRoleEmoji(role),

            hp: BASE_HP,
            maxHp: BASE_HP,

            attack: BASE_ATTACK,
            defense: BASE_DEFENSE,
            speed: BASE_SPEED,

            alive: true,

            // Role ability
            abilityUsed: false,

            // Special ability
            specialUsed: false,

            // Vice Captain
            assistReady: true,

            // Tank
            protecting: false,
            protectedBy: null,

            // Status effects
            burn: 0,
            bleed: 0,
            stun: 0,
            freeze: 0,

            // Defensive effects
            shield: 0,

            // Healing effect
            regeneration: 0,

            // Temporary effects
            attackBuff: 1,
            defenseBuff: 1,
            speedBuff: 1

        };


        applyRoleBonus(fighter);

        fighter.maxHp = fighter.hp;

        return fighter;
    }


    // =========================================================
    // ROLE STAT BONUSES
    // =========================================================

    function applyRoleBonus(fighter) {

        switch (fighter.role) {

            case "Captain":

                fighter.hp *= 1.20;
                fighter.attack *= 1.20;
                fighter.defense *= 1.20;
                fighter.speed *= 1.20;

                break;


            case "Vice Captain":

                fighter.hp *= 1.10;
                fighter.attack *= 1.10;
                fighter.defense *= 1.10;
                fighter.speed *= 1.10;

                break;


            case "Tank":

                fighter.hp *= 1.30;
                fighter.defense *= 1.30;

                break;


            case "Healer":

                fighter.hp *= 1.20;

                break;


            case "Support":

                fighter.speed *= 1.15;

                break;


            case "Wildcard":

                fighter.attack *= 1.25;

                break;

        }
    }


    // =========================================================
    // LOAD TEAMS
    // =========================================================

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


    // =========================================================
    // BATTLE LOG
    // =========================================================

    function logBattle(message) {

        if (!battleLog) {
            return;
        }

        const line =
            document.createElement("p");

        line.innerHTML = message;

        battleLog.appendChild(line);

        battleLog.scrollTop =
            battleLog.scrollHeight;
    }


    // =========================================================
    // GET ALIVE FIGHTERS
    // =========================================================

    function getAliveFighters(team) {

        return team.filter(
            fighter =>
                fighter.hp > 0 &&
                fighter.alive
        );
    }


    // =========================================================
    // RANDOM TARGET
    // =========================================================

    function chooseTarget(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        return alive[
            Math.floor(
                Math.random() * alive.length
            )
        ];
    }


    // =========================================================
    // LOWEST HP TARGET
    // =========================================================

    function chooseLowestHP(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        return alive.sort(
            (a, b) =>
                (a.hp / a.maxHp) -
                (b.hp / b.maxHp)
        )[0];
    }


    // =========================================================
    // DISPLAY TEAM
    // =========================================================

    function displayTeam(team, container) {

        if (!container) {
            return;
        }

        container.innerHTML = "";


        team.forEach((fighter, index) => {

            const hpPercent =
                Math.max(
                    0,
                    Math.min(
                        100,
                        (fighter.hp /
                            fighter.maxHp) * 100
                    )
                );


            let cardClass = "fighter-card";


            if (fighter.hp <= 0) {

                cardClass += " dead";

            }

            else if (fighter.protecting) {

                cardClass += " active";

            }


            let effects = "";


            if (fighter.burn > 0) {

                effects +=
                    `<span>🔥 Burn ${fighter.burn}</span>`;

            }


            if (fighter.bleed > 0) {

                effects +=
                    `<span>🩸 Bleed ${fighter.bleed}</span>`;

            }


            if (fighter.freeze > 0) {

                effects +=
                    `<span>❄️ Frozen</span>`;

            }


            if (fighter.stun > 0) {

                effects +=
                    `<span>⚡ Stunned</span>`;

            }


            if (fighter.shield > 0) {

                effects +=
                    `<span>🛡️ Shield ${Math.floor(
                        fighter.shield
                    )}</span>`;

            }


            if (fighter.regeneration > 0) {

                effects +=
                    `<span>❤️ Regen</span>`;

            }


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
                            style="width:${hpPercent}%"
                        ></div>

                    </div>

                    <p>
                        ❤️
                        ${Math.floor(fighter.hp)}
                        /
                        ${Math.floor(fighter.maxHp)}
                    </p>

                    <p>
                        ⚔️ ${Math.floor(
                            fighter.attack
                        )}

                        🛡️ ${Math.floor(
                            fighter.defense
                        )}

                        ⚡ ${Math.floor(
                            fighter.speed
                        )}
                    </p>

                    ${
                        effects
                            ? `
                                <div class="battle-effects">
                                    ${effects}
                                </div>
                              `
                            : ""
                    }

                    ${
                        fighter.protecting
                            ? `
                                <p>
                                    🛡️ Protecting!
                                </p>
                              `
                            : ""
                    }

                    ${
                        fighter.hp <= 0
                            ? `
                                <p>
                                    💀 DEFEATED
                                </p>
                              `
                            : ""
                    }

                </div>
            `;

        });
    }


    // =========================================================
    // UPDATE UI
    // =========================================================

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


    // =========================================================
    // CAPTAIN ABILITY
    // =========================================================

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

                fighter.attackBuff *= 1.10;

            }

        });


        logBattle(
            `👑 ${captain.name} used Command! `
            + `⚔️ Team Attack +10%!`
        );
    }


    // =========================================================
    // VICE CAPTAIN ASSIST
    // =========================================================

    function viceCaptainAbility(
        fighter,
        enemyTeam
    ) {

        if (!fighter.assistReady) {
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
                fighter.attack *
                fighter.attackBuff *
                0.50
            );


        applyDamage(
            target,
            damage,
            fighter,
            "Assist"
        );


        logBattle(
            `⚔️ ${fighter.name} performed Assist! `
            + `💥 ${damage} bonus damage!`
        );


        fighter.assistReady = false;
    }


    // =========================================================
    // TANK PROTECTION
    // =========================================================

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


        const target =
            chooseLowestHP(allies);


        if (!target) {
            return;
        }


        tank.abilityUsed = true;

        tank.protecting = true;

        target.protectedBy = tank;


        logBattle(
            `🛡️ ${tank.name} is protecting `
            + `${target.name}! `
            + `Damage reduced by 50%!`
        );
    }


    // =========================================================
    // HEALER
    // =========================================================

    function healerAbility(
        healer,
        team
    ) {

        const allies =
            getAliveFighters(team)
                .filter(
                    fighter =>
                        fighter !== healer &&
                        fighter.hp <
                        fighter.maxHp * 0.70
                );


        if (allies.length === 0) {

            return false;

        }


        const target =
            chooseLowestHP(allies);


        const heal =
            Math.floor(
                target.maxHp * 0.20
            );


        target.hp =
            Math.min(
                target.maxHp,
                target.hp + heal
            );


        logBattle(
            `❤️ ${healer.name} healed `
            + `${target.name} `
            + `+${heal} HP!`
        );


        return true;
    }


    // =========================================================
    // SUPPORT ABILITY
    // =========================================================

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

                fighter.attackBuff *= 1.05;
                fighter.speedBuff *= 1.10;

            }

        });


        logBattle(
            `⭐ ${support.name} used Team Buff! `
            + `⚔️ Attack +5% `
            + `⚡ Speed +10%!`
        );
    }


    // =========================================================
    // WILDCARD ABILITY
    // =========================================================

    function wildcardAbility(fighter) {

        if (fighter.abilityUsed) {
            return;
        }


        fighter.abilityUsed = true;


        const random =
            Math.floor(
                Math.random() * 3
            );


        if (random === 0) {

            fighter.attackBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated `
                + `Berserker! ⚔️ Attack +25%!`
            );

        }


        else if (random === 1) {

            fighter.defenseBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated `
                + `Guardian! 🛡️ Defense +25%!`
            );

        }


        else {

            fighter.speedBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated `
                + `Assassin! ⚡ Speed +25%!`
            );

        }
    }


    // =========================================================
    // CHARACTER SPECIAL ABILITIES
    // =========================================================
    //
    // Each character can use its special ONLY ONCE.
    //
    // Conditions:
    // - minimum round
    // - HP condition
    // - random chance
    //
    // =========================================================

    function useCharacterSpecial(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (fighter.specialUsed) {
            return;
        }


        if (fighter.hp <= 0) {
            return;
        }


        const name =
            fighter.name.toLowerCase();


        // -----------------------------------------------------
        // LUFFY - GEAR 5
        // -----------------------------------------------------

        if (
            name === "luffy" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.50;

            fighter.speedBuff *= 1.20;

            logBattle(
                `🔥 ${fighter.name} activated `
                + `Gear 5! 🌀 `
                + `Attack +50%!`
            );

            return;
        }


        // -----------------------------------------------------
        // ZORO - THREE SWORD STYLE
        // -----------------------------------------------------

        if (
            name === "zoro" &&
            round >= 2
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.30;

            logBattle(
                `⚔️ ${fighter.name} activated `
                + `Three Sword Style! `
                + `Critical power increased!`
            );

            return;
        }


        // -----------------------------------------------------
        // ACE - FLAME EMPEROR
        // -----------------------------------------------------

        if (
            name === "portgas d. ace" ||
            name === "ace"
        ) {

            if (round >= 3) {

                fighter.specialUsed = true;

                const target =
                    chooseTarget(enemyTeam);

                if (target) {

                    target.burn = 4;

                    const damage =
                        Math.floor(
                            fighter.attack * 1.50
                        );

                    applyDamage(
                        target,
                        damage,
                        fighter,
                        "Flame Emperor"
                    );

                    logBattle(
                        `🔥 ${fighter.name} used `
                        + `Flame Emperor! `
                        + `${target.name} is Burning!`
                    );

                }

                return;
            }
        }


        // -----------------------------------------------------
        // SHANKS - CONQUEROR'S HAKI
        // -----------------------------------------------------

        if (
            name === "shanks" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                target.stun = 1;

                logBattle(
                    `👑 ${fighter.name} unleashed `
                    + `Conqueror's Haki! 💫 `
                    + `${target.name} is Stunned!`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // AOKIJI / KUZAN - ICE AGE
        // -----------------------------------------------------

        if (
            (
                name === "aokiji" ||
                name === "kuzan"
            ) &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                target.freeze = 1;

                logBattle(
                    `❄️ ${fighter.name} used Ice Age! `
                    + `${target.name} is Frozen!`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // ENEL - RAIGO
        // -----------------------------------------------------

        if (
            name === "enel" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                const damage =
                    Math.floor(
                        fighter.attack * 2
                    );

                applyDamage(
                    target,
                    damage,
                    fighter,
                    "Raigo"
                );

                target.stun = 1;

                logBattle(
                    `⚡ ${fighter.name} unleashed `
                    + `Raigo! 💥 ${damage} damage `
                    + `+ Stun!`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // KAIDO - BORO BREATH
        // -----------------------------------------------------

        if (
            name === "kaido" &&
            fighter.hp <
            fighter.maxHp * 0.65
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                const damage =
                    Math.floor(
                        fighter.attack * 1.80
                    );

                applyDamage(
                    target,
                    damage,
                    fighter,
                    "Boro Breath"
                );

                target.burn = 3;

                logBattle(
                    `🐉 ${fighter.name} used `
                    + `Boro Breath! 🔥`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // MIHAWK - BLACK BLADE
        // -----------------------------------------------------

        if (
            name === "mihawk" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.40;

            logBattle(
                `🦅 ${fighter.name} unleashed `
                + `Black Blade! ⚔️ Attack +40%!`
            );

            return;
        }


        // -----------------------------------------------------
        // MARCO - PHOENIX REGENERATION
        // -----------------------------------------------------

        if (
            name === "marco" &&
            fighter.hp <
            fighter.maxHp * 0.60
        ) {

            fighter.specialUsed = true;

            fighter.regeneration = 4;

            const heal =
                Math.floor(
                    fighter.maxHp * 0.25
                );

            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );

            logBattle(
                `🔥 ${fighter.name} activated `
                + `Phoenix Regeneration! ❤️ `
                + `+${heal} HP!`
            );

            return;
        }


        // -----------------------------------------------------
        // BROOK - SOUL SOLID
        // -----------------------------------------------------

        if (
            name === "brook" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                target.freeze = 1;

                logBattle(
                    `💀 ${fighter.name} used `
                    + `Soul Solid! ❄️ `
                    + `${target.name} is Frozen!`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // KATAKURI - MOCHI
        // -----------------------------------------------------

        if (
            name === "katakuri" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.30;
            fighter.speedBuff *= 1.20;

            logBattle(
                `🍩 ${fighter.name} activated `
                + `Mochi Power! ⚔️ Attack +30%!`
            );

            return;
        }


        // -----------------------------------------------------
        // LAW - ROOM
        // -----------------------------------------------------

        if (
            name === "trafalgar d. water law" ||
            name === "trafalgar law"
        ) {

            if (round >= 3) {

                fighter.specialUsed = true;

                const target =
                    chooseTarget(enemyTeam);

                if (target) {

                    target.stun = 1;

                    const damage =
                        Math.floor(
                            fighter.attack * 1.40
                        );

                    applyDamage(
                        target,
                        damage,
                        fighter,
                        "ROOM"
                    );

                    logBattle(
                        `⚔️ ${fighter.name} used ROOM! `
                        + `💫 ${target.name} is stunned!`
                    );

                }

                return;
            }
        }


        // -----------------------------------------------------
        // DOFLAMINGO - OVERHEAT
        // -----------------------------------------------------

        if (
            name === "doflamingo" &&
            fighter.hp <
            fighter.maxHp * 0.70
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.35;

            logBattle(
                `🦩 ${fighter.name} activated `
                + `Overheat! 🔥 Attack +35%!`
            );

            return;
        }


        // -----------------------------------------------------
        // JINBE - FISHMAN KARATE
        // -----------------------------------------------------

        if (
            name === "jinbe" &&
            fighter.hp <
            fighter.maxHp * 0.75
        ) {

            fighter.specialUsed = true;

            fighter.shield =
                Math.floor(
                    fighter.maxHp * 0.30
                );

            logBattle(
                `🌊 ${fighter.name} activated `
                + `Fish-Man Karate! 🛡️ Shield created!`
            );

            return;
        }


        // -----------------------------------------------------
        // WHITEBEARD - QUAKE
        // -----------------------------------------------------

        if (
            name === "whitebeard" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            enemyTeam
                .filter(
                    target =>
                        target.hp > 0
                )
                .forEach(target => {

                    const damage =
                        Math.floor(
                            fighter.attack * 1.20
                        );

                    applyDamage(
                        target,
                        damage,
                        fighter,
                        "Gura Gura no Mi"
                    );

                });


            logBattle(
                `🌊 ${fighter.name} used `
                + `Gura Gura no Mi! 💥`
            );

            return;
        }


        // -----------------------------------------------------
        // BIG MOM - HERA
        // -----------------------------------------------------

        if (
            name === "big mom" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.35;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                target.stun = 1;

            }

            logBattle(
                `👑 ${fighter.name} used `
                + `Soul Power! ⚡ Attack +35%!`
            );

            return;
        }


        // -----------------------------------------------------
        // AKAINU - METEOR VOLCANO
        // -----------------------------------------------------

        if (
            name === "akainu" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            const target =
                chooseTarget(enemyTeam);

            if (target) {

                const damage =
                    Math.floor(
                        fighter.attack * 1.70
                    );

                applyDamage(
                    target,
                    damage,
                    fighter,
                    "Meteor Volcano"
                );

                target.burn = 3;

                logBattle(
                    `🌋 ${fighter.name} used `
                    + `Meteor Volcano! 🔥`
                );

            }

            return;
        }


        // -----------------------------------------------------
        // KIZARU - YASAKANI NO MAGATAMA
        // -----------------------------------------------------

        if (
            name === "kizaru" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.speedBuff *= 1.40;

            logBattle(
                `✨ ${fighter.name} used `
                + `Yasakani no Magatama! `
                + `⚡ Speed +40%!`
            );

            return;
        }

    }


    // =========================================================
    // STATUS EFFECTS
    // =========================================================

    function processStatusEffects(fighter) {

        if (fighter.hp <= 0) {
            return;
        }


        // 🔥 BURN

        if (fighter.burn > 0) {

            const damage =
                Math.floor(
                    fighter.maxHp * 0.05
                );

            fighter.hp -= damage;

            fighter.burn--;


            logBattle(
                `🔥 ${fighter.name} takes `
                + `${damage} Burn damage!`
            );

        }


        // 🩸 BLEED

        if (fighter.bleed > 0) {

            const damage =
                Math.floor(
                    fighter.maxHp * 0.04
                );

            fighter.hp -= damage;

            fighter.bleed--;


            logBattle(
                `🩸 ${fighter.name} takes `
                + `${damage} Bleed damage!`
            );

        }


        // ❤️ REGENERATION

        if (
            fighter.regeneration > 0 &&
            fighter.hp > 0
        ) {

            const heal =
                Math.floor(
                    fighter.maxHp * 0.05
                );


            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );


            fighter.regeneration--;


            logBattle(
                `❤️ ${fighter.name} regenerates `
                + `${heal} HP!`
            );

        }


        if (fighter.hp < 0) {
            fighter.hp = 0;
        }


        if (fighter.hp <= 0) {

            fighter.alive = false;

            logBattle(
                `💀 ${fighter.name} was defeated `
                + `by status effects!`
            );

        }

    }


    // =========================================================
    // TURN CONTROL
    // =========================================================

    function canTakeTurn(fighter) {

        if (fighter.hp <= 0) {
            return false;
        }


        // ⚡ STUN

        if (fighter.stun > 0) {

            fighter.stun--;

            logBattle(
                `⚡ ${fighter.name} is stunned! `
                + `Turn skipped!`
            );

            return false;
        }


        // ❄️ FREEZE

        if (fighter.freeze > 0) {

            fighter.freeze--;

            logBattle(
                `❄️ ${fighter.name} is frozen! `
                + `Turn skipped!`
            );

            return false;
        }


        return true;
    }


    // =========================================================
    // APPLY DAMAGE
    // =========================================================

    function applyDamage(
        defender,
        damage,
        attacker,
        abilityName
    ) {

        if (
            defender.hp <= 0
        ) {
            return 0;
        }


        // 🛡️ Tank protection

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0
        ) {

            damage =
                Math.floor(
                    damage * 0.50
                );


            logBattle(
                `🛡️ ${defender.protectedBy.name} `
                + `protected ${defender.name}!`
            );

        }


        // 🛡️ Shield

        if (
            defender.shield > 0 &&
            damage > 0
        ) {

            const blocked =
                Math.min(
                    defender.shield,
                    damage
                );


            defender.shield -= blocked;

            damage -= blocked;


            logBattle(
                `🛡️ ${defender.name}'s shield `
                + `blocked ${blocked} damage!`
            );

        }


        defender.hp -= damage;


        if (defender.hp < 0) {
            defender.hp = 0;
        }


        if (damage > 0) {

            logBattle(
                `💥 ${damage} damage dealt to `
                + `${defender.name}!`
            );

        }


        if (defender.hp <= 0) {

            defender.alive = false;

            defender.protecting = false;

            logBattle(
                `💀 ${defender.emoji} `
                + `${defender.name} has been defeated!`
            );

        }


        return damage;
    }


    // =========================================================
    // NORMAL ATTACK
    // =========================================================

    function attack(
        attacker,
        defender
    ) {

        let attackPower =
            attacker.attack *
            attacker.attackBuff;


        let defensePower =
            defender.defense *
            defender.defenseBuff;


        let damage =
            attackPower -
            (defensePower * 0.5);


        if (damage < 1) {
            damage = 1;
        }


        damage =
            Math.floor(
                damage *
                (
                    0.85 +
                    Math.random() * 0.30
                )
            );


        // 💫 Critical hit

        const critical =
            Math.random() < 0.12;


        if (critical) {

            damage =
                Math.floor(
                    damage * 1.75
                );


            logBattle(
                `💫 CRITICAL HIT! `
                + `${attacker.name} landed a devastating strike!`
            );

        }


        logBattle(
            `⚔️ ${attacker.emoji} `
            + `${attacker.name} attacked `
            + `${defender.emoji} `
            + `${defender.name}!`
        );


        applyDamage(
            defender,
            damage,
            attacker,
            "Normal Attack"
        );


        // 🩸 Small chance to bleed

        if (
            defender.hp > 0 &&
            Math.random() < 0.08
        ) {

            defender.bleed = 3;

            logBattle(
                `🩸 ${defender.name} started bleeding!`
            );

        }


        return damage;
    }


    // =========================================================
    // USE ROLE ABILITY
    // =========================================================

    function useRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (fighter.hp <= 0) {
            return false;
        }


        switch (fighter.role) {

            case "Captain":

                captainAbility(
                    fighter,
                    ownTeam
                );

                break;


            case "Vice Captain":

                viceCaptainAbility(
                    fighter,
                    enemyTeam
                );

                break;


            case "Tank":

                tankAbility(
                    fighter,
                    ownTeam
                );

                break;


            case "Healer":

                return healerAbility(
                    fighter,
                    ownTeam
                );


            case "Support":

                supportAbility(
                    fighter,
                    ownTeam
                );

                break;


            case "Wildcard":

                wildcardAbility(
                    fighter
                );

                break;

        }

        return false;
    }


    // =========================================================
    // ATTACK ORDER
    // =========================================================

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
            (a, b) => {

                const speedA =
                    a.speed *
                    a.speedBuff;

                const speedB =
                    b.speed *
                    b.speedBuff;

                return speedB - speedA;

            }
        );
    }


    // =========================================================
    // CHECK BATTLE END
    // =========================================================

    function battleFinished() {

        return (

            getAliveFighters(
                player1Fighters
            ).length === 0 ||

            getAliveFighters(
                player2Fighters
            ).length === 0

        );
    }


    // =========================================================
    // START BATTLE
    // =========================================================

    async function startBattle() {

        if (battleRunning) {
            return;
        }


        battleRunning = true;

        startBattleBtn.disabled = true;


        round = 1;


        battleLog.innerHTML = "";


        battleStatus.textContent =
            "🔥 Battle Started!";


        logBattle(
            "🔥 6 vs 6 TEAM BATTLE!"
        );


        logBattle(
            "⚔️ Battle system activated!"
        );


        updateBattleUI();


        await wait(800);


        // =====================================================
        // MAIN BATTLE LOOP
        // =====================================================

        while (

            !battleFinished() &&

            round <= MAX_ROUNDS

        ) {


            logBattle(
                `<strong>⚔️ ROUND ${round}</strong>`
            );


            // -------------------------------------------------
            // Reset Tank protection
            // -------------------------------------------------

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


            // -------------------------------------------------
            // Status effects happen at beginning of round
            // -------------------------------------------------

            const allAliveAtStart = [

                ...getAliveFighters(
                    player1Fighters
                ),

                ...getAliveFighters(
                    player2Fighters
                )

            ];


            for (
                const fighter
                of allAliveAtStart
            ) {

                processStatusEffects(
                    fighter
                );

            }


            updateBattleUI();


            await wait(500);


            if (battleFinished()) {
                break;
            }


            // -------------------------------------------------
            // Attack order
            // -------------------------------------------------

            const attackOrder =
                getAttackOrder();


            // -------------------------------------------------
            // Each fighter gets one turn
            // -------------------------------------------------

            for (
                const attacker
                of attackOrder
            ) {


                if (
                    attacker.hp <= 0 ||
                    !attacker.alive
                ) {

                    continue;

                }


                if (battleFinished()) {
                    break;
                }


                // ------------------------------------------------
                // Stun / Freeze
                // ------------------------------------------------

                if (
                    !canTakeTurn(attacker)
                ) {

                    updateBattleUI();

                    await wait(500);

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


                // ------------------------------------------------
                // Character special
                // ------------------------------------------------

                useCharacterSpecial(
                    attacker,
                    ownTeam,
                    enemyTeam
                );


                updateBattleUI();


                await wait(500);


                if (battleFinished()) {
                    break;
                }


                // ------------------------------------------------
                // Role ability
                // ------------------------------------------------

                const healed =
                    useRoleAbility(
                        attacker,
                        ownTeam,
                        enemyTeam
                    );


                updateBattleUI();


                await wait(500);


                if (battleFinished()) {
                    break;
                }


                // ------------------------------------------------
                // Healer
                //
                // If healer actually healed someone,
                // it skips normal attack.
                // ------------------------------------------------

                if (
                    attacker.role === "Healer" &&
                    healed
                ) {

                    logBattle(
                        `❤️ ${attacker.name} `
                        + `spent the turn healing.`
                    );

                    updateBattleUI();

                    await wait(500);

                    continue;
                }


                // ------------------------------------------------
                // Find target
                // ------------------------------------------------

                const defender =
                    chooseTarget(
                        enemyTeam
                    );


                if (!defender) {
                    break;
                }


                // ------------------------------------------------
                // Normal attack
                // ------------------------------------------------

                attack(
                    attacker,
                    defender
                );


                updateBattleUI();


                await wait(700);


                if (battleFinished()) {
                    break;
                }

            }


            round++;


            await wait(500);

        }


        // =====================================================
        // FINAL RESULT
        // =====================================================

        finishBattle();

    }


    // =========================================================
    // FINISH BATTLE
    // =========================================================

    function finishBattle() {

        battleRunning = false;


        updateBattleUI();


        const p1Alive =
            getAliveFighters(
                player1Fighters
            ).length;


        const p2Alive =
            getAliveFighters(
                player2Fighters
            ).length;


        // =====================================================
        // PLAYER 1 WINS
        // =====================================================

        if (
            p1Alive > 0 &&
            p2Alive === 0
        ) {

            battleStatus.textContent =
                "🏆 PLAYER 1 WINS!";

            logBattle(
                "🏆🏆🏆 PLAYER 1 WINS! 🏆🏆🏆"
            );

            return;
        }


        // =====================================================
        // PLAYER 2 WINS
        // =====================================================

        if (
            p2Alive > 0 &&
            p1Alive === 0
        ) {

            battleStatus.textContent =
                "🏆 PLAYER 2 WINS!";

            logBattle(
                "🏆🏆🏆 PLAYER 2 WINS! 🏆🏆🏆"
            );

            return;
        }


        // =====================================================
        // 50 ROUND LIMIT
        // =====================================================

        logBattle(
            "⏱️ Maximum 50 rounds reached!"
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
                "🏆 PLAYER 1 WINS BY HP!";

            logBattle(
                "🏆 Player 1 wins by remaining HP!"
            );

        }

        else {

            battleStatus.textContent =
                "🏆 PLAYER 2 WINS BY HP!";

            logBattle(
                "🏆 Player 2 wins by remaining HP!"
            );

        }

    }


    // =========================================================
    // WAIT
    // =========================================================

    function wait(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );

    }


    // =========================================================
    // INITIAL UI
    // =========================================================

    updateBattleUI();


    if (battleStatus) {

        battleStatus.textContent =
            "⚔️ Teams Ready!";

    }


    if (battleLog) {

        battleLog.innerHTML = `

            <p>
                🏴 Player 1 and Player 2 teams loaded.
            </p>

            <p>
                🎭 Role abilities ready.
            </p>

            <p>
                🔥 Character special abilities ready.
            </p>

            <p>
                💫 Advanced battle effects ready.
            </p>

        `;

    }


    // =========================================================
    // START BUTTON
    // =========================================================

    if (startBattleBtn) {

        startBattleBtn.addEventListener(
            "click",
            startBattle
        );

    }

});