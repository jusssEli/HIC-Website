// Main JavaScript file for Culinary Cronicals website

document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
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
        anchor.addEventListener('click', function (e) {
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

let allRecipes = [];//for filtering
async function loadRecipes() { //get the json recipes
    const res = await fetch('js/recipes.json');
    const data = await res.json();
    allRecipes = Object.values(data);
    applyFilters();
}

function renderRecipes(recipes) { //show recipes on page
    const container = document.querySelector('.recipe-grid');
    container.innerHTML = '';
    if (recipes.length === 0) {
        console.log("No recipies");
        container.innerHTML = '<p>No recipes found.</p>';
        return;
    }

    recipes.forEach(recipe => { //make each recipe card
        console.log('Rendering recipe:', recipe.name);
        const card = `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.name}">
                <div class="recipe-tags">
                    <span class="tag">${recipe.meal_type}</span>
                    ${recipe.diet.map(d => `<span class="tag">${d}</span>`).join('')}
                </div>
            </div>
            <div class="recipe-info">
                <h3>${recipe.name}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.time}</span>
                    <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
                </div>
                <p>${recipe.description}</p>
                <a href="recipe-detail.html" class="btn-text">View Recipe</a>
            </div>
        </div>`;
        container.innerHTML += card;
    });
}

function applyFilters() { //filtered search
    const mealType = document.querySelector('select[name=meal_type]').value.toLowerCase();
    const cuisine = document.querySelector('select[name=cuisine]').value.toLowerCase();
    const diet = document.querySelector('select[name=diet]').value.toLowerCase();
    const search = document.querySelector('.search-container input').value.toLowerCase();

    let filtered = allRecipes.filter(r => {
        return (!mealType || r.meal_type.toLowerCase() === mealType) &&
            (!cuisine || r.cuisine.toLowerCase() === cuisine) &&
            (!diet || r.diet.map(d => d.toLowerCase()).includes(diet)) &&
            (!search || r.name.toLowerCase().includes(search));
    });

    renderRecipes(filtered);
}
//Resource page js
// Animation on scroll
document.addEventListener('DOMContentLoaded', function () {
    // Function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Function to handle animation on scroll
    function handleScrollAnimation() {
        const elements = document.querySelectorAll('.fade-in-up');
        elements.forEach(element => {
            if (isInViewport(element)) {
                element.style.animationPlayState = 'running';
            }
        });
    }

    // Initial check
    handleScrollAnimation();

    // Check on scroll
    window.addEventListener('scroll', handleScrollAnimation);

    // Resource card hover effect
    const resourceCards = document.querySelectorAll('.resource-card');
    resourceCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // Back to top button
    const backToTopButton = document.querySelector('.back-to-top');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 500) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Filter controls
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterSections = document.querySelectorAll('.filter-section');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filterValue = this.getAttribute('data-filter');
            filterButtons.forEach(button => button.classList.remove('active'));
            this.classList.add('active');

            filterSections.forEach(section => {
                if (section.getAttribute('data-category') === filterValue || filterValue === 'all') {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
});
//

document.querySelector('.btn-primary').addEventListener('click', applyFilters);
document.querySelector('.search-btn').addEventListener('click', applyFilters);
document.querySelector('.search-container input').addEventListener('input', applyFilters);
window.addEventListener('DOMContentLoaded', () => { loadRecipes(); });

