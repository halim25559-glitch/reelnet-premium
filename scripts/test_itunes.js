const fs = require('fs');

async function test() {
    try {
        const res = await fetch('https://itunes.apple.com/search?term=avengers&entity=movie&limit=10');
        const data = await res.json();
        console.log(`Found: ${data.resultCount}`);
        if (data.results && data.results.length > 0) {
            data.results.forEach(m => {
                console.log(`- ${m.trackName} (${m.releaseDate ? m.releaseDate.substring(0,4) : '?'})`);
                console.log(`  Poster: ${m.artworkUrl100.replace('100x100bb', '600x900bb')}`);
            });
        }
    } catch(e) {
        console.error(e);
    }
}
test();
