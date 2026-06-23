// ===== VARIABLES =====
let quotes = [];
let quoteInterval;
let allPosts = [];
let postsPerPage = 5;
let currentPage = 1;
let currentFilter = 'all';

// ===== USER MANAGEMENT =====
function registerUser() {
    let username, password, confirmPassword;
    
    if (document.getElementById('regUsername')) {
        username = document.getElementById('regUsername').value.trim();
        password = document.getElementById('regPassword').value;
        confirmPassword = document.getElementById('regConfirmPassword').value;
    } else if (document.getElementById('username')) {
        username = document.getElementById('username').value.trim();
        password = document.getElementById('password').value;
        confirmPassword = null;
    } else {
        showAlert('Registration form not found', 'error');
        return;
    }

    if (!username || !password) {
        showAlert('Please enter username and password', 'error');
        return;
    }

    if (confirmPassword && password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.username === username)) {
        showAlert('Username already exists', 'error');
        return;
    }

    users.push({ 
        username: username, 
        password: password, 
        createdAt: new Date().toISOString(),
        role: 'member'
    });
    
    localStorage.setItem('users', JSON.stringify(users));
    showAlert('Account created successfully! Please login.', 'success');
    
    // Switch to login tab if exists
    if (typeof switchTab === 'function') {
        switchTab('login');
    }
    
    // Clear password fields
    if (document.getElementById('regPassword')) {
        document.getElementById('regPassword').value = '';
        if (document.getElementById('regConfirmPassword')) {
            document.getElementById('regConfirmPassword').value = '';
        }
    }
}

