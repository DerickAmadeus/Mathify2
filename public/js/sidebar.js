// Sidebar Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Get all sidebar items
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    // Remove all active classes first
    sidebarItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to current page
    sidebarItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        }
    });
    
    // Handle sidebar hover effect for better UX
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Check if sidebar should stay expanded (within 2 seconds of navigation)
        const lastHoverTime = sessionStorage.getItem('sidebarLastHover');
        const now = Date.now();
        
        if (lastHoverTime && (now - parseInt(lastHoverTime)) < 2000) {
            sidebar.classList.add('keep-expanded');
            // Auto collapse after 2 seconds
            setTimeout(() => {
                sidebar.classList.remove('keep-expanded');
                sessionStorage.removeItem('sidebarLastHover');
            }, 2000);
        }
        
        sidebar.addEventListener('mouseenter', function() {
            this.classList.add('expanded');
            clearTimeout(this.collapseTimer);
        });
        
        sidebar.addEventListener('mouseleave', function() {
            // Store hover time for cross-page persistence
            sessionStorage.setItem('sidebarLastHover', Date.now().toString());
            
            // Delay collapse
            this.collapseTimer = setTimeout(() => {
                this.classList.remove('expanded');
                this.classList.remove('keep-expanded');
            }, 0);
        });
        
        // Keep expanded when clicking navigation links
        sidebarItems.forEach(item => {
            item.addEventListener('click', function() {
                sessionStorage.setItem('sidebarLastHover', Date.now().toString());
            });
        });
    }
});
