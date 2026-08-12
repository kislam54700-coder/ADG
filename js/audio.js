/* =========================================================
   ADG — AUDIO.JS
   Sound & Music Controller
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_AUDIO_CONFIG = {

    volume: {

        master: 0.7,

        music: 0.35,

        effects: 0.65

    },

    sounds: {

        click: "assets/audio/click.mp3",

        draw: "assets/audio/draw.mp3",

        select: "assets/audio/select.mp3",

        swap: "assets/audio/swap.mp3",

        drop: "assets/audio/drop.mp3",

        battle: "assets/audio/battle.mp3",

        victory: "assets/audio/victory.mp3",

        defeat: "assets/audio/defeat.mp3",

        error: "assets/audio/error.mp3"

    },

    music: {

        lobby: "assets/audio/lobby.mp3",

        draft: "assets/audio/draft.mp3",

        battle: "assets/audio/battle-theme.mp3",

        victory: "assets/audio/victory-theme.mp3"

    }

};


/* =========================================================
   STATE
   ========================================================= */

const audioState = {

    initialized: false,

    soundEnabled: true,

    musicEnabled: true,

    currentMusic: null,

    currentMusicName: null,

    sounds: new Map(),

    music: new Map()

};


/* =========================================================
   SETTINGS
   ========================================================= */

function readAudioSettings() {

    if (
        window.ADG_SETTINGS
    ) {

        audioState.soundEnabled =
            window.ADG_SETTINGS.canPlaySound();

        audioState.musicEnabled =
            window.ADG_SETTINGS.canPlayMusic();

        return;

    }


    try {

        const stored =
            localStorage.getItem(
                "adg_settings"
            );


        if (
            stored
        ) {

            const settings =
                JSON.parse(
                    stored
                );


            audioState.soundEnabled =
                settings.soundEnabled !==
                false;


            audioState.musicEnabled =
                settings.musicEnabled !==
                false;

        }

    } catch (error) {

        console.warn(
            "Unable to read audio settings.",
            error
        );

    }

}


/* =========================================================
   AUDIO CREATION
   ========================================================= */

