// ✅ Global Firebase config (no "export"!)
window.firebaseConfig = {
    apiKey: "AIzaSyAGmhdeSxshYSmaAbsMtda4qa1K3TeKiYw", 
    authDomain: "trackrepost-921f8.firebaseapp.com", 
    projectId: "trackrepost-921f8", 
    storageBucket: "trackrepost-921f8.appspot.com", 
    messagingSenderId: "967836604288", 
    appId: "1:967836604288:web:3782d50de7384c9201d365", 
    measurementId: "G-G65Q3HC3R8" 
};

// ✅ Initialize Firebase (compat)
firebase.initializeApp(window.firebaseConfig);

// ✅ Global Square values
window.SQUARE_APP_ID = "EAAAlxK6rZ76mVInsBpTXk5shQJ6tMln1rBfCAOaTUFmRjPGITmu7f9vEQOzuvPD";
window.SQUARE_LOCATION_ID = "sq0idp-PgaanSd67uGXtHuBFn7cZA";

console.log("✅ Firebase config loaded");
console.log("✅ Square App ID:", window.SQUARE_APP_ID);
console.log("✅ Square Location ID:", window.SQUARE_LOCATION_ID);