/* =========================================================
   ADG — SERVER.JS
   Multiplayer Match + Draft Server
   Node.js + Express + Socket.IO
   ========================================================= */

"use strict";

/* =========================================================
   IMPORTS
   ========================================================= */

const path = require("path");
const http = require("http");
const crypto = require("crypto");

const express = require("express");
const { Server } = require("socket.io");

/* =========================================================
   APP
   ========================================================= */

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },

    transports: [
        "websocket",
        "polling"
    ]
});

/* =========================================================
   CONFIGURATION
   ========================================================= */

const PORT =
    Number(process.env.PORT) || 3000;

const HOST =
    "0.0.0.0";

const TEAM_SIZE =
    6;

const DEFAULT_ANIME =
    "One Piece";

/* =========================================================
   STATIC FILES
   ========================================================= */

app.use(
    express.json()
);

app.use(
    express.static(
        __dirname
    )
);

/* =========================================================
   BASIC ROUTES
   ========================================================= */

/*
 * Health check.
 *
 * Render can use this to verify that the server
 * is alive.
 */

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            ok: true,

            service:
                "ADG Server",

            time:
                new Date().toISOString()

        });

    }
);

/*
 * Express 5 does not accept:
 *
 *     app.get("*", ...)
 *
 * Therefore we use middleware instead of a
 * wildcard route.
 *
 * Static files are already handled by express.static().
 *
 * If a browser requests a route without a file
 * extension, serve index.html.
 */

app.use(
    (req, res, next) => {

        /*
         * Never interfere with Socket.IO.
         */

        if (
            req.path.startsWith(
                "/socket.io/"
            )
        ) {

            return next();

        }

        /*
         * Only handle normal GET page requests.
         */

        if (
            req.method === "GET" &&
            !req.path.includes(".")
        ) {

            return res.sendFile(
                path.join(
                    __dirname,
                    "index.html"
                )
            );

        }

        next();

    }
);

/* =========================================================
   MATCH STORAGE
   ========================================================= */

/*
 * IMPORTANT:
 *
 * This is an in-memory server.
 *
 * If Render restarts/redeploys the service,
 * active matches disappear.
 *
 * This is intentional for the current prototype.
 */

const matches =
    new Map();

/*
 * Socket -> Match ID
 */

const socketMatches =
    new Map();

/* =========================================================
   HELPERS
   ========================================================= */

function createMatchId() {

    return crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

}


function normalizeName(
    name
) {

    return String(
        name || ""
    )
        .trim()
        .slice(0, 24);

}


function normalizeAnime(
    anime
) {

    return String(
        anime ||
        DEFAULT_ANIME
    )
        .trim()
        .slice(0, 64);

}


function findPlayer(
    match,
    socketId
) {

    return match.players.find(
        player =>
            player.socketId === socketId
    );

}


function getPlayer(
    match,
    playerNumber
) {

    return match.players.find(
        player =>
            player.number === playerNumber
    );

}


function otherPlayer(
    match,
    playerNumber
) {

    return match.players.find(
        player =>
            player.number !== playerNumber
    );

}


/*
 * Determine whether a socket currently
 * belongs to a connected client.
 */

function isSocketConnected(
    socketId
) {

    return io.sockets.sockets.has(
        socketId
    );

}

/* =========================================================
   PUBLIC MATCH DATA
   ========================================================= */

function getPublicMatchData(
    match,
    playerNumber
) {

    const player =
        getPlayer(
            match,
            playerNumber
        );

    return {

        matchId:
            match.id,

        anime:
            match.anime,

        playerNumber:
            playerNumber,

        playerName:
            player
                ? player.name
                : "",

        playerCount:
            match.players.length,

        ready:
            match.players.length === 2,

        draftStarted:
            match.draft.started,

        draftComplete:
            match.draft.complete

    };

}

/* =========================================================
   PRIVATE DRAFT STATE
   ========================================================= */

function getPrivateDraftState(
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

        team:
            player.team.map(
                character => ({
                    ...character
                })
            ),

        dropToken:
            player.dropToken,

        myTurn:
            match.draft.currentPlayer ===
            player.number,

        draftComplete:
            match.draft.complete

    };

}

/* =========================================================
   SEND PRIVATE DRAFT STATE
   ========================================================= */

function sendDraftState(
    match,
    player
) {

    if (!player) {
        return;
    }

    io.to(
        player.socketId
    ).emit(
        "draft:state",
        getPrivateDraftState(
            match,
            player
        )
    );

}

