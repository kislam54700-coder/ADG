/* =========================================================
   ADG — SERVER.JS
   Anime Draft Game Multiplayer Server
   ========================================================= */

"use strict";

/* =========================================================
   IMPORTS
   ========================================================= */

const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const crypto = require("crypto");

/* =========================================================
   APP / SERVER
   ========================================================= */

const app = express();

const server = http.createServer(app);

const io = new Server(
    server,
    {
        cors: {
            origin: "*",
            methods: [
                "GET",
                "POST"
            ]
        }
    }
);

/* =========================================================
   CONFIGURATION
   ========================================================= */

const PORT =
    process.env.PORT ||
    3000;

const TEAM_SIZE =
    6;

/*
 * The Match ID is intentionally short so it can easily
 * be shared with another player.
 */

const MATCH_ID_LENGTH =
    6;

/* =========================================================
   CHARACTER DATABASE
   ========================================================= */

/*
 * Keep this list synchronized with your client database.
 *
 * The server is authoritative for character selection,
 * so duplicate characters are prevented here.
 */

const CHARACTERS = [

    /* =====================================================
       ONE PIECE
       ===================================================== */

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

    "Boa Hancock",
    "Buggy",
    "Dracule Mihawk",

    "Edward Newgate",
    "Marshall D. Teach",

    "Kaido",
    "Charlotte Linlin",

    "Kozuki Oden",
    "Yamato",

    "Donquixote Doflamingo",
    "Crocodile",

    "Enel",
    "Rob Lucci",

    "Kuzan",
    "Sakazuki",
    "Borsalino",

    "Fujitora",
    "Ryokugyu",

    "Marco",
    "King",
    "Queen",
    "Katakuri",

    /* =====================================================
       NARUTO
       ===================================================== */

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
    "Kimimaro",

    /* =====================================================
       DRAGON BALL
       ===================================================== */

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
    "Bardock",

    /* =====================================================
       BLEACH
       ===================================================== */

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
    "Yhwach",

    /* =====================================================
       MY HERO ACADEMIA
       ===================================================== */

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
    "Mirio Togata",

    /* =====================================================
       ATTACK ON TITAN
       ===================================================== */

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
    "Hitch Dreyse",

    /* =====================================================
       JUJUTSU KAISEN
       ===================================================== */

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
    "Naobito Zen'in",

    /* =====================================================
       DEMON SLAYER
       ===================================================== */

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
    "Rui",

    /* =====================================================
       HUNTER X HUNTER
       ===================================================== */

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
    "Silva Zoldyck",

    /* =====================================================
       ONE PUNCH MAN
       ===================================================== */

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

    /* =====================================================
       CHAINSAW MAN
       ===================================================== */

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
    "Arai",

    /* =====================================================
       BLACK CLOVER
       ===================================================== */

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
    "Zora Ideale",

    /* =====================================================
       FAIRY TAIL
       ===================================================== */

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
    "Mavis Vermillion",

    /* =====================================================
       GINTAMA
       ===================================================== */

    "Gintoki Sakata",
    "Kagura",
    "Shinpachi Shimura",
    "Toshiro Hijikata",
    "Sougo Okita",
    "Isao Kondo",
    "Kotaro Katsura",
    "Elizabeth",
    "Shinsuke Takasugi",
    "Kamui",

    /* =====================================================
       TOKYO GHOUL
       ===================================================== */

    "Ken Kaneki",
    "Touka Kirishima",
    "Rize Kamishiro",
    "Shu Tsukiyama",
    "Yoshimura",
    "Hinami Fueguchi",
    "Nishiki Nishio",
    "Renji Yomo",
    "Uta",
    "Juuzou Suzuya",

    /* =====================================================
       SPY X FAMILY
       ===================================================== */

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

    /* =====================================================
       SLIME ISEKAI
       ===================================================== */

    "Rimuru Tempest",
    "Benimaru",
    "Shuna",
    "Shion",
    "Milim Nava"
];

/* =========================================================
   REMOVE DUPLICATE CHARACTERS
   ========================================================= */

const CHARACTER_POOL =
    [
        ...new Set(
            CHARACTERS
        )
    ];

/* =========================================================
   MATCH STORAGE
   ========================================================= */

/*
 * In-memory storage.
 *
 * Important:
 * Render free instances can restart, which clears matches.
 *
 * Later you can move this to Redis or a database.
 */

const matches =
    new Map();

/* =========================================================
   SOCKET → PLAYER LOOKUP
   ========================================================= */

