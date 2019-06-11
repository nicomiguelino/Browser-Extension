'use strict';

const elements = {
    signInButton: document.querySelector('button#open-sign-in'),
    workingPage: document.querySelector('#working-page'),
    proposalPage: document.querySelector('#proposal-page'),
    successPage: document.querySelector('#success-page'),
    failurePage: document.querySelector('#failure-page'),
    withAuthCheckbox: document.querySelector('#with-auth-check'),
    withAuthInfo: document.querySelector('#with-auth-check-info'),
    addToForm: document.querySelector('form#add-it'),
    addToButton: document.querySelector('form button#add-it-submit')
};

for (let [key, value] of Object.entries(elements)) {
    assert(value, `${key} not found`);
}

let currentProposal;

function showSpinner() {
    showPage(elements.workingPage);
}

function addToScreenly() {
    let includeAuth = elements.withAuthCheckbox.checked;

    elements.addToButton.disabled = true;
    elements.addToButton.querySelector(".spinner").hidden = false;
    elements.addToButton.querySelector(".label").hidden = true;

    let headers = undefined;

    if (includeAuth && currentProposal.cookieJar) {
        headers = {
            'Cookie': currentProposal.cookieJar.map(cookie => cookiejs.serialize(cookie.name, cookie.value)).join("; ")
        };
    }

    let result={id: "abc"};
    showFailureResult(`https://${currentProposal.user.username}.screenlyapp.com/manage/assets/${result.id}`);
    return;

    createWebAsset(currentProposal.user, currentProposal.url, currentProposal.title, headers)
        .then((result) => {
            console.info(result);
            showResult(`https://${currentProposal.user.username}.screenlyapp.com/manage/assets/${result.id}`);
        })
        .catch((error) => {
            if (error.statusCode === 401) {
                showResult(undefined, "Screenly authentication failed. Try logging out.");
                return;
            }
            showResult(undefined, "Failed to add this content to your Screenly account.");
        });

}

function cancelAdd() {
    currentProposal = null;
    window.close();
}

function updateProposal() {
    elements.proposalPage.querySelector("#title").textContent = currentProposal.title;
    elements.proposalPage.querySelector("#url").textContent = currentProposal.url;
    elements.proposalPage.querySelector("#hostname").textContent = new URL(currentProposal.url).hostname;
}

function proposeToAddToScreenly(user, url, title, cookieJar) {
    currentProposal = {
        user: user,
        title: title,
        url: url,
        cookieJar: cookieJar
    };

    updateProposal();

    showPage(elements.proposalPage);
}

function prepareToAddToScreenly(user) {
    // TODO In a future version we may allow cookies from every resource domain.
    const onlyPrimaryDomain = true;

    if (!user.username) {
        return;
    }

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
        showResult(undefined, "Unable to find any content to add to Screenly.");
    });
}

function showFailureResult(message) {
    elements.failurePage.querySelector("#fail-message").textContent = message;
    showPage(elements.failurePage);
}

function showSuccessResult(assetUrl) {
    showPage(elements.successPage);
}

function init() {
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

    getUser().then(prepareToAddToScreenly);
}

init();