/* =========================================================
   SEND DRAFT TURN
   ========================================================= */

function sendDraftTurn(
    match
) {

    match.players.forEach(
        player => {

            io.to(
                player.socketId
            ).emit(
                "draft:turn",
                {

                    playerNumber:
                        match.draft.currentPlayer,

                    myTurn:
                        match.draft.currentPlayer ===
                        player.number

                }
            );

        }
    );

}

/* =========================================================
   SEND DRAFT COMPLETE
   ========================================================= */

function sendDraftComplete(
    match
) {

    match.players.forEach(
        player => {

            io.to(
                player.socketId
            ).emit(
                "draft:complete",
                {

                    matchId:
                        match.id,

                    team:
                        player.team.map(
                            character => ({
                                ...character
                            })
                        )

                }
            );

        }
    );

}

/* =========================================================
   CHARACTER DATABASE
   ========================================================= */

function getCharacterDatabase(
    anime
) {

    /*
     * The server does NOT trust the client-side
     * character database.
     *
     * The server owns the valid character list.
     */

    if (
        anime !== "One Piece"
    ) {

        return [];

    }

    return [

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

        "Trafalgar Law",
        "Eustass Kid",

        "Dracule Mihawk",
        "Boa Hancock",
        "Crocodile",
        "Donquixote Doflamingo",

        "Edward Newgate",
        "Marco",
        "Jozu",
        "Vista",

        "Kaido",
        "King",
        "Queen",
        "Jack",

        "Charlotte Linlin",
        "Katakuri",

        "Marshall D. Teach",
        "Jesus Burgess",
        "Van Augur",

        "Koby",
        "Smoker",

        "Rob Lucci",
        "Kaku",

        "Enel",

        "Buggy",

        "Gecko Moria",

        "Perona",

        "Bartolomeo",

        "Cavendish",

        "Boa Sandersonia",
        "Boa Marigold"

    ];

}

/* =========================================================
   RANDOM CHARACTER
   ========================================================= */

function drawRandomCharacter(
    match
) {

    const database =
        getCharacterDatabase(
            match.anime
        );

    const used =
        new Set(
            match.usedCharacters
        );

    const available =
        database.filter(
            name =>
                !used.has(
                    name
                )
        );

    if (
        available.length === 0
    ) {

        return null;

    }

    const index =
        Math.floor(
            Math.random() *
            available.length
        );

    const name =
        available[index];

    match.usedCharacters.add(
        name
    );

    return {

        name,

        anime:
            match.anime

    };

}

/* =========================================================
   CREATE MATCH
   ========================================================= */

function createMatch(
    socket,
    playerName,
    anime
) {

    let matchId =
        createMatchId();

    while (
        matches.has(
            matchId
        )
    ) {

        matchId =
            createMatchId();

    }

    const match = {

        id:
            matchId,

        anime:
            normalizeAnime(
                anime
            ),

        players: [],

        usedCharacters:
            new Set(),

        draft: {

            started:
                false,

            currentPlayer:
                1,

            complete:
                false

        },

        roles: {

            assignments: {

                1: {},

                2: {}

            },

            complete: {

                1:
                    false,

                2:
                    false

            }

        }

    };

    const player = {

        number:
            1,

        socketId:
            socket.id,

        name:
            normalizeName(
                playerName
            ),

        team: [],

        dropToken:
            true

    };

    match.players.push(
        player
    );

    matches.set(
        matchId,
        match
    );

    socketMatches.set(
        socket.id,
        matchId
    );

    return match;

}

/* =========================================================
   JOIN EXISTING MATCH
   ========================================================= */

function joinExistingMatch(
    match,
    socket,
    playerName
) {

    if (
        match.players.length >= 2
    ) {

        return {

            success:
                false,

            message:
                "This match is already full."

        };

    }

    const player = {

        number:
            2,

        socketId:
            socket.id,

        name:
            normalizeName(
                playerName
            ),

        team: [],

        dropToken:
            true

    };

    match.players.push(
        player
    );

    socketMatches.set(
        socket.id,
        match.id
    );

    return {

        success:
            true,

        player

    };

}

/* =========================================================
   START DRAFT
   ========================================================= */

function startDraft(
    match
) {

    if (
        match.players.length !== 2
    ) {

        return;

    }

    if (
        match.draft.started
    ) {

        return;

    }

    match.draft.started =
        true;

    match.draft.currentPlayer =
        1;

    match.draft.complete =
        false;

    match.players.forEach(
        player => {

            io.to(
                player.socketId
            ).emit(
                "match:ready",
                getPublicMatchData(
                    match,
                    player.number
                )
            );

        }
    );

    sendDraftTurn(
        match
    );

    match.players.forEach(
        player => {

            sendDraftState(
                match,
                player
            );

        }
    );

}

