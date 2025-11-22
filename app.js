// =================================================================
// Global Variables and LocalStorage Initialization 🚀
// =================================================================

// Local storage keys
const LS_USERS_KEY = 'miniSocial_users';
const LS_LOGGED_IN_KEY = 'miniSocial_loggedInUser';
const LS_POSTS_KEY = 'miniSocial_posts';
const LS_THEME_KEY = 'miniSocial_theme';

// Get or initialize data from localStorage
let users = JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
let loggedInUser = JSON.parse(localStorage.getItem(LS_LOGGED_IN_KEY));
// Crucial update: Ensure new posts have a 'comments' array
let posts = (JSON.parse(localStorage.getItem(LS_POSTS_KEY)) || []).map(post => ({
    ...post,
    comments: post.comments || [] // Ensure comments array exists
})); 

// Get DOM elements for views
const body = document.body;
const authView = document.getElementById('auth-view');
const feedView = document.getElementById('feed-view');

// Auth elements
const authTitle = document.getElementById('auth-title');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const switchToSignup = document.getElementById('switch-to-signup');

// Feed elements
const welcomeUserSpan = document.getElementById('welcome-user');
const logoutBtn = document.getElementById('logout-btn');
const createPostForm = document.getElementById('create-post-form');
const postsFeed = document.getElementById('posts-feed');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const clearFiltersBtn = document.getElementById('clear-filters-btn'); // NEW: Clear Filters

// Theme Toggle
const themeSwitch = document.getElementById('theme-switch'); // NEW: Theme Switch

// Post Creator/Emoji Elements
const postTextarea = document.getElementById('post-text');
const postImageUrlInput = document.getElementById('post-image-url'); // FIXED: Added this variable
const emojiOptions = document.querySelectorAll('.emoji-option');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editPostForm = document.getElementById('edit-post-form');
const editPostIdInput = document.getElementById('edit-post-id');
const editPostTextarea = document.getElementById('edit-post-text');
const editPostImageUrlInput = document.getElementById('edit-post-image-url');
const closeModalBtn = document.getElementById('close-modal-btn');

// NEW: Comment Modal Elements
const commentModal = document.getElementById('comment-modal');
const commentPostContainer = document.getElementById('comment-post-container');
const commentCountSpan = document.getElementById('comment-count');
const addCommentForm = document.getElementById('add-comment-form');
const commentPostIdInput = document.getElementById('comment-post-id');
const commentTextInput = document.getElementById('comment-text-input');
const commentsList = document.getElementById('comments-list');
const closeCommentModalBtn = document.getElementById('close-comment-modal-btn');



// =================================================================
// UTILITY FUNCTIONS 🛠️
// =================================================================

/**
 * Converts a timestamp to a human-readable "time ago" string.
 * @param {number} timestamp - The post or comment timestamp.
 * @returns {string} The formatted time string.
 */
function timeAgo(timestamp) {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

    // Fallback to local date string for older posts
    return new Date(timestamp).toLocaleDateString();
}

// =================================================================
// THEME LOGIC 🌓
// =================================================================

/**
 * Applies the saved theme preference or defaults to light mode.
 */
function applyTheme() {
    const savedTheme = localStorage.getItem(LS_THEME_KEY) || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeSwitch.checked = true;
    } else {
        body.classList.remove('dark-mode');
        themeSwitch.checked = false;
    }
}

/**
 * Handles the theme switch toggle.
 */
function handleThemeToggle() {
    if (themeSwitch.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem(LS_THEME_KEY, 'dark');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem(LS_THEME_KEY, 'light');
    }
}

// =================================================================
// 0. Authentication Flow Logic
// =================================================================

// (Auth logic remains the same as provided previously)

