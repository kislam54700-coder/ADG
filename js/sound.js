/* =========================================================
   ADG — SOUND.JS
   Global Music & Sound System

   Features:
   - Master volume
   - Mute / unmute
   - Background music
   - Sound effects
   - Settings saved in localStorage
   - Works across all ADG pages
   - Safe if audio files are missing
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_SOUND_STORAGE_KEY = "adg_sound_settings";


const ADG_SOUND_DEFAULTS = {

    volume: 65,

    muted: false

};


/*
 * =========================================================
 * AUDIO FILE LOCATIONS
 * =========================================================
 *
 * Put your files inside:
 *
 * assets/audio/
 *
 * Example:
 *
 * assets/
 * └── audio/
 *     ├── lobby.mp3
 *     ├── draft.mp3
 *     ├── roles.mp3
 *     ├── battle.mp3
 *     ├── click.mp3
 *     ├── draw.mp3
 *     ├── drop.mp3
 *     ├── success.mp3
 *     └── error.mp3
 *
 */


const ADG_SOUND_FILES = {

    music: {

        lobby:
            "assets/audio/lobby.mp3",

        draft:
            "assets/audio/draft.mp3",

        roles:
            "assets/audio/roles.mp3",

        battle:
            "assets/audio/battle.mp3"

    },


    effects: {

        click:
            "assets/audio/click.mp3",

        draw:
            "assets/audio/draw.mp3",

        drop:
            "assets/audio/drop.mp3",

        success:
            "assets/audio/success.mp3",

        error:
            "assets/audio/error.mp3",

        role:
            "assets/audio/role.mp3",

        battle:
            "assets/audio/battle-start.mp3"

    }

};


/* =========================================================
   STATE
   ========================================================= */

const ADG_SOUND_STATE = {

    volume:
        ADG_SOUND_DEFAULTS.volume,

    muted:
        ADG_SOUND_DEFAULTS.muted,

    music:
        null,

    musicName:
        null,

    initialized:
        false

};


/* =========================================================
   STORAGE
   ========================================================= */

function loadSoundSettings() {

    try {

        const saved =
            localStorage.getItem(
                ADG_SOUND_STORAGE_KEY
            );


        if (
            !saved
        ) {

            return;

        }


        const settings =
            JSON.parse(
                saved
            );


        if (
            typeof settings.volume ===
            "number"
        ) {

            ADG_SOUND_STATE.volume =
                Math.max(
                    0,
                    Math.min(
                        100,
                        settings.volume
                    )
                );

        }


        if (
            typeof settings.muted ===
            "boolean"
        ) {

            ADG_SOUND_STATE.muted =
                settings.muted;

        }

    } catch (
        error
    ) {

        console.warn(
            "[ADG SOUND] Could not load sound settings:",
            error
        );

    }

}


function saveSoundSettings() {

    try {

        localStorage.setItem(
            ADG_SOUND_STORAGE_KEY,

            JSON.stringify(
                {

                    volume:
                        ADG_SOUND_STATE.volume,

                    muted:
                        ADG_SOUND_STATE.muted

                }
            )
        );

    } catch (
        error
    ) {

        console.warn(
            "[ADG SOUND] Could not save sound settings:",
            error
        );

    }

}


/* =========================================================
   GET ACTUAL VOLUME
   ========================================================= */

function getActualVolume() {

    if (
        ADG_SOUND_STATE.muted
    ) {

        return 0;

    }


    return (
        ADG_SOUND_STATE.volume /
        100
    );

}


/* =========================================================
   AUDIO UNLOCK
   ========================================================= */

/*
 * Browsers usually block autoplay with sound.
 *
 * After the player's first click/touch,
 * ADG can safely start music.
 */

let adgAudioUnlocked =
    false;


function unlockAudio() {

    if (
        adgAudioUnlocked
    ) {

        return;

    }


    adgAudioUnlocked =
        true;


    if (
        ADG_SOUND_STATE.music &&
        !ADG_SOUND_STATE.muted
    ) {

        playMusic();

    }

}


document.addEventListener(
    "click",
    unlockAudio,
    {
        once:
            true
    }
);


document.addEventListener(
    "touchstart",
    unlockAudio,
    {
        once:
            true
    }
);


document.addEventListener(
    "keydown",
    unlockAudio,
    {
        once:
            true
    }
);


