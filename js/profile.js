```javascript
/* =========================================================
   ADG — PROFILE.JS
   Player Profile Manager
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADG_PROFILE_CONFIG = {

    defaultName:
        "Player",

    maxNameLength:
        20,

    defaultAvatar:
        "default"

};


/* =========================================================
   STATE
   ========================================================= */

const adgProfileState = {

    playerName:
        ADG_PROFILE_CONFIG.defaultName,

    avatar:
        ADG_PROFILE_CONFIG.defaultAvatar,

    initialized:
        false

};


/* =========================================================
   NORMALIZE NAME
   ========================================================= */

function normalizePlayerName(
    name
) {

    const value =
        String(
            name ||
            ""
        )
        .trim()
        .replace(
            /\s+/g,
            " "
        );


    if (
        !value
    ) {

        return ADG_PROFILE_CONFIG.defaultName;

    }


    return value.slice(
        0,
        ADG_PROFILE_CONFIG.maxNameLength
    );

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

function loadProfile() {

    let name =
        ADG_PROFILE_CONFIG.defaultName;


    let avatar =
        ADG_PROFILE_CONFIG.defaultAvatar;


    if (
        window.ADG_STORAGE
    ) {

        name =
            window.ADG_STORAGE.player.getName() ||
            name;


        avatar =
            window.ADG_STORAGE.player.getAvatar() ||
            avatar;

    } else {

        try {

            name =
                localStorage.getItem(
                    "adg_playerName"
                ) ||
                name;


            avatar =
                localStorage.getItem(
                    "adg_avatar"
                ) ||
                avatar;

        } catch (error) {}

    }


    adgProfileState.playerName =
        normalizePlayerName(
            name
        );


    adgProfileState.avatar =
        avatar;


    adgProfileState.initialized =
        true;


    updateProfileUI();


    return getProfile();

}


/* =========================================================
   GET PROFILE
   ========================================================= */

function getProfile() {

    return {

        playerName:
            adgProfileState.playerName,

        avatar:
            adgProfileState.avatar

    };

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

function saveProfile() {

    if (
        window.ADG_STORAGE
    ) {

        window.ADG_STORAGE.player.setName(
            adgProfileState.playerName
        );


        window.ADG_STORAGE.player.setAvatar(
            adgProfileState.avatar
        );

    } else {

        try {

            localStorage.setItem(
                "adg_playerName",
                adgProfileState.playerName
            );


            localStorage.setItem(
                "adg_avatar",
                adgProfileState.avatar
            );

        } catch (error) {}

    }


    document.dispatchEvent(
        new CustomEvent(
            "adg:profile-updated",
            {
                detail:
                    getProfile()
            }
        )
    );


    return true;

}


/* =========================================================
   SET PLAYER NAME
   ========================================================= */

function setPlayerName(
    name
) {

    const normalized =
        normalizePlayerName(
            name
        );


    adgProfileState.playerName =
        normalized;


    saveProfile();

    updateProfileUI();


    return normalized;

}


/* =========================================================
   SET AVATAR
   ========================================================= */

function setAvatar(
    avatar
) {

    if (
        !avatar
    ) {

        return false;

    }


    adgProfileState.avatar =
        String(
            avatar
        );


    saveProfile();

    updateProfileUI();


    return true;

}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

    document
        .querySelectorAll(
            "[data-profile-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    adgProfileState.playerName;

            }
        );


    document
        .querySelectorAll(
            "[data-player-name]"
        )
        .forEach(
            element => {

                element.textContent =
                    adgProfileState.playerName;

            }
        );


    document
        .querySelectorAll(
            "[data-profile-avatar]"
        )
        .forEach(
            element => {

                if (
                    element.tagName ===
                    "IMG"
                ) {

                    element.src =
                        getAvatarPath(
                            adgProfileState.avatar
                        );

                    element.alt =
                        `${adgProfileState.playerName} avatar`;

                } else {

                    element.textContent =
                        getAvatarEmoji(
                            adgProfileState.avatar
                        );

                }

            }
        );


    const nameInput =
        document.querySelector(
            "[data-profile-name-input]"
        );


    if (
        nameInput &&
        document.activeElement !==
            nameInput
    ) {

        nameInput.value =
            adgProfileState.playerName;

    }


    const avatarInput =
        document.querySelector(
            "[data-profile-avatar-input]"
        );


    if (
        avatarInput
    ) {

        avatarInput.value =
            adgProfileState.avatar;

    }

}


/* =========================================================
   AVATAR PATH
   ========================================================= */

function getAvatarPath(
    avatar
) {

    if (
        !avatar ||
        avatar ===
            "default"
    ) {

        return "assets/images/avatar-default.png";

    }


    return `assets/images/avatars/${avatar}.png`;

}


/* =========================================================
   AVATAR EMOJI
   ========================================================= */

function getAvatarEmoji(
    avatar
) {

    const avatars = {

        default:
            "👤",

        pirate:
            "🏴‍☠️",

        warrior:
            "⚔️",

        ninja:
            "🥷",

        hero:
            "🦸",

        villain:
            "😈",

        fire:
            "🔥",

        skull:
            "💀"

    };


    return (
        avatars[
            avatar
        ] ||
        avatars.default
    );

}


/* =========================================================
   NAME FORM
   ========================================================= */

function initializeNameForm() {

    const form =
        document.querySelector(
            "[data-profile-form]"
        );


    if (
        !form
    ) {

        return;

    }


    const input =
        form.querySelector(
            "[data-profile-name-input]"
        );


    if (
        input
    ) {

        input.maxLength =
            ADG_PROFILE_CONFIG.maxNameLength;


        input.value =
            adgProfileState.playerName;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                input
                    ? input.value
                    : "";


            const savedName =
                setPlayerName(
                    name
                );


            if (
                window.ADG_NOTIFICATIONS
            ) {

                window.ADG_NOTIFICATIONS.success(
                    `Profile saved as ${savedName}.`
                );

            }

        }
    );

}


/* =========================================================
   AVATAR CONTROLS
   ========================================================= */

function initializeAvatarControls() {

    document
        .querySelectorAll(
            "[data-avatar]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const avatar =
                            button.dataset.avatar;


                        if (
                            setAvatar(
                                avatar
                            )
                        ) {

                            document
                                .querySelectorAll(
                                    "[data-avatar]"
                                )
                                .forEach(
                                    item => {

                                        item.classList.toggle(
                                            "selected",
                                            item ===
                                                button
                                        );

                                    }
                                );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeProfile() {

    loadProfile();

    initializeNameForm();

    initializeAvatarControls();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfile,
        {
            once: true
        }
    );

} else {

    initializeProfile();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_PROFILE = {

    state:
        adgProfileState,

    config:
        ADG_PROFILE_CONFIG,

    load:
        loadProfile,

    get:
        getProfile,

    save:
        saveProfile,

    setName:
        setPlayerName,

    setAvatar,

    updateUI:
        updateProfileUI,

    getAvatarPath,

    getAvatarEmoji

};


/* =========================================================
   END OF PROFILE.JS
   ========================================================= */
```
