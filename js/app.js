const playBtn = document.getElementById("playBtn");
const animeMenu = document.getElementById("animeMenu");

playBtn.addEventListener("click", () => {
  playBtn.style.display = "none";
  animeMenu.classList.remove("hidden");
});

const animeButtons = document.querySelectorAll(".animeBtn");

animeButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.disabled) return;

    const anime = button.dataset.anime;

    alert("Welcome to ADG!\n\nSelected Anime: " + anime + "\n\nDraft Screen coming next!");
  });
});























