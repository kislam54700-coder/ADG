// ============================================================
// ADG - ONE PIECE CHARACTER DATABASE
// ============================================================

const ONE_PIECE_CHARACTERS = [

    "Luffy",
    "Zoro",
    "Sanji",
    "Nami",
    "Usopp",
    "Chopper",
    "Robin",
    "Franky",
    "Brook",
    "Jinbe",

    "Shanks",
    "Benn Beckman",
    "Yasopp",
    "Lucky Roux",

    "Gol D. Roger",
    "Silvers Rayleigh",
    "Scopper Gaban",

    "Portgas D. Ace",
    "Sabo",
    "Monkey D. Dragon",
    "Garp",

    "Trafalgar Law",
    "Eustass Kid",
    "Killer",
    "Jewelry Bonney",
    "Basil Hawkins",
    "X Drake",
    "Scratchmen Apoo",
    "Capone Bege",
    "Urouge",

    "Whitebeard",
    "Marco",
    "Jozu",
    "Vista",
    "Izo",

    "Kaido",
    "King",
    "Queen",
    "Jack",
    "Yamato",

    "Big Mom",
    "Katakuri",
    "Smoothie",
    "Cracker",
    "Perospero",

    "Blackbeard",
    "Shiryu",
    "Van Augur",
    "Jesus Burgess",
    "Laffitte",
    "Doc Q",
    "Avalo Pizarro",

    "Mihawk",
    "Crocodile",
    "Doflamingo",
    "Boa Hancock",
    "Buggy",

    "Akainu",
    "Aokiji",
    "Kizaru",
    "Fujitora",
    "Ryokugyu",

    "Sengoku",
    "Tsuru",
    "Koby",
    "Helmeppo",
    "Smoker",
    "Tashigi",

    "Enel",
    "Rob Lucci",
    "Kaku",
    "Blueno",
    "Magellan",
    "Caesar Clown",
    "Gecko Moria",
    "Bartholomew Kuma",

    "Oden",
    "Kin'emon",
    "Denjiro",
    "Kawamatsu",
    "Raizo",
    "Kikunojo",
    "Ashura Doji",
    "Inuarashi",
    "Nekomamushi",

    "Vegapunk",
    "Stussy",
    "Sentomaru",

    "Imu",
    "Saint Saturn",
    "Saint Mars",
    "Saint Warcury",
    "Saint Nusjuro",
    "Saint Ju Peter",

    "Arlong",
    "Don Krieg",
    "Mr. 1",
    "Mr. 2 Bon Clay",
    "Mr. 3",
    "Mr. 5",
    "Bellamy",
    "Hody Jones"
];


// ============================================================
// IMAGE NAME CONVERTER
// ============================================================

function characterImageName(character) {

    return character
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}


// ============================================================
// CHARACTER IMAGE
// ============================================================

function getCharacterImage(character) {

    const filename = characterImageName(character);

    return `https://onepiece.fandom.com/wiki/Special:Redirect/file/${filename}.png`;
}


// ============================================================
// CHARACTER DATA
// ============================================================

function getCharacterData(character) {

    return {
        name: character,
        image: getCharacterImage(character)
    };
}


// ============================================================
// GLOBAL
// ============================================================

window.ONE_PIECE_CHARACTERS = ONE_PIECE_CHARACTERS;

window.getCharacterImage = getCharacterImage;

window.getCharacterData = getCharacterData;

// ============================================================
// ADG CHARACTER IMAGE SYSTEM - TEST
// Luffy / Zoro / Sanji
// ============================================================

const CHARACTER_IMAGES = {

    "Luffy":
        "https://onepiece.fandom.com/wiki/Special:Redirect/file/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png",

    "Zoro":
        "https://onepiece.fandom.com/wiki/Special:Redirect/file/Roronoa_Zoro_Anime_Post_Timeskip_Infobox.png",

    "Sanji":
        "https://onepiece.fandom.com/wiki/Special:Redirect/file/Sanji_Anime_Post_Timeskip_Infobox.png"

};


// ============================================================
// GET CHARACTER IMAGE
// ============================================================

function getCharacterImage(character) {

    return CHARACTER_IMAGES[character] || "";
}


// ============================================================
// EXPORT
// ============================================================

window.getCharacterImage = getCharacterImage;