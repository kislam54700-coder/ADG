document.addEventListener("DOMContentLoaded", () => {

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
    // LOAD PLAYER DATA
    // =========================================================

    const player1Team =
        JSON.parse(
            localStorage.getItem("player1Team")
        ) || [];

    const player2Team =
        JSON.parse(
            localStorage.getItem("player2Team")
        ) || [];


    const player1Roles =
        JSON.parse(
            localStorage.getItem("player1Roles")
        ) || {};

    const player2Roles =
        JSON.parse(
            localStorage.getItem("player2Roles")
        ) || {};


    // =========================================================
    // BATTLE STATISTICS
    // =========================================================

    let battleStats = {

        totalDamage: 0,

        totalKOs: 0,

        totalSpecials: 0,

        completedRounds: 0

    };


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

    function createFighter(
        name,
        role
    ) {

        const fighter = {

            name: name,

            role: role || "Wildcard",

            emoji: getRoleEmoji(
                role || "Wildcard"
            ),


            // -----------------------------
            // BASE STATS
            // -----------------------------

            hp: BASE_HP,

            maxHp: BASE_HP,

            attack: BASE_ATTACK,

            defense: BASE_DEFENSE,

            speed: BASE_SPEED,


            // -----------------------------
            // BASIC STATE
            // -----------------------------

            alive: true,


            // -----------------------------
            // ABILITIES
            // -----------------------------

            abilityUsed: false,

            specialUsed: false,


            // -----------------------------
            // COMBAT PRESENTATION
            // -----------------------------

            koShown: false,

            lastCritical: false,


            // -----------------------------
            // VICE CAPTAIN
            // -----------------------------

            assistReady: true,


            // -----------------------------
            // TANK
            // -----------------------------

            protecting: false,

            protectedBy: null,


            // -----------------------------
            // STATUS EFFECTS
            // -----------------------------

            burn: 0,

            bleed: 0,

            stun: 0,

            freeze: 0,


            // -----------------------------
            // DEFENSIVE EFFECTS
            // -----------------------------

            shield: 0,


            // -----------------------------
            // REGENERATION
            // -----------------------------

            regeneration: 0,


            // -----------------------------
            // TEMPORARY BUFFS
            // -----------------------------

            attackBuff: 1,

            defenseBuff: 1,

            speedBuff: 1,


            // -----------------------------
            // STATISTICS
            // -----------------------------

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
    // ROLE STAT BONUSES
    // =========================================================

    function applyRoleBonus(
        fighter
    ) {

        switch (
            fighter.role
        ) {

            // -------------------------------------------------
            // CAPTAIN
            // -------------------------------------------------

            case "Captain":

                fighter.hp *= 1.20;

                fighter.attack *= 1.20;

                fighter.defense *= 1.20;

                fighter.speed *= 1.20;

                break;


            // -------------------------------------------------
            // VICE CAPTAIN
            // -------------------------------------------------

            case "Vice Captain":

                fighter.hp *= 1.10;

                fighter.attack *= 1.10;

                fighter.defense *= 1.10;

                fighter.speed *= 1.10;

                break;


            // -------------------------------------------------
            // TANK
            // -------------------------------------------------

            case "Tank":

                fighter.hp *= 1.30;

                fighter.defense *= 1.30;

                break;


            // -------------------------------------------------
            // HEALER
            // -------------------------------------------------

            case "Healer":

                fighter.hp *= 1.20;

                break;


            // -------------------------------------------------
            // SUPPORT
            // -------------------------------------------------

            case "Support":

                fighter.speed *= 1.15;

                break;


            // -------------------------------------------------
            // WILDCARD
            // -------------------------------------------------

            case "Wildcard":

                fighter.attack *= 1.25;

                break;

        }

    }


    // =========================================================
    // LOAD PLAYER 1 FIGHTERS
    // =========================================================

    player1Team.forEach(
        character => {

            player1Fighters.push(

                createFighter(

                    character,

                    player1Roles[
                        character
                    ]

                )

            );

        }
    );


    // =========================================================
    // LOAD PLAYER 2 FIGHTERS
    // =========================================================

    player2Team.forEach(
        character => {

            player2Fighters.push(

                createFighter(

                    character,

                    player2Roles[
                        character
                    ]

                )

            );

        }
    );


    // =========================================================
    // BATTLE LOG
    // =========================================================

    function logBattle(
        message
    ) {

        if (!battleLog) {
            return;
        }


        const line =
            document.createElement(
                "p"
            );


        line.innerHTML =
            message;


        battleLog.appendChild(
            line
        );


        battleLog.scrollTop =
            battleLog.scrollHeight;

    }


    // =========================================================
    // GET ALIVE FIGHTERS
    // =========================================================

    function getAliveFighters(
        team
    ) {

        return team.filter(
            fighter =>
                fighter.hp > 0 &&
                fighter.alive
        );

    }


    // =========================================================
    // RANDOM TARGET
    // =========================================================

    function chooseTarget(
        team
    ) {

        const alive =
            getAliveFighters(
                team
            );


        if (
            alive.length === 0
        ) {

            return null;

        }


        return alive[
            Math.floor(
                Math.random() *
                alive.length
            )
        ];

    }


    // =========================================================
    // LOWEST HP TARGET
    // =========================================================

    function chooseLowestHP(
        team
    ) {

        const alive =
            getAliveFighters(
                team
            );


        if (
            alive.length === 0
        ) {

            return null;

        }


        return [...alive].sort(

            (a, b) =>

                (
                    a.hp /
                    a.maxHp
                )

                -

                (
                    b.hp /
                    b.maxHp
                )

        )[0];

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

                    Math.max(
                        0,
                        Math.min(
                            100,
                            (
                                fighter.hp /
                                fighter.maxHp
                            ) * 100
                        )
                    );


                let cardClass =
                    "fighter-card";


                if (
                    fighter.hp <= 0
                ) {

                    cardClass +=
                        " dead";


                    if (
                        fighter.koShown
                    ) {

                        cardClass +=
                            " ko";

                    }

                }

                else if (
                    fighter.protecting
                ) {

                    cardClass +=
                        " active";

                }


                let effects = "";


                if (
                    fighter.burn > 0
                ) {

                    effects +=

                        `<span>🔥 Burn ${fighter.burn}</span>`;

                }


                if (
                    fighter.bleed > 0
                ) {

                    effects +=

                        `<span>🩸 Bleed ${fighter.bleed}</span>`;

                }


                if (
                    fighter.freeze > 0
                ) {

                    effects +=

                        `<span>❄️ Frozen</span>`;

                }


                if (
                    fighter.stun > 0
                ) {

                    effects +=

                        `<span>⚡ Stunned</span>`;

                }


                if (
                    fighter.shield > 0
                ) {

                    effects +=

                        `<span>🛡️ Shield ${
                            Math.floor(
                                fighter.shield
                            )
                        }</span>`;

                }


                if (
                    fighter.regeneration > 0
                ) {

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

            }
        );

    }


    // =========================================================
    // UPDATE BATTLE UI
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

        if (
            captain.abilityUsed
        ) {

            return;

        }


        captain.abilityUsed =
            true;


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

            `👑 ${captain.name} used Command! ` +
            `⚔️ Team Attack +10%!`

        );

    }


    // =========================================================
    // VICE CAPTAIN ASSIST
    // =========================================================

    function viceCaptainAbility(
        fighter,
        enemyTeam
    ) {

        if (
            !fighter.assistReady
        ) {

            return;

        }


        // 35% chance

        if (
            Math.random() > 0.35
        ) {

            return;

        }


        const target =
            chooseTarget(
                enemyTeam
            );


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

            `⚔️ ${fighter.name} performed Assist! ` +
            `💥 ${damage} bonus damage!`

        );


        fighter.assistReady =
            false;

    }


    // =========================================================
    // TANK PROTECTION
    // =========================================================

    function tankAbility(
        tank,
        team
    ) {

        if (
            tank.abilityUsed
        ) {

            return;

        }


        const allies =

            getAliveFighters(
                team
            ).filter(
                fighter =>
                    fighter !== tank
            );


        if (
            allies.length === 0
        ) {

            return;

        }


        const target =
            chooseLowestHP(
                allies
            );


        if (!target) {
            return;
        }


        tank.abilityUsed =
            true;


        tank.protecting =
            true;


        target.protectedBy =
            tank;


        logBattle(

            `🛡️ ${tank.name} is protecting ` +
            `${target.name}! ` +
            `Damage reduced by 50%!`

        );

    }


    // =========================================================
    // HEALER ABILITY
    // =========================================================

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


        if (
            allies.length === 0
        ) {

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
                target.maxHp * 0.20
            );


        target.hp =

            Math.min(

                target.maxHp,

                target.hp + heal

            );


        logBattle(

            `❤️ ${healer.name} healed ` +
            `${target.name} +${heal} HP!`

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

        if (
            support.abilityUsed
        ) {

            return;

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

            `⭐ ${support.name} used Team Buff! ` +
            `⚔️ Attack +5% ` +
            `⚡ Speed +10%!`

        );

    }


    // =========================================================
    // WILDCARD ABILITY
    // =========================================================

    function wildcardAbility(
        fighter
    ) {

        if (
            fighter.abilityUsed
        ) {

            return;

        }


        fighter.abilityUsed =
            true;


        const random =
            Math.floor(
                Math.random() * 3
            );


        if (
            random === 0
        ) {

            fighter.attackBuff *=
                1.25;


            logBattle(

                `☠️ ${fighter.name} activated ` +
                `Berserker! ⚔️ Attack +25%!`

            );

        }


        else if (
            random === 1
        ) {

            fighter.defenseBuff *=
                1.25;


            logBattle(

                `☠️ ${fighter.name} activated ` +
                `Guardian! 🛡️ Defense +25%!`

            );

        }


        else {

            fighter.speedBuff *=
                1.25;


            logBattle(

                `☠️ ${fighter.name} activated ` +
                `Assassin! ⚡ Speed +25%!`

            );

        }

    }


    // =========================================================
    // ROLE ABILITY DISPATCHER
    // =========================================================

    function useRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        switch (
            fighter.role
        ) {

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

            return;

        }


        const name =
            String(
                fighter.name
            )
            .trim()
            .toLowerCase();


        // =====================================================
        // LUFFY — GEAR 5
        // =====================================================

        if (
            name === "luffy" &&
            round >= 3
        ) {

            fighter.specialUsed =
                true;

            fighter.attackBuff *=
                1.50;

            fighter.speedBuff *=
                1.20;


            logBattle(

                `🔥 ${fighter.name} activated ` +
                `Gear 5! 🌀 Attack +50%! ` +
                `⚡ Speed +20%!`

            );

            return;

        }


        // =====================================================
        // ZORO — THREE SWORD STYLE
        // =====================================================

        if (
            name === "zoro" &&
            round >= 2
        ) {

            fighter.specialUsed =
                true;

            fighter.attackBuff *=
                1.30;


            logBattle(

                `⚔️ ${fighter.name} activated ` +
                `Three Sword Style! ` +
                `⚔️ Attack +30%!`

            );

            return;

        }


        // =====================================================
        // PORTGAS D. ACE — FLAME EMPEROR
        // =====================================================

        if (
            (
                name === "portgas d. ace" ||
                name === "ace"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


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

                `🔥 ${fighter.name} used ` +
                `Flame Emperor! 💥 ` +
                `${damage} damage! ` +
                `🔥 ${target.name} is Burning!`

            );

            return;

        }


        // =====================================================
        // SHANKS — CONQUEROR'S HAKI
        // =====================================================

        if (
            name === "shanks" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


            target.stun =
                Math.max(
                    target.stun,
                    1
                );


            logBattle(

                `👑 ${fighter.name} unleashed ` +
                `Conqueror's Haki! 💫 ` +
                `${target.name} is Stunned!`

            );

            return;

        }


        // =====================================================
        // AOKIJI / KUZAN — ICE AGE
        // =====================================================

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
                return;
            }


            fighter.specialUsed =
                true;


            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );


            logBattle(

                `❄️ ${fighter.name} used ` +
                `Ice Age! ` +
                `${target.name} is Frozen!`

            );

            return;

        }


        // =====================================================
        // ENEL — RAIGO
        // =====================================================

        if (
            name === "enel" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


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

                `⚡ ${fighter.name} unleashed ` +
                `Raigo! 💥 ${damage} damage ` +
                `+ Stun!`

            );

            return;

        }


        // =====================================================
        // KAIDO — BORO BREATH
        // =====================================================

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
                return;
            }


            fighter.specialUsed =
                true;


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

                `🐉 ${fighter.name} used ` +
                `Boro Breath! 🔥 ` +
                `${damage} damage!`

            );

            return;

        }


        // =====================================================
        // MIHAWK — BLACK BLADE
        // =====================================================

        if (
            name === "mihawk" &&
            round >= 3
        ) {

            fighter.specialUsed =
                true;

            fighter.attackBuff *=
                1.40;


            logBattle(

                `🦅 ${fighter.name} unleashed ` +
                `Black Blade! ⚔️ ` +
                `Attack +40%!`

            );

            return;

        }


        // =====================================================
        // MARCO — PHOENIX REGENERATION
        // =====================================================

        if (
            name === "marco" &&
            fighter.hp <
            fighter.maxHp * 0.60
        ) {

            fighter.specialUsed =
                true;


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

                `🔥 ${fighter.name} activated ` +
                `Phoenix Regeneration! ❤️ ` +
                `+${heal} HP!`

            );

            return;

        }


        // =====================================================
        // BROOK — SOUL SOLID
        // =====================================================

        if (
            name === "brook" &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


            target.freeze =
                Math.max(
                    target.freeze,
                    1
                );


            logBattle(

                `💀 ${fighter.name} used ` +
                `Soul Solid! ❄️ ` +
                `${target.name} is Frozen!`

            );

            return;

        }


        // =====================================================
        // KATAKURI — MOCHI POWER
        // =====================================================

        if (
            name === "katakuri" &&
            round >= 3
        ) {

            fighter.specialUsed =
                true;


            fighter.attackBuff *=
                1.30;

            fighter.speedBuff *=
                1.20;


            logBattle(

                `🍩 ${fighter.name} activated ` +
                `Mochi Power! ` +
                `⚔️ Attack +30%! ` +
                `⚡ Speed +20%!`

            );

            return;

        }


        // =====================================================
        // TRAFALGAR LAW — ROOM
        // =====================================================

        if (
            (
                name === "trafalgar d. water law" ||
                name === "trafalgar law"
            ) &&
            round >= 3
        ) {

            const target =
                chooseTarget(
                    enemyTeam
                );


            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


            target.stun =
                Math.max(
                    target.stun,
                    1
                );


            logBattle(

                `⚕️ ${fighter.name} used ROOM! ` +
                `${target.name} is Stunned!`

            );

            return;

        }


        // =====================================================
        // DOFLAMINGO — BIRD CAGE
        // =====================================================

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
                return;
            }


            fighter.specialUsed =
                true;


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

                `🦩 ${fighter.name} used ` +
                `Bird Cage! 🩸 ` +
                `${damage} damage + Bleed!`

            );

            return;

        }


        // =====================================================
        // SANJI — DIABLE JAMBE
        // =====================================================

        if (
            name === "sanji" &&
            round >= 2
        ) {

            fighter.specialUsed =
                true;


            fighter.attackBuff *=
                1.35;

            fighter.speedBuff *=
                1.15;


            logBattle(

                `🔥 ${fighter.name} activated ` +
                `Diable Jambe! ` +
                `⚔️ Attack +35%!`

            );

            return;

        }


        // =====================================================
        // WHITEBEARD — GURA GURA
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


            if (
                targets.length === 0
            ) {

                return;

            }


            fighter.specialUsed =
                true;


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

                `🌊 ${fighter.name} unleashed ` +
                `Gura Gura no Mi! 💥 ` +
                `Area damage!`

            );

            return;

        }


        // =====================================================
        // BIG MOM — IKOKU
        // =====================================================

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
                return;
            }


            fighter.specialUsed =
                true;


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

                `👑 ${fighter.name} used ` +
                `Ikoku! 💥 ${damage} damage!`

            );

            return;

        }


        // =====================================================
        // ROB LUCCI — ROKUOGAN
        // =====================================================

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
                return;
            }


            fighter.specialUsed =
                true;


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

                `🐆 ${fighter.name} used ` +
                `Rokuogan! 💥 ` +
                `${damage} damage!`

            );

            return;

        }


        // =====================================================
        // AKAINU — METEOR VOLCANO
        // =====================================================

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
                return;
             }


             fighter.specialUsed =
                true;


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
    `🔥 ${fighter.name} used ` +
    `Meteor Volcano! 🔥 ` +
    `${damage} damage + Burn!`
);

