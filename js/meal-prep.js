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
        
        // Always render nutrition summary after saving to ensure it's up to date
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
        
        // Load water intake data for the current week
        loadWaterIntake();
        
        // Always render nutrition summary after loading to ensure it's up to date
        renderNutritionSummary();
    }

    // --- Nutrition Facts Calculation and Rendering ---
    let recipesByName = {};
    recipes.forEach(r => { recipesByName[r.name] = r; });

    // Track water intake
    let waterIntake = {
        weekly: 1.5,  // Default weekly average in liters
        monday: 1.2,
        tuesday: 1.4,
        wednesday: 1.6,
        thursday: 1.3,
        friday: 1.5,
        saturday: 1.8,
        sunday: 1.7
    };

    // Current view mode (weekly or specific day)
    let currentDayView = 'weekly';

    function renderNutritionSummary() {
        const plan = JSON.parse(localStorage.getItem(getWeekKey()) || '{}');
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const nutrition = {};

        // Initialize weekly totals
        let weeklyTotals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            water: waterIntake.weekly,
            mealCount: 0
        };

        // Daily calorie data for chart
        let dailyCalories = [];

        days.forEach(day => {
            nutrition[day] = { 
                total: 0, 
                count: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            };

            ['breakfast','lunch','dinner','snacks'].forEach(meal => {
                if (plan[day] && plan[day][meal]) {
                    const recipe = recipesByName[plan[day][meal]];
                    if (recipe && recipe.calories) {
                        const calories = parseInt(recipe.calories, 10);
                        nutrition[day].total += calories;
                        nutrition[day].count++;

                        // Estimate macros based on calories if not provided in recipe
                        // These are rough estimates: 15% protein, 55% carbs, 30% fat
                        nutrition[day].protein += Math.round(calories * 0.15 / 4); // 4 calories per gram of protein
                        nutrition[day].carbs += Math.round(calories * 0.55 / 4);   // 4 calories per gram of carbs
                        nutrition[day].fat += Math.round(calories * 0.30 / 9);     // 9 calories per gram of fat

                        // Add to weekly totals
                        weeklyTotals.calories += calories;
                        weeklyTotals.protein += Math.round(calories * 0.15 / 4);
                        weeklyTotals.carbs += Math.round(calories * 0.55 / 4);
                        weeklyTotals.fat += Math.round(calories * 0.30 / 9);
                        weeklyTotals.mealCount++;
                    }
                }
            });

            // Add to daily calories array for chart
            dailyCalories.push(nutrition[day].total);
        });

        // Update the dashboard summary cards based on current view
        if (currentDayView === 'weekly') {
            updateNutritionDashboard(weeklyTotals);
        } else {
            const dayIndex = days.indexOf(currentDayView);
            if (dayIndex !== -1) {
                const dayTotals = {
                    calories: nutrition[currentDayView].total,
                    protein: nutrition[currentDayView].protein,
                    carbs: nutrition[currentDayView].carbs,
                    fat: nutrition[currentDayView].fat,
                    water: waterIntake[currentDayView],
                    mealCount: nutrition[currentDayView].count
                };
                updateNutritionDashboard(dayTotals, false); // false indicates daily view
            }
        }

        // Update the charts
        updateNutritionCharts(weeklyTotals, dailyCalories);

        // Legacy nutrition facts container update
        const container = document.getElementById('nutrition-facts-container');
        if (container) {
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
    }

    function updateNutritionDashboard(totals, isWeekly = true) {
        // Target values
        const targets = isWeekly ? {
            calories: 2000 * 7, // 2000 calories per day * 7 days
            protein: 90 * 7,    // 90g protein per day * 7 days
            carbs: 250 * 7,     // 250g carbs per day * 7 days
            fat: 65 * 7,        // 65g fat per day * 7 days
            water: 2.5 * 7      // 2.5L water per day * 7 days
        } : {
            calories: 2000,     // 2000 calories per day
            protein: 90,        // 90g protein per day
            carbs: 250,         // 250g carbs per day
            fat: 65,            // 65g fat per day
            water: 2.5          // 2.5L water per day
        };

        // Update summary cards
        const calorieEl = document.querySelector('.summary-card:nth-child(1) .current');
        const proteinEl = document.querySelector('.summary-card:nth-child(2) .current');
        const carbsEl = document.querySelector('.summary-card:nth-child(3) .current');
        const fatEl = document.querySelector('.summary-card:nth-child(4) .current');
        const waterEl = document.querySelector('.summary-card:nth-child(5) .current');

        // Update progress bars
        const calorieProgressEl = document.querySelector('.summary-card:nth-child(1) .progress');
        const proteinProgressEl = document.querySelector('.summary-card:nth-child(2) .progress');
        const carbsProgressEl = document.querySelector('.summary-card:nth-child(3) .progress');
        const fatProgressEl = document.querySelector('.summary-card:nth-child(4) .progress');
        const waterProgressEl = document.querySelector('.summary-card:nth-child(5) .progress');

        if (calorieEl) calorieEl.textContent = Math.round(totals.calories).toLocaleString();
        if (proteinEl) proteinEl.textContent = Math.round(totals.protein) + 'g';
        if (carbsEl) carbsEl.textContent = Math.round(totals.carbs) + 'g';
        if (fatEl) fatEl.textContent = Math.round(totals.fat) + 'g';
        if (waterEl) waterEl.textContent = totals.water.toFixed(1) + 'L';

        // Calculate and update progress percentages
        if (calorieProgressEl) calorieProgressEl.style.width = Math.min(100, (totals.calories / targets.calories) * 100) + '%';
        if (proteinProgressEl) proteinProgressEl.style.width = Math.min(100, (totals.protein / targets.protein) * 100) + '%';
        if (carbsProgressEl) carbsProgressEl.style.width = Math.min(100, (totals.carbs / targets.carbs) * 100) + '%';
        if (fatProgressEl) fatProgressEl.style.width = Math.min(100, (totals.fat / targets.fat) * 100) + '%';
        if (waterProgressEl) waterProgressEl.style.width = Math.min(100, (totals.water / targets.water) * 100) + '%';
    }

    function updateNutritionCharts(totals, dailyCalories) {
        // Update macronutrient distribution chart
        if (window.macroChart) {
            window.macroChart.data.datasets[0].data = [
                Math.round(totals.protein),
                Math.round(totals.carbs),
                Math.round(totals.fat)
            ];
            window.macroChart.update();
        }

        // Update weekly calorie intake chart
        if (window.calorieChart) {
            window.calorieChart.data.datasets[0].data = dailyCalories;
            window.calorieChart.update();
        }
    }

    function updateAll() {
        updateWeekDisplay();
        loadCalendar();
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

    // --- Day Selector and Water Tracking ---
    // Add event listeners for day selector buttons
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Update current day view
            currentDayView = this.getAttribute('data-day');
            // Re-render nutrition summary with new day view
            renderNutritionSummary();
        });
    });

    // On page load: set week and load plan
    updateWeekDisplay();
    loadCalendar();

    // Add event listener for water add button
    const waterAddBtn = document.querySelector('.water-add');
    if (waterAddBtn) {
        waterAddBtn.addEventListener('click', function() {
            // Increment water intake by 0.25L
            if (currentDayView === 'weekly') {
                // If in weekly view, distribute the added water across the week
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                days.forEach(day => {
                    waterIntake[day] += 0.25 / 7;
                });
                waterIntake.weekly += 0.25;
            } else {
                // Otherwise add to the specific day
                waterIntake[currentDayView] += 0.25;
                // Recalculate weekly average
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                waterIntake.weekly = days.reduce((sum, day) => sum + waterIntake[day], 0) / 7;
            }
            
            // Save water intake to localStorage
            localStorage.setItem('waterIntake_' + getWeekKey(), JSON.stringify(waterIntake));
            
            // Re-render nutrition summary
            renderNutritionSummary();
            
            // Show a small animation on the button
            this.classList.add('water-added');
            setTimeout(() => this.classList.remove('water-added'), 300);
        });
    }

    // Add event listener for water minus button
    const waterMinusBtn = document.querySelector('.water-minus');
    if (waterMinusBtn) {
        waterMinusBtn.addEventListener('click', function() {
            // Decrement water intake by 0.25L (with minimum of 0)
            if (currentDayView === 'weekly') {
                // Only decrease if weekly average is above 0
                if (waterIntake.weekly >= 0.25) {
                    // If in weekly view, distribute the subtracted water across the week
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    days.forEach(day => {
                        waterIntake[day] = Math.max(0, waterIntake[day] - 0.25 / 7);
                    });
                    waterIntake.weekly = Math.max(0, waterIntake.weekly - 0.25);
                }
            } else {
                // Otherwise subtract from the specific day
                if (waterIntake[currentDayView] >= 0.25) {
                    waterIntake[currentDayView] = Math.max(0, waterIntake[currentDayView] - 0.25);
                    // Recalculate weekly average
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    waterIntake.weekly = days.reduce((sum, day) => sum + waterIntake[day], 0) / 7;
                }
            }
            
            // Save water intake to localStorage
            localStorage.setItem('waterIntake_' + getWeekKey(), JSON.stringify(waterIntake));
            
            // Re-render nutrition summary
            renderNutritionSummary();
            
            // Show a small animation on the button
            this.classList.add('water-removed');
            setTimeout(() => this.classList.remove('water-removed'), 300);
        });
    }

    // Load saved water intake data
    function loadWaterIntake() {
        const savedWaterIntake = localStorage.getItem('waterIntake_' + getWeekKey());
        if (savedWaterIntake) {
            waterIntake = JSON.parse(savedWaterIntake);
        }
    }
    
    // Load water intake on page load
    loadWaterIntake();

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
