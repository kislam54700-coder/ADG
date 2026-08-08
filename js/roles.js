document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
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
       ROLES
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
       LOAD DRAFTED TEAMS
       ===================================================== */

    let player1Team = [];
    let player2Team = [];

    try {

        player1Team =
            JSON.parse(
                localStorage.getItem("player1Team")
            ) || [];

        player2Team =
            JSON.parse(
                localStorage.getItem("player2Team")
            ) || [];

    } catch (error) {

        console.error(
            "Could not load drafted teams:",
            error
        );

    }


    /* =====================================================
       ROLE DATA
       ===================================================== */

    const player1Roles = {};
    const player2Roles = {};


    /* =====================================================
       CHECK TEAM SIZE
       ===================================================== */

    if (
        player1Team.length !== 6 ||
        player2Team.length !== 6
    ) {

        roleStatus.textContent =
            "⚠️ Both players must have 6 characters.";

        roleStatus.classList.add("error");

        continueBattleBtn.disabled = true;

        return;
    }


    /* =====================================================
       CREATE CHARACTER CARD
       ===================================================== */

    function createCharacterCard(
        character,
        playerNumber
    ) {

        const card =
            document.createElement("div");

        card.className =
            "character-card";

        card.dataset.character =
            character;

        card.dataset.player =
            playerNumber;


        /* Character image */

        const image =
            document.createElement("div");

        image.className =
            "character-image";

        image.innerHTML =
            '<span style="' +
            'display:flex;' +
            'width:100%;' +
            'height:100%;' +
            'align-items:center;' +
            'justify-content:center;' +
            'font-size:42px;' +
            '">' +
            '🎴' +
            '</span>';


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
            "CHOOSE ROLE";


        const roleOptions =
            document.createElement("div");

        roleOptions.className =
            "role-options";


        /* Create role buttons */

        ROLES.forEach(function (role) {

            const button =
                document.createElement("button");

            button.type =
                "button";

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
                function () {

                    assignRole(
                        playerNumber,
                        character,
                        role.id,
                        card
                    );

                }
            );


            roleOptions.appendChild(
                button
            );

        });


        selector.appendChild(
            selectorTitle
        );

        selector.appendChild(
            roleOptions
        );


        card.appendChild(
            image
        );

        card.appendChild(
            name
        );

        card.appendChild(
            selector
        );


        return card;
    }


    /* =====================================================
       DISPLAY TEAMS
       ===================================================== */

    function renderTeams() {

        player1Container.innerHTML = "";
        player2Container.innerHTML = "";


        player1Team.forEach(
            function (character) {

                const card =
                    createCharacterCard(
                        character,
                        1
                    );

                player1Container.appendChild(
                    card
                );

            }
        );


        player2Team.forEach(
            function (character) {

                const card =
                    createCharacterCard(
                        character,
                        2
                    );

                player2Container.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       CHECK DUPLICATE ROLE
       ===================================================== */

    function roleAlreadyUsed(
        playerNumber,
        role,
        currentCharacter
    ) {

        const roles =
            playerNumber === 1
                ? player1Roles
                : player2Roles;


        for (
            const character in roles
        ) {

            if (
                character !== currentCharacter &&
                roles[character] === role
            ) {

                return true;

            }

        }


        return false;
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
            roleAlreadyUsed(
                playerNumber,
                role,
                character
            )
        ) {

            roleStatus.textContent =
                "⚠️ " +
                getRoleName(role) +
                " is already assigned to another character.";

            roleStatus.classList.remove(
                "valid"
            );

            roleStatus.classList.add(
                "error"
            );

            return;
        }


        /* Save role */

        roles[character] =
            role;


        /* Remove previous selection */

        const buttons =
            card.querySelectorAll(
                ".role-option"
            );


        buttons.forEach(
            function (button) {

                button.classList.remove(
                    "selected"
                );

            }
        );


        /* Highlight selected role */

        const selectedButton =
            card.querySelector(
                '.role-option[data-role="' +
                role +
                '"]'
            );


        if (selectedButton) {

            selectedButton.classList.add(
                "selected"
            );

        }


        card.classList.remove(
            "role-error"
        );


        updateCounts();

        validateTeams();

    }


    /* =====================================================
       ROLE NAME
       ===================================================== */

    function getRoleName(roleId) {

        for (
            let i = 0;
            i < ROLES.length;
            i++
        ) {

            if (
                ROLES[i].id === roleId
            ) {

                return (
                    ROLES[i].emoji +
                    " " +
                    ROLES[i].name
                );

            }

        }


        return roleId;
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
            p1Count + " / 6";

        player2RoleCount.textContent =
            p2Count + " / 6";

    }


    /* =====================================================
       VALIDATE
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


        continueBattleBtn.disabled =
            true;

        roleStatus.classList.remove(
            "valid"
        );


        /* Player 1 incomplete */

        if (
            p1Count < 6
        ) {

            const remaining =
                6 - p1Count;

            roleStatus.textContent =
                "Player 1 needs " +
                remaining +
                " more role" +
                (remaining === 1 ? "" : "s") +
                ".";

            return;
        }


        /* Player 2 incomplete */

        if (
            p2Count < 6
        ) {

            const remaining =
                6 - p2Count;

            roleStatus.textContent =
                "Player 2 needs " +
                remaining +
                " more role" +
                (remaining === 1 ? "" : "s") +
                ".";

            return;
        }


        /* Both teams complete */

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
        function () {

            const p1Count =
                Object.keys(
                    player1Roles
                ).length;

            const p2Count =
                Object.keys(
                    player2Roles
                ).length;


            if (
                p1Count !== 6 ||
                p2Count !== 6
            ) {

                roleStatus.textContent =
                    "⚠️ Assign all 6 roles to both teams.";

                roleStatus.classList.remove(
                    "valid"
                );

                roleStatus.classList.add(
                    "error"
                );

                return;
            }


            /* Save */

            saveRoles();


            /* Go to existing battle system */

            window.location.href =
                "battle.html";

        }
    );


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    renderTeams();

    updateCounts();

    validateTeams();


});

