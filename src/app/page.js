/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';

// --- Effects ---
function createRipple(e) {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    const rect = btn.getBoundingClientRect();
    circle.style.width = circle.style.height = `${d}px`;
    circle.style.left = `${e.clientX - rect.left - d/2}px`;
    circle.style.top = `${e.clientY - rect.top - d/2}px`;
    circle.classList.add("ripple-circle");
    const old = btn.querySelector(".ripple-circle");
    if (old) old.remove();
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

function emitParticles(x, y, color = "#E50914", count = 14) {
    const container = document.getElementById("particle-container");
    if(!container) return;
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div"); p.className = "particle";
        const angle = (Math.PI * 2 * i) / count; const dist = 40 + Math.random() * 60;
        p.style.left = `${x}px`; p.style.top = `${y}px`; p.style.background = color;
        p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`); p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
        p.style.width = p.style.height = `${3 + Math.random() * 5}px`;
        container.appendChild(p); setTimeout(() => p.remove(), 800);
    }
}

// --- Main App Component ---
export default function ReelNetApp() {
    const [movies, setMovies] = useState([]);
    const [globalVotes, setGlobalVotes] = useState({});
    const [watchlist, setWatchlist] = useState([]);
    const [auth, setAuth] = useState(null);
    const [authTab, setAuthTab] = useState('login'); // 'login' or 'register'
    const [authForm, setAuthForm] = useState({ email: '', password: '', username: '' });
    const [theme, setTheme] = useState('dark');
    
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ msg: '', icon: '', show: false });

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatches, setSearchMatches] = useState([]);
    const [isDropdownActive, setIsDropdownActive] = useState(false);
    
    const [currentCategory, setCurrentCategory] = useState("🏆 Top Ranked");
    const [sortMode, setSortMode] = useState("votes");
    const [filters, setFilters] = useState({ minRating: 0, minYear: 1900, maxYear: 2025 });
    
    const [renderedCount, setRenderedCount] = useState(60);
    const batchSize = 60;
    
    // Modals
    const [activeModal, setActiveModal] = useState(null); // 'movie', 'stats', 'auth', 'filters'
    const [currentMovie, setCurrentMovie] = useState(null);
    const [heroMovie, setHeroMovie] = useState(null);
    const [comments, setComments] = useState([]);
    
    const searchRef = useRef(null);
    const observerTarget = useRef(null);
    const toastTimer = useRef(null);

    // Hoisted Functions
    const showToast = (msg, icon = 'fa-check') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, icon, show: true });
        toastTimer.current = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
    };

    const handleOpenMovie = (m, skipHistory = false) => {
        setCurrentMovie(m);
        setActiveModal('movie');
        if(!skipHistory) window.history.pushState(null, null, `#/movie/${m.id}`);
        fetch(`/api/comments?movieId=${m.id}`).then(r => r.json()).then(data => setComments(data.reverse()));
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        window.history.pushState(null, null, window.location.pathname);
    };

    // Initial Load
    useEffect(() => {
        const localTheme = localStorage.getItem('reelnet_theme');
        if (localTheme) setTheme(localTheme);
        
        const localWatchlist = JSON.parse(localStorage.getItem('reelnet_watchlist') || '[]');
        if (localWatchlist.length > 0) setWatchlist(localWatchlist);
        
        const localAuth = JSON.parse(localStorage.getItem('reelnet_auth') || 'null');
        if (localAuth) setAuth(localAuth);
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log(err));
        }

        Promise.all([
            fetch('/movies.json').then(r => r.json()),
            fetch('/api/votes').then(r => r.json())
        ]).then(([m, v]) => {
            setMovies(m);
            setGlobalVotes(v);
            const candidates = m.filter(x => x.poster && parseFloat(x.rating) >= 8.0);
            if(candidates.length > 0) setHeroMovie(candidates[Math.floor(Math.random() * candidates.length)]);
            setLoading(false);
            showToast(`${m.length} titles loaded`, 'fa-film');
            
            // Check Hash
            const match = window.location.hash.match(/#\/movie\/(.+)/);
            if(match && match[1]) {
                const initMovie = m.find(x => x.id === match[1]);
                if(initMovie) handleOpenMovie(initMovie, true);
            }
        });
        
        const handleHash = () => {
            const match = window.location.hash.match(/#\/movie\/(.+)/);
            if(match && match[1]) {
                const m = movies.find(x => x.id === match[1]);
                if(m) handleOpenMovie(m, true);
            } else {
                setActiveModal(null);
            }
        };
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    // Theme Class Sync
    useEffect(() => {
        document.body.className = theme === 'light' ? 'light-mode' : '';
        if(searchQuery.toLowerCase() === 'stranger') document.body.className += ' stranger-mode';
        if(searchQuery.toLowerCase() === 'squid') document.body.className += ' squid-mode';
    }, [theme, searchQuery]);

    // Derived Data
    const genres = useMemo(() => {
        const s = new Set();
        movies.forEach(m => { if(m.genres) m.genres.forEach(g => s.add(g)) });
        s.delete(""); s.delete(undefined);
        return ["🏆 Top Ranked", "📌 My Watchlist", "All", ...Array.from(s).sort()];
    }, [movies]);

    const filteredMovies = useMemo(() => {
        let arr = movies.filter(m => {
            const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            let matchGenre = true;
            if (currentCategory === "📌 My Watchlist") matchGenre = watchlist.includes(m.id);
            else if (currentCategory !== "All" && currentCategory !== "🏆 Top Ranked") matchGenre = m.genres?.includes(currentCategory);
            
            const r = parseFloat(m.rating) || 0; const y = parseInt(m.year) || 0;
            const matchR = r >= filters.minRating;
            const matchY = (y >= filters.minYear || isNaN(filters.minYear)) && (y <= filters.maxYear || isNaN(filters.maxYear));
            return matchSearch && matchGenre && matchR && matchY;
        });
        arr.sort((a, b) => {
            switch(sortMode) {
                case "votes":
                    const va = globalVotes[a.id]||0, vb = globalVotes[b.id]||0;
                    if(va!==vb) return vb - va; return parseFloat(b.rating) - parseFloat(a.rating);
                case "rating-desc": return parseFloat(b.rating) - parseFloat(a.rating);
                case "rating-asc": return parseFloat(a.rating) - parseFloat(b.rating);
                case "year-desc": return (b.year||"0").localeCompare(a.year||"0");
                case "year-asc": return (a.year||"0").localeCompare(b.year||"0");
                case "name-asc": return a.title.localeCompare(b.title);
                case "name-desc": return b.title.localeCompare(a.title);
                default: return 0;
            }
        });
        return arr;
    }, [movies, searchQuery, currentCategory, sortMode, filters, watchlist, globalVotes]);

    const similarMovies = useMemo(() => {
        if(!currentMovie || !currentMovie.genres) return [];
        return movies.map(m => {
            if(m.id === currentMovie.id || !m.genres) return { m, score: -1 };
            let overlap = 0; currentMovie.genres.forEach(g => { if(m.genres.includes(g)) overlap++ });
            return { m, score: overlap + (parseFloat(m.rating)/10) };
        }).sort((a,b) => b.score - a.score).slice(0,8).map(s => s.m);
    }, [currentMovie, movies]);

    // Parallax Effect
    useEffect(() => {
        const handleScroll = () => {
            const heroBg = document.querySelector('.hero-bg');
            if(heroBg) heroBg.style.backgroundPositionY = `${window.scrollY * 0.4}px`;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if(loading) return;
        const observer = new IntersectionObserver((entries) => {
            if(entries[0].isIntersecting && renderedCount < filteredMovies.length) {
                setRenderedCount(prev => prev + batchSize);
            }
        }, { rootMargin: '200px' });
        if(observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [loading, renderedCount, filteredMovies.length]);

    // Reset Rendered Count on filter change
    useEffect(() => {
        // eslint-disable-next-line
        setRenderedCount(batchSize); 
    }, [searchQuery, currentCategory, sortMode, filters]);

    // Handlers
    const handleSearch = (val) => {
        setSearchQuery(val);
        const lower = val.toLowerCase();
        if(lower === 'stranger') showToast("Welcome to the Upside Down", "fa-spider");
        if(lower === 'squid') showToast("Red Light, Green Light", "fa-shapes");
        
        if(val.length > 1) {
            const matches = movies.filter(m => m.title.toLowerCase().includes(lower)).slice(0,6);
            setSearchMatches(matches);
            setIsDropdownActive(matches.length > 0);
        } else {
            setIsDropdownActive(false);
        }
    };

    const toggleWatchlist = (id) => {
        let newW = [...watchlist];
        if(newW.includes(id)) { newW = newW.filter(x => x!==id); showToast("Removed from Watchlist", "fa-bookmark"); }
        else { newW.push(id); showToast("Added to Watchlist!", "fa-bookmark"); }
        setWatchlist(newW);
        localStorage.setItem('reelnet_watchlist', JSON.stringify(newW));
    };

    const submitVote = async (id, e) => {
        if(e) {
            createRipple(e);
            const rect = e.currentTarget.getBoundingClientRect();
            emitParticles(rect.left + rect.width/2, rect.top + rect.height/2, "#E50914", 18);
        }
        try {
            const res = await fetch('/api/vote', { method:'POST', body:JSON.stringify({id})});
            const data = await res.json();
            if(data.success) {
                setGlobalVotes(prev => ({...prev, [id]: data.newVotes}));
                showToast("Voted!", "fa-heart");
            }
        } catch(e) { showToast("Vote failed", "fa-triangle-exclamation"); }
    };

    const submitComment = async () => {
        const input = document.getElementById('comment-text');
        if(!input.value.trim() || !currentMovie) return;
        try {
            const username = auth ? auth.username : 'Guest';
            const avatar = auth ? auth.avatar : 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
            const res = await fetch('/api/comment', { method:'POST', body:JSON.stringify({ movieId: currentMovie.id, username, avatar, text: input.value.trim() })});
            const data = await res.json();
            if(data.success) {
                setComments([data.comment, ...comments]);
                input.value = '';
                showToast("Review posted!", "fa-comment");
                const b = document.getElementById('comment-submit');
                if(b) { const r = b.getBoundingClientRect(); emitParticles(r.left+r.width/2, r.top+r.height/2, "#46d369", 10); }
            }
        } catch(e) {}
    };

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        if(!authForm.email || !authForm.password) { showToast("Please fill all fields", "fa-triangle-exclamation"); return; }
        
        const username = authTab === 'register' && authForm.username ? authForm.username : authForm.email.split('@')[0];
        const newAuth = { username, avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' };
        
        setAuth(newAuth);
        localStorage.setItem('reelnet_auth', JSON.stringify(newAuth));
        setActiveModal(null);
        showToast(authTab === 'login' ? `Welcome back, ${username}!` : "Account created successfully!", "fa-user-check");
    };

    const handleLogout = () => {
        setAuth(null);
        localStorage.removeItem('reelnet_auth');
        setActiveModal(null);
        showToast("Logged out", "fa-right-from-bracket");
    };

    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const cx = rect.width / 2; const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -12;
        const rotateY = ((x - cx) / cx) * 12;
        card.style.setProperty('--rx', `${rotateX}deg`);
        card.style.setProperty('--ry', `${rotateY}deg`);
    };
    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
    };

    const handleKeyDown = (e) => {
        const current = document.activeElement;
        if (!current || !current.classList.contains('movie-card')) return;
        const cards = Array.from(document.querySelectorAll('.movie-card'));
        const index = cards.indexOf(current);
        if (index === -1) return;
        const gridStyle = window.getComputedStyle(document.getElementById('movie-grid'));
        const cols = gridStyle.gridTemplateColumns.split(' ').length;
        let t = null;
        if(e.key==='ArrowRight') t = index+1; if(e.key==='ArrowLeft') t = index-1;
        if(e.key==='ArrowDown') t = index+cols; if(e.key==='ArrowUp') t = index-cols;
        if(e.key==='Enter') { e.preventDefault(); current.click(); }
        if(t!==null && t>=0 && t<cards.length) { e.preventDefault(); cards[t].focus(); }
    };

    return (
        <>
            <div id="toast" className={`toast ${toast.show ? 'show' : ''}`}><i className={`fa-solid ${toast.icon}`} style={{marginRight:'8px'}}></i>{toast.msg}</div>

            <nav className="topbar">
                <div className="logo" onClick={() => { setCurrentCategory("🏆 Top Ranked"); setSearchQuery(""); }}>
                    <div style={{width: '38px', height: '38px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(229,9,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <img src="/logo.png" alt="ReelNet Logo" style={{width: '125%', height: '125%', objectFit: 'cover'}} />
                    </div>
                    <span>Reel<span className="accent">Net</span></span>
                </div>
                
                <div className="search-container" ref={searchRef}>
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search-input" placeholder="Search 2,500+ titles..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => searchQuery.length>1 && setIsDropdownActive(true)} />
                    {searchQuery && <span className="search-clear visible" onClick={() => handleSearch("")}><i className="fa-solid fa-xmark"></i></span>}
                    
                    <div className={`search-dropdown ${isDropdownActive ? 'active' : ''}`}>
                        {searchMatches.map(m => (
                            <div key={m.id} className="search-item" onClick={() => { setIsDropdownActive(false); handleSearch(m.title); handleOpenMovie(m); }}>
                                <img src={m.poster || 'https://placehold.co/40x60/0a0a0f/E50914?text=N'} alt="Mini Poster"/>
                                <div className="search-item-info">
                                    <span className="search-item-title">{m.title}</span>
                                    <span className="search-item-meta">{m.year} • ⭐ {m.rating}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="topbar-actions">
                    <button className={`topbar-btn ripple-btn ${activeModal==='filters'?'active':''}`} onClick={(e) => {createRipple(e); setActiveModal(activeModal==='filters'?null:'filters')}}><i className="fa-solid fa-sliders"></i></button>
                    <button className="topbar-btn shuffle-btn ripple-btn" title="Random Movie" onClick={(e) => {createRipple(e); const m = movies[Math.floor(Math.random()*movies.length)]; if(m) handleOpenMovie(m); }}><i className="fa-solid fa-shuffle"></i></button>
                    <button className="topbar-btn ripple-btn" onClick={(e) => {createRipple(e); setActiveModal('stats');}}><i className="fa-solid fa-chart-bar"></i></button>
                    <button className="topbar-btn ripple-btn" onClick={(e) => {
                        createRipple(e); 
                        const isLight = theme === 'light'; setTheme(isLight ? 'dark' : 'light'); localStorage.setItem('reelnet_theme', isLight?'dark':'light');
                        const r = e.currentTarget.getBoundingClientRect(); emitParticles(r.left+r.width/2, r.top+r.height/2, isLight?"#f5c518":"#6366f1", 12);
                    }}>
                        {theme === 'light' ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun"></i>}
                    </button>
                    {auth ? (
                        <div className="user-profile" onClick={() => setActiveModal('profile')}>
                            <img src={auth.avatar} alt="Profile" />
                        </div>
                    ) : (
                        <button className="signin-btn ripple-btn" onClick={(e) => {createRipple(e); setActiveModal('auth')}}>Sign In</button>
                    )}
                </div>
            </nav>

            {/* Filter Panel */}
            <div className={`filter-panel ${activeModal==='filters'?'active':''}`}>
                <div className="filter-header">
                    <h3><i className="fa-solid fa-sliders"></i> Advanced Filters</h3>
                    <button className="close-btn ripple-btn" onClick={() => setActiveModal(null)}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="filter-body">
                    <div className="filter-group">
                        <label>Minimum Rating</label>
                        <div className="range-wrapper">
                            <input type="range" min="0" max="10" step="0.5" value={filters.minRating} onChange={e => setFilters({...filters, minRating: parseFloat(e.target.value)})} />
                            <span className="filter-val">⭐ {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}</span>
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Release Year Range</label>
                        <div className="multi-input-row">
                            <input type="number" placeholder="2010" value={filters.minYear} onChange={e => setFilters({...filters, minYear: parseInt(e.target.value)||1900})} />
                            <span>to</span>
                            <input type="number" placeholder="2024" value={filters.maxYear} onChange={e => setFilters({...filters, maxYear: parseInt(e.target.value)||2025})} />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button className="primary-btn ripple-btn" onClick={(e) => {createRipple(e); setActiveModal(null); showToast("Filters applied", "fa-sliders")}}>Apply</button>
                        <button className="secondary-btn ripple-btn" onClick={(e) => {createRipple(e); setFilters({minRating:0, minYear:1900, maxYear:2025})}}>Reset</button>
                    </div>
                </div>
            </div>

            <div className="dashboard-layout">
                <aside className="sidebar desktop-only">
                    <h3 className="sidebar-title"><i className="fa-solid fa-layer-group"></i> Categories</h3>
                    <ul className="genre-list">
                        {genres.map(g => (
                            <li key={g}>
                                <button className={`genre-btn ripple-btn ${currentCategory===g?'active':''}`} style={g==="🏆 Top Ranked"?{color:'var(--gold)',fontWeight:'800'}:g==="📌 My Watchlist"?{color:'var(--green)',fontWeight:'700',marginBottom:'10px'}:{}} onClick={(e)=>{createRipple(e); setCurrentCategory(g); if(g==="🏆 Top Ranked") setSortMode("votes");}}>
                                    {g}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <main className="main-content">
                    {heroMovie && (
                        <section className="hero-banner">
                            <div className="hero-bg" style={{backgroundImage: `url(${heroMovie.poster})`}}></div>
                            <div className="hero-overlay">
                                <span className="hero-badge"><i className="fa-solid fa-fire"></i> Featured Pick</span>
                                <h1>{heroMovie.title}</h1>
                                <p className="hero-desc">{heroMovie.synopsis}</p>
                                <div className="hero-meta">
                                    <span className="hero-year">{heroMovie.year}</span>
                                    <span className="hero-rating"><i className="fa-solid fa-star"></i> {heroMovie.rating}</span>
                                </div>
                                <div className="hero-actions">
                                    <button className="play-btn ripple-btn" onClick={(e)=>{createRipple(e); window.open(`https://www.netflix.com/search?q=${encodeURIComponent(heroMovie.title)}`, "_blank")}}><i className="fa-solid fa-play"></i> Watch on Netflix</button>
                                    <button className="vote-btn ripple-btn" onClick={(e)=>submitVote(heroMovie.id, e)}><i className="fa-solid fa-heart"></i> Vote</button>
                                    <button className={`watchlist-btn ripple-btn ${watchlist.includes(heroMovie.id)?'added':''}`} onClick={(e)=>{createRipple(e); toggleWatchlist(heroMovie.id)}}><i className="fa-solid fa-plus"></i> Watchlist</button>
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="content-header">
                        <div className="mobile-category-selector mobile-only">
                            <select value={currentCategory} onChange={(e)=>{setCurrentCategory(e.target.value); if(e.target.value==="🏆 Top Ranked") setSortMode("votes");}}>
                                {genres.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <h2 className="desktop-only">{currentCategory === "All" ? "All Movies & Shows" : currentCategory}</h2>
                        <span className="result-count">{filteredMovies.length} titles</span>
                        <div className="sort-container">
                            <select className="sort-select" value={sortMode} onChange={e=>setSortMode(e.target.value)}>
                                <option value="votes">🔥 Most Voted</option>
                                <option value="rating-desc">⭐ Rating High→Low</option>
                                <option value="rating-asc">⭐ Rating Low→High</option>
                                <option value="year-desc">📅 Newest First</option>
                                <option value="year-asc">📅 Oldest First</option>
                                <option value="name-asc">🔤 Name A→Z</option>
                                <option value="name-desc">🔤 Name Z→A</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="movie-grid">
                            {[...Array(24)].map((_,i) => <div key={i} className="skeleton-card"></div>)}
                        </div>
                    ) : filteredMovies.length === 0 ? (
                        <div className="no-results" style={{display:'block'}}>
                            <i className="fa-solid fa-film"></i><p>No titles found matching your search.</p>
                        </div>
                    ) : (
                        <div className="movie-grid" id="movie-grid" onKeyDown={handleKeyDown}>
                            {filteredMovies.slice(0, renderedCount).map((m, i) => {
                                const votes = globalVotes[m.id] || 0;
                                let rankBadge = null;
                                if(currentCategory==="🏆 Top Ranked" && sortMode==="votes" && i<50) {
                                    const r=i+1; const rc=r===1?'gold':r===2?'silver':r===3?'bronze':'normal';
                                    rankBadge = <div className={`rank-badge ${rc}`}>{r}</div>;
                                }
                                return (
                                    <div key={m.id} className="movie-card" tabIndex="0" onClick={()=>handleOpenMovie(m)} onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                                        {rankBadge}
                                        <div className="n-badge">N</div>
                                        <img src={m.poster || "https://placehold.co/500x750/0a0a0f/E50914?text=N"} alt={`Poster for ${m.title}`}/>
                                        <div className="movie-overlay">
                                            <h4 className="card-title">{m.title}</h4>
                                            <div className="card-meta">
                                                <span>{m.year}</span>
                                                <div className="card-stats">
                                                    <span className="card-vote" style={{color: votes>0?'var(--accent)':''}}><i className="fa-solid fa-heart"></i> {votes}</span>
                                                    <span className="card-rating"><i className="fa-solid fa-star"></i> {m.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <div ref={observerTarget} className="scroll-sentinel"></div>
                </main>
            </div>

            {/* MOVIE MODAL */}
            <div className={`modal-overlay ${activeModal==='movie'?'active':''}`} onClick={(e)=>{if(e.target===e.currentTarget) handleCloseModal()}}>
                <div className="modal-content">
                    <button className="close-btn ripple-btn" onClick={handleCloseModal}><i className="fa-solid fa-xmark"></i></button>
                    {currentMovie && (
                        <div className="modal-body">
                            <div className="modal-top-row">
                                <div className="modal-poster">
                                    <img src={currentMovie.poster || "https://placehold.co/500x750/0a0a0f/E50914?text=N"} alt="Movie Poster"/>
                                    <div className="original-badge">N <span>ORIGINAL</span></div>
                                </div>
                                <div className="modal-info">
                                    <h2>{currentMovie.title}</h2>
                                    <div className="modal-meta">
                                        <span className="meta-badge">{currentMovie.year}</span>
                                    <span className="meta-rating"><i className="fa-solid fa-star"></i> {currentMovie.rating}</span>
                                </div>
                                <div className="modal-genres">
                                    {currentMovie.genres?.map(g => <span key={g} className="genre-tag">{g}</span>)}
                                </div>
                                <div className="modal-synopsis"><p>{currentMovie.synopsis}</p></div>

                                <div className="trailer-section">
                                    <button className="trailer-toggle ripple-btn" onClick={(e)=>{createRipple(e); window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(currentMovie.title+' official trailer')}`, "_blank")}}>
                                        <i className="fa-brands fa-youtube"></i> Watch Trailer
                                    </button>
                                </div>

                                <div className="modal-actions">
                                    <button className="play-btn ripple-btn" onClick={(e)=>{createRipple(e); window.open(`https://www.netflix.com/search?q=${encodeURIComponent(currentMovie.title)}`, "_blank")}}><i className="fa-solid fa-play"></i> Watch</button>
                                    <button className={`vote-btn ripple-btn ${globalVotes[currentMovie.id]?'voted':''}`} onClick={(e)=>submitVote(currentMovie.id, e)}><i className="fa-solid fa-heart"></i> <span>{globalVotes[currentMovie.id]||0}</span></button>
                                    <button className={`watchlist-btn ripple-btn ${watchlist.includes(currentMovie.id)?'added':''}`} onClick={(e)=>{createRipple(e); toggleWatchlist(currentMovie.id)}}>
                                        {watchlist.includes(currentMovie.id) ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus"></i>}
                                    </button>
                                </div>

                                <div className="share-row">
                                    <span className="share-label">Share:</span>
                                    <button className="share-btn ripple-btn" title="Share on Facebook" onClick={(e)=>{createRipple(e); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank")}}><i className="fa-brands fa-facebook-f"></i></button>
                                    <button className="share-btn ripple-btn" title="Share on X (Twitter)" onClick={(e)=>{createRipple(e); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I recommend "${currentMovie.title}" on Netflix! ⭐${currentMovie.rating} #ReelNet \n\n${window.location.href}`)}`, "_blank")}}><i className="fa-brands fa-x-twitter"></i></button>
                                    <button className="share-btn ripple-btn" title="Share on LINE" onClick={(e)=>{createRipple(e); window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`, "_blank")}}><i className="fa-brands fa-line"></i></button>
                                    <button className="share-btn ripple-btn" title="Share on Reddit" onClick={(e)=>{createRipple(e); window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(`Watch ${currentMovie.title} on ReelNet`)}`, "_blank")}}><i className="fa-brands fa-reddit-alien"></i></button>
                                    <button className="share-btn ripple-btn" title="Copy Link" onClick={(e)=>{createRipple(e); navigator.clipboard.writeText(`${currentMovie.title} (${currentMovie.year})\n${window.location.href}`); showToast("Copied!","fa-link"); emitParticles(e.clientX, e.clientY, "#46d369", 10); }}><i className="fa-solid fa-link"></i></button>
                                </div>
                            </div>
                            </div>

                            <div className="similar-section">
                                <h4><i className="fa-solid fa-wand-magic-sparkles"></i> You May Also Like</h4>
                                    <div className="similar-list">
                                        {similarMovies.map(m => (
                                            <div key={m.id} className="similar-card" onClick={() => handleOpenMovie(m)}>
                                                <img src={m.poster || 'https://placehold.co/100x150/0a0a0f/E50914?text=N'} title={m.title} alt="Similar Movie Poster" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="comments-section">
                                    <h4><i className="fa-solid fa-comments"></i> Reviews <span>({comments.length})</span></h4>
                                    <div className="comment-form">
                                        <div className="comment-input-row">
                                            <img src={auth ? auth.avatar : 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'} className="mini-avatar" alt="Avatar"/>
                                            <input type="text" id="comment-text" placeholder={`Write a review as ${auth ? auth.username : 'Guest'}...`} maxLength="500" onKeyDown={e => {if(e.key==='Enter') submitComment()}} />
                                            <button className="comment-submit ripple-btn" id="comment-submit" onClick={(e)=>{createRipple(e); submitComment()}}><i className="fa-solid fa-paper-plane"></i></button>
                                        </div>
                                    </div>
                                    <div className="comments-list">
                                        {comments.map(c => (
                                            <div key={c.id} className="comment-item">
                                                <img src={c.avatar || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} alt="Commenter Avatar"/>
                                                <div className="comment-content">
                                                    <div className="comment-header">
                                                        <span className="comment-user">{c.username}</span>
                                                        <span className="comment-time">{new Date(c.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="comment-text">{c.text}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                        </div>
                    )}
                </div>
            </div>

            {/* STATS MODAL */}
            <div className={`modal-overlay ${activeModal==='stats'?'active':''}`} onClick={(e)=>{if(e.target===e.currentTarget) setActiveModal(null)}}>
                <div className="modal-content stats-modal-content">
                    <button className="close-btn ripple-btn" onClick={()=>setActiveModal(null)}><i className="fa-solid fa-xmark"></i></button>
                    <div className="stats-body">
                        <h2><i className="fa-solid fa-chart-pie"></i> Catalog Statistics</h2>
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-number">{movies.length}</div><div className="stat-label">Total Titles</div></div>
                            <div className="stat-card"><div className="stat-number">{genres.length}</div><div className="stat-label">Genres</div></div>
                            <div className="stat-card"><div className="stat-number">{Object.values(globalVotes).reduce((a,b)=>a+b,0)}</div><div className="stat-label">Total Votes</div></div>
                            <div className="stat-card"><div className="stat-number">{(movies.filter(m=>!isNaN(parseFloat(m.rating))).reduce((a,b)=>a+parseFloat(b.rating),0)/movies.length || 0).toFixed(1)}</div><div className="stat-label">Avg Rating</div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AUTH MODAL (Login/Register) */}
            <div className={`modal-overlay ${activeModal==='auth'?'active':''}`} onClick={(e)=>{if(e.target===e.currentTarget) setActiveModal(null)}}>
                <div className="modal-content auth-modal-content">
                    <button className="close-btn ripple-btn" onClick={()=>setActiveModal(null)}><i className="fa-solid fa-xmark"></i></button>
                    <div className="auth-body">
                        <div className="auth-tabs">
                            <button className={authTab==='login'?'active':''} onClick={(e)=>{e.preventDefault(); setAuthTab('login');}}>Sign In</button>
                            <button className={authTab==='register'?'active':''} onClick={(e)=>{e.preventDefault(); setAuthTab('register');}}>Sign Up</button>
                        </div>
                        <h2>{authTab==='login' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="auth-desc">{authTab==='login' ? 'Sign in to sync your reviews.' : 'Join ReelNet to vote and review titles.'}</p>
                        
                        <form className="auth-form" onSubmit={handleAuthSubmit}>
                            {authTab === 'register' && (
                                <div className="input-group">
                                    <label>Display Name</label>
                                    <input type="text" className="auth-input" placeholder="e.g. MovieBuff99" value={authForm.username} onChange={e=>setAuthForm({...authForm, username: e.target.value})} />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" className="auth-input" placeholder="name@example.com" value={authForm.email} onChange={e=>setAuthForm({...authForm, email: e.target.value})} required />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" className="auth-input" placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm({...authForm, password: e.target.value})} required />
                            </div>
                            <button type="submit" className="primary-btn ripple-btn" style={{width:'100%', marginTop:'20px'}}>
                                {authTab==='login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* PROFILE MODAL */}
            {auth && (
                <div className={`modal-overlay ${activeModal==='profile'?'active':''}`} onClick={(e)=>{if(e.target===e.currentTarget) setActiveModal(null)}}>
                    <div className="modal-content auth-modal-content">
                        <button className="close-btn ripple-btn" onClick={()=>setActiveModal(null)}><i className="fa-solid fa-xmark"></i></button>
                        <div className="auth-body text-center">
                            <img src={auth.avatar} alt="Profile" className="profile-large-avatar" />
                            <h2 style={{marginTop:'16px'}}>{auth.username}</h2>
                            <p className="auth-desc">Member of ReelNet</p>
                            
                            <div className="avatar-selection" style={{textAlign:'left', marginTop:'24px'}}>
                                <label>Change Avatar</label>
                                <div className="avatar-grid">
                                    {['https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png', 'https://placehold.co/100x100/e50914/ffffff?text=U1', 'https://placehold.co/100x100/46d369/ffffff?text=U2', 'https://placehold.co/100x100/f5c518/ffffff?text=U3'].map(src => (
                                        <img key={src} src={src} className={`avatar-option ${auth.avatar===src?'active':''}`} onClick={() => {
                                            const newAuth = {...auth, avatar: src};
                                            setAuth(newAuth); localStorage.setItem('reelnet_auth', JSON.stringify(newAuth));
                                        }} alt="Avatar Option" />
                                    ))}
                                </div>
                            </div>
                            
                            <button className="secondary-btn ripple-btn logout-btn" onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
