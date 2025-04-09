// public/js/firebaseConfig.template.js

// 🔒 Copy this file as firebaseConfig.js and insert your own config locally

window.firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "G-XXXXXXX" // optional
  };
  
  firebase.initializeApp(window.firebaseConfig);
  