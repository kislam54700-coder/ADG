document.addEventListener("DOMContentLoaded", () => {

    const player1Roles = document.getElementById("player1Roles");
    const player2Roles = document.getElementById("player2Roles");

    const player1Team = JSON.parse(
        localStorage.getItem("player1Team")
    ) || [];

    const player2Team = JSON.parse(
        localStorage.getItem("player2Team")
    ) || [];

    player1Team.forEach(character => {

        const p = document.createElement("p");
        p.textContent = character;

        player1Roles.appendChild(p);

    });

    player2Team.forEach(character => {

        const p = document.createElement("p");
        p.textContent = character;

        player2Roles.appendChild(p);

    });

});