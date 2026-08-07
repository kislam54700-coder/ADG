document.addEventListener("DOMContentLoaded", () => {

    const player1Roles = document.getElementById("player1Roles");
    const player2Roles = document.getElementById("player2Roles");
    const startBattleBtn = document.getElementById("startBattleBtn");

    const player1Team =
        JSON.parse(localStorage.getItem("player1Team")) || [];

    const player2Team =
        JSON.parse(localStorage.getItem("player2Team")) || [];

    const roles = [
        "Captain",
        "Vice Captain",
        "Tank",
        "Healer",
        "Support",
        "Wildcard"
    ];

    const player1Selections = {};
    const player2Selections = {};

    function createTeam(team, container, selections) {

        container.innerHTML = "";

        team.forEach(character => {

            const row = document.createElement("div");
            row.className = "role-row";

            const name = document.createElement("span");
            name.textContent = character;

            const select = document.createElement("select");

            const firstOption = document.createElement("option");
            firstOption.value = "";
            firstOption.textContent = "Select Role";

            select.appendChild(firstOption);

            const usedRoles = Object.values(selections);

            roles.forEach(role => {

                if (
                    !usedRoles.includes(role) ||
                    selections[character] === role
                ) {

                    const option = document.createElement("option");

                    option.value = role;
                    option.textContent = role;

                    if (selections[character] === role) {
                        option.selected = true;
                    }

                    select.appendChild(option);
                }

            });

            select.addEventListener("change", () => {

                if (select.value === "") {
                    delete selections[character];
                } else {
                    selections[character] = select.value;
                }

                refresh();
            });

            row.appendChild(name);
            row.appendChild(select);

            container.appendChild(row);
        });
    }

    function checkFinished() {

        const player1Ready =
            Object.keys(player1Selections).length === 6;

        const player2Ready =
            Object.keys(player2Selections).length === 6;

        if (player1Ready && player2Ready) {

            localStorage.setItem(
                "player1Roles",
                JSON.stringify(player1Selections)
            );

            localStorage.setItem(
                "player2Roles",
                JSON.stringify(player2Selections)
            );

            startBattleBtn.classList.remove("hidden");

        } else {


            startBattleBtn.classList.add("hidden");
  
        }
    }

    function refresh() {

        createTeam(
            player1Team,
            player1Roles,
            player1Selections
        );

        createTeam(
            player2Team,
            player2Roles,
            player2Selections
        );

        checkFinished();
    }

    startBattleBtn.addEventListener("click", () => {

        window.location.href = "battle.html";

    });

    refresh();


});