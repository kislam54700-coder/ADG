document.addEventListener("DOMContentLoaded", () => {

    const player1Roles = document.getElementById("player1Roles");
    const player2Roles = document.getElementById("player2Roles");
    const startBattleBtn = document.getElementById("startBattleBtn");

    const player1Team = JSON.parse(localStorage.getItem("player1Team")) || [];
    const player2Team = JSON.parse(localStorage.getItem("player2Team")) || [];

    const roles = [
        "",
        "👑 Captain",
        "⚔ Vice Captain",
        "🛡 Tank",
        "❤️ Healer",
        "⭐ Support",
        "☠ Wildcard"
    ];

    function createRoleSelector(character, container, player) {

        const row = document.createElement("div");
        row.style.marginBottom = "15px";

        const name = document.createElement("strong");
        name.textContent = character;

        const select = document.createElement("select");

        roles.forEach(role => {
            const option = document.createElement("option");
            option.value = role;
            option.textContent = role === "" ? "Select Role" : role;
            select.appendChild(option);
        });

        select.dataset.player = player;
        select.dataset.character = character;

        row.appendChild(name);
        row.appendChild(document.createElement("br"));
        row.appendChild(select);

        container.appendChild(row);
    }

    player1Team.forEach(character =>
        createRoleSelector(character, player1Roles, 1)
    );

    player2Team.forEach(character =>
        createRoleSelector(character, player2Roles, 2)
    );

});