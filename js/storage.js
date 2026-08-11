/* =========================================================
   ADG — STORAGE.JS
   Centralized Local & Session Storage Manager
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_STORAGE_CONFIG = {

    prefix:
        "adg_",

    version:
        1

};


/* =========================================================
   INTERNAL HELPERS
   ========================================================= */

function storageKey(
    key
) {

    return (
        ADG_STORAGE_CONFIG.prefix +
        key
    );

}


function safeParse(
    value,
    fallback = null
) {

    if (
        value ===
        null ||
        value ===
        undefined
    ) {

        return fallback;

    }


    try {

        return JSON.parse(
            value
        );

    } catch (error) {

        return fallback;

    }

}


function safeStringify(
    value
) {

    try {

        return JSON.stringify(
            value
        );

    } catch (error) {

        console.warn(
            "ADG: Unable to serialize storage value.",
            error
        );

        return null;

    }

}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function localSet(
    key,
    value
) {

    try {

        const serialized =
            typeof value ===
            "string"
                ? value
                : safeStringify(
                    value
                );


        if (
            serialized ===
            null
        ) {

            return false;

        }


        localStorage.setItem(
            storageKey(
                key
            ),
            serialized
        );


        return true;

    } catch (error) {

        console.warn(
            "ADG: Local storage write failed.",
            error
        );

        return false;

    }

}


function localGet(
    key,
    fallback = null
) {

    try {

        const value =
            localStorage.getItem(
                storageKey(
                    key
                )
            );


        return (
            value ===
            null
        )
            ? fallback
            : value;

    } catch (error) {

        console.warn(
            "ADG: Local storage read failed.",
            error
        );

        return fallback;

    }

}


function localGetJSON(
    key,
    fallback = null
) {

    const value =
        localGet(
            key,
            null
        );


    if (
        value ===
        null
    ) {

        return fallback;

    }


    return safeParse(
        value,
        fallback
    );

}


function localRemove(
    key
) {

    try {

        localStorage.removeItem(
            storageKey(
                key
            )
        );


        return true;

    } catch (error) {

        return false;

    }

}


/* =========================================================
   SESSION STORAGE
   ========================================================= */

function sessionSet(
    key,
    value
) {

    try {

        const serialized =
            typeof value ===
            "string"
                ? value
                : safeStringify(
                    value
                );


        if (
            serialized ===
            null
        ) {

            return false;

        }


        sessionStorage.setItem(
            storageKey(
                key
            ),
            serialized
        );


        return true;

    } catch (error) {

        console.warn(
            "ADG: Session storage write failed.",
            error
        );

        return false;

    }

}


function sessionGet(
    key,
    fallback = null
) {

    try {

        const value =
            sessionStorage.getItem(
                storageKey(
                    key
                )
            );


        return (
            value ===
            null
        )
            ? fallback
            : value;

    } catch (error) {

        return fallback;

    }

}


function sessionGetJSON(
    key,
    fallback = null
) {

    const value =
        sessionGet(
            key,
            null
        );


    if (
        value ===
        null
    ) {

        return fallback;

    }


    return safeParse(
        value,
        fallback
    );

}


function sessionRemove(
    key
) {

    try {

        sessionStorage.removeItem(
            storageKey(
                key
            )
        );


        return true;

    } catch (error) {

        return false;

    }

}


/* =========================================================
   GENERIC JSON API
   ========================================================= */

function getJSON(
    key,
    fallback = null
) {

    return localGetJSON(
        key,
        fallback
    );

}


function setJSON(
    key,
    value
) {

    return localSet(
        key,
        value
    );

}


/* =========================================================
   PLAYER DATA
   ========================================================= */

