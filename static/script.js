// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Hide splash screen after animation
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.display = 'none';
        }
    }, 3000);
    
    // Initialize all features
    initNavigation();
    initTooltips();
    setupQuickTests();
    setupAjaxForm();
    setupStatsRefresh();
    observeNewRows();
    initSmoothScroll();
});

// Navigation toggle for mobile
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });

    // Highlight active section on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = '#' + section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === current) {
                link.classList.add('active');
            }
        });
    });
}

// Quick test buttons functionality
function setupQuickTests() {
    const testButtons = document.querySelectorAll('.test-btn');
    const messageInput = document.getElementById('messageInput');
    
    testButtons.forEach(button => {
        button.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            messageInput.value = message;
            
            // Auto-submit after quick test
            if (confirm(`Send test message: "${message}"?`)) {
                document.getElementById('messageForm').submit();
            }
        });
    });
}

// AJAX form submission for smoother experience
function setupAjaxForm() {
    const form = document.getElementById('messageForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const message = formData.get('message');
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Send AJAX request
        fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('✅ Message processed successfully!', 'success');
                document.getElementById('messageInput').value = '';
                
                // Reload page to show new data
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showNotification('❌ Error: ' + data.error, 'error');
            }
        })
        .catch(error => {
            showNotification('❌ Error processing message', 'error');
            console.error('Error:', error);
        })
        .finally(() => {
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });
}

// Show notification
function showNotification(message, type) {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Highlight new rows
function observeNewRows() {
    const table = document.querySelector('tbody');
    if (!table) return;
    
    const lastRow = table.lastElementChild;
    if (lastRow) {
        lastRow.classList.add('highlight-row');
    }
}

// Refresh stats periodically
function setupStatsRefresh() {
    setInterval(() => {
        fetch('/stats')
            .then(response => response.json())
            .then(data => {
                if (data.total !== undefined) {
                    document.getElementById('totalInquiries').textContent = data.total;
                    
                    const resolvedCount = data.categories ? 
                        Object.values(data.categories).reduce((a, b) => a + b, 0) : 0;
                    const autoRate = data.total > 0 ? 
                        Math.round((resolvedCount / data.total) * 100) : 0;
                    document.getElementById('autoRate').textContent = autoRate + '%';
                }
            })
            .catch(error => console.error('Stats refresh error:', error));
    }, 30000);
}

// Initialize tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.getAttribute('data-tooltip');
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target._tooltip) {
        e.target._tooltip.remove();
        e.target._tooltip = null;
    }
}

// Initialize smooth scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Export data for assignment
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        total_inquiries: document.querySelectorAll('tbody tr').length,
        categories: {}
    };
    
    document.querySelectorAll('.category-badge').forEach(badge => {
        const category = badge.textContent.trim().toLowerCase();
        data.categories[category] = (data.categories[category] || 0) + 1;
    });
    
    console.log('Export Data:', data);
    return data;
}

// Make export available globally
window.exportData = exportData;

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-section');
    const scrolled = window.pageYOffset;
    
    if (hero) {
        const heroImage = document.querySelector('.hero-illustration');
        if (heroImage) {
            heroImage.style.transform = `translate(-50%, -50%) translateY(${scrolled * 0.5}px)`;
        }
    }
});

// Add typing effect to hero title (optional)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle && !sessionStorage.getItem('titleAnimated')) {
    const text = heroTitle.innerText;
    heroTitle.innerText = '';
    
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            heroTitle.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    
    // Only run animation on first visit
    setTimeout(typeWriter, 3000);
    sessionStorage.setItem('titleAnimated', 'true');
}