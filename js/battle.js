document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ADG BATTLE — FINAL VERSION
       ===================================================== */

    const player1Team =
        JSON.parse(localStorage.getItem("player1Team")) || [];

    const player2Team =
        JSON.parse(localStorage.getItem("player2Team")) || [];

    const player1Roles =
        JSON.parse(localStorage.getItem("player1Roles")) || {};

    const player2Roles =
        JSON.parse(localStorage.getItem("player2Roles")) || {};

    const selectedAnime =
        localStorage.getItem("selectedAnime") ||
        localStorage.getItem("selectedAnimeName") ||
        "One Piece";

    /* =====================================================
       BATTLE SETTINGS
       ===================================================== */

    const MAX_ROUNDS = 50;
    const TEAM_SIZE = 6;

    const BASE_HP = 1000;
    const BASE_ATTACK = 100;
    const BASE_DEFENSE = 80;
    const BASE_SPEED = 80;

    const NORMAL_ATTACK_MIN = 0.85;
    const NORMAL_ATTACK_MAX = 1.15;

    const CRITICAL_CHANCE = 0.10;
    const CRITICAL_MULTIPLIER = 1.75;

    let round = 1;
    let battleRunning = false;
    let battleFinished = false;

    let player1Fighters = [];
    let player2Fighters = [];

    let battleStats = {
        totalDamage: 0,
        totalKOs: 0,
        totalSpecials: 0,
        completedRounds: 0
    };

    /* =====================================================
       DOM
       ===================================================== */

    const player1Battle =
        document.getElementById("player1Battle");

    const player2Battle =
        document.getElementById("player2Battle");

    const battleLog =
        document.getElementById("battleLog");

    const battleStatus =
        document.getElementById("battleStatus");

    const currentRound =
        document.getElementById("currentRound");

    const startBattleBtn =
        document.getElementById("startBattleBtn");

    const rematchBtn =
        document.getElementById("rematchBtn");

    const characterDetailsBtn =
        document.getElementById("characterDetailsBtn");

    const resultBox =
        document.querySelector(".result-box");

    const winnerText =
        document.getElementById("winnerText");

    const resultSummary =
        document.getElementById("resultSummary");

    const player1Result =
        document.getElementById("player1Result");

    const player2Result =
        document.getElementById("player2Result");

    const battleStatistics =
        document.getElementById("battleStatistics");

    const player1CharacterDetails =
        document.getElementById(
            "player1CharacterDetails"
        );

    const player2CharacterDetails =
        document.getElementById(
            "player2CharacterDetails"
        );

    const characterDetailsOverlay =
        document.querySelector(
            ".character-details-overlay"
        );

    const closeCharacterDetails =
        document.getElementById(
            "closeCharacterDetails"
        );

    const animeTitle =
        document.getElementById("animeTitle");

    if (animeTitle) {
        animeTitle.textContent =
            `🎌 ${selectedAnime}`;
    }

    /* =====================================================
       ROLE HELPERS
       ===================================================== */

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

    function normalizeRole(role) {

        const validRoles = [
            "Captain",
            "Vice Captain",
            "Tank",
            "Healer",
            "Support",
            "Wildcard"
        ];

        if (validRoles.includes(role)) {
            return role;
        }

        return "Wildcard";
    }

    /* =====================================================
       FIGHTER CREATION
       ===================================================== */

    function createFighter(name, role) {

        const fighterRole =
            normalizeRole(role);

        const fighter = {

            name: String(name),

            role: fighterRole,

            emoji:
                getRoleEmoji(
                    fighterRole
                ),

            hp: BASE_HP,

            maxHp: BASE_HP,

            attack: BASE_ATTACK,

            defense: BASE_DEFENSE,

            speed: BASE_SPEED,

            alive: true,

            abilityUsed: false,

            specialUsed: false,

            specialCount: 0,

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

            damageTaken: 0,

            healingDone: 0,

            koCount: 0,

            criticalHits: 0,

            attacks: 0
        };

        applyRoleBonus(
            fighter
        );

        fighter.maxHp =
            fighter.hp;

        return fighter;
    }

    /* =====================================================
       ROLE BASE STATS
       ===================================================== */

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

    /* =====================================================
       CREATE TEAMS
       ===================================================== */

    player1Team
        .slice(0, TEAM_SIZE)
        .forEach(character => {

            player1Fighters.push(
                createFighter(
                    character,
                    player1Roles[character]
                )
            );

        });

    player2Team
        .slice(0, TEAM_SIZE)
        .forEach(character => {

            player2Fighters.push(
                createFighter(
                    character,
                    player2Roles[character]
                )
            );

        });

    /* =====================================================
       TEAM HELPERS
       ===================================================== */

    function getAliveFighters(team) {

        return team.filter(
            fighter =>
                fighter.alive &&
                fighter.hp > 0
        );
    }

    function getDeadFighters(team) {

        return team.filter(
            fighter =>
                !fighter.alive ||
                fighter.hp <= 0
        );
    }

    function isTeamDefeated(team) {

        return getAliveFighters(team).length === 0;
    }

    function getOwnTeam(fighter) {

        if (
            player1Fighters.includes(
                fighter
            )
        ) {
            return player1Fighters;
        }

        if (
            player2Fighters.includes(
                fighter
            )
        ) {
            return player2Fighters;
        }

        return null;
    }

    function getEnemyTeam(fighter) {

        if (
            player1Fighters.includes(
                fighter
            )
        ) {
            return player2Fighters;
        }

        if (
            player2Fighters.includes(
                fighter
            )
        ) {
            return player1Fighters;
        }

        return null;
    }

    function chooseTarget(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        return alive[
            Math.floor(
                Math.random() *
                alive.length
            )
        ];
    }

    function chooseLowestHP(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        return alive.reduce(
            (lowest, fighter) => {

                const lowestRatio =
                    lowest.hp /
                    lowest.maxHp;

                const fighterRatio =
                    fighter.hp /
                    fighter.maxHp;

                return fighterRatio <
                    lowestRatio
                    ? fighter
                    : lowest;

            },
            alive[0]
        );
    }

    function chooseAITarget(
        attacker,
        enemyTeam
    ) {

        const alive =
            getAliveFighters(
                enemyTeam
            );

        if (alive.length === 0) {
            return null;
        }

        /*
         * AI gives Healers a small priority,
         * then sometimes attacks the weakest target,
         * otherwise chooses randomly.
         */

        const healers =
            alive.filter(
                fighter =>
                    fighter.role === "Healer"
            );

        if (
            healers.length > 0 &&
            Math.random() < 0.30
        ) {

            return healers[
                Math.floor(
                    Math.random() *
                    healers.length
                )
            ];
        }

        if (Math.random() < 0.45) {

            return chooseLowestHP(
                enemyTeam
            );
        }

        return chooseTarget(
            enemyTeam
        );
    }

    /* =====================================================
       UI / LOG
       ===================================================== */

    function logBattle(message) {

        if (!battleLog) {
            return;
        }

        const line =
            document.createElement("p");

        line.innerHTML =
            message;

        battleLog.appendChild(
            line
        );

        battleLog.scrollTop =
            battleLog.scrollHeight;
    }

    function setBattleStatus(message) {

        if (battleStatus) {
            battleStatus.textContent =
                message;
        }
    }

    function updateRoundUI() {

        if (currentRound) {

            currentRound.textContent =
                `Round ${Math.min(
                    round,
                    MAX_ROUNDS
                )} / ${MAX_ROUNDS}`;
        }
    }

    function wait(milliseconds) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );
    }

    /* =====================================================
       DAMAGE CALCULATION
       ===================================================== */

    function calculateDamage(
        attacker,
        defender
    ) {

        const attack =
            attacker.attack *
            attacker.attackBuff;

        const defense =
            defender.defense *
            defender.defenseBuff;

        let damage =
            attack -
            defense * 0.45;

        damage =
            Math.max(
                20,
                damage
            );

        const variation =
            NORMAL_ATTACK_MIN +
            Math.random() *
            (
                NORMAL_ATTACK_MAX -
                NORMAL_ATTACK_MIN
            );

        damage *=
            variation;

        const critical =
            Math.random() <
            CRITICAL_CHANCE;

        if (critical) {

            damage *=
                CRITICAL_MULTIPLIER;
        }

        return {

            damage:
                Math.floor(
                    damage
                ),

            critical:
                critical
        };
    }

    /* =====================================================
       APPLY DAMAGE
       ===================================================== */

    function applyDamage(
        defender,
        damage,
        attacker = null,
        abilityName = ""
    ) {

        if (
            !defender ||
            !defender.alive ||
            defender.hp <= 0
        ) {
            return 0;
        }

        let finalDamage =
            Math.max(
                0,
                Math.floor(
                    damage
                )
            );

        /* Shield */

        if (
            defender.shield > 0 &&
            finalDamage > 0
        ) {

            const absorbed =
                Math.min(
                    defender.shield,
                    finalDamage
                );

            defender.shield -=
                absorbed;

            finalDamage -=
                absorbed;

            if (absorbed > 0) {

                logBattle(
                    `🛡️ ${defender.name}'s shield absorbed <strong>${absorbed}</strong> damage!`
                );
            }
        }

        /* Tank protection */

        if (
            finalDamage > 0 &&
            defender.protectedBy &&
            defender.protectedBy.alive
        ) {

            finalDamage =
                Math.floor(
                    finalDamage * 0.50
                );

            logBattle(
                `🛡️ ${defender.protectedBy.name} protected ${defender.name}!`
            );
        }

        defender.hp -=
            finalDamage;

        defender.hp =
            Math.max(
                0,
                defender.hp
            );

        defender.damageTaken +=
            finalDamage;

        battleStats.totalDamage +=
            finalDamage;

        if (attacker) {

            attacker.damageDealt +=
                finalDamage;
        }

        if (
            defender.hp <= 0
        ) {

            defeatFighter(
                defender,
                attacker
            );
        }

        return finalDamage;
    }

    /* =====================================================
       DEFEAT
       ===================================================== */

    function defeatFighter(
        fighter,
        attacker = null
    ) {

        if (
            !fighter ||
            !fighter.alive
        ) {
            return;
        }

        fighter.hp = 0;

        fighter.alive = false;

        fighter.protecting = false;

        fighter.protectedBy = null;

        battleStats.totalKOs++;

        if (attacker) {

            attacker.koCount++;
        }

        logBattle(
            `💀 <strong>${fighter.name}</strong> has been defeated!`
        );

        adgShowAnnouncement(
            `💀 ${fighter.name} KO!`
        );
    }

    /* =====================================================
       HEAL
       ===================================================== */

    function healFighter(
        healer,
        target,
        amount
    ) {

        if (
            !target ||
            !target.alive
        ) {
            return 0;
        }

        const oldHP =
            target.hp;

        target.hp =
            Math.min(
                target.maxHp,
                target.hp +
                Math.floor(amount)
            );

        const healed =
            Math.floor(
                target.hp -
                oldHP
            );

        if (healed > 0) {

            if (healer) {

                healer.healingDone +=
                    healed;
            }

            logBattle(
                `❤️ ${healer ? healer.name : "Regeneration"} restored <strong>${healed} HP</strong> to ${target.name}!`
            );
        }

        return healed;
    }

    /* =====================================================
       STATUS EFFECTS
       ===================================================== */

    function processStatusEffects(
        fighter
    ) {

        if (
            !fighter ||
            !fighter.alive
        ) {
            return;
        }

        /* Burn */

        if (fighter.burn > 0) {

            const damage =
                Math.floor(
                    fighter.maxHp *
                    0.05
                );

            fighter.hp -=
                damage;

            fighter.hp =
                Math.max(
                    0,
                    fighter.hp
                );

            fighter.damageTaken +=
                damage;

            battleStats.totalDamage +=
                damage;

            fighter.burn--;

            logBattle(
                `🔥 ${fighter.name} suffered <strong>${damage}</strong> Burn damage!`
            );

            if (
                fighter.hp <= 0
            ) {

                defeatFighter(
                    fighter
                );

                return;
            }
        }

        /* Bleed */

        if (
            fighter.alive &&
            fighter.bleed > 0
        ) {

            const damage =
                Math.floor(
                    fighter.maxHp *
                    0.04
                );

            fighter.hp -=
                damage;

            fighter.hp =
                Math.max(
                    0,
                    fighter.hp
                );

            fighter.damageTaken +=
                damage;

            battleStats.totalDamage +=
                damage;

            fighter.bleed--;

            logBattle(
                `🩸 ${fighter.name} suffered <strong>${damage}</strong> Bleed damage!`
            );

            if (
                fighter.hp <= 0
            ) {

                defeatFighter(
                    fighter
                );

                return;
            }
        }

        /* Regeneration */

        if (
            fighter.alive &&
            fighter.regeneration > 0
        ) {

            const heal =
                Math.floor(
                    fighter.maxHp *
                    0.06
                );

            healFighter(
                fighter,
                fighter,
                heal
            );

            fighter.regeneration--;
        }

        /* Reduce control effects */

        if (fighter.stun > 0) {
            fighter.stun--;
        }

        if (fighter.freeze > 0) {
            fighter.freeze--;
        }
    }

    function isStunnedOrFrozen(
        fighter
    ) {

        if (
            !fighter ||
            !fighter.alive
        ) {
            return true;
        }

        if (
            fighter.stun > 0
        ) {

            logBattle(
                `💫 ${fighter.name} is stunned and misses the turn!`
            );

            return true;
        }

        if (
            fighter.freeze > 0
        ) {

            logBattle(
                `❄️ ${fighter.name} is frozen and misses the turn!`
            );

            return true;
        }

        return false;
    }

    /* =====================================================
       ROLE ABILITIES
       ===================================================== */

    function captainAbility(
        captain,
        team
    ) {

        if (
            captain.abilityUsed ||
            !captain.alive
        ) {
            return false;
        }

        captain.abilityUsed =
            true;

        team.forEach(
            fighter => {

                if (fighter.alive) {

                    fighter.attackBuff *=
                        1.10;

                    fighter.defenseBuff *=
                        1.10;
                }
            }
        );

        logBattle(
            `👑 ${captain.name} used <strong>Captain's Command!</strong> ⚔️ Team Attack +10%, 🛡️ Defense +10%`
        );

        return true;
    }

    function viceCaptainAbility(
        viceCaptain,
        enemyTeam
    ) {

        if (
            viceCaptain.abilityUsed ||
            !viceCaptain.alive
        ) {
            return false;
        }

        const target =
            chooseAITarget(
                viceCaptain,
                enemyTeam
            );

        if (!target) {
            return false;
        }

        viceCaptain.abilityUsed =
            true;

        const result =
            calculateDamage(
                viceCaptain,
                target
            );

        const damage =
            applyDamage(
                target,
                result.damage * 1.25,
                viceCaptain,
                "Vice Captain Strike"
            );

        logBattle(
            `⚔️ ${viceCaptain.name} used <strong>Vice Captain Strike!</strong> — ${damage} damage!`
        );

        if (
            typeof playSpecialEffect ===
            "function"
        ) {

            playSpecialEffect(
                viceCaptain,
                "Vice Captain Strike"
            );
        }

        return true;
    }

    function tankAbility(
        tank,
        team
    ) {

        if (
            tank.abilityUsed ||
            !tank.alive
        ) {
            return false;
        }

        tank.abilityUsed =
            true;

        tank.protecting =
            true;

        team.forEach(
            fighter => {

                if (
                    fighter.alive &&
                    fighter !== tank
                ) {

                    fighter.protectedBy =
                        tank;
                }
            }
        );

        logBattle(
            `🛡️ ${tank.name} used <strong>Guardian Protection!</strong> — allies receive 50% damage reduction.`
        );

        return true;
    }

    function healerAbility(
        healer,
        team
    ) {

        if (
            healer.abilityUsed ||
            !healer.alive
        ) {
            return false;
        }

        const target =
            chooseLowestHP(
                team
            );

        if (!target) {
            return false;
        }

        healer.abilityUsed =
            true;

        const healed =
            healFighter(
                healer,
                target,
                target.maxHp * 0.25
            );

        logBattle(
            `❤️ ${healer.name} used <strong>Healing Wave!</strong> — ${healed} HP restored.`
        );

        return true;
    }

    function supportAbility(
        support,
        team
    ) {

        if (
            support.abilityUsed ||
            !support.alive
        ) {
            return false;
        }

        support.abilityUsed =
            true;

        team.forEach(
            fighter => {

                if (fighter.alive) {

                    fighter.attackBuff *=
                        1.05;

                    fighter.speedBuff *=
                        1.10;
                }
            }
        );

        logBattle(
            `⭐ ${support.name} used <strong>Team Support!</strong> ⚔️ Attack +5%, ⚡ Speed +10%`
        );

        return true;
    }

    function wildcardAbility(
        fighter
    ) {

        if (
            fighter.abilityUsed ||
            !fighter.alive
        ) {
            return false;
        }

        fighter.abilityUsed =
            true;

        const random =
            Math.floor(
                Math.random() * 3
            );

        if (random === 0) {

            fighter.attackBuff *=
                1.25;

            logBattle(
                `☠️ ${fighter.name} activated <strong>Berserker!</strong> ⚔️ Attack +25%`
            );

        } else if (
            random === 1
        ) {

            fighter.defenseBuff *=
                1.25;

            logBattle(
                `☠️ ${fighter.name} activated <strong>Guardian!</strong> 🛡️ Defense +25%`
            );

        } else {

            fighter.speedBuff *=
                1.25;

            logBattle(
                `☠️ ${fighter.name} activated <strong>Assassin!</strong> ⚡ Speed +25%`
            );
        }

        return true;
    }

    function processRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (
            !fighter ||
            !fighter.alive
        ) {
            return false;
        }

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

    /* =====================================================
       CHARACTER SPECIAL
       ===================================================== */

    async function tryCharacterSpecial(
        fighter,
        enemyTeam,
        ownTeam
    ) {

        if (
            !fighter ||
            !fighter.alive ||
            fighter.specialUsed
        ) {
            return false;
        }

        /*
         * 25% chance per turn.
         * Only one special per character.
         */

        if (
            Math.random() > 0.25
        ) {
            return false;
        }

        const target =
            chooseAITarget(
                fighter,
                enemyTeam
            );

        if (!target) {
            return false;
        }

        fighter.specialUsed =
            true;

        fighter.specialCount++;

        battleStats.totalSpecials++;

        let damageMultiplier =
            1.50;

        let effectMessage =
            "Character Special";

        /* Captain */

        if (
            fighter.role ===
            "Captain"
        ) {

            damageMultiplier =
                1.70;

            effectMessage =
                "👑 Captain Power";
        }

        /* Vice Captain */

        else if (
            fighter.role ===
            "Vice Captain"
        ) {

            damageMultiplier =
                1.60;

            effectMessage =
                "⚔️ Vice Captain Strike";
        }

        /* Tank */

        else if (
            fighter.role ===
            "Tank"
        ) {

            damageMultiplier =
                1.35;

            fighter.shield +=
                fighter.maxHp *
                0.15;

            effectMessage =
                "🛡️ Tank Shield";
        }

        /* Healer */

        else if (
            fighter.role ===
            "Healer"
        ) {

            const healTarget =
                chooseLowestHP(
                    ownTeam
                );

            if (healTarget) {

                healFighter(
                    fighter,
                    healTarget,
                    healTarget.maxHp *
                    0.30
                );
            }

            fighter.regeneration =
                Math.max(
                    fighter.regeneration,
                    3
                );

            logBattle(
                `❤️ ${fighter.name} used <strong>Healing Special!</strong> ❤️ Regeneration activated!`
            );

            playSpecialEffect(
                fighter,
                "Healing Special"
            );

            await wait(500);

            return true;
        }

        /* Support */

        else if (
            fighter.role ===
            "Support"
        ) {

            ownTeam.forEach(
                member => {

                    if (member.alive) {

                        member.attackBuff *=
                            1.10;

                        member.speedBuff *=
                            1.10;
                    }
                }
            );

            damageMultiplier =
                1.25;

            effectMessage =
                "⭐ Support Boost";
        }

        /* Wildcard */

        else if (
            fighter.role ===
            "Wildcard"
        ) {

            damageMultiplier =
                1.90;

            effectMessage =
                "☠️ Wildcard Chaos";
        }

        const result =
            calculateDamage(
                fighter,
                target
            );

        const damage =
            applyDamage(
                target,
                result.damage *
                damageMultiplier,
                fighter,
                effectMessage
            );

        logBattle(
            `🔥 <strong>${fighter.name}</strong> used <strong>Special Ability!</strong> ${effectMessage} — <strong>${damage}</strong> damage!`
        );

        if (
            result.critical
        ) {

            logBattle(
                `💥 Special attack was CRITICAL!`
            );
        }

        playSpecialEffect(
            fighter,
            effectMessage
        );

        await wait(500);

        return true;
    }

    /* =====================================================
       TURN ORDER
       ===================================================== */

    function getTurnOrder() {

        const fighters = [

            ...getAliveFighters(
                player1Fighters
            ),

            ...getAliveFighters(
                player2Fighters
            )

        ];

        return fighters.sort(
            (a, b) => {

                const speedA =
                    a.speed *
                    a.speedBuff;

                const speedB =
                    b.speed *
                    b.speedBuff;

                const valueA =
                    speedA +
                    Math.random() *
                    10;

                const valueB =
                    speedB +
                    Math.random() *
                    10;

                return valueB -
                    valueA;
            }
        );
    }

    /* =====================================================
       NORMAL ATTACK
       ===================================================== */

    async function performAttack(
        attacker,
        defender
    ) {

        if (
            !attacker ||
            !defender ||
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

        attacker.attacks++;

        if (
            result.critical
        ) {

            attacker.criticalHits++;

            logBattle(
                `💥 ${attacker.name} lands a <strong>CRITICAL HIT!</strong>`
            );
        }

        const damage =
            applyDamage(
                defender,
                result.damage,
                attacker,
                "Normal Attack"
            );

        if (damage > 0) {

            logBattle(
                `⚔️ ${attacker.name} dealt <strong>${damage}</strong> damage to ${defender.name}.`
            );
        }

        adgPlayAttackEffects(
            attacker,
            defender,
            result.critical
        );

        await wait(300);
    }

    /* =====================================================
       FIGHTER TURN
       ===================================================== */

    async function fighterTurn(
        fighter
    ) {

        if (
            !fighter ||
            !fighter.alive ||
            !battleRunning
        ) {
            return;
        }

        if (
            isStunnedOrFrozen(
                fighter
            )
        ) {
            return;
        }

        /*
         * Status effects happen once at the beginning
         * of the fighter's turn.
         */

        processStatusEffects(
            fighter
        );

        if (
            !fighter.alive
        ) {
            return;
        }

        const ownTeam =
            getOwnTeam(
                fighter
            );

        const enemyTeam =
            getEnemyTeam(
                fighter
            );

        if (
            !ownTeam ||
            !enemyTeam
        ) {
            return;
        }

        /*
         * Role ability happens once.
         */

        const abilityUsed =
            processRoleAbility(
                fighter,
                ownTeam,
                enemyTeam
            );

        if (abilityUsed) {

            playSpecialEffect(
                fighter,
                `${fighter.role} Ability`
            );

            await wait(450);

            if (
                !fighter.alive
            ) {
                return;
            }

            /*
             * A role ability does NOT automatically
             * prevent the character from attacking.
             */
        }

        /*
         * Character special.
         */

        const specialUsed =
            await tryCharacterSpecial(
                fighter,
                enemyTeam,
                ownTeam
            );

        if (
            specialUsed
        ) {
            return;
        }

        /*
         * Normal attack.
         */

        const target =
            chooseAITarget(
                fighter,
                enemyTeam
            );

        if (!target) {
            return;
        }

        await performAttack(
            fighter,
            target
        );
    }

    /* =====================================================
       ROUND STATUS
       ===================================================== */

    function processRoundStatus() {

        /*
         * Status effects are already processed at the
         * beginning of each fighter's turn.
         *
         * This function only removes invalid protection.
         */

        [
            ...player1Fighters,
            ...player2Fighters
        ].forEach(
            fighter => {

                if (
                    fighter.protectedBy &&
                    !fighter.protectedBy.alive
                ) {

                    fighter.protectedBy =
                        null;
                }

                if (
                    !fighter.alive
                ) {

                    fighter.protecting =
                        false;
                }
            }
        );
    }

    /* =====================================================
       WINNER
       ===================================================== */

    function checkBattleWinner() {

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

            return 3;
        }

        if (
            p2Alive === 0
        ) {

            return 1;
        }

        if (
            p1Alive === 0
        ) {

            return 2;
        }

        return 0;
    }

    function getRemainingHP(
        team
    ) {

        return team.reduce(
            (total, fighter) =>
                total +
                Math.max(
                    0,
                    fighter.hp
                ),
            0
        );
    }

    function finishByHP() {

        const p1HP =
            getRemainingHP(
                player1Fighters
            );

        const p2HP =
            getRemainingHP(
                player2Fighters
            );

        if (
            p1HP > p2HP
        ) {
            return 1;
        }

        if (
            p2HP > p1HP
        ) {
            return 2;
        }

        const p1Alive =
            getAliveFighters(
                player1Fighters
            ).length;

        const p2Alive =
            getAliveFighters(
                player2Fighters
            ).length;

        if (
            p1Alive > p2Alive
        ) {
            return 1;
        }

        if (
            p2Alive > p1Alive
        ) {
            return 2;
        }

        return 3;
    }

    /* =====================================================
       BATTLE UI
       ===================================================== */

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    function createFighterHTML(
        fighter
    ) {

        const hpPercent =
            fighter.maxHp > 0
                ? (
                    fighter.hp /
                    fighter.maxHp
                ) * 100
                : 0;

        const safeName =
            escapeHTML(
                fighter.name
            );

        const safeRole =
            escapeHTML(
                fighter.role
            );

        const defeatedClass =
            fighter.alive
                ? ""
                : "dead";

        return `
            <div
                class="fighter-card ${defeatedClass}"
                data-fighter-name="${safeName}"
            >

                <h3>
                    ${fighter.emoji}
                    ${safeName}
                </h3>

                <p>
                    ${fighter.role}
                </p>

                <div class="hp-bar">

                    <div
                        class="hp-fill"
                        style="width:${Math.max(
                            0,
                            Math.min(
                                100,
                                hpPercent
                            )
                        )}%"
                    ></div>

                </div>

                <p>
                    ❤️
                    ${Math.floor(
                        Math.max(
                            0,
                            fighter.hp
                        )
                    )}
                    /
                    ${Math.floor(
                        fighter.maxHp
                    )}
                </p>

                <div class="battle-effects">

                    ${
                        fighter.shield > 0
                            ? `<span>🛡️ Shield ${Math.floor(fighter.shield)}</span>`
                            : ""
                    }

                    ${
                        fighter.burn > 0
                            ? `<span>🔥 Burn ${fighter.burn}</span>`
                            : ""
                    }

                    ${
                        fighter.bleed > 0
                            ? `<span>🩸 Bleed ${fighter.bleed}</span>`
                            : ""
                    }

                    ${
                        fighter.stun > 0
                            ? `<span>💫 Stun</span>`
                            : ""
                    }

                    ${
                        fighter.freeze > 0
                            ? `<span>❄️ Freeze</span>`
                            : ""
                    }

                    ${
                        fighter.regeneration > 0
                            ? `<span>💚 Regen ${fighter.regeneration}</span>`
                            : ""
                    }

                </div>

            </div>
        `;
    }

    function updateBattleUI() {

        if (player1Battle) {

            player1Battle.innerHTML =
                player1Fighters
                    .map(
                        createFighterHTML
                    )
                    .join("");
        }

        if (player2Battle) {

            player2Battle.innerHTML =
                player2Fighters
                    .map(
                        createFighterHTML
                    )
                    .join("");
        }

        updateRoundUI();
    }

    /* =====================================================
       VISUAL EFFECTS
       ===================================================== */

    function adgFindCard(
        fighter
    ) {

        if (!fighter) {
            return null;
        }

        const cards =
            document.querySelectorAll(
                ".fighter-card"
            );

        for (
            const card
            of cards
        ) {

            const name =
                card.dataset
                    .fighterName;

            if (
                name ===
                String(
                    fighter.name
                )
            ) {

                return card;
            }
        }

        return null;
    }

    function adgShowAnnouncement(
        message
    ) {

        const announcement =
            document.createElement(
                "div"
            );

        announcement.className =
            "adg-announcement";

        announcement.textContent =
            message;

        document.body.appendChild(
            announcement
        );

        setTimeout(
            () => {

                announcement.remove();

            },
            1100
        );
    }

    function adgAttackImpact(
        attacker,
        defender,
        critical = false
    ) {

        const targetCard =
            adgFindCard(
                defender
            );

        if (targetCard) {

            targetCard.classList.add(
                "hit"
            );

            if (critical) {

                targetCard.classList.add(
                    "critical"
                );
            }

            setTimeout(
                () => {

                    targetCard.classList.remove(
                        "hit",
                        "critical"
                    );

                },
                500
            );
        }

        const impact =
            document.createElement(
                "div"
            );

        impact.className =
            "adg-attack-impact";

        impact.textContent =
            critical
                ? "💥"
                : "⚡";

        document.body.appendChild(
            impact
        );

        setTimeout(
            () => {

                impact.remove();

            },
            650
        );
    }

    function adgFlash() {

        const flash =
            document.createElement(
                "div"
            );

        flash.className =
            "adg-arena-flash";

        document.body.appendChild(
            flash
        );

        setTimeout(
            () => {

                flash.remove();

            },
            350
        );
    }

    function adgSpecialBanner(
        fighter,
        abilityName
    ) {

        const banner =
            document.createElement(
                "div"
            );

        banner.className =
            "adg-special-banner";

        banner.innerHTML =
            `🔥 ${escapeHTML(
                fighter.name
            )} — ${escapeHTML(
                abilityName
            )}!`;

        document.body.appendChild(
            banner
        );

        setTimeout(
            () => {

                banner.remove();

            },
            1200
        );
    }

    function adgPlayAttackEffects(
        attacker,
        defender,
        critical = false
    ) {

        adgAttackImpact(
            attacker,
            defender,
            critical
        );

        adgFlash();
    }

    function playSpecialEffect(
        fighter,
        abilityName
    ) {

        const card =
            adgFindCard(
                fighter
            );

        if (card) {

            card.classList.add(
                "special"
            );

            setTimeout(
                () => {

                    card.classList.remove(
                        "special"
                    );

                },
                900
            );
        }

        adgSpecialBanner(
            fighter,
            abilityName
        );

        adgFlash();
    }

    /* =====================================================
       VICTORY
       ===================================================== */

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
            document.createElement(
                "div"
            );

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

    /* =====================================================
       RESULT DATA
       ===================================================== */

    function createResultHTML(
        team
    ) {

        return team.map(
            fighter => {

                return `
                    <div class="result-team-stat">

                        <p>
                            ${
                                fighter.alive
                                    ? "🟢"
                                    : "🔴"
                            }

                            <strong>
                                ${escapeHTML(
                                    fighter.name
                                )}
                            </strong>

                            — ${Math.floor(
                                Math.max(
                                    0,
                                    fighter.hp
                                )
                            )} HP
                        </p>

                        <p>
                            ⚔️ Damage:
                            ${Math.floor(
                                fighter.damageDealt
                            )}
                        </p>

                        <p>
                            💥 Critical:
                            ${fighter.criticalHits}
                        </p>

                        <p>
                            💀 KOs:
                            ${fighter.koCount}
                        </p>

                        <p>
                            ❤️ Healing:
                            ${Math.floor(
                                fighter.healingDone
                            )}
                        </p>

                    </div>
                `;
            }
        ).join("");
    }

    function showBattleResult(
        winner
    ) {

        if (!resultBox) {
            return;
        }

        resultBox.classList.remove(
            "hidden"
        );

        let text =
            "🤝 DRAW";

        if (winner === 1) {

            text =
                "🏆 PLAYER 1 WINS!";

        } else if (
            winner === 2
        ) {

            text =
                "🏆 PLAYER 2 WINS!";
        }

        if (winnerText) {

            winnerText.textContent =
                text;
        }

        const p1HP =
            Math.floor(
                getRemainingHP(
                    player1Fighters
                )
            );

        const p2HP =
            Math.floor(
                getRemainingHP(
                    player2Fighters
                )
            );

        if (resultSummary) {

            resultSummary.textContent =
                `Battle completed in ${battleStats.completedRounds} rounds. Player 1 remaining HP: ${p1HP}. Player 2 remaining HP: ${p2HP}.`;
        }

        if (player1Result) {

            player1Result.innerHTML =
                createResultHTML(
                    player1Fighters
                );
        }

        if (player2Result) {

            player2Result.innerHTML =
                createResultHTML(
                    player2Fighters
                );
        }

        if (battleStatistics) {

            battleStatistics.innerHTML = `
                <div class="battle-statistics">

                    <h3>
                        📊 Battle Statistics
                    </h3>

                    <p>
                        💥 Total Damage:
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
                        ⚔️ Completed Rounds:
                        <strong>
                            ${battleStats.completedRounds}
                        </strong>
                    </p>

                    <p>
                        ❤️ Player 1 HP:
                        <strong>
                            ${p1HP}
                        </strong>
                    </p>

                    <p>
                        ❤️ Player 2 HP:
                        <strong>
                            ${p2HP}
                        </strong>
                    </p>

                </div>
            `;
        }
    }

    /* =====================================================
       CHARACTER DETAILS
       ===================================================== */

    function getDatabaseCharacter(
        name
    ) {

        /*
         * Try common database structures used by ADG.
         * Battle stats remain hidden from players.
         */

        if (
            typeof ONE_PIECE_CHARACTERS !==
            "undefined"
        ) {

            const found =
                ONE_PIECE_CHARACTERS.find(
                    character => {

                        const characterName =
                            typeof character ===
                            "string"
                                ? character
                                : character.name;

                        return String(
                            characterName
                        ) === String(
                            name
                        );
                    }
                );

            if (found) {
                return found;
            }
        }

        if (
            typeof characters !==
            "undefined" &&
            Array.isArray(
                characters
            )
        ) {

            const found =
                characters.find(
                    character => {

                        const characterName =
                            typeof character ===
                            "string"
                                ? character
                                : character.name;

                        return String(
                            characterName
                        ) === String(
                            name
                        );
                    }
                );

            if (found) {
                return found;
            }
        }

        return null;
    }

    function getCharacterStats(
        fighter
    ) {

        const databaseCharacter =
            getDatabaseCharacter(
                fighter.name
            );

        if (
            databaseCharacter &&
            typeof databaseCharacter ===
            "object"
        ) {

            return {

                attack:
                    databaseCharacter.attack ??
                    databaseCharacter.atk ??
                    databaseCharacter.power ??
                    "N/A",

                defense:
                    databaseCharacter.defense ??
                    databaseCharacter.def ??
                    databaseCharacter.defence ??
                    "N/A",

                speed:
                    databaseCharacter.speed ??
                    databaseCharacter.spd ??
                    "N/A",

                hp:
                    databaseCharacter.hp ??
                    databaseCharacter.health ??
                    "N/A",

                description:
                    databaseCharacter.description ??
                    databaseCharacter.bio ??
                    databaseCharacter.desc ??
                    ""

            };
        }

        return {

            attack: "Database",

            defense: "Database",

            speed: "Database",

            hp: "Database",

            description:
                "Original character database information."
        };
    }

    function createDetailsCard(
        fighter
    ) {

        const stats =
            getCharacterStats(
                fighter
            );

        return `
            <div class="detail-card">

                <h4>
                    ${fighter.emoji}
                    ${escapeHTML(
                        fighter.name
                    )}
                </h4>

                <div class="detail-role">
                    Role:
                    ${escapeHTML(
                        fighter.role
                    )}
                </div>

                <div class="detail-stat">
                    <span>⚔️ Attack</span>
                    <strong>
                        ${escapeHTML(
                            stats.attack
                        )}
                    </strong>
                </div>

                <div class="detail-stat">
                    <span>🛡️ Defense</span>
                    <strong>
                        ${escapeHTML(
                            stats.defense
                        )}
                    </strong>
                </div>

                <div class="detail-stat">
                    <span>⚡ Speed</span>
                    <strong>
                        ${escapeHTML(
                            stats.speed
                        )}
                    </strong>
                </div>

                <div class="detail-stat">
                    <span>❤️ HP</span>
                    <strong>
                        ${escapeHTML(
                            stats.hp
                        )}
                    </strong>
                </div>

                ${
                    stats.description
                        ? `
                            <div class="detail-description">
                                ${escapeHTML(
                                    stats.description
                                )}
                            </div>
                        `
                        : ""
                }

            </div>
        `;
    }

    function showCharacterDetails() {

        if (
            player1CharacterDetails
        ) {

            player1CharacterDetails.innerHTML =
                player1Fighters
                    .map(
                        createDetailsCard
                    )
                    .join("");
        }

        if (
            player2CharacterDetails
        ) {

            player2CharacterDetails.innerHTML =
                player2Fighters
                    .map(
                        createDetailsCard
                    )
                    .join("");
        }

        if (
            characterDetailsOverlay
        ) {

            characterDetailsOverlay.classList.add(
                "show"
            );
        }
    }

    function hideCharacterDetails() {

        if (
            characterDetailsOverlay
        ) {

            characterDetailsOverlay.classList.remove(
                "show"
            );
        }
    }

    /* =====================================================
       FINISH BATTLE
       ===================================================== */

    function finishBattle(
        winner
    ) {

        if (
            battleFinished
        ) {
            return;
        }

        battleFinished =
            true;

        battleRunning =
            false;

        updateBattleUI();

        let winnerName =
            "DRAW";

        if (
            winner === 1
        ) {

            winnerName =
                "PLAYER 1";

        } else if (
            winner === 2
        ) {

            winnerName =
                "PLAYER 2";
        }

        logBattle(
            `<strong>🏆 ${winnerName} WINS!</strong>`
        );

        logBattle(
            `⚔️ Battle completed in ${battleStats.completedRounds} rounds.`
        );

        logBattle(
            `💥 Total damage: ${Math.floor(
                battleStats.totalDamage
            )}`
        );

        logBattle(
            `💀 Total KOs: ${battleStats.totalKOs}`
        );

        logBattle(
            `🔥 Specials used: ${battleStats.totalSpecials}`
        );

        if (winner === 3) {

            setBattleStatus(
                "🤝 Battle Draw!"
            );

        } else {

            setBattleStatus(
                `🏆 ${winnerName} Wins!`
            );
        }

        if (startBattleBtn) {

            startBattleBtn.disabled =
                true;
        }

        showBattleResult(
            winner
        );

        if (
            winner === 1 ||
            winner === 2
        ) {

            adgShowVictory(
                winner
            );
        }
    }

    /* =====================================================
       MAXIMUM ROUNDS
       ===================================================== */

    function handleMaximumRounds() {

        battleStats.completedRounds =
            MAX_ROUNDS;

        logBattle(
            `⏱️ <strong>Maximum ${MAX_ROUNDS} rounds reached!</strong>`
        );

        const p1HP =
            Math.floor(
                getRemainingHP(
                    player1Fighters
                )
            );

        const p2HP =
            Math.floor(
                getRemainingHP(
                    player2Fighters
                )
            );

        logBattle(
            `❤️ Player 1 remaining HP: <strong>${p1HP}</strong>`
        );

        logBattle(
            `❤️ Player 2 remaining HP: <strong>${p2HP}</strong>`
        );

        const winner =
            finishByHP();

        if (winner === 1) {

            logBattle(
                "🏆 Player 1 wins by remaining HP!"
            );

        } else if (
            winner === 2
        ) {

            logBattle(
                "🏆 Player 2 wins by remaining HP!"
            );

        } else {

            logBattle(
                "🤝 Battle ends in a draw!"
            );
        }

        finishBattle(
            winner
        );
    }

    /* =====================================================
       RUN ROUND
       ===================================================== */

    async function runRound() {

        if (
            !battleRunning
        ) {
            return;
        }

        if (
            round > MAX_ROUNDS
        ) {

            handleMaximumRounds();

            return;
        }

        updateRoundUI();

        setBattleStatus(
            `⚔️ Round ${round} / ${MAX_ROUNDS}`
        );

        logBattle(
            `<strong>━━━━━━━━ ROUND ${round} ━━━━━━━━</strong>`
        );

        adgShowAnnouncement(
            `⚔️ ROUND ${round}`
        );

        await wait(450);

        if (
            !battleRunning
        ) {
            return;
        }

        processRoundStatus();

        const statusWinner =
            checkBattleWinner();

        if (
            statusWinner !== 0
        ) {

            battleStats.completedRounds =
                round;

            finishBattle(
                statusWinner
            );

            return;
        }

        const turnOrder =
            getTurnOrder();

        for (
            const fighter
            of turnOrder
        ) {

            if (
                !battleRunning
            ) {
                return;
            }

            if (
                !fighter.alive
            ) {
                continue;
            }

            const winnerBefore =
                checkBattleWinner();

            if (
                winnerBefore !== 0
            ) {

                battleStats.completedRounds =
                    round;

                finishBattle(
                    winnerBefore
                );

                return;
            }

            await fighterTurn(
                fighter
            );

            updateBattleUI();

            const winnerAfter =
                checkBattleWinner();

            if (
                winnerAfter !== 0
            ) {

                battleStats.completedRounds =
                    round;

                finishBattle(
                    winnerAfter
                );

                return;
            }

            await wait(250);
        }

        battleStats.completedRounds =
            round;

        updateBattleUI();

        if (
            round >= MAX_ROUNDS
        ) {

            handleMaximumRounds();

            return;
        }

        round++;

        await wait(450);

        if (
            battleRunning
        ) {

            await runRound();
        }
    }

    /* =====================================================
       RESET FIGHTERS
       ===================================================== */

    function resetFighter(
        fighter
    ) {

        fighter.hp =
            fighter.maxHp;

        fighter.alive =
            true;

        fighter.abilityUsed =
            false;

        fighter.specialUsed =
            false;

        fighter.specialCount =
            0;

        fighter.protecting =
            false;

        fighter.protectedBy =
            null;

        fighter.burn =
            0;

        fighter.bleed =
            0;

        fighter.stun =
            0;

        fighter.freeze =
            0;

        fighter.shield =
            0;

        fighter.regeneration =
            0;

        fighter.attackBuff =
            1;

        fighter.defenseBuff =
            1;

        fighter.speedBuff =
            1;

        fighter.damageDealt =
            0;

        fighter.damageTaken =
            0;

        fighter.healingDone =
            0;

        fighter.koCount =
            0;

        fighter.criticalHits =
            0;

        fighter.attacks =
            0;
    }

    function resetBattleState() {

        [
            ...player1Fighters,
            ...player2Fighters
        ].forEach(
            resetFighter
        );

        round =
            1;

        battleRunning =
            false;

        battleFinished =
            false;

        battleStats = {

            totalDamage: 0,

            totalKOs: 0,

            totalSpecials: 0,

            completedRounds: 0
        };

        if (resultBox) {

            resultBox.classList.add(
                "hidden"
            );
        }

        const victory =
            document.querySelector(
                ".adg-victory-overlay"
            );

        if (victory) {
            victory.remove();
        }

        if (battleLog) {

            battleLog.innerHTML = `
                <p>
                    🏴 Player 1 and Player 2 teams loaded.
                </p>

                <p>
                    🎭 Six role system ready.
                </p>

                <p>
                    🔥 Character special system ready.
                </p>

                <p>
                    🎯 AI targeting ready.
                </p>

                <p>
                    ⚡ Maximum ${MAX_ROUNDS} rounds.
                </p>
            `;
        }

        setBattleStatus(
            "⚔️ Teams Ready!"
        );

        updateBattleUI();

        if (startBattleBtn) {

            startBattleBtn.disabled =
                false;
        }
    }

    /* =====================================================
       START BATTLE
       ===================================================== */

    async function startBattle() {

        if (
            battleRunning
        ) {
            return;
        }

        if (
            player1Fighters.length !==
            TEAM_SIZE ||
            player2Fighters.length !==
            TEAM_SIZE
        ) {

            setBattleStatus(
                "❌ Teams are incomplete!"
            );

            logBattle(
                "❌ Both players need exactly 6 characters!"
            );

            return;
        }

        resetBattleState();

        battleRunning =
            true;

        battleFinished =
            false;

        if (startBattleBtn) {

            startBattleBtn.disabled =
                true;
        }

        if (battleLog) {

            battleLog.innerHTML =
                "";
        }

        setBattleStatus(
            "⚔️ BATTLE STARTING..."
        );

        logBattle(
            "⚔️ <strong>BATTLE START!</strong>"
        );

        logBattle(
            "🎭 Role abilities activated."
        );

        logBattle(
            "🔥 Character specials are automatic."
        );

        logBattle(
            `⚡ Maximum battle length: ${MAX_ROUNDS} rounds.`
        );

        updateBattleUI();

        await wait(700);

        if (
            battleRunning
        ) {

            await runRound();
        }
    }

    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    if (startBattleBtn) {

        startBattleBtn.addEventListener(
            "click",
            startBattle
        );
    }

    if (rematchBtn) {

        rematchBtn.addEventListener(
            "click",
            () => {

                resetBattleState();

                if (characterDetailsOverlay) {

                    characterDetailsOverlay.classList.remove(
                        "show"
                    );
                }
            }
        );
    }

    if (characterDetailsBtn) {

        characterDetailsBtn.addEventListener(
            "click",
            showCharacterDetails
        );
    }

    if (closeCharacterDetails) {

        closeCharacterDetails.addEventListener(
            "click",
            hideCharacterDetails
        );
    }

    if (characterDetailsOverlay) {

        characterDetailsOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    characterDetailsOverlay
                ) {

                    hideCharacterDetails();
                }
            }
        );
    }

    /* =====================================================
       INITIALIZE
       ===================================================== */

    updateBattleUI();

    setBattleStatus(
        "⚔️ Teams Ready!"
    );

    if (battleLog) {

        battleLog.innerHTML = `
            <p>
                🏴 Player 1 team loaded.
            </p>

            <p>
                🏴 Player 2 team loaded.
            </p>

            <p>
                🎭 Six role system ready.
            </p>

            <p>
                🔥 Character special system ready.
            </p>

            <p>
                🎯 AI targeting ready.
            </p>

            <p>
                ⚡ Maximum ${MAX_ROUNDS} rounds.
            </p>
        `;
    }

});