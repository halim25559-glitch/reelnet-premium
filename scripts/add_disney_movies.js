const fs = require('fs');

const moviesList = [
    { title: "Avengers: Endgame", year: "2019", rating: "8.4", genres: ["Action", "Sci-Fi", "Drama"], synopsis: "After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos' actions." },
    { title: "Avengers: Infinity War", year: "2018", rating: "8.4", genres: ["Action", "Sci-Fi", "Adventure"], synopsis: "The Avengers and their allies must be willing to sacrifice all in an attempt to defeat the powerful Thanos." },
    { title: "The Lion King", year: "1994", rating: "8.5", genres: ["Animation", "Family", "Drama"], synopsis: "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself." },
    { title: "Frozen", year: "2013", rating: "7.4", genres: ["Animation", "Family", "Fantasy"], synopsis: "When the newly-crowned Queen Elsa accidentally uses her power to turn things into ice to curse her home in infinite winter, her sister Anna teams up with a mountain man, his playful reindeer, and a snowman to change the weather condition." },
    { title: "Frozen II", year: "2019", rating: "6.8", genres: ["Animation", "Family", "Adventure"], synopsis: "Anna, Elsa, Kristoff, Olaf and Sven leave Arendelle to travel to an ancient, autumn-bound forest of an enchanted land." },
    { title: "Toy Story", year: "1995", rating: "8.3", genres: ["Animation", "Family", "Comedy"], synopsis: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room." },
    { title: "Toy Story 3", year: "2010", rating: "8.2", genres: ["Animation", "Family", "Comedy"], synopsis: "The toys are mistakenly delivered to a day-care center instead of the attic right before Andy leaves for college." },
    { title: "Star Wars: Episode IV - A New Hope", year: "1977", rating: "8.6", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee and two droids to save the galaxy from the Empire." },
    { title: "Star Wars: Episode V - The Empire Strikes Back", year: "1980", rating: "8.7", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "After the Rebels are brutally overpowered by the Empire on the ice planet Hoth, Luke Skywalker begins Jedi training with Yoda." },
    { title: "Avatar", year: "2009", rating: "7.9", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home." },
    { title: "Moana", year: "2016", rating: "7.6", genres: ["Animation", "Family", "Adventure"], synopsis: "In Ancient Polynesia, when a terrible curse incurred by the Demigod Maui reaches Moana's island, she answers the Ocean's call to seek out the Demigod to set things right." },
    { title: "Zootopia", year: "2016", rating: "8.0", genres: ["Animation", "Family", "Comedy"], synopsis: "In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together to uncover a conspiracy." },
    { title: "Black Panther", year: "2018", rating: "7.3", genres: ["Action", "Sci-Fi", "Adventure"], synopsis: "T'Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward to lead his people into a new future." },
    { title: "Iron Man", year: "2008", rating: "7.9", genres: ["Action", "Sci-Fi", "Adventure"], synopsis: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil." },
    { title: "Thor: Ragnarok", year: "2017", rating: "7.9", genres: ["Action", "Sci-Fi", "Comedy"], synopsis: "Imprisoned on the planet Sakaar, Thor must race against time to return to Asgard and stop Ragnarök." },
    { title: "Guardians of the Galaxy", year: "2014", rating: "8.0", genres: ["Action", "Sci-Fi", "Comedy"], synopsis: "A group of intergalactic criminals must pull together to stop a fanatical warrior with plans to purge the universe." },
    { title: "Up", year: "2009", rating: "8.3", genres: ["Animation", "Family", "Adventure"], synopsis: "78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons, inadvertently taking a young stowaway." },
    { title: "Finding Nemo", year: "2003", rating: "8.2", genres: ["Animation", "Family", "Adventure"], synopsis: "After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish sets out on a journey to bring him home." },
    { title: "Inside Out", year: "2015", rating: "8.1", genres: ["Animation", "Family", "Comedy"], synopsis: "After young Riley is uprooted from her Midwest life and moved to San Francisco, her emotions - Joy, Fear, Anger, Disgust and Sadness - conflict on how best to navigate a new city, house, and school." },
    { title: "Coco", year: "2017", rating: "8.4", genres: ["Animation", "Family", "Music"], synopsis: "Aspiring musician Miguel, confronted with his family's ancestral ban on music, enters the Land of the Dead to find his great-great-grandfather, a legendary singer." },
    { title: "Monsters, Inc.", year: "2001", rating: "8.1", genres: ["Animation", "Family", "Comedy"], synopsis: "In order to power the city, monsters have to scare children so that they scream. However, the children are toxic to the monsters, and after a child gets through, 2 monsters realize things may not be what they think." },
    { title: "The Incredibles", year: "2004", rating: "8.0", genres: ["Animation", "Family", "Action"], synopsis: "A family of undercover superheroes, while trying to live the quiet suburban life, are forced into action to save the world." },
    { title: "WALL·E", year: "2008", rating: "8.4", genres: ["Animation", "Family", "Sci-Fi"], synopsis: "In the distant future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind." },
    { title: "Ratatouille", year: "2007", rating: "8.1", genres: ["Animation", "Family", "Comedy"], synopsis: "A rat who can cook makes an unusual alliance with a young kitchen worker at a famous Paris restaurant." },
    { title: "Aladdin", year: "1992", rating: "8.0", genres: ["Animation", "Family", "Romance"], synopsis: "A kindhearted street urchin and a power-hungry Grand Vizier vie for a magic lamp that has the power to make their deepest wishes come true." },
    { title: "Beauty and the Beast", year: "1991", rating: "8.0", genres: ["Animation", "Family", "Romance"], synopsis: "A prince cursed to spend his days as a hideous monster sets out to regain his humanity by earning a young woman's love." },
    { title: "The Little Mermaid", year: "1989", rating: "7.6", genres: ["Animation", "Family", "Fantasy"], synopsis: "A mermaid princess makes a Faustian bargain in an attempt to become human and win a prince's love." },
    { title: "Mulan", year: "1998", rating: "7.6", genres: ["Animation", "Family", "Adventure"], synopsis: "To save her father from death in the army, a young maiden secretly goes in his place and becomes one of China's greatest heroines in the process." },
    { title: "Pirates of the Caribbean: The Curse of the Black Pearl", year: "2003", rating: "8.1", genres: ["Action", "Adventure", "Fantasy"], synopsis: "Blacksmith Will Turner teams up with eccentric pirate \"Captain\" Jack Sparrow to save his love, the governor's daughter, from Jack's former pirate allies, who are now undead." },
    { title: "Encanto", year: "2021", rating: "7.2", genres: ["Animation", "Family", "Fantasy"], synopsis: "A Colombian teenage girl has to face the frustration of being the only member of her family without magical powers." },
    { title: "Big Hero 6", year: "2014", rating: "7.8", genres: ["Animation", "Family", "Action"], synopsis: "A special bond develops between plus-sized inflatable robot Baymax and prodigy Hiro Hamada, who together team up with a group of friends to form a band of high-tech heroes." },
    { title: "Wreck-It Ralph", year: "2012", rating: "7.7", genres: ["Animation", "Family", "Comedy"], synopsis: "A video game villain wants to be a hero and sets out to fulfill his dream, but his quest brings havoc to the whole arcade where he lives." },
    { title: "Tangled", year: "2010", rating: "7.7", genres: ["Animation", "Family", "Comedy"], synopsis: "The magically long-haired Rapunzel has spent her entire life in a tower, but now that a runaway thief has stumbled upon her, she is about to discover the world for the first time, and who she really is." },
    { title: "Hercules", year: "1997", rating: "7.3", genres: ["Animation", "Family", "Adventure"], synopsis: "The son of Zeus and Hera is stripped of his immortality as an infant and must become a true hero in order to reclaim it." },
    { title: "Tarzan", year: "1999", rating: "7.3", genres: ["Animation", "Family", "Adventure"], synopsis: "A man raised by gorillas must decide where he really belongs when he discovers he is a human." },
    { title: "Lilo & Stitch", year: "2002", rating: "7.3", genres: ["Animation", "Family", "Comedy"], synopsis: "A Hawaiian girl adopts an unusual pet who is actually a notorious extra-terrestrial fugitive." },
    { title: "Cars", year: "2006", rating: "7.2", genres: ["Animation", "Family", "Comedy"], synopsis: "A hot-shot race-car named Lightning McQueen gets waylaid in Radiator Springs, where he finds the true meaning of friendship and family." },
    { title: "Alice in Wonderland", year: "1951", rating: "7.4", genres: ["Animation", "Family", "Fantasy"], synopsis: "Alice stumbles into the world of Wonderland. Will she get home? Not if the Queen of Hearts has her way." },
    { title: "The Nightmare Before Christmas", year: "1993", rating: "7.9", genres: ["Animation", "Family", "Fantasy"], synopsis: "Jack Skellington, king of Halloween Town, discovers Christmas Town, but his attempts to bring Christmas to his home causes confusion." },
    { title: "Soul", year: "2020", rating: "8.0", genres: ["Animation", "Family", "Comedy"], synopsis: "After landing the gig of a lifetime, a New York jazz pianist suddenly finds himself trapped in a strange land between Earth and the afterlife." },
    { title: "Luca", year: "2021", rating: "7.4", genres: ["Animation", "Family", "Comedy"], synopsis: "On the Italian Riviera, an unlikely but strong friendship grows between a human being and a sea monster disguised as a human." },
    { title: "Turning Red", year: "2022", rating: "7.0", genres: ["Animation", "Family", "Comedy"], synopsis: "A 13-year-old girl named Meilin turns into a giant red panda whenever she gets too excited." },
    { title: "Doctor Strange", year: "2016", rating: "7.5", genres: ["Action", "Sci-Fi", "Fantasy"], synopsis: "While on a journey of physical and spiritual healing, a brilliant neurosurgeon is drawn into the world of the mystic arts." },
    { title: "Ant-Man", year: "2015", rating: "7.3", genres: ["Action", "Sci-Fi", "Comedy"], synopsis: "Armed with a super-suit with the astonishing ability to shrink in scale but increase in strength, cat burglar Scott Lang must embrace his inner hero and help his mentor, Dr. Hank Pym, pull off a heist that will save the world." },
    { title: "Captain America: Civil War", year: "2016", rating: "7.8", genres: ["Action", "Sci-Fi", "Drama"], synopsis: "Political involvement in the Avengers' affairs causes a rift between Captain America and Iron Man." },
    { title: "Star Wars: Episode I - The Phantom Menace", year: "1999", rating: "6.5", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "Two Jedi escape a hostile blockade to find allies and come across a young boy who may bring balance to the Force." },
    { title: "Star Wars: Episode III - Revenge of the Sith", year: "2005", rating: "7.6", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "Three years into the Clone Wars, the Jedi rescue Palpatine from Count Dooku. As Obi-Wan pursues a new threat, Anakin acts as a double agent between the Jedi Council and Palpatine." },
    { title: "Rogue One: A Star Wars Story", year: "2016", rating: "7.8", genres: ["Sci-Fi", "Action", "Adventure"], synopsis: "The daughter of an Imperial scientist joins the Rebel Alliance in a risky move to steal the plans for the Death Star." },
    { title: "Brave", year: "2012", rating: "7.1", genres: ["Animation", "Family", "Adventure"], synopsis: "Determined to make her own path in life, Princess Merida defies a custom that brings chaos to her kingdom." },
    { title: "A Bug's Life", year: "1998", rating: "7.2", genres: ["Animation", "Family", "Comedy"], synopsis: "A misfit ant, looking for \"warriors\" to save his colony from greedy grasshoppers, recruits a group of bugs that turn out to be an inept circus troupe." }
];

async function addMovies() {
    let movies = JSON.parse(fs.readFileSync('./public/movies.json', 'utf8'));
    let maxId = Math.max(...movies.map(m => m.id)) + 1;
    let addedCount = 0;
    
    moviesList.forEach(m => {
        // Create stylized placeholder URL
        const titleLines = m.title.replace(/:/g, '\\n').replace(/ /g, '+');
        const posterUrl = `https://placehold.co/600x900/1f80e0/ffffff?text=${titleLines}&font=Montserrat`;
        
        // Only add if not already present
        if (!movies.find(x => x.title === m.title)) {
            movies.push({
                id: maxId++,
                title: m.title,
                year: m.year,
                rating: m.rating,
                genres: m.genres,
                poster: posterUrl,
                synopsis: m.synopsis,
                platform: "disney"
            });
            addedCount++;
        }
    });
    
    fs.writeFileSync('./public/movies.json', JSON.stringify(movies, null, 2));
    console.log(`Successfully added ${addedCount} top Disney+ movies!`);
}

addMovies();