function handleAuthSwitch(e) {
    e.preventDefault();
    const isLogin = loginForm.style.display !== 'none';
    
    loginForm.style.display = isLogin ? 'none' : 'block';
    signupForm.style.display = isLogin ? 'block' : 'none';
    authTitle.textContent = isLogin ? 'Sign Up' : 'Login';
    switchToSignup.textContent = isLogin ? 'Log In' : 'Sign Up';
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;

    if (users.find(u => u.email === email)) {
        alert('User with this email already exists. Please log in.');
        return;
    }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
    alert('Signup successful! Please log in.');
    
    document.getElementById('switch-to-signup').click();
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        loggedInUser = user;
        localStorage.setItem(LS_LOGGED_IN_KEY, JSON.stringify(loggedInUser));
        renderApp();
    } else {
        alert('Invalid email or password.');
    }
}

function handleLogout() {
    loggedInUser = null;
    localStorage.removeItem(LS_LOGGED_IN_KEY);
    renderApp();
}

/**
 * Switches the main view based on the login state and applies theme/initial data.
 */
function renderApp() {
    applyTheme(); // Apply theme on load

    if (loggedInUser) {
        // Show Feed View
        authView.style.display = 'none';
        feedView.style.display = 'block';
        welcomeUserSpan.textContent = `Welcome, ${loggedInUser.name}`;
        
        renderPosts();
    } else {
        // Show Auth View
        authView.style.display = 'flex';
        feedView.style.display = 'none';
        
        loginForm.reset();
        signupForm.reset();
        if (signupForm.style.display !== 'none') {
            document.getElementById('switch-to-signup').click();
        }
    }
}


// =================================================================
// EMOJI FEATURE 🤩 (No Change needed here)
// =================================================================

function handleEmojiInsert(e) {
    const emoji = e.target.dataset.emoji;
    if (emoji) {
        const start = postTextarea.selectionStart;
        const end = postTextarea.selectionEnd;
        const currentText = postTextarea.value;

        postTextarea.value = currentText.substring(0, start) + emoji + currentText.substring(end);
        
        postTextarea.selectionStart = postTextarea.selectionEnd = start + emoji.length;
        postTextarea.focus();
    }
}


// =================================================================
// 1-4. Post Features (Create, Read, Like, Delete, EDIT, COMMENT, SHARE) 📝
// =================================================================

/**
 * Creates the HTML markup for a single post.
 */
function createPostCardHTML(post) {
    const timeString = timeAgo(post.timestamp); // Using utility function
    const isLiked = post.likes.includes(loggedInUser.id);
    const likeIconClass = isLiked ? 'fa-solid' : 'fa-regular';
    const likeButtonClass = isLiked ? 'liked' : '';
    const isOwner = post.userId === loggedInUser.id;

    const imageElement = post.imageUrl 
        ? `<img src="${post.imageUrl}" alt="Post image" class="post-image" onerror="this.style.display='none';">`
        : '';

    const ownerActions = isOwner ? `
        <div class="owner-actions">
            <button class="edit-button" data-id="${post.id}">
                <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="delete-button" data-id="${post.id}">
                <i class="fa-solid fa-trash-can"></i> Delete
            </button>
        </div>
    ` : '';

    return `
        <div class="post-card" data-id="${post.id}">
            <div class="post-header">
                <span class="post-author">${post.authorName}</span>
                <span class="post-time">${timeString}</span>
            </div>
            <div class="post-content">
                <p>${post.text}</p>
                ${imageElement}
            </div>
            <div class="post-actions">
                <div class="action-buttons-group">
                    <button class="like-button ${likeButtonClass}" data-id="${post.id}">
                        <i class="${likeIconClass} fa-heart"></i>
                        <span class="like-count">${post.likes.length}</span>
                    </button>
                    <button class="comment-button" data-id="${post.id}">
                        <i class="fa-regular fa-comment"></i>
                        <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                    </button>
                    <button class="share-button" data-id="${post.id}">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                </div>
                ${ownerActions}
            </div>
        </div>
    `;
}

/**
 * Renders the filtered and sorted posts to the DOM.
 */
