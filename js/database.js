"use strict";

/*
=============================================================
 ADG — ANIME DATABASE
 Anime Draft Game
 database.js
=============================================================

 PURPOSE
 ------------------------------------------------------------
 This file contains the character database used by ADG.

 IMPORTANT:
 - Character names are used by draft.js / game.js / battle.js.
 - Battle stats are hidden from players.
 - Players only see character names during drafting.
 - Roles are assigned separately by the ADG role system.
 - Battle.js can use these stats for AI calculations.

 CURRENT ANIME
 ------------------------------------------------------------
 One Piece

 FUTURE
 ------------------------------------------------------------
 Naruto
 Dragon Ball
 etc. can be added later.

=============================================================
*/


// ============================================================
// DATABASE VERSION
// ============================================================

const ADG_DATABASE_VERSION = "7.4";


// ============================================================
// ONE PIECE CHARACTER DATABASE
// ============================================================

const ONE_PIECE_DATABASE = [

    // ========================================================
    // STRAW HAT PIRATES
    // ========================================================

    {
        name: "Monkey D. Luffy",
        aliases: ["Luffy", "Monkey D Luffy"],

        stats: {
            hp: 100,
            attack: 100,
            defense: 88,
            speed: 96
        }
    },

    {
        name: "Roronoa Zoro",
        aliases: ["Zoro", "Roronoa Zolo"],

        stats: {
            hp: 96,
            attack: 98,
            defense: 91,
            speed: 88
        }
    },

    {
        name: "Sanji",
        aliases: [],

        stats: {
            hp: 88,
            attack: 94,
            defense: 82,
            speed: 100
        }
    },

    {
        name: "Nami",
        aliases: [],

        stats: {
            hp: 62,
            attack: 72,
            defense: 58,
            speed: 75
        }
    },

    {
        name: "Usopp",
        aliases: ["Sogeking"],

        stats: {
            hp: 65,
            attack: 68,
            defense: 60,
            speed: 70
        }
    },

    {
        name: "Tony Tony Chopper",
        aliases: ["Chopper"],

        stats: {
            hp: 78,
            attack: 70,
            defense: 78,
            speed: 66
        }
    },

    {
        name: "Nico Robin",
        aliases: ["Robin"],

        stats: {
            hp: 74,
            attack: 82,
            defense: 68,
            speed: 72
        }
    },

    {
        name: "Franky",
        aliases: [],

        stats: {
            hp: 92,
            attack: 84,
            defense: 94,
            speed: 58
        }
    },

    {
        name: "Brook",
        aliases: [],

        stats: {
            hp: 76,
            attack: 84,
            defense: 66,
            speed: 91
        }
    },

    {
        name: "Jinbe",
        aliases: ["Jimbei"],

        stats: {
            hp: 98,
            attack: 92,
            defense: 96,
            speed: 68
        }
    },


    // ========================================================
    // WORST GENERATION
    // ========================================================

    {
        name: "Trafalgar Law",
        aliases: [
            "Law",
            "Trafalgar D. Water Law"
        ],

        stats: {
            hp: 88,
            attack: 94,
            defense: 78,
            speed: 87
        }
    },

    {
        name: "Eustass Kid",
        aliases: ["Kid"],

        stats: {
            hp: 92,
            attack: 93,
            defense: 84,
            speed: 70
        }
    },

    {
        name: "Killer",
        aliases: [],

        stats: {
            hp: 80,
            attack: 84,
            defense: 72,
            speed: 88
        }
    },

    {
        name: "Jewelry Bonney",
        aliases: ["Bonney"],

        stats: {
            hp: 72,
            attack: 70,
            defense: 65,
            speed: 77
        }
    },

    {
        name: "Capone Bege",
        aliases: ["Bege"],

        stats: {
            hp: 82,
            attack: 76,
            defense: 88,
            speed: 60
        }
    },

    {
        name: "Basil Hawkins",
        aliases: ["Hawkins"],

        stats: {
            hp: 80,
            attack: 78,
            defense: 75,
            speed: 68
        }
    },

    {
        name: "Scratchmen Apoo",
        aliases: ["Apoo"],

        stats: {
            hp: 74,
            attack: 80,
            defense: 67,
            speed: 76
        }
    },

    {
        name: "X Drake",
        aliases: ["Drake"],

        stats: {
            hp: 84,
            attack: 82,
            defense: 82,
            speed: 70
        }
    },

    {
        name: "Urouge",
        aliases: [],

        stats: {
            hp: 91,
            attack: 86,
            defense: 86,
            speed: 64
        }
    },


    // ========================================================
    // RED HAIR PIRATES
    // ========================================================

    {
        name: "Shanks",
        aliases: [],

        stats: {
            hp: 100,
            attack: 100,
            defense: 92,
            speed: 97
        }
    },

    {
        name: "Benn Beckman",
        aliases: ["Benn Beckmann"],

        stats: {
            hp: 91,
            attack: 94,
            defense: 88,
            speed: 86
        }
    },

    {
        name: "Yasopp",
        aliases: [],

        stats: {
            hp: 78,
            attack: 91,
            defense: 72,
            speed: 84
        }
    },

    {
        name: "Lucky Roux",
        aliases: [],

        stats: {
            hp: 89,
            attack: 87,
            defense: 90,
            speed: 67
        }
    },


    // ========================================================
    // ROGER PIRATES
    // ========================================================

    {
        name: "Gol D. Roger",
        aliases: ["Gol D Roger", "Roger"],

        stats: {
            hp: 100,
            attack: 100,
            defense: 96,
            speed: 96
        }
    },

    {
        name: "Silvers Rayleigh",
        aliases: ["Rayleigh"],

        stats: {
            hp: 96,
            attack: 96,
            defense: 92,
            speed: 91
        }
    },

    {
        name: "Scopper Gaban",
        aliases: ["Gaban"],

        stats: {
            hp: 91,
            attack: 91,
            defense: 87,
            speed: 86
        }
    },


    // ========================================================
    // WHITEBEARD PIRATES
    // ========================================================

    {
        name: "Edward Newgate",
        aliases: [
            "Whitebeard",
            "Edward Newgate"
        ],

        stats: {
            hp: 100,
            attack: 100,
            defense: 97,
            speed: 78
        }
    },

    {
        name: "Portgas D. Ace",
        aliases: ["Ace"],

        stats: {
            hp: 91,
            attack: 93,
            defense: 79,
            speed: 88
        }
    },

    {
        name: "Marco",
        aliases: [],

        stats: {
            hp: 94,
            attack: 86,
            defense: 88,
            speed: 92
        }
    },

    {
        name: "Jozu",
        aliases: [],

        stats: {
            hp: 95,
            attack: 87,
            defense: 98,
            speed: 65
        }
    },

    {
        name: "Vista",
        aliases: [],

        stats: {
            hp: 84,
            attack: 88,
            defense: 78,
            speed: 87
        }
    },


    // ========================================================
    // BEAST PIRATES
    // ========================================================

    {
        name: "Kaido",
        aliases: [],

        stats: {
            hp: 100,
            attack: 100,
            defense: 100,
            speed: 72
        }
    },

    {
        name: "King",
        aliases: [],

        stats: {
            hp: 94,
            attack: 95,
            defense: 93,
            speed: 91
        }
    },

    {
        name: "Queen",
        aliases: [],

        stats: {
            hp: 94,
            attack: 87,
            defense: 91,
            speed: 62
        }
    },

    {
        name: "Jack",
        aliases: [],

        stats: {
            hp: 96,
            attack: 83,
            defense: 94,
            speed: 58
        }
    },

    {
        name: "Ulti",
        aliases: [],

        stats: {
            hp: 82,
            attack: 82,
            defense: 84,
            speed: 76
        }
    },

    {
        name: "Who's-Who",
        aliases: ["Whos Who"],

        stats: {
            hp: 81,
            attack: 83,
            defense: 77,
            speed: 85
        }
    },


    // ========================================================
    // BIG MOM PIRATES
    // ========================================================

    {
        name: "Charlotte Linlin",
        aliases: ["Big Mom"],

        stats: {
            hp: 100,
            attack: 99,
            defense: 100,
            speed: 65
        }
    },

    {
        name: "Charlotte Katakuri",
        aliases: ["Katakuri"],

        stats: {
            hp: 95,
            attack: 96,
            defense: 90,
            speed: 94
        }
    },

    {
        name: "Charlotte Smoothie",
        aliases: ["Smoothie"],

        stats: {
            hp: 87,
            attack: 87,
            defense: 86,
            speed: 72
        }
    },

    {
        name: "Charlotte Cracker",
        aliases: ["Cracker"],

        stats: {
            hp: 85,
            attack: 88,
            defense: 89,
            speed: 74
        }
    },


    // ========================================================
    // MARINES
    // ========================================================

    {
        name: "Monkey D. Garp",
        aliases: ["Garp"],

        stats: {
            hp: 98,
            attack: 99,
            defense: 94,
            speed: 88
        }
    },

    {
        name: "Sengoku",
        aliases: [],

        stats: {
            hp: 96,
            attack: 94,
            defense: 94,
            speed: 78
        }
    },

    {
        name: "Sakazuki",
        aliases: ["Akainu"],

        stats: {
            hp: 96,
            attack: 98,
            defense: 92,
            speed: 76
        }
    },

    {
        name: "Kuzan",
        aliases: ["Aokiji"],

        stats: {
            hp: 94,
            attack: 94,
            defense: 90,
            speed: 82
        }
    },

    {
        name: "Borsalino",
        aliases: ["Kizaru"],

        stats: {
            hp: 91,
            attack: 95,
            defense: 87,
            speed: 100
        }
    },

    {
        name: "Fujitora",
        aliases: ["Issho"],

        stats: {
            hp: 92,
            attack: 92,
            defense: 89,
            speed: 74
        }
    },

    {
        name: "Ryokugyu",
        aliases: ["Green Bull", "Aramaki"],

        stats: {
            hp: 94,
            attack: 91,
            defense: 92,
            speed: 75
        }
    },

    {
        name: "Smoker",
        aliases: [],

        stats: {
            hp: 79,
            attack: 77,
            defense: 76,
            speed: 79
        }
    },

    {
        name: "Rob Lucci",
        aliases: ["Lucci"],

        stats: {
            hp: 87,
            attack: 92,
            defense: 83,
            speed: 94
        }
    },

    {
        name: "Koby",
        aliases: ["Coby"],

        stats: {
            hp: 68,
            attack: 73,
            defense: 65,
            speed: 78
        }
    },


    // ========================================================
    // CROSS GUILD
    // ========================================================

    {
        name: "Dracule Mihawk",
        aliases: ["Mihawk"],

        stats: {
            hp: 97,
            attack: 100,
            defense: 91,
            speed: 94
        }
    },

    {
        name: "Crocodile",
        aliases: [],

        stats: {
            hp: 87,
            attack: 89,
            defense: 80,
            speed: 77
        }
    },

    {
        name: "Buggy",
        aliases: [],

        stats: {
            hp: 55,
            attack: 45,
            defense: 48,
            speed: 61
        }
    },


    // ========================================================
    // REVOLUTIONARY ARMY
    // ========================================================

    {
        name: "Monkey D. Dragon",
        aliases: ["Dragon"],

        stats: {
            hp: 98,
            attack: 98,
            defense: 93,
            speed: 91
        }
    },

    {
        name: "Sabo",
        aliases: [],

        stats: {
            hp: 88,
            attack: 93,
            defense: 82,
            speed: 91
        }
    },

    {
        name: "Emporio Ivankov",
        aliases: ["Ivankov"],

        stats: {
            hp: 76,
            attack: 75,
            defense: 74,
            speed: 70
        }
    },


    // ========================================================
    // WARLORDS / MAJOR PIRATES
    // ========================================================

    {
        name: "Donquixote Doflamingo",
        aliases: ["Doflamingo"],

        stats: {
            hp: 91,
            attack: 93,
            defense: 86,
            speed: 88
        }
    },

    {
        name: "Boa Hancock",
        aliases: ["Hancock"],

        stats: {
            hp: 82,
            attack: 91,
            defense: 77,
            speed: 86
        }
    },

    {
        name: "Bartholomew Kuma",
        aliases: ["Kuma"],

        stats: {
            hp: 97,
            attack: 90,
            defense: 97,
            speed: 63
        }
    },

    {
        name: "Gecko Moria",
        aliases: ["Moria"],

        stats: {
            hp: 82,
            attack: 76,
            defense: 79,
            speed: 55
        }
    },

    {
        name: "Marshall D. Teach",
        aliases: ["Blackbeard", "Teach"],

        stats: {
            hp: 98,
            attack: 99,
            defense: 91,
            speed: 68
        }
    },


    // ========================================================
    // SKY / OTHER MAJOR CHARACTERS
    // ========================================================

    {
        name: "Enel",
        aliases: ["Eneru"],

        stats: {
            hp: 84,
            attack: 96,
            defense: 72,
            speed: 96
        }
    },

    {
        name: "Magellan",
        aliases: [],

        stats: {
            hp: 92,
            attack: 94,
            defense: 90,
            speed: 62
        }
    },

    {
        name: "Bartolomeo",
        aliases: ["Bartolomew"],

        stats: {
            hp: 79,
            attack: 74,
            defense: 91,
            speed: 67
        }
    },

    {
        name: "Cavendish",
        aliases: ["Hakuba"],

        stats: {
            hp: 76,
            attack: 83,
            defense: 68,
            speed: 94
        }
    },

    {
        name: "Don Chinjao",
        aliases: ["Chinjao"],

        stats: {
            hp: 86,
            attack: 88,
            defense: 84,
            speed: 63
        }
    },

    {
        name: "Kyros",
        aliases: [],

        stats: {
            hp: 82,
            attack: 84,
            defense: 76,
            speed: 86
        }
    },


    // ========================================================
    // WANO
    // ========================================================

    {
        name: "Yamato",
        aliases: [],

        stats: {
            hp: 94,
            attack: 94,
            defense: 89,
            speed: 88
        }
    },

    {
        name: "Denjiro",
        aliases: [],

        stats: {
            hp: 82,
            attack: 86,
            defense: 76,
            speed: 81
        }
    },

    {
        name: "Kikunojo",
        aliases: ["Kiku"],

        stats: {
            hp: 74,
            attack: 77,
            defense: 70,
            speed: 78
        }
    },

    {
        name: "Kin'emon",
        aliases: ["Kinemon"],

        stats: {
            hp: 78,
            attack: 80,
            defense: 73,
            speed: 73
        }
    },

    {
        name: "Ashura Doji",
        aliases: ["Ashura"],

        stats: {
            hp: 87,
            attack: 90,
            defense: 86,
            speed: 65
        }
    },


    // ========================================================
    // OTHER IMPORTANT CHARACTERS
    // ========================================================

    {
        name: "Perona",
        aliases: [],

        stats: {
            hp: 61,
            attack: 70,
            defense: 56,
            speed: 74
        }
    },

    {
        name: "Hody Jones",
        aliases: ["Hody"],

        stats: {
            hp: 79,
            attack: 78,
            defense: 75,
            speed: 67
        }
    },

    {
        name: "Arlong",
        aliases: [],

        stats: {
            hp: 78,
            attack: 79,
            defense: 74,
            speed: 62
        }
    },

    {
        name: "Don Krieg",
        aliases: ["Krieg"],

        stats: {
            hp: 70,
            attack: 65,
            defense: 73,
            speed: 48
        }
    },

    {
        name: "Kuro",
        aliases: ["Captain Kuro"],

        stats: {
            hp: 67,
            attack: 75,
            defense: 61,
            speed: 91
        }
    },

    {
        name: "Bellamy",
        aliases: [],

        stats: {
            hp: 69,
            attack: 72,
            defense: 63,
            speed: 79
        }
    }

];


