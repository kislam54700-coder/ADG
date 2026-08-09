document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =========================================================
    // ADG BATTLE v7.4
    // Anime Draft Game
    // =========================================================
    //
    // Features:
    // - Faster battle speed
    // - Hidden database stats during battle
    // - Database.js compatibility
    // - Role abilities
    // - Character special abilities
    // - Status effects
    // - AI battle
    // - Battle history
    // - 50 round maximum
    // - Rematch button
    // - Post-battle Character Details
    //
    // IMPORTANT:
    // Character database stats are NOT displayed during battle.
    // They are revealed only after battle through Character Details.
    // =========================================================


    // =========================================================
    // ELEMENTS
    // =========================================================

    const player1Battle =
        document.getElementById("player1Battle");

    const player2Battle =
        document.getElementById("player2Battle");

    const battleLog =
        document.getElementById("battleLog");

    const battleStatus =
        document.getElementById("battleStatus");

    const startBattleBtn =
        document.getElementById("startBattleBtn");


    // =========================================================
    // BATTLE SETTINGS
    // =========================================================

    const MAX_ROUNDS = 50;

    // Faster battle speed
    const SPEED = {
        announcement: 350,
        action: 180,
        attack: 220,
        ability: 250,
        special: 350,
        round: 300,
        nextRound: 400,
        start: 500,
        ko: 180
    };


    // =========================================================
    // DEFAULT COMBAT STATS
    // =========================================================

    const BASE_HP = 1000;
    const BASE_ATTACK = 100;
    const BASE_DEFENSE = 80;
    const BASE_SPEED = 80;


    // =========================================================
    // LOAD TEAMS
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

        console.error(
            "ADG: Unable to load battle data:",
            error
        );
    }


    if (!Array.isArray(player1Team)) {
        player1Team = [];
    }

    if (!Array.isArray(player2Team)) {
        player2Team = [];
    }

    if (
        !player1Roles ||
        typeof player1Roles !== "object"
    ) {
        player1Roles = {};
    }

    if (
        !player2Roles ||
        typeof player2Roles !== "object"
    ) {
        player2Roles = {};
    }


    // =========================================================
    // BATTLE STATE
    // =========================================================

    let player1Fighters = [];
    let player2Fighters = [];

    let round = 1;

    let battleRunning = false;

    let roundTimer = null;

    let resultShown = false;


    const battleStatsDefault = {

        totalDamage: 0,

        totalKOs: 0,

        totalSpecials: 0,

        completedRounds: 0
    };


    let battleStats = {
        ...battleStatsDefault
    };


    // =========================================================
    // UTILITY
    // =========================================================

    const sleep = ms =>
        new Promise(resolve =>
            setTimeout(resolve, ms)
        );


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizeName(name) {

        return String(name || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }


    // =========================================================
    // DATABASE CONNECTION
    // =========================================================
    //
    // database.js may expose:
    //
    // ONE_PIECE_CHARACTERS
    //
    // or:
    //
    // characters
    //
    // or:
    //
    // CHARACTER_DATABASE
    //
    // This function supports all three.
    // =========================================================

    function getDatabaseCharacters() {

        if (
            typeof ONE_PIECE_CHARACTERS !== "undefined" &&
            Array.isArray(ONE_PIECE_CHARACTERS)
        ) {

            return ONE_PIECE_CHARACTERS;
        }

        if (
            typeof characters !== "undefined" &&
            Array.isArray(characters)
        ) {

            return characters;
        }

        if (
            typeof CHARACTER_DATABASE !== "undefined" &&
            Array.isArray(CHARACTER_DATABASE)
        ) {

            return CHARACTER_DATABASE;
        }

        return [];
    }


    function findDatabaseCharacter(name) {

        const database =
            getDatabaseCharacters();

        const wanted =
            normalizeName(name);

        return database.find(character => {

            if (
                typeof character === "string"
            ) {

                return normalizeName(character) === wanted;
            }

            if (
                character &&
                typeof character === "object"
            ) {

                return normalizeName(
                    character.name ||
                    character.character ||
                    character.id
                ) === wanted;
            }

            return false;
        }) || null;
    }


    // =========================================================
    // DATABASE STAT EXTRACTION
    // =========================================================

    function getDatabaseStats(name) {

        const databaseCharacter =
            findDatabaseCharacter(name);

        if (
            !databaseCharacter ||
            typeof databaseCharacter !== "object"
        ) {

            return null;
        }

        /*
         * Supports different database formats.
         */

        const stats =
            databaseCharacter.stats ||
            databaseCharacter.baseStats ||
            databaseCharacter.hiddenStats ||
            databaseCharacter;


        return {

            hp:
                Number(
                    stats.hp ??
                    stats.HP ??
                    stats.health ??
                    BASE_HP
                ),

            attack:
                Number(
                    stats.attack ??
                    stats.ATK ??
                    stats.power ??
                    BASE_ATTACK
                ),

            defense:
                Number(
                    stats.defense ??
                    stats.DEF ??
                    stats.armor ??
                    BASE_DEFENSE
                ),

            speed:
                Number(
                    stats.speed ??
                    stats.SPD ??
                    stats.agility ??
                    BASE_SPEED
                ),

            power:
                stats.power,

            intelligence:
                stats.intelligence ??
                stats.int,

            stamina:
                stats.stamina,

            haki:
                stats.haki,

            durability:
                stats.durability,

            ability:
                databaseCharacter.ability ||
                databaseCharacter.special ||
                databaseCharacter.specialAbility ||
                null,

            description:
                databaseCharacter.description ||
                null
        };
    }


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

            "Wildcard": "☠️",

            "Traitor": "☠️"
        };

        return emojis[role] || "🔥";
    }


    // =========================================================
    // ROLE BONUS
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
            case "Traitor":

                fighter.attack *= 1.25;

                break;
        }
    }


    // =========================================================
    // CREATE FIGHTER
    // =========================================================

    function createFighter(
        name,
        role
    ) {

        const databaseStats =
            getDatabaseStats(name);


        /*
         * Database stats are the hidden source.
         *
         * If database stats exist,
         * they are used internally.
         *
         * Players cannot see them during battle.
         */

        const fighter = {

            name:
                String(name || "Unknown"),

            role:
                role || "Wildcard",

            emoji:
                getRoleEmoji(
                    role || "Wildcard"
                ),


            // -------------------------------------------------
            // INTERNAL BASE STATS
            // -------------------------------------------------

            baseDatabaseStats:
                databaseStats,


            hp:
                databaseStats?.hp ||
                BASE_HP,

            maxHp:
                databaseStats?.hp ||
                BASE_HP,

            attack:
                databaseStats?.attack ||
                BASE_ATTACK,

            defense:
                databaseStats?.defense ||
                BASE_DEFENSE,

            speed:
                databaseStats?.speed ||
                BASE_SPEED,


            // -------------------------------------------------
            // STATUS
            // -------------------------------------------------

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


            // -------------------------------------------------
            // BUFFS
            // -------------------------------------------------

            attackBuff: 1,

            defenseBuff: 1,

            speedBuff: 1,


            // -------------------------------------------------
            // PERFORMANCE
            // -------------------------------------------------

            damageDealt: 0,

            kos: 0
        };


        applyRoleBonus(
            fighter
        );


        fighter.maxHp =
            fighter.hp;


        return fighter;
    }


    // =========================================================
    // BUILD TEAMS
    // =========================================================

    function buildFighterTeams() {

        player1Fighters =
            player1Team.map(
                character =>
                    createFighter(
                        character,
                        player1Roles[character]
                    )
            );


        player2Fighters =
            player2Team.map(
                character =>
                    createFighter(
                        character,
                        player2Roles[character]
                    )
            );
    }


    buildFighterTeams();


    // =========================================================
    // LOGGING
    // =========================================================

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


    // =========================================================
    // TEAM HELPERS
    // =========================================================

    function getAliveFighters(team) {

        return team.filter(
            fighter =>
                fighter &&
                fighter.hp > 0 &&
                fighter.alive
        );
    }


    function isTeamDefeated(team) {

        return (
            getAliveFighters(team).length === 0
        );
    }


    function chooseTarget(team) {

        const alive =
            getAliveFighters(team);

        if (!alive.length) {
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

        if (!alive.length) {
            return null;
        }

        return [...alive].sort(
            (a, b) =>
                a.hp / a.maxHp -
                b.hp / b.maxHp
        )[0];
    }


    function chooseAITarget(team) {

        const alive =
            getAliveFighters(team);

        if (!alive.length) {
            return null;
        }


        const lowHP =
            alive.filter(
                fighter =>
                    fighter.hp <
                    fighter.maxHp * 0.35
            );


        if (lowHP.length) {

            return chooseLowestHP(
                lowHP
            );
        }


        /*
         * Slightly smarter target selection:
         *
         * Prefer the fighter with the
         * lowest HP percentage.
         */

        if (Math.random() < 0.65) {

            return chooseLowestHP(
                alive
            );
        }


        return chooseTarget(
            alive
        );
    }


    // =========================================================
    // DISPLAY TEAM
    // =========================================================

    function displayTeam(
        team,
        container
    ) {

        if (!container) {
            return;
        }

        container.innerHTML = "";


        team.forEach(
            (fighter, index) => {

                const hpPercent =
                    fighter.maxHp > 0
                        ? Math.max(
                            0,
                            Math.min(
                                100,
                                fighter.hp /
                                fighter.maxHp *
                                100
                            )
                        )
                        : 0;


                let cardClass =
                    "fighter-card";


                if (
                    fighter.hp <= 0 ||
                    !fighter.alive
                ) {

                    cardClass +=
                        " dead";

                    if (
                        fighter.koShown
                    ) {

                        cardClass +=
                            " ko";
                    }

                } else if (
                    fighter.protecting
                ) {

                    cardClass +=
                        " active";
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


                if (
                    fighter.regeneration > 0
                ) {

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
                            ${escapeHtml(
                                fighter.name
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                fighter.role
                            )}
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

                        <!--
                            IMPORTANT:
                            Only CURRENT combat values are displayed.
                            Hidden database details are NOT shown here.
                        -->

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
                            fighter.hp <= 0 ||
                            !fighter.alive
                                ? `
                                    <p>
                                        💀 DEFEATED
                                    </p>
                                  `
                                : ""
                        }

                    </div>
                    `
                );
            }
        );
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


        team.forEach(
            fighter => {

                if (
                    fighter.hp > 0 &&
                    fighter.alive
                ) {

                    fighter.attackBuff *=
                        1.10;
                }
            }
        );


        logBattle(
            `👑 ${escapeHtml(
                captain.name
            )} used Command! ⚔️ Team Attack +10%!`
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


        if (
            Math.random() > 0.40
        ) {

            return false;
        }


        const target =
            chooseTarget(
                enemyTeam
            );


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


        fighter.assistReady =
            false;


        logBattle(
            `⚔️ ${escapeHtml(
                fighter.name
            )} performed Assist! 💥 ${damage} bonus damage!`
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
            getAliveFighters(
                team
            ).filter(
                fighter =>
                    fighter !== tank
            );


        if (!allies.length) {
            return false;
        }


        const target =
            chooseLowestHP(
                allies
            );


        if (!target) {
            return false;
        }


        tank.abilityUsed =
            true;

        tank.protecting =
            true;

        target.protectedBy =
            tank;


        logBattle(
            `🛡️ ${escapeHtml(
                tank.name
            )} is protecting ${escapeHtml(
                target.name
            )}!`
        );


        return true;
    }


    function healerAbility(
        healer,
        team
    ) {

        const allies =
            getAliveFighters(
                team
            ).filter(
                fighter =>
                    fighter !== healer &&
                    fighter.hp <
                    fighter.maxHp * 0.70
            );


        if (!allies.length) {
            return false;
        }


        const target =
            chooseLowestHP(
                allies
            );


        if (!target) {
            return false;
        }


        const heal =
            Math.floor(
                target.maxHp *
                0.20
            );


        target.hp =
            Math.min(
                target.maxHp,
                target.hp + heal
            );


        logBattle(
            `❤️ ${escapeHtml(
                healer.name
            )} healed ${escapeHtml(
                target.name
            )} +${heal} HP!`
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


        support.abilityUsed =
            true;


        team.forEach(
            fighter => {

                if (
                    fighter.hp > 0 &&
                    fighter.alive
                ) {

                    fighter.attackBuff *=
                        1.05;

                    fighter.speedBuff *=
                        1.10;
                }
            }
        );


        logBattle(
            `⭐ ${escapeHtml(
                support.name
            )} used Team Buff! ⚔️ +5% Attack ⚡ +10% Speed!`
        );


        return true;
    }


    function wildcardAbility(
        fighter
    ) {

        if (fighter.abilityUsed) {
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
                `☠️ ${escapeHtml(
                    fighter.name
                )} activated Berserker! ⚔️ +25% Attack!`
            );


        } else if (random === 1) {

            fighter.defenseBuff *=
                1.25;


            logBattle(
                `☠️ ${escapeHtml(
                    fighter.name
                )} activated Guardian! 🛡️ +25% Defense!`
            );


        } else {

            fighter.speedBuff *=
                1.25;


            logBattle(
                `☠️ ${escapeHtml(
                    fighter.name
                )} activated Assassin! ⚡ +25% Speed!`
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
            case "Traitor":

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

    function markSpecialUsed(
        fighter
    ) {

        fighter.specialUsed =
            true;

        fighter.specialCount +=
            1;

        battleStats.totalSpecials +=
            1;
    }


    // =========================================================
    // CHARACTER SPECIALS
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
            normalizeName(
                fighter.name
            );


        // -----------------------------------------------------
        // LUFFY
        // -----------------------------------------------------

        if (
            (
                name === "luffy" ||
                name === "monkey d. luffy"
            ) &&
            round >= 3
        ) {

            markSpecialUsed(
                fighter
            );

            fighter.attackBuff *=
                1.50;

            fighter.speedBuff *=
                1.20;


            logBattle(
                `🔥 ${escapeHtml(
                    fighter.name
                )} activated Gear 5! ⚔️ +50% Attack ⚡ +20% Speed!`
            );


            adgPlaySpecialEffects(
                fighter,
                "GEAR 5"
            );


            return true;
        }


        // -----------------------------------------------------
        // ZORO
        // -----------------------------------------------------

        if (
            (
                name === "zoro" ||
                name === "roronoa zoro"
            ) &&
            round >= 2
        ) {

            markSpecialUsed(
                fighter
            );

            fighter.attackBuff *=
                1.30;

            fighter.criticalChance =
                0.30;


            logBattle(
                `⚔️ ${escapeHtml(
                    fighter.name
                )} activated Three Sword Style! ⚔️ +30% Attack!`
            );


            adgPlaySpecialEffects(
                fighter,
                "THREE SWORD STYLE"
            );


            return true;
        }


        // -----------------------------------------------------
        // ACE
        // -----------------------------------------------------

        if (
            (
                name === "ace" ||
                name === "portgas d. ace"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `🔥 ${escapeHtml(
                    fighter.name
                )} used Flame Emperor! 💥 ${damage} damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "FLAME EMPEROR"
            );


            return true;
        }


        // -----------------------------------------------------
        // SHANKS
        // -----------------------------------------------------

        if (
            name === "shanks" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


            target.stun =
                Math.max(
                    target.stun,
                    1
                );


            logBattle(
                `👑 ${escapeHtml(
                    fighter.name
                )} unleashed Conqueror's Haki! 💫 Stun!`
            );


            adgPlaySpecialEffects(
                fighter,
                "CONQUEROR'S HAKI"
            );


            return true;
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
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );


            logBattle(
                `❄️ ${escapeHtml(
                    fighter.name
                )} used Ice Age! ❄️ Frozen!`
            );


            adgPlaySpecialEffects(
                fighter,
                "ICE AGE"
            );


            return true;
        }


        // -----------------------------------------------------
        // ENEL
        // -----------------------------------------------------

        if (
            name === "enel" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `⚡ ${escapeHtml(
                    fighter.name
                )} unleashed Raigo! 💥 ${damage} damage + Stun!`
            );


            adgPlaySpecialEffects(
                fighter,
                "RAIGO"
            );


            return true;
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
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `🐉 ${escapeHtml(
                    fighter.name
                )} used Boro Breath! 💥 ${damage} damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "BORO BREATH"
            );


            return true;
        }


        // -----------------------------------------------------
        // MIHAWK
        // -----------------------------------------------------

        if (
            name === "mihawk" &&
            round >= 3
        ) {

            markSpecialUsed(
                fighter
            );


            fighter.attackBuff *=
                1.40;


            logBattle(
                `🦅 ${escapeHtml(
                    fighter.name
                )} unleashed Black Blade! ⚔️ +40% Attack!`
            );


            adgPlaySpecialEffects(
                fighter,
                "BLACK BLADE"
            );


            return true;
        }


        // -----------------------------------------------------
        // MARCO
        // -----------------------------------------------------

        if (
            name === "marco" &&
            fighter.hp <
            fighter.maxHp * 0.60
        ) {

            markSpecialUsed(
                fighter
            );


            fighter.regeneration =
                Math.max(
                    fighter.regeneration,
                    4
                );


            const heal =
                Math.floor(
                    fighter.maxHp *
                    0.25
                );


            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );


            logBattle(
                `🔥 ${escapeHtml(
                    fighter.name
                )} activated Phoenix Regeneration! ❤️ +${heal} HP!`
            );


            adgPlaySpecialEffects(
                fighter,
                "PHOENIX REGENERATION"
            );


            return true;
        }


        // -----------------------------------------------------
        // BROOK
        // -----------------------------------------------------

        if (
            name === "brook" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );


            logBattle(
                `💀 ${escapeHtml(
                    fighter.name
                )} used Soul Solid! ❄️ Frozen!`
            );


            adgPlaySpecialEffects(
                fighter,
                "SOUL SOLID"
            );


            return true;
        }


        // -----------------------------------------------------
        // KATAKURI
        // -----------------------------------------------------

        if (
            name === "katakuri" &&
            round >= 3
        ) {

            markSpecialUsed(
                fighter
            );


            fighter.attackBuff *=
                1.30;

            fighter.speedBuff *=
                1.20;


            logBattle(
                `🍩 ${escapeHtml(
                    fighter.name
                )} activated Mochi Power! ⚔️ +30% Attack ⚡ +20% Speed!`
            );


            adgPlaySpecialEffects(
                fighter,
                "MOCHI POWER"
            );


            return true;
        }


        // -----------------------------------------------------
        // LAW
        // -----------------------------------------------------

        if (
            (
                name === "trafalgar law" ||
                name === "trafalgar d. water law"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


            target.stun =
                Math.max(
                    target.stun,
                    1
                );


            logBattle(
                `⚕️ ${escapeHtml(
                    fighter.name
                )} used ROOM! ⚡ Stun!`
            );


            adgPlaySpecialEffects(
                fighter,
                "ROOM"
            );


            return true;
        }


        // -----------------------------------------------------
        // DOFLAMINGO
        // -----------------------------------------------------

        if (
            (
                name === "doflamingo" ||
                name === "donquixote doflamingo"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `🦩 ${escapeHtml(
                    fighter.name
                )} used Bird Cage! 🩸 ${damage} damage + Bleed!`
            );


            adgPlaySpecialEffects(
                fighter,
                "BIRD CAGE"
            );


            return true;
        }


        // -----------------------------------------------------
        // SANJI
        // -----------------------------------------------------

        if (
            name === "sanji" &&
            round >= 2
        ) {

            markSpecialUsed(
                fighter
            );


            fighter.attackBuff *=
                1.35;

            fighter.speedBuff *=
                1.15;


            logBattle(
                `🔥 ${escapeHtml(
                    fighter.name
                )} activated Diable Jambe! ⚔️ +35% Attack!`
            );


            adgPlaySpecialEffects(
                fighter,
                "DIABLE JAMBE"
            );


            return true;
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
                getAliveFighters(
                    enemyTeam
                );


            if (!targets.length) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


            targets.forEach(
                target => {

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
                }
            );


            logBattle(
                `🌊 ${escapeHtml(
                    fighter.name
                )} unleashed Gura Gura no Mi! 💥 Area Damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "GURA GURA NO MI"
            );


            return true;
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
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `👑 ${escapeHtml(
                    fighter.name
                )} used Ikoku! 💥 ${damage} damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "IKOKU"
            );


            return true;
        }


        // -----------------------------------------------------
        // ROB LUCCI
        // -----------------------------------------------------

        if (
            (
                name === "rob lucci" ||
                name === "lucci"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `🐆 ${escapeHtml(
                    fighter.name
                )} used Rokuogan! 💥 ${damage} damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "ROKUOGAN"
            );


            return true;
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
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `🔥 ${escapeHtml(
                    fighter.name
                )} used Meteor Volcano! 💥 ${damage} damage + Burn!`
            );


            adgPlaySpecialEffects(
                fighter,
                "METEOR VOLCANO"
            );


            return true;
        }


        // -----------------------------------------------------
        // KIZARU
        // -----------------------------------------------------

        if (
            (
                name === "kizaru" ||
                name === "borsalino"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return false;
            }


            markSpecialUsed(
                fighter
            );


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
                `✨ ${escapeHtml(
                    fighter.name
                )} used Yasakani no Magatama! 💥 ${damage} damage!`
            );


            adgPlaySpecialEffects(
                fighter,
                "YASAKANI NO MAGATAMA"
            );


            return true;
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

            markSpecialUsed(
                fighter
            );


            fighter.shield +=
                Math.floor(
                    fighter.maxHp *
                    0.35
                );


            logBattle(
                `🛡️ ${escapeHtml(
                    fighter.name
                )} created a Barrier!`
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
            defense * 0.50;


        if (damage < 10) {
            damage = 10;
        }


        const criticalChance =
            typeof attacker.criticalChance ===
            "number"
                ? attacker.criticalChance
                : 0.15;


        const critical =
            Math.random() <
            criticalChance;


        if (critical) {

            damage *=
                1.75;
        }


        return {

            damage:
                Math.floor(damage),

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


            if (
                remainingDamage <= 0
            ) {

                logBattle(
                    `🛡️ ${escapeHtml(
                        defender.name
                    )}'s shield blocked the attack!`
                );

                return 0;
            }
        }


        // Tank protection

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0 &&
            defender.protectedBy.alive
        ) {

            remainingDamage *=
                0.50;
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
                (
                    attacker.damageDealt ||
                    0
                ) +
                remainingDamage;
        }


        if (
            defender.hp <= 0
        ) {

            defender.hp = 0;

            defender.alive = false;

            defender.protecting = false;

            defender.protectedBy = null;

            defender.koShown = true;


            battleStats.totalKOs +=
                1;


            if (attacker) {

                attacker.kos =
                    (
                        attacker.kos ||
                        0
                    ) +
                    1;
            }


            logBattle(
                `💀 ${escapeHtml(
                    defender.name
                )} has been KO'd!`
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


        if (
            result.critical
        ) {

            logBattle(
                `💥 <strong>CRITICAL!</strong> ` +
                `${escapeHtml(
                    attacker.name
                )} dealt ${actualDamage} damage!`

            );

        } else {

            logBattle(
                `⚔️ ${escapeHtml(
                    attacker.name
                )} → ${escapeHtml(
                    defender.name
                )} 💥 ${actualDamage}`
            );
        }


        updateBattleUI();


        await sleep(
            SPEED.attack
        );
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

        if (
            fighter.burn > 0
        ) {

            const damage =
                Math.max(
                    1,
                    Math.floor(
                        fighter.maxHp *
                        0.05
                    )
                );


            fighter.hp -=
                damage;


            battleStats.totalDamage +=
                damage;


            fighter.burn -=
                1;


            logBattle(
                `🔥 ${escapeHtml(
                    fighter.name
                )} takes ${damage} Burn damage!`
            );


            if (
                fighter.hp <= 0
            ) {

                defeatByStatus(
                    fighter,
                    "Burn"
                );

                return;
            }
        }


        // Bleed

        if (
            fighter.bleed > 0 &&
            fighter.hp > 0 &&
            fighter.alive
        ) {

            const damage =
                Math.max(
                    1,
                    Math.floor(
                        fighter.maxHp *
                        0.04
                    )
                );


            fighter.hp -=
                damage;


            battleStats.totalDamage +=
                damage;


            fighter.bleed -=
                1;


            logBattle(
                `🩸 ${escapeHtml(
                    fighter.name
                )} takes ${damage} Bleed damage!`
            );


            if (
                fighter.hp <= 0
            ) {

                defeatByStatus(
                    fighter,
                    "Bleed"
                );

                return;
            }
        }


        // Regeneration

        if (
            fighter.regeneration > 0 &&
            fighter.hp > 0 &&
            fighter.alive
        ) {

            const heal =
                Math.floor(
                    fighter.maxHp *
                    0.08
                );


            fighter.hp =
                Math.min(
                    fighter.maxHp,
                    fighter.hp + heal
                );


            fighter.regeneration -=
                1;


            logBattle(
                `❤️ ${escapeHtml(
                    fighter.name
                )} regenerates ${heal} HP!`
            );
        }
    }


    function defeatByStatus(
        fighter,
        source
    ) {

        fighter.hp = 0;

        fighter.alive = false;

        fighter.koShown = true;

        fighter.protecting = false;

        fighter.protectedBy = null;


        battleStats.totalKOs +=
            1;


        logBattle(
            `💀 ${escapeHtml(
                fighter.name
            )} was defeated by ${source}!`
        );
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


        if (
            fighter.stun > 0
        ) {

            fighter.stun -=
                1;


            logBattle(
                `⚡ ${escapeHtml(
                    fighter.name
                )} is Stunned!`
            );


            return false;
        }


        if (
            fighter.freeze > 0
        ) {

            fighter.freeze -=
                1;


            logBattle(
                `❄️ ${escapeHtml(
                    fighter.name
                )} is Frozen!`
            );


            return false;
        }


        return true;
    }


    // =========================================================
    // ATTACK ORDER
    // =========================================================

    function getAttackOrder() {

        const all =
            [
                ...getAliveFighters(
                    player1Fighters
                ),

                ...getAliveFighters(
                    player2Fighters
                )
            ];


        return all.sort(
            (a, b) => {

                const speedA =
                    a.speed *
                    a.speedBuff;


                const speedB =
                    b.speed *
                    b.speedBuff;


                if (
                    speedA !== speedB
                ) {

                    return (
                        speedB -
                        speedA
                    );
                }


                return (
                    Math.random() -
                    0.5
                );
            }
        );
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

            await sleep(
                SPEED.ability
            );
        }


        if (
            isTeamDefeated(
                enemyTeam
            )
        ) {

            return;
        }


        // Character special

        const specialUsed =
            useCharacterSpecial(
                fighter,
                ownTeam,
                enemyTeam
            );


        if (specialUsed) {

            updateBattleUI();

            await sleep(
                SPEED.special
            );
        }


        if (
            isTeamDefeated(
                enemyTeam
            )
        ) {

            return;
        }


        // Healer emergency heal

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

                await sleep(
                    SPEED.ability
                );

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


        if (
            p1Alive === 0
        ) {

            return 2;
        }


        if (
            p2Alive === 0
        ) {

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


        return 0;
    }


    // =========================================================
    // VISUAL EFFECTS
    // =========================================================

    function adgFindCard(
        fighter
    ) {

        const cards =
            document.querySelectorAll(
                ".fighter-card"
            );


        const wanted =
            normalizeName(
                fighter.name
            );


        for (
            const card
            of cards
        ) {

            const title =
                card.querySelector(
                    "h3"
                );


            if (!title) {
                continue;
            }


            if (
                normalizeName(
                    title.textContent
                ).includes(
                    wanted
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
            document.createElement(
                "div"
            );


        element.className =
            "adg-announcement";


        element.textContent =
            text;


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                element.remove();

            },
            SPEED.announcement
        );
    }


    function adgAttackImpact(
        emoji = "💥"
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "adg-attack-impact";


        element.textContent =
            emoji;


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                element.remove();

            },
            400
        );
    }


    function adgFlash() {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "adg-arena-flash";


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                element.remove();

            },
            200
        );
    }


    function adgSpecialBanner(
        fighter,
        abilityName
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "adg-special-banner";


        element.textContent =
            `🔥 ${fighter.name} — ${abilityName}!`;


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                element.remove();

            },
            800
        );
    }


    function adgPlayAttackEffects(
        attacker,
        defender,
        critical
    ) {

        const attackerCard =
            adgFindCard(
                attacker
            );


        const defenderCard =
            adgFindCard(
                defender
            );


        if (attackerCard) {

            attackerCard.classList.add(
                "attacker-highlight",
                "attacking"
            );


            setTimeout(
                () => {

                    attackerCard.classList.remove(
                        "attacker-highlight",
                        "attacking"
                    );

                },
                300
            );
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


            setTimeout(
                () => {

                    defenderCard.classList.remove(
                        "target-highlight",
                        "hit",
                        "critical"
                    );

                },
                350
            );
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
                600
            );
        }


        adgSpecialBanner(
            fighter,
            abilityName
        );


        adgFlash();
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
                element => {

                    element.textContent =
                        String(round);
                }
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
    // CHARACTER DETAILS
    // =========================================================
    //
    // IMPORTANT:
    // This is the ONLY place where hidden database stats
    // are revealed.
    // =========================================================

    function buildCharacterDetails(
        fighter
    ) {

        const databaseStats =
            fighter.baseDatabaseStats;


        const currentHP =
            Math.floor(
                Math.max(
                    0,
                    fighter.hp
                )
            );


        const baseHP =
            databaseStats?.hp ??
            fighter.hp;


        const baseAttack =
            databaseStats?.attack ??
            fighter.attack;


        const baseDefense =
            databaseStats?.defense ??
            fighter.defense;


        const baseSpeed =
            databaseStats?.speed ??
            fighter.speed;


        return `
            <div class="adg-character-detail-card">

                <div class="detail-header">

                    <h3>
                        ${fighter.emoji}
                        ${escapeHtml(
                            fighter.name
                        )}
                    </h3>

                    <span>
                        ${escapeHtml(
                            fighter.role
                        )}
                    </span>

                </div>


                <div class="detail-stats">

                    <div>
                        ❤️
                        <strong>
                            HP
                        </strong>

                        <span>
                            ${Math.floor(baseHP)}
                        </span>
                    </div>


                    <div>
                        ⚔️
                        <strong>
                            Attack
                        </strong>

                        <span>
                            ${Math.floor(baseAttack)}
                        </span>
                    </div>


                    <div>
                        🛡️
                        <strong>
                            Defense
                        </strong>

                        <span>
                            ${Math.floor(baseDefense)}
                        </span>
                    </div>


                    <div>
                        ⚡
                        <strong>
                            Speed
                        </strong>

                        <span>
                            ${Math.floor(baseSpeed)}
                        </span>
                    </div>

                </div>


                ${
                    databaseStats?.power !== undefined
                        ? `
                            <p>
                                💥 Power:
                                <strong>
                                    ${escapeHtml(
                                        databaseStats.power
                                    )}
                                </strong>
                            </p>
                          `
                        : ""
                }


                ${
                    databaseStats?.intelligence !== undefined
                        ? `
                            <p>
                                🧠 Intelligence:
                                <strong>
                                    ${escapeHtml(
                                        databaseStats.intelligence
                                    )}
                                </strong>
                            </p>
                          `
                        : ""
                }


                ${
                    databaseStats?.stamina !== undefined
                        ? `
                            <p>
                                🔋 Stamina:
                                <strong>
                                    ${escapeHtml(
                                        databaseStats.stamina
                                    )}
                                </strong>
                            </p>
                          `
                        : ""
                }


                ${
                    databaseStats?.haki !== undefined
                        ? `
                            <p>
                                👁️ Haki:
                                <strong>
                                    ${escapeHtml(
                                        databaseStats.haki
                                    )}
                                </strong>
                            </p>
                          `
                        : ""
                }


                ${
                    databaseStats?.durability !== undefined
                        ? `
                            <p>
                                🧱 Durability:
                                <strong>
                                    ${escapeHtml(
                                        databaseStats.durability
                                    )}
                                </strong>
                            </p>
                          `
                        : ""
                }


                ${
                    databaseStats?.ability
                        ? `
                            <div class="detail-ability">

                                <strong>
                                    ✨ Ability
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        databaseStats.ability
                                    )}
                                </p>

                            </div>
                          `
                        : ""
                }


                ${
                    databaseStats?.description
                        ? `
                            <p class="detail-description">
                                ${escapeHtml(
                                    databaseStats.description
                                )}
                            </p>
                          `
                        : ""
                }


                <div class="battle-performance">

                    <h4>
                        📊 Battle Performance
                    </h4>

                    <p>
                        ❤️ Remaining HP:
                        <strong>
                            ${currentHP}
                        </strong>
                    </p>

                    <p>
                        💥 Damage Dealt:
                        <strong>
                            ${Math.floor(
                                fighter.damageDealt ||
                                0
                            )}
                        </strong>
                    </p>

                    <p>
                        💀 KOs:
                        <strong>
                            ${fighter.kos || 0}
                        </strong>
                    </p>

                    <p>
                        🔥 Specials Used:
                        <strong>
                            ${fighter.specialCount || 0}
                        </strong>
                    </p>

                </div>

            </div>
        `;
    }


    function showCharacterDetails() {

        const existing =
            document.querySelector(
                ".adg-details-overlay"
            );


        if (existing) {

            existing.remove();

            return;
        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.className =
            "adg-details-overlay";


        overlay.innerHTML = `

            <div class="adg-details-box">

                <div class="adg-details-header">

                    <h2>
                        📊 CHARACTER DETAILS
                    </h2>

                    <button
                        type="button"
                        class="adg-details-close"
                        id="adgDetailsClose"
                    >
                        ✕
                    </button>

                </div>


                <p class="adg-hidden-reveal-note">
                    🔓 Hidden character stats revealed
                    after battle.
                </p>


                <section>

                    <h3>
                        🏴 PLAYER 1
                    </h3>

                    <div class="adg-details-grid">

                        ${player1Fighters
                            .map(
                                buildCharacterDetails
                            )
                            .join("")
                        }

                    </div>

                </section>


                <section>

                    <h3>
                        🏴 PLAYER 2
                    </h3>

                    <div class="adg-details-grid">

                        ${player2Fighters
                            .map(
                                buildCharacterDetails
                            )
                            .join("")
                        }

                    </div>

                </section>

            </div>
        `;


        document.body.appendChild(
            overlay
        );


        const close =
            document.getElementById(
                "adgDetailsClose"
            );


        if (close) {

            close.addEventListener(
                "click",
                () => overlay.remove()
            );
        }


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.remove();
                }
            }
        );
    }


    // =========================================================
    // RESULT TEAM
    // =========================================================

    function buildTeamResult(
        team
    ) {

        const totalHP =
            getRemainingHP(
                team
            );


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
                    (
                        fighter.damageDealt ||
                        0
                    ),
                0
            );


        return `
            <div class="result-team-stat">

                <p>
                    ❤️ Remaining HP:
                    <strong>
                        ${Math.floor(
                            totalHP
                        )}
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
                        ${Math.floor(
                            totalDamage
                        )}
                    </strong>
                </p>

            </div>
        `;
    }


    // =========================================================
    // RESULT BUTTONS
    // =========================================================

    function addPostBattleButtons(
        resultBox
    ) {

        if (!resultBox) {
            return;
        }


        const old =
            resultBox.querySelector(
                ".adg-post-battle-actions"
            );


        if (old) {
            old.remove();
        }


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "adg-post-battle-actions";


        actions.innerHTML = `

            <button
                type="button"
                id="adgRematchBtn"
                class="adg-rematch-btn"
            >
                🔄 REMATCH
            </button>


            <button
                type="button"
                id="adgCharacterDetailsBtn"
                class="adg-details-btn"
            >
                📊 CHARACTER DETAILS
            </button>

        `;


        resultBox.appendChild(
            actions
        );


        const rematch =
            document.getElementById(
                "adgRematchBtn"
            );


        const details =
            document.getElementById(
                "adgCharacterDetailsBtn"
            );


        if (rematch) {

            rematch.addEventListener(
                "click",
                startRematch
            );
        }


        if (details) {

            details.addEventListener(
                "click",
                showCharacterDetails
            );
        }
    }


    // =========================================================
    // VICTORY
    // =========================================================

    function adgShowVictory(
        playerNumber
    ) {

        const old =
            document.querySelector(
                ".adg-victory-overlay"
            );


        if (old) {
            old.remove();
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


        setTimeout(
            () => {

                if (overlay.parentNode) {
                    overlay.remove();
                }

            },
            1800
        );
    }


    function adgRemoveVictory() {

        document
            .querySelectorAll(
                ".adg-victory-overlay"
            )
            .forEach(
                element =>
                    element.remove()
            );
    }


    // =========================================================
    // SHOW RESULT
    // =========================================================

    function showBattleResult(
        winner
    ) {

        resultShown = true;


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

            } else if (
                winner === 2
            ) {

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
                `Battle completed in ${
                    battleStats.completedRounds
                } rounds.`;
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

            } else if (
                winner === 2
            ) {

                battleStatus.textContent =
                    "🏆 PLAYER 2 IS VICTORIOUS!";

            } else {

                battleStatus.textContent =
                    "🤝 THE BATTLE ENDED IN A DRAW!";
            }
        }


        addPostBattleButtons(
            resultBox
        );


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
    // BATTLE HISTORY
    // =========================================================

    function saveBattleHistory(
        winner
    ) {

        const historyEntry = {

            id:
                Date.now(),

            date:
                new Date().toISOString(),

            winner,

            rounds:
                battleStats.completedRounds,


            player1: {

                team:
                    player1Fighters.map(
                        fighter => ({

                            name:
                                fighter.name,

                            role:
                                fighter.role,

                            remainingHP:
                                Math.floor(
                                    Math.max(
                                        0,
                                        fighter.hp
                                    )
                                ),

                            damageDealt:
                                Math.floor(
                                    fighter.damageDealt ||
                                    0
                                ),

                            KOs:
                                fighter.kos ||
                                0,

                            specialsUsed:
                                fighter.specialCount ||
                                0
                        })
                    )
            },


            player2: {

                team:
                    player2Fighters.map(
                        fighter => ({

                            name:
                                fighter.name,

                            role:
                                fighter.role,

                            remainingHP:
                                Math.floor(
                                    Math.max(
                                        0,
                                        fighter.hp
                                    )
                                ),

                            damageDealt:
                                Math.floor(
                                    fighter.damageDealt ||
                                    0
                                ),

                            KOs:
                                fighter.kos ||
                                0,

                            specialsUsed:
                                fighter.specialCount ||
                                0
                        })
                    )
            },


            statistics: {

                totalDamage:
                    Math.floor(
                        battleStats.totalDamage
                    ),

                totalKOs:
                    battleStats.totalKOs,

                totalSpecials:
                    battleStats.totalSpecials
            }
        };


        let history = [];


        try {

            history =
                JSON.parse(
                    localStorage.getItem(
                        "battleHistory"
                    ) || "[]"
                );

        } catch (error) {

            history = [];
        }


        if (!Array.isArray(history)) {
            history = [];
        }


        history.push(
            historyEntry
        );


        localStorage.setItem(
            "battleHistory",
            JSON.stringify(
                history
            )
        );
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


        battleRunning =
            false;


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
                `❤️ Player 1 HP: <strong>${
                    Math.floor(
                        getRemainingHP(
                            player1Fighters
                        )
                    )
                }</strong>`
            );


            logBattle(
                `❤️ Player 2 HP: <strong>${
                    Math.floor(
                        getRemainingHP(
                            player2Fighters
                        )
                    )
                }</strong>`
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
            winner ?? 0
        );


        saveBattleHistory(
            winner ?? 0
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


        if (
            currentWinner !== null
        ) {

            finishBattle(
                currentWinner
            );

            return;
        }


        if (
            round > MAX_ROUNDS
        ) {

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
                ━━━ ROUND ${round} ━━━
            </strong>`
        );


        // -----------------------------------------------------
        // STATUS PHASE
        // -----------------------------------------------------

        const activeFighters =
            [
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


        await sleep(
            SPEED.round
        );


        // -----------------------------------------------------
        // TURN ORDER
        // -----------------------------------------------------

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

                await sleep(
                    SPEED.action
                );

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


            await sleep(
                SPEED.action
            );
        }


        // -----------------------------------------------------
        // ROUND COMPLETE
        // -----------------------------------------------------

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


        if (
            round >= MAX_ROUNDS
        ) {

            finishBattle(
                getWinnerByRemainingHP()
            );

            return;
        }


        round += 1;


        updateRoundDisplay();


        roundTimer =
            setTimeout(
                () => {

                    roundTimer = null;

                    startRound();

                },
                SPEED.nextRound
            );
    }


    // =========================================================
    // RESET FIGHTER
    // =========================================================

    function resetFighter(
        fighter
    ) {

        /*
         * Rebuild from database so a rematch
         * starts completely clean.
         */

        const databaseStats =
            getDatabaseStats(
                fighter.name
            );


        fighter.hp =
            databaseStats?.hp ||
            BASE_HP;


        fighter.maxHp =
            fighter.hp;


        fighter.attack =
            databaseStats?.attack ||
            BASE_ATTACK;


        fighter.defense =
            databaseStats?.defense ||
            BASE_DEFENSE;


        fighter.speed =
            databaseStats?.speed ||
            BASE_SPEED;


        applyRoleBonus(
            fighter
        );


        fighter.maxHp =
            fighter.hp;


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


        round =
            1;


        battleRunning =
            true;


        resultShown =
            false;


        battleStats = {
            ...battleStatsDefault
        };


        // Hide result

        const resultBox =
            document.querySelector(
                ".result-box"
            );


        if (resultBox) {

            resultBox.classList.add(
                "hidden"
            );
        }


        // Remove old overlays

        adgRemoveVictory();


        document
            .querySelectorAll(
                ".adg-details-overlay"
            )
            .forEach(
                element =>
                    element.remove()
            );


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
            `⚡ Maximum:
             ${MAX_ROUNDS} rounds`
        );


        adgShowAnnouncement(
            "⚔️ BATTLE START!"
        );


        await sleep(
            SPEED.start
        );


        if (battleRunning) {

            startRound();
        }
    }


    // =========================================================
    // REMATCH
    // =========================================================

    async function startRematch() {

        if (battleRunning) {
            return;
        }


        /*
         * Remove old details window.
         */

        document
            .querySelectorAll(
                ".adg-details-overlay"
            )
            .forEach(
                element =>
                    element.remove()
            );


        /*
         * Rebuild fighters from the original
         * draft teams and current database.
         *
         * This guarantees a clean rematch.
         */

        buildFighterTeams();


        resultShown =
            false;


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


        await startBattle();
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
                🔒 Character stats hidden until
                battle completion.
            </p>

            <p>
                ⚡ Fast Battle Mode ready.
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