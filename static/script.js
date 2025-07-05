class WageCalculator {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.wageData = {};
        this.hourlyRate = 50;
        
        this.init();
    }
    
    async init() {
        await this.loadWageData();
        this.setupEventListeners();
        this.renderCalendar();
        this.updateWageSummary();
    }
    
    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        // Calendar controls
        document.getElementById('generate-report').addEventListener('click', () => {
            this.generateReport();
        });
        
        document.getElementById('reset-month').addEventListener('click', () => {
            this.resetMonthlyData();
        });
        
        // Modal events
        const modal = document.getElementById('time-modal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Form submission
        document.getElementById('time-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTimeEntry();
        });
        
        // Absence button
        document.getElementById('absence-btn').addEventListener('click', () => {
            this.markAbsent();
        });
        
        // Reset daily button
        document.getElementById('reset-daily-btn').addEventListener('click', () => {
            this.resetDailyEntry();
        });
        
        // Real-time hours calculation
        document.getElementById('in-time').addEventListener('input', () => this.calculateHours());
        document.getElementById('out-time').addEventListener('input', () => this.calculateHours());
        document.getElementById('hourly-rate-input').addEventListener('input', () => this.calculateHours());
        
        // Mobile-specific improvements
        this.setupMobileImprovements();
        
        // Time suggestion buttons
        this.setupTimeSuggestions();
    }
    
    setupMobileImprovements() {
        // Prevent zoom on input focus (mobile)
        const inputs = document.querySelectorAll('input[type="time"], input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Prevent zoom on iOS
                if (window.innerWidth <= 768) {
                    input.style.fontSize = '16px';
                }
            });
            
            input.addEventListener('blur', () => {
                // Restore font size
                if (window.innerWidth <= 768) {
                    input.style.fontSize = '';
                }
            });
        });
        
        // Improve touch scrolling
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }
        
        // Prevent body scroll when modal is open
        const modal = document.getElementById('time-modal');
        modal.addEventListener('show', () => {
            document.body.style.overflow = 'hidden';
        });
        
        modal.addEventListener('hide', () => {
            document.body.style.overflow = '';
        });
    }
    
    setupTimeSuggestions() {
        // Setup time suggestion buttons
        document.querySelectorAll('.time-suggestion').forEach(button => {
            button.addEventListener('click', (e) => {
                const time = e.target.dataset.time;
                const targetInput = e.target.closest('.time-input-wrapper').querySelector('input[type="time"]');
                targetInput.value = time;
                this.calculateHours();
            });
        });
    }
    
    async loadWageData() {
        try {
            const response = await fetch('/api/get_entries');
            this.wageData = await response.json();
        } catch (error) {
            console.error('Error loading wage data:', error);
            this.wageData = {};
        }
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // Get previous month's last days
        const prevMonth = new Date(year, month, 0);
        const prevMonthDays = prevMonth.getDate();
        
        const calendarDates = document.getElementById('calendar-dates');
        calendarDates.innerHTML = '';
        
        // Previous month's days
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day);
            this.createDateButton(date, calendarDates, true);
        }
        
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            this.createDateButton(date, calendarDates, false);
        }
        
        // Next month's days to fill the grid
        const totalCells = 42; // 6 rows * 7 days
        const remainingCells = totalCells - (startingDay + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            this.createDateButton(date, calendarDates, true);
        }
    }
    
    createDateButton(date, container, isOtherMonth) {
        const button = document.createElement('button');
        button.className = 'date-btn';
        
        const day = date.getDate();
        const dateString = this.formatDate(date);
        const isToday = this.isToday(date);
        const isSunday = date.getDay() === 0;
        const hasEntry = this.wageData[dateString];
        const isAbsent = hasEntry && hasEntry.absent;
        
        // Add classes based on conditions
        if (isOtherMonth) button.classList.add('other-month');
        if (isToday) button.classList.add('today');
        if (isSunday) button.classList.add('sunday');
        if (hasEntry && !isAbsent) button.classList.add('has-entry');
        if (isAbsent) button.classList.add('absent');
        
        // Create content
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        
        const hoursDisplay = document.createElement('div');
        hoursDisplay.className = 'hours-display';
        
        if (isAbsent) {
            hoursDisplay.textContent = 'Absent';
        } else if (hasEntry) {
            hoursDisplay.textContent = `${hasEntry.hours.toFixed(1)}h`;
        } else if (isSunday && !isOtherMonth) {
            hoursDisplay.textContent = '8h (overtime)';
        }
        
        button.appendChild(dateNumber);
        button.appendChild(hoursDisplay);
        
        // Add click event
        if (!isOtherMonth) {
            button.addEventListener('click', () => this.openTimeModal(date));
        }
        
        container.appendChild(button);
    }
    
    openTimeModal(date) {
        this.selectedDate = date;
        const dateString = this.formatDate(date);
        const isSunday = date.getDay() === 0;
        const existingData = this.wageData[dateString];
        
        // Update modal title
        document.getElementById('selected-date').textContent = dateString;
        
        // Show/hide Sunday note
        const sundayNote = document.getElementById('sunday-note');
        if (isSunday) {
            sundayNote.style.display = 'block';
        } else {
            sundayNote.style.display = 'none';
        }
        
        // Set default values for Sunday
        const inTimeInput = document.getElementById('in-time');
        const outTimeInput = document.getElementById('out-time');
        const hourlyRateInput = document.getElementById('hourly-rate-input');
        
        if (existingData && existingData.absent) {
            // If marked as absent, show empty fields
            inTimeInput.value = '';
            outTimeInput.value = '';
            hourlyRateInput.value = existingData.hourly_rate || 50;
            document.getElementById('regular-hours-display').textContent = '0.00';
            document.getElementById('overtime-hours-display').textContent = '0.00';
            document.getElementById('daily-wage').textContent = '₹0.00';
            document.getElementById('wage-breakdown').textContent = '';
        } else if (isSunday && !existingData) {
            inTimeInput.value = '09:00';
            outTimeInput.value = '18:00';
            hourlyRateInput.value = '50';
        } else if (existingData) {
            inTimeInput.value = existingData.in_time;
            outTimeInput.value = existingData.out_time;
            hourlyRateInput.value = existingData.hourly_rate || 50;
        } else {
            inTimeInput.value = '';
            outTimeInput.value = '';
            hourlyRateInput.value = '50';
        }
        
        this.calculateHours();
        document.getElementById('time-modal').style.display = 'block';
        
        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
        
        // Re-setup time suggestions for the new modal
        this.setupTimeSuggestions();
    }
    
    closeModal() {
        document.getElementById('time-modal').style.display = 'none';
        this.selectedDate = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    calculateHours() {
        const inTime = document.getElementById('in-time').value;
        const outTime = document.getElementById('out-time').value;
        const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 50;
        
        if (inTime && outTime) {
            const { totalHours, regularHours, overtimeHours } = this.calculateHoursWithOvertime(inTime, outTime);
            
            // Check if it's Sunday
            const isSunday = this.selectedDate && this.selectedDate.getDay() === 0;
            
            if (isSunday) {
                // For Sundays, all hours are overtime, apply recess deduction to overtime
                const actualRegularHours = 0;
                const actualOvertimeHours = Math.max(0, overtimeHours - 1); // Deduct 1 hour for recess from overtime
                
                // Calculate wages
                const regularWage = 0;
                const overtimeWage = actualOvertimeHours * hourlyRate * 1.5;
                const totalWage = overtimeWage;
                
                // Update display
                document.getElementById('regular-hours-display').textContent = '0.00';
                document.getElementById('overtime-hours-display').textContent = actualOvertimeHours.toFixed(2);
                document.getElementById('daily-wage').textContent = `₹${totalWage.toFixed(2)}`;
                
                // Show wage breakdown
                document.getElementById('wage-breakdown').textContent = `Overtime: ₹${overtimeWage.toFixed(2)}`;
            } else {
                // For other days, apply recess deduction to regular hours only
                const actualRegularHours = Math.max(0, regularHours - 1);
                const actualOvertimeHours = overtimeHours; // No recess deduction from overtime
                
                // Calculate wages
                const regularWage = actualRegularHours * hourlyRate;
                const overtimeWage = actualOvertimeHours * hourlyRate * 1.5;
                const totalWage = regularWage + overtimeWage;
                
                // Update display
                document.getElementById('regular-hours-display').textContent = actualRegularHours.toFixed(2);
                document.getElementById('overtime-hours-display').textContent = actualOvertimeHours.toFixed(2);
                document.getElementById('daily-wage').textContent = `₹${totalWage.toFixed(2)}`;
                
                // Show wage breakdown
                let breakdown = '';
                if (actualRegularHours > 0) {
                    breakdown += `Regular: ₹${regularWage.toFixed(2)}`;
                }
                if (actualOvertimeHours > 0) {
                    if (breakdown) breakdown += ' | ';
                    breakdown += `Overtime: ₹${overtimeWage.toFixed(2)}`;
                }
                document.getElementById('wage-breakdown').textContent = breakdown;
            }
        } else {
            document.getElementById('regular-hours-display').textContent = '0.00';
            document.getElementById('overtime-hours-display').textContent = '0.00';
            document.getElementById('daily-wage').textContent = '₹0.00';
            document.getElementById('wage-breakdown').textContent = '';
        }
    }
    
    calculateHoursWithOvertime(inTime, outTime) {
        const [inHour, inMin] = inTime.split(':').map(Number);
        const [outHour, outMin] = outTime.split(':').map(Number);
        
        let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
        
        // Handle overnight shifts
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        const totalHours = totalMinutes / 60;
        
        // Check if it's Sunday
        const isSunday = this.selectedDate && this.selectedDate.getDay() === 0;
        
        // If it's Sunday, all hours are overtime
        if (isSunday) {
            return { totalHours, regularHours: 0, overtimeHours: totalHours };
        }
        
        // Define overtime start time (6 PM = 18:00)
        const overtimeStartHour = 18;
        const overtimeStartMin = 0;
        
        // Calculate regular and overtime hours
        if (outHour < overtimeStartHour || (outHour === overtimeStartHour && outMin === 0)) {
            // All hours are regular
            return { totalHours, regularHours: totalHours, overtimeHours: 0 };
        } else if (inHour >= overtimeStartHour) {
            // All hours are overtime
            return { totalHours, regularHours: 0, overtimeHours: totalHours };
        } else {
            // Split between regular and overtime
            const regularMinutes = (overtimeStartHour * 60 + overtimeStartMin) - (inHour * 60 + inMin);
            const overtimeMinutes = (outHour * 60 + outMin) - (overtimeStartHour * 60 + overtimeStartMin);
            
            const regularHours = regularMinutes / 60;
            const overtimeHours = overtimeMinutes / 60;
            
            return { totalHours, regularHours, overtimeHours };
        }
    }
    
    async resetDailyEntry() {
        if (!this.selectedDate) return;
        
        const dateString = this.formatDate(this.selectedDate);
        
        try {
            const response = await fetch('/api/delete_entry', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: dateString
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local data
                delete this.wageData[dateString];
                
                this.closeModal();
                this.renderCalendar();
                this.updateWageSummary();
                
                this.showNotification('Daily entry reset successfully!', 'success');
            } else {
                this.showNotification('Error resetting daily entry', 'error');
            }
        } catch (error) {
            console.error('Error resetting daily entry:', error);
            this.showNotification('Error resetting daily entry', 'error');
        }
    }
    
    async resetMonthlyData() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        if (!confirm(`Are you sure you want to reset all data for ${monthNames[month]} ${year}? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await fetch('/api/delete_month', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    year: year,
                    month: month + 1
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove monthly data from local storage
                const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
                Object.keys(this.wageData).forEach(date => {
                    if (date.startsWith(monthPrefix)) {
                        delete this.wageData[date];
                    }
                });
                
                this.renderCalendar();
                this.updateWageSummary();
                
                this.showNotification(`Monthly data for ${monthNames[month]} ${year} reset successfully!`, 'success');
            } else {
                this.showNotification('Error resetting monthly data', 'error');
            }
        } catch (error) {
            console.error('Error resetting monthly data:', error);
            this.showNotification('Error resetting monthly data', 'error');
        }
    }
    
    async generateReport() {
        try {
            const response = await fetch('/api/generate_report');
            const data = await response.json();
            
            if (data.success) {
                // Create and download the report
                const blob = new Blob([data.report], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wage_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Report generated and downloaded successfully!', 'success');
            } else {
                this.showNotification('Error generating report', 'error');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Error generating report', 'error');
        }
    }
    
    async markAbsent() {
        if (!this.selectedDate) return;
        
        const dateString = this.formatDate(this.selectedDate);
        const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 50;
        
        try {
            const response = await fetch('/api/save_entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: dateString,
                    in_time: '00:00',
                    out_time: '00:00',
                    hourly_rate: hourlyRate,
                    absent: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local data
                this.wageData[dateString] = {
                    in_time: '00:00',
                    out_time: '00:00',
                    hours: 0,
                    regular_hours: 0,
                    overtime_hours: 0,
                    hourly_rate: hourlyRate,
                    total_wage: 0,
                    absent: true
                };
                
                this.closeModal();
                this.renderCalendar();
                this.updateWageSummary();
                
                // Show success message
                this.showNotification('Day marked as absent!', 'success');
            } else {
                this.showNotification('Error marking day as absent', 'error');
            }
        } catch (error) {
            console.error('Error marking day as absent:', error);
            this.showNotification('Error marking day as absent', 'error');
        }
    }
    
    async saveTimeEntry() {
        if (!this.selectedDate) return;
        
        const inTime = document.getElementById('in-time').value;
        const outTime = document.getElementById('out-time').value;
        const hourlyRate = parseFloat(document.getElementById('hourly-rate-input').value) || 50;
        
        if (!inTime || !outTime) {
            alert('Please enter both IN and OUT times');
            return;
        }
        
        const dateString = this.formatDate(this.selectedDate);
        
        try {
            const response = await fetch('/api/save_entry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: dateString,
                    in_time: inTime,
                    out_time: outTime,
                    hourly_rate: hourlyRate,
                    absent: false
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local data
                this.wageData[dateString] = {
                    in_time: inTime,
                    out_time: outTime,
                    hours: result.hours,
                    regular_hours: result.regular_hours,
                    overtime_hours: result.overtime_hours,
                    hourly_rate: hourlyRate,
                    total_wage: result.total_wage,
                    absent: false
                };
                
                this.closeModal();
                this.renderCalendar();
                this.updateWageSummary();
                
                // Show success message
                this.showNotification('Time entry saved successfully!', 'success');
            } else {
                this.showNotification('Error saving time entry', 'error');
            }
        } catch (error) {
            console.error('Error saving time entry:', error);
            this.showNotification('Error saving time entry', 'error');
        }
    }
    
    async updateWageSummary() {
        try {
            const response = await fetch('/api/calculate_total_wage');
            const data = await response.json();
            
            document.getElementById('total-hours').textContent = data.total_hours.toFixed(2);
            document.getElementById('total-wage').textContent = `₹${data.total_wage.toFixed(2)}`;
            document.getElementById('hourly-rate').textContent = `₹${data.hourly_rate.toFixed(2)}`;
        } catch (error) {
            console.error('Error updating wage summary:', error);
        }
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
    
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 18px 25px;
            border-radius: 15px;
            color: white;
            font-weight: bold;
            font-size: 1.1rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WageCalculator();
}); 