// ============================================================
// SIMPLE CHARACTER LIST
// ============================================================
//
// draft.js can use this array when it only needs names.
//
// Example:
//
// let characters = [...ONE_PIECE_CHARACTERS];
//
// ============================================================

const ONE_PIECE_CHARACTERS =
    ONE_PIECE_DATABASE.map(
        character => character.name
    );


// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================
//
// Your older ADG files may expect:
//
// ONE_PIECE_CHARACTERS
//
// So it is intentionally kept above.
//
// ============================================================


// ============================================================
// CHARACTER LOOKUP
// ============================================================

function normalizeCharacterName(name) {

    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/\./g, "")
        .replace(/\s+/g, " ");
}


function getCharacterData(name) {

    const normalized =
        normalizeCharacterName(name);

    if (!normalized) {
        return null;
    }

    const character =
        ONE_PIECE_DATABASE.find(
            entry => {

                if (
                    normalizeCharacterName(
                        entry.name
                    ) === normalized
                ) {
                    return true;
                }

                return entry.aliases.some(
                    alias =>
                        normalizeCharacterName(
                            alias
                        ) === normalized
                );
            }
        );

    return character || null;
}


// ============================================================
// GET HIDDEN BATTLE STATS
// ============================================================
//
// IMPORTANT:
// Do not display these values in draft UI.
//
// Battle.js can use this function to retrieve them.
//
// ============================================================

