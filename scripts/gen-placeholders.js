const sharp = require('sharp');

async function createPlaceholder(filename, emoji, line1, line2, r, g, b) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="rgb(${r},${g},${b})"/>
    <rect x="20" y="20" width="472" height="472" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" rx="16"/>
    <text x="256" y="220" text-anchor="middle" font-size="120" fill="white">${emoji}</text>
    <text x="256" y="320" text-anchor="middle" font-size="32" fill="white" font-weight="bold">${line1}</text>
    <text x="256" y="370" text-anchor="middle" font-size="26" fill="rgba(255,255,255,0.8)">${line2}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(filename);
  console.log('Created:', filename);
}

Promise.all([
  createPlaceholder('public/memes/meme07.jpg', '😏', 'Smug Reaction', 'Satisfied vibes', 20, 60, 20),
  createPlaceholder('public/memes/meme08.jpg', '😬', 'Awkward Reaction', 'This is uncomfortable', 60, 20, 60)
]).then(() => console.log('All done!')).catch(e => { console.error(e); process.exit(1); });
