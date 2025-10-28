// Application State
let dailyCalories = 0;
let dailyTarget = 2000;
let mealLog = [];
let recognition = null;
let isListening = false;
let isProcessing = false;
let dietPreference = null;
let lastInput = '';
let recognitionSupported = false; // NEW: indicates presence of SpeechRecognition
let mediaRecorder = null; // NEW: for fallback recording
let recordedChunks = []; // NEW

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
	// If browser supports Web Speech API (SpeechRecognition / webkitSpeechRecognition)
	if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
		recognitionSupported = true;
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
		// Fallback: mark unsupported and do NOT treat as fatal — we'll open a recording modal instead
		recognitionSupported = false;
		updateVoiceStatus('⚠️ Live speech recognition not available. Opening recording fallback when you press Start.', 'warning');
		return false;
	}
}

function startVoiceRecognition() {
	if (isProcessing) {
		showMessage('Please wait for current analysis to complete', 'warning');
		return;
	}

	// Ensure recognition is initialized (sets recognitionSupported)
	if (recognition === null) {
		initSpeechRecognition();
	}

	// Always request mic permission on the user gesture so browsers will prompt
	ensureMicrophonePermission().then(stream => {
		// If user denied permission, stream will be null
		if (!stream && !recognitionSupported) {
			// Nothing to do
			return;
		}

		// If SpeechRecognition API supported, start live recognition (we don't need the stream for it)
		if (recognitionSupported && recognition && !isListening) {
			try {
				recognition.start();
			} catch (error) {
				console.error('Error starting recognition:', error);
				updateVoiceStatus('❌ Failed to start voice recognition', 'error');
				resetVoiceButtons();
			}
			// If a stream was returned, stop its tracks since SpeechRecognition handles audio internally
			if (stream) {
				try { stream.getTracks().forEach(t => t.stop()); } catch(e) {}
			}
			return;
		}

		// Fallback: open modal and start fallback recording using the granted stream
		openRecordModal();
		// If we have a stream, pass it to the fallback recorder so it doesn't prompt again
		if (stream) startFallbackRecording(stream);
		else startFallbackRecording(); // fallback will request permission itself if needed
	}).catch(err => {
		console.error('Permission flow error:', err);
		showMessage('Unable to access microphone.', 'error');
	});
}

function stopVoiceRecognition() {
	// If using SpeechRecognition API
	if (recognition && isListening) {
		recognition.stop();
		return;
	}

	// If using fallback recording
	stopFallbackRecording();
}

/* ---------- Fallback recording modal + MediaRecorder logic ---------- */
function openRecordModal() {
	const modal = document.getElementById('recordModal');
	if (!modal) return;
	modal.style.display = 'flex';
	document.getElementById('manualTranscript').value = '';
	document.getElementById('recordPlayback').style.display = 'none';
	document.getElementById('downloadLink').style.display = 'none';
}

function closeRecordModal() {
	const modal = document.getElementById('recordModal');
	if (!modal) return;
	modal.style.display = 'none';
	// cleanup recorded data
	recordedChunks = [];
	mediaRecorder = null;
}

async function startFallbackRecording(passedStream) {
	// If a stream was provided (from ensureMicrophonePermission), use it
	let stream = passedStream || null;

	if (!stream) {
		// Request microphone permission and stream
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			showMessage('Microphone access not available in this browser.', 'error');
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (err) {
			console.error('Recording error:', err);
			showMessage('Unable to access microphone.', 'error');
			return;
		}
	}

	// Prepare recorder using stream
	recordedChunks = [];
	try {
		mediaRecorder = new MediaRecorder(stream);
	} catch (err) {
		console.error('MediaRecorder not supported or failed:', err);
		showMessage('Recording is not supported in this browser.', 'error');
		// stop tracks if we created the stream locally
		if (!passedStream) stream.getTracks().forEach(t => t.stop());
		return;
	}

	mediaRecorder.ondataavailable = (e) => {
		if (e.data && e.data.size > 0) recordedChunks.push(e.data);
	};
	mediaRecorder.onstop = () => {
		const blob = new Blob(recordedChunks, { type: 'audio/webm' });
		const url = URL.createObjectURL(blob);
		const audioEl = document.getElementById('recordPlayback');
		const dl = document.getElementById('downloadLink');
		if (audioEl) {
			audioEl.src = url;
			audioEl.style.display = 'block';
		}
		if (dl) {
			dl.href = url;
			dl.download = 'recording.webm';
			dl.textContent = '⬇️ Download recording';
			dl.style.display = 'block';
		}
		// stop all tracks if we created them here (or always stop to free mic)
		try { stream.getTracks().forEach(t => t.stop()); } catch(e) {}
	};
	mediaRecorder.start();

	// Update modal buttons
	document.getElementById('recordStartBtn').style.display = 'none';
	document.getElementById('recordStopBtn').style.display = 'inline-block';
	updateVoiceStatus('🔴 Recording... Press Stop when done', 'listening');
}

