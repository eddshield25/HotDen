// TMDB API Configuration
const TMDB_API = {
    KEY: '420dd26414b8bcb319a5d49051b6ac25', // Your TMDB API key
    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_BASE_URL: 'https://image.tmdb.org/t/p/w500',
    IMG_ORIGINAL_URL: 'https://image.tmdb.org/t/p/original'
};

// Global State
let currentMedia = null;
let currentTheme = 'dark';

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    trendingTv: document.getElementById('trending-tv'),
    trendingMovies: document.getElementById('trending-movies'),
    latestMovies: document.getElementById('latest-movies'),
    latestTv: document.getElementById('latest-tv'),
    popularAnime: document.getElementById('popular-anime'),
    searchResultsSection: document.getElementById('search-results-section'),
    searchResults: document.getElementById('search-results'),
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

function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

async function fetchNowPlayingMovies() {
    const data = await fetchFromTMDB('/movie/now_playing');
    return data?.results || [];
}

async function fetchAiringTodayTV() {
    const data = await fetchFromTMDB('/tv/airing_today');
    return data?.results || [];
}

async function fetchPopularAnime() {
    const data = await fetchFromTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc');
    return data?.results || [];
}

async function searchTMDB(query) {
    const data = await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
    return data?.results || [];
}

async function fetchMovieDetails(movieId) {
    return await fetchFromTMDB(`/movie/${movieId}`);
}

async function fetchTVDetails(tvId) {
    return await fetchFromTMDB(`/tv/${tvId}`);
}

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
                ${isMovie ? 
                    `<span class="duration">${mediaItem.original_language?.toUpperCase()}</span>` :
                    `<span class="duration">TV Show</span>`
                }
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

// Search Functionality
async function performSearch() {
    const query = elements.headerSearch.value.trim();
    if (query) {
        await executeSearch(query);
    }
}

async function performHeroSearch() {
    const query = elements.heroSearch.value.trim();
    if (query) {
        await executeSearch(query);
    }
}

async function executeSearch(query) {
    showLoading();
    
    const results = await searchTMDB(query);
    const validResults = results.filter(item => 
        (item.media_type === 'movie' || item.media_type === 'tv') && 
        item.poster_path
    );
    
    renderMediaList(validResults, elements.searchResults);
    elements.searchResultsSection.style.display = 'block';
    document.querySelector('.content-section').style.display = 'none';
    
    hideLoading();
}

function hideSearchResults() {
    elements.searchResultsSection.style.display = 'none';
    document.querySelector('.content-section').style.display = 'block';
    elements.headerSearch.value = '';
    elements.heroSearch.value = '';
}

// Modal Functions
async function showMediaDetails(mediaId, mediaType) {
    showLoading();
    
    try {
        if (mediaType === 'movie') {
            currentMedia = await fetchMovieDetails(mediaId);
        } else {
            currentMedia = await fetchTVDetails(mediaId);
        }
        
        if (currentMedia) {
            document.getElementById('modal-title').textContent = 
                currentMedia.title || currentMedia.name;
            document.getElementById('modal-poster-img').src = 
                `${TMDB_API.IMG_BASE_URL}${currentMedia.poster_path}`;
            document.getElementById('modal-year').textContent = 
                formatDate(currentMedia.release_date || currentMedia.first_air_date);
            document.getElementById('modal-rating').textContent = 
                `⭐ ${formatRating(currentMedia.vote_average)}`;
            document.getElementById('modal-runtime').textContent = 
                mediaType === 'movie' ? 
                formatRuntime(currentMedia.runtime) : 
                `${currentMedia.number_of_seasons} Seasons`;
            document.getElementById('modal-overview').textContent = 
                currentMedia.overview || 'No overview available.';
            
            elements.videoModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error fetching media details:', error);
        alert('Error loading media details. Please try again.');
    }
    
    hideLoading();
}

function closeModal() {
    elements.videoModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentMedia = null;
}

function playMedia() {
    if (!currentMedia) return;
    
    const isMovie = currentMedia.title;
    const mediaId = currentMedia.id;
    
    // Using vidsrc.cc for streaming (educational purposes only)
    const streamUrl = isMovie ? 
        `https://vidsrc.cc/v2/embed/movie/${mediaId}` :
        `https://vidsrc.cc/v2/embed/tv/${mediaId}/1/1`;
    
    window.open(streamUrl, '_blank');
    closeModal();
}

function addToFavorites() {
    if (!currentMedia) return;
    alert(`Added "${currentMedia.title || currentMedia.name}" to favorites!`);
}

// Theme Toggle
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    localStorage.setItem('theme', currentTheme);
}

// Event Listeners
function setupEventListeners() {
    // Search input Enter key support
    [elements.headerSearch, elements.heroSearch].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (input === elements.headerSearch) {
                    performSearch();
                } else {
                    performHeroSearch();
                }
            }
        });
    });
    
    // Close modal on outside click
    elements.videoModal.addEventListener('click', (e) => {
        if (e.target === elements.videoModal) {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.videoModal.style.display === 'flex') {
            closeModal();
        }
    });
}

// Initialize App
async function initApp() {
    showLoading();
    setupEventListeners();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentTheme = savedTheme;
    document.body.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    
    try {
        // Fetch all content in parallel
        const [
            trendingMovies, 
            trendingTV, 
            nowPlayingMovies, 
            airingTodayTV, 
            popularAnime
        ] = await Promise.all([
            fetchTrendingMovies(),
            fetchTrendingTV(),
            fetchNowPlayingMovies(),
            fetchAiringTodayTV(),
            fetchPopularAnime()
        ]);
        
        // Render all sections
        renderMediaList(trendingMovies, elements.trendingMovies);
        renderMediaList(trendingTV, elements.trendingTv);
        renderMediaList(nowPlayingMovies, elements.latestMovies);
        renderMediaList(airingTodayTV, elements.latestTv);
        renderMediaList(popularAnime, elements.popularAnime);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error loading content. Please refresh the page.');
    }
    
    hideLoading();
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);