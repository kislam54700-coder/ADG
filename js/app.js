document.addEventListener("DOMContentLoaded", () => {
  const animeButtons = document.querySelectorAll(".animeBtn");

  animeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Ignore disabled buttons
      if (button.disabled) return;

      // Get selected anime
      const anime = button.dataset.anime;

      // Save selected anime
      localStorage.setItem("selectedAnime", anime);

      // Go to Draft/Game screen
      window.location.href = "game.html";
    });
  });
});










































