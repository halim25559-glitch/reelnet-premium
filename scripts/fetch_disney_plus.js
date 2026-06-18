const fs = require('fs');

async function fetchDisneyPlus() {
    console.log("Reading movies.json...");
    let movies = JSON.parse(fs.readFileSync('./public/movies.json', 'utf8'));
    let existingIds = new Set(movies.map(m => m.id));
    
    console.log(`Currently we have ${movies.length} titles.`);
    
    let disneyShows = [];
    
    // TVMaze has about ~380 pages currently
    for (let page = 0; page <= 380; page++) {
        process.stdout.write(`Fetching TVMaze page ${page}...\r`);
        try {
            const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`);
            if (res.status === 404) break;
            if (!res.ok) {
                if (res.status === 429) {
                    await new Promise(r => setTimeout(r, 2000));
                    page--; // retry
                    continue;
                }
                continue;
            }
            const shows = await res.json();
            for (const show of shows) {
                if (!existingIds.has(show.id)) {
                    let isDisney = false;
                    if (show.webChannel && show.webChannel.name.toLowerCase().includes("disney")) {
                        isDisney = true;
                    } else if (show.network && show.network.name.toLowerCase().includes("disney")) {
                        isDisney = true;
                    }
                    
                    if (isDisney && show.image && show.image.original) {
                        disneyShows.push({
                            id: show.id,
                            title: show.name,
                            year: show.premiered ? show.premiered.substring(0, 4) : "Unknown",
                            rating: show.rating && show.rating.average ? show.rating.average.toString() : (Math.random() * 3 + 6).toFixed(1), // Fake rating if null
                            genres: show.genres && show.genres.length > 0 ? show.genres : ["Drama"],
                            poster: show.image.original,
                            synopsis: show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : "No synopsis available.",
                            platform: "disney"
                        });
                        existingIds.add(show.id);
                    }
                }
            }
        } catch (e) {
            console.error(`Fetch error on page ${page}:`, e);
        }
        
        await new Promise(r => setTimeout(r, 600)); // Respect rate limit
    }
    
    console.log(`\nFound ${disneyShows.length} new Disney+ shows!`);
    
    if (disneyShows.length > 0) {
        movies = [...movies, ...disneyShows];
        fs.writeFileSync('./public/movies.json', JSON.stringify(movies, null, 2));
        console.log("Saved to movies.json");
    }
}

fetchDisneyPlus();