function getCharacterStats(name) {

    const character =
        getCharacterData(name);

    if (
        !character ||
        !character.stats
    ) {

        return {
            hp: 100,
            attack: 100,
            defense: 80,
            speed: 80
        };
    }

    return {
        hp: Number(character.stats.hp) || 100,
        attack: Number(character.stats.attack) || 100,
        defense: Number(character.stats.defense) || 80,
        speed: Number(character.stats.speed) || 80
    };
}


// ============================================================
// GET CHARACTER NAME
// ============================================================

function getCanonicalCharacterName(name) {

    const character =
        getCharacterData(name);

    if (character) {
        return character.name;
    }

    return String(name || "Unknown");
}


// ============================================================
// CHARACTER EXISTS
// ============================================================

function characterExists(name) {

    return Boolean(
        getCharacterData(name)
    );
}


// ============================================================
// RANDOM CHARACTER
// ============================================================

function getRandomOnePieceCharacter(
    excludedCharacters = []
) {

    const excluded =
        new Set(
            excludedCharacters.map(
                normalizeCharacterName
            )
        );

    const available =
        ONE_PIECE_CHARACTERS.filter(
            name =>
                !excluded.has(
                    normalizeCharacterName(name)
                )
        );

    if (available.length === 0) {
        return null;
    }

    return available[
        Math.floor(
            Math.random() *
            available.length
        )
    ];
}