/* =========================================================
   MUSIC
   ========================================================= */

function playMusic(
    name = null
) {

    if (
        name
    ) {

        startMusic(
            name
        );

        return;

    }


    const music =
        ADG_SOUND_STATE.music;


    if (
        !music
    ) {

        return;

    }


    music.volume =
        getActualVolume();


    music.muted =
        ADG_SOUND_STATE.muted;


    if (
        !adgAudioUnlocked
    ) {

        return;

    }


    const result =
        music.play();


    if (
        result &&
        typeof result.catch ===
        "function"
    ) {

        result.catch(
            () => {

                /*
                 * Autoplay may still be blocked.
                 * This is normal.
                 */

            }
        );

    }

}


function startMusic(
    name
) {

    const source =
        ADG_SOUND_FILES.music[
            name
        ];


    if (
        !source
    ) {

        console.warn(
            `[ADG SOUND] Unknown music: ${name}`
        );

        return;

    }


    /*
     * Stop previous music.
     */

    stopMusic();


    const music =
        new Audio(
            source
        );


    music.loop =
        true;


    music.preload =
        "auto";


    music.volume =
        getActualVolume();


    music.muted =
        ADG_SOUND_STATE.muted;


    ADG_SOUND_STATE.music =
        music;


    ADG_SOUND_STATE.musicName =
        name;


    playMusic();

}


function stopMusic() {

    const music =
        ADG_SOUND_STATE.music;


    if (
        !music
    ) {

        return;

    }


    music.pause();


    try {

        music.currentTime =
            0;

    } catch (
        error
    ) {

        /* Ignore */

    }


    ADG_SOUND_STATE.music =
        null;


    ADG_SOUND_STATE.musicName =
        null;

}


function pauseMusic() {

    if (
        ADG_SOUND_STATE.music
    ) {

        ADG_SOUND_STATE.music.pause();

    }

}


function resumeMusic() {

    playMusic();

}


/* =========================================================
   SOUND EFFECTS
   ========================================================= */

function playSound(
    name
) {

    const source =
        ADG_SOUND_FILES.effects[
            name
        ];


    if (
        !source
    ) {

        console.warn(
            `[ADG SOUND] Unknown sound: ${name}`
        );

        return;

    }


    if (
        ADG_SOUND_STATE.muted
    ) {

        return;

    }


    const sound =
        new Audio(
            source
        );


    sound.preload =
        "auto";


    sound.volume =
        getActualVolume();


    const result =
        sound.play();


    if (
        result &&
        typeof result.catch ===
        "function"
    ) {

        result.catch(
            () => {

                /*
                 * Missing file or autoplay block.
                 */

            }
        );

    }

}


/* =========================================================
   VOLUME
   ========================================================= */

function setVolume(
    value
) {

    const volume =
        Number(
            value
        );


    if (
        Number.isNaN(
            volume
        )
    ) {

        return;

    }


    ADG_SOUND_STATE.volume =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    volume
                )
            )
        );


    /*
     * Moving volume above 0 automatically unmutes.
     */

    if (
        ADG_SOUND_STATE.volume > 0 &&
        ADG_SOUND_STATE.muted
    ) {

        ADG_SOUND_STATE.muted =
            false;

    }


    updateMusicVolume();

    saveSoundSettings();

    updateSoundUI();

}


function updateMusicVolume() {

    if (
        !ADG_SOUND_STATE.music
    ) {

        return;

    }


    ADG_SOUND_STATE.music.volume =
        getActualVolume();


    ADG_SOUND_STATE.music.muted =
        ADG_SOUND_STATE.muted;

}


/* =========================================================
   MUTE
   ========================================================= */

function toggleMute() {

    ADG_SOUND_STATE.muted =
        !ADG_SOUND_STATE.muted;


    updateMusicVolume();

    saveSoundSettings();

    updateSoundUI();

}


function setMuted(
    value
) {

    ADG_SOUND_STATE.muted =
        Boolean(
            value
        );


    updateMusicVolume();

    saveSoundSettings();

    updateSoundUI();

}


/* =========================================================
   SOUND UI
   ========================================================= */