function loginUser() {
    let username, password;
    
    if (document.getElementById('loginUsername')) {
        username = document.getElementById('loginUsername').value.trim();
        password = document.getElementById('loginPassword').value;
    } else if (document.getElementById('username')) {
        username = document.getElementById('username').value.trim();
        password = document.getElementById('password').value;
    } else {
        showAlert('Login form not found', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showAlert('Invalid username or password', 'error');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Check if user is admin
    if (user.username === 'admin' || user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'home.html';
    }
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ===== ADMIN FUNCTIONS =====
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    const sectionElement = document.getElementById(section + 'Section');
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Update active nav
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the clicked link
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

async function saveAdminUpdates() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user || (user.role !== 'admin' && user.username !== 'admin')) {
        showAlert('Admin access required', 'error');
        return;
    }
    
    const title = document.getElementById('adminTitle')?.value?.trim();
    const content = document.getElementById('adminContent')?.value?.trim();
    
    if (!title || !content) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    try {
        // Get current updates
        let updates = JSON.parse(localStorage.getItem('adminUpdates') || '[]');
        
        // Add new update
        const newUpdate = {
            id: Date.now(),
            title: title,
            content: content,
            date: new Date().toISOString().split('T')[0],
            author: user.username,
            timestamp: new Date().toISOString(),
            pinned: document.getElementById('adminPin')?.checked || false
        };
        
        updates.unshift(newUpdate);
        
        // Save to localStorage
        localStorage.setItem('adminUpdates', JSON.stringify(updates));
        
        showAlert('Update saved successfully!', 'success');
        
        // Clear form
        if (document.getElementById('adminTitle')) {
            document.getElementById('adminTitle').value = '';
            document.getElementById('adminContent').value = '';
        }
        
        // Refresh updates list
        loadExistingUpdates();
        
    } catch (error) {
        console.error('Error saving update:', error);
        showAlert('Failed to save update', 'error');
    }
}

async function loadExistingUpdates() {
    try {
        const updates = JSON.parse(localStorage.getItem('adminUpdates') || '[]');
        const list = document.getElementById('updatesList');
        
        if (!list) return;
        
        if (updates.length === 0) {
            list.innerHTML = '<p>No updates yet.</p>';
            return;
        }
        
        let updatesHTML = '';
        
        updates.forEach(update => {
            updatesHTML += `
                <div class="update-item card">
                    <div class="update-header">
                        <h4>${update.title} ${update.pinned ? '📌' : ''}</h4>
                        <div class="update-actions">
                            <button onclick="editUpdate(${update.id})" class="btn-small">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUpdate(${update.id})" class="btn-small btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p>${update.content.substring(0, 100)}...</p>
                    <small>By ${update.author} on ${formatDate(update.date)}</small>
                </div>
            `;
        });
        
        list.innerHTML = updatesHTML;
        
    } catch (error) {
        console.error('Error loading updates:', error);
    }
}

function editUpdate(updateId) {
    showAlert(`Editing update ${updateId} (demo mode)`, 'info');
}

function deleteUpdate(updateId) {
    if (confirm('Delete this update?')) {
        let updates = JSON.parse(localStorage.getItem('adminUpdates') || '[]');
        updates = updates.filter(update => update.id !== updateId);
        localStorage.setItem('adminUpdates', JSON.stringify(updates));
        loadExistingUpdates();
        showAlert('Update deleted', 'success');
    }
}

async function loadExistingAds() {
    try {
        const res = await fetch('./assets/json/ads.json');
        const ads = await res.json();
        
        const container = document.getElementById('adsContainer');
        if (!container) return;
        
        if (ads.length === 0) {
            container.innerHTML = '<p>No ads yet.</p>';
            return;
        }
        
        let adsHTML = '';
        
        ads.forEach(ad => {
            adsHTML += `
                <div class="ad-item card ${ad.active ? 'active' : 'inactive'}">
                    <div class="ad-header">
                        <h4>${ad.title} ${ad.active ? '✅' : '❌'}</h4>
                        <div class="ad-actions">
                            <button onclick="toggleAd(${ad.id})" class="btn-small">
                                ${ad.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onclick="deleteAd(${ad.id})" class="btn-small btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p>${ad.text}</p>
                    <small>Link: ${ad.link}</small>
                </div>
            `;
        });
        
        container.innerHTML = adsHTML;
        
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

async function loadExistingQuotes() {
    try {
        const res = await fetch('./assets/json/quotes.json');
        const quotes = await res.json();
        
        const list = document.getElementById('quotesList');
        if (!list) return;
        
        if (quotes.length === 0) {
            list.innerHTML = '<p>No quotes yet.</p>';
            return;
        }
        
        let quotesHTML = '';
        
        quotes.forEach((quote, index) => {
            quotesHTML += `
                <div class="quote-item card">
                    <div class="quote-header">
                        <h4>Quote #${index + 1}</h4>
                        <div class="quote-actions">
                            <button onclick="deleteQuote(${index})" class="btn-small btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p>"${quote.quote || quote}"</p>
                    <small>— ${quote.author || 'Unknown'} ${quote.anime ? '(' + quote.anime + ')' : ''}</small>
                </div>
            `;
        });
        
        list.innerHTML = quotesHTML;
        
    } catch (error) {
        console.error('Error loading quotes:', error);
    }
}

function toggleAd(adId) {
    showAlert(`Ad ${adId} toggled (demo mode)`, 'info');
    loadExistingAds();
}

function deleteAd(adId) {
    if (confirm('Delete this ad?')) {
        showAlert(`Ad ${adId} deleted (demo mode)`, 'success');
        loadExistingAds();
    }
}

function deleteQuote(index) {
    if (confirm('Delete this quote?')) {
        showAlert(`Quote ${index + 1} deleted (demo mode)`, 'success');
        loadExistingQuotes();
    }
}

function createNewAd() {
    const title = document.getElementById('adTitle')?.value?.trim();
    const text = document.getElementById('adText')?.value?.trim();
    const link = document.getElementById('adLink')?.value?.trim();
    const buttonText = document.getElementById('adButtonText')?.value?.trim();
    const active = document.getElementById('adActive')?.checked || false;
    const manual = document.getElementById('adManual')?.checked || false;
    
    if (!title || !text || !link) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    showAlert('Ad created successfully (demo mode)', 'success');
    
    // Clear form
    if (document.getElementById('adTitle')) {
        document.getElementById('adTitle').value = '';
        document.getElementById('adText').value = '';
        document.getElementById('adLink').value = '';
        document.getElementById('adButtonText').value = '';
    }
    
    loadExistingAds();
}

function addNewQuote() {
    const quote = document.getElementById('quoteText')?.value?.trim();
    const author = document.getElementById('quoteAuthor')?.value?.trim();
    const anime = document.getElementById('quoteAnime')?.value?.trim();
    
    if (!quote || !author || !anime) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    showAlert('Quote added successfully (demo mode)', 'success');
    
    // Clear form
    if (document.getElementById('quoteText')) {
        document.getElementById('quoteText').value = '';
        document.getElementById('quoteAuthor').value = '';
        document.getElementById('quoteAnime').value = '';
    }
    
    loadExistingQuotes();
}

async function loadAdminStats() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
        
        document.getElementById('statUsers').textContent = users.length;
        document.getElementById('statUpdates').textContent = posts.length;
        
        // Load ads count
        const res = await fetch('./assets/json/ads.json');
        const ads = await res.json();
        const activeAds = ads.filter(ad => ad.active).length;
        document.getElementById('statAds').textContent = activeAds;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const updates = JSON.parse(localStorage.getItem('adminUpdates') || '[]');
        const activityList = document.getElementById('recentActivity');
        
        if (!activityList) return;
        
        const recent = updates.slice(0, 3);
        
        if (recent.length === 0) {
            activityList.innerHTML = '<p>No recent activity.</p>';
            return;
        }
        
        let activityHTML = '';
        
        recent.forEach(update => {
            activityHTML += `
                <div class="activity-item">
                    <strong>${update.title}</strong>
                    <small>${formatDate(update.date)}</small>
                </div>
            `;
        });
        
        activityList.innerHTML = activityHTML;
        
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// ===== COMMUNITY POSTS =====
function createPost() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showAlert('Please login to create a post', 'error');
        window.location.href = 'index.html';
        return;
    }

    const content = document.getElementById('newPostContent')?.value?.trim();
    const category = document.getElementById('postCategory')?.value || 'general';

    if (!content) {
        showAlert('Please enter some content for your post', 'warning');
        return;
    }

    // Create post object
    const newPost = {
        id: Date.now(),
        title: content.length > 50 ? content.substring(0, 50) + '...' : content,
        content: content,
        author: user.username,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        category: category,
        pinned: false,
        likes: 0,
        comments: [],
        views: 0,
        avatar: getAvatar(user.username)
    };

    // Get existing posts
    let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    
    // Add new post at the beginning
    posts.unshift(newPost);
    
    // Save back to localStorage
    localStorage.setItem('communityPosts', JSON.stringify(posts));

    // Clear the textarea
    if (document.getElementById('newPostContent')) {
        document.getElementById('newPostContent').value = '';
    }

    // Show success message
    showAlert('Post created successfully!', 'success');

    // Reload the page to show new post
    setTimeout(() => {
        if (window.location.pathname.includes('community.html')) {
            window.location.reload();
        }
    }, 1000);
}

function getAvatar(username) {
    if (!username) return '😊';
    const avatars = ['😊', '😎', '🤖', '👑', '🐱', '🐉', '⚡', '🌟', '🎮', '💎'];
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatars[hash % avatars.length];
}

function likePost(postId) {
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        if (!posts[postIndex].likes) posts[postIndex].likes = 0;
        posts[postIndex].likes++;
        localStorage.setItem('communityPosts', JSON.stringify(posts));
        
        // Update UI
        const likeBtn = document.querySelector(`[data-id="${postId}"] .stat-btn:first-child`);
        if (likeBtn) {
            likeBtn.innerHTML = `<i class="far fa-heart"></i> ${posts[postIndex].likes}`;
        }
    }
}

