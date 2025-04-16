// Main JavaScript file for Culinary Cronicals website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Add meal functionality for meal prep page
    const addMealButtons = document.querySelectorAll('.add-meal button');
    if (addMealButtons.length > 0) {
        addMealButtons.forEach(button => {
            
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                e.preventDefault();
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
//recipe search auto fill from diet
window.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const dietParam = urlParams.get('diet');

    if (dietParam) {
      const dietSelect = document.querySelector('select[name="diet"]') || document.querySelector('.filter select:nth-of-type(3)');
      
      if (dietSelect) {
        dietSelect.value = dietParam;

        // Optional: Scroll to the results section
        const results = document.querySelector('.recipe-grid');
        if (results) results.scrollIntoView({ behavior: 'smooth' });

        // Optional: If you have filter logic that should re-run
        // document.querySelector('.btn-primary').click();
      }
    }
  });