function renderPosts() {
    const searchText = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    // Search/Filter posts by text content
    let filteredPosts = posts.filter(post => 
        post.text.toLowerCase().includes(searchText)
    );

    // Sort posts
    filteredPosts.sort((a, b) => {
        if (sortBy === 'latest') return b.timestamp - a.timestamp; 
        if (sortBy === 'oldest') return a.timestamp - b.timestamp; 
        if (sortBy === 'likes') return b.likes.length - a.likes.length; 
        return 0;
    });

    // Render to DOM
    postsFeed.innerHTML = filteredPosts.map(createPostCardHTML).join('') || `<p style="text-align: center; color: var(--light-text-color);">No posts found matching your criteria.</p>`;
}

/**
 * Handles the creation of a new post.
 */
function handleCreatePost(e) {
    e.preventDefault();
    // FIXED: Use the global variables for reliable access
    const postText = postTextarea.value.trim(); 
    const postImageUrl = postImageUrlInput.value.trim();

    if (!postText) {
        alert("Post content cannot be empty.");
        return;
    }

    const newPost = {
        id: Date.now(),
        userId: loggedInUser.id,
        authorName: loggedInUser.name,
        text: postText,
        imageUrl: postImageUrl,
        timestamp: Date.now(),
        likes: [],
        comments: [] // Initialize comments array
    };

    posts.unshift(newPost);
    localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));

    // ✅ Reset form and clear image preview
    createPostForm.reset();
    postImagePreview.src = '';
    postImagePreview.style.display = 'none';

    renderPosts(); 
}


const postImageFileInput = document.getElementById('post-image-file');
const postImageURLInput = document.getElementById('post-image-url');
const postImagePreview = document.getElementById('post-image-preview');
const cancelImageBtn = document.getElementById('cancel-image-btn');

// Show preview when file selected
postImageFileInput.addEventListener('change', () => {
    const file = postImageFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            postImagePreview.src = e.target.result;
            postImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Show preview when URL entered
postImageURLInput.addEventListener('input', () => {
    const url = postImageURLInput.value.trim();
    if (url) {
        postImagePreview.src = url;
        postImagePreview.style.display = 'block';
    } else if (!postImageFileInput.files[0]) {
        postImagePreview.style.display = 'none';
    }
});

// Cancel button clears file, URL and preview
cancelImageBtn.addEventListener('click', () => {
    postImageFileInput.value = '';
    postImageURLInput.value = '';
    postImagePreview.src = '';
    postImagePreview.style.display = 'none';
});


/**
 * Handles all click events within the post feed (Like, Delete, Edit, Comment, Share).
 */
function handlePostActions(e) {
    const target = e.target.closest('.action-buttons-group button, .owner-actions button');
    if (!target) return;

    const postId = parseInt(target.dataset.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return;
    
    if (target.classList.contains('like-button')) {
        handleLikeToggle(postIndex, target);
    } else if (target.classList.contains('delete-button')) {
        handleDeletePost(postIndex);
    } else if (target.classList.contains('edit-button')) {
        openEditModal(postId);
    } else if (target.classList.contains('comment-button')) {
        openCommentModal(postId); // NEW: Comment action
    } else if (target.classList.contains('share-button')) {
        handleSharePost(postId); // NEW: Share action
    }
}

function handleLikeToggle(postIndex, button) {
    const post = posts[postIndex];
    const userId = loggedInUser.id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
    } else {
        post.likes.push(userId);
    }

    // Save and re-render the post to update counts/classes reliably
    localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

function handleDeletePost(postIndex) {
    if (confirm("Are you sure you want to delete this post?")) {
        posts.splice(postIndex, 1); 
        localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));
        renderPosts();
    }
}

/**
 * Handles the native Web Share API or falls back to clipboard copy.
 */
function handleSharePost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const postUrl = window.location.href; 
    const shareText = `Check out this post by ${post.authorName}: "${post.text.substring(0, 50)}..."`;

    if (navigator.share) {
        navigator.share({
            title: 'Social Media Post',
            text: shareText,
            url: postUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback for browsers that don't support the Share API
        navigator.clipboard.writeText(`${shareText}\n${postUrl}`).then(() => {
            alert('Post link and summary copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Could not copy link.');
        });
    }
}

/**
 * Resets the search and sort controls and re-renders posts.
 */
function handleClearFilters() {
    searchInput.value = '';
    sortSelect.value = 'latest';
    renderPosts();
}


// =================================================================
// EDIT POST LOGIC ✏️ (No Change needed here)
// =================================================================

function openEditModal(postId) {
    const postToEdit = posts.find(p => p.id === postId);

    if (postToEdit) {
        editPostIdInput.value = postId;
        editPostTextarea.value = postToEdit.text;
        editPostImageUrlInput.value = postToEdit.imageUrl || '';
        editModal.style.display = 'flex';
    }
}

function closeEditModal() {
    editModal.style.display = 'none';
    editPostForm.reset();
}

function handleSaveEdit(e) {
    e.preventDefault();
    const postId = parseInt(editPostIdInput.value);
    const newText = editPostTextarea.value.trim();
    const newImageUrl = editPostImageUrlInput.value.trim();
    
    if (!newText) {
        alert("Post content cannot be empty.");
        return;
    }

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        posts[postIndex].text = newText;
        posts[postIndex].imageUrl = newImageUrl;
        
        localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));
        closeEditModal();
        renderPosts();
    }
}