/* =========================================================
   DRAFT DRAW
   ========================================================= */

function handleDraftDraw(
    socket,
    data
) {

    const matchId =
        data?.matchId;

    const match =
        matches.get(
            matchId
        );

    if (!match) {

        socket.emit(
            "draft:error",
            {
                message:
                    "Match not found."
            }
        );

        return;

    }

    const player =
        findPlayer(
            match,
            socket.id
        );

    if (!player) {

        socket.emit(
            "draft:error",
            {
                message:
                    "You are not part of this match."
            }
        );

        return;

    }

    if (
        !match.draft.started
    ) {

        socket.emit(
            "draft:error",
            {
                message:
                    "The draft has not started yet."
            }
        );

        return;

    }

    if (
        match.draft.complete
    ) {

        socket.emit(
            "draft:error",
            {
                message:
                    "The draft is already complete."
            }
        );

        return;

    }

    if (
        match.draft.currentPlayer !==
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
                    "No characters are available."
            }
        );

        return;

    }

    player.team.push(
        character
    );

    /*
     * The freshly drawn character is private.
     */

    socket.emit(
        "draft:character",
        {

            character,

            team:
                player.team.map(
                    item => ({
                        ...item
                    })
                ),

            dropToken:
                player.dropToken,

            message:
                `${character.name} has been drafted.`

        }
    );

    /*
     * Check whether both teams are complete.
     */

    const allComplete =
        match.players.every(
            item =>
                item.team.length ===
                TEAM_SIZE
        );

    if (
        allComplete
    ) {

        completeDraft(
            match
        );

        return;

    }

    /*
     * Pass the turn to the other player.
     */

    match.draft.currentPlayer =
        match.draft.currentPlayer === 1
            ? 2
            : 1;

    sendDraftTurn(
        match
    );

    match.players.forEach(
        item => {

            sendDraftState(
                match,
                item
            );

        }
    );

}

/* =========================================================
   DRAFT DROP
   ========================================================= */

function handleDraftDrop(
    socket,
    data
) {

    const matchId =
        data?.matchId;

    const match =
        matches.get(
            matchId
        );

    if (!match) {

        socket.emit(
            "draft:error",
            {
                message:
                    "Match not found."
            }
        );

        return;

    }

    const player =
        findPlayer(
            match,
            socket.id
        );

    if (!player) {

        socket.emit(
            "draft:error",
            {
                message:
                    "You are not part of this match."
            }
        );

        return;

    }

    if (
        match.draft.complete
    ) {

        socket.emit(
            "draft:error",
            {
                message:
                    "The draft is already complete."
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
                    "Your Drop Token has already been used."
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
                    "You can only drop after drafting 6 characters."
            }
        );

        return;

    }

    if (
        match.draft.currentPlayer !==
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

    /*
     * The client can request a character by name,
     * but the server verifies that the character
     * actually belongs to this player.
     */

    let characterIndex =
        -1;

    if (
        data?.character
    ) {

        characterIndex =
            player.team.findIndex(
                character =>
                    character.name ===
                    data.character
            );

    }

    /*
     * If no valid character was supplied,
     * use the last character.
     */

    if (
        characterIndex === -1
    ) {

        characterIndex =
            player.team.length - 1;

    }

    const droppedCharacter =
        player.team[
            characterIndex
        ];

    if (!droppedCharacter) {

        socket.emit(
            "draft:error",
            {
                message:
                    "Invalid character."
            }
        );

        return;

    }

    /*
     * Remove character.
     */

    player.team.splice(
        characterIndex,
        1
    );

    /*
     * Make dropped character available again.
     */

    match.usedCharacters.delete(
        droppedCharacter.name
    );

    /*
     * Consume Drop Token.
     */

    player.dropToken =
        false;

    /*
     * Draw replacement.
     */

    const replacement =
        drawRandomCharacter(
            match
        );

    if (!replacement) {

        /*
         * Safety rollback.
         */

        player.team.push(
            droppedCharacter
        );

        match.usedCharacters.add(
            droppedCharacter.name
        );

        player.dropToken =
            true;

        socket.emit(
            "draft:error",
            {
                message:
                    "Unable to draw a replacement character."
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

            team:
                player.team.map(
                    item => ({
                        ...item
                    })
                ),

            dropped:
                droppedCharacter.name,

            replacement:
                replacement.name

        }
    );

    socket.emit(
        "draft:character",
        {

            character:
                replacement,

            team:
                player.team.map(
                    item => ({
                        ...item
                    })
                ),

            dropToken:
                false,

            message:
                `${droppedCharacter.name} was dropped. ${replacement.name} is your replacement.`

        }
    );

    /*
     * Check completion.
     */

    const allComplete =
        match.players.every(
            item =>
                item.team.length ===
                TEAM_SIZE
        );

    if (
        allComplete
    ) {

        completeDraft(
            match
        );

        return;

    }

    /*
     * Continue alternating turns.
     */

    match.draft.currentPlayer =
        match.draft.currentPlayer === 1
            ? 2
            : 1;

    sendDraftTurn(
        match
    );

    match.players.forEach(
        item => {

            sendDraftState(
                match,
                item
            );

        }
    );

}

/* =========================================================
   COMPLETE DRAFT
   ========================================================= */

function completeDraft(
    match
) {

    if (
        match.draft.complete
    ) {

        return;

    }

    match.draft.complete =
        true;

    match.draft.currentPlayer =
        null;

    sendDraftComplete(
        match
    );

    /*
     * Send private state one final time.
     */

    match.players.forEach(
        player => {

            sendDraftState(
                match,
                player
            );

        }
    );

    /*
     * Tell both clients to move to roles.
     */

    setTimeout(
        () => {

            /*
             * Match may have been removed
             * while waiting.
             */

            if (
                !matches.has(
                    match.id
                )
            ) {

                return;

            }

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
                        "match:roles",
                        {
                            matchId:
                                match.id
                        }
                    );

                }
            );

        },
        700
    );

}