return;
}

// ============================================
// KIZARU - YASAKANI NO MAGATAMA
// ============================================

if (
    name === "kizaru" &&
    round >= 3
) {

           const target =
         chooseTarget(
            enemyTeam
        );

            if (!target) {
                return;
            }


            fighter.specialUsed =
                true;


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

                `✨ ${fighter.name} used ` +
                `Yasakani no Magatama! ` +
                `💥 ${damage} damage!`

            );

            return;

        }


        // =====================================================
        // BARTOLOMEW — BARRIER
        // =====================================================

        if (
            (
                name === "bartolomeo" ||
                name === "bartolomew"
            ) &&
            round >= 2
        ) {

            fighter.specialUsed =
                true;


            fighter.shield +=
                Math.floor(
                    fighter.maxHp * 0.35
                );


            logBattle(

                `🛡️ ${fighter.name} created ` +
                `a Barrier! ` +
                `Shield activated!`

            );

            return;

        }

    }


    // =========================================================
    // ROLE ABILITY + SPECIAL HELPERS
    // =========================================================

    function tryCharacterSpecial(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        const before =
            fighter.specialUsed;


        useCharacterSpecial(
            fighter,
            ownTeam,
            enemyTeam
        );


        return (
            !before &&
            fighter.specialUsed
        );

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


                return speedB -
                    speedA;

            }

        );

    }


    // =========================================================
    // DAMAGE CALCULATION
    // =========================================================

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
            defense * 0.50;


        if (
            damage < 10
        ) {

            damage = 10;

        }


        // -----------------------------------------------------
        // CRITICAL HIT
        // -----------------------------------------------------

        const critical =
            Math.random() < 0.15;


        if (
            critical
        ) {

            damage *= 1.75;

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

            return;

        }


        let remainingDamage =
            Math.max(
                0,
                Number(damage) || 0
            );


        // -----------------------------------------------------
        // SHIELD
        // -----------------------------------------------------

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

                `🛡️ ${defender.name}'s shield ` +
                `absorbed ${Math.floor(absorbed)} damage!`

            );


            if (
                remainingDamage <= 0
            ) {

                return;

            }

        }


        // -----------------------------------------------------
        // TANK PROTECTION
        // -----------------------------------------------------

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0 &&
            defender.protectedBy.alive
        ) {

            remainingDamage *=
                0.50;


            logBattle(

                `🛡️ ${defender.name} is protected! ` +
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


        // -----------------------------------------------------
        // STATISTICS
        // -----------------------------------------------------

        battleStats.totalDamage +=
            remainingDamage;


        if (
            attacker
        ) {

            attacker.damageDealt =

                (
                    attacker.damageDealt ||
                    0
                ) + remainingDamage;

        }


        // -----------------------------------------------------
        // KO
        // -----------------------------------------------------

        if (
            defender.hp <= 0
        ) {

            defender.hp =
                0;

            defender.alive =
                false;

            defender.protecting =
                false;

            defender.protectedBy =
                null;


            battleStats.totalKOs++;


            if (
                attacker
            ) {

                attacker.kos =

                    (
                        attacker.kos ||
                        0
                    ) + 1;

            }


            defender.koShown =
                true;


            logBattle(

                `💀 ${defender.name} has been KO'd!`

            );

        }

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


        if (
            result.critical
        ) {

            logBattle(

                `💥 CRITICAL HIT! ` +
                `${attacker.name} dealt ` +
                `${result.damage} damage to ` +
                `${defender.name}!`

            );

        }

        else {

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

    function processStatusEffects(fighter) {

        if (
            !fighter ||
            fighter.hp <= 0 ||
            !fighter.alive
        ) {
            return;
        }


        // =====================================================
        // BURN
        // =====================================================

        if (fighter.burn > 0) {

            const burnDamage =
                Math.floor(
                    fighter.maxHp * 0.05
                );


            fighter.hp -= burnDamage;


            battleStats.totalDamage +=
                burnDamage;


            logBattle(
                `🔥 ${fighter.name} takes `
                + `${burnDamage} Burn damage!`
            );


            fighter.burn--;


            if (fighter.hp <= 0) {

                fighter.hp = 0;

                fighter.alive = false;

                fighter.koShown = true;

                battleStats.totalKOs++;


                logBattle(
                    `💀 ${fighter.name} was defeated `
                    + `by Burn!`
                );

            }

        }


        // =====================================================
        // BLEED
        // =====================================================

        if (
            fighter.hp > 0 &&
            fighter.alive &&
            fighter.bleed > 0
        ) {

            const bleedDamage =
                Math.floor(
                    fighter.maxHp * 0.04
                );


            fighter.hp -= bleedDamage;


            battleStats.totalDamage +=
                bleedDamage;


            logBattle(
                `🩸 ${fighter.name} takes `
                + `${bleedDamage} Bleed damage!`
            );


            fighter.bleed--;


            if (fighter.hp <= 0) {

                fighter.hp = 0;

                fighter.alive = false;

                fighter.koShown = true;

                battleStats.totalKOs++;


                logBattle(
                    `💀 ${fighter.name} was defeated `
                    + `by Bleed!`
                );

            }

        }


        // =====================================================
        // REGENERATION
        // =====================================================

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
                `❤️ ${fighter.name} regenerates `
                + `${heal} HP!`
            );


            fighter.regeneration--;

        }


        // =====================================================
        // STUN
        // =====================================================

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


        // =====================================================
        // FREEZE
        // =====================================================

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


        // =====================================================
        // FINAL DEATH CHECK
        // =====================================================

        if (fighter.hp <= 0) {

            fighter.hp = 0;

            fighter.alive = false;

        }

    }


    // =========================================================
    // CAN TAKE TURN
    // =========================================================

    function canTakeTurn(fighter) {

        if (!fighter) {
            return false;
        }


        if (fighter.hp <= 0) {
            return false;
        }


        if (!fighter.alive) {
            return false;
        }


        if (fighter.stun > 0) {

            return false;

        }


        if (fighter.freeze > 0) {

            return false;

        }


        return true;

    }


    // =========================================================
    // ROLE ABILITY
    // =========================================================

    function useRoleAbility(
        fighter,
        ownTeam,
        enemyTeam
    ) {

        if (!fighter) {
            return false;
        }


        switch (fighter.role) {


            // -------------------------------------------------
            // CAPTAIN
            // -------------------------------------------------

            case "Captain":

                captainAbility(
                    fighter,
                    ownTeam
                );

                break;


            // -------------------------------------------------
            // VICE CAPTAIN
            // -------------------------------------------------

            case "Vice Captain":

                viceCaptainAbility(
                    fighter,
                    enemyTeam
                );

                break;


            // -------------------------------------------------
            // TANK
            // -------------------------------------------------

            case "Tank":

                tankAbility(
                    fighter,
                    ownTeam
                );

                break;


            // -------------------------------------------------
            // HEALER
            // -------------------------------------------------

            case "Healer":

                return healerAbility(
                    fighter,
                    ownTeam
                );


            // -------------------------------------------------
            // SUPPORT
            // -------------------------------------------------

            case "Support":

                supportAbility(
                    fighter,
                    ownTeam
                );

                break;


            // -------------------------------------------------
            // WILDCARD
            // -------------------------------------------------

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


        // =====================================================
        // CRITICAL HIT
        // =====================================================

        const critical =
            Math.random() < 0.15;


        if (critical) {

            damage *= 1.75;

        }


        return {

            damage:
                Math.floor(damage),

            critical:
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

            return;

        }


        // =====================================================
        // SHIELD
        // =====================================================

        if (defender.shield > 0) {

            const absorbed =
                Math.min(
                    defender.shield,
                    damage
                );


            defender.shield -=
                absorbed;


            damage -=
                absorbed;


            logBattle(
                `🛡️ ${defender.name}'s shield `
                + `absorbed ${absorbed} damage!`
            );


            if (damage <= 0) {

                return;

            }

        }


        // =====================================================
        // TANK PROTECTION
        // =====================================================

        if (
            defender.protectedBy &&
            defender.protectedBy.hp > 0 &&
            defender.protectedBy.alive
        ) {

            damage *= 0.50;


            logBattle(
                `🛡️ ${defender.name} is protected! `
                + `Damage reduced by 50%.`
            );

        }


        damage =
            Math.max(
                1,
                Math.floor(damage)
            );


        defender.hp -=
            damage;


        // =====================================================
        // STATISTICS
        // =====================================================

        battleStats.totalDamage +=
            damage;


        if (attacker) {

            attacker.damageDealt =
                (attacker.damageDealt || 0)
                + damage;

        }


        // =====================================================
        // KO CHECK
        // =====================================================

        if (defender.hp <= 0) {

            defender.hp = 0;

            defender.alive = false;

            defender.koShown = true;


            battleStats.totalKOs++;


            if (attacker) {

                attacker.kos =
                    (attacker.kos || 0)
                    + 1;

            }


            logBattle(
                `💀 ${defender.name} has been KO'd!`
            );

        }

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
            !defender
        ) {

            return;

        }


        if (
            attacker.hp <= 0 ||
            defender.hp <= 0
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


        // =====================================================
        // ATTACK VISUAL EFFECT
        // =====================================================

        adgPlayAttackEffects(
            attacker,
            defender,
            result.critical
        );


        // =====================================================
        // DAMAGE
        // =====================================================

        applyDamage(
            defender,
            result.damage,
            attacker,
            result.critical
                ? "Critical Hit"
                : "Normal Attack"
        );


        // =====================================================
        // LOG
        // =====================================================

        if (result.critical) {

            logBattle(
                `💥 CRITICAL HIT! `
                + `${attacker.name} dealt `
                + `${result.damage} damage to `
                + `${defender.name}!`
            );

        }

        else {

            logBattle(
                `⚔️ ${attacker.name} attacked `
                + `${defender.name} for `
                + `${result.damage} damage!`
            );

        }

    }


    // =========================================================
    // BATTLE FINISHED
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
            round > MAX_ROUNDS
        );

    }
    ```javascript
    // =========================================================
    // PHASE 6.2 — ARENA COMBAT PRESENTATION
    // =========================================================

    function adgFindCard(fighter) {

        const cards =
            document.querySelectorAll(
                ".fighter-card"
            );


        for (const card of cards) {

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


    // =========================================================
    // ROUND / BATTLE ANNOUNCEMENT
    // =========================================================

    function adgShowAnnouncement(text) {

        const element =
            document.createElement("div");


        element.className =
            "adg-announcement";


        element.textContent =
            text;


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                if (element.parentNode) {

                    element.remove();

                }

            },
            1100
        );

    }


    // =========================================================
    // ATTACK IMPACT
    // =========================================================

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


        setTimeout(
            () => {

                if (element.parentNode) {

                    element.remove();

                }

            },
            600
        );

    }


    // =========================================================
    // ARENA FLASH
    // =========================================================

    function adgFlash() {

        const element =
            document.createElement("div");


        element.className =
            "adg-arena-flash";


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                if (element.parentNode) {

                    element.remove();

                }

            },
            300
        );

    }


    // =========================================================
    // SPECIAL BANNER
    // =========================================================

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


        setTimeout(
            () => {

                if (element.parentNode) {

                    element.remove();

                }

            },
            1200
        );

    }


    // =========================================================
    // ATTACK VISUAL EFFECTS
    // =========================================================

    function adgPlayAttackEffects(
        attacker,
        defender,
        critical = false
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
                450
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
                550
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


    // =========================================================
    // SPECIAL VISUAL EFFECTS
    // =========================================================

    function adgPlaySpecialEffects(
        fighter,
        abilityName = "SPECIAL ABILITY"
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


    // =========================================================
    // VICTORY OVERLAY
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

    }


    // =========================================================
    // REMOVE VICTORY OVERLAY
    // =========================================================

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
    // GET BATTLE WINNER
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


    // =========================================================
    // AI TARGET SELECTION
    // =========================================================

    function aiChooseTarget(
        enemyTeam
    ) {

        const alive =
            getAliveFighters(
                enemyTeam
            );


        if (alive.length === 0) {

            return null;

        }


        // -----------------------------------------------------
        // LOW HP PRIORITY
        // -----------------------------------------------------

        const lowHp =
            alive.filter(
                fighter =>
                    fighter.hp <
                    fighter.maxHp * 0.35
            );


        if (lowHp.length > 0) {

            return chooseLowestHP(
                lowHp
            );

        }


        // -----------------------------------------------------
        // RANDOM TARGET
        // -----------------------------------------------------

        return chooseTarget(
            alive
        );

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


        // =====================================================
        // CHARACTER SPECIAL
        // =====================================================

        if (
            !fighter.specialUsed
        ) {

            const before =
                fighter.specialUsed;


            useCharacterSpecial(
                fighter,
                ownTeam,
                enemyTeam
            );


            if (
                !before &&
                fighter.specialUsed
            ) {

                battleStats.totalSpecials++;


                adgPlaySpecialEffects(
                    fighter
                );

            }

        }


        // =====================================================
        // ROLE ABILITY
        // =====================================================

        if (
            !fighter.abilityUsed ||
            fighter.role === "Vice Captain"
        ) {

            useRoleAbility(
                fighter,
                ownTeam,
                enemyTeam
            );

        }


        // =====================================================
        // HEALER DECISION
        // =====================================================

        if (
            fighter.role === "Healer"
        ) {

            const healed =
                healerAbility(
                    fighter,
                    ownTeam
                );


            if (healed) {

                return;

            }

        }


        // =====================================================
        // TARGET
        // =====================================================

        const target =
            aiChooseTarget(
                enemyTeam
            );


        if (!target) {

            return;

        }


        // =====================================================
        // ATTACK
        // =====================================================

        attack(
            fighter,
            target
        );

    }
```
```javascript
    // =========================================================
    // FINAL BATTLE RESULT
    // =========================================================

    function showBattleResult(winner) {

        const resultBox =
            document.querySelector(
                ".result-box"
            );


        if (resultBox) {

            resultBox.classList.remove(
                "hidden"
            );

        }


        // =====================================================
        // WINNER TEXT
        // =====================================================

        const winnerText =
            document.getElementById(
                "winnerText"
            );


        if (winnerText) {

            if (winner === 1) {

                winnerText.textContent =
                    "🏆 PLAYER 1 WINS!";

            }

            else if (winner === 2) {

                winnerText.textContent =
                    "🏆 PLAYER 2 WINS!";

            }

            else {

                winnerText.textContent =
                    "🤝 DRAW!";

            }

        }


        // =====================================================
        // RESULT SUMMARY
        // =====================================================

        const resultSummary =
            document.getElementById(
                "resultSummary"
            );


        if (resultSummary) {

            resultSummary.textContent =
                `Battle completed in `
                + `${battleStats.completedRounds} rounds.`;

        }


        // =====================================================
        // TEAM RESULT
        // =====================================================

        function buildTeamResult(team) {

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
                        (
                            fighter.damageDealt ||
                            0
                        ),
                    0
                );


            return `

                <div class="result-team-stat">

                    <p
