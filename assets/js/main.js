'use strict';

function assert(condition, msg=undefined) {
    if (!condition)
        throw msg ? msg : "Assertion error";
}

function showElement(element) {
    element.hidden = false;
}

function hideElement(element) {
    element.hidden = true;
}

function showPage(pageEl) {
    Array.from(document.querySelectorAll(".page"))
        .filter(value => value !== pageEl)
        .forEach(hideElement);

    showElement(pageEl);
}

function setButtonWaitState(element, state) {
    element.disabled = state;
    element.querySelector(".spinner").hidden = !state;
    element.querySelector(".label").hidden = state;
}

function callApi(method, url, data=undefined, token=undefined) {
    init = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data !== undefined) {
        init.body = JSON.stringify(data)
    }

    if (token) {
        init.headers['Authorization'] = `Token ${token}`;
    }

    return fetch(url, init)
        .then(response => {
            if (!(response.status >= 200 && response.status < 300)) {
                throw response;
            }

            return response.json();
        }
    )
}

function fetchToken(email, password) {
    console.info(`Getting token for ${email}...`);
    return callApi(
        "POST",
        "https://api.screenlyapp.com/api/v3/tokens/",
        {
            username: email,
            password: password,
        });
}

function getUser() {
    return browser.storage.sync.get(['username', 'token']);
}

function createWebAsset(user, url, title, headers, disableVerification) {
    return callApi(
        "POST",
        "https://api.screenlyapp.com/api/v3/assets/",
        {
            "source_url": url,
            "title": title,
            "headers": headers,
            "disable_verification": disableVerification,
        },
        user.token
    );
}

function getAssetDashboardLink(assetId) {
    return `https://login.screenlyapp.com/login?next=/manage/assets/${assetId}`;
}