function viewPost(postId) {
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (post) {
        // Update view count
        if (!post.views) post.views = 0;
        post.views++;
        localStorage.setItem('communityPosts', JSON.stringify(posts));
        
        // Show modal with post details
        showPostModal(post);
    }
}

function showPostModal(post) {
    // Create modal if it doesn't exist
    if (!document.getElementById('postModal')) {
        const modal = document.createElement('div');
        modal.id = 'postModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="closeModal()">&times;</span>
                <div id="modalContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const modal = document.getElementById('postModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modalContent) return;
    
    const timeAgo = getTimeAgo(post.timestamp);
    
    modalContent.innerHTML = `
        <div class="modal-post">
            <div class="modal-header">
                <div class="post-author">
                    <div class="author-avatar">${post.avatar}</div>
                    <div class="author-info">
                        <strong>${post.author}</strong>
                        <small>${timeAgo} • ${post.category}</small>
                    </div>
                </div>
                ${post.pinned ? '<span class="pin-badge"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
            </div>
            
            <div class="modal-body">
                <h2>${post.title}</h2>
                <div class="post-full-content">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="post-stats">
                    <button class="stat-btn" onclick="likePost(${post.id})">
                        <i class="far fa-heart"></i> ${post.likes || 0}
                    </button>
                    <span class="stat-btn">
                        <i class="far fa-eye"></i> ${post.views || 0}
                    </span>
                </div>
                
                <div class="comment-section">
                    <h4>Comments (${post.comments ? post.comments.length : 0})</h4>
                    <div class="add-comment">
                        <textarea id="commentText${post.id}" placeholder="Add a comment..."></textarea>
                        <button onclick="addComment(${post.id})" class="btn-primary">Post Comment</button>
                    </div>
                    <div id="commentsContainer${post.id}">
                        ${renderComments(post.comments || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('postModal');
    if (modal) {
                modal.style.display = 'none';
    }
}

function addComment(postId) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        showAlert('Please login to comment', 'error');
        return;
    }

    const commentText = document.getElementById(`commentText${postId}`)?.value?.trim();
    if (!commentText) {
        showAlert('Please enter a comment', 'warning');
        return;
    }

    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        if (!posts[postIndex].comments) {
            posts[postIndex].comments = [];
        }
        
        const newComment = {
            id: Date.now(),
            author: user.username,
            content: commentText,
            timestamp: new Date().toISOString(),
            avatar: getAvatar(user.username)
        };
        
        posts[postIndex].comments.push(newComment);
        localStorage.setItem('communityPosts', JSON.stringify(posts));
        
        // Clear textarea
        const textarea = document.getElementById(`commentText${postId}`);
        if (textarea) textarea.value = '';
        
        // Update comments display
        const commentsContainer = document.getElementById(`commentsContainer${postId}`);
        if (commentsContainer) {
            commentsContainer.innerHTML = renderComments(posts[postIndex].comments);
        }
        
        showAlert('Comment added!', 'success');
    }
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <div class="comment-author">
                <div class="comment-avatar">${comment.avatar}</div>
                <div class="comment-info">
                    <strong>${comment.author}</strong>
                    <small>${getTimeAgo(comment.timestamp)}</small>
                </div>
            </div>
            <p>${comment.content}</p>
        </div>
    `).join('');
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
}