// ============================================================
// GET DATABASE FOR ANIME
// ============================================================

function getAnimeCharacters(anime) {

    const normalized =
        String(anime || "")
            .trim()
            .toLowerCase();

    switch (normalized) {

        case "one piece":
        case "onepiece":

            return [
                ...ONE_PIECE_CHARACTERS
            ];

        default:

            return [];
    }
}


// ============================================================
// GET CHARACTER DATABASE
// ============================================================

function getAnimeDatabase(anime) {

    const normalized =
        String(anime || "")
            .trim()
            .toLowerCase();

    switch (normalized) {

        case "one piece":
        case "onepiece":

            return [
                ...ONE_PIECE_DATABASE
            ];

        default:

            return [];
    }
}


// ============================================================
// DATABASE VALIDATION
// ============================================================

function validateAnimeDatabase(database) {

    if (!Array.isArray(database)) {
        return false;
    }

    const names =
        new Set();

    for (
        const character
        of database
    ) {

        if (
            !character ||
            typeof character.name !== "string"
        ) {

            return false;
        }

        const normalized =
            normalizeCharacterName(
                character.name
            );

        if (
            !normalized ||
            names.has(normalized)
        ) {

            return false;
        }

        names.add(normalized);

        if (
            !character.stats ||
            typeof character.stats !== "object"
        ) {

            return false;
        }

        const stats =
            character.stats;

        if (
            typeof stats.hp !== "number" ||
            typeof stats.attack !== "number" ||
            typeof stats.defense !== "number" ||
            typeof stats.speed !== "number"
        ) {

            return false;
        }
    }

    return true;
}


