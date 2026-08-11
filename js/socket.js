```javascript
/* =========================================================
   ADG — SHARED SOCKET CLIENT
   js/socket.js

   Shared multiplayer connection manager.

   Responsibilities:
   - Connect to ADG server
   - Keep player/match identity
   - Reconnect automatically
   - Provide common emit/on/off helpers
   - Keep authentication/session information
   - Prevent every page from creating its own socket logic

   IMPORTANT:
   The server is authoritative.

   This file does NOT:
   - calculate battle damage
   - decide winners
   - validate hidden combat stats
   - reveal opponent private data
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_SOCKET_CONFIG = {

    /*
     * Local:
     *
     * http://localhost:3000
     *
     * Production:
     * same origin as GitHub/server hosting
     */

    SERVER_URL:
        window.ADGSERVER_URL ||
        (
            window.location.protocol === "file:"
                ? "http://localhost:3000"
                : window.location.origin
        ),


    transports: [
        "websocket",
        "polling"
    ],


    reconnectAttempts:
        Infinity,


    reconnectDelay:
        1000,


    reconnectDelayMax:
        5000,


    timeout:
        10000

};


/* =========================================================
   SHARED STATE
   ========================================================= */

const ADGSocket = {

    socket: null,

    connected: false,

    connecting: false,

    initialized: false,

    matchId: null,

    playerId: null,

    playerNumber: null,

    playerName: null,

    sessionId: null,

    listeners: new Map(),

    connectionListeners: {

        connect: [],

        disconnect: [],

        reconnect: [],

        error: []

    }

};


/* =========================================================
   LOAD SESSION
   ========================================================= */

function adgLoadSocketSession() {

    /*
     * sessionStorage is used only for the player's
     * own session information.
     *
     * We NEVER store the opponent's private team
     * or role information here.
     */

    const matchId =
        sessionStorage.getItem(
            "adgMatchId"
        );


    const playerId =
        sessionStorage.getItem(
            "adgPlayerId"
        );


    const playerNumber =
        sessionStorage.getItem(
            "adgPlayerNumber"
        );


    const playerName =
        sessionStorage.getItem(
            "adgPlayerName"
        );


    const sessionId =
        sessionStorage.getItem(
            "adgSessionId"
        );


    ADGSocket.matchId =
        matchId || null;


    ADGSocket.playerId =
        playerId || null;


    ADGSocket.playerNumber =
        playerNumber
            ? Number(playerNumber)
            : null;


    ADGSocket.playerName =
        playerName || null;


    ADGSocket.sessionId =
        sessionId || null;

}


/* =========================================================
   SAVE SESSION
   ========================================================= */

function adgSaveSocketSession(
    data = {}
) {

    if (
        data.matchId !== undefined
    ) {

        ADGSocket.matchId =
            data.matchId;


        if (
            data.matchId
        ) {

            sessionStorage.setItem(
                "adgMatchId",
                String(
                    data.matchId
                )
            );

        }

    }


    if (
        data.playerId !== undefined
    ) {

        ADGSocket.playerId =
            data.playerId;


        if (
            data.playerId
        ) {

            sessionStorage.setItem(
                "adgPlayerId",
                String(
                    data.playerId
                )
            );

        }

    }


    if (
        data.playerNumber !== undefined
    ) {

        ADGSocket.playerNumber =
            Number(
                data.playerNumber
            );


        if (
            Number.isFinite(
                ADGSocket.playerNumber
            )
        ) {

            sessionStorage.setItem(
                "adgPlayerNumber",
                String(
                    ADGSocket.playerNumber
                )
            );

        }

    }


    if (
        data.playerName !== undefined
    ) {

        ADGSocket.playerName =
            data.playerName;


        if (
            data.playerName
        ) {

            sessionStorage.setItem(
                "adgPlayerName",
                String(
                    data.playerName
                )
            );

        }

    }


    if (
        data.sessionId !== undefined
    ) {

        ADGSocket.sessionId =
            data.sessionId;


        if (
            data.sessionId
        ) {

            sessionStorage.setItem(
                "adgSessionId",
                String(
                    data.sessionId
                )
            );

        }

    }

}


/* =========================================================
   CLEAR SESSION
   ========================================================= */

function adgClearSocketSession() {

    ADGSocket.matchId = null;

    ADGSocket.playerId = null;

    ADGSocket.playerNumber = null;

    ADGSocket.playerName = null;

    ADGSocket.sessionId = null;


    sessionStorage.removeItem(
        "adgMatchId"
    );


    sessionStorage.removeItem(
        "adgPlayerId"
    );


    sessionStorage.removeItem(
        "adgPlayerNumber"
    );


    sessionStorage.removeItem(
        "adgPlayerName"
    );


    sessionStorage.removeItem(
        "adgSessionId"
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function adgInitSocket(
    options = {}
) {

    adgLoadSocketSession();


    if (
        ADGSocket.socket
    ) {

        return ADGSocket.socket;

    }


    /*
     * Socket.IO client must be loaded before
     * this file.
     */

    if (
        typeof window.io !== "function"
    ) {

        console.error(
            "ADG: Socket.IO client is missing."
        );

        adgNotifyConnectionListeners(
            "error",
            {
                message:
                    "Socket.IO client is not loaded."
            }
        );

        return null;

    }


    ADGSocket.connecting =
        true;


    const serverUrl =
        options.serverUrl ||
        ADG_SOCKET_CONFIG.SERVER_URL;


    try {

        ADGSocket.socket =
            window.io(
                serverUrl,
                {

                    transports:
                        options.transports ||
                        ADG_SOCKET_CONFIG.transports,


                    reconnection:
                        true,


                    reconnectionAttempts:
                        ADG_SOCKET_CONFIG.reconnectAttempts,


                    reconnectionDelay:
                        ADG_SOCKET_CONFIG.reconnectDelay,


                    reconnectionDelayMax:
                        ADG_SOCKET_CONFIG.reconnectDelayMax,


                    timeout:
                        ADG_SOCKET_CONFIG.timeout,


                    withCredentials:
                        true

                }
            );


        registerCoreSocketEvents();


        ADGSocket.initialized =
            true;


    } catch (
        error
    ) {

        ADGSocket.connecting =
            false;


        console.error(
            "ADG socket initialization failed:",
            error
        );


        adgNotifyConnectionListeners(
            "error",
            error
        );

    }


    return ADGSocket.socket;

}


/* =========================================================
   CORE SOCKET EVENTS
   ========================================================= */

function registerCoreSocketEvents() {

    const socket =
        ADGSocket.socket;


    if (!socket) {
        return;
    }


    socket.on(
        "connect",
        handleSocketConnect
    );


    socket.on(
        "disconnect",
        handleSocketDisconnect
    );


    socket.io.on(
        "reconnect",
        handleSocketReconnect
    );


    socket.io.on(
        "reconnect_attempt",
        handleSocketReconnectAttempt
    );


    socket.io.on(
        "reconnect_error",
        handleSocketReconnectError
    );


    socket.io.on(
        "reconnect_failed",
        handleSocketReconnectFailed
    );


    socket.on(
        "connect_error",
        handleSocketError
    );


    /*
     * Server can send an updated session.
     */

    socket.on(
        "session:state",
        handleSessionState
    );


    /*
     * Generic server error.
     */

    socket.on(
        "server:error",
        handleServerError
    );

}


/* =========================================================
   CONNECT
   ========================================================= */

function handleSocketConnect() {

    ADGSocket.connected =
        true;


    ADGSocket.connecting =
        false;


    console.log(
        "ADG: Connected to server.",
        ADGSocket.socket
            ? ADGSocket.socket.id
            : ""
    );


    /*
     * Identify ourselves after connection.
     *
     * The server must validate this information.
     */

    sendSessionHandshake();


    adgNotifyConnectionListeners(
        "connect",
        {
            socketId:
                ADGSocket.socket
                    ? ADGSocket.socket.id
                    : null
        }
    );

}


/* =========================================================
   DISCONNECT
   ========================================================= */

function handleSocketDisconnect(
    reason
) {

    ADGSocket.connected =
        false;


    ADGSocket.connecting =
        false;


    console.warn(
        "ADG: Disconnected.",
        reason
    );


    adgNotifyConnectionListeners(
        "disconnect",
        {
            reason
        }
    );

}


/* =========================================================
   RECONNECT
   ========================================================= */

function handleSocketReconnect(
    attempt
) {

    ADGSocket.connected =
        true;


    ADGSocket.connecting =
        false;


    console.log(
        "ADG: Reconnected.",
        attempt
    );


    sendSessionHandshake();


    adgNotifyConnectionListeners(
        "reconnect",
        {
            attempt
        }
    );

}


/* =========================================================
   RECONNECT ATTEMPT
   ========================================================= */

function handleSocketReconnectAttempt(
    attempt
) {

    ADGSocket.connecting =
        true;


    adgNotifyConnectionListeners(
        "reconnect_attempt",
        {
            attempt
        }
    );

}


/* =========================================================
   RECONNECT ERROR
   ========================================================= */

function handleSocketReconnectError(
    error
) {

    console.warn(
        "ADG: Reconnect error.",
        error
    );


    adgNotifyConnectionListeners(
        "reconnect_error",
        error
    );

}


/* =========================================================
   RECONNECT FAILED
   ========================================================= */

function handleSocketReconnectFailed() {

    ADGSocket.connecting =
        false;


    console.error(
        "ADG: Reconnection failed."
    );


    adgNotifyConnectionListeners(
        "reconnect_failed"
    );

}


/* =========================================================
   CONNECTION ERROR
   ========================================================= */

function handleSocketError(
    error
) {

    ADGSocket.connecting =
        false;


    console.error(
        "ADG: Connection error.",
        error
    );


    adgNotifyConnectionListeners(
        "error",
        error
    );

}


/* =========================================================
   SESSION HANDSHAKE
   ========================================================= */

function sendSessionHandshake() {

    if (
        !ADGSocket.socket ||
        !ADGSocket.connected
    ) {

        return false;

    }


    const payload = {

        matchId:
            ADGSocket.matchId,

        playerId:
            ADGSocket.playerId,

        playerNumber:
            ADGSocket.playerNumber,

        playerName:
            ADGSocket.playerName,

        sessionId:
            ADGSocket.sessionId

    };


    ADGSocket.socket.emit(
        "session:join",
        payload
    );


    return true;

}


/* =========================================================
   SESSION STATE
   ========================================================= */

function handleSessionState(
    data
) {

    if (!data) {
        return;
    }


    /*
     * The server may update only the player's own
     * session information.
     */

    adgSaveSocketSession(
        {

            matchId:
                data.matchId,

            playerId:
                data.playerId,

            playerNumber:
                data.playerNumber,

            playerName:
                data.playerName,

            sessionId:
                data.sessionId

        }
    );


    /*
     * Forward the event to page-specific listeners.
     */

    adgEmitLocal(
        "session:state",
        data
    );

}


/* =========================================================
   SERVER ERROR
   ========================================================= */

function handleServerError(
    error
) {

    console.error(
        "ADG server error:",
        error
    );


    adgEmitLocal(
        "server:error",
        error
    );

}


/* =========================================================
   EMIT
   ========================================================= */

function adgSocketEmit(
    event,
    data,
    callback
) {

    if (
        !ADGSocket.socket
    ) {

        console.error(
            `ADG: Cannot emit "${event}". Socket not initialized.`
        );

        return false;

    }


    if (
        !ADGSocket.connected
    ) {

        console.warn(
            `ADG: Cannot emit "${event}". Socket disconnected.`
        );

        return false;

    }


    try {

        if (
            typeof callback === "function"
        ) {

            ADGSocket.socket.emit(
                event,
                data,
                callback
            );

        } else {

            ADGSocket.socket.emit(
                event,
                data
            );

        }


        return true;

    } catch (
        error
    ) {

        console.error(
            `ADG: Emit failed for "${event}".`,
            error
        );


        return false;

    }

}


/* =========================================================
   ON
   ========================================================= */

function adgSocketOn(
    event,
    handler
) {

    if (
        typeof handler !== "function"
    ) {

        return () => {};

    }


    if (
        !ADGSocket.listeners.has(
            event
        )
    ) {

        ADGSocket.listeners.set(
            event,
            new Set()
        );

    }


    const handlers =
        ADGSocket.listeners.get(
            event
        );


    handlers.add(
        handler
    );


    if (
        ADGSocket.socket
    ) {

        ADGSocket.socket.on(
            event,
            handler
        );

    }


    /*
     * Return unsubscribe function.
     */

    return () => {

        adgSocketOff(
            event,
            handler
        );

    };

}


/* =========================================================
   OFF
   ========================================================= */

function adgSocketOff(
    event,
    handler
) {

    const handlers =
        ADGSocket.listeners.get(
            event
        );


    if (
        handlers
    ) {

        handlers.delete(
            handler
        );

    }


    if (
        ADGSocket.socket
    ) {

        ADGSocket.socket.off(
            event,
            handler
        );

    }

}


/* =========================================================
   ONCE
   ========================================================= */

function adgSocketOnce(
    event,
    handler
) {

    if (
        !ADGSocket.socket ||
        typeof handler !== "function"
    ) {

        return () => {};

    }


    ADGSocket.socket.once(
        event,
        handler
    );


    return () => {

        ADGSocket.socket.off(
            event,
            handler
        );

    };

}


/* =========================================================
   LOCAL EVENT SYSTEM
   ========================================================= */

function adgOnConnection(
    event,
    handler
) {

    if (
        !ADGSocket.connectionListeners[event]
    ) {

        ADGSocket.connectionListeners[event] =
            [];

    }


    ADGSocket.connectionListeners[event]
        .push(
            handler
        );


    return () => {

        adgOffConnection(
            event,
            handler
        );

    };

}


function adgOffConnection(
    event,
    handler
) {

    const listeners =
        ADGSocket.connectionListeners[event];


    if (!listeners) {
        return;
    }


    const index =
        listeners.indexOf(
            handler
        );


    if (
        index !== -1
    ) {

        listeners.splice(
            index,
            1
        );

    }

}


function adgNotifyConnectionListeners(
    event,
    data
) {

    const listeners =
        ADGSocket.connectionListeners[event];


    if (!listeners) {
        return;
    }


    listeners.slice().forEach(
        handler => {

            try {

                handler(
                    data
                );

            } catch (
                error
            ) {

                console.error(
                    `ADG connection listener error (${event}):`,
                    error
                );

            }

        }
    );

}


/* =========================================================
   LOCAL PAGE EVENT
   ========================================================= */

function adgEmitLocal(
    event,
    data
) {

    const handlers =
        ADGSocket.listeners.get(
            event
        );


    if (!handlers) {
        return;
    }


    /*
     * This is useful for events received by
     * the shared socket before a page-specific
     * handler was registered.
     *
     * Page-specific socket listeners should
     * normally use adgSocketOn().
     */

    handlers.forEach(
        handler => {

            try {

                handler(
                    data
                );

            } catch (
                error
            ) {

                console.error(
                    `ADG event handler error (${event}):`,
                    error
                );

            }

        }
    );

}


/* =========================================================
   JOIN MATCH
   ========================================================= */

function adgJoinMatch(
    matchId,
    playerId = null
) {

    if (
        matchId
    ) {

        ADGSocket.matchId =
            String(
                matchId
            );

    }


    if (
        playerId
    ) {

        ADGSocket.playerId =
            String(
                playerId
            );

    }


    adgSaveSocketSession(
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );


    return adgSocketEmit(
        "match:join",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   LEAVE MATCH
   ========================================================= */

function adgLeaveMatch() {

    if (
        !ADGSocket.connected
    ) {

        return false;

    }


    return adgSocketEmit(
        "match:leave",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   DRAFT ACTION
   ========================================================= */

function adgDraftCharacter(
    characterId
) {

    return adgSocketEmit(
        "draft:pick",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId,

            characterId

        }
    );

}


/* =========================================================
   DROP TOKEN
   ========================================================= */

function adgUseDropToken() {

    return adgSocketEmit(
        "draft:drop",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   DRAW AFTER DROP
   ========================================================= */

function adgDrawReplacement(
    characterId
) {

    return adgSocketEmit(
        "draft:replacement",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId,

            characterId

        }
    );

}


/* =========================================================
   ROLE ASSIGNMENT
   ========================================================= */

function adgAssignRole(
    characterId,
    role
) {

    return adgSocketEmit(
        "roles:assign",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId,

            characterId,

            role

        }
    );

}


/* =========================================================
   READY FOR BATTLE
   ========================================================= */

function adgReadyForBattle() {

    return adgSocketEmit(
        "roles:ready",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   JOIN BATTLE
   ========================================================= */

function adgJoinBattle() {

    return adgSocketEmit(
        "battle:join",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   REQUEST REMATCH
   ========================================================= */

function adgRequestRematch() {

    return adgSocketEmit(
        "match:rematch",
        {

            matchId:
                ADGSocket.matchId,

            playerId:
                ADGSocket.playerId

        }
    );

}


/* =========================================================
   DISCONNECT
   ========================================================= */

function adgDisconnectSocket() {

    if (
        ADGSocket.socket
    ) {

        ADGSocket.socket.disconnect();

    }


    ADGSocket.socket =
        null;


    ADGSocket.connected =
        false;


    ADGSocket.connecting =
        false;


    ADGSocket.initialized =
        false;

}


/* =========================================================
   CONNECTION STATUS
   ========================================================= */

function adgIsSocketConnected() {

    return Boolean(
        ADGSocket.socket &&
        ADGSocket.connected
    );

}


/* =========================================================
   GET SOCKET
   ========================================================= */

function adgGetSocket() {

    return ADGSocket.socket;

}


/* =========================================================
   GET PLAYER SESSION
   ========================================================= */

function adgGetPlayerSession() {

    return {

        matchId:
            ADGSocket.matchId,

        playerId:
            ADGSocket.playerId,

        playerNumber:
            ADGSocket.playerNumber,

        playerName:
            ADGSocket.playerName,

        sessionId:
            ADGSocket.sessionId

    };

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        /*
         * We intentionally do NOT disconnect when
         * the browser tab becomes hidden.
         *
         * Mobile browsers can temporarily hide
         * a tab during navigation.
         */

        if (
            document.visibilityState === "visible" &&
            ADGSocket.socket &&
            !ADGSocket.connected
        ) {

            try {

                ADGSocket.socket.connect();

            } catch (
                error
            ) {

                console.warn(
                    "ADG reconnect attempt failed:",
                    error
                );

            }

        }

    }
);


/* =========================================================
   AUTOMATIC INITIALIZATION
   ========================================================= */

adgLoadSocketSession();


/*
 * Initialize after the page has loaded enough
 * for Socket.IO to be available.
 */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            adgInitSocket();

        }
    );

} else {

    adgInitSocket();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADGSocket =
    {

        init:
            adgInitSocket,

        emit:
            adgSocketEmit,

        on:
            adgSocketOn,

        off:
            adgSocketOff,

        once:
            adgSocketOnce,

        onConnection:
            adgOnConnection,

        offConnection:
            adgOffConnection,

        getSocket:
            adgGetSocket,

        isConnected:
            adgIsSocketConnected,

        getSession:
            adgGetPlayerSession,

        saveSession:
            adgSaveSocketSession,

        clearSession:
            adgClearSocketSession,

        joinMatch:
            adgJoinMatch,

        leaveMatch:
            adgLeaveMatch,

        draft:
            adgDraftCharacter,

        drop:
            adgUseDropToken,

        replacement:
            adgDrawReplacement,

        assignRole:
            adgAssignRole,

        readyForBattle:
            adgReadyForBattle,

        joinBattle:
            adgJoinBattle,

        rematch:
            adgRequestRematch,

        disconnect:
            adgDisconnectSocket

    };
```
