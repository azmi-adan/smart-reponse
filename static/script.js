// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize tooltips and animations
    initTooltips();
    
    // Set up quick test buttons
    setupQuickTests();
    
    // Set up AJAX form submission
    setupAjaxForm();
    
    // Set up auto-refresh for stats
    setupStatsRefresh();
    
    // Add animation to new rows
    observeNewRows();
});

// Quick test buttons functionality
function setupQuickTests() {
    const testButtons = document.querySelectorAll('.test-btn');
    const messageInput = document.getElementById('messageInput');
    
    testButtons.forEach(button => {
        button.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            messageInput.value = message;
            
            // Optional: auto-submit after quick test
            if (confirm(`Send test message: "${message}"?`)) {
                document.getElementById('messageForm').submit();
            }
        });
    });
}

// AJAX form submission for smoother experience
function setupAjaxForm() {
    const form = document.getElementById('messageForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const message = formData.get('message');
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Sending...';
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
                // Show success message
                showNotification('✅ Message processed successfully!', 'success');
                
                // Clear input
                document.getElementById('messageInput').value = '';
                
                // Reload page to show new data (simplest approach)
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
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });
}

// Show notification
function showNotification(message, type) {
    // Remove existing notification
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
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
    
    .highlight-row {
        animation: highlight 2s ease;
    }
    
    @keyframes highlight {
        0% { background-color: #fef3c7; }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(style);

// Highlight new rows
function observeNewRows() {
    const table = document.querySelector('tbody');
    if (!table) return;
    
    // Highlight last row
    const lastRow = table.lastElementChild;
    if (lastRow) {
        lastRow.classList.add('highlight-row');
    }
}

// Refresh stats periodically
function setupStatsRefresh() {
    // Update stats every 30 seconds
    setInterval(() => {
        fetch('/stats')
            .then(response => response.json())
            .then(data => {
                if (data.total !== undefined) {
                    document.getElementById('totalInquiries').textContent = data.total;
                    
                    // Update auto-rate
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