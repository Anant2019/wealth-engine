const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
dom.window.eval(script);

try {
    dom.window.document.getElementById('u-name').value = "Test User";
    dom.window.calculateStrategy();
    console.log("Strategy calculated.");
    // Expose a stub for html2pdf to see what is passed to it
    let html2pdfCalled = false;
    dom.window.html2pdf = function() {
        html2pdfCalled = true;
        return {
            from: function(el) { console.log("from() called with element:", el.id); return this; },
            set: function(opt) { console.log("set() called with options:", Object.keys(opt)); return this; },
            output: function(type) { console.log("output() called with type:", type); return Promise.resolve(new Blob()); }
        };
    };
    dom.window.Blob = class Blob { constructor() {} };
    dom.window.URL.createObjectURL = () => "blob:test";
    dom.window.URL.revokeObjectURL = () => {};

    dom.window.generateWealthBlueprintPDF();
    setTimeout(() => {
       console.log("html2pdfCalled:", html2pdfCalled);
    }, 100);
} catch (e) {
    console.error("Error:", e.message, e.stack);
}
