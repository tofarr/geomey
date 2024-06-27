# Geomey : A Geometry Library for Typescript

## Goals

## Installation

* TODO: This won't work yet - Build a 1.0.0 release and deploy to npm*

Standard install via: 
```
npm install geomey
```

## Usage

* TODO: Write some usage *

## Aims:

* Provide a format for standard geometries in Javascript (Point, PointSet, LineString, LinearRing, Polygon, MultiPolygon)
* Format should be JSON compatible
* Format should be as tight as possible - efficient.
&

## Notes:

### How do you verify this thing works?

* TODO: This won't work yet - Set up test coverage*
Test coverage is currently 100% and will be so before any new release

### Why not use one of the existing options?

All existing options I found did not satisfy one or more of the aims outlined at the outset of this readme.
I wanted something that had some of the capabilities of JTS but in javascript without being a direct port

## Developing / Building / Running Tests

* TODO: This won't work yet - Set up test coverage*
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