const playerStorage = {

    getId() {

        return localGet(
            "playerId",
            null
        );

    },


    setId(
        id
    ) {

        return localSet(
            "playerId",
            id
        );

    },


    getName() {

        return (
            localGet(
                "playerName",
                null
            ) ||
            sessionGet(
                "playerName",
                null
            ) ||
            "Player"
        );

    },


    setName(
        name
    ) {

        const value =
            String(
                name ||
                "Player"
            )
            .trim()
            .slice(
                0,
                20
            );


        localSet(
            "playerName",
            value
        );


        sessionSet(
            "playerName",
            value
        );


        return true;

    },


    getAvatar() {

        return localGet(
            "avatar",
            "default"
        );

    },


    setAvatar(
        avatar
    ) {

        return localSet(
            "avatar",
            avatar
        );

    }

};


/* =========================================================
   MATCH DATA
   ========================================================= */

const matchStorage = {

    getCode() {

        return (
            sessionGet(
                "matchCode",
                null
            ) ||
            localGet(
                "matchCode",
                null
            )
        );

    },


    setCode(
        code
    ) {

        const value =
            String(
                code ||
                ""
            )
            .trim()
            .toUpperCase();


        sessionSet(
            "matchCode",
            value
        );


        return true;

    },


    getAnime() {

        return (
            sessionGet(
                "anime",
                null
            ) ||
            localGet(
                "anime",
                null
            )
        );

    },


    setAnime(
        anime
    ) {

        const value =
            String(
                anime ||
                ""
            )
            .trim();


        sessionSet(
            "anime",
            value
        );


        return true;

    },


    getRole() {

        return sessionGet(
            "playerRole",
            null
        );

    },


    setRole(
        role
    ) {

        return sessionSet(
            "playerRole",
            role
        );

    },


    getTeam() {

        return sessionGetJSON(
            "team",
            []
        );

    },


    setTeam(
        team
    ) {

        return sessionSet(
            "team",
            team
        );

    },


    getDraftState() {

        return sessionGetJSON(
            "draftState",
            null
        );

    },


    setDraftState(
        state
    ) {

        return sessionSet(
            "draftState",
            state
        );

    },


    clear() {

        sessionRemove(
            "matchCode"
        );

        sessionRemove(
            "anime"
        );

        sessionRemove(
            "playerRole"
        );

        sessionRemove(
            "team"
        );

        sessionRemove(
            "draftState"
        );

    }

};


/* =========================================================
   SETTINGS DATA
   ========================================================= */

const settingsStorage = {

    get() {

        return localGetJSON(
            "settings",
            {}
        );

    },


    set(
        settings
    ) {

        return localSet(
            "settings",
            settings
        );

    },


    getValue(
        key,
        fallback = null
    ) {

        const settings =
            this.get();


        return Object.prototype.hasOwnProperty.call(
            settings,
            key
        )
            ? settings[key]
            : fallback;

    },


    setValue(
        key,
        value
    ) {

        const settings =
            this.get();


        settings[key] =
            value;


        return this.set(
            settings
        );

    }

};


/* =========================================================
   GAME STATE
   ========================================================= */

const gameStorage = {

    getState() {

        return sessionGetJSON(
            "gameState",
            null
        );

    },


    setState(
        state
    ) {

        return sessionSet(
            "gameState",
            state
        );

    },


    clearState() {

        return sessionRemove(
            "gameState"
        );

    }

};


/* =========================================================
   MATCH HISTORY
   ========================================================= */

const historyStorage = {

    getAll() {

        return localGetJSON(
            "matchHistory",
            []
        );

    },


    add(
        match
    ) {

        const history =
            this.getAll();


        history.unshift(
            match
        );


        /*
         * Keep only the latest 100
         * matches locally.
         */

        if (
            history.length >
            100
        ) {

            history.length =
                100;

        }


        return localSet(
            "matchHistory",
            history
        );

    },


    clear() {

        return localRemove(
            "matchHistory"
        );

    }

};


/* =========================================================
   DRAFT DATA
   ========================================================= */