const socketPlayers =
    new Map();

/* =========================================================
   HELPERS
   ========================================================= */

function createMatchId() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let id =
        "";

    for (
        let i = 0;
        i < MATCH_ID_LENGTH;
        i++
    ) {

        const index =
            crypto.randomInt(
                0,
                characters.length
            );

        id +=
            characters[index];

    }

    return id;

}

/* =========================================================
   UNIQUE MATCH ID
   ========================================================= */

function createUniqueMatchId() {

    let id =
        createMatchId();

    while (
        matches.has(
            id
        )
    ) {

        id =
            createMatchId();

    }

    return id;

}

/* =========================================================
   GET PLAYER
   ========================================================= */

function getPlayer(
    match,
    playerNumber
) {

    return match.players[
        playerNumber - 1
    ];

}

/* =========================================================
   GET PLAYER BY SOCKET
   ========================================================= */

function getPlayerBySocket(
    socketId
) {

    const session =
        socketPlayers.get(
            socketId
        );

    if (
        !session
    ) {

        return null;

    }

    const match =
        matches.get(
            session.matchId
        );

    if (
        !match
    ) {

        return null;

    }

    const player =
        getPlayer(
            match,
            session.playerNumber
        );

    return {
        match,
        player,
        playerNumber:
            session.playerNumber
    };

}

/* =========================================================
   SEND PRIVATE DRAFT STATE
   ========================================================= */

function sendDraftState(
    socket,
    match,
    playerNumber
) {

    const player =
        getPlayer(
            match,
            playerNumber
        );

    if (
        !player
    ) {

        return;

    }

    socket.emit(
        "draft:state",
        {
            matchId:
                match.id,

            playerNumber,

            playerName:
                player.name,

            battleName:
                match.battleName,

            team:
                player.team,

            dropToken:
                player.dropToken,

            myTurn:
                match.currentTurn ===
                playerNumber,

            draftComplete:
                match.phase ===
                "complete"
        }
    );

}

/* =========================================================
   SEND TURN UPDATE
   ========================================================= */

function broadcastTurn(
    match
) {

    match.players.forEach(
        player => {

            if (
                !player ||
                !player.socketId
            ) {

                return;

            }

            io.to(
                player.socketId
            ).emit(
                "draft:turn",
                {
                    playerNumber:
                        match.currentTurn,

                    myTurn:
                        player.number ===
                        match.currentTurn
                }
            );

        }
    );

}

/* =========================================================
   BROADCAST PRIVATE STATES
   ========================================================= */

function broadcastPrivateStates(
    match
) {

    match.players.forEach(
        player => {

            if (
                !player ||
                !player.socketId
            ) {

                return;

            }

            const socket =
                io.sockets.sockets.get(
                    player.socketId
                );

            if (
                socket
            ) {

                sendDraftState(
                    socket,
                    match,
                    player.number
                );

            }

        }
    );

}

/* =========================================================
   CHECK DRAFT COMPLETE
   ========================================================= */

function isDraftComplete(
    match
) {

    return match.players.every(
        player =>
            player &&
            player.team.length >=
            TEAM_SIZE
    );

}

/* =========================================================
   GET USED CHARACTERS
   ========================================================= */

function getUsedCharacters(
    match
) {

    const used =
        new Set();

    match.players.forEach(
        player => {

            if (
                !player
            ) {

                return;

            }

            player.team.forEach(
                character => {

                    used.add(
                        character.name
                    );

                }
            );

        }
    );

    return used;

}

/* =========================================================
   GET RANDOM AVAILABLE CHARACTER
   ========================================================= */

function getRandomCharacter(
    match
) {

    const used =
        getUsedCharacters(
            match
        );

    const available =
        CHARACTER_POOL.filter(
            character =>
                !used.has(
                    character
                )
        );

    if (
        available.length ===
        0
    ) {

        return null;

    }

    const index =
        crypto.randomInt(
            0,
            available.length
        );

    return available[
        index
    ];

}

/* =========================================================
   NEXT PLAYER TURN
   ========================================================= */

function switchTurn(
    match
) {

    match.currentTurn =
        match.currentTurn ===
        1
            ? 2
            : 1;

}

/* =========================================================
   CREATE MATCH
   ========================================================= */