```
// =========================================================
// FINAL BATTLE RESULT — CONTINUED
// =========================================================

function showBattleResult(winner) {

    const resultBox =
        document.querySelector(
            ".result-box"
        );


    if (resultBox) {

        resultBox.classList.remove(
            "hidden"
        );

    }


    // =====================================================
    // WINNER TEXT
    // =====================================================

    const winnerText =
        document.getElementById(
            "winnerText"
        );


    if (winnerText) {

        if (winner === 1) {

            winnerText.textContent =
                "🏆 PLAYER 1 WINS!";

        }

        else if (winner === 2) {

            winnerText.textContent =
                "🏆 PLAYER 2 WINS!";

        }

        else {

            winnerText.textContent =
                "🤝 DRAW!";

        }

    }


    // =====================================================
    // RESULT SUMMARY
    // =====================================================

    const resultSummary =
        document.getElementById(
            "resultSummary"
        );


    if (resultSummary) {

        resultSummary.textContent =
            `Battle completed in `
            + `${battleStats.completedRounds} rounds.`;

    }


    // =====================================================
    // TEAM RESULT
    // =====================================================

    function buildTeamResult(team) {

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


    // =====================================================
    // PLAYER 1 RESULT
    // =====================================================

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


    // =====================================================
    // PLAYER 2 RESULT
    // =====================================================

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


    // =====================================================
    // GLOBAL STATISTICS
    // =====================================================

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


    // =====================================================
    // VICTORY PRESENTATION
    // =====================================================

    if (
        winner === 1 ||
        winner === 2
    ) {

        adgShowVictory(
            winner
        );

    }


    // =====================================================
    // BATTLE STATUS
    // =====================================================

    if (battleStatus) {

        if (winner === 1) {

            battleStatus.textContent =
                "🏆 PLAYER 1 IS VICTORIOUS!";

        }

        else if (winner === 2) {

            battleStatus.textContent =
                "🏆 PLAYER 2 IS VICTORIOUS!";

        }

        else {

            battleStatus.textContent =
                "🤝 THE BATTLE ENDED IN A DRAW!";

        }

    }

}


// =========================================================
// UPDATE ROUND DISPLAY
// =========================================================

function updateRoundDisplay() {

    const roundElements =
        document.querySelectorAll(
            ".round-number"
        );


    roundElements.forEach(
        element => {

            element.textContent =
                round;

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
// ROUND START
// =========================================================

function startRound() {

    if (!battleRunning) {
        return;
    }


    if (battleFinished()) {

        finishBattle();

        return;

    }


    updateRoundDisplay();


    adgShowAnnouncement(
        `⚔️ ROUND ${round}`
    );


    logBattle(
        `<strong>━━━━━━━━ ROUND ${round} ━━━━━━━━</strong>`
    );


    // =====================================================
    // STATUS EFFECTS
    // =====================================================

    [
        ...getAliveFighters(
            player1Fighters
        ),

        ...getAliveFighters(
            player2Fighters
        )

    ].forEach(
        fighter => {

            processStatusEffects(
                fighter
            );

        }
    );


    if (battleFinished()) {

        finishBattle();

        return;

    }


    updateBattleUI();


    // =====================================================
    // ATTACK ORDER
    // =====================================================

    const attackOrder =
        getAttackOrder();


    attackOrder.forEach(
        fighter => {

            if (!battleRunning) {
                return;
            }


            if (
                !canTakeTurn(
                    fighter
                )
            ) {

                return;

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


            // -------------------------------------------------
            // AI TURN
            // -------------------------------------------------

            aiDecision(
                fighter,
                ownTeam,
                enemyTeam
            );


            updateBattleUI();

        }
    );


    // =====================================================
    // ROUND COMPLETE
    // =====================================================

    battleStats.completedRounds =
        round;


    if (battleFinished()) {

        finishBattle();

        return;

    }


    round++;


    updateBattleUI();


    // Small delay between rounds
    setTimeout(
        () => {

            startRound();

        },
        1000
    );

}


// =========================================================
// FINISH BATTLE
// =========================================================

function finishBattle() {

    if (!battleRunning) {
        return;
    }


    battleRunning =
        false;


    const winner =
        getBattleWinner();


    // =====================================================
    // MAX ROUND DRAW
    // =====================================================

    if (
        winner === null &&
        round > MAX_ROUNDS
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


        let finalWinner =
            0;


        if (p1HP > p2HP) {

            finalWinner =
                1;

        }

        else if (p2HP > p1HP) {

            finalWinner =
                2;

        }


        logBattle(
            `<strong>⏱️ MAX ROUNDS REACHED!</strong>`
        );


        showBattleResult(
            finalWinner
        );


        return;

    }


    // =====================================================
    // NORMAL FINISH
    // =====================================================

    logBattle(
        `<strong>🏁 BATTLE FINISHED!</strong>`
    );


    showBattleResult(
        winner || 0
    );

}


// =========================================================
// START BATTLE
// =========================================================

function startBattle() {

    if (battleRunning) {
        return;
    }


    if (
        player1Fighters.length === 0 ||
        player2Fighters.length === 0
    ) {

        logBattle(
            "❌ Both players need at least one fighter!"
        );

        return;

    }


    // =====================================================
    // RESET BATTLE STATE
    // =====================================================

    round =
        1;


    battleRunning =
        true;


    battleStats = {

        totalDamage: 0,

        totalKOs: 0,

        totalSpecials: 0,

        completedRounds: 0

    };


    // Remove previous result
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


    // =====================================================
    // RESET FIGHTERS
    // =====================================================

    [
        ...player1Fighters,
        ...player2Fighters

    ].forEach(
        fighter => {

            fighter.hp =
                fighter.maxHp;

            fighter.alive =
                true;

            fighter.abilityUsed =
                false;

            fighter.specialUsed =
                false;

            fighter.koShown =
                false;

            fighter.lastCritical =
                false;

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
    );


    // =====================================================
    // CLEAR LOG
    // =====================================================

    if (battleLog) {

        battleLog.innerHTML = "";

    }


    // =====================================================
    // INITIAL UI
    // =====================================================

    updateBattleUI();


    if (battleStatus) {

        battleStatus.textContent =
            "⚔️ BATTLE STARTED!";

    }


    logBattle(
        "<strong>🔥 BATTLE START!</strong>"
    );


    adgShowAnnouncement(
        "⚔️ BATTLE START!"
    );


    // =====================================================
    // START FIRST ROUND
    // =====================================================

    setTimeout(
        () => {

            startRound();

        },
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
// INITIAL DISPLAY
// =========================================================

updateBattleUI();


if (battleStatus) {

    battleStatus.textContent =
        "⚔️ READY FOR BATTLE";

}


// =========================================================
// PREVENT EMPTY TEAM BATTLE
// =========================================================

if (
    player1Fighters.length === 0 ||
    player2Fighters.length === 0
) {

    if (battleStatus) {

        battleStatus.textContent =
            "⚠️ Both players need fighters.";

    }

}


// =========================================================
// END DOMCONTENTLOADED
// =========================================================

});