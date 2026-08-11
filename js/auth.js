```javascript
/* =========================================================
   ADG — AUTH.JS
   Firebase Authentication Controller
   ========================================================= */

"use strict";


/* =========================================================
   STATE
   ========================================================= */

const adgAuthState = {

    initialized: false,

    user: null,

    loading: false,

    error: null

};


/* =========================================================
   FIREBASE CHECK
   ========================================================= */

function isFirebaseAvailable() {

    return (
        typeof firebase !==
        "undefined" &&
        typeof firebase.auth ===
        "function"
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeAuth() {

    if (
        adgAuthState.initialized
    ) {

        return;

    }


    if (
        !isFirebaseAvailable()
    ) {

        console.warn(
            "ADG Auth: Firebase Authentication is not loaded."
        );

        return;

    }


    try {

        const auth =
            firebase.auth();


        auth.onAuthStateChanged(
            user => {

                adgAuthState.user =
                    user || null;


                adgAuthState.loading =
                    false;


                adgAuthState.error =
                    null;


                updateAuthUI();


                document.dispatchEvent(
                    new CustomEvent(
                        "adg:auth-changed",
                        {
                            detail: {

                                user:
                                    adgAuthState.user

                            }
                        }
                    )
                );

            }
        );


        adgAuthState.initialized =
            true;


    } catch (error) {

        adgAuthState.error =
            error;


        console.error(
            "ADG Auth initialization failed:",
            error
        );

    }

}


/* =========================================================
   GET AUTH
   ========================================================= */

function getAuth() {

    if (
        !isFirebaseAvailable()
    ) {

        return null;

    }


    try {

        return firebase.auth();

    } catch (error) {

        return null;

    }

}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

function getCurrentUser() {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return null;

    }


    return auth.currentUser ||
        null;

}


/* =========================================================
   IS SIGNED IN
   ========================================================= */

function isSignedIn() {

    return Boolean(
        getCurrentUser()
    );

}


/* =========================================================
   SIGN IN WITH EMAIL
   ========================================================= */

async function signInWithEmail(
    email,
    password
) {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return {

            success:
                false,

            error:
                "Firebase Authentication is unavailable."

        };

    }


    adgAuthState.loading =
        true;


    adgAuthState.error =
        null;


    try {

        const result =
            await auth.signInWithEmailAndPassword(
                String(
                    email
                )
                .trim(),
                String(
                    password
                )
            );


        adgAuthState.user =
            result.user;


        return {

            success:
                true,

            user:
                result.user

        };


    } catch (error) {

        adgAuthState.error =
            error;


        return {

            success:
                false,

            error:
                getAuthErrorMessage(
                    error
                ),

            code:
                error?.code ||
                null

        };


    } finally {

        adgAuthState.loading =
            false;

    }

}


/* =========================================================
   CREATE ACCOUNT
   ========================================================= */

async function createAccount(
    email,
    password
) {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return {

            success:
                false,

            error:
                "Firebase Authentication is unavailable."

        };

    }


    adgAuthState.loading =
        true;


    adgAuthState.error =
        null;


    try {

        const result =
            await auth.createUserWithEmailAndPassword(
                String(
                    email
                )
                .trim(),
                String(
                    password
                )
            );


        adgAuthState.user =
            result.user;


        return {

            success:
                true,

            user:
                result.user

        };


    } catch (error) {

        adgAuthState.error =
            error;


        return {

            success:
                false,

            error:
                getAuthErrorMessage(
                    error
                ),

            code:
                error?.code ||
                null

        };


    } finally {

        adgAuthState.loading =
            false;

    }

}


/* =========================================================
   GOOGLE SIGN IN
   ========================================================= */

async function signInWithGoogle() {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return {

            success:
                false,

            error:
                "Firebase Authentication is unavailable."

        };

    }


    adgAuthState.loading =
        true;


    adgAuthState.error =
        null;


    try {

        const provider =
            new firebase.auth.GoogleAuthProvider();


        const result =
            await auth.signInWithPopup(
                provider
            );


        adgAuthState.user =
            result.user;


        return {

            success:
                true,

            user:
                result.user

        };


    } catch (error) {

        adgAuthState.error =
            error;


        return {

            success:
                false,

            error:
                getAuthErrorMessage(
                    error
                ),

            code:
                error?.code ||
                null

        };


    } finally {

        adgAuthState.loading =
            false;

    }

}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut() {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return false;

    }


    try {

        await auth.signOut();


        adgAuthState.user =
            null;


        return true;


    } catch (error) {

        adgAuthState.error =
            error;


        console.error(
            "ADG Auth sign-out failed:",
            error
        );


        return false;

    }

}


/* =========================================================
   PASSWORD RESET
   ========================================================= */

async function resetPassword(
    email
) {

    const auth =
        getAuth();


    if (
        !auth
    ) {

        return {

            success:
                false,

            error:
                "Firebase Authentication is unavailable."

        };

    }


    try {

        await auth.sendPasswordResetEmail(
            String(
                email
            )
            .trim()
        );


        return {

            success:
                true

        };


    } catch (error) {

        adgAuthState.error =
            error;


        return {

            success:
                false,

            error:
                getAuthErrorMessage(
                    error
                ),

            code:
                error?.code ||
                null

        };

    }

}


/* =========================================================
   UPDATE DISPLAY NAME
   ========================================================= */

async function updateDisplayName(
    name
) {

    const user =
        getCurrentUser();


    if (
        !user
    ) {

        return false;

    }


    const value =
        String(
            name ||
            ""
        )
        .trim()
        .slice(
            0,
            20
        );


    if (
        !value
    ) {

        return false;

    }


    try {

        await user.updateProfile(
            {

                displayName:
                    value

            }
        );


        if (
            window.ADG_PROFILE
        ) {

            window.ADG_PROFILE.setName(
                value
            );

        }


        return true;


    } catch (error) {

        adgAuthState.error =
            error;


        return false;

    }

}


/* =========================================================
   AUTH ERROR MESSAGE
   ========================================================= */

function getAuthErrorMessage(
    error
) {

    const code =
        error?.code ||
        "";


    const messages = {

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/user-disabled":
            "This account has been disabled.",

        "auth/user-not-found":
            "No account was found with this email.",

        "auth/wrong-password":
            "Incorrect password.",

        "auth/invalid-credential":
            "The email or password is incorrect.",

        "auth/email-already-in-use":
            "An account already exists with this email.",

        "auth/weak-password":
            "Password must be at least 6 characters.",

        "auth/operation-not-allowed":
            "This sign-in method is not enabled.",

        "auth/popup-closed-by-user":
            "The sign-in window was closed.",

        "auth/popup-blocked":
            "Your browser blocked the sign-in window.",

        "auth/network-request-failed":
            "Network error. Please check your connection.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later."

    };


    return (
        messages[
            code
        ] ||
        error?.message ||
        "Authentication failed. Please try again."
    );

}


/* =========================================================
   AUTH UI
   ========================================================= */

function updateAuthUI() {

    const user =
        adgAuthState.user;


    document
        .querySelectorAll(
            "[data-auth-user]"
        )
        .forEach(
            element => {

                element.textContent =
                    user
                        ? (
                            user.displayName ||
                            user.email ||
                            "Player"
                        )
                        : "Guest";

            }
        );


    document
        .querySelectorAll(
            "[data-auth-email]"
        )
        .forEach(
            element => {

                element.textContent =
                    user?.email ||
                    "";

            }
        );


    document
        .querySelectorAll(
            "[data-auth-signed-in]"
        )
        .forEach(
            element => {

                element.hidden =
                    !user;

            }
        );


    document
        .querySelectorAll(
            "[data-auth-signed-out]"
        )
        .forEach(
            element => {

                element.hidden =
                    Boolean(
                        user
                    );

            }
        );

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_AUTH = {

    state:
        adgAuthState,

    initialize:
        initializeAuth,

    getAuth,

    getCurrentUser,

    isSignedIn,

    signInWithEmail,

    createAccount,

    signInWithGoogle,

    signOut,

    resetPassword,

    updateDisplayName,

    getAuthErrorMessage

};


/* =========================================================
   INITIALIZE AFTER FIREBASE LOAD
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeAuth();

        },
        {
            once: true
        }
    );

} else {

    initializeAuth();

}


/* =========================================================
   END OF AUTH.JS
   ========================================================= */
```
