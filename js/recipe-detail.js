// Script for dynamic recipe detail page

document.addEventListener('DOMContentLoaded', async function() {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');
    if (!recipeId) {
        document.getElementById('recipe-detail').innerHTML = '<p>Recipe not found.</p>';
        return;
    }
    try {
        const res = await fetch('js/recipes.json');
        const data = await res.json();
        const recipe = data[recipeId];
        if (!recipe) {
            document.getElementById('recipe-detail').innerHTML = '<p>Recipe not found.</p>';
            return;
        }
        document.title = recipe.name + ' - Culinary Chronicles';
        document.getElementById('recipe-detail').innerHTML = `
            <div class="recipe-detail-card">
                <div class="recipe-image">
                    <img src="${recipe.image}" alt="${recipe.name}">
                </div>
                <div class="recipe-info">
                    <h2>${recipe.name}</h2>
                    <div class="recipe-meta">
                        <span><i class="far fa-clock"></i> ${recipe.time}</span>
                        <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
                        <span><i class="fas fa-utensils"></i> Serves: ${recipe.servings}</span>
                        <span><i class="fas fa-globe"></i> ${recipe.cuisine}</span>
                        <span><i class="fas fa-tags"></i> ${recipe.diet ? recipe.diet.join(', ') : ''}</span>
                    </div>
                    <p>${recipe.description}</p>
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                    <h3>Instructions</h3>
                    <ol class="instructions-list">
                        ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                    <div class="back-btn-container">
                      <a href="recipes.html" class="btn-primary">Back to Recipes</a>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        document.getElementById('recipe-detail').innerHTML = '<p>Failed to load recipe.</p>';
    }
});
