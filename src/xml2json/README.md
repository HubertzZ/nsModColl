## xml2json

An XML to JSON conversion module for SuiteScript 2.0

### Usage

```javascript
define(['./xml2json', 'xml'], function (x2js, xml) {
    var xmlStr = '<e name="value">text</e>';
    var xmlDoc = xml.Parser.fromString(xmlStr);
    var jsonStr = x2js.xml2json(xmlDoc);    // input element or document DOM node,
                                            // return JSON string
    var jsonObj = JSON.parse(jsonStr);
    var xmlStr = x2js.json2xml(jsonObj);    // input JSON object,
                                            // return XML string
});
```

### License

- GNU Lesser General Public License - v3