function updateSoundUI() {

    /*
     * Supports both versions of your HTML.
     */

    const volumeSliders =
        document.querySelectorAll(
            "[data-adg-volume], [data-master-volume]"
        );


    const volumeLabels =
        document.querySelectorAll(
            "[data-adg-volume-label], [data-volume-value]"
        );


    const muteButtons =
        document.querySelectorAll(
            "[data-adg-mute], [data-mute-button]"
        );


    const volumeIcons =
        document.querySelectorAll(
            "[data-volume-icon]"
        );


    volumeSliders.forEach(
        slider => {

            slider.value =
                ADG_SOUND_STATE.volume;

        }
    );


    volumeLabels.forEach(
        label => {

            label.textContent =
                `${ADG_SOUND_STATE.volume}%`;

        }
    );


    const icon =
        ADG_SOUND_STATE.muted ||
        ADG_SOUND_STATE.volume === 0
            ? "🔇"
            : "🔊";


    muteButtons.forEach(
        button => {

            button.setAttribute(
                "aria-pressed",
                String(
                    ADG_SOUND_STATE.muted
                )
            );


            button.textContent =
                ADG_SOUND_STATE.muted
                    ? "🔇 Unmute"
                    : "🔊 Mute";

        }
    );


    volumeIcons.forEach(
        element => {

            element.textContent =
                icon;

        }
    );

}


/* =========================================================
   CONNECT SOUND CONTROLS
   ========================================================= */

function setupSoundControls() {

    const volumeSliders =
        document.querySelectorAll(
            "[data-adg-volume], [data-master-volume]"
        );


    const muteButtons =
        document.querySelectorAll(
            "[data-adg-mute], [data-mute-button]"
        );


    volumeSliders.forEach(
        slider => {

            /*
             * Avoid adding duplicate listeners.
             */

            if (
                slider.dataset.adgSoundReady
            ) {

                return;

            }


            slider.dataset.adgSoundReady =
                "true";


            slider.addEventListener(
                "input",
                event => {

                    setVolume(
                        event.target.value
                    );

                }
            );

        }
    );


    muteButtons.forEach(
        button => {

            if (
                button.dataset.adgSoundReady
            ) {

                return;

            }


            button.dataset.adgSoundReady =
                "true";


            button.addEventListener(
                "click",
                () => {

                    toggleMute();

                }
            );

        }
    );


    updateSoundUI();

}


/* =========================================================
   AUTO PAGE MUSIC
   ========================================================= */

function detectPageMusic() {

    const body =
        document.body;


    if (
        !body
    ) {

        return null;

    }


    /*
     * Lobby / Home
     */

    if (
        body.classList.contains(
            "home-page"
        ) ||

        body.classList.contains(
            "lobby-page"
        ) ||

        body.classList.contains(
            "index-page"
        )
    ) {

        return "lobby";

    }


    /*
     * Draft
     */

    if (
        body.classList.contains(
            "draft-page"
        )
    ) {

        return "draft";

    }


    /*
     * Roles
     */

    if (
        body.classList.contains(
            "roles-page"
        )
    ) {

        return "roles";

    }


    /*
     * Battle
     */

    if (
        body.classList.contains(
            "battle-page"
        ) ||

        body.classList.contains(
            "game-page"
        )
    ) {

        return "battle";

    }


    return null;

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            pauseMusic();

        } else {

            resumeMusic();

        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeSound() {

    if (
        ADG_SOUND_STATE.initialized
    ) {

        return;

    }


    ADG_SOUND_STATE.initialized =
        true;


    loadSoundSettings();

    setupSoundControls();


    const pageMusic =
        detectPageMusic();


    if (
        pageMusic
    ) {

        startMusic(
            pageMusic
        );

    }


    console.log(
        "[ADG SOUND] Ready"
    );

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSound
    );

} else {

    initializeSound();

}


/* =========================================================
   GLOBAL ADG SOUND API
   ========================================================= */

window.ADG_SOUND = {

    /*
     * Music
     */

    startMusic,

    playMusic,

    stopMusic,

    pauseMusic,

    resumeMusic,


    /*
     * Sound effects
     */

    play:
        playSound,


    /*
     * Volume
     */

    setVolume,

    toggleMute,

    setMuted,


    /*
     * State
     */

    state:
        ADG_SOUND_STATE,


    /*
     * Refresh controls
     */

    refreshUI:
        updateSoundUI

};


/* =========================================================
   END OF SOUND.JS
   ========================================================= */