function stopFallbackRecording() {
	if (mediaRecorder && mediaRecorder.state !== 'inactive') {
		mediaRecorder.stop();
	}
	// Update modal buttons
	document.getElementById('recordStartBtn').style.display = 'inline-block';
	document.getElementById('recordStopBtn').style.display = 'none';
	updateVoiceStatus('✅ Recording stopped — you can play or download the audio. Paste transcript below and click Use Transcript.', 'success');
}

function useFallbackTranscript() {
	const text = document.getElementById('manualTranscript').value.trim();
	if (!text) {
		showMessage('Please type or paste a transcript, or record audio first.', 'warning');
		return;
	}
	document.getElementById('voiceResult').innerHTML = `<strong>Transcript:</strong> "${text}"`;
	lastInput = text;
	closeRecordModal();
	processFoodInput(text);
}

/* ---------- existing functions remain unchanged below ---------- */

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
	}

	return {
		foods,
		totalCalories,
		dietaryNote
	};
}

function estimateGeneralCalories(description) {
	// Simple heuristic-based estimation when DB lookup fails
	let cals = 250;
	if (/salad|fruit|greens/.test(description)) cals = 80;
	if (/soup|broth/.test(description)) cals = 120;
	if (/pizza|burger|fried|kebab|biryani|pasta/.test(description)) cals = 450;
	if (/coffee|latte|tea|chai/.test(description)) cals = 60;
	if (/two|2|slice|slices/.test(description)) cals *= 1.5;

	return {
		calories: Math.round(cals),
		food: {
			name: description.split(' ').slice(0, 3).join(' ') || 'Food item',
			quantity: '1 serving',
			calories: Math.round(cals),
			confidence: 'low',
			type: 'mixed'
		}
	};
}

// Process food input (from manual input or voice)
async function processFoodInput(input) {
	// Accept either parameter or text field
	let foodDesc = '';
	if (typeof input === 'string' && input.trim().length > 0) {
		foodDesc = input.trim();
	} else {
		const el = document.getElementById('foodInput');
		if (!el) return;
		foodDesc = el.value.trim();
	}

	if (!foodDesc) {
		showMessage('Please enter or say a food description to analyze.', 'warning');
		return;
	}

	// Prevent double processing
	if (isProcessing) {
		showMessage('Analysis in progress. Please wait...', 'warning');
		return;
	}

	isProcessing = true;
	document.getElementById('analyzeBtn').disabled = true;
	document.getElementById('btnText').innerText = 'Analyzing...';

	try {
		const result = await analyzeFood(foodDesc);
		// Add each detected food to meal log
		result.foods.forEach(f => {
			addMealToLog(f);
			dailyCalories += f.calories;
		});
		updateDailyStats();
		updateRecommendations();
		showMessage(`Analysis complete. Estimated ${result.totalCalories} calories.${result.dietaryNote || ''}`, 'success');
		// Clear manual input (but keep lastInput for voice)
		if (!input) document.getElementById('foodInput').value = '';
	} catch (err) {
		console.error(err);
		showMessage('Failed to analyze food. Try again.', 'error');
	} finally {
		isProcessing = false;
		document.getElementById('analyzeBtn').disabled = false;
		document.getElementById('btnText').innerText = 'Analyze Food';
	}
}

function addMealToLog(foodItem) {
	const mealLogEl = document.getElementById('mealLog');
	// Create meal item element
	const wrapper = document.createElement('div');
	wrapper.className = 'meal-item';

	const info = document.createElement('div');
	info.className = 'meal-info';
	info.innerHTML = `<strong>${foodItem.name}</strong><div class="ai-analysis">${foodItem.quantity} • ${foodItem.confidence} confidence</div>`;

	const cal = document.createElement('div');
	cal.className = 'meal-calories';
	cal.textContent = `${foodItem.calories} cal`;

	wrapper.appendChild(info);
	wrapper.appendChild(cal);

	// Remove placeholder if present
	if (mealLogEl.querySelector('p') && mealLogEl.children.length === 1) {
		mealLogEl.innerHTML = '';
	}

	mealLogEl.prepend(wrapper);
	mealLog.unshift(foodItem);
}

