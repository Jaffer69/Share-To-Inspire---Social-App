// ===== Configuration & Constants =====
        const CONFIG = {
            STORAGE_KEYS: {
                USERS: 'shareToInspire_users',
                CURRENT_USER: 'shareToInspire_currentUser',
                POSTS: 'shareToInspire_posts',
                THEME: 'shareToInspire_theme'
            }
        };

        // ===== State Management =====
        class AppState {
            constructor() {
                this.users = this.loadFromStorage(CONFIG.STORAGE_KEYS.USERS) || [];
                this.currentUser = this.loadFromStorage(CONFIG.STORAGE_KEYS.CURRENT_USER);
                this.posts = this.loadFromStorage(CONFIG.STORAGE_KEYS.POSTS) || [];
                this.theme = this.loadFromStorage(CONFIG.STORAGE_KEYS.THEME) || 'light';
                this.filters = {
                    search: '',
                    sort: 'latest'
                };
            }

            loadFromStorage(key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    console.warn(`Error loading ${key} from storage:`, error);
                    return null;
                }
            }

            saveToStorage(key, data) {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (error) {
                    console.error(`Error saving ${key} to storage:`, error);
                }
            }

            addUser(user) {
                this.users.push(user);
                this.saveToStorage(CONFIG.STORAGE_KEYS.USERS, this.users);
            }

            setCurrentUser(user) {
                this.currentUser = user;
                this.saveToStorage(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
            }

            clearCurrentUser() {
                this.currentUser = null;
                localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
            }

            addPost(post) {
                this.posts.unshift(post);
                this.saveToStorage(CONFIG.STORAGE_KEYS.POSTS, this.posts);
            }

            updatePost(postId, updates) {
                const index = this.posts.findIndex(post => post.id === postId);
                if (index !== -1) {
                    this.posts[index] = { ...this.posts[index], ...updates };
                    this.saveToStorage(CONFIG.STORAGE_KEYS.POSTS, this.posts);
                }
            }

            deletePost(postId) {
                this.posts = this.posts.filter(post => post.id !== postId);
                this.saveToStorage(CONFIG.STORAGE_KEYS.POSTS, this.posts);
            }

            toggleLike(postId, userId) {
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    const likeIndex = post.likes.indexOf(userId);
                    if (likeIndex > -1) {
                        post.likes.splice(likeIndex, 1);
                    } else {
                        post.likes.push(userId);
                    }
                    this.saveToStorage(CONFIG.STORAGE_KEYS.POSTS, this.posts);
                }
            }

            addComment(postId, comment) {
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push(comment);
                    this.saveToStorage(CONFIG.STORAGE_KEYS.POSTS, this.posts);
                }
            }

            setTheme(theme) {
                this.theme = theme;
                this.saveToStorage(CONFIG.STORAGE_KEYS.THEME, theme);
                document.documentElement.setAttribute('data-theme', theme);
            }

            getFilteredPosts() {
                let filtered = this.posts.filter(post => 
                    post.text.toLowerCase().includes(this.filters.search.toLowerCase())
                );

                filtered.sort((a, b) => {
                    switch (this.filters.sort) {
                        case 'latest': return b.timestamp - a.timestamp;
                        case 'oldest': return a.timestamp - b.timestamp;
                        case 'likes': return b.likes.length - a.likes.length;
                        default: return 0;
                    }
                });

                return filtered;
            }
        }

        // ===== Main App Class =====
        class ShareToInspireApp {
            constructor() {
                this.state = new AppState();
                this.elements = this.cacheDOM();
                this.bindEvents();
                this.init();
            }

            cacheDOM() {
                return {
                    // Views
                    authView: document.getElementById('auth-view'),
                    feedView: document.getElementById('feed-view'),

                    // Auth Elements
                    authTabs: document.querySelectorAll('.tab-btn'),
                    loginForm: document.getElementById('login-form'),
                    signupForm: document.getElementById('signup-form'),
                    loginEmail: document.getElementById('login-email'),
                    loginPassword: document.getElementById('login-password'),
                    signupName: document.getElementById('signup-name'),
                    signupEmail: document.getElementById('signup-email'),
                    signupPassword: document.getElementById('signup-password'),

                    // Feed Elements
                    welcomeUser: document.getElementById('welcome-user'),
                    logoutBtn: document.getElementById('logout-btn'),
                    createPostForm: document.getElementById('create-post-form'),
                    postContent: document.getElementById('post-content'),
                    postsContainer: document.getElementById('posts-container'),
                    searchInput: document.getElementById('search-posts'),
                    sortSelect: document.getElementById('sort-posts'),
                    clearFilters: document.getElementById('clear-filters'),

                    // Theme
                    themeToggle: document.getElementById('theme-toggle'),
                    footerThemeToggle: document.getElementById('footer-theme-toggle'),

                    // Modals
                    editModal: document.getElementById('edit-modal'),
                    commentsModal: document.getElementById('comments-modal'),
                    logoutModal: document.getElementById('logout-modal'),
                    editPostForm: document.getElementById('edit-post-form'),
                    editPostId: document.getElementById('edit-post-id'),
                    editPostContent: document.getElementById('edit-post-content'),
                    addCommentForm: document.getElementById('add-comment-form'),
                    commentPostId: document.getElementById('comment-post-id'),
                    commentText: document.getElementById('comment-text'),
                    commentsList: document.getElementById('comments-list'),
                    commentsCount: document.getElementById('comments-count'),
                    postPreview: document.getElementById('post-preview'),
                    confirmLogout: document.getElementById('confirm-logout'),
                    cancelLogout: document.getElementById('cancel-logout'),
                    cancelEdit: document.getElementById('cancel-edit'),

                    // Media
                    imageUpload: document.getElementById('image-upload'),
                    imageUrl: document.getElementById('image-url'),
                    imagePreview: document.getElementById('image-preview'),

                    // Footer
                    currentTime: document.getElementById('current-time'),
                    scrollToTop: document.getElementById('scroll-to-top'),
                    createPostFooter: document.getElementById('create-post-footer')
                };
            }

            bindEvents() {
                // Auth Events
                this.elements.authTabs.forEach(tab => {
                    tab.addEventListener('click', (e) => this.switchAuthTab(e.target));
                });
                this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
                this.elements.signupForm.addEventListener('submit', (e) => this.handleSignup(e));

                // Input validation
                this.elements.signupEmail.addEventListener('blur', () => this.validateEmail(this.elements.signupEmail));
                this.elements.signupPassword.addEventListener('blur', () => this.validatePassword(this.elements.signupPassword));
                this.elements.loginEmail.addEventListener('blur', () => this.validateEmail(this.elements.loginEmail));
                this.elements.loginPassword.addEventListener('blur', () => this.validatePassword(this.elements.loginPassword));

                // Post Events
                this.elements.createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
                this.elements.postsContainer.addEventListener('click', (e) => this.handlePostAction(e));
                this.elements.searchInput.addEventListener('input', () => this.handleSearch());
                this.elements.sortSelect.addEventListener('change', () => this.handleSort());
                this.elements.clearFilters.addEventListener('click', () => this.clearFilters());

                // Theme Events
                this.elements.themeToggle.addEventListener('change', () => this.toggleTheme());
                this.elements.footerThemeToggle.addEventListener('change', () => this.toggleTheme());

                // Modal Events
                this.elements.editPostForm.addEventListener('submit', (e) => this.handleEditPost(e));
                this.elements.addCommentForm.addEventListener('submit', (e) => this.handleAddComment(e));
                this.elements.logoutBtn.addEventListener('click', () => this.showModal('logout-modal'));
                this.elements.confirmLogout.addEventListener('click', () => this.handleLogout());
                this.elements.cancelLogout.addEventListener('click', () => this.hideModal('logout-modal'));
                this.elements.cancelEdit.addEventListener('click', () => this.hideModal('edit-modal'));

                // Media Events
                this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
                this.elements.imageUrl.addEventListener('input', () => this.updateImagePreview());

                // Footer Events
                this.elements.scrollToTop.addEventListener('click', () => this.scrollToTop());
                this.elements.createPostFooter.addEventListener('click', () => this.scrollToCreatePost());

                // Emoji Events
                document.querySelectorAll('.emoji').forEach(emoji => {
                    emoji.addEventListener('click', (e) => {
                        const emojiChar = e.target.dataset.emoji;
                        this.insertEmoji(emojiChar);
                    });
                });

                // Close modals on outside click
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal')) {
                        this.hideModal(e.target.id);
                    }
                });

                // Initialize
                this.updateTime();
                setInterval(() => this.updateTime(), 1000);
            }

            init() {
                // Apply saved theme
                this.state.setTheme(this.state.theme);
                
                // Sync theme toggles
                this.elements.themeToggle.checked = this.state.theme === 'dark';
                this.elements.footerThemeToggle.checked = this.state.theme === 'dark';

                // Show appropriate view based on login state
                this.renderApp();
            }

            renderApp() {
                if (this.state.currentUser) {
                    this.showFeedView();
                } else {
                    this.showAuthView();
                }
            }

            showAuthView() {
                this.elements.authView.classList.add('active');
                this.elements.feedView.classList.remove('active');
                this.clearAuthForms();
            }

            showFeedView() {
                this.elements.authView.classList.remove('active');
                this.elements.feedView.classList.add('active');
                this.elements.welcomeUser.textContent = `Welcome, ${this.state.currentUser.name}!`;
                this.renderPosts();
            }

            clearAuthForms() {
                this.elements.loginForm.reset();
                this.elements.signupForm.reset();
                // Clear error states
                document.querySelectorAll('.input-error').forEach(el => {
                    el.classList.remove('input-error');
                });
                document.querySelectorAll('.error-message').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Validation Functions
            validateEmail(input) {
                const email = input.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isValid = emailRegex.test(email);
                
                this.toggleInputError(input, !isValid, 'Please enter a valid email address');
                return isValid;
            }

            validatePassword(input) {
                const password = input.value;
                // At least 8 characters, with letters and numbers
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
                const isValid = passwordRegex.test(password);
                
                this.toggleInputError(input, !isValid, 'Password must be at least 8 characters with letters and numbers');
                return isValid;
            }

            toggleInputError(input, hasError, message) {
                const errorElement = input.nextElementSibling;
                
                if (hasError) {
                    input.classList.add('input-error');
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                } else {
                    input.classList.remove('input-error');
                    errorElement.style.display = 'none';
                }
            }

            // Auth Handlers
            handleLogin(e) {
                e.preventDefault();
                
                // Validate inputs
                const isEmailValid = this.validateEmail(this.elements.loginEmail);
                const isPasswordValid = this.validatePassword(this.elements.loginPassword);
                
                if (!isEmailValid || !isPasswordValid) {
                    this.showNotification('Please fix the errors in the form', 'error');
                    return;
                }

                const email = this.elements.loginEmail.value.trim().toLowerCase();
                const password = this.elements.loginPassword.value;

                const user = this.state.users.find(u => 
                    u.email === email && u.password === password
                );

                if (user) {
                    this.state.setCurrentUser(user);
                    this.showFeedView();
                    this.showNotification('Welcome back! 🎉', 'success');
                } else {
                    this.showNotification('Invalid email or password', 'error');
                }
            }

            handleSignup(e) {
                e.preventDefault();
                
                // Validate inputs
                const isEmailValid = this.validateEmail(this.elements.signupEmail);
                const isPasswordValid = this.validatePassword(this.elements.signupPassword);
                const name = this.elements.signupName.value.trim();
                
                if (!name) {
                    this.toggleInputError(this.elements.signupName, true, 'Please enter your name');
                    return;
                } else {
                    this.toggleInputError(this.elements.signupName, false, '');
                }
                
                if (!isEmailValid || !isPasswordValid) {
                    this.showNotification('Please fix the errors in the form', 'error');
                    return;
                }

                const email = this.elements.signupEmail.value.trim().toLowerCase();
                const password = this.elements.signupPassword.value;

                if (this.state.users.find(u => u.email === email)) {
                    this.showNotification('User with this email already exists', 'error');
                    return;
                }

                const newUser = {
                    id: Date.now(),
                    name,
                    email,
                    password,
                    joined: Date.now()
                };

                this.state.addUser(newUser);
                this.state.setCurrentUser(newUser);
                this.showFeedView();
                this.showNotification('Account created successfully! 🎉', 'success');
            }

            handleLogout() {
                this.state.clearCurrentUser();
                this.hideModal('logout-modal');
                this.showAuthView();
                this.showNotification('See you soon! 👋', 'info');
            }

            // Post Handlers
            handleCreatePost(e) {
    e.preventDefault();
    const content = this.elements.postContent.value.trim();
    const imageUrl = this.elements.imageUrl.value.trim();
    const imageFile = this.elements.imageUpload.files[0];

    if (!content) {
        this.showNotification('Please write something to share! ✍️', 'error');
        return;
    }

    // Handle image upload from file
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageDataUrl = event.target.result;
            
            const newPost = {
                id: Date.now(),
                userId: this.state.currentUser.id,
                authorName: this.state.currentUser.name,
                text: content,
                imageUrl: imageDataUrl, // Use the uploaded image data URL
                timestamp: Date.now(),
                likes: [],
                comments: []
            };

            this.state.addPost(newPost);
            this.resetPostForm();
            this.renderPosts();
            this.showNotification('Achievement shared with image! 🎉', 'success');
        };
        reader.onerror = () => {
            this.showNotification('Error uploading image', 'error');
        };
        reader.readAsDataURL(imageFile);
    } else {
        // Handle URL or no image
        const newPost = {
            id: Date.now(),
            userId: this.state.currentUser.id,
            authorName: this.state.currentUser.name,
            text: content,
            imageUrl: imageUrl || null,
            timestamp: Date.now(),
            likes: [],
            comments: []
        };

        this.state.addPost(newPost);
        this.resetPostForm();
        this.renderPosts();
        this.showNotification('Achievement shared! 🎉', 'success');
    }
}

