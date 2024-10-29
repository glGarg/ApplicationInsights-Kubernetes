const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

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

async function unzipFile(zipFilePath, destFolder) {
    return new Promise((resolve, reject) => {
        const unzipStream = zlib.createUnzip();
        const readStream = fs.createReadStream(zipFilePath);
        const writeStream = fs.createWriteStream(destFolder);

        pipelineAsync(readStream, unzipStream, writeStream)
            .then(resolve)
            .catch(reject);
    });
}

// Function to read JSON files from a directory
function readJsonFilesFromDir(dir) {
    const files = fs.readdirSync(dir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    return jsonFiles.map(file => {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    });
}

// Function to compare benchmarks
function compareBenchmarks(folder1, folder2) {
    const reports1 = readJsonFilesFromDir(folder1);
    const reports2 = readJsonFilesFromDir(folder2);

    let baselineFasterCount = 0;
    let postfixFasterCount = 0;

    reports1.forEach((report1, index) => {
        const report2 = reports2[index];
        if (report1 && report2) {
            report1.Benchmarks.forEach((benchmark1, i) => {
                const benchmark2 = report2.Benchmarks[i];
                if (benchmark1 && benchmark2) {
                    const bytes1 = benchmark1.Memory.BytesAllocatedPerOperation;
                    const bytes2 = benchmark2.Memory.BytesAllocatedPerOperation;
                    if (bytes1 < bytes2) {
                        baselineFasterCount++;
                    } else {
                        postfixFasterCount++;
                    }
                }
            });
        }
    });

    console.log(`Baseline folder has ${baselineFasterCount} faster benchmarks.`);
    console.log(`Postfix folder has ${postfixFasterCount} faster benchmarks.`);
    console.log(`Baseline is faster: ${baselineFasterCount > postfixFasterCount}`);
}

async function main() {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    const baselineResults = await downloadArtifact(owner, repo, 'baseline-results');
    const postFixResults = await downloadArtifact(owner, repo, 'postfix-results');
    // Unzip the downloaded files
    await unzipFile(baselineResults, 'baseline-results');
    await unzipFile(postFixResults, 'postfix-results');

    compareBenchmarks(baselineResults, postFixResults);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});