function createAudio(
    source,
    volume
) {

    const audio =
        new Audio(
            source
        );


    audio.preload =
        "auto";


    audio.volume =
        clamp(
            volume,
            0,
            1
        );


    return audio;

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeAudio() {

    if (
        audioState.initialized
    ) {

        return;

    }


    readAudioSettings();


    Object.entries(
        ADG_AUDIO_CONFIG.sounds
    )
    .forEach(
        (
            [
                name,
                source
            ]
        ) => {

            const audio =
                createAudio(
                    source,
                    ADG_AUDIO_CONFIG.volume.effects *
                    ADG_AUDIO_CONFIG.volume.master
                );


            audioState.sounds.set(
                name,
                audio
            );

        }
    );


    Object.entries(
        ADG_AUDIO_CONFIG.music
    )
    .forEach(
        (
            [
                name,
                source
            ]
        ) => {

            const audio =
                createAudio(
                    source,
                    ADG_AUDIO_CONFIG.volume.music *
                    ADG_AUDIO_CONFIG.volume.master
                );


            audio.loop =
                true;


            audioState.music.set(
                name,
                audio
            );

        }
    );


    audioState.initialized =
        true;

}


/* =========================================================
   PLAY SOUND
   ========================================================= */

function playSound(
    name
) {

    readAudioSettings();


    if (
        !audioState.soundEnabled
    ) {

        return;

    }


    if (
        !audioState.initialized
    ) {

        initializeAudio();

    }


    const audio =
        audioState.sounds.get(
            name
        );


    if (
        !audio
    ) {

        console.warn(
            `ADG sound "${name}" was not found.`
        );

        return;

    }


    try {

        audio.currentTime =
            0;


        audio.play()
            .catch(
                () => {
                    /*
                     * Browser autoplay restrictions
                     * are intentionally ignored here.
                     */
                }
            );

    } catch (error) {

        console.warn(
            "Unable to play ADG sound.",
            error
        );

    }

}


/* =========================================================
   STOP SOUND
   ========================================================= */

function stopSound(
    name
) {

    const audio =
        audioState.sounds.get(
            name
        );


    if (
        !audio
    ) {

        return;

    }


    audio.pause();

    audio.currentTime =
        0;

}


/* =========================================================
   PLAY MUSIC
   ========================================================= */

function playMusic(
    name
) {

    readAudioSettings();


    if (
        !audioState.musicEnabled
    ) {

        return;

    }


    if (
        !audioState.initialized
    ) {

        initializeAudio();

    }


    if (
        audioState.currentMusicName ===
        name
    ) {

        if (
            audioState.currentMusic?.paused
        ) {

            audioState.currentMusic
                .play()
                .catch(
                    () => {}
                );

        }


        return;

    }


    stopMusic();


    const audio =
        audioState.music.get(
            name
        );


    if (
        !audio
    ) {

        console.warn(
            `ADG music "${name}" was not found.`
        );

        return;

    }


    audio.currentTime =
        0;


    audioState.currentMusic =
        audio;


    audioState.currentMusicName =
        name;


    audio.play()
        .catch(
            () => {}
        );

}


/* =========================================================
   STOP MUSIC
   ========================================================= */

function stopMusic() {

    if (
        !audioState.currentMusic
    ) {

        return;

    }


    audioState.currentMusic.pause();


    audioState.currentMusic.currentTime =
        0;


    audioState.currentMusic =
        null;


    audioState.currentMusicName =
        null;

}


/* =========================================================
   PAUSE MUSIC
   ========================================================= */

function pauseMusic() {

    if (
        audioState.currentMusic
    ) {

        audioState.currentMusic.pause();

    }

}


/* =========================================================
   RESUME MUSIC
   ========================================================= */

function resumeMusic() {

    readAudioSettings();


    if (
        !audioState.musicEnabled
    ) {

        return;

    }


    if (
        audioState.currentMusic
    ) {

        audioState.currentMusic
            .play()
            .catch(
                () => {}
            );

    }

}


/* =========================================================
   MASTER VOLUME
   ========================================================= */

function setMasterVolume(
    volume
) {

    ADG_AUDIO_CONFIG.volume.master =
        clamp(
            volume,
            0,
            1
        );


    updateAllVolumes();

}


/* =========================================================
   MUSIC VOLUME
   ========================================================= */

function setMusicVolume(
    volume
) {

    ADG_AUDIO_CONFIG.volume.music =
        clamp(
            volume,
            0,
            1
        );


    updateMusicVolumes();

}


/* =========================================================
   EFFECT VOLUME
   ========================================================= */

function setEffectsVolume(
    volume
) {

    ADG_AUDIO_CONFIG.volume.effects =
        clamp(
            volume,
            0,
            1
        );


    updateEffectVolumes();

}


/* =========================================================
   UPDATE ALL VOLUMES
   ========================================================= */

function updateAllVolumes() {

    updateMusicVolumes();

    updateEffectVolumes();

}


/* =========================================================
   UPDATE MUSIC VOLUMES
   ========================================================= */

function updateMusicVolumes() {

    const volume =
        ADG_AUDIO_CONFIG.volume.master *
        ADG_AUDIO_CONFIG.volume.music;


    audioState.music.forEach(
        audio => {

            audio.volume =
                clamp(
                    volume,
                    0,
                    1
                );

        }
    );

}


/* =========================================================
   UPDATE EFFECT VOLUMES
   ========================================================= */

function updateEffectVolumes() {

    const volume =
        ADG_AUDIO_CONFIG.volume.master *
        ADG_AUDIO_CONFIG.volume.effects;


    audioState.sounds.forEach(
        audio => {

            audio.volume =
                clamp(
                    volume,
                    0,
                    1
                );

        }
    );

}


/* =========================================================
   CLAMP
   ========================================================= */

function clamp(
    value,
    minimum,
    maximum
) {

    return Math.min(
        maximum,
        Math.max(
            minimum,
            Number(
                value
            ) || 0
        )
    );

}


/* =========================================================
   ENABLE / DISABLE SOUND
   ========================================================= */

function setSoundEnabled(
    enabled
) {

    audioState.soundEnabled =
        Boolean(
            enabled
        );


    if (
        window.ADG_SETTINGS
    ) {

        window.ADG_SETTINGS.set(
            "soundEnabled",
            audioState.soundEnabled
        );

    }


    if (
        !audioState.soundEnabled
    ) {

        audioState.sounds.forEach(
            audio => {

                audio.pause();

                audio.currentTime =
                    0;

            }
        );

    }

}


/* =========================================================
   ENABLE / DISABLE MUSIC
   ========================================================= */

function setMusicEnabled(
    enabled
) {

    audioState.musicEnabled =
        Boolean(
            enabled
        );


    if (
        window.ADG_SETTINGS
    ) {

        window.ADG_SETTINGS.set(
            "musicEnabled",
            audioState.musicEnabled
        );

    }


    if (
        !audioState.musicEnabled
    ) {

        pauseMusic();

    } else {

        resumeMusic();

    }

}


/* =========================================================
   USER INTERACTION UNLOCK
   ========================================================= */

function unlockAudio() {

    if (
        !audioState.initialized
    ) {

        initializeAudio();

    }


    /*
     * Browsers commonly require an interaction before
     * audio playback is allowed.
     */

    const testAudio =
        audioState.sounds.get(
            "click"
        );


    if (
        !testAudio
    ) {

        return;

    }


    const originalVolume =
        testAudio.volume;


    testAudio.volume =
        0;


    testAudio.currentTime =
        0;


    testAudio.play()
        .then(
            () => {

                testAudio.pause();

                testAudio.currentTime =
                    0;

                testAudio.volume =
                    originalVolume;

            }
        )
        .catch(
            () => {

                testAudio.volume =
                    originalVolume;

            }
        );

}


/* =========================================================
   AUTOMATIC UI CLICK SOUND
   ========================================================= */

function initializeClickSounds() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button, .animeBtn, [role='button']"
                );


            if (
                !button
            ) {

                return;

            }


            if (
                button.disabled
            ) {

                return;

            }


            playSound(
                "click"
            );

        }
    );

}


/* =========================================================
   SETTINGS EVENT
   ========================================================= */

document.addEventListener(
    "adg:settings-changed",
    event => {

        const settings =
            event.detail ||
            {};


        audioState.soundEnabled =
            settings.soundEnabled !==
            false;


        audioState.musicEnabled =
            settings.musicEnabled !==
            false;


        if (
            !audioState.musicEnabled
        ) {

            pauseMusic();

        }

    }
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_AUDIO = {

    state:
        audioState,

    initialize:
        initializeAudio,

    playSound,

    stopSound,

    playMusic,

    stopMusic,

    pauseMusic,

    resumeMusic,

    unlock:
        unlockAudio,

    setMasterVolume,

    setMusicVolume,

    setEffectsVolume,

    setSoundEnabled,

    setMusicEnabled

};


/* =========================================================
   INITIALIZE
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeAudio();

            initializeClickSounds();

        },
        {
            once: true
        }
    );

} else {

    initializeAudio();

    initializeClickSounds();

}


/* =========================================================
   UNLOCK AFTER USER INTERACTION
   ========================================================= */

document.addEventListener(
    "pointerdown",
    unlockAudio,
    {
        once: true,
        passive: true
    }
);


/* =========================================================
   END OF AUDIO.JS
   ========================================================= */

