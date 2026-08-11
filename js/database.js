```javascript id="p8x4kd"
/* =========================================================
   ADG — DATABASE.JS
   Character Database
   ========================================================= */

"use strict";


/* =========================================================
   ONE PIECE CHARACTERS
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
    "Eustass Kid",
    "Killer",

    "Dracule Mihawk",
    "Boa Hancock",
    "Buggy",

    "Edward Newgate",
    "Marco",
    "Jozu",
    "Vista",

    "Charlotte Linlin",
    "Charlotte Katakuri",
    "Charlotte Smoothie",
    "Charlotte Cracker",

    "Kaido",
    "King",
    "Queen",
    "Jack",

    "Marshall D. Teach",
    "Shiryu",
    "Van Augur",

    "Borsalino",
    "Sakazuki",
    "Kuzan",
    "Issho",
    "Aramaki",

    "Sengoku",
    "Tsuru",

    "Donquixote Doflamingo",
    "Crocodile",
    "Rob Lucci",
    "Kaku",

    "Enel",
    "Gecko Moria",
    "Perona",

    "Magellan",
    "Hannyabal",

    "Bartolomeo",
    "Cavendish",
    "Don Sai",

    "Bonney",
    "Capone Bege",
    "Basil Hawkins",
    "Scratchmen Apoo",
    "X Drake",
    "Jewelry Bonney",

    "Koby",
    "Helmeppo",

    "Smoker",
    "Tashigi",

    "Vinsmoke Reiju",
    "Vinsmoke Ichiji",
    "Vinsmoke Niji",
    "Vinsmoke Yonji",

    "Yamato",
    "Kozuki Oden",
    "Kin'emon",

    "Momonosuke",
    "Denjiro",
    "Ashura Doji",

    "Nefertari Vivi",
    "Nefertari Cobra",

    "Boa Sandersonia",
    "Boa Marigold",

    "Kuma",
    "Emporio Ivankov",

    "Fisher Tiger",
    "Arlong",

    "Hachi",
    "Kuroobi",

    "Mr. 1",
    "Mr. 2 Bon Clay",
    "Mr. 3",

    "Daz Bonez",

    "Bellamy",

    "Enies Lobby Sogeking"

];


/* =========================================================
   CHARACTER OBJECTS
   ========================================================= */

const ADG_CHARACTER_DATA = {};


/* =========================================================
   BUILD CHARACTER DATABASE
   ========================================================= */

function initializeCharacterDatabase() {

    ONE_PIECE_CHARACTERS.forEach(
        (
            character,
            index
        ) => {

            if (
                ADG_CHARACTER_DATA[
                    character
                ]
            ) {

                return;

            }


            ADG_CHARACTER_DATA[
                character
            ] = {

                id:
                    `op_${String(
                        index + 1
                    ).padStart(
                        3,
                        "0"
                    )}`,

                name:
                    character,

                anime:
                    "One Piece",

                index,

                image:
                    getCharacterImagePath(
                        character
                    )

            };

        }
    );

}


/* =========================================================
   IMAGE PATH
   ========================================================= */

function getCharacterImagePath(
    character
) {

    const filename =
        String(
            character
        )
        .replace(
            /[\\/:*?"<>|]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        );


    return `assets/images/one-piece/${filename}.jpg`;

}


/* =========================================================
   GET CHARACTER
   ========================================================= */

function getCharacter(
    name
) {

    if (
        !name
    ) {

        return null;

    }


    return (
        ADG_CHARACTER_DATA[
            name
        ] ||
        null
    );

}


/* =========================================================
   GET ALL CHARACTERS
   ========================================================= */

function getAllCharacters(
    anime = "One Piece"
) {

    if (
        anime ===
        "One Piece"
    ) {

        return ONE_PIECE_CHARACTERS.map(
            character =>
                getCharacter(
                    character
                )
        );

    }


    return [];

}


/* =========================================================
   GET CHARACTER NAMES
   ========================================================= */

function getCharacterNames(
    anime = "One Piece"
) {

    if (
        anime ===
        "One Piece"
    ) {

        return [
            ...ONE_PIECE_CHARACTERS
        ];

    }


    return [];

}


/* =========================================================
   FIND CHARACTER
   ========================================================= */

function findCharacter(
    search
) {

    if (
        !search
    ) {

        return null;

    }


    const query =
        String(
            search
        )
        .trim()
        .toLowerCase();


    const exact =
        ONE_PIECE_CHARACTERS.find(
            character =>
                character.toLowerCase() ===
                query
        );


    if (
        exact
    ) {

        return getCharacter(
            exact
        );

    }


    const partial =
        ONE_PIECE_CHARACTERS.find(
            character =>
                character
                    .toLowerCase()
                    .includes(
                        query
                    )
        );


    return partial
        ? getCharacter(
            partial
        )
        : null;

}


/* =========================================================
   RANDOM CHARACTER
   ========================================================= */

function getRandomCharacter(
    excluded = []
) {

    const excludedSet =
        new Set(
            excluded.map(
                name =>
                    String(
                        name
                    )
                        .trim()
                        .toLowerCase()
            )
        );


    const available =
        ONE_PIECE_CHARACTERS.filter(
            character =>
                !excludedSet.has(
                    character
                        .toLowerCase()
                )
        );


    if (
        available.length ===
        0
    ) {

        return null;

    }


    const randomIndex =
        Math.floor(
            Math.random() *
            available.length
        );


    return getCharacter(
        available[
            randomIndex
        ]
    );

}


/* =========================================================
   RANDOM CHARACTER NAMES
   ========================================================= */

function getRandomCharacterName(
    excluded = []
) {

    const character =
        getRandomCharacter(
            excluded
        );


    return character
        ? character.name
        : null;

}


/* =========================================================
   CHECK CHARACTER
   ========================================================= */

function characterExists(
    name
) {

    return Boolean(
        getCharacter(
            name
        )
    );

}


/* =========================================================
   VALIDATE TEAM
   ========================================================= */

function validateTeam(
    team
) {

    if (
        !Array.isArray(
            team
        )
    ) {

        return {

            valid:
                false,

            reason:
                "Team must be an array."

        };

    }


    const names =
        team
            .map(
                member =>
                    typeof member ===
                    "string"
                        ? member
                        : member?.name
            )
            .filter(
                Boolean
            );


    const unique =
        new Set(
            names
        );


    if (
        names.length !==
        unique.size
    ) {

        return {

            valid:
                false,

            reason:
                "Duplicate characters are not allowed."

        };

    }


    for (
        const name of
        names
    ) {

        if (
            !characterExists(
                name
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    `Unknown character: ${name}`

            };

        }

    }


    return {

        valid:
            true,

        reason:
            null

    };

}


/* =========================================================
   DATABASE READY
   ========================================================= */

initializeCharacterDatabase();


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_DATABASE = {

    ONE_PIECE_CHARACTERS,

    characters:
        ADG_CHARACTER_DATA,

    initialize:
        initializeCharacterDatabase,

    get:
        getCharacter,

    getAll:
        getAllCharacters,

    getNames:
        getCharacterNames,

    find:
        findCharacter,

    random:
        getRandomCharacter,

    randomName:
        getRandomCharacterName,

    exists:
        characterExists,

    validateTeam,

    getImagePath:
        getCharacterImagePath

};


/* =========================================================
   BACKWARD COMPATIBILITY
   ========================================================= */

window.ONE_PIECE_CHARACTERS =
    ONE_PIECE_CHARACTERS;


/* =========================================================
   END OF DATABASE.JS
   ========================================================= */
```
