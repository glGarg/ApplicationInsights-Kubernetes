const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function downloadArtifact(owner, repo, artifactName) {
    const artifacts = await octokit.actions.listArtifactsForRepo({
        owner,
        repo,
    });

    const artifact = artifacts.data.artifacts.find(a => a.name === artifactName);
    if (!artifact) {
        throw new Error(`Artifact ${artifactName} not found`);
    }

    const download = await octokit.actions.downloadArtifact({
        owner,
        repo,
        artifact_id: artifact.id,
        archive_format: 'zip',
    });

    const filePath = path.join(__dirname, `${artifactName}.zip`);
    fs.writeFileSync(filePath, Buffer.from(download.data));
    return filePath;
}

function compareResults(oldResults, newResults) {
    const oldAllocations = JSON.parse(fs.readFileSync(oldResults));
    const newAllocations = JSON.parse(fs.readFileSync(newResults));

    const isFaster = newAllocations.totalAllocations < oldAllocations.totalAllocations;
    console.log(`Fixed code is ${isFaster ? 'faster' : 'slower'}`);
}

async function main() {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    const baselineResults = await downloadArtifact(owner, repo, 'baseline-results');
    const postFixResults = await downloadArtifact(owner, repo, 'postfix-results');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});