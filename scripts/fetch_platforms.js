const fs = require('fs');

async function fetchPlatforms() {
    console.log("Reading movies.json...");
    let movies = JSON.parse(fs.readFileSync('./public/movies.json', 'utf8'));
    console.log(`Loaded ${movies.length} movies.`);
    
    // Build a set of needed IDs
    const neededIds = new Set(movies.map(m => m.id));
    const maxId = Math.max(...Array.from(neededIds));
    const maxPage = Math.ceil(maxId / 250);
    
    console.log(`Max ID: ${maxId}, need to fetch up to page ${maxPage}.`);
    
    const platformMap = {};
    
    for (let page = 0; page <= maxPage; page++) {
        console.log(`Fetching TVMaze page ${page}...`);
        try {
            const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`);
            if (res.status === 404) break;
            if (!res.ok) {
                if (res.status === 429) {
                    console.log("Rate limited. Waiting 2 seconds...");
                    await new Promise(r => setTimeout(r, 2000));
                    page--; // retry
                    continue;
                }
                console.error(`Error fetching page ${page}: ${res.statusText}`);
                continue;
            }
            const shows = await res.json();
            for (const show of shows) {
                if (neededIds.has(show.id)) {
                    let platform = "netflix"; // default
                    if (show.webChannel) {
                        const channel = show.webChannel.name.toLowerCase();
                        if (channel.includes("netflix")) platform = "netflix";
                        else if (channel.includes("hbo") || channel.includes("max")) platform = "hbo";
                        else if (channel.includes("disney")) platform = "disney";
                        else if (channel.includes("amazon") || channel.includes("prime")) platform = "prime";
                        else if (channel.includes("apple")) platform = "apple";
                        else platform = "other";
                    } else if (show.network) {
                        const network = show.network.name.toLowerCase();
                        if (network.includes("hbo")) platform = "hbo";
                        else if (network.includes("disney")) platform = "disney";
                        else platform = "other";
                    }
                    platformMap[show.id] = platform;
                }
            }
        } catch (e) {
            console.error(`Fetch error on page ${page}:`, e);
        }
        
        // Wait 0.5s to respect TVMaze rate limits (20 requests / 10 seconds = 2 req/sec)
        await new Promise(r => setTimeout(r, 600));
    }
    
    let updatedCount = 0;
    for (let m of movies) {
        if (platformMap[m.id]) {
            m.platform = platformMap[m.id];
            updatedCount++;
        } else {
            m.platform = "netflix"; // Fallback
        }
    }
    
    fs.writeFileSync('./public/movies.json', JSON.stringify(movies, null, 2));
    console.log(`Finished! Updated ${updatedCount} movies with real platform data.`);
}

fetchPlatforms();