/* =========================================================
   RECONNECT
   ========================================================= */

function reconnectPlayer(
    socket,
    matchId
) {

    const match =
        matches.get(
            matchId
        );

    if (!match) {

        socket.emit(
            "match:error",
            {
                message:
                    "Match no longer exists."
            }
        );

        return;

    }

    /*
     * Current prototype:
     *
     * The client sends its player number.
     *
     * Production version should use a signed
     * authentication/session token.
     */

    const playerNumber =
        Number(
            socket.handshake.auth?.playerNumber ||
            0
        );

    let player =
        playerNumber
            ? getPlayer(
                match,
                playerNumber
            )
            : null;

    /*
     * Development fallback:
     *
     * If exactly one player slot is currently
     * disconnected, allow reconnection.
     */

    if (!player) {

        const disconnectedPlayers =
            match.players.filter(
                item =>
                    !isSocketConnected(
                        item.socketId
                    )
            );

        if (
            disconnectedPlayers.length === 1
        ) {

            player =
                disconnectedPlayers[0];

        }

    }

    if (!player) {

        socket.emit(
            "match:error",
            {
                message:
                    "Unable to identify your player slot."
            }
        );

        return;

    }

    /*
     * If the selected slot is already occupied
     * by another active socket, reject it.
     */

    if (
        isSocketConnected(
            player.socketId
        ) &&
        player.socketId !== socket.id
    ) {

        socket.emit(
            "match:error",
            {
                message:
                    "That player slot is already connected."
            }
        );

        return;

    }

    player.socketId =
        socket.id;

    socketMatches.set(
        socket.id,
        match.id
    );

    socket.emit(
        "match:reconnected",
        getPublicMatchData(
            match,
            player.number
        )
    );

    if (
        match.draft.started
    ) {

        sendDraftState(
            match,
            player
        );

        sendDraftTurn(
            match
        );

    }

}

/* =========================================================
   ROLE ASSIGNMENT
   ========================================================= */