// =================================================================
// COMMENT LOGIC 💬 (NEW FEATURE)
// =================================================================

/**
 * Creates the HTML markup for a single comment.
 */
function createCommentHTML(comment) {
    const time = timeAgo(comment.timestamp);
    const authorName = users.find(u => u.id === comment.userId)?.name || 'Unknown User';

    return `
        <div class="comment-card">
            <span class="comment-author">${authorName}</span>
            <span class="comment-time">${time}</span>
            <p class="comment-text">${comment.text}</p>
        </div>
    `;
}

/**
 * Renders all comments for a given post in the modal.
 */
function renderComments(post) {
    commentsList.innerHTML = post.comments.map(createCommentHTML).join('');
    commentCountSpan.textContent = post.comments.length;
}

/**
 * Opens the comment modal for a specific post.
 */
function openCommentModal(postId) {
    const post = posts.find(p => p.id === postId);

    if (post) {
        // 1. Populate the post snippet
        commentPostContainer.innerHTML = `
            <span class="post-author">${post.authorName}</span>
            <span class="post-time">${timeAgo(post.timestamp)}</span>
            <p>${post.text}</p>
        `;

        // 2. Set the post ID for the form
        commentPostIdInput.value = postId;

        // 3. Render comments list
        renderComments(post);

        // 4. Show modal
        commentModal.style.display = 'flex';
    }
}

/**
 * Closes the comment modal.
 */
function closeCommentModal() {
    commentModal.style.display = 'none';
    addCommentForm.reset();
}

/**
 * Handles adding a new comment to the current post.
 */
function handleAddComment(e) {
    e.preventDefault();
    const postId = parseInt(commentPostIdInput.value);
    const commentText = commentTextInput.value.trim();

    if (!commentText) return;

    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex !== -1) {
        const newComment = {
            id: Date.now(),
            userId: loggedInUser.id,
            text: commentText,
            timestamp: Date.now()
        };

        posts[postIndex].comments.push(newComment);
        localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));

        // Re-render comments in the modal instantly
        renderComments(posts[postIndex]);
        // Re-render the feed to update the comment count on the post card
        renderPosts(); 
        
        commentTextInput.value = ''; // Clear input
    }
}


// =================================================================
// Event Listeners & Initialization
// =================================================================

// Auth Listeners
switchToSignup.addEventListener('click', handleAuthSwitch);
signupForm.addEventListener('submit', handleSignup);
loginForm.addEventListener('submit', handleLogin);

const logoutModal = document.getElementById("logoutModal");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

