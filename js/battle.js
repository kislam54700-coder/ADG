document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // ELEMENTS
    // =========================================================

    const player1Battle = document.getElementById("player1Battle");
    const player2Battle = document.getElementById("player2Battle");
    const battleLog = document.getElementById("battleLog");
    const battleStatus = document.getElementById("battleStatus");
    const startBattleBtn = document.getElementById("startBattleBtn");

    // =========================================================
    // LOAD PLAYER DATA
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
    // BATTLE SETTINGS
    // =========================================================

    const MAX_ROUNDS = 50;

    const BASE_HP = 1000;
    const BASE_ATTACK = 100;
    const BASE_DEFENSE = 80;
    const BASE_SPEED = 80;

    const CRITICAL_CHANCE = 0.15;
    const CRITICAL_MULTIPLIER = 1.75;

    let battleStats = {
        totalDamage: 0,
        totalKOs: 0,
        totalSpecials: 0,
        completedRounds: 0
    };

    let round = 1;
    let battleRunning = false;

    let player1Fighters = [];
    let player2Fighters = [];

    const sleep = (ms) =>
        new Promise(resolve => setTimeout(resolve, ms));

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
    // ROLE BONUSES
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
    // CREATE FIGHTER
    // =========================================================

    function createFighter(name, role) {

        const fighter = {

            name: name,
            role: role || "Wildcard",
            emoji: getRoleEmoji(role || "Wildcard"),

            hp: BASE_HP,
            maxHp: BASE_HP,

            attack: BASE_ATTACK,
            defense: BASE_DEFENSE,
            speed: BASE_SPEED,

            alive: true,

            abilityUsed: false,
            specialUsed: false,

            koShown: false,
            lastCritical: false,

            assistReady: true,

            protecting: false,
            protectedBy: null,

            burn: 0,
            bleed: 0,
            stun: 0,
            freeze: 0,

            shield: 0,
            regeneration: 0,

            attackBuff: 1,
            defenseBuff: 1,
            speedBuff: 1,

            damageDealt: 0,
            kos: 0,

            // Used to track who applied damage-over-time effects.
            burnSource: null,
            bleedSource: null
        };

        applyRoleBonus(fighter);

        fighter.maxHp = fighter.hp;

        return fighter;
    }

    // =========================================================
    // CREATE TEAMS
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
    // LOGGING
    // =========================================================

    function logBattle(message) {

        if (!battleLog) return;

        const line = document.createElement("p");

        line.innerHTML = message;

        battleLog.appendChild(line);

        battleLog.scrollTop = battleLog.scrollHeight;
    }

    // =========================================================
    // FIGHTER HELPERS
    // =========================================================

    function getAliveFighters(team) {

        return team.filter(
            fighter =>
                fighter.hp > 0 &&
                fighter.alive
        );
    }

    function chooseTarget(team) {

        const alive = getAliveFighters(team);

        if (!alive.length) return null;

        return alive[
            Math.floor(Math.random() * alive.length)
        ];
    }

    function chooseLowestHP(team) {

        const alive = getAliveFighters(team);

        if (!alive.length) return null;

        return [...alive].sort(
            (a, b) =>
                (a.hp / a.maxHp) -
                (b.hp / b.maxHp)
        )[0];
    }

    // =========================================================
    // UI
    // =========================================================

    function displayTeam(team, container) {

        if (!container) return;

        container.innerHTML = "";

        team.forEach((fighter, index) => {

            const hpPercent = Math.max(
                0,
                Math.min(
                    100,
                    (fighter.hp / fighter.maxHp) * 100
                )
            );

            let cardClass = "fighter-card";

            if (fighter.hp <= 0) {

                cardClass += " dead";

                if (fighter.koShown) {
                    cardClass += " ko";
                }

            } else if (fighter.protecting) {

                cardClass += " active";
            }

            let effects = "";

            if (fighter.burn > 0)
                effects += `<span>🔥 Burn ${fighter.burn}</span>`;

            if (fighter.bleed > 0)
                effects += `<span>🩸 Bleed ${fighter.bleed}</span>`;

            if (fighter.freeze > 0)
                effects += `<span>❄️ Frozen</span>`;

            if (fighter.stun > 0)
                effects += `<span>⚡ Stunned</span>`;

            if (fighter.shield > 0)
                effects += `<span>🛡️ Shield ${Math.floor(fighter.shield)}</span>`;

            if (fighter.regeneration > 0)
                effects += `<span>❤️ Regen</span>`;

            container.innerHTML += `

                <div
                    class="${cardClass}"
                    id="${container.id}-fighter-${index}"
                >

                    <h3>
                        ${fighter.emoji}
                        ${fighter.name}
                    </h3>

                    <p>${fighter.role}</p>

                    <div class="hp-bar">
                        <div
                            class="hp-fill"
                            style="width:${hpPercent}%"
                        ></div>
                    </div>

                    <p>
                        ❤️ ${Math.floor(fighter.hp)}
                        /
                        ${Math.floor(fighter.maxHp)}
                    </p>

                    <p>
                        ⚔️ ${Math.floor(
                            fighter.attack *
                            fighter.attackBuff
                        )}

                        🛡️ ${Math.floor(
                            fighter.defense *
                            fighter.defenseBuff
                        )}

                        ⚡ ${Math.floor(
                            fighter.speed *
                            fighter.speedBuff
                        )}
                    </p>

                    ${
                        effects
                            ? `<div class="battle-effects">
                                ${effects}
                               </div>`
                            : ""
                    }

                    ${
                        fighter.protecting
                            ? `<p>🛡️ Protecting!</p>`
                            : ""
                    }

                    ${
                        fighter.hp <= 0
                            ? `<p>💀 DEFEATED</p>`
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

    // =========================================================
    // ROLE ABILITIES
    // =========================================================

    function captainAbility(captain, team) {

        if (captain.abilityUsed) return false;

        captain.abilityUsed = true;

        team.forEach(fighter => {

            if (
                fighter.hp > 0 &&
                fighter.alive
            ) {
                fighter.attackBuff *= 1.10;
            }

        });

        logBattle(
            `👑 ${captain.name} used Command! ` +
            `⚔️ Team Attack +10%!`
        );

        return true;
    }

    // ---------------------------------------------------------

    function viceCaptainAbility(
        fighter,
        enemyTeam
    ) {

        if (!fighter.assistReady) return false;

        if (Math.random() > 0.35)
            return false;

        const target = aiChooseTarget(enemyTeam);

        if (!target) return false;

        const damage = Math.floor(
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
            `⚔️ ${fighter.name} performed Assist! ` +
            `💥 ${damage} bonus damage!`
        );

        fighter.assistReady = false;

        return true;
    }

    // ---------------------------------------------------------

    function tankAbility(tank, team) {

        if (tank.abilityUsed) return false;

        const allies =
            getAliveFighters(team)
                .filter(f => f !== tank);

        if (!allies.length)
            return false;

        const target =
            chooseLowestHP(allies);

        if (!target)
            return false;

        tank.abilityUsed = true;
        tank.protecting = true;

        target.protectedBy = tank;

        logBattle(
            `🛡️ ${tank.name} is protecting ` +
            `${target.name}! Damage reduced by 50%!`
        );

        return true;
    }

    // ---------------------------------------------------------

    function healerAbility(
        healer,
        team
    ) {

        const allies =
            getAliveFighters(team)
                .filter(
                    f =>
                        f !== healer &&
                        f.hp < f.maxHp * 0.70
                );

        if (!allies.length)
            return false;

        const target =
            chooseLowestHP(allies);

        if (!target)
            return false;

        const heal = Math.floor(
            target.maxHp * 0.20
        );

        target.hp = Math.min(
            target.maxHp,
            target.hp + heal
        );

        logBattle(
            `❤️ ${healer.name} healed ` +
            `${target.name} +${heal} HP!`
        );

        return true;
    }

    // ---------------------------------------------------------

    function supportAbility(
        support,
        team
    ) {

        if (support.abilityUsed)
            return false;

        support.abilityUsed = true;

        team.forEach(fighter => {

            if (
                fighter.hp > 0 &&
                fighter.alive
            ) {

                fighter.attackBuff *= 1.05;
                fighter.speedBuff *= 1.10;
            }

        });

        logBattle(
            `⭐ ${support.name} used Team Buff! ` +
            `⚔️ Attack +5% ⚡ Speed +10%!`
        );

        return true;
    }

    // ---------------------------------------------------------

    function wildcardAbility(fighter) {

        if (fighter.abilityUsed)
            return false;

        fighter.abilityUsed = true;

        const random =
            Math.floor(Math.random() * 3);

        if (random === 0) {

            fighter.attackBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated ` +
                `Berserker! ⚔️ Attack +25%!`
            );

        } else if (random === 1) {

            fighter.defenseBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated ` +
                `Guardian! 🛡️ Defense +25%!`
            );

        } else {

            fighter.speedBuff *= 1.25;

            logBattle(
                `☠️ ${fighter.name} activated ` +
                `Assassin! ⚡ Speed +25%!`
            );
        }

        return true;
    }

    // =========================================================
    // ROLE ABILITY CONTROLLER
    // =========================================================

    function useRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (!fighter)
            return false;

        switch (fighter.role) {

            case "Captain":
                return captainAbility(
                    fighter,
                    ownTeam
                );

            case "Vice Captain":
                return viceCaptainAbility(
                    fighter,
                    enemyTeam
                );

            case "Tank":
                return tankAbility(
                    fighter,
                    ownTeam
                );

            case "Healer":
                return healerAbility(
                    fighter,
                    ownTeam
                );

            case "Support":
                return supportAbility(
                    fighter,
                    ownTeam
                );

            case "Wildcard":
                return wildcardAbility(
                    fighter
                );

            default:
                return false;
        }
    }

    // =========================================================
    // CHARACTER SPECIAL ABILITIES
    // =========================================================

    function useCharacterSpecial(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (
            fighter.specialUsed ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return null;
        }

        const name =
            String(fighter.name)
                .trim()
                .toLowerCase();

        // -----------------------------------------------------
        // LUFFY
        // -----------------------------------------------------

        if (
            name === "luffy" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.50;
            fighter.speedBuff *= 1.20;

            return {
                name: "Gear 5",
                message:
                    `🔥 ${fighter.name} activated Gear 5! ` +
                    `🌀 Attack +50%! ⚡ Speed +20%!`
            };
        }

        // -----------------------------------------------------
        // ZORO
        // -----------------------------------------------------

        if (
            name === "zoro" &&
            round >= 2
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.30;

            return {
                name: "Three Sword Style",
                message:
                    `⚔️ ${fighter.name} activated ` +
                    `Three Sword Style! ` +
                    `⚔️ Attack +30%!`
            };
        }

        // -----------------------------------------------------
        // ACE
        // -----------------------------------------------------

        if (
            (
                name === "portgas d. ace" ||
                name === "ace"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.50
            );

            target.burn = Math.max(
                target.burn,
                4
            );

            target.burnSource = fighter;

            applyDamage(
                target,
                damage,
                fighter,
                "Flame Emperor"
            );

            return {
                name: "Flame Emperor",
                message:
                    `🔥 ${fighter.name} used Flame Emperor! ` +
                    `💥 ${damage} damage! ` +
                    `🔥 ${target.name} is Burning!`
            };
        }

        // -----------------------------------------------------
        // SHANKS
        // -----------------------------------------------------

        if (
            name === "shanks" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            target.stun =
                Math.max(
                    target.stun,
                    1
                );

            return {
                name: "Conqueror's Haki",
                message:
                    `👑 ${fighter.name} unleashed ` +
                    `Conqueror's Haki! 💫 ` +
                    `${target.name} is Stunned!`
            };
        }

        // -----------------------------------------------------
        // AOKIJI / KUZAN
        // -----------------------------------------------------

        if (
            (
                name === "aokiji" ||
                name === "kuzan"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );

            return {
                name: "Ice Age",
                message:
                    `❄️ ${fighter.name} used Ice Age! ` +
                    `${target.name} is Frozen!`
            };
        }

        // -----------------------------------------------------
        // ENEL
        // -----------------------------------------------------

        if (
            name === "enel" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                2
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Raigo"
            );

            if (
                target.hp > 0 &&
                target.alive
            ) {
                target.stun =
                    Math.max(
                        target.stun,
                        1
                    );
            }

            return {
                name: "Raigo",
                message:
                    `⚡ ${fighter.name} unleashed Raigo! ` +
                    `💥 ${damage} damage + Stun!`
            };
        }

        // -----------------------------------------------------
        // KAIDO
        // -----------------------------------------------------

        if (
            name === "kaido" &&
            fighter.hp <
                fighter.maxHp * 0.65
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.80
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Boro Breath"
            );

            if (
                target.hp > 0 &&
                target.alive
            ) {

                target.burn =
                    Math.max(
                        target.burn,
                        3
                    );

                target.burnSource =
                    fighter;
            }

            return {
                name: "Boro Breath",
                message:
                    `🐉 ${fighter.name} used Boro Breath! ` +
                    `🔥 ${damage} damage!`
            };
        }

        // -----------------------------------------------------
        // MIHAWK
        // -----------------------------------------------------

        if (
            name === "mihawk" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.40;

            return {
                name: "Black Blade",
                message:
                    `🦅 ${fighter.name} unleashed Black Blade! ` +
                    `⚔️ Attack +40%!`
            };
        }

        // -----------------------------------------------------
        // MARCO
        // -----------------------------------------------------

        if (
            name === "marco" &&
            fighter.hp <
                fighter.maxHp * 0.60
        ) {

            fighter.specialUsed = true;

            fighter.regeneration =
                Math.max(
                    fighter.regeneration,
                    4
                );

            const heal =
                Math.floor(
                    fighter.maxHp * 0.25
                );

            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );

            return {
                name: "Phoenix Regeneration",
                message:
                    `🔥 ${fighter.name} activated ` +
                    `Phoenix Regeneration! ` +
                    `❤️ +${heal} HP!`
            };
        }

        // -----------------------------------------------------
        // BROOK
        // -----------------------------------------------------

        if (
            name === "brook" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );

            return {
                name: "Soul Solid",
                message:
                    `💀 ${fighter.name} used Soul Solid! ` +
                    `❄️ ${target.name} is Frozen!`
            };
        }

        // -----------------------------------------------------
        // KATAKURI
        // -----------------------------------------------------

        if (
            name === "katakuri" &&
            round >= 3
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.30;
            fighter.speedBuff *= 1.20;

            return {
                name: "Mochi Power",
                message:
                    `🍩 ${fighter.name} activated Mochi Power! ` +
                    `⚔️ Attack +30%! ⚡ Speed +20%!`
            };
        }

        // -----------------------------------------------------
        // LAW
        // -----------------------------------------------------

        if (
            (
                name ===
                    "trafalgar d. water law" ||
                name ===
                    "trafalgar law"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            target.stun =
                Math.max(
                    target.stun,
                    1
                );

            return {
                name: "ROOM",
                message:
                    `⚕️ ${fighter.name} used ROOM! ` +
                    `${target.name} is Stunned!`
            };
        }

        // -----------------------------------------------------
        // DOFLAMINGO
        // -----------------------------------------------------

        if (
            (
                name === "doflamingo" ||
                name ===
                    "donquixote doflamingo"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.35
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Bird Cage"
            );

            if (
                target.hp > 0 &&
                target.alive
            ) {

                target.bleed =
                    Math.max(
                        target.bleed,
                        3
                    );

                target.bleedSource =
                    fighter;
            }

            return {
                name: "Bird Cage",
                message:
                    `🦩 ${fighter.name} used Bird Cage! ` +
                    `🩸 ${damage} damage + Bleed!`
            };
        }

        // -----------------------------------------------------
        // SANJI
        // -----------------------------------------------------

        if (
            name === "sanji" &&
            round >= 2
        ) {

            fighter.specialUsed = true;

            fighter.attackBuff *= 1.35;
            fighter.speedBuff *= 1.15;

            return {
                name: "Diable Jambe",
                message:
                    `🔥 ${fighter.name} activated Diable Jambe! ` +
                    `⚔️ Attack +35%! ⚡ Speed +15%!`
            };
        }

        // -----------------------------------------------------
        // WHITEBEARD
        // -----------------------------------------------------

        if (
            (
                name === "whitebeard" ||
                name === "edward newgate"
            ) &&
            round >= 3
        ) {

            const targets =
                getAliveFighters(enemyTeam);

            if (!targets.length)
                return null;

            fighter.specialUsed = true;

            targets.forEach(target => {

                const damage = Math.floor(
                    fighter.attack *
                    fighter.attackBuff *
                    1.25
                );

                applyDamage(
                    target,
                    damage,
                    fighter,
                    "Gura Gura"
                );
            });

            return {
                name: "Gura Gura no Mi",
                message:
                    `🌊 ${fighter.name} unleashed ` +
                    `Gura Gura no Mi! 💥 Area damage!`
            };
        }

        // -----------------------------------------------------
        // BIG MOM
        // -----------------------------------------------------

        if (
            (
                name === "big mom" ||
                name === "charlotte linlin"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.60
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Ikoku"
            );

            return {
                name: "Ikoku",
                message:
                    `👑 ${fighter.name} used Ikoku! ` +
                    `💥 ${damage} damage!`
            };
        }

        // -----------------------------------------------------
        // LUCCI
        // -----------------------------------------------------

        if (
            (
                name === "rob lucci" ||
                name === "lucci"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.45
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Rokuogan"
            );

            return {
                name: "Rokuogan",
                message:
                    `🐆 ${fighter.name} used Rokuogan! ` +
                    `💥 ${damage} damage!`
            };
        }

        // -----------------------------------------------------
        // AKAINU
        // -----------------------------------------------------

        if (
            (
                name === "akainu" ||
                name === "sakazuki"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.60
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Meteor Volcano"
            );

            if (
                target.hp > 0 &&
                target.alive
            ) {

                target.burn =
                    Math.max(
                        target.burn,
                        4
                    );

                target.burnSource =
                    fighter;
            }

            return {
                name: "Meteor Volcano",
                message:
                    `🔥 ${fighter.name} used Meteor Volcano! ` +
                    `🔥 ${damage} damage + Burn!`
            };
        }

        // -----------------------------------------------------
        // KIZARU
        // -----------------------------------------------------

        if (
            name === "kizaru" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) return null;

            fighter.specialUsed = true;

            const damage = Math.floor(
                fighter.attack *
                fighter.attackBuff *
                1.45
            );

            applyDamage(
                target,
                damage,
                fighter,
                "Yasakani no Magatama"
            );

            return {
                name: "Yasakani no Magatama",
                message:
                    `✨ ${fighter.name} used ` +
                    `Yasakani no Magatama! ` +
                    `💥 ${damage} damage!`
            };
        }

        // -----------------------------------------------------
        // BARTOLOMEO
        // -----------------------------------------------------

        if (
            (
                name === "bartolomeo" ||
                name === "bartolomew"
            ) &&
            round >= 2
        ) {

            fighter.specialUsed = true;

            fighter.shield += Math.floor(
                fighter.maxHp * 0.35
            );

            return {
                name: "Barrier",
                message:
                    `🛡️ ${fighter.name} created a Barrier! ` +
                    `Shield activated!`
            };
        }

        return null;
    }

    // =========================================================
    // DAMAGE CALCULATION
    // =========================================================

    function calculateDamage(
        attacker,
        defender
    ) {

        if (!attacker || !defender) {

            return {
                damage: 0,
                critical: false
            };
        }

        const attack =
            attacker.attack *
            attacker.attackBuff;

        const defense =
            defender.defense *
            defender.defenseBuff;

        let damage =
            attack -
            (defense * 0.50);

        if (damage < 10)
            damage = 10;

        const critical =
            Math.random() <
            CRITICAL_CHANCE;

        if (critical)
            damage *= CRITICAL_MULTIPLIER;

        return {
            damage: Math.floor(damage),
            critical
        };
    }

    // =========================================================
    // APPLY DAMAGE
    // =========================================================

    function applyDamage(
        defender,
        damage,
        attacker = null,
        abilityName = ""
    ) {

        if (
            !defender ||
            defender.hp <= 0 ||
            !defender.alive
        ) {
            return false;
        }

        let remainingDamage =
            Math.max(
                0,
                Number(damage) || 0
            );

        if (remainingDamage <= 0)
            return false;

        // -----------------------------------------------------
        // SHIELD
        // -----------------------------------------------------

        if (defender.shield > 0) {

            const absorbed =
                Math.min(
                    defender.shield,
                    remainingDamage
                );

            defender.shield -= absorbed;
            remainingDamage -= absorbed;

            logBattle(
                `🛡️ ${defender.name}'s shield absorbed ` +
                `${Math.floor(absorbed)} damage!`
            );

            if (remainingDamage <= 0)
                return true;
        }

        // -----------------------------------------------------
        // TANK PROTECTION
        // -----------------------------------------------------

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0 &&
            defender.protectedBy.alive
        ) {

            remainingDamage *= 0.50;

            logBattle(
                `🛡️ ${defender.name} is protected! ` +
                `Damage reduced by 50%.`
            );
        }

        remainingDamage =
            Math.max(
                1,
                Math.floor(remainingDamage)
            );

        defender.hp -= remainingDamage;

        battleStats.totalDamage +=
            remainingDamage;

        if (attacker) {

            attacker.damageDealt =
                (attacker.damageDealt || 0) +
                remainingDamage;
        }

        // -----------------------------------------------------
        // KO
        // -----------------------------------------------------

        if (defender.hp <= 0) {

            defender.hp = 0;
            defender.alive = false;

            defender.protecting = false;

            // Remove this fighter as protector
            defender.protectedBy = null;

            defender.koShown = true;

            battleStats.totalKOs++;

            if (attacker) {

                attacker.kos =
                    (attacker.kos || 0) + 1;
            }

            // Remove protection from allies
            const allFighters = [
                ...player1Fighters,
                ...player2Fighters
            ];

            allFighters.forEach(fighter => {

                if (
                    fighter.protectedBy ===
                    defender
                ) {
                    fighter.protectedBy = null;
                }
            });

            logBattle(
                `💀 ${defender.name} has been KO'd!`
            );

            return true;
        }

        return true;
    }

    // =========================================================
    // NORMAL ATTACK
    // =========================================================

    function attack(
        attacker,
        defender
    ) {

        if (
            !attacker ||
            !defender ||
            attacker.hp <= 0 ||
            defender.hp <= 0 ||
            !attacker.alive ||
            !defender.alive
        ) {
            return;
        }

        const result =
            calculateDamage(
                attacker,
                defender
            );

        attacker.lastCritical =
            result.critical;

        adgPlayAttackEffects(
            attacker,
            defender,
            result.critical
        );

        applyDamage(
            defender,
            result.damage,
            attacker,
            result.critical
                ? "Critical Hit"
                : "Normal Attack"
        );

        if (result.critical) {

            logBattle(
                `💥 CRITICAL HIT! ` +
                `${attacker.name} dealt ` +
                `${result.damage} damage to ` +
                `${defender.name}!`
            );

        } else {

            logBattle(
                `⚔️ ${attacker.name} attacked ` +
                `${defender.name} for ` +
                `${result.damage} damage!`
            );
        }
    }

    // =========================================================
    // STATUS EFFECT PROCESSING
    // =========================================================

    function processStatusEffects(
        fighter
    ) {

        if (
            !fighter ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return;
        }

        // -----------------------------------------------------
        // BURN
        // -----------------------------------------------------

        if (fighter.burn > 0) {

            const burnDamage =
                Math.max(
                    1,
                    Math.floor(
                        fighter.maxHp * 0.05
                    )
                );

            const source =
                fighter.burnSource;

            applyDamage(
                fighter,
                burnDamage,
                source,
                "Burn"
            );

            logBattle(
                `🔥 ${fighter.name} takes ` +
                `${burnDamage} Burn damage!`
            );

            fighter.burn--;

            if (fighter.burn <= 0)
                fighter.burnSource = null;

            if (
                fighter.hp <= 0 ||
                !fighter.alive
            ) {
                return;
            }
        }

        // -----------------------------------------------------
        // BLEED
        // -----------------------------------------------------

        if (
            fighter.hp > 0 &&
            fighter.alive &&
            fighter.bleed > 0
        ) {

            const bleedDamage =
                Math.max(
                    1,
                    Math.floor(
                        fighter.maxHp * 0.04
                    )
                );

            const source =
                fighter.bleedSource;

            applyDamage(
                fighter,
                bleedDamage,
                source,
                "Bleed"
            );

            logBattle(
                `🩸 ${fighter.name} takes ` +
                `${bleedDamage} Bleed damage!`
            );

            fighter.bleed--;

            if (fighter.bleed <= 0)
                fighter.bleedSource = null;

            if (
                fighter.hp <= 0 ||
                !fighter.alive
            ) {
                return;
            }
        }

        // -----------------------------------------------------
        // REGENERATION
        // -----------------------------------------------------

        if (
            fighter.hp > 0 &&
            fighter.alive &&
            fighter.regeneration > 0
        ) {

            const heal =
                Math.floor(
                    fighter.maxHp * 0.08
                );

            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );

            logBattle(
                `❤️ ${fighter.name} regenerates ` +
                `${heal} HP!`
            );

            fighter.regeneration--;
        }

        // -----------------------------------------------------
        // STUN
        // -----------------------------------------------------

        if (
            fighter.hp > 0 &&
            fighter.alive &&
            fighter.stun > 0
        ) {

            logBattle(
                `⚡ ${fighter.name} is Stunned!`
            );

            fighter.stun--;
        }

        // -----------------------------------------------------
        // FREEZE
        // -----------------------------------------------------

        if (
            fighter.hp > 0 &&
            fighter.alive &&
            fighter.freeze > 0
        ) {

            logBattle(
                `❄️ ${fighter.name} is Frozen!`
            );

            fighter.freeze--;
        }
    }

    // =========================================================
    // TURN VALIDATION
    // =========================================================

    function canTakeTurn(fighter) {

        if (
            !fighter ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return false;
        }

        if (fighter.stun > 0)
            return false;

        if (fighter.freeze > 0)
            return false;

        return true;
    }

    // =========================================================
    // ATTACK ORDER
    // =========================================================

    function getAttackOrder() {

        const allFighters = [
            ...getAliveFighters(player1Fighters),
            ...getAliveFighters(player2Fighters)
        ];

        return allFighters.sort(
            (a, b) => {

                const speedA =
                    a.speed *
                    a.speedBuff;

                const speedB =
                    b.speed *
                    b.speedBuff;

                if (speedB !== speedA)
                    return speedB - speedA;

                // Random tie breaker
                return Math.random() - 0.5;
            }
        );
    }

    // =========================================================
    // SMART AI TARGETING
    // =========================================================

    function aiChooseTarget(enemyTeam) {

        const alive =
            getAliveFighters(enemyTeam);

        if (!alive.length)
            return null;

        // 1. Very low HP targets
        const criticalTargets =
            alive.filter(
                fighter =>
                    fighter.hp <
                    fighter.maxHp * 0.25
            );

        if (criticalTargets.length)
            return chooseLowestHP(
                criticalTargets
            );

        // 2. Prioritize Healer
        const healers =
            alive.filter(
                fighter =>
                    fighter.role === "Healer"
            );

        if (
            healers.length &&
            Math.random() < 0.40
        ) {
            return chooseTarget(healers);
        }

        // 3. Prioritize Captain
        const captains =
            alive.filter(
                fighter =>
                    fighter.role === "Captain"
            );

        if (
            captains.length &&
            Math.random() < 0.25
        ) {
            return chooseTarget(captains);
        }

        // 4. Otherwise target lowest HP
        if (Math.random() < 0.35)
            return chooseLowestHP(alive);

        // 5. Random target
        return chooseTarget(alive);
    }

    // =========================================================
    // AI DECISION
    // =========================================================

    function aiDecision(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (
            !fighter ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return;
        }

        // -----------------------------------------------------
        // CHARACTER SPECIAL
        // -----------------------------------------------------

        if (!fighter.specialUsed) {

            const specialResult =
                useCharacterSpecial(
                    fighter,
                    ownTeam,
                    enemyTeam
                );

            if (specialResult) {

                battleStats.totalSpecials++;

                adgPlaySpecialEffects(
                    fighter,
                    specialResult.name
                );

                logBattle(
                    specialResult.message
                );

                // Some specials are complete actions.
                // Buff-only specials can still attack afterward.
                const damageSpecials = [
                    "Flame Emperor",
                    "Raigo",
                    "Boro Breath",
                    "Bird Cage",
                    "Gura Gura no Mi",
                    "Ikoku",
                    "Rokuogan",
                    "Meteor Volcano",
                    "Yasakani no Magatama"
                ];

                if (
                    damageSpecials.includes(
                        specialResult.name
                    )
                ) {
                    return;
                }

                // Marco's regeneration is also a full action.
                if (
                    specialResult.name ===
                    "Phoenix Regeneration"
                ) {
                    return;
                }

                // Barrier is a defensive action.
                if (
                    specialResult.name ===
                    "Barrier"
                ) {
                    return;
                }
            }
        }

        // -----------------------------------------------------
        // ROLE ABILITY
        // -----------------------------------------------------

        if (
            fighter.role === "Healer"
        ) {

            // Healer gets exactly ONE heal attempt.
            const healed =
                healerAbility(
                    fighter,
                    ownTeam
                );

            if (healed)
                return;

        } else {

            useRoleAbility(
                fighter,
                ownTeam,
                enemyTeam
            );
        }

        // -----------------------------------------------------
        // NORMAL ATTACK
        // -----------------------------------------------------

        const target =
            aiChooseTarget(enemyTeam);

        if (!target)
            return;

        attack(
            fighter,
            target
        );
    }

    // =========================================================
    // VISUAL EFFECTS
    // =========================================================

    function adgFindCard(fighter) {

        const cards =
            document.querySelectorAll(
                ".fighter-card"
            );

        for (const card of cards) {

            const title =
                card.querySelector("h3");

            if (!title)
                continue;

            if (
                title.textContent
                    .trim()
                    .toLowerCase()
                    .includes(
                        fighter.name
                            .trim()
                            .toLowerCase()
                    )
            ) {
                return card;
            }
        }

        return null;
    }

    function adgShowAnnouncement(text) {

        const element =
            document.createElement("div");

        element.className =
            "adg-announcement";

        element.textContent = text;

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode)
                element.remove();

        }, 1100);
    }

    function adgAttackImpact(
        emoji = "💥"
    ) {

        const element =
            document.createElement("div");

        element.className =
            "adg-attack-impact";

        element.textContent = emoji;

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode)
                element.remove();

        }, 600);
    }

    function adgFlash() {

        const element =
            document.createElement("div");

        element.className =
            "adg-arena-flash";

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode)
                element.remove();

        }, 300);
    }

    function adgSpecialBanner(
        fighter,
        abilityName =
            "SPECIAL ABILITY"
    ) {

        const element =
            document.createElement("div");

        element.className =
            "adg-special-banner";

        element.textContent =
            `🔥 ${fighter.name} — ${abilityName}!`;

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode)
                element.remove();

        }, 1200);
    }

    function adgPlayAttackEffects(
        attacker,
        defender,
        critical = false
    ) {

        const attackerCard =
            adgFindCard(attacker);

        const defenderCard =
            adgFindCard(defender);

        if (attackerCard) {

            attackerCard.classList.add(
                "attacker-highlight",
                "attacking"
            );

            setTimeout(() => {

                attackerCard.classList.remove(
                    "attacker-highlight",
                    "attacking"
                );

            }, 450);
        }

        if (defenderCard) {

            defenderCard.classList.add(
                "target-highlight",
                "hit"
            );

            if (critical) {

                defenderCard.classList.add(
                    "critical"
                );
            }

            setTimeout(() => {

                defenderCard.classList.remove(
                    "target-highlight",
                    "hit",
                    "critical"
                );

            }, 550);
        }

        adgAttackImpact(
            critical
                ? "💥"
                : "⚔️"
        );

        if (critical)
            adgFlash();
    }

    function adgPlaySpecialEffects(
        fighter,
        abilityName
    ) {

        const card =
            adgFindCard(fighter);

        if (card) {

            card.classList.add(
                "special"
            );

            setTimeout(() => {

                card.classList.remove(
                    "special"
                );

            }, 900);
        }

        adgSpecialBanner(
            fighter,
            abilityName
        );

        adgFlash();
    }

    // =========================================================
    // VICTORY
    // =========================================================

    function adgShowVictory(
        playerNumber
    ) {

        if (
            document.querySelector(
                ".adg-victory-overlay"
            )
        ) {
            return;
        }

        const overlay =
            document.createElement("div");

        overlay.className =
            "adg-victory-overlay";

        overlay.innerHTML = `

            <div class="adg-victory-box">

                <h1>
                    🏆 PLAYER
                    ${playerNumber}
                    WINS!
                </h1>

                <p>
                    ⚔️ Battle Complete!
                </p>

            </div>
        `;

        document.body.appendChild(
            overlay
        );
    }

    function adgRemoveVictory() {

        const overlay =
            document.querySelector(
                ".adg-victory-overlay"
            );

        if (overlay)
            overlay.remove();
    }

    // =========================================================
    // END GAME
    // =========================================================

    function battleFinished() {

        const p1Alive =
            getAliveFighters(
                player1Fighters
            ).length;

        const p2Alive =
            getAliveFighters(
                player2Fighters
            ).length;

        return (
            p1Alive === 0 ||
            p2Alive === 0 ||
            round >= MAX_ROUNDS
        );
    }

    function getBattleWinner() {

        const p1Alive =
            getAliveFighters(
                player1Fighters
            ).length;

        const p2Alive =
            getAliveFighters(
                player2Fighters
            ).length;

        if (
            p1Alive === 0 &&
            p2Alive === 0
        ) {
            return 0;
        }

        if (p1Alive === 0)
            return 2;

        if (p2Alive === 0)
            return 1;

        return null;
    }

    // =========================================================
    // RESULT
    // =========================================================

    function showBattleResult(
        winner
    ) {

        const resultBox =
            document.querySelector(
                ".result-box"
            );

        if (resultBox)
            resultBox.classList.remove(
                "hidden"
            );

        const winnerText =
            document.getElementById(
                "winnerText"
            );

        if (winnerText) {

            if (winner === 1)
                winnerText.textContent =
                    "🏆 PLAYER 1 WINS!";

            else if (winner === 2)
                winnerText.textContent =
                    "🏆 PLAYER 2 WINS!";

            else
                winnerText.textContent =
                    "🤝 DRAW!";
        }

        const resultSummary =
            document.getElementById(
                "resultSummary"
            );

        if (resultSummary) {

            resultSummary.textContent =
                `Battle completed in ` +
                `${battleStats.completedRounds} rounds.`;
        }

        // -----------------------------------------------------
        // TEAM RESULT
        // -----------------------------------------------------

        function buildTeamResult(
            team
        ) {

            const totalHP =
                team.reduce(
                    (total, fighter) =>
                        total +
                        Math.max(
                            0,
                            fighter.hp
                        ),
                    0
                );

            const KOs =
                team.filter(
                    fighter =>
                        fighter.hp <= 0
                ).length;

            const totalDamage =
                team.reduce(
                    (total, fighter) =>
                        total +
                        (fighter.damageDealt || 0),
                    0
                );

            return `

                <div class="result-team-stat">

                    <p>
                        ❤️ Remaining HP:
                        <strong>
                            ${Math.floor(totalHP)}
                        </strong>
                    </p>

                    <p>
                        💀 KOs:
                        <strong>
                            ${KOs}
                        </strong>
                    </p>

                    <p>
                        💥 Damage Dealt:
                        <strong>
                            ${Math.floor(totalDamage)}
                        </strong>
                    </p>

                </div>
            `;
        }

        const player1Result =
            document.getElementById(
                "player1Result"
            );

        if (player1Result) {

            player1Result.innerHTML =
                buildTeamResult(
                    player1Fighters
                );
        }

        const player2Result =
            document.getElementById(
                "player2Result"
            );

        if (player2Result) {

            player2Result.innerHTML =
                buildTeamResult(
                    player2Fighters
                );
        }

        // -----------------------------------------------------
        // BATTLE STATISTICS
        // -----------------------------------------------------

        const battleStatistics =
            document.getElementById(
                "battleStatistics"
            );

        if (battleStatistics) {

            battleStatistics.innerHTML = `

                <div class="battle-statistics">

                    <h3>
                        📊 Battle Statistics
                    </h3>

                    <p>
                        ⚔️ Total Damage:
                        <strong>
                            ${Math.floor(
                                battleStats.totalDamage
                            )}
                        </strong>
                    </p>

                    <p>
                        💀 Total KOs:
                        <strong>
                            ${battleStats.totalKOs}
                        </strong>
                    </p>

                    <p>
                        🔥 Specials Used:
                        <strong>
                            ${battleStats.totalSpecials}
                        </strong>
                    </p>

                    <p>
                        🔄 Rounds:
                        <strong>
                            ${battleStats.completedRounds}
                        </strong>
                    </p>

                </div>
            `;
        }

        if (
            winner === 1 ||
            winner === 2
        ) {
            adgShowVictory(
                winner
            );
        }

        if (battleStatus) {

            if (winner === 1) {

                battleStatus.textContent =
                    "🏆 PLAYER 1 IS VICTORIOUS!";

            } else if (winner === 2) {

                battleStatus.textContent =
                    "🏆 PLAYER 2 IS VICTORIOUS!";

            } else {

                battleStatus.textContent =
                    "🤝 THE BATTLE ENDED IN A DRAW!";
            }
        }
    }

    // =========================================================
    // ROUND DISPLAY
    // =========================================================

    function updateRoundDisplay() {

        document
            .querySelectorAll(
                ".round-number"
            )
            .forEach(
                element =>
                    element.textContent =
                        round
            );

        const currentRound =
            document.getElementById(
                "currentRound"
            );

        if (currentRound) {

            currentRound.textContent =
                `Round ${round}`;
        }
    }

    // =========================================================
    // FINISH BATTLE
    // =========================================================

    function finishBattle() {

        if (!battleRunning)
            return;

        battleRunning = false;

        const winner =
            getBattleWinner();

        // -----------------------------------------------------
        // MAX ROUND DECISION
        // -----------------------------------------------------

        if (
            winner === null &&
            round >= MAX_ROUNDS
        ) {

            const p1HP =
                player1Fighters.reduce(
                    (total, fighter) =>
                        total +
                        Math.max(
                            0,
                            fighter.hp
                        ),
                    0
                );

            const p2HP =
                player2Fighters.reduce(
                    (total, fighter) =>
                        total +
                        Math.max(
                            0,
                            fighter.hp
                        ),
                    0
                );

            let finalWinner = 0;

            if (p1HP > p2HP)
                finalWinner = 1;

            else if (p2HP > p1HP)
                finalWinner = 2;

            logBattle(
                `<strong>
                    ⏱️ MAXIMUM ${MAX_ROUNDS}
                    ROUNDS REACHED!
                </strong>`
            );

            logBattle(
                `❤️ Player 1 remaining HP:
                ${Math.floor(p1HP)}`
            );

            logBattle(
                `❤️ Player 2 remaining HP:
                ${Math.floor(p2HP)}`
            );

            showBattleResult(
                finalWinner
            );

            return;
        }

        logBattle(
            `<strong>
                🏁 BATTLE FINISHED!
            </strong>`
        );

        showBattleResult(
            winner || 0
        );
    }

    // =========================================================
    // ROUND LOOP
    // =========================================================

    async function startRound() {

        if (!battleRunning)
            return;

        if (battleFinished()) {

            finishBattle();
            return;
        }

        updateRoundDisplay();

        adgShowAnnouncement(
            `⚔️ ROUND ${round}`
        );

        logBattle(
            `<strong>
                ━━━━━━━━ ROUND ${round} ━━━━━━━━
            </strong>`
        );

        // -----------------------------------------------------
        // STATUS EFFECTS
        // -----------------------------------------------------

        const activeFighters = [
            ...getAliveFighters(
                player1Fighters
            ),
            ...getAliveFighters(
                player2Fighters
            )
        ];

        activeFighters.forEach(
            fighter =>
                processStatusEffects(
                    fighter
                )
        );

        if (battleFinished()) {

            finishBattle();
            return;
        }

        updateBattleUI();

        await sleep(500);

        // -----------------------------------------------------
        // ATTACK ORDER
        // -----------------------------------------------------

        const attackOrder =
            getAttackOrder();

        for (
            const fighter of attackOrder
        ) {

            if (
                !battleRunning ||
                battleFinished()
            ) {
                break;
            }

            // Fighter may have been KO'd
            // by an earlier fighter.
            if (
                fighter.hp <= 0 ||
                !fighter.alive
            ) {
                continue;
            }

            // Status effect can prevent turn.
            if (
                !canTakeTurn(fighter)
            ) {
                continue;
            }

            const ownTeam =
                player1Fighters.includes(
                    fighter
                )
                    ? player1Fighters
                    : player2Fighters;

            const enemyTeam =
                player1Fighters.includes(
                    fighter
                )
                    ? player2Fighters
                    : player1Fighters;

            aiDecision(
                fighter,
                ownTeam,
                enemyTeam
            );

            updateBattleUI();

            await sleep(750);
        }

        // -----------------------------------------------------
        // ROUND COMPLETE
        // -----------------------------------------------------

        battleStats.completedRounds =
            round;

        if (battleFinished()) {

            finishBattle();
            return;
        }

        round++;

        updateBattleUI();

        setTimeout(
            () => startRound(),
            1000
        );
    }

    // =========================================================
    // RESET FIGHTER
    // =========================================================

    function resetFighter(
        fighter
    ) {

        fighter.hp =
            fighter.maxHp;

        fighter.alive = true;

        fighter.abilityUsed = false;
        fighter.specialUsed = false;

        fighter.koShown = false;
        fighter.lastCritical = false;

        fighter.assistReady = true;

        fighter.protecting = false;
        fighter.protectedBy = null;

        fighter.burn = 0;
        fighter.bleed = 0;

        fighter.stun = 0;
        fighter.freeze = 0;

        fighter.shield = 0;
        fighter.regeneration = 0;

        fighter.burnSource = null;
        fighter.bleedSource = null;

        fighter.attackBuff = 1;
        fighter.defenseBuff = 1;
        fighter.speedBuff = 1;

        fighter.damageDealt = 0;
        fighter.kos = 0;
    }

    // =========================================================
    // START BATTLE
    // =========================================================

    function startBattle() {

        if (battleRunning)
            return;

        if (
            player1Fighters.length === 0 ||
            player2Fighters.length === 0
        ) {

            logBattle(
                "❌ Both players need at least one fighter!"
            );

            return;
        }

        round = 1;

        battleRunning = true;

        battleStats = {
            totalDamage: 0,
            totalKOs: 0,
            totalSpecials: 0,
            completedRounds: 0
        };

        const resultBox =
            document.querySelector(
                ".result-box"
            );

        if (resultBox) {

            resultBox.classList.add(
                "hidden"
            );
        }

        adgRemoveVictory();

        [
            ...player1Fighters,
            ...player2Fighters
        ].forEach(
            resetFighter
        );

        if (battleLog)
            battleLog.innerHTML = "";

        updateBattleUI();

        if (battleStatus) {

            battleStatus.textContent =
                "⚔️ BATTLE STARTED!";
        }

        logBattle(
            "<strong>
                🔥 BATTLE START!
            </strong>"
        );

        adgShowAnnouncement(
            "⚔️ BATTLE START!"
        );

        setTimeout(
            () => startRound(),
            800
        );
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

    // =========================================================
    // INITIAL UI
    // =========================================================

    updateBattleUI();

    if (battleStatus) {

        battleStatus.textContent =
            (
                player1Fighters.length === 0 ||
                player2Fighters.length === 0
            )
                ? "⚠️ Both players need fighters."
                : "⚔️ READY FOR BATTLE";
    }

});