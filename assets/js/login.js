(function () {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyAxmv1QtEMtFU9lHIjFULdlFbjJRn8-Xuo",
        authDomain: "streetfood-bga.firebaseapp.com",
        projectId: "streetfood-bga",
        storageBucket: "streetfood-bga.firebasestorage.app",
        messagingSenderId: "29645475094",
        appId: "1:29645475094:web:7e0618d42d61ee484c1437",
        measurementId: "G-54479KKM8V"
    };

    if (typeof firebase === 'undefined') return;

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');

    auth.onAuthStateChanged(function (user) {
        if (user) window.location.replace('admin.html');
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        errorBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value)
            .then(function () {
                window.location.replace('admin.html');
            })
            .catch(function () {
                errorBox.textContent = 'Correo o contraseña incorrectos.';
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar al panel';
            });
    });
})();