function updateDailyStats() {
	document.getElementById('consumedCals').textContent = dailyCalories;
	document.getElementById('targetCals').textContent = dailyTarget;
	const remaining = Math.max(0, dailyTarget - dailyCalories);
	document.getElementById('remainingCals').textContent = remaining;
}

function updateRecommendations() {
	const recArea = document.getElementById('recommendationsArea');
	// Simple recommendations based on dietPreference and remaining calories
	if (!dietPreference) {
		recArea.innerHTML = `<p>Please set a dietary preference to get tailored recommendations.</p>`;
		return;
	}
	const remaining = Math.max(0, dailyTarget - dailyCalories);
	const recs = [];
	if (remaining <= 0) {
		recs.push('You have reached your daily calorie target. Consider light activity or a low-calorie salad if hungry.');
	} else {
		if (dietPreference === 'vegetarian') {
			recs.push('Try a grilled vegetable salad with quinoa (about 350 cal).');
			if (remaining < 300) recs.push('A small fruit bowl (≈150 cal) would fit within your remaining calories.');
		} else {
			recs.push('Grilled chicken breast with steamed veggies (≈300 cal) is a good option.');
			if (remaining < 300) recs.push('A boiled egg (≈70 cal) or a light soup could fit.');
		}
	}
	recArea.innerHTML = `<div class="food-grid">${recs.map(r => `<div class="food-card ${dietPreference === 'vegetarian' ? 'veg' : 'non-veg'}"><h4>Suggestion</h4><p>${r}</p></div>`).join('')}</div>`;
}

function rephraseInput() {
	// Provide quick AI-like rephrases/suggestions for the manual input
	const input = document.getElementById('foodInput').value.trim();
	if (!input) {
		showMessage('Enter a food phrase to rephrase.', 'warning');
		return;
	}
	const area = document.getElementById('rephraseArea');
	const container = document.getElementById('rephrasedOptions');
	area.style.display = 'block';
	// Simple rephrasing patterns
	const suggestions = [
		`${input} — 1 serving`,
		`Two servings of ${input}`,
		`${input} with extra sauce`,
		`Small portion of ${input}`
	];
	container.innerHTML = suggestions.map(s => `<div class="food-card" style="cursor:pointer" onclick="document.getElementById('foodInput').value='${s.replace("'", "\\'") }'; document.getElementById('rephraseArea').style.display='none';">${s}</div>`).join('');
}

function showMessage(message, type = 'info', timeout = 4500) {
	const area = document.getElementById('messageArea');
	area.innerHTML = `<div class="${type}">${message}</div>`;
	if (timeout > 0) {
		setTimeout(() => {
			// Only clear if unchanged
			area.innerHTML = '';
		}, timeout);
	}
}

// Wire up voice buttons and fallback modal after DOM available
document.addEventListener('DOMContentLoaded', function() {
	// Attach to UI buttons
	const startBtn = document.getElementById('voiceBtn');
	const stopBtn = document.getElementById('stopBtn');

	if (startBtn) startBtn.addEventListener('click', startVoiceRecognition);
	if (stopBtn) stopBtn.addEventListener('click', stopVoiceRecognition);

	// Fallback modal button wiring
	const recordStart = document.getElementById('recordStartBtn');
	const recordStop = document.getElementById('recordStopBtn');
	const recordClose = document.getElementById('recordCloseBtn');
	const useTranscript = document.getElementById('useTranscriptBtn');

	if (recordStart) recordStart.addEventListener('click', startFallbackRecording);
	if (recordStop) recordStop.addEventListener('click', stopFallbackRecording);
	if (recordClose) recordClose.addEventListener('click', closeRecordModal);
	if (useTranscript) useTranscript.addEventListener('click', useFallbackTranscript);

	// Initialize recognition support indicator
	initSpeechRecognition();

	// Initialize display for diet indicator if already set
	if (dietPreference) {
		document.getElementById('dietIndicator').style.display = 'inline-block';
		document.getElementById('dietType').textContent = dietPreference === 'vegetarian' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian';
	}

	updateDailyStats();
	updateRecommendations();
});

// NEW: request microphone permission and return stream (or null)
async function ensureMicrophonePermission() {
	try {
		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			// Immediately stop tracks if caller only wanted permission (caller may pass stream to recorder)
			// Do not stop here if caller will use the stream (we return it).
			return stream;
		} else if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
			// old callback API fallback (wrap in Promise)
			const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
			return new Promise((resolve, reject) => {
				getUserMedia.call(navigator, { audio: true }, resolve, reject);
			});
		} else {
			return null;
		}
	} catch (err) {
		console.error('Microphone permission denied or error:', err);
		showMessage('Microphone permission was denied or is unavailable.', 'error');
		return null;
	}
}
