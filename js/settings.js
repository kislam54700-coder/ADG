```javascript
/* =========================================================
   ADG — SETTINGS.JS
   Game Settings Manager
   ========================================================= */

"use strict";


/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const ADG_DEFAULT_SETTINGS = {

    soundEnabled: true,

    musicEnabled: true,

    animationsEnabled: true,

    notificationsEnabled: true

};


/* =========================================================
   STATE
   ========================================================= */

const adgSettingsState = {

    ...ADG_DEFAULT_SETTINGS,

    initialized: false

};


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {

    let saved = {};


    if (
        window.ADG_STORAGE
    ) {

        saved =
            window.ADG_STORAGE.settings.get();

    }


    Object.assign(
        adgSettingsState,
        ADG_DEFAULT_SETTINGS,
        saved || {}
    );


    adgSettingsState.initialized =
        true;


    return {
        ...adgSettingsState
    };

}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings() {

    if (
        window.ADG_STORAGE
    ) {

        window.ADG_STORAGE.settings.set(
            {
                soundEnabled:
                    adgSettingsState.soundEnabled,

                musicEnabled:
                    adgSettingsState.musicEnabled,

                animationsEnabled:
                    adgSettingsState.animationsEnabled,

                notificationsEnabled:
                    adgSettingsState.notificationsEnabled
            }
        );

    }


    document.dispatchEvent(
        new CustomEvent(
            "adg:settings-changed",
            {
                detail: {
                    ...adgSettingsState
                }
            }
        )
    );

}


/* =========================================================
   GET
   ========================================================= */

function getSetting(
    key
) {

    return adgSettingsState[
        key
    ];

}


/* =========================================================
   SET
   ========================================================= */

function setSetting(
    key,
    value
) {

    if (
        !Object.prototype.hasOwnProperty.call(
            ADG_DEFAULT_SETTINGS,
            key
        )
    ) {

        return false;

    }


    adgSettingsState[
        key
    ] =
        Boolean(
            value
        );


    saveSettings();

    applySettings();


    return true;

}


/* =========================================================
   SOUND
   ========================================================= */

function canPlaySound() {

    return (
        adgSettingsState.soundEnabled
    );

}


function setSoundEnabled(
    enabled
) {

    return setSetting(
        "soundEnabled",
        enabled
    );

}


/* =========================================================
   MUSIC
   ========================================================= */

function canPlayMusic() {

    return (
        adgSettingsState.musicEnabled
    );

}


function setMusicEnabled(
    enabled
) {

    return setSetting(
        "musicEnabled",
        enabled
    );

}


/* =========================================================
   ANIMATIONS
   ========================================================= */

function areAnimationsEnabled() {

    return (
        adgSettingsState.animationsEnabled
    );

}


function setAnimationsEnabled(
    enabled
) {

    return setSetting(
        "animationsEnabled",
        enabled
    );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function areNotificationsEnabled() {

    return (
        adgSettingsState.notificationsEnabled
    );

}


function setNotificationsEnabled(
    enabled
) {

    return setSetting(
        "notificationsEnabled",
        enabled
    );

}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function applySettings() {

    document.documentElement.classList.toggle(
        "adg-no-animations",
        !adgSettingsState.animationsEnabled
    );


    document.documentElement.dataset.sound =
        adgSettingsState.soundEnabled
            ? "on"
            : "off";


    document.documentElement.dataset.music =
        adgSettingsState.musicEnabled
            ? "on"
            : "off";


    document.documentElement.dataset.notifications =
        adgSettingsState.notificationsEnabled
            ? "on"
            : "off";


    if (
        window.ADG_AUDIO
    ) {

        window.ADG_AUDIO.setSoundEnabled(
            adgSettingsState.soundEnabled
        );


        window.ADG_AUDIO.setMusicEnabled(
            adgSettingsState.musicEnabled
        );

    }

}


/* =========================================================
   RESET
   ========================================================= */

function resetSettings() {

    Object.assign(
        adgSettingsState,
        ADG_DEFAULT_SETTINGS
    );


    saveSettings();

    applySettings();

    updateSettingsUI();

}


/* =========================================================
   SETTINGS UI
   ========================================================= */

function updateSettingsUI() {

    const controls = {

        soundEnabled:
            document.querySelector(
                "[data-setting='soundEnabled']"
            ),

        musicEnabled:
            document.querySelector(
                "[data-setting='musicEnabled']"
            ),

        animationsEnabled:
            document.querySelector(
                "[data-setting='animationsEnabled']"
            ),

        notificationsEnabled:
            document.querySelector(
                "[data-setting='notificationsEnabled']"
            )

    };


    Object.entries(
        controls
    )
    .forEach(
        (
            [
                key,
                element
            ]
        ) => {

            if (
                !element
            ) {

                return;

            }


            if (
                element.type ===
                "checkbox"
            ) {

                element.checked =
                    Boolean(
                        adgSettingsState[
                            key
                        ]
                    );

            }

        }
    );

}


/* =========================================================
   SETTINGS CONTROLS
   ========================================================= */

function initializeSettingsControls() {

    document
        .querySelectorAll(
            "[data-setting]"
        )
        .forEach(
            control => {

                const key =
                    control.dataset.setting;


                if (
                    !Object.prototype.hasOwnProperty.call(
                        ADG_DEFAULT_SETTINGS,
                        key
                    )
                ) {

                    return;

                }


                control.addEventListener(
                    "change",
                    () => {

                        setSetting(
                            key,
                            control.type ===
                                "checkbox"
                                ? control.checked
                                : control.value
                        );

                    }
                );

            }
        );


    const resetButton =
        document.querySelector(
            "[data-reset-settings]"
        );


    if (
        resetButton
    ) {

        resetButton.addEventListener(
            "click",
            () => {

                resetSettings();

            }
        );

    }

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeSettings() {

    loadSettings();

    applySettings();

    updateSettingsUI();

    initializeSettingsControls();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSettings,
        {
            once: true
        }
    );

} else {

    initializeSettings();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_SETTINGS = {

    state:
        adgSettingsState,

    defaults:
        ADG_DEFAULT_SETTINGS,

    load:
        loadSettings,

    get:
        getSetting,

    set:
        setSetting,

    save:
        saveSettings,

    apply:
        applySettings,

    reset:
        resetSettings,

    canPlaySound,

    canPlayMusic,

    areAnimationsEnabled,

    areNotificationsEnabled,

    setSoundEnabled,

    setMusicEnabled,

    setAnimationsEnabled,

    setNotificationsEnabled

};


/* =========================================================
   END OF SETTINGS.JS
   ========================================================= */
```
