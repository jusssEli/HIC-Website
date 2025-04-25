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
  
document.querySelector('.btn-primary').addEventListener('click', applyFilters);
document.querySelector('.search-btn').addEventListener('click', applyFilters);
document.querySelector('.search-container input').addEventListener('input', applyFilters);
window.addEventListener('DOMContentLoaded', () => {loadRecipes();});
  