// ============================================================
// DATABASE STATUS
// ============================================================

const ADG_DATABASE_READY =
    validateAnimeDatabase(
        ONE_PIECE_DATABASE
    );


// ============================================================
// DEBUG INFORMATION
// ============================================================
//
// This does NOT reveal stats to players.
// It only appears in the browser console.
//
// ============================================================

console.log(
    `✅ ADG Database v${ADG_DATABASE_VERSION} loaded.`
);

console.log(
    `✅ One Piece characters: ${ONE_PIECE_CHARACTERS.length}`
);

console.log(
    `✅ Database validation: ${
        ADG_DATABASE_READY
            ? "PASSED"
            : "FAILED"
    }`
);


// ============================================================
// OPTIONAL GLOBAL ACCESS
// ============================================================
//
// These make the database accessible to older ADG files
// without requiring import/export modules.
//
// ============================================================

window.ADG_DATABASE_VERSION =
    ADG_DATABASE_VERSION;

window.ONE_PIECE_DATABASE =
    ONE_PIECE_DATABASE;

window.ONE_PIECE_CHARACTERS =
    ONE_PIECE_CHARACTERS;

window.getCharacterData =
    getCharacterData;

window.getCharacterStats =
    getCharacterStats;

window.getCanonicalCharacterName =
    getCanonicalCharacterName;

window.characterExists =
    characterExists;

window.getRandomOnePieceCharacter =
    getRandomOnePieceCharacter;

window.getAnimeCharacters =
    getAnimeCharacters;

window.getAnimeDatabase =
    getAnimeDatabase;

window.ADG_DATABASE_READY =
    ADG_DATABASE_READY;


// ============================================================
// END DATABASE.JS
// ============================================================