function handleRoleAssignment(
    socket,
    data
) {

    const match =
        matches.get(
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

    const player =
        findPlayer(
            match,
            socket.id
        );

    if (!player) {

        socket.emit(
            "match:error",
            {
                message:
                    "You are not part of this match."
            }
        );

        return;

    }

    if (
        !match.draft.complete
    ) {

        socket.emit(
            "role:error",
            {
                message:
                    "Draft is not complete."
            }
        );

        return;

    }

    /*
     * Make sure the player actually has 6 characters.
     */

    if (
        player.team.length !==
        TEAM_SIZE
    ) {

        socket.emit(
            "role:error",
            {
                message:
                    "Your team must contain 6 characters."
            }
        );

        return;

    }

    const assignments =
        data?.assignments;

    if (
        !assignments ||
        typeof assignments !==
        "object" ||
        Array.isArray(assignments)
    ) {

        socket.emit(
            "role:error",
            {
                message:
                    "Invalid role assignment."
            }
        );

        return;

    }

    /*
     * Only accept assignments for the player's
     * actual six characters.
     */

    const teamNames =
        new Set(
            player.team.map(
                character =>
                    character.name
            )
        );

    const assignmentNames =
        Object.keys(
            assignments
        );

    if (
        assignmentNames.length !==
        TEAM_SIZE
    ) {

        socket.emit(
            "role:error",
            {
                message:
                    "You must assign roles to all 6 characters."
            }
        );

        return;

    }

    for (
        const characterName of assignmentNames
    ) {

        if (
            !teamNames.has(
                characterName
            )
        ) {

            socket.emit(
                "role:error",
                {
                    message:
                        "Invalid character in role assignment."
                }
            );

            return;

        }

    }

    const roles =
        Object.values(
            assignments
        );

    const uniqueRoles =
        new Set(
            roles
        );

    const requiredRoles =
        new Set([
            "captain",
            "vice-captain",
            "tank",
            "healer",
            "support",
            "traitor"
        ]);

    if (
        roles.length !==
        TEAM_SIZE ||
        uniqueRoles.size !==
        TEAM_SIZE
    ) {

        socket.emit(
            "role:error",
            {
                message:
                    "You must assign 6 unique roles."
            }
        );

        return;

    }

    for (
        const role of roles
    ) {

        if (
            !requiredRoles.has(
                role
            )
        ) {

            socket.emit(
                "role:error",
                {
                    message:
                        "Invalid role."
                }
            );

            return;

        }

    }

    /*
     * Store server-validated assignments.
     */

    match.roles.assignments[
        player.number
    ] =
        {
            ...assignments
        };

    match.roles.complete[
        player.number
    ] =
        true;

    socket.emit(
        "roles:state",
        {

            matchId:
                match.id,

            assignments:
                {
                    ...assignments
                },

            complete:
                true

        }
    );

    /*
     * Check whether both players are ready.
     */

    const bothReady =
        match.roles.complete[1] &&
        match.roles.complete[2];

    if (
        bothReady
    ) {

        match.players.forEach(
            item => {

                io.to(
                    item.socketId
                ).emit(
                    "match:battle",
                    {
                        matchId:
                            match.id
                    }
                );

            }
        );

    }

}

/* =========================================================
   SOCKET CONNECTION
   ========================================================= */

io.on(
    "connection",
    socket => {

        console.log(
            `[ADG] Connected: ${socket.id}`
        );

        /* =================================================
           CREATE
           ================================================= */

        socket.on(
            "match:create",
            data => {

                const playerName =
                    normalizeName(
                        data?.playerName
                    );

                if (
                    playerName.length < 2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Invalid player name."
                        }
                    );

                    return;

                }

                const match =
                    createMatch(
                        socket,
                        playerName,
                        data?.anime
                    );

                socket.emit(
                    "match:created",
                    getPublicMatchData(
                        match,
                        1
                    )
                );

                console.log(
                    `[ADG] Match created: ${match.id}`
                );

            }
        );

        /* =================================================
           FIND
           ================================================= */

        socket.on(
            "match:find",
            data => {

                const playerName =
                    normalizeName(
                        data?.playerName
                    );

                const anime =
                    normalizeAnime(
                        data?.anime
                    );

                if (
                    playerName.length < 2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Invalid player name."
                        }
                    );

                    return;

                }

                let found =
                    null;

                for (
                    const match of matches.values()
                ) {

                    if (
                        match.players.length ===
                        1 &&
                        match.anime ===
                        anime &&
                        !match.draft.started
                    ) {

                        found =
                            match;

                        break;

                    }

                }

                if (!found) {

                    const match =
                        createMatch(
                            socket,
                            playerName,
                            anime
                        );

                    socket.emit(
                        "match:waiting",
                        {

                            ...getPublicMatchData(
                                match,
                                1
                            ),

                            message:
                                "Match created. Waiting for another player..."

                        }
                    );

                    return;

                }

                const result =
                    joinExistingMatch(
                        found,
                        socket,
                        playerName
                    );

                if (
                    !result.success
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                result.message
                        }
                    );

                    return;

                }

                /*
                 * Notify both players.
                 */

                found.players.forEach(
                    player => {

                        io.to(
                            player.socketId
                        ).emit(
                            "match:found",
                            getPublicMatchData(
                                found,
                                player.number
                            )
                        );

                    }
                );

                startDraft(
                    found
                );

            }
        );

        /* =================================================
           JOIN
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

                const playerName =
                    normalizeName(
                        data?.playerName
                    );

                if (
                    playerName.length < 2
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                "Invalid player name."
                        }
                    );

                    return;

                }

                const match =
                    matches.get(
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

                const result =
                    joinExistingMatch(
                        match,
                        socket,
                        playerName
                    );

                if (
                    !result.success
                ) {

                    socket.emit(
                        "match:error",
                        {
                            message:
                                result.message
                        }
                    );

                    return;

                }

                socket.emit(
                    "match:joined",
                    getPublicMatchData(
                        match,
                        2
                    )
                );

                match.players.forEach(
                    player => {

                        io.to(
                            player.socketId
                        ).emit(
                            "match:found",
                            getPublicMatchData(
                                match,
                                player.number
                            )
                        );

                    }
                );

                startDraft(
                    match
                );

            }
        );

        /* =================================================
           CANCEL
           ================================================= */

        socket.on(
            "match:cancel",
            () => {

                const matchId =
                    socketMatches.get(
                        socket.id
                    );

                if (!matchId) {
                    return;
                }

                const match =
                    matches.get(
                        matchId
                    );

                if (!match) {
                    return;
                }

                /*
                 * Only remove a waiting one-player
                 * match.
                 */

                if (
                    match.players.length === 1 &&
                    match.players[0].socketId ===
                    socket.id &&
                    !match.draft.started
                ) {

                    matches.delete(
                        matchId
                    );

                }

                socketMatches.delete(
                    socket.id
                );

            }
        );

        /* =================================================
           RECONNECT
           ================================================= */

        socket.on(
            "match:reconnect",
            data => {

                reconnectPlayer(
                    socket,
                    data?.matchId
                );

            }
        );

        /* =================================================
           DRAFT DRAW
           ================================================= */

        socket.on(
            "draft:draw",
            data => {

                handleDraftDraw(
                    socket,
                    data
                );

            }
        );

        /* =================================================
           DRAFT DROP
           ================================================= */

        socket.on(
            "draft:drop",
            data => {

                handleDraftDrop(
                    socket,
                    data
                );

            }
        );

        /* =================================================
           ROLE ASSIGNMENT
           ================================================= */

        socket.on(
            "roles:assign",
            data => {

                handleRoleAssignment(
                    socket,
                    data
                );

            }
        );

        /*
         * Backwards-compatible event names.
         */

        socket.on(
            "role:assign",
            data => {

                handleRoleAssignment(
                    socket,
                    data
                );

            }
        );

        socket.on(
            "roles:complete",
            data => {

                handleRoleAssignment(
                    socket,
                    data
                );

            }
        );

        /* =================================================
           DISCONNECT
           ================================================= */

        socket.on(
            "disconnect",
            reason => {

                console.log(
                    `[ADG] Disconnected: ${socket.id} (${reason})`
                );

                /*
                 * Do NOT immediately delete the player.
                 *
                 * The player may reconnect.
                 */

                const matchId =
                    socketMatches.get(
                        socket.id
                    );

                if (!matchId) {
                    return;
                }

                const match =
                    matches.get(
                        matchId
                    );

                if (!match) {

                    socketMatches.delete(
                        socket.id
                    );

                    return;

                }

                const player =
                    findPlayer(
                        match,
                        socket.id
                    );

                if (player) {

                    console.log(
                        `[ADG] Player ${player.number} disconnected from ${match.id}`
                    );

                }

                socketMatches.delete(
                    socket.id
                );

            }
        );

    }
);

/* =========================================================
   SERVER ERROR HANDLING
   ========================================================= */

server.on(
    "error",
    error => {

        console.error(
            "[ADG] Server error:",
            error
        );

    }
);

/* =========================================================
   START SERVER
   ========================================================= */

server.listen(
    PORT,
    HOST,
    () => {

        console.log(
            "=============================================="
        );

        console.log(
            "⚔️ ADG SERVER"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Server running on ${HOST}:${PORT}`
        );

        console.log(
            `PORT: ${PORT}`
        );

        console.log(
            "Socket.IO: ENABLED"
        );

        console.log(
            "Health: /health"
        );

        console.log(
            "=============================================="
        );

    }
);

/* =========================================================
   END OF SERVER.JS
   ========================================================= */
```