function createMatchObject(
    playerName,
    battleName
) {

    const id =
        createUniqueMatchId();

    return {
        id,

        battleName:
            battleName ||
            "Face to Face",

        phase:
            "waiting",

        currentTurn:
            1,

        usedCharacters:
            new Set(),

        players: [
            {
                number: 1,

                name:
                    playerName,

                socketId:
                    null,

                team: [],

                dropToken:
                    true,

                connected:
                    true
            },
            null
        ]
    };

}

/* =========================================================
   START MATCH
   ========================================================= */

function startMatch(
    match
) {

    if (
        !match.players[0] ||
        !match.players[1]
    ) {

        return;

    }

    match.phase =
        "draft";

    match.currentTurn =
        1;

    match.players.forEach(
        player => {

            if (
                !player.socketId
            ) {

                return;

            }

            io.to(
                player.socketId
            ).emit(
                "match:ready",
                {
                    matchId:
                        match.id,

                    playerNumber:
                        player.number,

                    playerName:
                        player.name,

                    battleName:
                        match.battleName
                }
            );

        }
    );

}

/* =========================================================
   FIND WAITING MATCH
   ========================================================= */

function findWaitingMatch() {

    for (
        const match of
        matches.values()
    ) {

        if (
            match.phase ===
            "waiting" &&
            !match.players[1]
        ) {

            return match;

        }

    }

    return null;

}

/* =========================================================
   SOCKET CONNECTION
   ========================================================= */

