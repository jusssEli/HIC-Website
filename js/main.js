// --- Main JavaScript file for Culinary Chronicles website ---

document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            nav.classList.toggle('active');
            this.classList.toggle('active');
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

    // Restore filter selects if user has URL params
    const urlParams = new URLSearchParams(window.location.search);
    const mealTypeParam = urlParams.get('meal_type');
    const cuisineParam = urlParams.get('cuisine');
    const dietParam = urlParams.get('diet');
    const inputParam = urlParams.get('input');

    const mealTypeSelect = document.querySelector('select[name="meal_type"]') || document.querySelector('.filter select:nth-of-type(1)');
    if (mealTypeSelect && mealTypeParam) mealTypeSelect.value = mealTypeParam;

    const cuisineSelect = document.querySelector('select[name="cuisine"]') || document.querySelector('.filter select:nth-of-type(2)');
    if (cuisineSelect && cuisineParam) cuisineSelect.value = cuisineParam;

    const dietSelect = document.querySelector('select[name="diet"]') || document.querySelector('.filter select:nth-of-type(3)');
    if (dietSelect && dietParam) dietSelect.value = dietParam;

    const inputSelect = document.querySelector('input[name="search-input"]') || document.querySelector('.search-container input');
    if (inputSelect && inputParam) inputSelect.value = inputParam;
});

// Recipe and Budget logic
let allRecipes = [];
let allRecipesById = {};

async function loadRecipes() {
    const res = await fetch('js/recipes.json');
    const data = await res.json();
    allRecipesById = data;
    allRecipes = Object.values(data);

    // Setup Budget Form Handler
    const budgetForm = document.getElementById("budget-form");
    if (budgetForm) { 
        budgetForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const income = parseFloat(document.getElementById("income").value);
            const container = document.getElementById("suggested-recipes");
            container.innerHTML = "<h4>Suggested Recipes:</h4><div class='recipe-grid'></div>";

            let suggested = [];

            if (income < 1500) {
                suggested = allRecipes.filter(recipe =>
                    recipe.name.toLowerCase().includes('lentil') ||
                    recipe.name.toLowerCase().includes('rice') ||
                    recipe.name.toLowerCase().includes('bean') ||
                    recipe.calories < 500
                );
            } else if (income < 3000) {
                suggested = allRecipes.filter(recipe =>
                    recipe.name.toLowerCase().includes('chicken') ||
                    recipe.name.toLowerCase().includes('pasta') ||
                    recipe.name.toLowerCase().includes('veggie')
                );
            } else {
                suggested = allRecipes.filter(recipe =>
                    recipe.name.toLowerCase().includes('salmon') ||
                    recipe.name.toLowerCase().includes('quinoa') ||
                    recipe.name.toLowerCase().includes('shrimp')
                );
            }

            if (suggested.length === 0) {
                container.innerHTML += "<p>No budget-friendly recipes found. Try adjusting your income!</p>";
            } else {
                const list = document.createElement('ul'); // Make a simple list
                suggested.slice(0, 3).forEach(recipe => {
                    const item = document.createElement('li');
                    item.innerHTML = `<a href="recipe-detail.html?id=${recipeKey(recipe)}">${recipe.name}</a>`;
                    list.appendChild(item);
                });
                container.appendChild(list);
            }
            
        });
    }

    const storedPage = localStorage.getItem('currentPage');
    const pageToLoad = storedPage ? parseInt(storedPage, 10) : 1;
    applyFilters(pageToLoad);

    const results = document.querySelector('.recipe-grid');
    if (results) results.scrollIntoView({ behavior: 'smooth' });
}

function recipeKey(recipe) {
    for (const [key, value] of Object.entries(allRecipesById)) {
        if (value.name === recipe.name && value.time === recipe.time) {
            return key;
        }
    }
    return '';
}

// Filtering recipes normally
let currentPage = 1;
const RECIPES_PER_PAGE = 9;
let filteredRecipes = [];

