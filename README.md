# JSON URLEY: A Tight Standard for Json / URL Parameter Conversion

Json Urley provides a tight standard for converting json objects to and from URL parameters.
(This is a port to typescript of the [python json-urley](https://github.com/tofarr/json-urley) project)

## Installation

Standard install via:
```
npm install json-urley
```

## Usage

Converting a Json Object to a Query String:
```
import { jsonObjToQueryStr } from 'json-urley';
const myJsonObj = {foo: 'bar', zap: true, bang: 1}
const myQueryStr = jsonObjToQueryStr(myJsonObj)
```

Converting a Query String to a JSON Object:
```
import { jsonObjToQueryStr, queryStrToJsonObj } from 'json-urley';
const myqueryStr = '?foo=bar&zap=true&bang=1'
const myJsonObj = queryStrToJsonObj(myqueryStr)
```

## Aims:

* The resulting URLs should be as readable as possible
* Most cases should not include anything that a user unfamiliar with this library would not expect
  (as little magic as possible!)
* It should be possible to convert ANY Json structure - no matter how nested.
* The process should be reversible.
* The result should be as compatible with OpenAPI as possible

## Rules

1. The top level element is assumed to be an object: `? => {}`
2. Optional type hints for values can be specified at the end of a key by a `~`. Unknown types throw an error.
   Permitted types are:
   * `s => str : ?a~s=b => {"a": "b"}`
   * `f => float : ?a~f=1 => {"a": 1.0}`
   * `i => int : ?a~i=1 => {"a": 1}`
   * `b => bool : ?a~b=1 => {"a": true}, ?a~b=0 => {"a": false},`
   * `n => null : ?a~n= => {"a": null}, ?a~n=null => {"a": null}`
   * `a => empty array : ?a~a= => {"a": []}`
   * `o => empty object : ?a~o= => {"a": {}}`
3. Boolean values for True are `true` (case insensitive) or `1`. Anything else throws an error
4. Boolean values for False are `false` (case insensitive) or `0`. Anything else throws an error
5. Null values should be `null` or an empty string. Anything else throws an error
6. Values for an empty array or empty object must be an empty string. Anything else throws an error. (These structures
   may be built out by later keys)
7. If no type is specified, we try to infer the type with the following precedence:
   * The value `null` implies the type is null: `?a=null => {"a": null}
   * The value `true` implies the type is boolean: `?a=true => {"a": true}
   * The value `false` implies the type is boolean: `?a=false => {"a": false}
   * If the value can be parsed as an integer, it is an integer number: `?a=1 => {"a": 1}`
   * If the value can be parsed as a float, it is a floating point number: `?a=1.0 => {"a": 1.0}`
   * If the value is `NaN`, `Infinity` or `-Infinity` it is one of these numbers.
   * The value is a string
8. Duplicate keys mean the presence of an array at the end of the path. *This makes the ordering of elements
   significant!*
   * `?a=1&a=2 => {"a": [1, 2]}`
   * `?a=1&a~i=2 => {"a": [1, 2]}`
   * `?a=1&a~s=2 => {"a": [1, "2"]}`
9. Keys are divided into elements by a `.` : `?a.b=1&a.c=2 => {"a": {"b": [1, 2]}}`
10. Elements which are not at the end of a path may have a hint indicating that they are an array instead of a key.
    Arrays may have 2 keys:
    * `n` : A new element
    * `e` : The last existing element (creates new if missing)
    Examples:
    * `?foo=a&foo=b => {"foo": ["a", "b"]}`
    * `?foo~a.n=a&foo~a.n=b => {"foo": ["a", "b"]}`
    * `?foo~a.n.c=a&foo~a.n.c=b => {"foo": [{"c": "a"}, {"c": "b"}]}`
    * `?foo~a.n.c=a&foo.n.c=b => {"foo": [{"c": "a"}, {"c": "b"}]}`
    * `?foo~a=&foo.n.c=a&foo.n.c=b => {"foo": [{"c": "a"}, {"c": "b"}]}`
    * `?foo~a.n.c=a&foo.e.d=b => {"foo": [{"c": "a", "d": "b"}]}`
    * `?foo~a.e.c=a&foo.e.d=b => {"foo": [{"c": "a", "d": "b"}]}`
    * `?foo~a.e.c=a&foo.e.c=b => {"foo": [{"c": ["a", "b"]}]}`
    * `?foo~a.e~a.e~a.e=1 => {"foo": [[[1]]]}`
    * `?foo~a.n~a.n~a.n=1&foo~a.n~a.n~a.n=2&foo~a.e~a.e~a.e=3 => {"foo": [[[1]], [[2,3]]]}`
11. Trying to mix arrays with objects will result in an error:
    * `?a~a=&a.b=1 => ERROR`
    * `?a~a=&a.foo=1 => ERROR`
12. Actual ~ or . in keys can be escaped with a preceding ~:
    * `a~~a=1 => {"a~a": 1}`
    * `a~~~b=1 => {"a~": true}`
    * `a~~~.b=1 => {"a~.b": 1}`

## Notes:

### How do you verify this thing works?

Test coverage is currently 100% and will be so before any new release

### Why the tildas for type hints? (~)

* Tildas are not valid as part of a URL parameter - they are not encoded with a % and unicode number
when you call `encodeUriComponent`, making them easier to read than alternatives.
* Tilda is often used to mean `approximately`, so I thought it was appropriate for type hints.

### Why not use one of the existing options?

All existing options I found did not satisfy one or more of the aims outlined at the outset of this readme.

### Why don't your array definitions allow specifying lengths, but items must be defined explicitly?

This was decided in order to help prevent denial of service attacks. Can you imagine a situation where a malicious user
could command a server to create a data structure to hold trillions of items from the command line? Gross!

### Aren't nested arrays still difficult to read?

Yes. Though the spec allows you to define data structures of any complexity, just because you can doesn't mean you
should!

## Developing / Building / Running Tests

After cloning the git repo, install the project dependencies (Including dev dependencies) with:
```
npm install
```

To build the library js files in the dist directory from the typescript files in the src directory run:
```
npm run build
```

To run the mocha tests from the command line:
```
npm run build
npm run test
```

To Run the Linter:
```
npm run lint
```

To run the mocha tests in browser (This will create a build directory populated by webpack):
```
npm run buildBrowserTest
npm run browserTest
```

Then visit: [http://localhost:8080/test.html](http://localhost:8080/test.html)

## Problems:

* The source map does not match up so debugging in a browser is hard
* The process is manual - we should watch the directory and run webpack
* The browser should open automatically

## Release Procedure

![status](https://github.com/tofarr/json-urley-js/actions/workflows/quality.yml/badge.svg?branch=main)

The typical process here is:
* Create a PR with changes. Merge these to main (The `Quality` workflows make sure that your PR
  meets the styling, linting, and code coverage standards).
* Create a new release tag in github - New releases created in github are automatically uploaded to npm.
  (The NPM_TOKEN may expire and need to be refreshed periodically in the repository secrets.)