// Add this helper function to reset the form properly
resetPostForm() {
    this.elements.createPostForm.reset();
    this.elements.imagePreview.style.display = 'none';
    this.elements.imagePreview.innerHTML = '';
    // Clear the file input
    this.elements.imageUpload.value = '';
}

            handlePostAction(e) {
                const target = e.target.closest('[data-action]');
                if (!target) return;

                const postId = parseInt(target.closest('.post-card').dataset.id);
                const action = target.dataset.action;

                switch (action) {
                    case 'like':
                        this.handleLikePost(postId, target);
                        break;
                    case 'comment':
                        this.openCommentsModal(postId);
                        break;
                    case 'edit':
                        this.openEditModal(postId);
                        break;
                    case 'delete':
                        this.handleDeletePost(postId);
                        break;
                    case 'share':
                        this.handleSharePost(postId);
                        break;
                }
            }

            handleLikePost(postId, button) {
                this.state.toggleLike(postId, this.state.currentUser.id);
                this.renderPosts();
                
                // Add animation feedback
                button.classList.add('liked');
                setTimeout(() => {
                    button.classList.remove('liked');
                }, 600);
            }

            handleDeletePost(postId) {
                if (confirm('Are you sure you want to delete this post?')) {
                    this.state.deletePost(postId);
                    this.renderPosts();
                    this.showNotification('Post deleted', 'info');
                }
            }

            handleSharePost(postId) {
                const post = this.state.posts.find(p => p.id === postId);
                if (!post) return;

                const shareData = {
                    title: `Post by ${post.authorName}`,
                    text: post.text.substring(0, 100) + '...',
                    url: window.location.href
                };

                if (navigator.share) {
                    navigator.share(shareData).catch(console.error);
                } else {
                    navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
                    this.showNotification('Post copied to clipboard! 📋', 'success');
                }
            }

            // Edit Post Handlers
            openEditModal(postId) {
                const post = this.state.posts.find(p => p.id === postId);
                if (post && post.userId === this.state.currentUser.id) {
                    this.elements.editPostId.value = postId;
                    this.elements.editPostContent.value = post.text;
                    this.showModal('edit-modal');
                }
            }

            handleEditPost(e) {
                e.preventDefault();
                const postId = parseInt(this.elements.editPostId.value);
                const newText = this.elements.editPostContent.value.trim();

                if (!newText) {
                    this.showNotification('Post cannot be empty', 'error');
                    return;
                }

                this.state.updatePost(postId, { text: newText });
                this.hideModal('edit-modal');
                this.renderPosts();
                this.showNotification('Post updated successfully! ✨', 'success');
            }

            // Comment Handlers
            openCommentsModal(postId) {
                const post = this.state.posts.find(p => p.id === postId);
                if (post) {
                    this.elements.commentPostId.value = postId;
                    this.elements.commentsCount.textContent = post.comments?.length || 0;
                    
                    // Render post preview
                    this.elements.postPreview.innerHTML = this.createPostPreviewHTML(post);
                    
                    // Render comments
                    this.renderComments(post);
                    
                    this.showModal('comments-modal');
                }
            }

            createPostPreviewHTML(post) {
                return `
                    <div class="post-preview-content">
                        <div class="post-header">
                            <span class="post-author">${post.authorName}</span>
                            <span class="post-time">${this.formatTime(post.timestamp)}</span>
                        </div>
                        <div class="post-text">${post.text}</div>
                    </div>
                `;
            }

            renderComments(post) {
                const commentsHTML = (post.comments || [])
                    .map(comment => this.createCommentHTML(comment))
                    .join('');
                
                this.elements.commentsList.innerHTML = commentsHTML || 
                    '<div class="no-comments">No comments yet. Be the first to comment! 💬</div>';
            }

            createCommentHTML(comment) {
                const user = this.state.users.find(u => u.id === comment.userId);
                return `
                    <div class="comment-card">
                        <div class="comment-header">
                            <span class="comment-author">${user?.name || 'Unknown User'}</span>
                            <span class="comment-time">${this.formatTime(comment.timestamp)}</span>
                        </div>
                        <div class="comment-text">${comment.text}</div>
                    </div>
                `;
            }

            handleAddComment(e) {
                e.preventDefault();
                const postId = parseInt(this.elements.commentPostId.value);
                const text = this.elements.commentText.value.trim();

                if (!text) {
                    this.showNotification('Please write a comment', 'error');
                    return;
                }

                const newComment = {
                    id: Date.now(),
                    userId: this.state.currentUser.id,
                    text,
                    timestamp: Date.now()
                };

                this.state.addComment(postId, newComment);
                this.elements.commentText.value = '';
                
                // Update UI
                const post = this.state.posts.find(p => p.id === postId);
                this.renderComments(post);
                this.elements.commentsCount.textContent = post.comments.length;
                this.renderPosts(); // Update comment count in feed
            }

            // Filter Handlers
            handleSearch() {
                this.state.filters.search = this.elements.searchInput.value;
                this.renderPosts();
            }

            handleSort() {
                this.state.filters.sort = this.elements.sortSelect.value;
                this.renderPosts();
            }

            clearFilters() {
                this.elements.searchInput.value = '';
                this.elements.sortSelect.value = 'latest';
                this.state.filters.search = '';
                this.state.filters.sort = 'latest';
                this.renderPosts();
                this.showNotification('Filters cleared', 'info');
            }

            // Theme Handler
            toggleTheme() {
                const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
                this.state.setTheme(newTheme);
                this.elements.themeToggle.checked = newTheme === 'dark';
                this.elements.footerThemeToggle.checked = newTheme === 'dark';
            }

            // Media Handlers
            handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            this.showNotification('Please select an image file', 'error');
            this.elements.imageUpload.value = ''; // Clear the input
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size should be less than 5MB', 'error');
            this.elements.imageUpload.value = ''; // Clear the input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.elements.imagePreview.innerHTML = 
                `<img src="${event.target.result}" alt="Preview" class="preview-image">`;
            this.elements.imagePreview.style.display = 'block';
            
            // Clear URL input when file is selected
            this.elements.imageUrl.value = '';
        };
        reader.onerror = () => {
            this.showNotification('Error loading image', 'error');
        };
        reader.readAsDataURL(file);
    } else {
        // Hide preview if no file selected
        this.elements.imagePreview.style.display = 'none';
        this.elements.imagePreview.innerHTML = '';
    }
}

            updateImagePreview() {
                const url = this.elements.imageUrl.value.trim();
                if (url) {
                    this.elements.imagePreview.innerHTML = 
                        `<img src="${url}" alt="Preview" onerror="this.style.display='none'">`;
                    this.elements.imagePreview.style.display = 'block';
                } else if (!this.elements.imageUpload.files[0]) {
                    this.elements.imagePreview.style.display = 'none';
                }
            }

            // Render Methods
            renderPosts() {
                const filteredPosts = this.state.getFilteredPosts();
                
                if (filteredPosts.length === 0) {
                    this.elements.postsContainer.innerHTML = `
                        <div class="card no-posts">
                            <div class="no-posts-content">
                                <i class="fas fa-inbox"></i>
                                <h3>No posts found</h3>
                                <p>${this.state.filters.search ? 'Try adjusting your search terms' : 'Be the first to share an achievement! 🎉'}</p>
                            </div>
                        </div>
                    `;
                    return;
                }

                this.elements.postsContainer.innerHTML = filteredPosts
                    .map(post => this.createPostHTML(post))
                    .join('');
            }

            createPostHTML(post) {
                const isLiked = post.likes.includes(this.state.currentUser.id);
                const isOwner = post.userId === this.state.currentUser.id;
                const likeIcon = isLiked ? 'fas' : 'far';
                const likeClass = isLiked ? 'liked' : '';

                return `
                    <div class="post-card card" data-id="${post.id}">
                        <div class="post-header">
                            <span class="post-author">${post.authorName}</span>
                            <span class="post-time">${this.formatTime(post.timestamp)}</span>
                        </div>
                        
                        <div class="post-content">
                            <div class="post-text">${post.text}</div>
                            ${post.imageUrl ? `
                                <img src="${post.imageUrl}" alt="Post image" class="post-image" 
                                     onerror="this.style.display='none'">
                            ` : ''}
                        </div>
                        
                        <div class="post-actions">
                            <div class="action-buttons">
                                <button class="action-btn ${likeClass}" data-action="like">
                                    <i class="${likeIcon} fa-heart"></i>
                                    <span>${post.likes.length}</span>
                                </button>
                                <button class="action-btn" data-action="comment">
                                    <i class="far fa-comment"></i>
                                    <span>${post.comments?.length || 0}</span>
                                </button>
                                <button class="action-btn" data-action="share">
                                    <i class="fas fa-share"></i>
                                    <span>Share</span>
                                </button>
                            </div>
                            
                            ${isOwner ? `
                                <div class="owner-actions">
                                    <button class="btn btn-outline btn-sm" data-action="edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline btn-sm" data-action="delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            // Utility Methods
            formatTime(timestamp) {
                const now = Date.now();
                const diff = now - timestamp;
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);

                if (days > 7) {
                    return new Date(timestamp).toLocaleDateString();
                } else if (days > 0) {
                    return `${days}d ago`;
                } else if (hours > 0) {
                    return `${hours}h ago`;
                } else if (minutes > 0) {
                    return `${minutes}m ago`;
                } else {
                    return 'Just now';
                }
            }

            showNotification(message, type = 'info') {
                // Remove existing notification
                const existingNotification = document.querySelector('.notification');
                if (existingNotification) {
                    existingNotification.remove();
                }

                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.innerHTML = `
                    <div class="notification-content">
                        <span>${message}</span>
                    </div>
                `;

                document.body.appendChild(notification);

                // Animate in
                setTimeout(() => {
                    notification.style.transform = 'translateX(0)';
                    notification.style.opacity = '1';
                }, 100);

                // Auto remove after 3 seconds
                setTimeout(() => {
                    notification.style.transform = 'translateX(400px)';
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }

            switchAuthTab(clickedTab) {
                this.elements.authTabs.forEach(tab => tab.classList.remove('active'));
                clickedTab.classList.add('active');

                const isLogin = clickedTab.dataset.tab === 'login';
                this.elements.loginForm.classList.toggle('active', isLogin);
                this.elements.signupForm.classList.toggle('active', !isLogin);
            }

            showModal(modalId) {
                const modal = document.getElementById(modalId);
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            hideModal(modalId) {
                const modal = document.getElementById(modalId);
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }

            insertEmoji(emoji) {
                const textarea = this.elements.postContent;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                
                textarea.value = text.substring(0, start) + emoji + text.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
                
                // Add animation feedback
                textarea.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    textarea.style.transform = 'scale(1)';
                }, 200);
            }

            updateTime() {
                const now = new Date();
                this.elements.currentTime.textContent = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }

            scrollToTop() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            scrollToCreatePost() {
                const postSection = document.querySelector('.create-post-section');
                postSection.scrollIntoView({ behavior: 'smooth' });
                this.elements.postContent.focus();
            }
        }

        // ===== Initialize App =====
        document.addEventListener('DOMContentLoaded', () => {
            new ShareToInspireApp();
        });
