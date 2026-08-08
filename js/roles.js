```javascript
document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ADG ROLE ASSIGNMENT
       ===================================================== */

    const player1Container =
        document.getElementById("player1Characters");

    const player2Container =
        document.getElementById("player2Characters");

    const player1RoleCount =
        document.getElementById("player1RoleCount");

    const player2RoleCount =
        document.getElementById("player2RoleCount");

    const roleStatus =
        document.getElementById("roleStatus");

    const continueBattleBtn =
        document.getElementById("continueBattleBtn");


    /* =====================================================
       AVAILABLE ROLES
       ===================================================== */

    const ROLES = [
        {
            id: "leader",
            emoji: "👑",
            name: "Leader"
        },
        {
            id: "attacker",
            emoji: "⚔️",
            name: "Attacker"
        },
        {
            id: "defender",
            emoji: "🛡️",
            name: "Defender"
        },
        {
            id: "support",
            emoji: "❤️",
            name: "Support"
        },
        {
            id: "specialist",
            emoji: "⭐",
            name: "Specialist"
        },
        {
            id: "wildcard",
            emoji: "☠️",
            name: "Wildcard"
        }
    ];


    /* =====================================================
       LOAD TEAMS
       ===================================================== */

    const player1Team =
        JSON.parse(
            localStorage.getItem("player1Team")
        ) || [];

    const player2Team =
        JSON.parse(
            localStorage.getItem("player2Team")
        ) || [];


    /* =====================================================
       ROLE STORAGE
       ===================================================== */

    const player1Roles = {};
    const player2Roles = {};


    /* =====================================================
       VALIDATE TEAMS
       ===================================================== */

    if (
        player1Team.length !== 6 ||
        player2Team.length !== 6
    ) {

        roleStatus.textContent =
            "⚠️ Both teams must contain 6 characters.";

        roleStatus.classList.add("error");

        continueBattleBtn.disabled = true;

        return;
    }


    /* =====================================================
       CREATE CHARACTER CARD
       ===================================================== */

    function createCharacterCard(
        character,
        playerNumber,
        index
    ) {

        const card =
            document.createElement("div");

        card.className = "character-card";

        card.dataset.character = character;
        card.dataset.player = playerNumber;


        /* Character image */

        const image =
            document.createElement("div");

        image.className =
            "character-image";

        /*
         * Your database currently stores character
         * names. We therefore use a clean placeholder
         * until character image paths are added.
         */

        image.innerHTML = `
            <span
                style="
                    display:flex;
                    width:100%;
                    height:100%;
                    align-items:center;
                    justify-content:center;
                    font-size:42px;
                "
            >
                🎴
            </span>
        `;


        /* Character name */

        const name =
            document.createElement("div");

        name.className =
            "character-name";

        name.textContent =
            character;


        /* Role selector */

        const selector =
            document.createElement("div");

        selector.className =
            "role-selector";


        const selectorTitle =
            document.createElement("div");

        selectorTitle.className =
            "role-selector-title";

        selectorTitle.textContent =
            "Choose Role";


        /* Role buttons */

        const roleOptions =
            document.createElement("div");

        roleOptions.className =
            "role-options";


        ROLES.forEach(role => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "role-option";

            button.dataset.role =
                role.id;

            button.dataset.player =
                playerNumber;

            button.dataset.character =
                character;

            button.title =
                role.name;

            button.textContent =
                role.emoji;


            button.addEventListener(
                "click",
                () => {

                    assignRole(
                        playerNumber,
                        character,
                        role.id,
                        card
                    );

                }
            );


            roleOptions.appendChild(button);

        });


        selector.appendChild(selectorTitle);
        selector.appendChild(roleOptions);

        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(selector);

        return card;
    }


    /* =====================================================
       RENDER PLAYER TEAMS
       ===================================================== */

    function renderTeams() {

        player1Container.innerHTML = "";
        player2Container.innerHTML = "";


        player1Team.forEach(
            (character, index) => {

                const card =
                    createCharacterCard(
                        character,
                        1,
                        index
                    );

                player1Container.appendChild(card);

            }
        );


        player2Team.forEach(
            (character, index) => {

                const card =
                    createCharacterCard(
                        character,
                        2,
                        index
                    );

                player2Container.appendChild(card);

            }
        );

    }


    /* =====================================================
       CHECK IF ROLE IS ALREADY USED
       ===================================================== */

    function isRoleAlreadyUsed(
        playerNumber,
        role,
        currentCharacter
    ) {

        const roles =
            playerNumber === 1
                ? player1Roles
                : player2Roles;


        return Object.keys(roles).some(
            character =>
                character !== currentCharacter &&
                roles[character] === role
        );

    }


    /* =====================================================
       ASSIGN ROLE
       ===================================================== */

    function assignRole(
        playerNumber,
        character,
        role,
        card
    ) {

        const roles =
            playerNumber === 1
                ? player1Roles
                : player2Roles;


        /* Prevent duplicate role */

        if (
            isRoleAlreadyUsed(
                playerNumber,
                role,
                character
            )
        ) {

            roleStatus.textContent =
                `⚠️ ${getRoleName(role)} is already assigned to another character.`;

            roleStatus.classList.remove("valid");

            roleStatus.classList.add("error");

            return;
        }


        /* Save role */

        roles[character] = role;


        /* Remove previous selected states */

        const buttons =
            card.querySelectorAll(
                ".role-option"
            );


        buttons.forEach(button => {

            button.classList.remove(
                "selected"
            );

        });


        /* Highlight selected role */

        const selectedButton =
            card.querySelector(
                `.role-option[data-role="${role}"]`
            );


        if (selectedButton) {

            selectedButton.classList.add(
                "selected"
            );

        }


        /* Remove card error */

        card.classList.remove(
            "role-error"
        );


        updateCounts();

        validateTeams();

    }


    /* =====================================================
       GET ROLE NAME
       ===================================================== */

    function getRoleName(roleId) {

        const role =
            ROLES.find(
                item =>
                    item.id === roleId
            );


        return role
            ? `${role.emoji} ${role.name}`
            : roleId;
    }


    /* =====================================================
       UPDATE COUNTERS
       ===================================================== */

    function updateCounts() {

        const p1Count =
            Object.keys(
                player1Roles
            ).length;

        const p2Count =
            Object.keys(
                player2Roles
            ).length;


        player1RoleCount.textContent =
            `${p1Count} / 6`;

        player2RoleCount.textContent =
            `${p2Count} / 6`;

    }


    /* =====================================================
       VALIDATE TEAMS
       ===================================================== */

    function validateTeams() {

        const p1Count =
            Object.keys(
                player1Roles
            ).length;

        const p2Count =
            Object.keys(
                player2Roles
            ).length;


        /* Not complete */

        if (
            p1Count !== 6 ||
            p2Count !== 6
        ) {

            continueBattleBtn.disabled =
                true;


            roleStatus.classList.remove(
                "valid"
            );


            const remainingP1 =
                6 - p1Count;

            const remainingP2 =
                6 - p2Count;


            if (remainingP1 > 0) {

                roleStatus.textContent =
                    `Player 1 needs ${remainingP1} more role${
                        remainingP1 === 1 ? "" : "s"
                    }.`;

            } else {

                roleStatus.textContent =
                    `Player 2 needs ${remainingP2} more role${
                        remainingP2 === 1 ? "" : "s"
                    }.`;

            }


            return;
        }


        /* Both complete */

        continueBattleBtn.disabled =
            false;


        roleStatus.classList.remove(
            "error"
        );

        roleStatus.classList.add(
            "valid"
        );


        roleStatus.textContent =
            "✅ Both teams have valid roles. Ready for battle!";

    }


    /* =====================================================
       SAVE ROLES
       ===================================================== */

    function saveRoles() {

        localStorage.setItem(
            "player1Roles",
            JSON.stringify(
                player1Roles
            )
        );


        localStorage.setItem(
            "player2Roles",
            JSON.stringify(
                player2Roles
            )
        );

    }


    /* =====================================================
       CONTINUE TO BATTLE
       ===================================================== */

    continueBattleBtn.addEventListener(
        "click",
        () => {

            if (
                Object.keys(player1Roles).length !== 6 ||
                Object.keys(player2Roles).length !== 6
            ) {

                roleStatus.textContent =
                    "⚠️ Both teams must have all 6 roles assigned.";

                roleStatus.classList.remove(
                    "valid"
                );

                roleStatus.classList.add(
                    "error"
                );

                return;
            }


            saveRoles();


            /*
             * Do not modify battle.js.
             * Simply send the game to the existing
             * battle page.
             */

            window.location.href =
                "battle.html";

        }
    );


    /* =====================================================
       INITIALIZE
       ===================================================== */

    renderTeams();

    updateCounts();

    validateTeams();

});
```
