## oauth1

An OAuth 1.0 module for SuiteScript 2.0

### Usage

1. Upload `cryptojs.js`, `secret.js` and `tba.js` to SuiteScript folder in File Cabinet.

2. Modify `secret.js` file to make sure the token, secret and company id match to the configuration in your environment. __(IMPORTANT NOTICE: DO NOT COMMIT THIS FILE TO ANY REPOSITORY. ADD IT TO `.gitignore`)__

3. Sample code:

    - GET
    
    ```javascript
    require(['N/https', './tba', './secret'], function(https, tba, secret) {
        var url = 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=100&deploy=1';
        var method = 'GET';
        var headers = tba.getHeaders({
            url: url,
            method: method,
            tokenKey: secret.token.public,
            tokenSecret: secret.token.secret
        });
    
        headers['Content-Type'] = 'application/json';
    
        var restResponse = https.get({
            url: url,
            headers: headers
        });
        log.debug('response', JSON.stringify(restResponse));
        log.debug('headers', headers);
    });
    ```

    - POST / PUT __(NOTE: No need to add the body to the OAuth Constructor)__

    ```javascript
    require(['N/https', './tba', './secret'], function(https, tba, secret) {
        var url = 'https://rest.sandbox.netsuite.com/app/site/hosting/restlet.nl?script=100&deploy=1';
        var method = 'POST';
        var headers = tba.getHeaders({
            url: url,
            method: method,
            tokenKey: secret.token.public,
            tokenSecret: secret.token.secret
        });
        var body = {
            foo: 'bar'
        };

        headers['Content-Type'] = 'application/json';

        var restResponse = https.get({
            url: url,
            headers: headers,
            body: JSON.stringify(body)
        });
        log.debug('response', JSON.stringify(restResponse));
        log.debug('headers', headers);
    });
    ```

### License

- The MIT License