async function loadCommunityData() {
    try {
        // Load posts from localStorage
        let posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
        
        // Load updates from JSON file and add to posts
        const response = await fetch('./assets/json/updates.json');
        const updates = await response.json();
        
        // Convert updates to posts format
        const updatePosts = updates.map(update => ({
            id: update.id || Date.now(),
            title: update.title,
            content: update.content,
            author: update.author || 'admin',
            date: update.date,
            timestamp: update.timestamp || new Date(update.date).toISOString(),
            category: 'announcements',
            pinned: update.pinned || false,
            likes: update.likes || Math.floor(Math.random() * 50),
            comments: [],
            views: Math.floor(Math.random() * 1000),
            avatar: getAvatar(update.author || 'admin')
        }));
        
        // Merge posts and updates, remove duplicates
        const existingIds = new Set(posts.map(p => p.id));
        updatePosts.forEach(update => {
            if (!existingIds.has(update.id)) {
                posts.unshift(update);
                existingIds.add(update.id);
            }
        });
        
        // Save back to localStorage for persistence
        localStorage.setItem('communityPosts', JSON.stringify(posts));
        
        // Sort by timestamp (newest first)
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return posts;
        
    } catch (error) {
        console.error('Error loading community data:', error);
        return JSON.parse(localStorage.getItem('communityPosts') || '[]');
    }
}

function filterPosts(category) {
    // Update active category
    document.querySelectorAll('.category-list li').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    currentFilter = category;
    currentPage = 1;
    displayAllPosts();
}

function searchTag(tag) {
    const textarea = document.getElementById('newPostContent');
    if (textarea) {
        textarea.value = (textarea.value + ' ' + tag).trim();
        textarea.focus();
    }
}

function sharePost(postId) {
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    const post = posts.find(p => p.id === postId);
    
    if (post && navigator.share) {
        navigator.share({
            title: post.title,
            text: post.content.substring(0, 100),
            url: window.location.href
        });
    } else {
        // Fallback: Copy to clipboard
        const text = `${post.title}\n\n${post.content.substring(0, 200)}...\n\nShared from AniVerse Community`;
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Post copied to clipboard!', 'success');
        });
    }
}

function updateCommunityStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    
    const totalMembers = document.getElementById('totalMembers');
    const totalPosts = document.getElementById('totalPosts');
    
    if (totalMembers) totalMembers.textContent = users.length;
    if (totalPosts) totalPosts.textContent = posts.length;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