// Open modal when logout button is clicked
logoutBtn.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent instant logout
    logoutModal.style.display = "flex";
});

// Confirm logout
confirmLogoutBtn.addEventListener("click", () => {
    logoutModal.style.display = "none"; // <-- hide the modal
    handleLogout();
});

// Cancel logout
cancelLogoutBtn.addEventListener("click", () => {
    logoutModal.style.display = "none";
});

// Close modal by clicking outside box
logoutModal.addEventListener("click", (e) => {
    if (e.target === logoutModal) {
        logoutModal.style.display = "none";
    }
});

// Grab both toggles
const themeSwitchHeader = document.getElementById('theme-switch-header');
const themeSwitchFooter = document.getElementById('theme-switch-footer');

// Function to apply theme
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // Sync both checkboxes
    themeSwitchHeader.checked = isDark;
    themeSwitchFooter.checked = isDark;

    // Save preference to localStorage
    localStorage.setItem('darkMode', isDark);
}

// Load saved theme on page load
const savedTheme = localStorage.getItem('darkMode') === 'true';
applyTheme(savedTheme);

// Event listeners
themeSwitchHeader.addEventListener('change', (e) => applyTheme(e.target.checked));
themeSwitchFooter.addEventListener('change', (e) => applyTheme(e.target.checked));


// Post Listeners
createPostForm.addEventListener('submit', handleCreatePost);
postsFeed.addEventListener('click', handlePostActions);

// Search, Sort, and Filter Listeners
searchInput.addEventListener('input', renderPosts);
sortSelect.addEventListener('change', renderPosts);
clearFiltersBtn.addEventListener('click', handleClearFilters); // NEW: Clear Filters Listener

// Emoji Picker Listeners
emojiOptions.forEach(emoji => {
    emoji.addEventListener('click', handleEmojiInsert);
});

// Edit Modal Listeners
editPostForm.addEventListener('submit', handleSaveEdit);
closeModalBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});


// =========================
// Comment Functionality
// =========================

// Toggle comment section visibility
document.addEventListener("click", function (e) {
    if (e.target.closest(".comment-button")) {
        const postCard = e.target.closest(".post-card");
        const commentsSection = postCard.querySelector(".comments-section");
        commentsSection.style.display = commentsSection.style.display === "none" ? "block" : "none";
    }
});

// Add comment functionality
document.addEventListener("submit", function (e) {
    if (e.target.classList.contains("add-comment-form")) {
        e.preventDefault();

        const form = e.target;
        const postCard = form.closest(".post-card");
        const commentList = postCard.querySelector(".comments-list");
        const input = form.querySelector(".comment-input");

        const commentText = input.value.trim();
        if (!commentText) return;

        // Create new comment element
        const commentCard = document.createElement("div");
        commentCard.classList.add("comment-card");
        commentCard.innerHTML = `<span class="comment-author">You:</span> <span class="comment-text">${commentText}</span>`;
        
        commentList.appendChild(commentCard);

        // Clear input
        input.value = "";

        // Scroll to bottom
        commentList.scrollTop = commentList.scrollHeight;
    }
});

// Post Modal
const postModal = document.getElementById("post-view-modal");
const modalImage = document.getElementById("modal-post-image");
const modalAuthor = document.getElementById("modal-post-author");
const modalTime = document.getElementById("modal-post-time");
const modalText = document.getElementById("modal-post-text");
const modalCommentsList = document.getElementById("modal-comments-list");
const modalCommentForm = document.getElementById("modal-add-comment-form");
const modalCommentInput = document.getElementById("modal-comment-input");
const closePostModal = document.getElementById("close-post-modal");

