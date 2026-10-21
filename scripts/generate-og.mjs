// Render the repository-native vector design to a widely supported social card format.
import sharp from 'sharp';
await sharp('public/og.svg').png().toFile('public/og.png');
console.log('Generated 1200 × 630 Open Graph PNG');
