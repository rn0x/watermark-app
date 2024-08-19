/**
 * Utility functions for handling file and directory operations using cordova-plugin-file.
 * @module FileUtils
 */

/**
 * Checks if the Cordova file plugin is installed.
 * @throws Will throw an error if the file plugin is not installed.
 */
function checkFilePluginInstalled() {
    if (!window.cordova || !window.cordova.file) {
        throw new Error("Cordova-plugin-file must be installed and activated.");
    }
}

/**
 * Resolves the file system URL and returns a file or directory entry.
 * @param {string} path - The full path of the file or directory.
 * @returns {Promise} - A promise that resolves with the file or directory entry.
 * @private
 */
export function resolveFileSystemURL(path) {
    checkFilePluginInstalled();
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(path, resolve, reject);
    });
}

/**
 * Creates a directory at a specific path.
 * @param {string} dirPath - The full path of the directory.
 * @returns {Promise} - A promise that resolves when the directory is created.
 */
export function createDirectory(dirPath) {
    checkFilePluginInstalled();
    return resolveFileSystemURL(dirPath)
        .catch(() => {
            return new Promise((resolve, reject) => {
                window.resolveLocalFileSystemURL(dirPath.substring(0, dirPath.lastIndexOf('/')), parentDirEntry => {
                    parentDirEntry.getDirectory(dirPath.substring(dirPath.lastIndexOf('/') + 1), { create: true, exclusive: false }, resolve, reject);
                }, reject);
            });
        });
}

/**
 * Ensures that a directory exists, creating it if necessary.
 * @param {string} dirPath - The full path of the directory to check or create.
 * @returns {Promise} - A promise that resolves when the directory exists or has been created.
 */
export function ensureDirectory(dirPath) {
    checkFilePluginInstalled();
    const pathParts = dirPath.split('/');
    let currentPath = '';

    return pathParts.reduce((promise, part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        return promise.then(() => createDirectory(currentPath));
    }, Promise.resolve());
}

/**
 * Gets the file entry for a given path.
 * @param {string} filePath - The full path of the file.
 * @returns {Promise} - A promise that resolves with the file entry.
 */
export function getFileEntry(filePath) {
    checkFilePluginInstalled();
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
    return ensureDirectory(directoryPath).then(() =>
        resolveFileSystemURL(directoryPath)
            .then(dirEntry => new Promise((resolve, reject) => {
                dirEntry.getFile(filePath.substring(filePath.lastIndexOf('/') + 1), { create: true, exclusive: false }, resolve, reject);
            }))
    );
}

/**
 * Writes data to a file at a specific path.
 * @param {string} filePath - The full path of the file.
 * @param {string|Blob} data - The data to write to the file.
 * @returns {Promise} - A promise that resolves when the write operation is complete.
 */
export function writeFile(filePath, data) {
    checkFilePluginInstalled();
    return getFileEntry(filePath).then(fileEntry => {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter(fileWriter => {
                fileWriter.onwriteend = () => resolve();
                fileWriter.onerror = () => reject(fileWriter.error);
                fileWriter.write(data);
            }, reject);
        });
    });
}

/**
 * Reads data from a file at a specific path.
 * @param {string} filePath - The full path of the file.
 * @returns {Promise<string>} - A promise that resolves with the file content.
 */
export function readFile(filePath) {
    return getFileEntry(filePath).then(fileEntry => {
        return new Promise((resolve, reject) => {
            fileEntry.file(file => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(this.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            }, reject);
        });
    });
}

/**
 * Checks if a file exists at a specific path.
 * @param {string} filePath - The full path of the file to check.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating whether the file exists.
 */
export function fileExists(filePath) {
    return getFileEntry(filePath).then(() => true).catch(() => false);
}


/**
 * Saves an image to the first available directory.
 * @param {string} fileName - The name of the file to save.
 * @param {Blob} data - The image data to save.
 * @returns {Promise<string|null>} - The path to the saved file, or null if saving failed.
 */
export async function saveImage(fileName, data) {
    checkFilePluginInstalled(); // Ensure the file plugin is installed

    // Define the list of potential directories to save the image
    const directories = [
        `${window.cordova.file.externalRootDirectory}DCIM/`,
        `${window.cordova.file.externalRootDirectory}Download/`,
        `${window.cordova.file.externalRootDirectory}Pictures/`,
        `${window.cordova.file.dataDirectory}`,
        `${window.cordova.file.externalDataDirectory}`
    ];

    // Attempt to save the image to each directory one by one
    for (const dirPath of directories) {
        const filePath = `${dirPath}${fileName}`; // Construct the full file path
        try {
            await writeFile(filePath, data); // Attempt to write the image to the file
            return filePath; // Return the file path upon successful save
        } catch (error) {
            // Log the error and proceed to the next directory
            console.error(`Failed to save image to ${filePath}:`, error);
        }
    }

    // Return null if saving to all directories failed
    return null;
}

