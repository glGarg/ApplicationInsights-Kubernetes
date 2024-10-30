const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

let baselineFasterCount = 0;
let postfixFasterCount = 0;
let benchmarkResults = [];

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
        const unzipper = require('unzipper');
        fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: destFolder }))
            .on('finish', resolve)
            .on('error', reject);
    }
    );
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

function getFasterValue(baseline, postfix) {
    if (baseline < postfix) {
        return 'Baseline';
    } else if (baseline > postfix) {
        return 'Postfix';
    }
    return 'Equal';
}

// Function to compare benchmarks
function isPostFixImproved(baseline, postfix) {
    const baselineReports = readJsonFilesFromDir(baseline);
    const postFixReports = readJsonFilesFromDir(postfix);

    baselineReports.forEach((baselineReport, index) => {
        const postFixReport = postFixReports[index];
        if (baselineReport && postFixReport) {
            baselineReport.Benchmarks.forEach((baselineBenchmark, i) => {
                const postFixBenchmark = postFixReport.Benchmarks[i];
                if (baselineBenchmark && postFixBenchmark) {
                    const baselineBytes = baselineBenchmark.Memory.BytesAllocatedPerOperation;
                    const postfixBytes = postFixBenchmark.Memory.BytesAllocatedPerOperation;
                    if (baselineBytes < postfixBytes) {
                        baselineFasterCount++;
                    } else if (baselineBytes > postfixBytes) {
                        postfixFasterCount++;
                    }

                    benchmarkResults.push({
                        name: baselineBenchmark.FullName,
                        baseline: baselineBytes,
                        postfix: postfixBytes,
                        faster: getFasterValue(baselineBytes, postfixBytes)
                    });
                }
            });
        }
    });

    return baselineFasterCount < postfixFasterCount;
}

function generateMarkdownTable(results) {
    let table = '| Benchmark | Baseline Bytes | Postfix Bytes | Faster |\n';
    table += '|-----------|----------------|---------------|--------|\n';
    results.forEach(result => {
        table += `| ${result.name} | ${result.baseline} | ${result.postfix} | ${result.faster} |\n`;
    });
    return table;
}


async function main() {
    const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
    const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
    const baselineResults = await downloadArtifact(owner, repo, 'baseline-results');
    const postFixResults = await downloadArtifact(owner, repo, 'postfix-results');
    // Unzip the downloaded files
    const baselineDir = path.join(__dirname, 'baseline-results');
    const postFixDir = path.join(__dirname, 'postfix-results');
    await unzipFile(baselineResults, baselineDir);
    await unzipFile(postFixResults, postFixDir);

    const isImprovement = isPostFixImproved(baselineDir, postFixDir);
    console.log(`Is improvement: ${isImprovement}`);

    const markdownTable = generateMarkdownTable(benchmarkResults);
    console.log(markdownTable);

    core.setOutput('isImprovement', isImprovement);
    core.setOutput('benchmarkResultsMD', markdownTable);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});