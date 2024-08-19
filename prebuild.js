const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to remove directory if it exists
function removeDirIfExists(dir) {
    if (fs.existsSync(dir)) {
        console.log(`Removing ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// Function to copy directory recursively
function copyDir(src, dest) {
    const srcPath = path.resolve(src);
    const destPath = path.resolve(dest);

    // Ensure the destination directory exists
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }

    // Read all items in the source directory
    const items = fs.readdirSync(srcPath);

    items.forEach(item => {
        const srcItemPath = path.join(srcPath, item);
        const destItemPath = path.join(destPath, item);

        // Check if item is a directory or file
        if (fs.lstatSync(srcItemPath).isDirectory()) {
            // Recursively copy directory
            copyDir(srcItemPath, destItemPath);
        } else {
            // Copy file
            fs.copyFileSync(srcItemPath, destItemPath);
        }
    });
}

// Remove build and www directories if they exist
removeDirIfExists('build');
removeDirIfExists('www');

// Run the build command
console.log('Starting build process...');
execSync('react-scripts build', { stdio: 'ignore' });

// Create www directory
console.log('Creating www folder...');
fs.mkdirSync('www');

// Copy build contents to www
console.log('Copying build to www...');
copyDir('build', 'www');

// Remove build directory
console.log('Removing build folder...');
removeDirIfExists('build');

console.log('Build process completed.');
