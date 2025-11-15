// TMDB API Configuration
const TMDB_API = {
    KEY: '420dd26414b8bcb319a5d49051b6ac25',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_BASE_URL: 'https://image.tmdb.org/t/p/w500',
    IMG_ORIGINAL_URL: 'https://image.tmdb.org/t/p/original'
};

// Global State
let currentMedia = null;

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    trendingTv: document.getElementById('trending-tv'),
    trendingMovies: document.getElementById('trending-movies'),
    latestMovies: document.getElementById('latest-movies'),
    latestTv: document.getElementById('latest-tv'),
    popularAnime: document.getElementById('popular-anime'),
    videoModal: document.getElementById('video-modal'),
    headerSearch: document.getElementById('header-search'),
    heroSearch: document.getElementById('hero-search')
};

// Utility Functions
function showLoading() {
    elements.loadingScreen.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingScreen.classList.add('hidden');
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    return new Date(dateString).getFullYear();
}

function formatRating(voteAverage) {
    return voteAverage ? voteAverage.toFixed(1) : 'N/A';
}

// TMDB API Functions
async function fetchFromTMDB(endpoint) {
    try {
        const response = await fetch(`${TMDB_API.BASE_URL}${endpoint}?api_key=${TMDB_API.KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('TMDB API Error:', error);
        return null;
    }
}

async function fetchTrendingMovies() {
    const data = await fetchFromTMDB('/trending/movie/week');
    return data?.results || [];
}

async function fetchTrendingTV() {
    const data = await fetchFromTMDB('/trending/tv/week');
    return data?.results || [];
}

// ... (include all the other API functions from previous app.js)

// DOM Rendering Functions
function createMediaCard(mediaItem) {
    const isMovie = mediaItem.media_type === 'movie' || mediaItem.title;
    const title = mediaItem.title || mediaItem.name;
    const posterPath = mediaItem.poster_path;
    const releaseYear = formatDate(mediaItem.release_date || mediaItem.first_air_date);
    const rating = formatRating(mediaItem.vote_average);
    
    if (!posterPath) return null;

    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('data-id', mediaItem.id);
    card.setAttribute('data-type', isMovie ? 'movie' : 'tv');
    
    card.innerHTML = `
        <div class="card-poster">
            <img src="${TMDB_API.IMG_BASE_URL}${posterPath}" 
                 alt="${title}" 
                 loading="lazy">
            <div class="card-overlay">
                <button class="play-btn" onclick="event.stopPropagation(); playMedia(${mediaItem.id}, '${isMovie ? 'movie' : 'tv'}')">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
        <div class="card-info">
            <h4 class="card-title">${title}</h4>
            <div class="card-meta">
                <span class="year">${releaseYear}</span>
                <span class="rating">⭐ ${rating}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => showMediaDetails(mediaItem.id, isMovie ? 'movie' : 'tv'));
    
    return card;
}

function renderMediaList(mediaItems, container) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (mediaItems.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-film"></i>
                <p>No content available</p>
            </div>
        `;
        return;
    }
    
    mediaItems.forEach(item => {
        const card = createMediaCard(item);
        if (card) container.appendChild(card);
    });
}

// Initialize App
async function initApp() {
    showLoading();
    
    try {
        const [trendingMovies, trendingTV, nowPlayingMovies, airingTodayTV, popularAnime] = await Promise.all([
            fetchTrendingMovies(),
            fetchTrendingTV(),
            fetchFromTMDB('/movie/now_playing').then(data => data?.results || []),
            fetchFromTMDB('/tv/airing_today').then(data => data?.results || []),
            fetchFromTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc').then(data => data?.results || [])
        ]);
        
        renderMediaList(trendingTV, elements.trendingTv);
        renderMediaList(trendingMovies, elements.trendingMovies);
        renderMediaList(nowPlayingMovies, elements.latestMovies);
        renderMediaList(airingTodayTV, elements.latestTv);
        renderMediaList(popularAnime, elements.popularAnime);
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
    
    hideLoading();
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);
