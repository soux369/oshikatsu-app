const { Jimp } = require('jimp');

async function fix() {
    try {
        console.log('Reading icon...');
        const image = await Jimp.read('./assets/icon.png');

        console.log('Image methods:', Object.keys(image)); // Inspect

        console.log('Writing icon to PNG...');
        if (image.writeAsync) {
            await image.writeAsync('./assets/icon.png');
        } else if (image.write) {
            // Promisify write
            await new Promise((resolve, reject) => {
                image.write('./assets/icon.png', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } else {
            throw new Error('No write method found on image object');
        }

        console.log('Reading adaptive-icon...');
        const adaptive = await Jimp.read('./assets/adaptive-icon.png');
        console.log('Writing adaptive-icon to PNG...');
        if (adaptive.writeAsync) {
            await adaptive.writeAsync('./assets/adaptive-icon.png');
        } else {
            await new Promise((resolve, reject) => {
                adaptive.write('./assets/adaptive-icon.png', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        console.log('Successfully converted images to PNG.');
    } catch (error) {
        console.error('Error converting images:', error);
        process.exit(1);
    }
}

fix();
