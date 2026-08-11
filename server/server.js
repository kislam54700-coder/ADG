```javascript
/* =========================================================
   ADG — SERVER.JS
   Private Online Multiplayer Server
   ========================================================= */

"use strict";


/* =========================================================
   IMPORTS
   ========================================================= */

const path =
    require("path");

const http =
    require("http");

const express =
    require("express");

const {
    Server
} =
    require("socket.io");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const PORT =
    Number(
        process.env.PORT
    ) ||
    3000;


const MAX_PLAYERS =
    2;


const TEAM_SIZE =
    6;


const ROLES = [
    "Captain",
    "Vice-Captain",
    "Tank",
    "Healer",
    "Support",
    "Traitor"
];


/* =========================================================
   APP
   ========================================================= */

const app =
    express();


const server =
    http.createServer(
        app
    );


const io =
    new Server(
        server,
        {
            cors: {
                origin: true,
                credentials: true
            }
        }
    );


/* =========================================================
   STATIC FILES
   ========================================================= */

const publicDirectory =
    path.join(
        __dirname
    );


app.use(
    express.static(
        publicDirectory
    )
);


/* =========================================================
   MATCH STORAGE
   ========================================================= */

/*
 * Production multiplayer should use a shared database.
 *
 * This in-memory store is intentionally simple for the
 * current server implementation.
 */

const matches =
    new Map();


/* =========================================================
   ID HELPERS
   ========================================================= */

function createMatchId() {

    return (
        Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()
    );

}


function createPlayerId() {

    return (
        Math.random()
            .toString(36)
            .slice(2) +
        Date.now()
            .toString(36)
    );

}


/* =========================================================
   MATCH HELPERS
   ========================================================= */

function getMatch(
    matchId
) {

    if (!matchId) {
        return null;
    }

    return matches.get(
        String(matchId)
    ) || null;

}


function getPlayer(
    match,
    playerNumber
) {

    if (!match) {
        return null;
    }


    return match.players.find(
        player =>
            player.number ===
            Number(playerNumber)
    ) || null;

}


function getPlayerBySocket(
    match,
    socketId
) {

    if (!match) {
        return null;
    }


    return match.players.find(
        player =>
            player.socketId ===
            socketId
    ) || null;

}


/* =========================================================
   PRIVATE STATE
   ========================================================= */

function privateDraftState(
    match,
    player
) {

    return {

        matchId:
            match.id,

        anime:
            match.anime,

        playerNumber:
            player.number,

        playerName:
            player.name,

        team:
            player.team.map(
                character => ({
                    ...character
                })
            ),

        dropToken:
            player.dropToken,

        myTurn:
            match.turn ===
            player.number,

        draftComplete:
            match.phase !==
            "draft"

    };

}


/* =========================================================
   PRIVATE ROLE STATE
   ========================================================= */

function privateRoleState(
    match,
    player
) {

    return {

        matchId:
            match.id,

        anime:
            match.anime,

        playerNumber:
            player.number,

        playerName:
            player.name,

        team:
            player.team.map(
                character => ({
                    ...character
                })
            ),

        roles:
            player.roles || {},

        roleComplete:
            Boolean(
                player.roleComplete
            )

    };

}


/* =========================================================
   BROADCAST DRAFT STATE
   ========================================================= */

function sendDraftState(
    match
) {

    for (
        const player
        of match.players
    ) {

        if (
            !player.socketId
        ) {
            continue;
        }


        io.to(
            player.socketId
        ).emit(
            "draft:state",
            privateDraftState(
                match,
                player
            )
        );

    }

}


/* =========================================================
   TURN BROADCAST
   ========================================================= */

function sendTurn(
    match
) {

    io.to(
        match.id
    ).emit(
        "draft:turn",
        {
            playerNumber:
                match.turn
        }
    );

}


/* =========================================================
   CHARACTER DATABASE
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
    "Boa Hancock",
    "Dracule Mihawk",
    "Marshall D. Teach",
    "Edward Newgate",
    "Marco",
    "Charlotte Linlin",
    "Kaido",
    "Yamato",
    "Kozuki Oden",
    "Donquixote Doflamingo",
    "Crocodile",
    "Rob Lucci",
    "Kaku",
    "Smoker",
    "Tashigi",
    "Buggy",
    "Bon Clay",
    "Gecko Moria",
    "Perona",
    "Enel",
    "Magellan",
    "Katakuri",
    "King",
    "Queen",
    "Jack",
    "Killer"

];


/* =========================================================
   CHARACTER POOL
   ========================================================= */

function createCharacterPool(
    anime
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
   RANDOM DRAW
   ========================================================= */

function drawRandomCharacter(
    match
) {

    if (
        !match.characterPool.length
    ) {

        return null;

    }


    const index =
        Math.floor(
            Math.random() *
            match.characterPool.length
        );


    const name =
        match.characterPool[
            index
        ];


    match.characterPool.splice(
        index,
        1
    );


    return {
        name
    };

}


/* =========================================================
   NEXT TURN
   ========================================================= */

function switchTurn(
    match
) {

    match.turn =
        match.turn === 1
            ? 2
            : 1;

}


/* =========================================================
   DRAFT COMPLETE CHECK
   ========================================================= */

function checkDraftComplete(
    match
) {

    return match.players.every(
        player =>
            player.team.length ===
            TEAM_SIZE
    );

}


/* =========================================================
   ROLE COMPLETE CHECK
   ========================================================= */

function checkRoleComplete(
    player
) {

    if (
        player.team.length !==
        TEAM_SIZE
    ) {

        return false;

    }


    const assigned =
        Object.values(
            player.roles || {}
        );


    return (
        assigned.length ===
        TEAM_SIZE &&
        new Set(
            assigned
        ).size ===
        TEAM_SIZE &&
        ROLES.every(
            role =>
                assigned.includes(
                    role
                )
        )
    );

}


/* =========================================================
   CREATE MATCH
   ========================================================= */

function createMatch(
    playerName,
    anime
) {

    const id =
        createMatchId();


    const player = {

        id:
            createPlayerId(),

        number:
            1,

        name:
            playerName ||
            "Player 1",

        socketId:
            null,

        team:
            [],

        dropToken:
            true,

        roles:
            {},

        roleComplete:
            false

    };


    const match = {

        id,

        anime:
            anime ||
            "One Piece",

        phase:
            "waiting",

        turn:
            1,

        characterPool:
            createCharacterPool(
                anime ||
                "One Piece"
            ),

        players: [
            player
        ]

    };


    matches.set(
        id,
        match
    );


    return {
        match,
        player
    };

}


/* =========================================================
   SOCKET CONNECTION
   ========================================================= */

io.on(
    "connection",
    socket => {

        console.log(
            `[CONNECT] ${socket.id}`
        );


        /* =================================================
           CREATE MATCH
           ================================================= */

        socket.on(
            "match:create",
            data => {

                const playerName =
                    String(
                        data?.playerName ||
                        "Player 1"
                    ).trim()
                    .slice(
                        0,
                        24
                    );


                const anime =
                    String(
                        data?.anime ||
                        "One Piece"
                    );


                const result =
                    createMatch(
                        playerName,
                        anime
                    );


                const {
                    match,
                    player
                } =
                    result;


                player.socketId =
                    socket.id;


                socket.join(
                    match.id
                );


                match.phase =
                    "draft";


                socket.emit(
                    "match:created",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            player.number,

                        playerName:
                            player.name,

                        anime:
                            match.anime
                    }
                );


                sendDraftState(
                    match
                );


                console.log(
                    `[MATCH CREATE] ${match.id}`
                );

            }
        );


        /* =================================================
           JOIN MATCH
           ================================================= */

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


                const match =
                    getMatch(
                        matchId
                    );


                if (!match) {

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
                    match.players.length >=
                    MAX_PLAYERS
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Match is full."
                        }
                    );

                    return;

                }


                const playerName =
                    String(
                        data?.playerName ||
                        "Player 2"
                    ).trim()
                    .slice(
                        0,
                        24
                    );


                const player = {

                    id:
                        createPlayerId(),

                    number:
                        2,

                    name:
                        playerName ||
                        "Player 2",

                    socketId:
                        socket.id,

                    team:
                        [],

                    dropToken:
                        true,

                    roles:
                        {},

                    roleComplete:
                        false

                };


                match.players.push(
                    player
                );


                match.phase =
                    "draft";

                match.turn =
                    1;


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

                        playerName:
                            player.name,

                        anime:
                            match.anime
                    }
                );


                io.to(
                    match.id
                ).emit(
                    "match:ready",
                    {
                        matchId:
                            match.id,

                        anime:
                            match.anime
                    }
                );


                sendDraftState(
                    match
                );

                sendTurn(
                    match
                );

            }
        );


        /* =================================================
           RECONNECT
           ================================================= */

        socket.on(
            "match:reconnect",
            data => {

                const match =
                    getMatch(
                        data?.matchId
                    );


                if (!match) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Match not found."
                        }
                    );

                    return;

                }


                /*
                 * The client does not send its player number.
                 * The server identifies the reconnecting player
                 * through the existing session/socket mapping
                 * where available.
                 */

                const existingPlayer =
                    match.players.find(
                        player =>
                            !player.socketId ||
                            player.socketId ===
                            socket.id
                    );


                if (!existingPlayer) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Unable to restore this player."
                        }
                    );

                    return;

                }


                existingPlayer.socketId =
                    socket.id;


                socket.join(
                    match.id
                );


                socket.emit(
                    "match:reconnected",
                    {
                        matchId:
                            match.id,

                        playerNumber:
                            existingPlayer.number,

                        anime:
                            match.anime
                    }
                );


                sendDraftState(
                    match
                );


                if (
                    match.phase ===
                    "draft"
                ) {

                    sendTurn(
                        match
                    );

                }

            }
        );


        /* =================================================
           DRAW
           ================================================= */

        socket.on(
            "draft:draw",
            data => {

                const match =
                    getMatch(
                        data?.matchId
                    );


                const player =
                    getPlayerBySocket(
                        match,
                        socket.id
                    );


                if (
                    !match ||
                    !player
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Match or player not found."
                        }
                    );

                    return;

                }


                if (
                    match.phase !==
                    "draft"
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Draft phase has ended."
                        }
                    );

                    return;

                }


                if (
                    match.turn !==
                    player.number
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
                    drawRandomCharacter(
                        match
                    );


                if (!character) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "No characters remain in the pool."
                        }
                    );

                    return;

                }


                player.team.push(
                    character
                );


                socket.emit(
                    "draft:character",
                    {
                        character,
                        team:
                            player.team,
                        dropToken:
                            player.dropToken,
                        message:
                            `${character.name} drafted.`
                    }
                );


                switchTurn(
                    match
                );


                if (
                    checkDraftComplete(
                        match
                    )
                ) {

                    match.phase =
                        "roles";


                    for (
                        const p
                        of match.players
                    ) {

                        p.roleComplete =
                            false;

                    }


                    io.to(
                        match.id
                    ).emit(
                        "draft:complete",
                        {
                            matchId:
                                match.id
                        }
                    );


                    io.to(
                        match.id
                    ).emit(
                        "match:roles",
                        {
                            matchId:
                                match.id
                        }
                    );


                    return;

                }


                sendDraftState(
                    match
                );

                sendTurn(
                    match
                );

            }
        );


        /* =================================================
           DROP
           ================================================= */

        socket.on(
            "draft:drop",
            data => {

                const match =
                    getMatch(
                        data?.matchId
                    );


                const player =
                    getPlayerBySocket(
                        match,
                        socket.id
                    );


                if (
                    !match ||
                    !player
                ) {

                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "Match or player not found."
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
                                "Drop Token has already been used."
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
                                "You can only use Drop Token after drafting 6 characters."
                        }
                    );

                    return;

                }


                if (
                    match.turn !==
                    player.number
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


                const requestedName =
                    String(
                        data?.character ||
                        ""
                    );


                let index =
                    player.team.findIndex(
                        character =>
                            character.name ===
                            requestedName
                    );


                /*
                 * If the client does not specify a valid character,
                 * the server drops the most recently drafted one.
                 */

                if (
                    index < 0
                ) {

                    index =
                        player.team.length -
                        1;

                }


                const dropped =
                    player.team.splice(
                        index,
                        1
                    )[0];


                if (dropped) {

                    /*
                     * Return the dropped character to the pool.
                     */

                    match.characterPool.push(
                        dropped.name
                    );

                }


                player.dropToken =
                    false;


                const replacement =
                    drawRandomCharacter(
                        match
                    );


                if (!replacement) {

                    /*
                     * Restore the character if no replacement exists.
                     */

                    if (dropped) {

                        player.team.push(
                            dropped
                        );

                    }


                    player.dropToken =
                        true;


                    socket.emit(
                        "draft:error",
                        {
                            message:
                                "No replacement character is available."
                        }
                    );

                    return;

                }


                player.team.push(
                    replacement
                );


                socket.emit(
                    "draft:dropped",
                    {
                        dropped:
                            dropped,

                        replacement:
                            replacement,

                        team:
                            player.team
                    }
                );


                sendDraftState(
                    match
                );


                /*
                 * Drop does not consume another normal draft turn.
                 * The same player gets the replacement immediately,
                 * then the turn passes.
                 */

                switchTurn(
                    match
                );


                sendTurn(
                    match
                );

            }
        );


        /* =================================================
           ROLE ASSIGNMENT
           ================================================= */

        socket.on(
            "roles:assign",
            data => {

                const match =
                    getMatch(
                        data?.matchId
                    );


                const player =
                    getPlayerBySocket(
                        match,
                        socket.id
                    );


                if (
                    !match ||
                    !player
                ) {

                    socket.emit(
                        "roles:error",
                        {
                            message:
                                "Match or player not found."
                        }
                    );

                    return;

                }


                if (
                    match.phase !==
                    "roles"
                ) {

                    socket.emit(
                        "roles:error",
                        {
                            message:
                                "Role Assignment is not active."
                        }
                    );

                    return;

                }


                const requestedRoles =
                    data?.roles;


                if (
                    !requestedRoles ||
                    typeof requestedRoles !==
                    "object"
                ) {

                    socket.emit(
                        "roles:error",
                        {
                            message:
                                "Invalid role data."
                        }
                    );

                    return;

                }


                const newRoles =
                    {};


                for (
                    const character
                    of player.team
                ) {

                    const role =
                        requestedRoles[
                            character.name
                        ];


                    if (
                        typeof role !==
                        "string" ||
                        !ROLES.includes(
                            role
                        )
                    ) {

                        socket.emit(
                            "roles:error",
                            {
                                message:
                                    `Invalid role for ${character.name}.`
                            }
                        );

                        return;

                    }


                    newRoles[
                        character.name
                    ] =
                        role;

                }


                const assigned =
                    Object.values(
                        newRoles
                    );


                if (
                    assigned.length !==
                    TEAM_SIZE
                ) {

                    socket.emit(
                        "roles:error",
                        {
                            message:
                                "Assign all 6 roles."
                        }
                    );

                    return;

                }


                if (
                    new Set(
                        assigned
                    ).size !==
                    TEAM_SIZE
                ) {

                    socket.emit(
                        "roles:error",
                        {
                            message:
                                "Each role can only be used once."
                        }
                    );

                    return;

                }


                player.roles =
                    newRoles;


                player.roleComplete =
                    true;


                socket.emit(
                    "roles:state",
                    privateRoleState(
                        match,
                        player
                    )
                );


                const bothReady =
                    match.players.length ===
                    MAX_PLAYERS &&
                    match.players.every(
                        p =>
                            p.roleComplete
                    );


                if (
                    bothReady
                ) {

                    match.phase =
                        "battle";


                    io.to(
                        match.id
                    ).emit(
                        "match:battle",
                        {
                            matchId:
                                match.id
                        }
                    );

                }

            }
        );


        /* =================================================
           LEAVE MATCH
           ================================================= */

        socket.on(
            "match:leave",
            data => {

                const match =
                    getMatch(
                        data?.matchId
                    );


                if (!match) {
                    return;
                }


                const player =
                    getPlayerBySocket(
                        match,
                        socket.id
                    );


                if (!player) {
                    return;
                }


                io.to(
                    match.id
                ).emit(
                    "match:ended",
                    {
                        message:
                            `${player.name} left the match.`
                    }
                );


                matches.delete(
                    match.id
                );

            }
        );


        /* =================================================
           DISCONNECT
           ================================================= */

        socket.on(
            "disconnect",
            () => {

                console.log(
                    `[DISCONNECT] ${socket.id}`
                );


                /*
                 * Keep match state alive so a temporary
                 * connection loss can reconnect.
                 */

                for (
                    const match
                    of matches.values()
                ) {

                    const player =
                        getPlayerBySocket(
                            match,
                            socket.id
                        );


                    if (
                        player
                    ) {

                        player.socketId =
                            null;

                    }

                }

            }
        );

    }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    "/health",
    (
        req,
        res
    ) => {

        res.json(
            {
                ok:
                    true,

                matches:
                    matches.size,

                uptime:
                    process.uptime()
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
            `⚔️ ADG server running on port ${PORT}`
        );

    }
);


/* =========================================================
   END OF SERVER.JS
   ========================================================= */
```
