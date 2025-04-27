// Meal Prep Calendar Interactivity
// Loads recipes, allows user to assign recipes to calendar slots

document.addEventListener('DOMContentLoaded', async function() {
    // Load recipes from recipes.json
    let recipes = [];
    try {
        const res = await fetch('js/recipes.json');
        const data = await res.json();
        recipes = Object.values(data);
    } catch (e) {
        console.error('Failed to load recipes.json', e);
    }

    // Handler to open recipe picker modal
    function openRecipePicker(cell) {
        // Remove any existing modal
        const oldModal = document.getElementById('recipe-picker-modal');
        if (oldModal) oldModal.remove();

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'recipe-picker-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>Select a Recipe</h3>
                <input type="text" id="recipe-search" placeholder="Search recipes..." style="width:100%;margin-bottom:10px;">
                <ul class="recipe-list" style="max-height:250px;overflow:auto;padding:0;margin:0;list-style:none;"></ul>
                <button id="close-modal" class="btn-secondary" style="margin-top:10px;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
        // Populate list
        const list = modal.querySelector('.recipe-list');
        function renderList(filter = '') {
            list.innerHTML = '';
            recipes.filter(r => r.name.toLowerCase().includes(filter.toLowerCase())).forEach(r => {
                const li = document.createElement('li');
                li.textContent = r.name;
                li.className = 'picker-item';
                li.style.cursor = 'pointer';
                li.onclick = () => {
                    cell.innerHTML = `<div class='meal-item'><span>${r.name}</span><button class='remove-meal' title='Remove'>&times;</button></div>`;
                    saveCalendar();
                    modal.remove();
                };
                list.appendChild(li);
            });
        }
        renderList();
        modal.querySelector('#recipe-search').addEventListener('input', e => renderList(e.target.value));
        modal.querySelector('#close-modal').onclick = () => modal.remove();
        // Close on overlay click
        modal.querySelector('.modal-overlay').onclick = () => modal.remove();
    }

    function attachCellListeners() {
        document.querySelectorAll('.meal-cell').forEach(cell => {
            cell.onclick = function(e) {
                // Only open picker if not clicking remove button
                if (e.target.classList.contains('remove-meal')) return;
                openRecipePicker(cell);
            };
            // Remove meal on X click
            cell.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-meal')) {
                    cell.innerHTML = '';
                    saveCalendar();
                    e.stopPropagation();
                }
            });
        });
    }

    // --- Week Navigation and Current Week Logic ---
    const weekSpan = document.querySelector('.date-selector span');
    const leftBtn = document.querySelector('.date-selector button:first-child');
    const rightBtn = document.querySelector('.date-selector button:last-child');

    // Helper to get start of week (Monday)
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1) - day; // Monday as first day
        d.setDate(d.getDate() + diff);
        d.setHours(0,0,0,0);
        return d;
    }
    // Helper to format date as e.g. "Apr 22 - Apr 28, 2025"
    function formatWeekRange(start) {
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const opts = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}, ${start.getFullYear()}`;
    }

    // Store week in ISO format (YYYY-MM-DD)
    let currentWeekStart = getStartOfWeek(new Date());

    function updateWeekDisplay() {
        weekSpan.textContent = formatWeekRange(currentWeekStart);
    }

    function getWeekKey() {
        return 'mealPrepPlan_' + currentWeekStart.toISOString().slice(0,10);
    }

    // Save/load calendar for the current week
    function saveCalendar() {
        const plan = {};
        document.querySelectorAll('.meal-cell').forEach(cell => {
            const day = cell.getAttribute('data-day');
            const meal = cell.getAttribute('data-meal');
            const mealName = cell.textContent.trim();
            if (mealName) {
                if (!plan[day]) plan[day] = {};
                plan[day][meal] = mealName.replace('×','').trim();
            }
        });
        localStorage.setItem(getWeekKey(), JSON.stringify(plan));
        renderNutritionSummary();
        showSaveToast();
    }
    function loadCalendar() {
        const plan = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
        document.querySelectorAll('.meal-cell').forEach(cell => {
            const day = cell.getAttribute('data-day');
            const meal = cell.getAttribute('data-meal');
            cell.innerHTML = '';
            if (plan[day] && plan[day][meal]) {
                cell.innerHTML = `<div class='meal-item'><span>${plan[day][meal]}</span><button class='remove-meal' title='Remove'>&times;</button></div>`;
            }
        });
        attachCellListeners();
        renderNutritionSummary();
    }

    // --- Nutrition Facts Calculation and Rendering ---
    let recipesByName = {};
    recipes.forEach(r => { recipesByName[r.name] = r; });

    function renderNutritionSummary() {
        const plan = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const nutrition = {};
        days.forEach(day => {
            nutrition[day] = { total: 0, count: 0 };
            ['breakfast','lunch','dinner','snacks'].forEach(meal => {
                if (plan[day] && plan[day][meal]) {
                    const recipe = recipesByName[plan[day][meal]];
                    if (recipe && recipe.calories) {
                        nutrition[day].total += parseInt(recipe.calories, 10);
                        nutrition[day].count++;
                    }
                }
            });
        });
        // Render
        const container = document.getElementById('nutrition-facts-container');
        container.innerHTML = '';
        days.forEach(day => {
            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
            const total = nutrition[day].total;
            const count = nutrition[day].count;
            const avg = count ? Math.round(total / count) : 0;
            const div = document.createElement('div');
            div.className = 'nutrition-day-summary';
            div.innerHTML = `<h4>${dayName}</h4><div class="cals">${total} kcal</div><div class="per-meal">${count ? avg + ' kcal/meal' : 'No meals'}</div>`;
            container.appendChild(div);
        });
    }

    function updateAll() {
        updateWeekDisplay();
        loadCalendar();
        renderNutritionSummary();
    }

    // Navigation buttons
    leftBtn.onclick = function() {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        updateAll();
    };
    rightBtn.onclick = function() {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        updateAll();
    };

    // On page load: set week and load plan
    updateWeekDisplay();
    loadCalendar();
    renderNutritionSummary();

    // --- Show Save Toast Notification ---
    function showSaveToast() {
        const toast = document.getElementById('save-toast');
        if (!toast) return;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1700);
    }

    // Save button triggers save and toast
    const saveBtn = document.querySelector('.planner-actions .btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveCalendar();
        });
    }

    // Add functionality to the Create Meal Plan button
    const createBtn = document.querySelector('.meal-prep-intro .btn-primary');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            // Clear all meal slots
            document.querySelectorAll('.meal-cell').forEach(cell => {
                cell.innerHTML = '';
            });
            // Optionally scroll to the planner
            const planner = document.querySelector('.meal-prep-planner');
            if (planner) planner.scrollIntoView({behavior: 'smooth'});
            // Remove saved plan from localStorage
            localStorage.removeItem(getWeekKey());
            attachCellListeners(); // re-attach listeners after clearing
            renderNutritionSummary();
        });
    }

    // --- Print and Share Functionality ---
    const printBtn = document.querySelector('.planner-actions .btn-secondary i.fa-print')?.closest('button');
    const shareBtn = document.querySelector('.planner-actions .btn-secondary i.fa-share-alt')?.closest('button');

    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Compose a text summary of the week's plan
            const plan = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
            let text = `Meal Plan for ${weekSpan.textContent}\n\n`;
            const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
            days.forEach(day => {
                text += `${day}:\n`;
                ['breakfast','lunch','dinner','snacks'].forEach(meal => {
                    const mealName = plan[day.toLowerCase()] && plan[day.toLowerCase()][meal] ? plan[day.toLowerCase()][meal] : '-';
                    text += `  ${meal.charAt(0).toUpperCase() + meal.slice(1)}: ${mealName}\n`;
                });
            });
            // Try to use Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: 'My Weekly Meal Plan',
                    text
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(text).then(() => {
                    alert('Meal plan copied to clipboard! You can now paste it anywhere.');
                });
            }
        });
    }
});
