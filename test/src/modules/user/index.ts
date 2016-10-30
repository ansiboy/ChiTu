import chitu = require('chitu');

let html = "<h1>User Index Page</h1>";
export = class IndexPage extends chitu.Pageview {
    constructor(args:chitu.PageArguemnts) {
        args.element.innerHTML = html;
        super(args)
    }
} 