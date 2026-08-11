```javascript
/* =========================================================
   ADG — DATABASE.JS
   Anime Character Database
   ========================================================= */

"use strict";


/* =========================================================
   IMAGE PATH CONFIGURATION
   ========================================================= */

/*
   GitHub Pages folder structure:

   assets/
      characters/
         one-piece/
         naruto/
         dragon-ball/
         bleach/
         ...

   IMPORTANT:
   Change this only if your actual folder name is different.
*/

const ADG_IMAGE_BASE =
    "assets/characters";


/* =========================================================
   IMAGE NAME NORMALIZER
   ========================================================= */

function normalizeCharacterImageName(name) {

    return String(name || "")
        .trim()
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, " ");

}


/* =========================================================
   IMAGE CANDIDATES
   ========================================================= */

function getCharacterImageCandidates(
    name,
    anime = "One Piece"
) {

    const cleanName =
        normalizeCharacterImageName(name);


    const animeFolderMap = {

        "One Piece":
            "one-piece",

        "Naruto":
            "naruto",

        "Dragon Ball":
            "dragon-ball",

        "Bleach":
            "bleach",

        "My Hero Academia":
            "my-hero-academia",

        "Attack on Titan":
            "attack-on-titan",

        "Jujutsu Kaisen":
            "jujutsu-kaisen",

        "Demon Slayer":
            "demon-slayer",

        "Hunter x Hunter":
            "hunter-x-hunter",

        "Fullmetal Alchemist":
            "fullmetal-alchemist",

        "Death Note":
            "death-note",

        "Code Geass":
            "code-geass",

        "JoJo's Bizarre Adventure":
            "jojos-bizarre-adventure",

        "One Punch Man":
            "one-punch-man",

        "Spy x Family":
            "spy-x-family",

        "Chainsaw Man":
            "chainsaw-man",

        "Black Clover":
            "black-clover",

        "Fairy Tail":
            "fairy-tail",

        "Gintama":
            "gintama",

        "Tokyo Ghoul":
            "tokyo-ghoul",

        "Sword Art Online":
            "sword-art-online",

        "Haikyu!!":
            "haikyu",

        "Mob Psycho 100":
            "mob-psycho-100",

        "Slime Isekai":
            "slime-isekai"

    };


    const folder =
        animeFolderMap[anime] ||
        "one-piece";


    const encoded =
        encodeURIComponent(
            cleanName
        );


    return [

        `${ADG_IMAGE_BASE}/${folder}/${cleanName}.jpg`,

        `${ADG_IMAGE_BASE}/${folder}/${encoded}.jpg`,

        `${ADG_IMAGE_BASE}/${folder}/${cleanName}.png`,

        `${ADG_IMAGE_BASE}/${folder}/${encoded}.png`

    ];

}


/* =========================================================
   ONE PIECE
   ========================================================= */

const ONE_PIECE_CHARACTERS = [

    "Monkey D. Luffy",
    "Roronoa Zoro",
    "Sanji",
    "Nami",
    "Usopp",
    "Tony Tony Chopper",
    "Nico Robin",
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
    "Monkey D. Garp",
    "Trafalgar D. Water Law",
    "Eustass Kid"

];


/* =========================================================
   NARUTO
   ========================================================= */

const NARUTO_CHARACTERS = [

    "Naruto Uzumaki",
    "Sasuke Uchiha",
    "Sakura Haruno",
    "Kakashi Hatake",
    "Itachi Uchiha",
    "Jiraiya",
    "Tsunade",
    "Orochimaru",
    "Gaara",
    "Rock Lee",
    "Neji Hyuga",
    "Hinata Hyuga",
    "Shikamaru Nara",
    "Choji Akimichi",
    "Ino Yamanaka",
    "Kiba Inuzuka",
    "Shino Aburame",
    "Tenten",
    "Might Guy",
    "Asuma Sarutobi",
    "Kurenai Yuhi",
    "Minato Namikaze",
    "Kushina Uzumaki",
    "Obito Uchiha",
    "Madara Uchiha",
    "Hashirama Senju",
    "Tobirama Senju",
    "Hiruzen Sarutobi",
    "Danzo Shimura",
    "Sai",
    "Yamato",
    "Killer Bee",
    "Darui",
    "Ohnoki",
    "Mei Terumi",
    "Nagato (Pain)",
    "Konan",
    "Deidara",
    "Sasori",
    "Hidan",
    "Kakuzu",
    "Kisame Hoshigaki",
    "Zetsu",
    "Kabuto Yakushi",
    "Kimimaro"

];


/* =========================================================
   DRAGON BALL
   ========================================================= */

const DRAGON_BALL_CHARACTERS = [

    "Goku",
    "Vegeta",
    "Gohan",
    "Piccolo",
    "Trunks",
    "Goten",
    "Krillin",
    "Yamcha",
    "Tien Shinhan",
    "Chiaotzu",
    "Master Roshi",
    "Bulma",
    "Chi-Chi",
    "Videl",
    "Android 18",
    "Android 17",
    "Android 16",
    "Frieza",
    "Cell",
    "Majin Buu",
    "Beerus",
    "Whis",
    "Jiren",
    "Hit",
    "Cabba",
    "Kale",
    "Caulifla",
    "Toppo",
    "Dyspo",
    "Zamasu",
    "Goku Black",
    "Broly",
    "Raditz",
    "Nappa",
    "Bardock"

];


/* =========================================================
   BLEACH
   ========================================================= */

const BLEACH_CHARACTERS = [

    "Ichigo Kurosaki",
    "Rukia Kuchiki",
    "Orihime Inoue",
    "Yasutora Sado (Chad)",
    "Uryu Ishida",
    "Kisuke Urahara",
    "Yoruichi Shihoin",
    "Renji Abarai",
    "Byakuya Kuchiki",
    "Sosuke Aizen",
    "Gin Ichimaru",
    "Kaname Tosen",
    "Kenpachi Zaraki",
    "Yachiru Kusajishi",
    "Toshiro Hitsugaya",
    "Rangiku Matsumoto",
    "Shunsui Kyoraku",
    "Jushiro Ukitake",
    "Genryusai Shigekuni Yamamoto",
    "Sajin Komamura",
    "Mayuri Kurotsuchi",
    "Nemu Kurotsuchi",
    "Retsu Unohana",
    "Grimmjow Jaegerjaquez",
    "Ulquiorra Cifer",
    "Tier Halibel",
    "Nelliel Tu Odelschwanck",
    "Coyote Starrk",
    "Baraggan Louisenbairn",
    "Nnoitra Gilga",
    "Shinji Hirako",
    "Hiyori Sarugaki",
    "Kensei Muguruma",
    "Yhwach"

];


/* =========================================================
   MY HERO ACADEMIA
   ========================================================= */

const MY_HERO_ACADEMIA_CHARACTERS = [

    "Izuku Midoriya",
    "Katsuki Bakugo",
    "Shoto Todoroki",
    "Ochaco Uraraka",
    "Tenya Iida",
    "Tsuyu Asui",
    "Eijiro Kirishima",
    "Mina Ashido",
    "Momo Yaoyorozu",
    "Fumikage Tokoyami",
    "Denki Kaminari",
    "Kyoka Jiro",
    "Mezo Shoji",
    "Hantaro Sero",
    "Mashirao Ojiro",
    "Toru Hagakure",
    "Rikido Sato",
    "Koji Koda",
    "Yuga Aoyama",
    "Minoru Mineta",
    "All Might",
    "Eraser Head (Shota Aizawa)",
    "Endeavor",
    "Hawks",
    "Best Jeanist",
    "Mirko",
    "Gran Torino",
    "Tomura Shigaraki",
    "All For One",
    "Dabi",
    "Himiko Toga",
    "Twice",
    "Overhaul",
    "Stain",
    "Mirio Togata"

];


/* =========================================================
   ATTACK ON TITAN
   ========================================================= */

const ATTACK_ON_TITAN_CHARACTERS = [

    "Eren Yeager",
    "Mikasa Ackerman",
    "Armin Arlert",
    "Levi Ackerman",
    "Erwin Smith",
    "Hange Zoe",
    "Jean Kirstein",
    "Sasha Blouse",
    "Conny Springer",
    "Historia Reiss",
    "Ymir",
    "Reiner Braun",
    "Bertholdt Hoover",
    "Annie Leonhart",
    "Zeke Yeager",
    "Gabi Braun",
    "Falco Grice",
    "Pieck Finger",
    "Porco Galliard",
    "Colt Grice",
    "Kenny Ackerman",
    "Rod Reiss",
    "Grisha Yeager",
    "Dot Pixis",
    "Hitch Dreyse"

];


/* =========================================================
   JUJUTSU KAISEN
   ========================================================= */

const JUJUTSU_KAISEN_CHARACTERS = [

    "Yuji Itadori",
    "Megumi Fushiguro",
    "Nobara Kugisaki",
    "Satoru Gojo",
    "Kento Nanami",
    "Suguru Geto",
    "Ryomen Sukuna",
    "Maki Zen'in",
    "Toge Inumaki",
    "Panda",
    "Yuta Okkotsu",
    "Aoi Todo",
    "Mai Zen'in",
    "Kasumi Miwa",
    "Kokichi Muta (Mechamaru)",
    "Noritoshi Kamo",
    "Momo Nishimiya",
    "Utahime Iori",
    "Mahito",
    "Jogo",
    "Hanami",
    "Choso",
    "Toji Fushiguro",
    "Suguru Geto (Brain)",
    "Naobito Zen'in"

];


/* =========================================================
   DEMON SLAYER
   ========================================================= */

const DEMON_SLAYER_CHARACTERS = [

    "Tanjiro Kamado",
    "Nezuko Kamado",
    "Zenitsu Agatsuma",
    "Inosuke Hashibira",
    "Kanao Tsuyuri",
    "Genya Shinazugawa",
    "Giyu Tomioka",
    "Shinobu Kocho",
    "Kyojuro Rengoku",
    "Tengen Uzui",
    "Mitsuri Kanroji",
    "Muichiro Tokito",
    "Gyomei Himejima",
    "Obanai Iguro",
    "Sanemi Shinazugawa",
    "Muzan Kibutsuji",
    "Kokushibo",
    "Doma",
    "Akaza",
    "Hantengu",
    "Gyokko",
    "Gyutaro",
    "Daki",
    "Enmu",
    "Rui"

];


/* =========================================================
   HUNTER X HUNTER
   ========================================================= */

const HUNTER_X_HUNTER_CHARACTERS = [

    "Gon Freecss",
    "Killua Zoldyck",
    "Kurapika",
    "Leorio Paradinight",
    "Hisoka Morow",
    "Chrollo Lucilfer",
    "Illumi Zoldyck",
    "Isaac Netero",
    "Meruem",
    "Neferpitou",
    "Shaiapouf",
    "Menthuthuyoupi",
    "Feitan Portor",
    "Phinks Magcub",
    "Machi Komacine",
    "Nobunaga Hazama",
    "Shizuku Murasaki",
    "Shalnark",
    "Uvogin",
    "Pakunoda",
    "Ging Freecss",
    "Kite",
    "Biscuit Krueger",
    "Alluka Zoldyck",
    "Silva Zoldyck"

];


/* =========================================================
   FULLMETAL ALCHEMIST
   ========================================================= */

const FULLMETAL_ALCHEMIST_CHARACTERS = [

    "Edward Elric",
    "Alphonse Elric",
    "Winry Rockbell",
    "Roy Mustang",
    "Riza Hawkeye",
    "Maes Hughes",
    "Alex Louis Armstrong",
    "Olivier Mira Armstrong",
    "Izumi Curtis",
    "Ling Yao",
    "Lan Fan",
    "May Chang",
    "Scar",
    "Van Hohenheim",
    "Father",
    "Pride",
    "Wrath (King Bradley)",
    "Envy",
    "Lust",
    "Greed",
    "Gluttony",
    "Sloth",
    "Solf J. Kimblee",
    "Maria Ross",
    "Barry the Chopper"

];


/* =========================================================
   DEATH NOTE
   ========================================================= */

const DEATH_NOTE_CHARACTERS = [

    "Light Yagami",
    "L Lawliet",
    "Ryuk",
    "Misa Amane",
    "Near",
    "Mello",
    "Teru Mikami",
    "Kiyomi Takada",
    "Soichiro Yagami",
    "Touta Matsuda",
    "Shuichi Aizawa",
    "Kanzo Mogi",
    "Hideki Ide",
    "Watari",
    "Rem",
    "Ray Penber",
    "Naomi Misora",
    "Kyosuke Higuchi",
    "Matt",
    "Mello's Bodyguard"

];


/* =========================================================
   CODE GEASS
   ========================================================= */

const CODE_GEASS_CHARACTERS = [

    "Lelouch vi Britannia",
    "Suzaku Kururugi",
    "C.C.",
    "Kallen Stadtfeld",
    "Nunnally vi Britannia",
    "Shirley Fenette",
    "Euphemia li Britannia",
    "Cornelia li Britannia",
    "Schneizel el Britannia",
    "Charles zi Britannia",
    "V.V.",
    "Rolo Lamperouge",
    "Li Xingke",
    "Anya Alstreim",
    "Gino Weinberg",
    "Jeremiah Gottwald",
    "Villetta Nu",
    "Diethard Ried",
    "Rakshata Chawla",
    "Ohgi Kaname"

];


/* =========================================================
   JOJO'S BIZARRE ADVENTURE
   ========================================================= */

const JOJOS_CHARACTERS = [

    "Jonathan Joestar",
    "Joseph Joestar",
    "Jotaro Kujo",
    "Josuke Higashikata",
    "Giorno Giovanna",
    "Jolyne Cujoh",
    "Dio Brando",
    "Kars",
    "Yoshikage Kira",
    "Diavolo",
    "Enrico Pucci",
    "Robert E. O. Speedwagon",
    "Caesar Zeppeli",
    "Noriaki Kakyoin",
    "Jean Pierre Polnareff",
    "Muhammad Avdol",
    "Iggy",
    "Okuyasu Nijimura",
    "Koichi Hirose",
    "Rohan Kishibe",
    "Bruno Bucciarati",
    "Guido Mista",
    "Narancia Ghirga",
    "Leone Abbacchio",
    "Pannacotta Fugo"

];


/* =========================================================
   ONE PUNCH MAN
   ========================================================= */

const ONE_PUNCH_MAN_CHARACTERS = [

    "Saitama",
    "Genos",
    "Mumen Rider",
    "Speed-o'-Sound Sonic",
    "Garou",
    "Silver Fang (Bang)",
    "Atomic Samurai",
    "Child Emperor",
    "Metal Knight",
    "King",
    "Zombieman",
    "Drive Knight",
    "Pig God",
    "Superalloy Darkshine",
    "Watchdog Man",
    "Flashy Flash",
    "Metal Bat",
    "Puri-Puri Prisoner",
    "Sweet Mask",
    "Fubuki",
    "Tatsumaki",
    "Boros",
    "Deep Sea King",
    "Carnage Kabuto",
    "Sonic"

];


/* =========================================================
   SPY X FAMILY
   ========================================================= */

const SPY_X_FAMILY_CHARACTERS = [

    "Loid Forger",
    "Yor Forger",
    "Anya Forger",
    "Bond Forger",
    "Yuri Briar",
    "Fiona Frost",
    "Franky Franklin",
    "Sylvia Sherwood",
    "Damian Desmond",
    "Becky Blackbell",
    "Henry Henderson",
    "Donovan Desmond",
    "Camilla",
    "Millie",
    "Sharon"

];


/* =========================================================
   CHAINSAW MAN
   ========================================================= */

const CHAINSAW_MAN_CHARACTERS = [

    "Denji",
    "Makima",
    "Aki Hayakawa",
    "Power",
    "Himeno",
    "Kobeni Higashiyama",
    "Kishibe",
    "Reze",
    "Quanxi",
    "Katana Man",
    "Angel Devil",
    "Beam",
    "Violence Fiend",
    "Pochita",
    "Arai"

];


/* =========================================================
   BLACK CLOVER
   ========================================================= */

const BLACK_CLOVER_CHARACTERS = [

    "Asta",
    "Yuno Grinberryall",
    "Noelle Silva",
    "Yami Sukehiro",
    "Julius Novachrono",
    "William Vangeance",
    "Fuegoleon Vermillion",
    "Nozel Silva",
    "Mereoleona Vermillion",
    "Charlotte Roselei",
    "Jack the Ripper",
    "Rill Boismortier",
    "Finral Roulacase",
    "Magna Swing",
    "Luck Voltia",
    "Gauche Adlai",
    "Charmy Pappitson",
    "Vanessa Enoteca",
    "Grey",
    "Zora Ideale"

];


/* =========================================================
   FAIRY TAIL
   ========================================================= */

const FAIRY_TAIL_CHARACTERS = [

    "Natsu Dragneel",
    "Lucy Heartfilia",
    "Erza Scarlet",
    "Gray Fullbuster",
    "Happy",
    "Wendy Marvell",
    "Carla",
    "Gajeel Redfox",
    "Panther Lily",
    "Juvia Lockser",
    "Laxus Dreyar",
    "Mirajane Strauss",
    "Elfman Strauss",
    "Lisanna Strauss",
    "Makarov Dreyar",
    "Gildarts Clive",
    "Cana Alberona",
    "Jellal Fernandes",
    "Zeref Dragneel",
    "Mavis Vermillion"

];


/* =========================================================
   GINTAMA
   ========================================================= */

const GINTAMA_CHARACTERS = [

    "Gintoki Sakata",
    "Kagura",
    "Shinpachi Shimura",
    "Toshiro Hijikata",
    "Sougo Okita",
    "Isao Kondo",
    "Kotaro Katsura",
    "Elizabeth",
    "Shinsuke Takasugi",
    "Kamui"

];


/* =========================================================
   TOKYO GHOUL
   ========================================================= */

const TOKYO_GHOUL_CHARACTERS = [

    "Ken Kaneki",
    "Touka Kirishima",
    "Rize Kamishiro",
    "Shu Tsukiyama",
    "Yoshimura",
    "Hinami Fueguchi",
    "Nishiki Nishio",
    "Renji Yomo",
    "Uta",
    "Juuzou Suzuya"

];


/* =========================================================
   SWORD ART ONLINE
   ========================================================= */

const SWORD_ART_ONLINE_CHARACTERS = [

    "Kirito (Kazuto Kirigaya)",
    "Asuna Yuuki",
    "Leafa (Suguha Kirigaya)",
    "Silica (Keiko Ayano)",
    "Lisbeth (Rika Shinozaki)",
    "Sinon (Shino Asada)",
    "Klein (Ryotaro Tsuboi)",
    "Agil (Andrew Gilbert Mills)",
    "Yui",
    "Akihiko Kayaba"

];


/* =========================================================
   HAIKYU
   ========================================================= */

const HAIKYU_CHARACTERS = [

    "Shoyo Hinata",
    "Tobio Kageyama",
    "Kei Tsukishima",
    "Yuu Nishinoya",
    "Toru Oikawa",
    "Tetsuro Kuroo",
    "Kenma Kozume",
    "Kotaro Bokuto",
    "Keiji Akaashi",
    "Wakatoshi Ushijima"

];


/* =========================================================
   MOB PSYCHO 100
   ========================================================= */

const MOB_PSYCHO_100_CHARACTERS = [

    "Mob (Shigeo Kageyama)",
    "Arataka Reigen",
    "Dimple",
    "Ritsu Kageyama",
    "Teruki Hanazawa"

];


/* =========================================================
   SLIME ISEKAI
   ========================================================= */

const SLIME_ISEKAI_CHARACTERS = [

    "Rimuru Tempest",
    "Benimaru",
    "Shuna",
    "Shion",
    "Milim Nava"

];


/* =========================================================
   ANIME DATABASE
   ========================================================= */

const ADG_DATABASE = {

    "One Piece":
        ONE_PIECE_CHARACTERS,

    "Naruto":
        NARUTO_CHARACTERS,

    "Dragon Ball":
        DRAGON_BALL_CHARACTERS,

    "Bleach":
        BLEACH_CHARACTERS,

    "My Hero Academia":
        MY_HERO_ACADEMIA_CHARACTERS,

    "Attack on Titan":
        ATTACK_ON_TITAN_CHARACTERS,

    "Jujutsu Kaisen":
        JUJUTSU_KAISEN_CHARACTERS,

    "Demon Slayer":
        DEMON_SLAYER_CHARACTERS,

    "Hunter x Hunter":
        HUNTER_X_HUNTER_CHARACTERS,

    "Fullmetal Alchemist":
        FULLMETAL_ALCHEMIST_CHARACTERS,

    "Death Note":
        DEATH_NOTE_CHARACTERS,

    "Code Geass":
        CODE_GEASS_CHARACTERS,

    "JoJo's Bizarre Adventure":
        JOJOS_CHARACTERS,

    "One Punch Man":
        ONE_PUNCH_MAN_CHARACTERS,

    "Spy x Family":
        SPY_X_FAMILY_CHARACTERS,

    "Chainsaw Man":
        CHAINSAW_MAN_CHARACTERS,

    "Black Clover":
        BLACK_CLOVER_CHARACTERS,

    "Fairy Tail":
        FAIRY_TAIL_CHARACTERS,

    "Gintama":
        GINTAMA_CHARACTERS,

    "Tokyo Ghoul":
        TOKYO_GHOUL_CHARACTERS,

    "Sword Art Online":
        SWORD_ART_ONLINE_CHARACTERS,

    "Haikyu!!":
        HAIKYU_CHARACTERS,

    "Mob Psycho 100":
        MOB_PSYCHO_100_CHARACTERS,

    "Slime Isekai":
        SLIME_ISEKAI_CHARACTERS

};


/* =========================================================
   GET CHARACTERS
   ========================================================= */

function getAnimeCharacters(
    anime
) {

    const characters =
        ADG_DATABASE[anime];


    if (
        !Array.isArray(
            characters
        )
    ) {

        return [];

    }


    return [
        ...characters
    ];

}


/* =========================================================
   RANDOM CHARACTER
   ========================================================= */

function getRandomCharacter(
    anime,
    excluded = []
) {

    const characters =
        getAnimeCharacters(
            anime
        );


    const available =
        characters.filter(
            character =>
                !excluded.includes(
                    character
                )
        );


    if (
        available.length === 0
    ) {

        return null;

    }


    return available[
        Math.floor(
            Math.random() *
            available.length
        )
    ];

}


/* =========================================================
   DATABASE ACCESS
   ========================================================= */

window.ADG_DATABASE =
    ADG_DATABASE;


window.ADG_DATABASE_API = {

    getAnimeCharacters,

    getRandomCharacter,

    getCharacterImageCandidates

};


/* =========================================================
   END OF DATABASE.JS
   ========================================================= */
```