async function initializeCommunityPage() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) {
        window.location.href = 'index.html';
        return;
    }

    // Set username display
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userGreeting = document.getElementById('userGreeting');
    
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username;
    }
    
    if (userGreeting) {
        userGreeting.innerHTML = `Welcome, <strong>${user.username || 'Guest'}</strong>`;
    }

    // Load and display posts
    allPosts = await loadCommunityData();
    displayAllPosts();
    updateCommunityStats();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('postModal');
        if (event.target === modal) {
            closeModal();
        }
    };
}

function displayAllPosts() {
    const container = document.getElementById('communityFeed');
    if (!container) return;
    
    // Filter posts based on current filter
    let filteredPosts = allPosts;
    if (currentFilter !== 'all') {
        filteredPosts = allPosts.filter(post => post.category === currentFilter);
    }
    
    // Sort posts based on selected option
    const sortOption = document.getElementById('sortPosts')?.value || 'newest';
    filteredPosts.sort((a, b) => {
        if (sortOption === 'newest') {
            return new Date(b.timestamp) - new Date(a.timestamp);
        } else if (sortOption === 'oldest') {
            return new Date(a.timestamp) - new Date(b.timestamp);
        } else if (sortOption === 'popular') {
            return (b.likes + (b.comments?.length || 0)) - (a.likes + (a.comments?.length || 0));
        }
        return 0;
    });
    
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);
    
    if (postsToShow.length === 0) {
        if (currentPage === 1) {
            container.innerHTML = '<div class="no-posts">No posts found. Be the first to post!</div>';
        } else {
            container.innerHTML += '<div class="no-more-posts">No more posts to load.</div>';
        }
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    let postsHTML = '';
    
    postsToShow.forEach(post => {
        const timeAgo = getTimeAgo(post.timestamp);
        const isPinned = post.pinned ? 'pinned' : '';
        
        postsHTML += `
            <div class="community-post card ${isPinned}" data-id="${post.id}" data-category="${post.category}">
                <div class="post-header">
                    <div class="post-author">
                        <div class="author-avatar">${post.avatar || '😊'}</div>
                        <div class="author-info">
                            <strong>${post.author || 'Unknown'}</strong>
                            <small>${timeAgo} • ${post.category || 'general'}</small>
                        </div>
                    </div>
                    ${post.pinned ? '<span class="pin-badge"><i class="fas fa-thumbtack"></i> Pinned</span>' : ''}
                </div>
                
                <div class="post-content">
                    <h4 onclick="viewPost(${post.id})" style="cursor: pointer;">${post.title || 'Untitled'}</h4>
                    <p>${truncateText(post.content || '', 200)}</p>
                    ${post.content && post.content.length > 200 ? `<button onclick="viewPost(${post.id})" class="read-more">Read more</button>` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <button class="stat-btn" onclick="likePost(${post.id})">
                            <i class="far fa-heart"></i> ${post.likes || 0}
                        </button>
                        <button class="stat-btn" onclick="viewPost(${post.id})">
                            <i class="far fa-comment"></i> ${post.comments ? post.comments.length : 0}
                        </button>
                        <button class="stat-btn" onclick="sharePost(${post.id})">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (currentPage === 1) {
        container.innerHTML = postsHTML;
    } else {
        container.innerHTML += postsHTML;
    }
    
    // Show/hide load more button
    const totalFiltered = filteredPosts.length;
    const hasMore = endIndex < totalFiltered;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    }
}

function sortPosts() {
    currentPage = 1;
    displayAllPosts();
}

function loadMorePosts() {
    currentPage++;
    displayAllPosts();
}

// ===== ANIME QUOTES =====
async function loadQuotes() {
    try {
        const res = await fetch('./assets/json/quotes.json');
        if (!res.ok) throw new Error('Failed to load quotes');
        
        quotes = await res.json();
        showQuote();
        
        // Clear existing interval
        if (quoteInterval) clearInterval(quoteInterval);
        
        // Set new interval for auto-refresh (every 30 seconds)
        quoteInterval = setInterval(showQuote, 30000);
        
        // Add click to change quote functionality
        const display = document.getElementById('quoteDisplay');
        if (display) {
            display.style.cursor = 'pointer';
            display.title = 'Click for new quote';
            display.onclick = showQuote;
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        showAlert('Failed to load quotes', 'error');
    }
}

function showQuote() {
    if (!quotes || quotes.length === 0) {
        return;
    }
    
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];
    const display = document.getElementById('quoteDisplay');
    
    if (!display) return;
    
    // Add fade animation
    display.style.opacity = '0';
    
    setTimeout(() => {
        let quoteHTML = '';
        
        if (typeof quote === 'object') {
            // If quotes are objects with quote and author properties
            quoteHTML = `
                <div class="quote-card">
                    <i class="fas fa-quote-left"></i>
                    <p class="quote-text">"${quote.quote}"</p>
                    <p class="quote-author">— ${quote.author}</p>
                    ${quote.anime ? `<small class="quote-anime">${quote.anime}</small>` : ''}
                    <i class="fas fa-quote-right"></i>
                </div>
            `;
        } else {
            // If quotes are simple strings
            quoteHTML = `
                <div class="quote-card">
                    <i class="fas fa-quote-left"></i>
                    <p class="quote-text">${quote}</p>
                    <i class="fas fa-quote-right"></i>
                </div>
            `;
        }
        
        display.innerHTML = quoteHTML;
        display.style.opacity = '1';
    }, 300);
}

function showHomeQuote() {
    if (!quotes || quotes.length === 0) return;
    
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];
    const display = document.getElementById('homeQuoteDisplay');
    
    if (!display) return;
    
    if (typeof quote === 'object') {
        display.innerHTML = `
            <div class="quote-preview">
                <p class="quote-text">"${quote.quote.substring(0, 100)}..."</p>
                <p class="quote-author">— ${quote.author}</p>
            </div>
        `;
    } else {
        display.innerHTML = `
            <div class="quote-preview">
                <p class="quote-text">"${quote.substring(0, 100)}..."</p>
            </div>
        `;
    }
}

// ===== AD SYSTEM =====
async function loadAd() {
    try {
        const res = await fetch('./assets/json/ads.json');
        if (!res.ok) throw new Error('Failed to load ad');
        
        const ads = await res.json();
        const activeAd = ads.find(ad => ad.active) || ads[0];
        
        if (activeAd && !localStorage.getItem(`ad_shown_${activeAd.id}`)) {
            displayAd(activeAd);
        }
    } catch (error) {
        console.error('Error loading ad:', error);
    }
}

function displayAd(ad) {
    // Create popup if it doesn't exist
    if (!document.getElementById('adPopup')) {
        const popup = document.createElement('div');
        popup.id = 'adPopup';
        popup.className = 'ad-popup';
        popup.innerHTML = `
            <div class="ad-content">
                <span class="close-ad" onclick="closeAd()">&times;</span>
                <h3 id="adTitle"></h3>
                <p id="adText"></p>
                <a id="adLink" class="ad-btn" target="_blank">Learn More</a>
            </div>
        `;
        document.body.appendChild(popup);
    }
    
    const popup = document.getElementById('adPopup');
    const title = document.getElementById('adTitle');
    const text = document.getElementById('adText');
    const link = document.getElementById('adLink');
    
    if (title) title.textContent = ad.title;
    if (text) text.textContent = ad.text;
    if (link) {
        link.href = ad.link;
        link.textContent = ad.buttonText || 'Learn More';
    }
    
    if (popup) popup.style.display = 'flex';
    localStorage.setItem(`ad_shown_${ad.id}`, 'true');
    
    // Auto close after 10 seconds
    setTimeout(() => {
        if (popup && popup.style.display === 'flex') {
            closeAd();
        }
    }, 10000);
}

function closeAd() {
    const popup = document.getElementById('adPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function showAd(manual = false) {
    // For manual trigger, show immediately
    if (manual) {
        fetch('./assets/json/ads.json')
            .then(res => res.json())
            .then(ads => {
                const ad = ads.find(a => a.manual === true) || ads[0];
                displayAd(ad);
            });
    } else {
        loadAd();
    }
}

// ===== UTILITY FUNCTIONS =====
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${type === 'success' ? '#00ff7f' : 
                     type === 'error' ? '#ff4081' : 
                     type === 'warning' ? '#ffaa00' : '#6a0dad'};
        color: ${type === 'success' ? '#000' : '#fff'};
        z-index: 10000;
        animation: slideIn 0.3s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        font-weight: 500;
    `;
    
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
    if (!document.querySelector('.tab-btn')) return;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if(tab === 'login') {
        const loginBtn = document.querySelector('.tab-btn:nth-child(1)');
        const loginForm = document.getElementById('loginForm');
        if (loginBtn) loginBtn.classList.add('active');
        if (loginForm) loginForm.classList.add('active');
    } else {
        const registerBtn = document.querySelector('.tab-btn:nth-child(2)');
        const registerForm = document.getElementById('registerForm');
        if (registerBtn) registerBtn.classList.add('active');
        if (registerForm) registerForm.classList.add('active');
    }
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element?.value || element?.textContent;
    
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showAlert('Failed to copy', 'error');
    });
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
        // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    
    // Update username display on home page
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay && currentUser) {
        const user = JSON.parse(currentUser);
        usernameDisplay.textContent = user.username;
    }
    
    // Load appropriate content based on page
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
        // Login page initialization
        setTimeout(loadAd, 2000);
        
        // Auto-switch to login tab
        if (typeof switchTab === 'function') {
            setTimeout(() => switchTab('login'), 100);
        }
    } else if (window.location.pathname.includes('home.html')) {
        // Home page initialization
        setTimeout(loadAd, 2000);
        
        // Check if user is admin
        if (currentUser) {
            const user = JSON.parse(currentUser);
            const adminAccess = document.getElementById('adminAccess');
            if (adminAccess && (user.role === 'admin' || user.username === 'admin')) {
                adminAccess.style.display = 'block';
            }
        }
        
        // Load home quote
        setTimeout(() => {
            loadQuotes().then(() => {
                showHomeQuote();
            });
        }, 500);
        
    } else if (window.location.pathname.includes('community.html')) {
        // Community page initialization
        initializeCommunityPage();
    } else if (window.location.pathname.includes('quotes.html')) {
        // Quotes page initialization
        loadQuotes();
    } else if (window.location.pathname.includes('admin.html')) {
        // Admin page initialization
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        const user = JSON.parse(currentUser);
        if (user.role !== 'admin' && user.username !== 'admin') {
            window.location.href = 'home.html';
            return;
        }
        
        // Initialize admin page
        initializeAdminPage();
    } else if (window.location.pathname.includes('payment.html')) {
        // Payment page - no special initialization needed
    }
});

