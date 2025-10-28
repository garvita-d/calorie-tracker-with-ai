// Application State
let dailyCalories = 0;
let dailyTarget = 2000;
let mealLog = [];
let recognition = null;
let isListening = false;
let isProcessing = false;
let dietPreference = null;
let lastInput = '';

// Dietary Preferences
function setDietPreference(preference) {
    dietPreference = preference;
    document.getElementById('dietModal').style.display = 'none';
    document.getElementById('dietIndicator').style.display = 'inline-block';
    document.getElementById('dietType').textContent = 
        preference === 'vegetarian' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian';
    
    updateRecommendations();
    showMessage(`Dietary preference set to ${preference}. Recommendations updated!`, 'success');
}

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isListening = true;
            updateVoiceStatus('🎤 Listening... Speak now!', 'listening');
            document.getElementById('voiceBtn').style.display = 'none';
            document.getElementById('stopBtn').style.display = 'inline-block';
        };
        
        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript = event.results[i][0].transcript;
                }
            }
            
            if (transcript) {
                document.getElementById('voiceResult').innerHTML = `<strong>You said:</strong> "${transcript}"`;
                lastInput = transcript;
                processFoodInput(transcript);
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            updateVoiceStatus('❌ Error: ' + event.error, 'error');
            resetVoiceButtons();
        };
        
        recognition.onend = function() {
            isListening = false;
            updateVoiceStatus('✅ Voice recognition stopped', 'success');
            resetVoiceButtons();
        };
        
        return true;
    } else {
        updateVoiceStatus('❌ Voice recognition not supported in this browser', 'error');
        return false;
    }
}

function startVoiceRecognition() {
    if (isProcessing) {
        showMessage('Please wait for current analysis to complete', 'warning');
        return;
    }

    if (!recognition) {
        if (!initSpeechRecognition()) {
            return;
        }
    }
    
    if (!isListening) {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            updateVoiceStatus('❌ Failed to start voice recognition', 'error');
        }
    }
}

function stopVoiceRecognition() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

function updateVoiceStatus(message, type = '') {
    const statusEl = document.getElementById('voiceStatus');
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
}