const draftStorage = {

    getCharacters() {

        return sessionGetJSON(
            "draftCharacters",
            []
        );

    },


    setCharacters(
        characters
    ) {

        return sessionSet(
            "draftCharacters",
            characters
        );

    },


    getTurn() {

        return sessionGet(
            "draftTurn",
            "P1"
        );

    },


    setTurn(
        turn
    ) {

        return sessionSet(
            "draftTurn",
            turn
        );

    },


    getUsedCharacters() {

        return sessionGetJSON(
            "usedCharacters",
            []
        );

    },


    setUsedCharacters(
        characters
    ) {

        return sessionSet(
            "usedCharacters",
            characters
        );

    },


    clear() {

        sessionRemove(
            "draftCharacters"
        );

        sessionRemove(
            "draftTurn"
        );

        sessionRemove(
            "usedCharacters"
        );

    }

};


/* =========================================================
   CLEAR SESSION
   ========================================================= */

function clearSession() {

    const keys = [

        "matchCode",

        "anime",

        "playerRole",

        "team",

        "draftState",

        "gameState",

        "draftCharacters",

        "draftTurn",

        "usedCharacters"

    ];


    keys.forEach(
        key => {

            sessionRemove(
                key
            );

        }
    );

}


/* =========================================================
   CLEAR ALL ADG DATA
   ========================================================= */

function clearAll() {

    try {

        const localKeys = [];


        for (
            let index = 0;
            index <
                localStorage.length;
            index++
        ) {

            const key =
                localStorage.key(
                    index
                );


            if (
                key &&
                key.startsWith(
                    ADG_STORAGE_CONFIG.prefix
                )
            ) {

                localKeys.push(
                    key
                );

            }

        }


        localKeys.forEach(
            key => {

                localStorage.removeItem(
                    key
                );

            }
        );


    } catch (error) {

        console.warn(
            "ADG: Unable to clear local storage.",
            error
        );

    }


    clearSession();

}


/* =========================================================
   EXPORT STATE
   ========================================================= */

function exportData() {

    return {

        version:
            ADG_STORAGE_CONFIG.version,

        player: {

            id:
                playerStorage.getId(),

            name:
                playerStorage.getName(),

            avatar:
                playerStorage.getAvatar()

        },

        settings:
            settingsStorage.get(),

        matchHistory:
            historyStorage.getAll()

    };

}


/* =========================================================
   IMPORT STATE
   ========================================================= */

function importData(
    data
) {

    if (
        !data ||
        typeof data !==
            "object"
    ) {

        return false;

    }


    if (
        data.player
    ) {

        if (
            data.player.id
        ) {

            playerStorage.setId(
                data.player.id
            );

        }


        if (
            data.player.name
        ) {

            playerStorage.setName(
                data.player.name
            );

        }


        if (
            data.player.avatar
        ) {

            playerStorage.setAvatar(
                data.player.avatar
            );

        }

    }


    if (
        data.settings &&
        typeof data.settings ===
            "object"
    ) {

        settingsStorage.set(
            data.settings
        );

    }


    if (
        Array.isArray(
            data.matchHistory
        )
    ) {

        localSet(
            "matchHistory",
            data.matchHistory
        );

    }


    return true;

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_STORAGE = {

    prefix:
        ADG_STORAGE_CONFIG.prefix,

    version:
        ADG_STORAGE_CONFIG.version,

    get:
        localGet,

    set:
        localSet,

    getJSON,

    setJSON,

    remove:
        localRemove,

    session: {

        get:
            sessionGet,

        set:
            sessionSet,

        getJSON:
            sessionGetJSON,

        setJSON(
            key,
            value
        ) {

            return sessionSet(
                key,
                value
            );

        },

        remove:
            sessionRemove

    },

    player:
        playerStorage,

    match:
        matchStorage,

    settings:
        settingsStorage,

    game:
        gameStorage,

    history:
        historyStorage,

    draft:
        draftStorage,

    clearSession,

    clearAll,

    exportData,

    importData

};


/* =========================================================
   END OF STORAGE.JS
   ========================================================= */
```