// ===== ADMIN PAGE INITIALIZATION =====
function initializeAdminPage() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Set admin username
    const adminUsername = document.getElementById('adminUsername');
    if (adminUsername) {
        adminUsername.textContent = user.username;
    }
    
    // Load admin data
    loadAdminStats();
    loadRecentActivity();
    loadExistingUpdates();
    loadExistingAds();
    loadExistingQuotes();
    
    // Show dashboard section by default
    showSection('dashboard');
}

// Initialize admin stats
function loadAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const posts = JSON.parse(localStorage.getItem('communityPosts') || '[]');
    
    const statUsers = document.getElementById('statUsers');
    const statUpdates = document.getElementById('statUpdates');
    const statAds = document.getElementById('statAds');
    
    if (statUsers) statUsers.textContent = users.length;
    if (statUpdates) statUpdates.textContent = posts.length;
    
    // Load ads count
    fetch('./assets/json/ads.json')
        .then(res => res.json())
        .then(ads => {
            const activeAds = ads.filter(ad => ad.active).length;
            if (statAds) statAds.textContent = activeAds;
        })
        .catch(() => {
            if (statAds) statAds.textContent = '0';
        });
}

// Load recent activity
function loadRecentActivity() {
    const updates = JSON.parse(localStorage.getItem('adminUpdates') || '[]');
    const activityList = document.getElementById('recentActivity');
    
    if (!activityList) return;
    
    const recent = updates.slice(0, 3);
    
    if (recent.length === 0) {
        activityList.innerHTML = '<p>No recent activity.</p>';
        return;
    }
    
    let activityHTML = '';
    
    recent.forEach(update => {
        activityHTML += `
            <div class="activity-item">
                <strong>${update.title}</strong>
                <small>${formatDate(update.date)}</small>
            </div>
        `;
    });
    
    activityList.innerHTML = activityHTML;
}
// ===== AUTO-CREATE ADMIN USER =====
// This ensures there's always an admin user
document.addEventListener('DOMContentLoaded', function() {
    // Create admin user if it doesn't exist
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const adminExists = users.some(u => u.username === 'admin');
        
        if (!adminExists) {
            users.push({
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Admin user created: admin / admin123');
        }
    }, 1000);
});