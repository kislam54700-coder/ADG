
document.addEventListener("DOMContentLoaded", () => {

    const animeButtons =
        document.querySelectorAll(".animeBtn");

    animeButtons.forEach((button) => {

        button.addEventListener("click", () => {

            if (button.disabled) return;

            const anime =
                button.dataset.anime;

            localStorage.setItem(
                "selectedAnime",
                anime
            );

            window.location.href =
                "game.html";

        });

    });

});
```
