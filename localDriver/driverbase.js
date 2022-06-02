
 
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAZwp_UMu1CPtnHPaCJ79MsIxAeuDbXQyA",
    authDomain: "driver-65656.firebaseapp.com",
    projectId: "driver-65656",
    storageBucket: "driver-65656.appspot.com",
    messagingSenderId: "386249458737",
    appId: "1:386249458737:web:d85640fef97665970cc110"
  };

  // Initialize Firebase
 //  const app = initializeApp(firebaseConfig);
    firebase.initializeApp(firebaseConfig);    

  // Initialize Cloud Firestore and get a reference to the service
    const db = firebase.firestore();

    const clients = db.collection('clients');
