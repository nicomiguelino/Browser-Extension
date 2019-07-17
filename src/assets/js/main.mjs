'use strict';

import '../../lib/vendor/bootstrap/css/bootstrap.css';
import '../css/style.css';
import "../../lib/vendor/cookie.js";
import "../../lib/vendor/normalize-url.js";

export function assert(condition, msg=undefined) {
    if (!condition)
        throw msg ? msg : "Assertion error";
}

export function showElement(element) {
    element.hidden = false;
}

export function hideElement(element) {
    element.hidden = true;
}

export function showPage(pageEl) {
    Array.from(document.querySelectorAll(".page"))
        .filter(value => value !== pageEl)
        .forEach(hideElement);

    showElement(pageEl);
}

export function setButtonWaitState(element, state) {
    element.disabled = state;
    element.querySelector(".spinner").hidden = !state;
    element.querySelector(".label").hidden = state;
}

function callApi(method, url, data=undefined, token=undefined) {
    let init = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data !== undefined && data !== null) {
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
        }).catch((error) => {
            // Do some basic logging but then just rethrow the error.

            console.error("API request %s %s failed: %s", method, url, error);
            if (error.status)
                console.info("Response: ", error);

            throw error;
        });
}

export function fetchToken(email, password) {
    console.info(`Getting token for ${email}...`);
    return callApi(
        "POST",
        "https://api.screenlyapp.com/api/v3/tokens/",
        {
            username: email,
            password: password,
        });
}

export function getUser() {
    return browser.storage.sync.get(['username', 'token']);
}

export function createWebAsset(user, url, title, headers, disableVerification) {
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

export function updateWebAsset(assetId, user, url, title, headers, disableVerification) {
    return callApi(
        "PATCH",
        `https://api.screenlyapp.com/api/v3/assets/${encodeURIComponent(assetId)}/`,
        {
            "title": title,
            "headers": headers,
        },
        user.token
    );
}

export function getWebAsset(assetId, user) {
    return callApi(
        "GET",
        `https://api.screenlyapp.com/api/v3/assets/${encodeURIComponent(assetId)}/`,
        null,
        user.token
    )
}

export function getAssetDashboardLink(assetId) {
    return `https://login.screenlyapp.com/login?next=/manage/assets/${assetId}`;
}


export class State {
    constructor() {
    }

    // Make a new URL equivalent to the given URL but in a normalized format.
    static normalizeUrl(url) {
        return window.normalizeUrl(url, {
            removeTrailingSlash: false,
            sortQueryParameters: false,
            stripWWW: false,
        });
    }

    // Simplify a URL heavily, even if it slightly changes its meaning.
    static simplifyUrl(url) {
        return window.normalizeUrl(url, {
            removeTrailingSlash: true,
            sortQueryParameters: true,
            stripHash: true,
            stripProtocol: true,
            stripWWW: true,
        })
    }

    static setAssetId(url, assetId) {
        url = State.simplifyUrl(url);
        console.debug(`Saving ${url} -> ${assetId}`);

        return browser.storage.sync.get(['state'])
            .then((state) => {
                state = state || {};

                if (assetId)
                    state[url] = assetId;
                else
                    delete state[url];

                console.debug("State: ", state);
                return browser.storage.sync.set({'state': state})
                    .catch((error) => {
                        console.error("Unable to save state %s -> %s", url, assetId);
                        // Assume it's because storage is full. Try to set just one key.
                        // TODO Use LRU to ensure the dictionary doesn't ever grow larger than the
                        // sync storage limit.
                        return browser.stoage.sync.remove('state').then(() => {
                            if (assetId)
                                return browser.storage.sync.set({'state': {url: assetId}});
                            else
                                return browser.storage.sync.set({'state': {}});
                        });
                    });
            });
    }

    static getAssetId(url) {
        url = State.simplifyUrl(url);
        console.debug(`Reading back ${url}`);

        return browser.storage.sync.get(['state'])
            .then(({state}) => {
                state = state || {};
                return state[url];
            });
    }
}