document.addEventListener("click", function(e){
    // Open modal when post image is clicked
    if(e.target.classList.contains("post-image")){
        const postCard = e.target.closest(".post-card");
        const author = postCard.getAttribute("data-author");
        const time = postCard.querySelector(".post-time").textContent;
        const text = postCard.querySelector(".post-content p").textContent;
        const imageSrc = e.target.src;

        modalImage.src = imageSrc;
        modalAuthor.textContent = author;
        modalTime.textContent = time;
        modalText.textContent = text;

        // Load comments
        modalCommentsList.innerHTML = "";
        const comments = postCard.querySelectorAll(".comment-card");
        comments.forEach(comment => {
            const clone = comment.cloneNode(true);
            modalCommentsList.appendChild(clone);
        });

        postModal.style.display = "flex";
    }
});

// Close modal
closePostModal.addEventListener("click", () => {
    postModal.style.display = "none";
});

// Close when clicking outside modal
window.addEventListener("click", function(e){
    if(e.target === postModal){
        postModal.style.display = "none";
    }
});

// Add comment in modal
modalCommentForm.addEventListener("submit", function(e){
    e.preventDefault();
    const text = modalCommentInput.value.trim();
    if(!text) return;

    const commentCard = document.createElement("div");
    commentCard.classList.add("comment-card");
    commentCard.innerHTML = `<span class="comment-author">You:</span> <span class="comment-text">${text}</span>`;

    modalCommentsList.appendChild(commentCard);
    modalCommentInput.value = "";
});

// ------------------- Footer JS -------------------

// Show current time in footer
function updateFooterTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('footer-time').textContent = timeString;
}
setInterval(updateFooterTime, 1000);
updateFooterTime(); // initial call
// Latest Post Button
const footerLatestPostBtn = document.getElementById('footer-latest-post');
footerLatestPostBtn.addEventListener('click', () => {
    const postsFeed = document.getElementById('posts-feed');
    const lastPost = postsFeed.lastElementChild;
    if (lastPost) {
        lastPost.scrollIntoView({ behavior: 'smooth' });
        lastPost.classList.add('highlight-post');
        setTimeout(() => lastPost.classList.remove('highlight-post'), 2000);
    }
});

// Create Post Button
document.getElementById('footer-create-post').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('post-text').focus();
});

// Sort Posts from Footer
document.getElementById('footer-sort-select').addEventListener('change', (e) => {
    const sortValue = e.target.value;
    document.getElementById('sort-select').value = sortValue; // sync with main sort
    document.getElementById('sort-select').dispatchEvent(new Event('change')); // trigger existing sort logic
});

function handleCreatePost(e) {
    e.preventDefault();

    const postText = postTextarea.value.trim(); 
    const postImageUrl = postImageUrlInput.value.trim(); 
    const postImageFile = document.getElementById('post-image-file').files[0];

    if (!postText) {
        alert("Post content cannot be empty.");
        return;
    }

    // Handle file upload
    if (postImageFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const newPost = createPostObject(postText, event.target.result);
            addPost(newPost);
        };
        reader.readAsDataURL(postImageFile);
    } else {
        // Use URL or empty string
        const newPost = createPostObject(postText, postImageUrl);
        addPost(newPost);
    }

    createPostForm.reset();
}

// Helper function to create post object
function createPostObject(text, imageUrl) {
    return {
        id: Date.now(),
        userId: loggedInUser.id,
        authorName: loggedInUser.name,
        text: text,
        imageUrl: imageUrl || '',
        timestamp: Date.now(),
        likes: [],
        comments: []
    };
}

// Helper function to add post to feed
function addPost(post) {
    posts.unshift(post);
    localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

// Show preview when file or URL is added
postImageUrlInput.addEventListener('input', () => {
    const url = postImageUrlInput.value.trim();
    const preview = document.getElementById('post-image-preview');
    if (url) {
        preview.src = url;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
});

document.getElementById('post-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('post-image-preview');
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.src = event.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
});

// NEW: Comment Modal Listeners
addCommentForm.addEventListener('submit', handleAddComment);
closeCommentModalBtn.addEventListener('click', closeCommentModal);
commentModal.addEventListener('click', (e) => {
    if (e.target === commentModal) closeCommentModal();
});


// Initial App Load
renderApp();