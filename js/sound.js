```javascript
/* =========================================================
   ADG — SOUND.JS
   Master Sound / Volume Controller
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const ADG_SOUND_CONFIG = {

    defaultVolume: 0.7,

    storageKey:
        "adg_master_volume",

    sounds: {

        button:
            "assets/sounds/button.mp3",

        draft:
            "assets/sounds/draft.mp3",

        role:
            "assets/sounds/role.mp3",

        attack:
            "assets/sounds/attack.mp3",

        hit:
            "assets/sounds/hit.mp3",

        special:
            "assets/sounds/special.mp3",

        defeat:
            "assets/sounds/defeat.mp3",

        victory:
            "assets/sounds/victory.mp3"

    }

};


/* =========================================================
   STATE
   ========================================================= */

const ADG_SOUND_STATE = {

    volume:
        ADG_SOUND_CONFIG.defaultVolume,

    muted:
        false,

    enabled:
        true,

    audio:
        {},

    currentSounds:
        new Set()

};


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSoundSettings() {

    try {

        const saved =
            localStorage.getItem(
                ADG_SOUND_CONFIG.storageKey
            );


        if (
            saved !== null
        ) {

            const volume =
                Number(
                    saved
                );


            if (
                Number.isFinite(
                    volume
                )
            ) {

                ADG_SOUND_STATE.volume =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            volume
                        )
                    );

            }

        }

    } catch (error) {

        console.warn(
            "Unable to load sound settings.",
            error
        );

    }

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSoundSettings() {

    try {

        localStorage.setItem(
            ADG_SOUND_CONFIG.storageKey,
            String(
                ADG_SOUND_STATE.volume
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save sound settings.",
            error
        );

    }

}


/* =========================================================
   CREATE AUDIO
   ========================================================= */

function createAudio(
    soundName
) {

    if (
        ADG_SOUND_STATE.audio[
            soundName
        ]
    ) {

        return ADG_SOUND_STATE.audio[
            soundName
        ];

    }


    const source =
        ADG_SOUND_CONFIG.sounds[
            soundName
        ];


    if (!source) {

        console.warn(
            `Unknown ADG sound: ${soundName}`
        );

        return null;

    }


    const audio =
        new Audio(
            source
        );


    audio.preload =
        "auto";


    audio.volume =
        ADG_SOUND_STATE.volume;


    ADG_SOUND_STATE.audio[
        soundName
    ] =
        audio;


    return audio;

}


/* =========================================================
   PLAY SOUND
   ========================================================= */

function playSound(
    soundName
) {

    if (
        !ADG_SOUND_STATE.enabled ||
        ADG_SOUND_STATE.muted
    ) {

        return;

    }


    const source =
        ADG_SOUND_CONFIG.sounds[
            soundName
        ];


    if (!source) {

        return;

    }


    /*
     * Create a new Audio instance for effects so the same
     * sound can be triggered repeatedly without interrupting
     * an already-playing copy.
     */

    const audio =
        new Audio(
            source
        );


    audio.volume =
        ADG_SOUND_STATE.volume;


    audio.currentTime =
        0;


    ADG_SOUND_STATE.currentSounds.add(
        audio
    );


    const cleanup =
        () => {

            ADG_SOUND_STATE.currentSounds.delete(
                audio
            );

        };


    audio.addEventListener(
        "ended",
        cleanup,
        {
            once: true
        }
    );


    audio.addEventListener(
        "error",
        cleanup,
        {
            once: true
        }
    );


    const promise =
        audio.play();


    if (
        promise &&
        typeof promise.catch ===
            "function"
    ) {

        promise.catch(
            () => {

                /*
                 * Browsers may block audio until the user
                 * interacts with the page. This is normal.
                 */

                cleanup();

            }
        );

    }

}


/* =========================================================
   SET MASTER VOLUME
   ========================================================= */

function setMasterVolume(
    value
) {

    let volume =
        Number(
            value
        );


    if (
        !Number.isFinite(
            volume
        )
    ) {

        volume =
            ADG_SOUND_CONFIG.defaultVolume;

    }


    /*
     * Accept either:
     *
     * 0 → 1
     *
     * or
     *
     * 0 → 100
     */

    if (
        volume > 1
    ) {

        volume /=
            100;

    }


    volume =
        Math.max(
            0,
            Math.min(
                1,
                volume
            )
        );


    ADG_SOUND_STATE.volume =
        volume;


    ADG_SOUND_STATE.muted =
        volume === 0;


    updateAudioVolumes();

    saveSoundSettings();

    updateVolumeUI();

}


/* =========================================================
   GET MASTER VOLUME
   ========================================================= */

function getMasterVolume() {

    return (
        ADG_SOUND_STATE.volume
    );

}


/* =========================================================
   MUTE
   ========================================================= */

function muteSounds() {

    ADG_SOUND_STATE.muted =
        true;


    updateAudioVolumes();

    updateVolumeUI();

}


/* =========================================================
   UNMUTE
   ========================================================= */

function unmuteSounds() {

    ADG_SOUND_STATE.muted =
        false;


    if (
        ADG_SOUND_STATE.volume ===
        0
    ) {

        ADG_SOUND_STATE.volume =
            ADG_SOUND_CONFIG.defaultVolume;

    }


    updateAudioVolumes();

    updateVolumeUI();

}


/* =========================================================
   TOGGLE MUTE
   ========================================================= */

function toggleMute() {

    if (
        ADG_SOUND_STATE.muted
    ) {

        unmuteSounds();

    } else {

        muteSounds();

    }

}


/* =========================================================
   UPDATE AUDIO VOLUMES
   ========================================================= */

function updateAudioVolumes() {

    const volume =
        ADG_SOUND_STATE.muted
            ? 0
            : ADG_SOUND_STATE.volume;


    Object.values(
        ADG_SOUND_STATE.audio
    )
    .forEach(
        audio => {

            audio.volume =
                volume;

        }
    );


    ADG_SOUND_STATE.currentSounds
        .forEach(
            audio => {

                audio.volume =
                    volume;

            }
        );

}


/* =========================================================
   VOLUME UI
   ========================================================= */

function updateVolumeUI() {

    const volumeSliders =
        document.querySelectorAll(
            "[data-adg-volume]"
        );


    volumeSliders.forEach(
        slider => {

            slider.value =
                Math.round(
                    ADG_SOUND_STATE.volume *
                    100
                );

        }
    );


    const volumeLabels =
        document.querySelectorAll(
            "[data-adg-volume-label]"
        );


    volumeLabels.forEach(
        label => {

            label.textContent =
                `${Math.round(
                    ADG_SOUND_STATE.volume *
                    100
                )}%`;

        }
    );


    const muteButtons =
        document.querySelectorAll(
            "[data-adg-mute]"
        );


    muteButtons.forEach(
        button => {

            button.textContent =
                ADG_SOUND_STATE.muted
                    ? "🔇 Unmute"
                    : "🔊 Mute";


            button.setAttribute(
                "aria-pressed",
                String(
                    ADG_SOUND_STATE.muted
                )
            );

        }
    );

}


/* =========================================================
   INITIALIZE VOLUME CONTROLS
   ========================================================= */

function initializeVolumeControls() {

    const sliders =
        document.querySelectorAll(
            "[data-adg-volume]"
        );


    sliders.forEach(
        slider => {

            slider.addEventListener(
                "input",
                event => {

                    setMasterVolume(
                        event.target.value
                    );

                }
            );

        }
    );


    const muteButtons =
        document.querySelectorAll(
            "[data-adg-mute]"
        );


    muteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                toggleMute
            );

        }
    );


    updateVolumeUI();

}


/* =========================================================
   SOUND UNLOCK
   ========================================================= */

let soundUnlocked =
    false;


function unlockSound() {

    if (
        soundUnlocked
    ) {

        return;

    }


    soundUnlocked =
        true;


    /*
     * Browser autoplay policies generally allow audio
     * after a user interaction. We only unlock the audio
     * system; we do not play an unwanted sound.
     */

}


/* =========================================================
   USER INTERACTION UNLOCK
   ========================================================= */

[
    "click",
    "pointerdown",
    "keydown",
    "touchstart"
]
.forEach(
    eventName => {

        document.addEventListener(
            eventName,
            unlockSound,
            {
                once: true,
                passive: true
            }
        );

    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

loadSoundSettings();

initializeVolumeControls();


/* =========================================================
   GLOBAL ADG SOUND API
   ========================================================= */

window.ADG_SOUND = {

    play:
        playSound,

    setVolume:
        setMasterVolume,

    getVolume:
        getMasterVolume,

    mute:
        muteSounds,

    unmute:
        unmuteSounds,

    toggleMute:
        toggleMute,

    state:
        ADG_SOUND_STATE

};


/* =========================================================
   BACKWARD-COMPATIBILITY ALIASES
   ========================================================= */

window.playADGSound =
    playSound;

window.setADGVolume =
    setMasterVolume;


/* =========================================================
   END OF SOUND.JS
   ========================================================= */
```
