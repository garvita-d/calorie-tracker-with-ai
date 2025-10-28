# 🍎 AI-Powered Voice Calorie Tracker

An intelligent calorie tracking application with voice recognition, AI-powered food analysis, and personalized dietary recommendations.

## ✨ Features

- 🎤 **Voice Recognition**: Speak your meals naturally
- 🤖 **AI Food Analysis**: Comprehensive food database with smart calorie estimation
- 🥗 **Dietary Preferences**: Vegetarian and Non-Vegetarian options
- 📊 **Daily Statistics**: Track calories consumed vs. target
- 💡 **Smart Recommendations**: Personalized food suggestions
- 🔄 **AI Rephrasing**: Get alternative ways to describe your food
- 📱 **Responsive Design**: Works on desktop and mobile

1. **Project structure**:
```
voice-calorie-tracker/
├── index.html
├── styles.css
├── app.js
└── README.md
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

All styling is in `styles.css`. Key sections:
- **Colors**: Gradient backgrounds and theme colors
- **Layouts**: Grid systems for stats and recommendations
- **Animations**: Pulse effects and transitions
- **Responsive**: Mobile breakpoints at 768px

## 🌐 Browser Support

- ✅ Chrome (recommended for voice recognition)
- ✅ Edge
- ✅ Safari (limited voice support)
- ✅ Firefox (limited voice support)

## 📝 Usage

1. **Set Dietary Preference**: Choose Vegetarian or Non-Vegetarian
2. **Voice Input**: Click "Start Voice Recognition" and speak your meal
3. **Manual Input**: Type food description and click "Analyze"
4. **Rephrase**: Use AI to rephrase your food description
5. **Track Progress**: View daily stats and meal log
6. **Get Recommendations**: See personalized food suggestions

## 🐛 Troubleshooting

### Voice Recognition Not Working
- Use Chrome or Edge browser
- Allow microphone permissions
- Check if microphone is connected

### Food Not Recognized
- Try rephrasing your description
- Include quantities (e.g., "2 slices of pizza")
- Use common food names

## 📄 License

Free to use and modify for personal projects.

## 🤝 Contributing

Feel free to fork, modify, and submit pull requests!

## 📧 Support

For issues or questions, create an issue on GitHub.

---

Made by Garvita Dalmia
