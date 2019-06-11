'use strict';

const signInForm = document.querySelector('form.sign-in');
const signInPage = document.querySelector('#sign-in-page');
const signedInPage = document.querySelector('#signed-in-page');

function submitSignIn(e) {
    e.preventDefault();

    const email = document.querySelector('form.sign-in #email').value;
    const password = document.querySelector('form.sign-in #password').value;
    fetchToken(email, password).then(response => {
        console.log(response);
        const username = response.username;
        const token = response.token;

        browser.storage.sync.set({
            username: response.username,
            token: response.token,
        }).then(() => {
            browser.extension.getOptionsPage().window.location.reload();
        });
    }).catch(error => {
        console.error(error);
    });
}

function init() {
    signInForm.addEventListener('submit', submitSignIn);

    getUser().then((user) => {
        showNothing();

        if (user.username) {
            document.querySelector('#signed-in-page .username').textContent = user.username;
            showPage(signedInPage);
            console.info(user);
        } else {
            showPage(signInPage);
        }
    });
}

init();
