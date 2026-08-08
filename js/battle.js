document.addEventListener("DOMContentLoaded", () => {
    "use strict";

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

    let player1Team = [];
    let player2Team = [];
    let player1Roles = {};
    let player2Roles = {};

    try {
        player1Team = JSON.parse(
            localStorage.getItem("player1Team") || "[]"
        );

        player2Team = JSON.parse(
            localStorage.getItem("player2Team") || "[]"
        );

        player1Roles = JSON.parse(
            localStorage.getItem("player1Roles") || "{}"
        );

        player2Roles = JSON.parse(
            localStorage.getItem("player2Roles") || "{}"
        );
    } catch (error) {
        console.error("Unable to load battle data:", error);
    }

    if (!Array.isArray(player1Team)) {
        player1Team = [];
    }

    if (!Array.isArray(player2Team)) {
        player2Team = [];
    }

    if (!player1Roles || typeof player1Roles !== "object") {
        player1Roles = {};
    }

    if (!player2Roles || typeof player2Roles !== "object") {
        player2Roles = {};
    }

    // =========================================================
    // SETTINGS
    // =========================================================

    const MAX_ROUNDS = 50;

    const BASE_HP = 1000;
    const BASE_ATTACK = 100;
    const BASE_DEFENSE = 80;
    const BASE_SPEED = 80;

    const battleStatsDefault = {
        totalDamage: 0,
        totalKOs: 0,
        totalSpecials: 0,
        completedRounds: 0
    };

    let battleStats = {
        ...battleStatsDefault
    };

    let round = 1;
    let battleRunning = false;
    let roundTimer = null;

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
    // FIGHTER CREATION
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

    function createFighter(name, role) {

        const fighter = {

            name: String(name || "Unknown"),

            role: role || "Wildcard",

            emoji: getRoleEmoji(
                role || "Wildcard"
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

            koShown: false,
            lastCritical: false,
            criticalChance: 0.15,

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
            kos: 0
        };

        applyRoleBonus(fighter);

        fighter.maxHp = fighter.hp;

        return fighter;
    }

    player1Fighters = player1Team.map(char =>
        createFighter(
            char,
            player1Roles[char]
        )
    );

    player2Fighters = player2Team.map(char =>
        createFighter(
            char,
            player2Roles[char]
        )
    );

    // =========================================================
    // HTML SAFETY
    // =========================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // =========================================================
    // LOGGING
    // =========================================================

    function logBattle(message) {

        if (!battleLog) {
            return;
        }

        const line = document.createElement("p");

        line.innerHTML = message;

        battleLog.appendChild(line);

        battleLog.scrollTop =
            battleLog.scrollHeight;
    }

    // =========================================================
    // TEAM HELPERS
    // =========================================================

    function getAliveFighters(team) {

        return team.filter(fighter =>
            fighter &&
            fighter.hp > 0 &&
            fighter.alive
        );
    }

    function isTeamDefeated(team) {

        return getAliveFighters(team).length === 0;
    }

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

    function chooseLowestHP(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        return [...alive].sort(
            (a, b) =>
                (a.hp / a.maxHp) -
                (b.hp / b.maxHp)
        )[0];
    }

    function chooseAITarget(team) {

        const alive =
            getAliveFighters(team);

        if (alive.length === 0) {
            return null;
        }

        const lowHp =
            alive.filter(
                fighter =>
                    fighter.hp <
                    fighter.maxHp * 0.35
            );

        if (lowHp.length > 0) {
            return chooseLowestHP(lowHp);
        }

        return chooseTarget(alive);
    }

    // =========================================================
    // UI DISPLAY
    // =========================================================

    function displayTeam(team, container) {

        if (!container) {
            return;
        }

        container.innerHTML = "";

        team.forEach((fighter, index) => {

            const hpPercent =
                fighter.maxHp > 0
                    ? Math.max(
                        0,
                        Math.min(
                            100,
                            (fighter.hp / fighter.maxHp) * 100
                        )
                    )
                    : 0;

            let cardClass =
                "fighter-card";

            if (
                fighter.hp <= 0 ||
                !fighter.alive
            ) {

                cardClass += " dead";

                if (fighter.koShown) {
                    cardClass += " ko";
                }

            } else if (fighter.protecting) {

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

            container.insertAdjacentHTML(
                "beforeend",
                `
                <div
                    class="${cardClass}"
                    id="${container.id}-fighter-${index}"
                >

                    <h3>
                        ${fighter.emoji}
                        ${escapeHtml(fighter.name)}
                    </h3>

                    <p>
                        ${escapeHtml(fighter.role)}
                    </p>

                    <div class="hp-bar">
                        <div
                            class="hp-fill"
                            style="width:${hpPercent}%"
                        ></div>
                    </div>

                    <p>
                        ❤️
                        ${Math.floor(
                            Math.max(0, fighter.hp)
                        )}
                        /
                        ${Math.floor(
                            fighter.maxHp
                        )}
                    </p>

                    <p>
                        ⚔️
                        ${Math.floor(
                            fighter.attack *
                            fighter.attackBuff
                        )}

                        🛡️
                        ${Math.floor(
                            fighter.defense *
                            fighter.defenseBuff
                        )}

                        ⚡
                        ${Math.floor(
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
                        fighter.hp <= 0 ||
                        !fighter.alive
                            ? `<p>💀 DEFEATED</p>`
                            : ""
                    }

                </div>
                `
            );
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

    function captainAbility(
        captain,
        team
    ) {

        if (captain.abilityUsed) {
            return false;
        }

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
            `👑 ${escapeHtml(captain.name)} used Command! ` +
            `⚔️ Team Attack +10%!`
        );

        return true;
    }

    function viceCaptainAbility(
        fighter,
        enemyTeam
    ) {

        if (!fighter.assistReady) {
            return false;
        }

        if (Math.random() > 0.35) {
            return false;
        }

        const target =
            chooseTarget(enemyTeam);

        if (!target) {
            return false;
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

        fighter.assistReady = false;

        logBattle(
            `⚔️ ${escapeHtml(fighter.name)} performed Assist! ` +
            `💥 ${damage} bonus damage!`
        );

        return true;
    }

    function tankAbility(
        tank,
        team
    ) {

        if (tank.abilityUsed) {
            return false;
        }

        const allies =
            getAliveFighters(team)
                .filter(
                    fighter =>
                        fighter !== tank
                );

        if (allies.length === 0) {
            return false;
        }

        const target =
            chooseLowestHP(allies);

        if (!target) {
            return false;
        }

        tank.abilityUsed = true;

        tank.protecting = true;

        target.protectedBy = tank;

        logBattle(
            `🛡️ ${escapeHtml(tank.name)} is protecting ` +
            `${escapeHtml(target.name)}! ` +
            `Damage reduced by 50%!`
        );

        return true;
    }

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

        if (!target) {
            return false;
        }

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
            `❤️ ${escapeHtml(healer.name)} healed ` +
            `${escapeHtml(target.name)} +${heal} HP!`
        );

        return true;
    }

    function supportAbility(
        support,
        team
    ) {

        if (support.abilityUsed) {
            return false;
        }

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
            `⭐ ${escapeHtml(support.name)} used Team Buff! ` +
            `⚔️ Attack +5% ⚡ Speed +10%!`
        );

        return true;
    }

    function wildcardAbility(fighter) {

        if (fighter.abilityUsed) {
            return false;
        }

        fighter.abilityUsed = true;

        const rand =
            Math.floor(
                Math.random() * 3
            );

        if (rand === 0) {

            fighter.attackBuff *= 1.25;

            logBattle(
                `☠️ ${escapeHtml(fighter.name)} activated Berserker! ` +
                `⚔️ Attack +25%!`
            );

        } else if (rand === 1) {

            fighter.defenseBuff *= 1.25;

            logBattle(
                `☠️ ${escapeHtml(fighter.name)} activated Guardian! ` +
                `🛡️ Defense +25%!`
            );

        } else {

            fighter.speedBuff *= 1.25;

            logBattle(
                `☠️ ${escapeHtml(fighter.name)} activated Assassin! ` +
                `⚡ Speed +25%!`
            );
        }

        return true;
    }

    function useRoleAbility(
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

    // =========================================================
    // SPECIAL TRACKING
    // =========================================================

    function markSpecialUsed(fighter) {

        fighter.specialUsed = true;

        fighter.specialCount += 1;

        battleStats.totalSpecials += 1;
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
            !fighter ||
            fighter.specialUsed ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return false;
        }

        const name =
            String(fighter.name)
                .trim()
                .toLowerCase();

        // =====================================================
        // LUFFY
        // =====================================================

        if (
            name === "luffy" &&
            round >= 3
        ) {

            markSpecialUsed(fighter);

            fighter.attackBuff *= 1.50;

            fighter.speedBuff *= 1.20;

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} activated Gear 5! ` +
                `🌀 ⚔️ Attack +50%! ⚡ Speed +20%!`
            );

            adgPlaySpecialEffects(
                fighter,
                "GEAR 5"
            );

            return true;
        }

        // =====================================================
        // ZORO
        // =====================================================

        if (
            name === "zoro" &&
            round >= 2
        ) {

            markSpecialUsed(fighter);

            fighter.attackBuff *= 1.30;

            fighter.criticalChance = 0.30;

            logBattle(
                `⚔️ ${escapeHtml(fighter.name)} activated ` +
                `Three Sword Style! ⚔️ Attack +30%!`
            );

            adgPlaySpecialEffects(
                fighter,
                "THREE SWORD STYLE"
            );

            return true;
        }

        // =====================================================
        // ACE
        // =====================================================

        if (
            (
                name === "portgas d. ace" ||
                name === "ace"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
                    fighter.attack *
                    fighter.attackBuff *
                    1.50
                );

            target.burn =
                Math.max(
                    target.burn,
                    4
                );

            applyDamage(
                target,
                damage,
                fighter,
                "Flame Emperor"
            );

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} used Flame Emperor! ` +
                `💥 ${damage} damage! 🔥 ` +
                `${escapeHtml(target.name)} is Burning!`
            );

            adgPlaySpecialEffects(
                fighter,
                "FLAME EMPEROR"
            );

            return true;
        }

        // =====================================================
        // SHANKS
        // =====================================================

        if (
            name === "shanks" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            target.stun =
                Math.max(
                    target.stun,
                    1
                );

            logBattle(
                `👑 ${escapeHtml(fighter.name)} unleashed ` +
                `Conqueror's Haki! 💫 ` +
                `${escapeHtml(target.name)} is Stunned!`
            );

            adgPlaySpecialEffects(
                fighter,
                "CONQUEROR'S HAKI"
            );

            return true;
        }

        // =====================================================
        // AOKIJI / KUZAN
        // =====================================================

        if (
            (
                name === "aokiji" ||
                name === "kuzan"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );

            logBattle(
                `❄️ ${escapeHtml(fighter.name)} used Ice Age! ` +
                `${escapeHtml(target.name)} is Frozen!`
            );

            adgPlaySpecialEffects(
                fighter,
                "ICE AGE"
            );

            return true;
        }

        // =====================================================
        // ENEL
        // =====================================================

        if (
            name === "enel" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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

            logBattle(
                `⚡ ${escapeHtml(fighter.name)} unleashed Raigo! ` +
                `💥 ${damage} damage + Stun!`
            );

            adgPlaySpecialEffects(
                fighter,
                "RAIGO"
            );

            return true;
        }

        // =====================================================
        // KAIDO
        // =====================================================

        if (
            name === "kaido" &&
            fighter.hp <
            fighter.maxHp * 0.65
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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
            }

            logBattle(
                `🐉 ${escapeHtml(fighter.name)} used Boro Breath! ` +
                `🔥 ${damage} damage!`
            );

            adgPlaySpecialEffects(
                fighter,
                "BORO BREATH"
            );

            return true;
        }

        // =====================================================
        // MIHAWK
        // =====================================================

        if (
            name === "mihawk" &&
            round >= 3
        ) {

            markSpecialUsed(fighter);

            fighter.attackBuff *= 1.40;

            logBattle(
                `🦅 ${escapeHtml(fighter.name)} unleashed ` +
                `Black Blade! ⚔️ Attack +40%!`
            );

            adgPlaySpecialEffects(
                fighter,
                "BLACK BLADE"
            );

            return true;
        }

        // =====================================================
        // MARCO
        // =====================================================

        if (
            name === "marco" &&
            fighter.hp <
            fighter.maxHp * 0.60
        ) {

            markSpecialUsed(fighter);

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

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} activated ` +
                `Phoenix Regeneration! ❤️ +${heal} HP!`
            );

            adgPlaySpecialEffects(
                fighter,
                "PHOENIX REGENERATION"
            );

            return true;
        }

        // =====================================================
        // BROOK
        // =====================================================

        if (
            name === "brook" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );

            logBattle(
                `💀 ${escapeHtml(fighter.name)} used Soul Solid! ` +
                `❄️ ${escapeHtml(target.name)} is Frozen!`
            );

            adgPlaySpecialEffects(
                fighter,
                "SOUL SOLID"
            );

            return true;
        }

        // =====================================================
        // KATAKURI
        // =====================================================

        if (
            name === "katakuri" &&
            round >= 3
        ) {

            markSpecialUsed(fighter);

            fighter.attackBuff *= 1.30;

            fighter.speedBuff *= 1.20;

            logBattle(
                `🍩 ${escapeHtml(fighter.name)} activated ` +
                `Mochi Power! ⚔️ Attack +30%! ` +
                `⚡ Speed +20%!`
            );

            adgPlaySpecialEffects(
                fighter,
                "MOCHI POWER"
            );

            return true;
        }

        // =====================================================
        // LAW
        // =====================================================

        if (
            (
                name === "trafalgar d. water law" ||
                name === "trafalgar law"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            target.stun =
                Math.max(
                    target.stun,
                    1
                );

            logBattle(
                `⚕️ ${escapeHtml(fighter.name)} used ROOM! ` +
                `${escapeHtml(target.name)} is Stunned!`
            );

            adgPlaySpecialEffects(
                fighter,
                "ROOM"
            );

            return true;
        }

        // =====================================================
        // DOFLAMINGO
        // =====================================================

        if (
            (
                name === "doflamingo" ||
                name === "donquixote doflamingo"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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
            }

            logBattle(
                `🦩 ${escapeHtml(fighter.name)} used Bird Cage! ` +
                `🩸 ${damage} damage + Bleed!`
            );

            adgPlaySpecialEffects(
                fighter,
                "BIRD CAGE"
            );

            return true;
        }

        // =====================================================
        // SANJI
        // =====================================================

        if (
            name === "sanji" &&
            round >= 2
        ) {

            markSpecialUsed(fighter);

            fighter.attackBuff *= 1.35;

            fighter.speedBuff *= 1.15;

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} activated ` +
                `Diable Jambe! ⚔️ Attack +35%!`
            );

            adgPlaySpecialEffects(
                fighter,
                "DIABLE JAMBE"
            );

            return true;
        }

        // =====================================================
        // WHITEBEARD
        // =====================================================

        if (
            (
                name === "whitebeard" ||
                name === "edward newgate"
            ) &&
            round >= 3
        ) {

            const targets =
                getAliveFighters(
                    enemyTeam
                );

            if (targets.length === 0) {
                return false;
            }

            markSpecialUsed(fighter);

            targets.forEach(target => {

                const damage =
                    Math.floor(
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

            logBattle(
                `🌊 ${escapeHtml(fighter.name)} unleashed ` +
                `Gura Gura no Mi! 💥 Area damage!`
            );

            adgPlaySpecialEffects(
                fighter,
                "GURA GURA NO MI"
            );

            return true;
        }

        // =====================================================
        // BIG MOM
        // =====================================================

        if (
            (
                name === "big mom" ||
                name === "charlotte linlin"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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

            logBattle(
                `👑 ${escapeHtml(fighter.name)} used Ikoku! ` +
                `💥 ${damage} damage!`
            );

            adgPlaySpecialEffects(
                fighter,
                "IKOKU"
            );

            return true;
        }

        // =====================================================
        // ROB LUCCI
        // =====================================================

        if (
            (
                name === "rob lucci" ||
                name === "lucci"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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

            logBattle(
                `🐆 ${escapeHtml(fighter.name)} used Rokuogan! ` +
                `💥 ${damage} damage!`
            );

            adgPlaySpecialEffects(
                fighter,
                "ROKUOGAN"
            );

            return true;
        }

        // =====================================================
        // AKAINU
        // =====================================================

        if (
            (
                name === "akainu" ||
                name === "sakazuki"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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
            }

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} used Meteor Volcano! ` +
                `🔥 ${damage} damage + Burn!`
            );

            adgPlaySpecialEffects(
                fighter,
                "METEOR VOLCANO"
            );

            return true;
        }

        // =====================================================
        // KIZARU
        // =====================================================

        if (
            name === "kizaru" &&
            round >= 3
        ) {

            const target =
                chooseTarget(enemyTeam);

            if (!target) {
                return false;
            }

            markSpecialUsed(fighter);

            const damage =
                Math.floor(
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

            logBattle(
                `✨ ${escapeHtml(fighter.name)} used ` +
                `Yasakani no Magatama! ` +
                `💥 ${damage} damage!`
            );

            adgPlaySpecialEffects(
                fighter,
                "YASAKANI NO MAGATAMA"
            );

            return true;
        }

        // =====================================================
        // BARTOLOMEO
        // =====================================================

        if (
            (
                name === "bartolomeo" ||
                name === "bartolomew"
            ) &&
            round >= 2
        ) {

            markSpecialUsed(fighter);

            fighter.shield +=
                Math.floor(
                    fighter.maxHp * 0.35
                );

            logBattle(
                `🛡️ ${escapeHtml(fighter.name)} created a Barrier! ` +
                `Shield activated!`
            );

            adgPlaySpecialEffects(
                fighter,
                "BARRIER"
            );

            return true;
        }

        return false;
    }

    // =========================================================
    // DAMAGE CALCULATION
    // =========================================================

    function calculateDamage(
        attacker,
        defender
    ) {

        if (
            !attacker ||
            !defender
        ) {

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

        if (damage < 10) {
            damage = 10;
        }

        const criticalChance =
            typeof attacker.criticalChance === "number"
                ? attacker.criticalChance
                : 0.15;

        const critical =
            Math.random() <
            criticalChance;

        if (critical) {
            damage *= 1.75;
        }

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

            return 0;
        }

        let remainingDamage =
            Math.max(
                0,
                Number(damage) || 0
            );

        // Shield
        if (
            defender.shield > 0 &&
            remainingDamage > 0
        ) {

            const absorbed =
                Math.min(
                    defender.shield,
                    remainingDamage
                );

            defender.shield -=
                absorbed;

            remainingDamage -=
                absorbed;

            logBattle(
                `🛡️ ${escapeHtml(defender.name)}'s shield ` +
                `absorbed ${Math.floor(absorbed)} damage!`
            );

            if (
                remainingDamage <= 0
            ) {

                return 0;
            }
        }

        // Tank protection
        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0 &&
            defender.protectedBy.alive
        ) {

            remainingDamage *= 0.50;

            logBattle(
                `🛡️ ${escapeHtml(defender.name)} is protected! ` +
                `Damage reduced by 50%.`
            );
        }

        remainingDamage =
            Math.max(
                1,
                Math.floor(
                    remainingDamage
                )
            );

        defender.hp -=
            remainingDamage;

        battleStats.totalDamage +=
            remainingDamage;

        if (attacker) {

            attacker.damageDealt =
                (attacker.damageDealt || 0) +
                remainingDamage;
        }

        if (defender.hp <= 0) {

            defender.hp = 0;

            defender.alive = false;

            defender.protecting = false;

            defender.protectedBy = null;

            defender.koShown = true;

            battleStats.totalKOs += 1;

            if (attacker) {

                attacker.kos =
                    (attacker.kos || 0) +
                    1;
            }

            logBattle(
                `💀 ${escapeHtml(defender.name)} has been KO'd!`
            );
        }

        return remainingDamage;
    }

    // =========================================================
    // NORMAL ATTACK
    // =========================================================

    async function attack(
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

        const actualDamage =
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
                `💥 <strong>CRITICAL HIT!</strong> ` +
                `${escapeHtml(attacker.name)} dealt ` +
                `${actualDamage} damage to ` +
                `${escapeHtml(defender.name)}!`
            );

        } else {

            logBattle(
                `⚔️ ${escapeHtml(attacker.name)} attacked ` +
                `${escapeHtml(defender.name)} for ` +
                `${actualDamage} damage!`
            );
        }

        updateBattleUI();

        await sleep(350);

        if (!defender.alive) {

            adgShowAnnouncement(
                `💀 ${defender.name} KO!`
            );

            await sleep(300);
        }
    }

    // =========================================================
    // STATUS EFFECTS
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

        // Burn
        if (fighter.burn > 0) {

            const burnDamage =
                Math.max(
                    1,
                    Math.floor(
                        fighter.maxHp * 0.05
                    )
                );

            fighter.hp -=
                burnDamage;

            battleStats.totalDamage +=
                burnDamage;

            logBattle(
                `🔥 ${escapeHtml(fighter.name)} takes ` +
                `${burnDamage} Burn damage!`
            );

            fighter.burn -= 1;

            if (fighter.hp <= 0) {

                fighter.hp = 0;

                fighter.alive = false;

                fighter.koShown = true;

                battleStats.totalKOs += 1;

                logBattle(
                    `💀 ${escapeHtml(fighter.name)} ` +
                    `was defeated by Burn!`
                );

                return;
            }
        }

        // Bleed
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

            fighter.hp -=
                bleedDamage;

            battleStats.totalDamage +=
                bleedDamage;

            logBattle(
                `🩸 ${escapeHtml(fighter.name)} takes ` +
                `${bleedDamage} Bleed damage!`
            );

            fighter.bleed -= 1;

            if (fighter.hp <= 0) {

                fighter.hp = 0;

                fighter.alive = false;

                fighter.koShown = true;

                battleStats.totalKOs += 1;

                logBattle(
                    `💀 ${escapeHtml(fighter.name)} ` +
                    `was defeated by Bleed!`
                );

                return;
            }
        }

        // Regeneration
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
                `❤️ ${escapeHtml(fighter.name)} regenerates ` +
                `${heal} HP!`
            );

            fighter.regeneration -= 1;
        }

        if (
            fighter.hp <= 0
        ) {

            fighter.hp = 0;

            fighter.alive = false;

            fighter.koShown = true;
        }
    }

    // =========================================================
    // TURN VALIDATION
    // =========================================================

    function canTakeTurn(
        fighter
    ) {

        if (
            !fighter ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {

            return false;
        }

        // Stun
        if (fighter.stun > 0) {

            fighter.stun -= 1;

            logBattle(
                `⚡ ${escapeHtml(fighter.name)} ` +
                `loses this turn due to Stun!`
            );

            return false;
        }

        // Freeze
        if (fighter.freeze > 0) {

            fighter.freeze -= 1;

            logBattle(
                `❄️ ${escapeHtml(fighter.name)} ` +
                `loses this turn due to Freeze!`
            );

            return false;
        }

        return true;
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

                if (speedA !== speedB) {
                    return speedB - speedA;
                }

                return Math.random() - 0.5;
            }
        );
    }

    // =========================================================
    // VISUAL PRESENTATION
    // =========================================================

    function adgFindCard(
        fighter
    ) {

        const cards =
            document.querySelectorAll(
                ".fighter-card"
            );

        for (
            const card of cards
        ) {

            const title =
                card.querySelector("h3");

            if (!title) {
                continue;
            }

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

    function adgShowAnnouncement(
        text
    ) {

        const element =
            document.createElement("div");

        element.className =
            "adg-announcement";

        element.textContent =
            text;

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode) {
                element.remove();
            }

        }, 1100);
    }

    function adgAttackImpact(
        emoji = "💥"
    ) {

        const element =
            document.createElement("div");

        element.className =
            "adg-attack-impact";

        element.textContent =
            emoji;

        document.body.appendChild(
            element
        );

        setTimeout(() => {

            if (element.parentNode) {
                element.remove();
            }

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

            if (element.parentNode) {
                element.remove();
            }

        }, 300);
    }

    function adgSpecialBanner(
        fighter,
        abilityName = "SPECIAL ABILITY"
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

            if (element.parentNode) {
                element.remove();
            }

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

        if (critical) {
            adgFlash();
        }
    }

    function adgPlaySpecialEffects(
        fighter,
        abilityName = "SPECIAL ABILITY"
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
                    🏆 PLAYER ${playerNumber} WINS!
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

        if (overlay) {
            overlay.remove();
        }
    }

    // =========================================================
    // AI DECISION
    // =========================================================

    async function aiDecision(
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

        // Role ability
        const roleUsed =
            useRoleAbility(
                fighter,
                ownTeam,
                enemyTeam
            );

        if (roleUsed) {

            updateBattleUI();

            await sleep(300);
        }

        if (
            isTeamDefeated(
                enemyTeam
            )
        ) {

            return;
        }

        // Character special
        const specialUsedThisTurn =
            useCharacterSpecial(
                fighter,
                ownTeam,
                enemyTeam
            );

        if (specialUsedThisTurn) {

            updateBattleUI();

            await sleep(650);
        }

        if (
            isTeamDefeated(
                enemyTeam
            )
        ) {

            return;
        }

        // Healer gets a second healing check
        if (
            fighter.role === "Healer" &&
            fighter.hp > 0 &&
            fighter.alive
        ) {

            const healed =
                healerAbility(
                    fighter,
                    ownTeam
                );

            if (healed) {

                updateBattleUI();

                await sleep(300);

                return;
            }
        }

        // Normal attack
        const target =
            chooseAITarget(
                enemyTeam
            );

        if (!target) {
            return;
        }

        await attack(
            fighter,
            target
        );
    }

    // =========================================================
    // WINNER
    // =========================================================

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

        if (p1Alive === 0) {
            return 2;
        }

        if (p2Alive === 0) {
            return 1;
        }

        return null;
    }

    function getRemainingHP(
        team
    ) {

        return team.reduce(
            (
                total,
                fighter
            ) =>
                total +
                Math.max(
                    0,
                    fighter.hp
                ),
            0
        );
    }

    function getWinnerByRemainingHP() {

        const p1HP =
            getRemainingHP(
                player1Fighters
            );

        const p2HP =
            getRemainingHP(
                player2Fighters
            );

        if (p1HP > p2HP) {
            return 1;
        }

        if (p2HP > p1HP) {
            return 2;
        }

        return 0;
    }

    // =========================================================
    // RESULT TEAM
    // =========================================================

    function buildTeamResult(
        team
    ) {

        const totalHP =
            getRemainingHP(team);

        const KOs =
            team.filter(
                fighter =>
                    fighter.hp <= 0
            ).length;

        const totalDamage =
            team.reduce(
                (
                    total,
                    fighter
                ) =>
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

    // =========================================================
    // RESULT DISPLAY
    // =========================================================

    function showBattleResult(
        winner
    ) {

        const resultBox =
            document.querySelector(
                ".result-box"
            );

        if (resultBox) {

            resultBox.classList.remove(
                "hidden"
            );
        }

        const winnerText =
            document.getElementById(
                "winnerText"
            );

        if (winnerText) {

            if (winner === 1) {

                winnerText.textContent =
                    "🏆 PLAYER 1 WINS!";

            } else if (winner === 2) {

                winnerText.textContent =
                    "🏆 PLAYER 2 WINS!";

            } else {

                winnerText.textContent =
                    "🤝 DRAW!";
            }
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

        localStorage.setItem(
            "battleStats",
            JSON.stringify(
                battleStats
            )
        );

        localStorage.setItem(
            "battleWinner",
            String(winner)
        );
    }

    // =========================================================
    // ROUND DISPLAY
    // =========================================================

    function updateRoundDisplay() {

        document
            .querySelectorAll(
                ".round-number"
            )
            .forEach(element => {

                element.textContent =
                    String(round);
            });

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

    function finishBattle(
        forcedWinner = null
    ) {

        if (!battleRunning) {
            return;
        }

        battleRunning = false;

        if (roundTimer) {

            clearTimeout(
                roundTimer
            );

            roundTimer = null;
        }

        let winner =
            forcedWinner !== null
                ? forcedWinner
                : getBattleWinner();

        if (
            winner === null &&
            round >= MAX_ROUNDS
        ) {

            winner =
                getWinnerByRemainingHP();

            logBattle(
                `<strong>
                    ⏱️ MAX ROUNDS REACHED!
                </strong>`
            );

            logBattle(
                `❤️ Player 1 remaining HP: ` +
                `<strong>
                    ${Math.floor(
                        getRemainingHP(
                            player1Fighters
                        )
                    )}
                </strong>`
            );

            logBattle(
                `❤️ Player 2 remaining HP: ` +
                `<strong>
                    ${Math.floor(
                        getRemainingHP(
                            player2Fighters
                        )
                    )}
                </strong>`
            );
        }

        battleStats.completedRounds =
            Math.min(
                battleStats.completedRounds ||
                round,
                MAX_ROUNDS
            );

        logBattle(
            `<strong>
                🏁 BATTLE FINISHED!
            </strong>`
        );

        showBattleResult(
            winner || 0
        );

        updateBattleUI();

        if (startBattleBtn) {

            startBattleBtn.disabled =
                false;
        }
    }

    // =========================================================
    // ROUND LOOP
    // =========================================================

    async function startRound() {

        if (!battleRunning) {
            return;
        }

        const currentWinner =
            getBattleWinner();

        if (currentWinner !== null) {

            finishBattle(
                currentWinner
            );

            return;
        }

        if (round > MAX_ROUNDS) {

            finishBattle(
                getWinnerByRemainingHP()
            );

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

        // =====================================================
        // STATUS PHASE
        // =====================================================

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

        updateBattleUI();

        const afterStatusWinner =
            getBattleWinner();

        if (
            afterStatusWinner !== null
        ) {

            finishBattle(
                afterStatusWinner
            );

            return;
        }

        await sleep(450);

        // =====================================================
        // TURN ORDER
        // =====================================================

        const attackOrder =
            getAttackOrder();

        for (
            const fighter
            of attackOrder
        ) {

            if (!battleRunning) {
                return;
            }

            const winnerBefore =
                getBattleWinner();

            if (
                winnerBefore !== null
            ) {

                finishBattle(
                    winnerBefore
                );

                return;
            }

            if (
                !canTakeTurn(
                    fighter
                )
            ) {

                updateBattleUI();

                await sleep(250);

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

            await aiDecision(
                fighter,
                ownTeam,
                enemyTeam
            );

            updateBattleUI();

            const winnerAfter =
                getBattleWinner();

            if (
                winnerAfter !== null
            ) {

                finishBattle(
                    winnerAfter
                );

                return;
            }

            await sleep(350);
        }

        // =====================================================
        // ROUND COMPLETE
        // =====================================================

        battleStats.completedRounds =
            round;

        updateBattleUI();

        const winnerAtEnd =
            getBattleWinner();

        if (
            winnerAtEnd !== null
        ) {

            finishBattle(
                winnerAtEnd
            );

            return;
        }

        // =====================================================
        // 50 ROUND LIMIT
        // =====================================================

        if (round >= MAX_ROUNDS) {

            finishBattle(
                getWinnerByRemainingHP()
            );

            return;
        }

        // =====================================================
        // NEXT ROUND
        // =====================================================

        round += 1;

        updateRoundDisplay();

        roundTimer =
            setTimeout(
                () => {

                    roundTimer = null;

                    startRound();

                },
                850
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

        fighter.alive =
            true;

        fighter.abilityUsed =
            false;

        fighter.specialUsed =
            false;

        fighter.specialCount =
            0;

        fighter.koShown =
            false;

        fighter.lastCritical =
            false;

        fighter.criticalChance =
            0.15;

        fighter.assistReady =
            true;

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

        fighter.kos =
            0;
    }

    // =========================================================
    // START BATTLE
    // =========================================================

    async function startBattle() {

        if (battleRunning) {
            return;
        }

        if (
            player1Fighters.length === 0 ||
            player2Fighters.length === 0
        ) {

            if (battleStatus) {

                battleStatus.textContent =
                    "⚠️ Both players need fighters.";
            }

            logBattle(
                "❌ Both players need at least one fighter!"
            );

            return;
        }

        if (roundTimer) {

            clearTimeout(
                roundTimer
            );

            roundTimer = null;
        }

        round = 1;

        battleRunning = true;

        battleStats = {
            ...battleStatsDefault
        };

        // Hide old result
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

        // Reset fighters
        [
            ...player1Fighters,
            ...player2Fighters
        ].forEach(
            resetFighter
        );

        if (battleLog) {

            battleLog.innerHTML =
                "";
        }

        if (startBattleBtn) {

            startBattleBtn.disabled =
                true;
        }

        updateBattleUI();

        updateRoundDisplay();

        if (battleStatus) {

            battleStatus.textContent =
                "⚔️ BATTLE STARTED!";
        }

        logBattle(
    `<strong>
        🔥 BATTLE START!
    </strong>`
);

        logBattle(
            `🏴 Player 1:
             ${player1Fighters.length} fighters`
        );

        logBattle(
            `🏴 Player 2:
             ${player2Fighters.length} fighters`
        );

        logBattle(
            `⚡ Maximum battle length:
             ${MAX_ROUNDS} rounds.`
        );

        adgShowAnnouncement(
            "⚔️ BATTLE START!"
        );

        await sleep(800);

        if (battleRunning) {

            startRound();
        }
    }

    // =========================================================
    // INITIALIZATION
    // =========================================================

    updateBattleUI();

    updateRoundDisplay();

    if (battleStatus) {

        battleStatus.textContent =
            (
                player1Fighters.length === 0 ||
                player2Fighters.length === 0
            )
                ? "⚠️ Both players need fighters."
                : "⚔️ READY FOR BATTLE";
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
                ⚡ Maximum ${MAX_ROUNDS} battle rounds.
            </p>
        `;
    }

    if (startBattleBtn) {

        startBattleBtn.addEventListener(
            "click",
            startBattle
        );
    }
});