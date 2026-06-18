const fs = require('fs');

async function test() {
    try {
        const res = await fetch('https://api.themoviedb.org/3/search/movie?api_key=15d2ea6d0dc1d476efbca3ba5377ceb6&query=Avengers');
        const data = await res.json();
        console.log(`Found: ${data.total_results}`);
        if (data.results && data.results.length > 0) {
            data.results.slice(0,3).forEach(m => {
                console.log(`- ${m.title} (${m.release_date})`);
                console.log(`  Poster: https://image.tmdb.org/t/p/w500${m.poster_path}`);
            });
        }
    } catch(e) {
        console.error(e);
    }
}
test();
