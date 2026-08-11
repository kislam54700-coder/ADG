```javascript
/* =========================================================
   ADG — FIREBASE.JS
   Firebase Initialization
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE CONFIGURATION
   =========================================================
   IMPORTANT:
   Replace the placeholder values below with the Firebase
   configuration from your Firebase Console.
   ========================================================= */

const ADG_FIREBASE_CONFIG = {

    apiKey:
        "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT_ID.firebaseapp.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT_ID.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"

};


/* =========================================================
   STATE
   ========================================================= */

const adgFirebaseState = {

    initialized:
        false,

    app:
        null,

    auth:
        null,

    db:
        null,

    error:
        null

};


/* =========================================================
   CHECK FIREBASE
   ========================================================= */

function isFirebaseLoaded() {

    return (
        typeof firebase !==
        "undefined"
    );

}


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

function initializeFirebase() {

    if (
        adgFirebaseState.initialized
    ) {

        return adgFirebaseState.app;

    }


    if (
        !isFirebaseLoaded()
    ) {

        adgFirebaseState.error =
            new Error(
                "Firebase SDK is not loaded."
            );


        console.error(
            "ADG Firebase: Firebase SDK is not loaded."
        );


        return null;

    }


    try {

        if (
            firebase.apps.length >
            0
        ) {

            adgFirebaseState.app =
                firebase.app();

        } else {

            adgFirebaseState.app =
                firebase.initializeApp(
                    ADG_FIREBASE_CONFIG
                );

        }


        /*
         * Firebase Authentication
         */

        if (
            typeof firebase.auth ===
            "function"
        ) {

            adgFirebaseState.auth =
                firebase.auth();

        }


        /*
         * Firestore
         */

        if (
            typeof firebase.firestore ===
            "function"
        ) {

            adgFirebaseState.db =
                firebase.firestore();

        }


        adgFirebaseState.initialized =
            true;


        adgFirebaseState.error =
            null;


        document.dispatchEvent(
            new CustomEvent(
                "adg:firebase-ready",
                {
                    detail: {

                        app:
                            adgFirebaseState.app,

                        auth:
                            adgFirebaseState.auth,

                        db:
                            adgFirebaseState.db

                    }
                }
            )
        );


        return adgFirebaseState.app;


    } catch (error) {

        adgFirebaseState.error =
            error;


        console.error(
            "ADG Firebase initialization failed:",
            error
        );


        return null;

    }

}


/* =========================================================
   GET APP
   ========================================================= */

function getFirebaseApp() {

    return (
        adgFirebaseState.app ||
        null
    );

}


/* =========================================================
   GET AUTH
   ========================================================= */

function getFirebaseAuth() {

    if (
        adgFirebaseState.auth
    ) {

        return adgFirebaseState.auth;

    }


    if (
        isFirebaseLoaded() &&
        typeof firebase.auth ===
        "function"
    ) {

        try {

            adgFirebaseState.auth =
                firebase.auth();


            return adgFirebaseState.auth;

        } catch (error) {

            return null;

        }

    }


    return null;

}


/* =========================================================
   GET FIRESTORE
   ========================================================= */

function getFirestore() {

    if (
        adgFirebaseState.db
    ) {

        return adgFirebaseState.db;

    }


    if (
        isFirebaseLoaded() &&
        typeof firebase.firestore ===
        "function"
    ) {

        try {

            adgFirebaseState.db =
                firebase.firestore();


            return adgFirebaseState.db;

        } catch (error) {

            return null;

        }

    }


    return null;

}


/* =========================================================
   FIREBASE STATUS
   ========================================================= */

function isFirebaseReady() {

    return Boolean(
        adgFirebaseState.initialized &&
        adgFirebaseState.app
    );

}


/* =========================================================
   WAIT FOR FIREBASE
   ========================================================= */

function waitForFirebase(
    timeout = 10000
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                isFirebaseReady()
            ) {

                resolve(
                    adgFirebaseState.app
                );

                return;

            }


            const started =
                Date.now();


            const check =
                setInterval(
                    () => {

                        if (
                            isFirebaseReady()
                        ) {

                            clearInterval(
                                check
                            );


                            resolve(
                                adgFirebaseState.app
                            );


                            return;

                        }


                        if (
                            Date.now() -
                            started >=
                            timeout
                        ) {

                            clearInterval(
                                check
                            );


                            reject(
                                new Error(
                                    "Firebase initialization timed out."
                                )
                            );

                        }

                    },
                    100
                );

        }
    );

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.ADG_FIREBASE = {

    config:
        ADG_FIREBASE_CONFIG,

    state:
        adgFirebaseState,

    initialize:
        initializeFirebase,

    getApp:
        getFirebaseApp,

    getAuth:
        getFirebaseAuth,

    getFirestore,

    isReady:
        isFirebaseReady,

    wait:
        waitForFirebase

};


/* =========================================================
   INITIALIZE
   ========================================================= */

function startFirebase() {

    /*
     * Firebase scripts may load before or after this file.
     * A short delayed attempt makes the initialization more
     * tolerant of script ordering.
     */

    initializeFirebase();


    if (
        !isFirebaseReady()
    ) {

        let attempts =
            0;


        const retry =
            setInterval(
                () => {

                    attempts++;


                    initializeFirebase();


                    if (
                        isFirebaseReady() ||
                        attempts >=
                            50
                    ) {

                        clearInterval(
                            retry
                        );

                    }

                },
                100
            );

    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startFirebase,
        {
            once: true
        }
    );

} else {

    startFirebase();

}


/* =========================================================
   END OF FIREBASE.JS
   ========================================================= */
```