io.on(
    "connection",
    socket => {

        console.log(
            "Player connected:",
            socket.id
        );

        /* =============================================
           MATCH CREATE
           ============================================= */

        socket.on(
            "match:create",
            data => {

                const playerName =
                    String(
                        data?.playerName ||
                        ""
                    )
                    .trim()
                    .slice(
                        0,
                        24
                    );

                if (
                    playerName.length <
                    2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Enter a valid player name."
                        }
                    );

                    return;

                }

                /*
                 * "battleName" replaces anime selection.
                 *
                 * Example:
                 * Face to Face
                 */

                const battleName =
                    String(
                        data?.battleName ||
                        data?.anime ||
                        "Face to Face"
                    )
                    .trim()
                    .slice(
                        0,
                        64
                    );

                const match =
                    createMatchObject(
                        playerName,
                        battleName
                    );

                match.players[0].socketId =
                    socket.id;

                matches.set(
                    match.id,
                    match
                );

                socketPlayers.set(
                    socket.id,
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            1
                    }
                );

                socket.join(
                    match.id
                );

                /*
                 * IMPORTANT:
                 * This is what gives Player 1 the share code.
                 */

                socket.emit(
                    "match:created",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            1,

                        playerName,

                        battleName:
                            match.battleName,

                        message:
                            `Match created. Share code: ${match.id}`
                    }
                );

                socket.emit(
                    "match:waiting",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            1,

                        battleName:
                            match.battleName,

                        message:
                            `Waiting for opponent. Match ID: ${match.id}`
                    }
                );

                console.log(
                    `Match created: ${match.id}`
                );

            }
        );

        /* =============================================
           MATCH JOIN
           ============================================= */

        socket.on(
            "match:join",
            data => {

                const matchId =
                    String(
                        data?.matchId ||
                        ""
                    )
                    .trim()
                    .toUpperCase();

                const playerName =
                    String(
                        data?.playerName ||
                        ""
                    )
                    .trim()
                    .slice(
                        0,
                        24
                    );

                if (
                    !matchId
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Enter a Match ID."
                        }
                    );

                    return;

                }

                if (
                    playerName.length <
                    2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Enter a valid player name."
                        }
                    );

                    return;

                }

                const match =
                    matches.get(
                        matchId
                    );

                if (
                    !match
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Match not found."
                        }
                    );

                    return;

                }

                if (
                    match.phase !==
                    "waiting"
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "This match has already started."
                        }
                    );

                    return;

                }

                if (
                    match.players[1]
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "This match is already full."
                        }
                    );

                    return;

                }

                const player =
                    {
                        number: 2,

                        name:
                            playerName,

                        socketId:
                            socket.id,

                        team: [],

                        dropToken:
                            true,

                        connected:
                            true
                    };

                match.players[1] =
                    player;

                socketPlayers.set(
                    socket.id,
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            2
                    }
                );

                socket.join(
                    match.id
                );

                socket.emit(
                    "match:joined",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            2,

                        playerName,

                        battleName:
                            match.battleName,

                        message:
                            "Successfully joined the match."
                    }
                );

                console.log(
                    `Player 2 joined match: ${match.id}`
                );

                startMatch(
                    match
                );

            }
        );

        /* =============================================
           FIND MATCH
           ============================================= */

        socket.on(
            "match:find",
            data => {

                const playerName =
                    String(
                        data?.playerName ||
                        ""
                    )
                    .trim()
                    .slice(
                        0,
                        24
                    );

                if (
                    playerName.length <
                    2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Enter a valid player name."
                        }
                    );

                    return;

                }

                const match =
                    findWaitingMatch();

                if (
                    !match
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "No available match found."
                        }
                    );

                    return;

                }

                const player =
                    {
                        number: 2,

                        name:
                            playerName,

                        socketId:
                            socket.id,

                        team: [],

                        dropToken:
                            true,

                        connected:
                            true
                    };

                match.players[1] =
                    player;

                socketPlayers.set(
                    socket.id,
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            2
                    }
                );

                socket.join(
                    match.id
                );

                socket.emit(
                    "match:found",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            2,

                        playerName,

                        battleName:
                            match.battleName
                    }
                );

                startMatch(
                    match
                );

            }
        );

        /* =============================================
           MATCH RECONNECT
           ============================================= */

        socket.on(
            "match:reconnect",
            data => {

                const matchId =
                    String(
                        data?.matchId ||
                        ""
                    )
                    .trim()
                    .toUpperCase();

                const requestedPlayerNumber =
                    Number(
                        data?.playerNumber
                    );

                const match =
                    matches.get(
                        matchId
                    );

                if (
                    !match
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Match no longer exists."
                        }
                    );

                    return;

                }

                let playerNumber =
                    requestedPlayerNumber;

                /*
                 * If the player number was not sent,
                 * attempt to reconnect only to a disconnected
                 * player slot.
                 */

                if (
                    playerNumber !==
                    1 &&
                    playerNumber !==
                    2
                ) {

                    const disconnected =
                        match.players.find(
                            player =>
                                player &&
                                !player.connected
                        );

                    if (
                        disconnected
                    ) {

                        playerNumber =
                            disconnected.number;

                    }

                }

                const player =
                    getPlayer(
                        match,
                        playerNumber
                    );

                if (
                    !player
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Unable to restore player."
                        }
                    );

                    return;

                }

                /*
                 * Prevent another active player from stealing
                 * an occupied player slot.
                 */

                if (
                    player.connected &&
                    player.socketId &&
                    player.socketId !==
                    socket.id
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "This player is already connected."
                        }
                    );

                    return;

                }

                player.socketId =
                    socket.id;

                player.connected =
                    true;

                socketPlayers.set(
                    socket.id,
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            player.number
                    }
                );

                socket.join(
                    match.id
                );

                socket.emit(
                    "match:ready",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            player.number,

                        playerName:
                            player.name,

                        battleName:
                            match.battleName
                    }
                );

                sendDraftState(
                    socket,
                    match,
                    player.number
                );

                broadcastTurn(
                    match
                );

            }
        );

        /* =============================================
           DRAFT DRAW
           ============================================= */

        socket.on(
            "draft:draw",
            () => {

                const session =
                    getPlayerBySocket(
                        socket.id
                    );

                if (
                    !session
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Match not found."
                        }
                    );

                    return;

                }

                const {
                    match,
                    player,
                    playerNumber
                } =
                    session;

                if (
                    match.phase !==
                    "draft"
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Draft is not active."
                        }
                    );

                    return;

                }

                if (
                    match.currentTurn !==
                    playerNumber
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "It is not your turn."
                        }
                    );

                    return;

                }

                if (
                    player.team.length >=
                    TEAM_SIZE
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Your team already has 6 characters."
                        }
                    );

                    return;

                }

                const character =
                    getRandomCharacter(
                        match
                    );

                if (
                    !character
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "No characters are available."
                        }
                    );

                    return;

                }

                const characterData =
                    {
                        name:
                            character
                    };

                player.team.push(
                    characterData
                );

                /*
                 * Send the drawn character ONLY to the
                 * player who drew it.
                 */

                socket.emit(
                    "draft:character",
                    {
                        character:
                            characterData,

                        team:
                            player.team,

                        dropToken:
                            player.dropToken,

                        message:
                            `${character} joined your team.`
                    }
                );

                /*
                 * If both teams are full,
                 * finish the draft.
                 */

                if (
                    isDraftComplete(
                        match
                    )
                ) {

                    match.phase =
                        "complete";

                    match.players.forEach(
                        targetPlayer => {

                            if (
                                !targetPlayer ||
                                !targetPlayer.socketId
                            ) {

                                return;

                            }

                            io.to(
                                targetPlayer.socketId
                            ).emit(
                                "draft:complete",
                                {
                                    team:
                                        targetPlayer.team
                                }
                            );

                        }
                    );

                    setTimeout(
                        () => {

                            match.players.forEach(
                                targetPlayer => {

                                    if (
                                        !targetPlayer ||
                                        !targetPlayer.socketId
                                    ) {

                                        return;

                                    }

                                    io.to(
                                        targetPlayer.socketId
                                    ).emit(
                                        "match:roles",
                                        {
                                            matchId:
                                                match.id,

                                            battleName:
                                                match.battleName
                                        }
                                    );

                                }
                            );

                            match.phase =
                                "roles";

                        },
                        1500
                    );

                    return;

                }

                switchTurn(
                    match
                );

                broadcastTurn(
                    match
                );

            }
        );

        /* =============================================
           DRAFT DROP
           ============================================= */

        socket.on(
            "draft:drop",
            () => {

                const session =
                    getPlayerBySocket(
                        socket.id
                    );

                if (
                    !session
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Match not found."
                        }
                    );

                    return;

                }

                const {
                    match,
                    player,
                    playerNumber
                } =
                    session;

                if (
                    match.phase !==
                    "draft"
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Draft is not active."
                        }
                    );

                    return;

                }

                if (
                    match.currentTurn !==
                    playerNumber
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "It is not your turn."
                        }
                    );

                    return;

                }

                if (
                    !player.dropToken
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Drop Token already used."
                        }
                    );

                    return;

                }

                if (
                    player.team.length !==
                    TEAM_SIZE
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "You can use Drop Token after drafting 6 characters."
                        }
                    );

                    return;

                }

                /*
                 * Remove the most recently drawn character.
                 *
                 * The client cannot choose arbitrary opponent
                 * or server-side characters.
                 */

                const droppedCharacter =
                    player.team.pop();

                player.dropToken =
                    false;

                socket.emit(
                    "draft:dropped",
                    {
                        team:
                            player.team,

                        dropToken:
                            false,

                        droppedCharacter,

                        message:
                            "Character dropped. Draw one replacement."
                    }
                );

                /*
                 * The same player keeps the turn so they can
                 * immediately draw the replacement.
                 */

                broadcastTurn(
                    match
                );

            }
        );

        /* =============================================
           MATCH CANCEL
           ============================================= */

        socket.on(
            "match:cancel",
            () => {

                const session =
                    getPlayerBySocket(
                        socket.id
                    );

                if (
                    !session
                ) {

                    return;

                }

                const {
                    match,
                    playerNumber
                } =
                    session;

                if (
                    playerNumber ===
                    1 &&
                    match.phase ===
                    "waiting"
                ) {

                    matches.delete(
                        match.id
                    );

                    socketPlayers.delete(
                        socket.id
                    );

                    socket.leave(
                        match.id
                    );

                    socket.emit(
                        "match:ended",
                        {
                            message:
                                "Match cancelled."
                        }
                    );

                }

            }
        );

        /* =============================================
           DISCONNECT
           ============================================= */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    "Player disconnected:",
                    socket.id
                );

                const session =
                    socketPlayers.get(
                        socket.id
                    );

                if (
                    !session
                ) {

                    return;

                }

                const match =
                    matches.get(
                        session.matchId
                    );

                if (
                    match
                ) {

                    const player =
                        getPlayer(
                            match,
                            session.playerNumber
                        );

                    if (
                        player &&
                        player.socketId ===
                        socket.id
                    ) {

                        player.connected =
                            false;

                        player.socketId =
                            null;

                    }

                }

                socketPlayers.delete(
                    socket.id
                );

            }
        );

    }
);

/* =========================================================
   BASIC SERVER ROUTE
   ========================================================= */

app.get(
    "/",
    (
        request,
        response
    ) => {

        response.send(
            "ADG Game Server is running."
        );

    }
);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    "/health",
    (
        request,
        response
    ) => {

        response.json(
            {
                status:
                    "ok",

                matches:
                    matches.size,

                characters:
                    CHARACTER_POOL.length
            }
        );

    }
);

/* =========================================================
   START SERVER
   ========================================================= */

server.listen(
    PORT,
    () => {

        console.log(
            `ADG server running on port ${PORT}`
        );

    }
);

/* =========================================================
   END OF SERVER.JS
   ========================================================= */

