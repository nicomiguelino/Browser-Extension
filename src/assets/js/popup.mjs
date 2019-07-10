'use strict';

import {
    assert,
    createWebAsset,
    getAssetDashboardLink, getUser,
    getWebAsset,
    hideElement,
    setButtonWaitState,
    showElement,
    showPage,
    State,
    updateWebAsset
} from "./main.mjs";

const elements = {
    addItError: document.querySelector('#add-it-error'),
    addLabel: document.querySelector('span.label.add'),
    addToButton: document.querySelector('form button#add-it-submit'),
    addToForm: document.querySelector('form#add-it'),
    noVerificationCheckbox: document.querySelector('#no-verification-check'),
    proposalPage: document.querySelector('#proposal-page'),
    signInButton: document.querySelector('button#open-sign-in'),
    signInPage: document.querySelector('#sign-in-page'),
    siteLink: document.querySelector('#sign-in-page a'),
    successPage: document.querySelector('#success-page'),
    updateLabel: document.querySelector('span.label.update'),
    verificationSection: document.querySelector('section#verification'),
    viewItButton: document.querySelector('button#view-it'),
    withAuthCheckbox: document.querySelector('#with-auth-check'),
    withAuthInfo: document.querySelector('#with-auth-check-info'),
    workingPage: document.querySelector('#working-page'),
};

let currentProposal;

function showSpinner() {
    showPage(elements.workingPage);
}

function setAddActivityState(state) {
    setButtonWaitState(elements.addToButton, state);

    if (state)
        elements.addItError.hidden = true;
}

function addToScreenly() {
    const includeAuth = elements.withAuthCheckbox.checked;
    const disableVerification = elements.noVerificationCheckbox.checked;

    setAddActivityState(true);

    let headers = undefined;

    if (includeAuth && currentProposal.cookieJar) {
        headers = {
            'Cookie': currentProposal.cookieJar.map(cookie => cookiejs.serialize(cookie.name, cookie.value)).join("; ")
        };
    }

    const currentAssetId = currentProposal.assetId;
    let action;

    if (!currentAssetId) {
        action = createWebAsset(currentProposal.user, currentProposal.url, currentProposal.title, headers, disableVerification);
    } else {
        action = updateWebAsset(currentAssetId, currentProposal.user, currentProposal.url, currentProposal.title, headers, disableVerification);
    }

    action
        .then((result) => {
            console.debug(result);
            State.setAssetId(currentProposal.url, result.id);
            showSuccess(getAssetDashboardLink(result.id));
        })
        .catch((error) => {
            if (error.statusCode === 401) {
                showFailure("Screenly authentication failed. Try signing out and back in again.");
                return;
            }

            error.json()
                .then((errorJson) => {
                    console.error("Failed to add/update asset:", error);
                    console.error("Response: ", errorJson);
                    if (errorJson.type[0] === "AssetUnreachableError") {
                        elements.verificationSection.hidden = false;
                        showFailure("Screenly couldn't reach this asset. Use the Bypass Verification option to add this asset anyhow.");
                    } else {
                        throw "Unknown error";
                    }
                }).catch(() => {
                    showFailure(currentAssetId ? "Failed to update asset." : "Failed to add asset.");
                });
        });
}

function updateProposal(newProposal) {
    currentProposal = newProposal;
    const url = currentProposal.url;

    return State.getAssetId(url)
        .then((assetId) => {
            if (assetId)
                // Does the asset still exist?
                return getWebAsset(assetId, newProposal.user)
                    .then((response) => {
                        // Yes it does. Proceed with the update path.
                        return assetId;
                    })
                    .catch((error) => {
                        if (error.status === 404) {
                            // It's gone. Proceed like if we never had it.
                            State.setAssetId(url, null);
                            return undefined;
                        }

                        throw error;
                    });
        })
        .then((assetId) => {
            currentProposal.assetId = assetId;

            elements.proposalPage.querySelector("#title").textContent = currentProposal.title;
            elements.proposalPage.querySelector("#url").textContent = currentProposal.url;
            elements.proposalPage.querySelector("#hostname").textContent = new URL(url).hostname;

            console.info(`URL ${url} associated with asset ID ${assetId}`);
            if (assetId) {
                hideElement(elements.addLabel);
                showElement(elements.updateLabel);
            } else {
                hideElement(elements.updateLabel);
                showElement(elements.addLabel);
            }
        })
        .catch((error) => {
            // Unknown error.
            showFailure("Failed to check asset.");
            throw error;
        });
}

function proposeToAddToScreenly(user, url, title, cookieJar) {
    updateProposal({
        user: user,
        title: title,
        url: State.normalizeUrl(url),
        cookieJar: cookieJar
    })
        .then(() => {
            showPage(elements.proposalPage);
        });
}

function prepareToAddToScreenly(user) {
    // TODO In a future version we may allow cookies from every resource domain.
    const onlyPrimaryDomain = true;

    if (!user.username) {
        showPage(elements.signInPage);
        return;
    }

    console.info(user);

    showSpinner();

    browser.tabs.executeScript({
        code: '[window.location.href, document.title, performance.getEntriesByType("resource").map(e => e.name)]',
    }).then(([[pageUrl, pageTitle, resourceEntries]]) => {
        if (!resourceEntries) {
            console.info("Current page has no resources.");
            return;
        }

        const originDomain = new URL(pageUrl).host;

        Promise.all(
            resourceEntries.map(url =>
                browser.cookies.getAll({url})
            )
        ).then(results => {
            // At this point we'll create a "cookie jar". Some cookies will repeat
            // (since different subdomains may receive the same cookies). So we deduplicate
            // by domain and name.

            let cookieJar = Array.from(new Map(results
                    .flat(1)
                    .map(cookie => [JSON.stringify([cookie.domain, cookie.name]), cookie])
                ).values()
            );

            if (onlyPrimaryDomain) {
                cookieJar = cookieJar.filter(cookie =>
                    cookie.domain === originDomain || (!cookie.hostOnly && originDomain.endsWith(cookie.domain))
                )
            }

            console.info("Jar: ", cookieJar);

            proposeToAddToScreenly(user, pageUrl, pageTitle, cookieJar);
        });
    }).catch(error => {
        console.error("Failed to list resources (%s).", error.message);
        window.close();
    });
}

function showFailure(message) {
    setAddActivityState(false);
    elements.addItError.textContent = message;
    elements.addItError.hidden = false;
}

function showSuccess(assetUrl) {
    elements.viewItButton.dataset['href'] = assetUrl;
    showPage(elements.successPage);
}

export function initPopup() {
    for (let [key, value] of Object.entries(elements)) {
        assert(value, `${key} not found`);
    }

    elements.siteLink.addEventListener('click', () => {
        browser.tabs.create({ url: elements.siteLink.href });
    });

    elements.signInButton.addEventListener('click', () => {
        browser.runtime.openOptionsPage();
    });

    hideElement(elements.withAuthInfo);
    elements.withAuthCheckbox.addEventListener('change', () => {
        if (elements.withAuthCheckbox.checked) {
            showElement(elements.withAuthInfo);
        } else {
            hideElement(elements.withAuthInfo);
        }
    });

    elements.addToForm.addEventListener('submit', (e) => {
        e.preventDefault();

        addToScreenly();
    });

    elements.viewItButton.addEventListener('click', () => {
        let url = elements.viewItButton.dataset['href'];
        browser.tabs.create({ url: url });
        window.close();
    });

    getUser().then(prepareToAddToScreenly);
}
