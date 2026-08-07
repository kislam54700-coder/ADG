document.addEventListener("DOMContentLoaded", () => {
  const selectedAnime = localStorage.getItem("selectedAnime");

  if (!selectedAnime) {
    window.location.href = "index.html";
    return;
  }

  const animeTitle = document.getElementById("animeTitle");

  if (animeTitle) {
    animeTitle.textContent = selectedAnime + " Draft";
  }
});









