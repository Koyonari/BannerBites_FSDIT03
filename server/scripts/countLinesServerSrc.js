const fs = require('fs');
const path = require('path');

// Assume script is being run from the project root directory
const projectRoot = path.resolve(__dirname, '..', '..');

// Define paths for server and src components (directly from the project root)
const serverPaths = [
    'server/controllers',
    'server/middleware',
    'server/models',
    'server/routes',
    'server/scripts',
    'server/test',
    'server/index.js'
];

const srcPaths = [
    'src/components/Ad',
    'src/components/AdCanvas',
    'src/components/AdViewer',
    'src/components/LayoutList',
    'src/components/Login',
    'src/components/Modal',
    'src/components/UserHome',
    // Add other components as needed
];

let jsLineCount = 0;
let jsxLineCount = 0;
let detailedJsLines = [];
let detailedJsxLines = [];

// Function to count lines in a file
function countLines(filePath) {
    return new Promise((resolve, reject) => {
        let lineCount = 0;
        const readStream = fs.createReadStream(filePath);

        readStream
            .on('data', (chunk) => {
                for (let i = 0; i < chunk.length; i++) {
                    if (chunk[i] === 10) lineCount++; // Newline character (LF)
                }
            })
            .on('end', () => {
                resolve(lineCount);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

// Function to traverse directories and count lines
async function traverseDirectory(dir, extension, countCallback, detailsArray) {
    try {
        const stat = fs.statSync(dir);
        if (stat.isFile() && dir.endsWith(extension)) {
            const lineCount = await countLines(dir);
            countCallback(lineCount);
            const relativePath = path.relative(projectRoot, dir);
            detailsArray.push({ file: relativePath, lines: lineCount });
        } else if (stat.isDirectory()) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                await traverseDirectory(filePath, extension, countCallback, detailsArray);
            }
        }
    } catch (err) {
        console.error(`Error accessing ${dir}: ${err.message}`);
    }
}

// Function to count lines for all specified paths
async function countLinesInPaths(paths, extension, countCallback, detailsArray) {
    for (const relativePath of paths) {
        const absolutePath = path.join(projectRoot, relativePath);
        await traverseDirectory(absolutePath, extension, countCallback, detailsArray);
    }
}

// Group files by folder for better output
function groupByFolder(detailsArray) {
    const grouped = {};
    detailsArray.forEach(({ file, lines }) => {
        const folder = path.dirname(file);
        if (!grouped[folder]) {
            grouped[folder] = [];
        }
        grouped[folder].push({ file, lines });
    });
    return grouped;
}

// Main function to count lines
(async () => {
    try {
        // Count lines in server paths for .js files
        await countLinesInPaths(serverPaths, '.js', (lineCount) => {
            jsLineCount += lineCount;
        }, detailedJsLines);

        // Count lines in src paths for .jsx files
        await countLinesInPaths(srcPaths, '.jsx', (lineCount) => {
            jsxLineCount += lineCount;
        }, detailedJsxLines);

        // Nicely log the results
        console.log(`\n===== Line Count Summary =====`);

        // Grouping and logging backend (.js) files
        console.log(`\nBackend (.js files):`);
        const groupedJsFiles = groupByFolder(detailedJsLines);
        for (const folder in groupedJsFiles) {
            console.log(`\n${folder}:`);
            groupedJsFiles[folder].forEach(({ file, lines }) => {
                console.log(`  ${path.basename(file)}: ${lines} lines`);
            });
        }
        console.log(`Total number of lines in backend (.js files): ${jsLineCount}`);

        // Grouping and logging frontend (.jsx) files
        console.log(`\nFrontend (.jsx files):`);
        const groupedJsxFiles = groupByFolder(detailedJsxLines);
        for (const folder in groupedJsxFiles) {
            console.log(`\n${folder}:`);
            groupedJsxFiles[folder].forEach(({ file, lines }) => {
                console.log(`  ${path.basename(file)}: ${lines} lines`);
            });
        }
        console.log(`Total number of lines in frontend (.jsx files): ${jsxLineCount}`);

        console.log(`\n===============================\n`);
    } catch (err) {
        console.error('Error while counting lines:', err);
    }
})();
