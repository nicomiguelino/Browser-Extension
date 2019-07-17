'use strict';

import {fetchToken} from "../../assets/js/main";

function mockFetchResponse(status, statusText, body) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        statusText: statusText,
        json: () => {
            return Promise.resolve(JSON.parse(body));
        },
    });
}

describe("main.fetchToken", function() {
    it("for invalid username and password throws error", async () => {
        //spyOn(window, 'fetch').and.callThrough();
        spyOn(window, 'fetch').and.returnValue(mockFetchResponse(401, "", ""));

        try {
            await fetchToken("myname", "mypass");
            fail();
        } catch(error) {
            expect(error.status).toBe(401);
            expect(window.fetch).toHaveBeenCalledWith( 'https://api.screenlyapp.com/api/v3/tokens/', { method: 'POST', headers: { "Content-Type": 'application/json' }, body: '{"username":"myname","password":"mypass"}'});
        }
    });

    it("for valid username and password returns token", async () => {
        // spyOn(window, 'fetch').and.callThrough();
        spyOn(window, 'fetch').and.returnValue(mockFetchResponse(200, "", "{\"username\":\"siker+lasershark12@norwinter.com\",\"token\":\"deadbeef\"}"));

        let response = await fetchToken("siker+lasershark12@norwinter.com", "banana");

        expect(response.username).toBe("siker+lasershark12@norwinter.com");
        expect(response.token).toBe("deadbeef");
        expect(window.fetch).toHaveBeenCalledWith( 'https://api.screenlyapp.com/api/v3/tokens/', { method: 'POST', headers: { "Content-Type": 'application/json' }, body: '{"username":"siker+lasershark12@norwinter.com","password":"banana"}'});
    });
});
