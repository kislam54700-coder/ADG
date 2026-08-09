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
// LOCAL CHARACTER IMAGES
// ============================================================
//
// Only Luffy, Zoro and Sanji for our first test.
// We will add the other characters after this works.
//

const CHARACTER_IMAGES = {

    "Luffy":
        "assets/characters/one-piece/luffy.jpg",

    "Zoro":
        "assets/characters/one-piece/zoro.jpg",

    "Sanji":
        "assets/characters/one-piece/sanji.jpg"

};


// ============================================================
// GET CHARACTER IMAGE
// ============================================================

function getCharacterImage(character) {

    return CHARACTER_IMAGES[character] || "";


}


// ============================================================
// GET CHARACTER DATA
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

