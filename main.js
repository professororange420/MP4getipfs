const IPFS = require('ipfs-core');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Function to download a file given a URL
async function downloadFile(url, destination) {
    const response = await fetch(url);
    const fileStream = fs.createWriteStream(destination);

    await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on("error", (err) => {
            reject(err);
        });
        fileStream.on("finish", function() {
            resolve();
        });
    });
}

// Function to scrape JSON files from an IPFS directory
async function scrapeIPFSDirectory(ipfsDirectoryCID) {
    const ipfs = await IPFS.create();

    // Get directory contents
    const directoryContents = await ipfs.ls(ipfsDirectoryCID);

    for (const item of directoryContents) {
        // Check if item is a file with .json extension
        if (item.type === 'file' && path.extname(item.name) === '.json') {
            const fileCID = item.cid.toString();
            const jsonContent = await ipfs.cat(fileCID);
            const jsonData = JSON.parse(jsonContent.toString());

            // Extract image URL
            const imageUrl = jsonData.image;

            // Download the MP4 file
            if (imageUrl && imageUrl.endsWith('.mp4')) {
                const fileName = path.basename(imageUrl);
                const destination = path.join(__dirname, fileName);
                await downloadFile(imageUrl, destination);
                console.log(`Downloaded ${fileName}`);
            }
        } else if (item.type === 'dir') {
            // Recursively scrape subdirectories
            await scrapeIPFSDirectory(item.cid.toString());
        }
    }
}

// Usage: provide the CID of the IPFS directory you want to scrape
const ipfsDirectoryCID = 'your_directory_cid_here';
scrapeIPFSDirectory(ipfsDirectoryCID).then(() => {
    console.log('Scraping completed.');
}).catch((error) => {
    console.error('Error occurred:', error);
});
