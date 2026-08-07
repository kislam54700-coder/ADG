document.addEventListener("DOMContentLoaded", () => {
    

    const animeTitle = document.getElementById("animeTitle");
    const drawBtn = document.getElementById("drawBtn");
    const characterCard = document.getElementById("characterCard");

    const selectedAnime = localStorage.getItem("selectedAnime");

    if (animeTitle) {
        animeTitle.textContent = selectedAnime || "No Anime Selected";
    }


    drawBtn.addEventListener("click", () => {

        if (selectedAnime === "One Piece") {

            const randomIndex = Math.floor(
                Math.random() * ONE_PIECE_CHARACTERS.length
            );

            const character = ONE_PIECE_CHARACTERS[randomIndex];

            characterCard.innerHTML = `
                <h2>${character}</h2>
                <p>Selected Character</p>
            `;

        }

    });

});