function renderRecipes(recipes, page = 1) {
    localStorage.setItem('currentPage', page);
    const container = document.querySelector('.recipe-grid');
    container.innerHTML = '';
    if (recipes.length === 0) {
        container.innerHTML = '<p>No recipes found.</p>';
        renderPagination(0, 1);
        return;
    }
    filteredRecipes = recipes;
    currentPage = page;
    const start = (page - 1) * RECIPES_PER_PAGE;
    const end = start + RECIPES_PER_PAGE;
    const recipesToShow = recipes.slice(start, end);
    recipesToShow.forEach(recipe => {
        let recipeURL = `recipe-detail.html?id=${recipeKey(recipe)}`;
        if (document.querySelector('select[name="meal_type"]').value != "All" && document.querySelector('select[name="meal_type"]').value != "") recipeURL += `&meal_type=${document.querySelector('select[name="meal_type"]').value}`;
        if (document.querySelector('select[name="cuisine"]').value != "All" && document.querySelector('select[name="cuisine"]').value != "") recipeURL += `&cuisine=${document.querySelector('select[name="cuisine"]').value}`;
        if (document.querySelector('select[name="diet"]').value != "All" && document.querySelector('select[name="diet"]').value != "") recipeURL += `&diet=${document.querySelector('select[name="diet"]').value}`;
        if (document.querySelector('input[name="search-input"]').value != "") recipeURL += `&input=${document.querySelector('input[name="search-input"]').value}`;

        let recipeTags = `<span class="tag">${recipe.meal_type}</span>`;
        const dietTags = recipe.diet.map(d => `<span class="tag">${d}</span>`);
        if (dietTags.length > 3) {
            recipeTags += dietTags.slice(0, 3).join(' ') + ' <span class="tag">...</span>';
        } else {
            recipeTags += dietTags.join(' ');
        }
        const card = `
        <div class="recipe-card">
            <div class="recipe-image">
                <img src="${recipe.image}" alt="${recipe.name}">
                <div class="recipe-tags">
                    ${recipeTags}
                </div>
            </div>
            <div class="recipe-info">
                <h3>${recipe.name}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.time}</span>
                    <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
                </div>
                <p>${recipe.description}</p>
                <a href="${recipeURL}" class="btn-text">View Recipe</a>
            </div>
        </div>`;
        container.innerHTML += card;
    });
    renderPagination(recipes.length, page);
}

function renderPagination(totalRecipes, page) {
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';
    if (totalRecipes <= RECIPES_PER_PAGE) return;
    const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE);

    if (page > 1) {
        const prevBtn = document.createElement('a');
        prevBtn.href = '#';
        prevBtn.className = 'page-link prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = (e) => { e.preventDefault(); renderRecipes(filteredRecipes, page - 1); };
        pagination.appendChild(prevBtn);
    }

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('a');
        pageBtn.href = '#';
        pageBtn.className = 'page-link' + (i === page ? ' active' : '');
        pageBtn.textContent = i;
        pageBtn.onclick = (e) => { e.preventDefault(); renderRecipes(filteredRecipes, i); };
        pagination.appendChild(pageBtn);
    }

    if (page < totalPages) {
        const nextBtn = document.createElement('a');
        nextBtn.href = '#';
        nextBtn.className = 'page-link next';
        nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = (e) => { e.preventDefault(); renderRecipes(filteredRecipes, page + 1); };
        pagination.appendChild(nextBtn);
    }
}

function applyFilters(page = 1) {
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
    renderRecipes(filtered, page);
}

// Filter reset buttons
document.querySelector('.btn-primary')?.addEventListener('click', function () {
    localStorage.removeItem('currentPage');
    applyFilters();
});
document.querySelector('.search-btn')?.addEventListener('click', function () {
    localStorage.removeItem('currentPage');
    applyFilters();
});
document.querySelector('.search-container input')?.addEventListener('input', function () {
    localStorage.removeItem('currentPage');
    applyFilters();
});
document.getElementById('reset-filters-btn')?.addEventListener('click', function () {
    document.querySelector('select[name=meal_type]').value = '';
    document.querySelector('select[name=cuisine]').value = '';
    document.querySelector('select[name=diet]').value = '';
    document.querySelector('.search-container input').value = '';
    renderRecipes(allRecipes, 1);
    const results = document.querySelector('.recipe-grid');
    if (results) results.scrollIntoView({ behavior: 'smooth' });
});

// Load recipes when the page is ready
window.addEventListener('DOMContentLoaded', () => { loadRecipes(); });

