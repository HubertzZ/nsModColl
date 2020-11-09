/**
 * Copyright 2020 Hubert Z.
 * Copyright 2006 Stefan Goessner
 *
 * This file is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Lesser Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * This file is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this file.
 * If not, see <https://www.gnu.org/licenses/lgpl-3.0.html>.
 *
 * @NApiVersion 2.x
 */

/**
 * File: xml2json.js
 * Name: xml2json
 * Version: 20201109
 */

import {EntryPoints} from "N/types";
import {log, xml} from "N";

export let xml2json = (xmlNode) => {
    let X = {
        toObj: function(xmlNode) {
            let o = {};
            if (xmlNode.nodeType==xml.NodeType.ELEMENT_NODE) {  // element node ..
                if (xmlNode.attributes.length)  // element with attributes  ..
                    for (let i=0; i<xmlNode.attributes.length; i++)
                        o["@"+xmlNode.attributes[i].nodeName] = (xmlNode.attributes[i].nodeValue||"").toString();
                if (xmlNode.firstChild) { // element has child nodes ..
                    let textChild=0, cdataChild=0, hasElementChild=false;
                    for (let n=xmlNode.firstChild; n; n=n.nextSibling) {
                        if (n.nodeType==xml.NodeType.ELEMENT_NODE) hasElementChild = true;
                        else if (n.nodeType==xml.NodeType.TEXT_NODE && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++;    // non-whitespace text
                        else if (n.nodeType==xml.NodeType.CDATA_SECTION_NODE) cdataChild++; // cdata section node
                    }
                    if (hasElementChild) {
                        if (textChild < 2 && cdataChild < 2) {  // structured element with evtl. a single text or/and cdata node ..
                            X.removeWhite(xmlNode);
                            for (let n=xmlNode.firstChild; n; n=n.nextSibling) {
                                if (n.nodeType == xml.NodeType.TEXT_NODE)   // text node
                                    o["#text"] = X.escape(n.nodeValue);
                                else if (n.nodeType == xml.NodeType.CDATA_SECTION_NODE) // cdata node
                                    o["#cdata"] = X.escape(n.nodeValue);
                                else if (o[n.nodeName]) {   // multiple occurence of element ..
                                    if (o[n.nodeName] instanceof Array)
                                        o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                    else
                                        o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                }
                                else    // first occurence of element..
                                    o[n.nodeName] = X.toObj(n);
                            }
                        }
                        else {  // mixed content
                            if (!xmlNode.attributes.length)
                                o = X.escape(X.innerXml(xmlNode));
                            else
                                o["#text"] = X.escape(X.innerXml(xmlNode));
                        }
                    }
                    else if (textChild) {   // pure text
                        if (!xmlNode.attributes.length)
                            o = X.escape(X.innerXml(xmlNode));
                        else
                            o["#text"] = X.escape(X.innerXml(xmlNode));
                    }
                    else if (cdataChild) {  // cdata
                        if (cdataChild > 1)
                            o = X.escape(X.innerXml(xmlNode));
                        else
                            for (let n=xmlNode.firstChild; n; n=n.nextSibling)
                                o["#cdata"] = X.escape(n.nodeValue);
                    }
                }
                if (!xmlNode.attributes.length && !xmlNode.firstChild) o = null;
            }
            else if (xmlNode.nodeType==xml.NodeType.DOCUMENT_NODE) {    // document.node
                o = X.toObj(xmlNode.documentElement);
            }
            else
                log.error("unhandled node type", xmlNode.nodeType);
            return o;
        },
        toJson: function(o, name, ind) {
            let json = name ? ("\""+name+"\"") : "";
            if (o instanceof Array) {
                for (let i=0,n=o.length; i<n; i++)
                    o[i] = X.toJson(o[i], "", ind+"\t");
                json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
            }
            else if (o == null)
                json += (name&&":") + "null";
            else if (typeof(o) == "object") {
                let arr = [];
                for (let m in o)
                    arr[arr.length] = X.toJson(o[m], m, ind+"\t");
                json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
            }
            else if (typeof(o) == "string")
                json += (name&&":") + "\"" + o.toString() + "\"";
            else
                json += (name&&":") + o.toString();
            return json;
        },
        innerXml: function(node) {
            let s = ""
            if ("innerHTML" in node)
                s = node.innerHTML;
            else {
                let asXml = function(n) {
                    let s = "";
                    if (n.nodeType == xml.NodeType.ELEMENT_NODE) {
                        s += "<" + n.nodeName;
                        for (let i=0; i<n.attributes.length;i++)
                            s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
                        if (n.firstChild) {
                            s += ">";
                            for (let c=n.firstChild; c; c=c.nextSibling)
                                s += asXml(c);
                            s += "</"+n.nodeName+">";
                        }
                        else
                            s += "/>";
                    }
                    else if (n.nodeType == xml.NodeType.TEXT_NODE)
                        s += n.nodeValue;
                    else if (n.nodeType == xml.NodeType.CDATA_SECTION_NODE)
                        s += "<![CDATA[" + n.nodeValue + "]]>";
                    return s;
                };
                for (let c=node.firstChild; c; c=c.nextSibling)
                    s += asXml(c);
            }
            return s;
        },
        escape: function(txt) {
            return txt.replace(/[\\]/g, "\\\\")
                .replace(/[\"]/g, '\\"')
                .replace(/[\n]/g, '\\n')
                .replace(/[\r]/g, '\\r');
        },
        removeWhite: function(e) {
            e.normalize();
            for (let n = e.firstChild; n; ) {
                if (n.nodeType == xml.NodeType.TEXT_NODE) { // text node
                    if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                        let nxt = n.nextSibling;
                        e.removeChild(n);
                        n = nxt;
                    }
                    else
                        n = n.nextSibling;
                }
                else if (n.nodeType == xml.NodeType.ELEMENT_NODE) { // element node
                    X.removeWhite(n);
                    n = n.nextSibling;
                }
                else    // any other node
                    n = n.nextSibling;
            }
            return e;
        }
    };
    if (xmlNode.nodeType == xml.NodeType.DOCUMENT_NODE) // document node
        xmlNode = xmlNode.documentElement;
    let json = X.toJson(X.toObj(X.removeWhite(xmlNode)), xmlNode.nodeName, "\t");
    return "{" + json.replace(/\t|\n/g, "") + "}";
};

export let json2xml = (o) => {
    let toXml = function(v, name, ind) {
        let xmlNode = "";
        if (v instanceof Array) {
            for (let i=0, n=v.length; i<n; i++)
                xmlNode += ind + toXml(v[i], name, ind+"\t") + "\n";
        }
        else if (typeof(v) == "object") {
            let hasChild = false;
            xmlNode += ind + "<" + name;
            for (let m in v) {
                if (m.charAt(0) == "@")
                    xmlNode += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                else
                    hasChild = true;
            }
            xmlNode += hasChild ? ">" : "/>";
            if (hasChild) {
                for (let m in v) {
                    if (m == "#text")
                        xmlNode += v[m];
                    else if (m == "#cdata")
                        xmlNode += "<![CDATA[" + v[m] + "]]>";
                    else if (m.charAt(0) != "@")
                        xmlNode += toXml(v[m], m, ind+"\t");
                }
                xmlNode += (xmlNode.charAt(xmlNode.length-1)=="\n"?ind:"") + "</" + name + ">";
            }
        }
        else {
            xmlNode += ind + "<" + name + ">" + v.toString() +  "</" + name + ">";
        }
        return xmlNode;
    }, xml="";
    for (let m in o)
        xml += toXml(o[m], m, "");
    return xml.replace(/\t|\n/g, "");
}