function resetVoiceButtons() {
    document.getElementById('voiceBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
}

// Enhanced AI Food Analysis with Google Integration Simulation
async function analyzeFood(foodDescription) {
    // Simulate Google AI/Nutritionix API call for comprehensive food analysis
    const prompt = `Analyze this food description with dietary preference (${dietPreference}): "${foodDescription}"
    
    Provide detailed nutritional information including calories, macronutrients, and dietary compatibility.`;

    return await simulateAdvancedAIResponse(foodDescription);
}

function simulateAdvancedAIResponse(foodDescription) {
    const description = foodDescription.toLowerCase();
    const foods = [];
    let totalCalories = 0;
    
    // Comprehensive food database (simulating Google/AI response)
    const comprehensiveFoodDB = {
        // Vegetarian foods
        'pizza': { base: 266, type: 'mixed', variations: { 'slice': 0.5, 'large': 1.5, 'small': 0.7, 'margherita': 0.9, 'veggie': 0.8 } },
        'veggie burger': { base: 390, type: 'vegetarian', variations: { 'small': 0.8, 'large': 1.3 } },
        'biryani': { base: 290, type: 'mixed', variations: { 'veg': 0.8, 'chicken': 1.2, 'mutton': 1.4, 'plate': 1.5 } },
        'rice': { base: 130, type: 'vegetarian', variations: { 'cup': 1, 'bowl': 1.2, 'plate': 1.5, 'fried': 1.3 } },
        'dal': { base: 115, type: 'vegetarian', variations: { 'cup': 1, 'bowl': 1.2, 'tadka': 1.3 } },
        'roti': { base: 71, type: 'vegetarian', variations: { 'chapati': 1, 'butter': 1.4 } },
        'naan': { base: 262, type: 'vegetarian', variations: { 'butter': 1.2, 'garlic': 1.1 } },
        'paneer': { base: 321, type: 'vegetarian', variations: { 'curry': 1, 'tikka': 0.9, 'butter masala': 1.3, 'makhani': 1.4 } },
        'pasta': { base: 131, type: 'vegetarian', variations: { 'plate': 2, 'bowl': 1.5, 'alfredo': 2.5, 'marinara': 1.8 } },
        'salad': { base: 33, type: 'vegetarian', variations: { 'caesar': 4, 'garden': 1, 'greek': 3 } },
        'sandwich': { base: 200, type: 'mixed', variations: { 'club': 1.5, 'grilled cheese': 1.2, 'veg': 0.9 } },
        'samosa': { base: 91, type: 'vegetarian', variations: { 'aloo': 1, 'large': 1.3 } },
        'dosa': { base: 133, type: 'vegetarian', variations: { 'masala': 1.2, 'plain': 1, 'rava': 1.1 } },
        'idli': { base: 39, type: 'vegetarian', variations: { 'piece': 1, 'rava': 1.2 } },
        'poha': { base: 180, type: 'vegetarian', variations: { 'bowl': 1, 'plate': 1.3 } },
        'upma': { base: 200, type: 'vegetarian', variations: { 'bowl': 1, 'rava': 1 } },
        
        // Non-vegetarian foods
        'chicken': { base: 165, type: 'non-vegetarian', variations: { 'curry': 1.8, 'tikka': 1.2, 'fried': 2.2, 'grilled': 1, 'butter': 2.5 } },
        'mutton': { base: 294, type: 'non-vegetarian', variations: { 'curry': 1.5, 'biryani': 1.3, 'kebab': 1.2 } },
        'fish': { base: 206, type: 'non-vegetarian', variations: { 'curry': 1.3, 'fried': 1.8, 'grilled': 1, 'fry': 1.6 } },
        'egg': { base: 68, type: 'non-vegetarian', variations: { 'boiled': 1, 'fried': 1.5, 'scrambled': 1.3, 'omelette': 1.8 } },
        'prawn': { base: 99, type: 'non-vegetarian', variations: { 'curry': 1.5, 'fried': 1.8 } },
        'beef': { base: 250, type: 'non-vegetarian', variations: { 'curry': 1.4, 'steak': 1.2 } },
        'burger': { base: 540, type: 'non-vegetarian', variations: { 'chicken': 1, 'beef': 1.2, 'fish': 0.9 } },
        
        // Beverages
        'coffee': { base: 2, type: 'vegetarian', variations: { 'black': 1, 'latte': 25, 'cappuccino': 15, 'mocha': 35 } },
        'tea': { base: 2, type: 'vegetarian', variations: { 'plain': 1, 'chai': 8, 'milk': 10, 'green': 1 } },
        'juice': { base: 45, type: 'vegetarian', variations: { 'orange': 1.2, 'apple': 1.1, 'mango': 1.4 } },
        
        // Snacks and sweets
        'chips': { base: 152, type: 'vegetarian', variations: { 'packet': 3, 'small': 1 } },
        'chocolate': { base: 50, type: 'vegetarian', variations: { 'bar': 5, 'piece': 1, 'dark': 0.9 } },
        'ice cream': { base: 137, type: 'vegetarian', variations: { 'scoop': 1, 'cup': 1.5 } },
        'cake': { base: 257, type: 'vegetarian', variations: { 'slice': 1, 'piece': 1, 'chocolate': 1.2 } }
    };

    // Extract quantities with better pattern matching
    const quantityPatterns = [
        { regex: /(\d+)\s*(piece|pieces|slice|slices|serving|servings)/i, multiplier: 1 },
        { regex: /(\d+)\s*(cup|cups|bowl|bowls|glass|glasses)/i, multiplier: 1 },
        { regex: /(\d+)\s*(plate|plates|portion|portions)/i, multiplier: 1 },
        { regex: /(one|a|an)\s/i, multiplier: 1, quantity: 1 },
        { regex: /(two|couple)\s/i, multiplier: 1, quantity: 2 },
        { regex: /(three)\s/i, multiplier: 1, quantity: 3 },
        { regex: /(half|1\/2)\s/i, multiplier: 0.5, quantity: 1 },
        { regex: /(quarter|1\/4)\s/i, multiplier: 0.25, quantity: 1 }
    ];

    // Analyze each food in the comprehensive database
    Object.keys(comprehensiveFoodDB).forEach(foodName => {
        if (description.includes(foodName)) {
            const foodData = comprehensiveFoodDB[foodName];
            
            // Skip non-vegetarian foods for vegetarians
            if (dietPreference === 'vegetarian' && foodData.type === 'non-vegetarian') {
                return;
            }
            
            let quantity = 1;
            let multiplier = 1;
            
            // Find quantity
            for (let pattern of quantityPatterns) {
                const match = description.match(pattern.regex);
                if (match) {
                    quantity = pattern.quantity || parseInt(match[1]) || 1;
                    if (pattern.multiplier) multiplier *= pattern.multiplier;
                    break;
                }
            }
            
            // Find variations
            Object.keys(foodData.variations).forEach(variation => {
                if (description.includes(variation)) {
                    multiplier *= foodData.variations[variation];
                }
            });
            
            const calories = Math.round(foodData.base * quantity * multiplier);
            totalCalories += calories;
            
            foods.push({
                name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
                quantity: `${quantity} ${quantity > 1 ? 'servings' : 'serving'}`,
                calories: calories,
                confidence: 'high',
                type: foodData.type
            });
        }
    });

    // If no specific foods found, use AI-like general estimation
    if (foods.length === 0) {
        const generalEstimate = estimateGeneralCalories(description);
        totalCalories = generalEstimate.calories;
        foods.push(generalEstimate.food);
    }

    // Add dietary preference note
    let dietaryNote = '';
    if (dietPreference === 'vegetarian') {
        const nonVegCount = foods.filter(f => f.type === 'non-vegetarian').length;
        if (nonVegCount > 0) {
            dietaryNote = ' ⚠️ Note: Some items may not align with your vegetarian preference.';
        }
