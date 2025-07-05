# Wage Calculator Web App
(https://wagecalculator.onrender.com)

A Flask-based web application for tracking work hours and calculating wages with a calendar interface.

## Features

- **Interactive Calendar**: Navigate through months and click on dates to enter time
- **Time Entry**: Enter IN and OUT times for each day with quick time suggestions
- **Automatic Calculations**: Real-time calculation of hours and wages
- **Sunday Default**: Sundays automatically default to 9 AM - 6 PM (9 hours)
- **Wage Monitoring**: Real-time display of total hours and earnings in Rupees
- **Absence Tracking**: Mark days as absent when no work was done
- **Data Persistence**: All entries are saved to a JSON file
- **Responsive Design**: Works on desktop and mobile devices
- **Enhanced UI/UX**: Larger calendar, better time entry interface, and improved styling

## Setup

1. **Install Python** (if not already installed)
   - Download from [python.org](https://python.org)

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**
   ```bash
   python app.py
   ```

4. **Access the App**
   - Open your browser and go to `http://localhost:5000`

## Usage

1. **View Calendar**: The app opens to the current month's calendar
2. **Navigate Months**: Use the arrow buttons to move between months
3. **Enter Time**: Click on any date to open the time entry modal
4. **Set Times**: Enter your IN and OUT times (Sundays default to 9 AM - 6 PM)
   - Use the quick time suggestion buttons for common times
   - Or manually enter your specific times
5. **Mark Absent**: Click "🚫 Mark Absent" to mark a day as absent
6. **Save Entry**: Click "💾 Save Entry" to store your time
7. **Monitor Wages**: View total hours and earnings at the top of the page

## Features Explained

### Calendar Interface
- **Current Date**: Highlighted in blue with scale effect
- **Sundays**: Highlighted in yellow with default 9-hour display
- **Days with Entries**: Highlighted in green with hours shown
- **Absent Days**: Highlighted in red with "Absent" label
- **Other Month Days**: Grayed out and non-clickable
- **Larger Size**: Increased calendar size for better visibility

### Time Entry
- **IN Time**: When you started work (with clock emoji)
- **OUT Time**: When you finished work (with clock emoji)
- **Quick Suggestions**: Click buttons for common times (9 AM, 10 AM, 11 AM, 5 PM, 6 PM, 7 PM)
- **Real-time Calculation**: Hours and daily wage calculated as you type
- **Overnight Support**: Handles shifts that go past midnight
- **Daily Wage Display**: Shows your earnings for the selected day

### Absence Tracking
- **Mark Absent**: Click the red "🚫 Mark Absent" button to mark a day as absent
- **Visual Indicator**: Absent days appear in red on the calendar
- **Zero Hours**: Absent days contribute 0 hours to total calculations
- **No Wage Impact**: Absent days don't affect your total earnings
- **Easy Management**: You can change an absent day to a work day by entering times

### Wage Calculation
- **Hourly Rate**: ₹50.00 per hour (configurable in app.py)
- **Total Hours**: Sum of all daily hours (excluding absent days)
- **Total Wage**: Total hours × hourly rate (displayed in Rupees)
- **Real-time Updates**: Updates automatically when entries are saved

### Sunday Exception
- Sundays automatically default to 9 AM IN and 6 PM OUT
- This represents a standard 9-hour workday
- You can still modify these times if needed

## File Structure

```
wage-calculator/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── wage_data.json     # Data storage (created automatically)
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── style.css      # CSS styles
    └── script.js      # JavaScript functionality
```

## Customization

### Change Hourly Rate
Edit the `hourly_rate` variable in `app.py`:
```python
hourly_rate = 50  # Change this to your desired rate in Rupees
```

### Modify Sunday Default Times
Edit the default times in `static/script.js`:
```javascript
if (isSunday) {
    inTimeInput.value = '09:00';  // Change IN time
    outTimeInput.value = '18:00'; // Change OUT time
}
```

### Add More Time Suggestions
Edit the time suggestion buttons in `templates/index.html`:
```html
<div class="time-suggestions">
    <button type="button" class="time-suggestion" data-time="09:00">9:00 AM</button>
    <!-- Add more buttons as needed -->
</div>
```

## Data Storage

All time entries are stored in `wage_data.json` in the following format:
```json
{
  "2024-01-15": {
    "in_time": "09:00",
    "out_time": "17:00",
    "hours": 8.0,
    "absent": false
  },
  "2024-01-16": {
    "in_time": "00:00",
    "out_time": "00:00",
    "hours": 0,
    "absent": true
  }
}
```

## UI/UX Improvements

### Enhanced Features
- **Larger Calendar**: Increased size for better visibility and interaction
- **Bigger Text**: All text elements are larger and more readable
- **Time Suggestions**: Quick buttons for common work times
- **Daily Wage Display**: Shows earnings for the selected day
- **Better Modal**: Larger, more spacious time entry interface
- **Improved Buttons**: Enhanced styling with emojis and better hover effects
- **Absence Tracking**: Red button to mark days as absent
- **Responsive Design**: Optimized for all screen sizes

### Visual Enhancements
- **Gradient Backgrounds**: Modern gradient effects throughout
- **Hover Effects**: Interactive elements with smooth animations
- **Better Spacing**: Improved layout and spacing for readability
- **Enhanced Cards**: Wage summary cards with hover effects
- **Professional Styling**: Clean, modern design with attention to detail
- **Color Coding**: Different colors for different day types (work, absent, Sunday)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

1. **Port Already in Use**: Change the port in `app.py`:
   ```python
   app.run(debug=True, port=5001)
   ```

2. **Data Not Saving**: Check file permissions for `wage_data.json`

3. **Calendar Not Loading**: Ensure JavaScript is enabled in your browser

4. **Time Suggestions Not Working**: Make sure you're clicking the suggestion buttons, not the input field

5. **Absence Button Not Working**: Ensure you're clicking the red "Mark Absent" button in the modal

## License

This project is open source and available under the MIT License. 
