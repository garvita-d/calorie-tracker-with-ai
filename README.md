# 🍎 AI-Powered Voice Calorie Tracker

An intelligent calorie tracking application with voice recognition, AI-powered food analysis, and personalized dietary recommendations.

**🌐 Live Demo:** [https://inspiring-cranachan-6554f6.netlify.app](https://inspiring-cranachan-6554f6.netlify.app)

## ✨ Features

- 🎤 **Voice Recognition**: Speak your meals naturally with Web Speech API
- 🤖 **AI Food Analysis**: Comprehensive food database with smart calorie estimation
- 🥗 **Dietary Preferences**: Vegetarian and Non-Vegetarian options with tailored recommendations
- 📊 **Daily Statistics**: Real-time tracking of calories consumed vs. target
- 💡 **Smart Recommendations**: Personalized food suggestions based on dietary preference
- 🔄 **AI Rephrasing**: Get alternative ways to describe your food
- 📱 **Responsive Design**: Fully responsive interface works on desktop and mobile
- 🎙️ **Fallback Recording**: Manual audio recording option for browsers without live speech recognition

## 🚀 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: Web Speech API, MediaRecorder API
- **Deployment**: Netlify
- **Design**: Gradient UI with modern responsive layout

## 📁 Project Structure

```
voice-calorie-tracker/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── app.js             # Core application logic and AI analysis
└── README.md          # Project documentation
```

## 🔧 Configuration

### Customizing Daily Calorie Target

In `app.js`, modify:
```javascript
let dailyTarget = 2000; // Change to your preferred target
```

### Adding More Foods to Database

In `app.js`, add to `comprehensiveFoodDB` object:
```javascript
'your_food': { 
    base: 250, 
    type: 'vegetarian', // or 'non-vegetarian' or 'mixed'
    variations: { 
        'large': 1.5, 
        'small': 0.8 
    } 
}
```

## 🎨 Customizing Styles

All styling is in `style.css`. Key sections:
- **Colors**: Gradient backgrounds and theme colors
- **Layouts**: Grid systems for stats and recommendations
- **Animations**: Pulse effects and smooth transitions
- **Responsive**: Mobile breakpoints at 768px

## 🌐 Browser Support

- ✅ Chrome (recommended for best voice recognition)
- ✅ Edge (full voice recognition support)
- ⚠️ Safari (limited voice support, fallback recording available)
- ⚠️ Firefox (limited voice support, fallback recording available)

## 📝 Usage

1. **Set Dietary Preference**: Choose Vegetarian or Non-Vegetarian on first launch
2. **Voice Input**: Click "Start Voice Recognition" and speak your meal description
3. **Manual Input**: Type food description in the text field and click "Analyze"
4. **Rephrase**: Use AI to generate alternative descriptions of your food
5. **Track Progress**: View real-time daily stats and complete meal log
6. **Get Recommendations**: Receive personalized food suggestions based on remaining calories

## 🐛 Troubleshooting

### Voice Recognition Not Working
- Use Chrome or Edge browser for best results
- Allow microphone permissions when prompted
- Check if microphone is properly connected
- Try the fallback recording option if live recognition fails

### Food Not Recognized
- Try rephrasing your description using the AI rephrase feature
- Include quantities (e.g., "2 slices of pizza", "1 bowl of rice")
- Use common food names from the comprehensive database

## 📄 License

Free to use and modify for personal projects.

## 🤝 Contributing

Feel free to fork, modify, and submit pull requests!

## 📧 Support

For issues or questions, create an issue on GitHub or visit the [live demo](https://inspiring-cranachan-6554f6.netlify.app).

---

**Developed by Garvita Dalmia**  
🔗 [Live Application](https://inspiring-cranachan-6554f6.netlify.app)
