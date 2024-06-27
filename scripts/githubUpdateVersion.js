/*
Script for updating the version in the package.json based on an environment variable.
Used in github action to make sure the content of the package.json matches the github
version
*/
const fs = require('fs');
const packageJson = "package.json"
const githubRef = process.env.GITHUB_REF
console.log(`Using Ref:${githubRef}`)
const version = process.env.GITHUB_REF.split('refs/tags/')[1]
const content = fs.readFileSync(packageJson)
const contentJson = JSON.parse(content)
contentJson.version = version
const updatedContent = JSON.stringify(contentJson, null, 2)
fs.writeFileSync(packageJson, updatedContent)
