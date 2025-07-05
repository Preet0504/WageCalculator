class WageReport {
    constructor() {
        this.reportData = [];
        this.summary = {};
        this.charts = {};
        
        this.init();
    }
    
    async init() {
        await this.loadReportData();
        this.setupEventListeners();
        this.updateSummary();
        this.populateTable();
        this.createCharts();
    }
    
    setupEventListeners() {
        document.getElementById('download-csv').addEventListener('click', () => {
            this.downloadCSV();
        });
    }
    
    async loadReportData() {
        try {
            const response = await fetch('/api/get_report_data');
            const data = await response.json();
            
            if (data.success) {
                this.reportData = data.data;
                this.summary = data.summary;
            } else {
                console.error('Error loading report data:', data.error);
            }
        } catch (error) {
            console.error('Error loading report data:', error);
        }
    }
    
    updateSummary() {
        document.getElementById('total-work-days').textContent = this.summary.total_work_days || 0;
        document.getElementById('total-absent-days').textContent = this.summary.total_absent_days || 0;
        document.getElementById('total-hours').textContent = (this.summary.total_hours || 0).toFixed(2);
        document.getElementById('total-wage').textContent = `₹${(this.summary.total_wage || 0).toFixed(2)}`;
        document.getElementById('avg-hours').textContent = (this.summary.average_hours_per_day || 0).toFixed(2);
        document.getElementById('avg-wage').textContent = `₹${(this.summary.average_wage_per_day || 0).toFixed(2)}`;
    }
    
    populateTable() {
        const tbody = document.getElementById('report-tbody');
        tbody.innerHTML = '';
        
        this.reportData.forEach(row => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${row.date}</td>
                <td>${row.day}</td>
                <td>${row.in_time}</td>
                <td>${row.out_time}</td>
                <td>${row.raw_hours.toFixed(2)}</td>
                <td>${row.regular_hours.toFixed(2)}</td>
                <td>${row.overtime_hours.toFixed(2)}</td>
                <td>₹${row.hourly_rate.toFixed(2)}</td>
                <td>₹${row.regular_wage.toFixed(2)}</td>
                <td>₹${row.overtime_wage.toFixed(2)}</td>
                <td>₹${row.daily_wage.toFixed(2)}</td>
                <td><span class="status-${row.status.toLowerCase()}">${row.status}</span></td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    createCharts() {
        this.createWorkAbsentChart();
        this.createHoursTrendChart();
        this.createWageTrendChart();
        this.createWeeklyChart();
    }
    
    createWorkAbsentChart() {
        const ctx = document.getElementById('workAbsentChart').getContext('2d');
        
        this.charts.workAbsent = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Work Days', 'Absent Days'],
                datasets: [{
                    data: [this.summary.total_work_days, this.summary.total_absent_days],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    createHoursTrendChart() {
        const workDays = this.reportData.filter(row => row.status === 'Work');
        const labels = workDays.map(row => row.date);
        const data = workDays.map(row => row.hours);
        
        const ctx = document.getElementById('hoursTrendChart').getContext('2d');
        
        this.charts.hoursTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Hours (After Recess)',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    createWageTrendChart() {
        const workDays = this.reportData.filter(row => row.status === 'Work');
        const labels = workDays.map(row => row.date);
        const data = workDays.map(row => row.daily_wage);
        
        const ctx = document.getElementById('wageTrendChart').getContext('2d');
        
        this.charts.wageTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Wage (₹)',
                    data: data,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Wage (₹)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }
    
    createWeeklyChart() {
        // Group data by day of week
        const weeklyData = {};
        const workDays = this.reportData.filter(row => row.status === 'Work');
        
        workDays.forEach(row => {
            const day = row.day;
            if (!weeklyData[day]) {
                weeklyData[day] = { hours: 0, wage: 0, count: 0 };
            }
            weeklyData[day].hours += row.hours;
            weeklyData[day].wage += row.daily_wage;
            weeklyData[day].count += 1;
        });
        
        // Calculate averages
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const avgHours = days.map(day => {
            const data = weeklyData[day];
            return data ? (data.hours / data.count) : 0;
        });
        
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        
        this.charts.weekly = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Average Hours',
                    data: avgHours,
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffc107',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }
    
    async downloadCSV() {
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
                
                this.showNotification('Report downloaded successfully!', 'success');
            } else {
                this.showNotification('Error generating report', 'error');
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showNotification('Error downloading report', 'error');
        }
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

// Initialize the report when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WageReport();
}); 