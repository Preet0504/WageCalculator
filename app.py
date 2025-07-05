from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import json
import os
import csv
from io import StringIO

app = Flask(__name__)

# File to store wage data
WAGE_DATA_FILE = 'wage_data.json'

def load_wage_data():
    """Load wage data from JSON file"""
    if os.path.exists(WAGE_DATA_FILE):
        with open(WAGE_DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_wage_data(data):
    """Save wage data to JSON file"""
    with open(WAGE_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    """Main page with calendar"""
    return render_template('index.html')

@app.route('/report')
def report():
    """Report page with visualizations"""
    return render_template('report.html')

@app.route('/api/save_entry', methods=['POST'])
def save_entry():
    """Save time entry for a specific date"""
    data = request.get_json()
    date = data.get('date')
    in_time = data.get('in_time')
    out_time = data.get('out_time')
    hourly_rate = data.get('hourly_rate', 50)  # Default to 50 if not provided
    absent = data.get('absent', False)
    
    if not date:
        return jsonify({'error': 'Missing date field'}), 400
    
    if not absent and (not in_time or not out_time):
        return jsonify({'error': 'Missing required fields'}), 400
    
    wage_data = load_wage_data()
    
    if absent:
        wage_data[date] = {
            'in_time': '00:00',
            'out_time': '00:00',
            'hours': 0,
            'overtime_hours': 0,
            'regular_hours': 0,
            'hourly_rate': hourly_rate,
            'total_wage': 0,
            'absent': True
        }
    else:
        # Calculate hours with overtime and recess deduction
        raw_hours, regular_hours, overtime_hours = calculate_hours_with_overtime(in_time, out_time, date)
        
        # Check if it's Sunday
        is_sunday = False
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            is_sunday = date_obj.weekday() == 6  # Sunday is 6
        except ValueError:
            pass
        
        if is_sunday:
            # For Sundays, all hours are overtime, apply recess deduction to overtime
            actual_regular_hours = 0
            actual_overtime_hours = max(0, overtime_hours - 1)  # Deduct 1 hour for recess from overtime
        else:
            # For other days, apply recess deduction to regular hours only
            actual_regular_hours = max(0, regular_hours - 1)  # Deduct 1 hour for recess from regular hours
            actual_overtime_hours = overtime_hours  # No recess deduction from overtime
        
        # Calculate wages
        regular_wage = actual_regular_hours * hourly_rate
        overtime_wage = actual_overtime_hours * hourly_rate * 1.5
        total_wage = regular_wage + overtime_wage
        
        wage_data[date] = {
            'in_time': in_time,
            'out_time': out_time,
            'hours': actual_regular_hours + actual_overtime_hours,
            'regular_hours': actual_regular_hours,
            'overtime_hours': actual_overtime_hours,
            'raw_hours': raw_hours,
            'hourly_rate': hourly_rate,
            'regular_wage': regular_wage,
            'overtime_wage': overtime_wage,
            'total_wage': total_wage,
            'absent': False
        }
    
    save_wage_data(wage_data)
    
    return jsonify({
        'success': True, 
        'hours': wage_data[date]['hours'],
        'regular_hours': wage_data[date]['regular_hours'],
        'overtime_hours': wage_data[date]['overtime_hours'],
        'total_wage': wage_data[date]['total_wage']
    })

@app.route('/api/delete_entry', methods=['DELETE'])
def delete_entry():
    """Delete a specific date entry"""
    data = request.get_json()
    date = data.get('date')
    
    if not date:
        return jsonify({'error': 'Missing date field'}), 400
    
    wage_data = load_wage_data()
    
    if date in wage_data:
        del wage_data[date]
        save_wage_data(wage_data)
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Entry not found'}), 404

@app.route('/api/delete_month', methods=['DELETE'])
def delete_month():
    """Delete all entries for a specific month"""
    data = request.get_json()
    year = data.get('year')
    month = data.get('month')
    
    if not year or not month:
        return jsonify({'error': 'Missing year or month field'}), 400
    
    wage_data = load_wage_data()
    month_prefix = f"{year}-{str(month).zfill(2)}"
    
    # Find and delete all entries for the month
    deleted_count = 0
    dates_to_delete = []
    
    for date in wage_data.keys():
        if date.startswith(month_prefix):
            dates_to_delete.append(date)
            deleted_count += 1
    
    for date in dates_to_delete:
        del wage_data[date]
    
    save_wage_data(wage_data)
    
    return jsonify({'success': True, 'deleted_count': deleted_count})

@app.route('/api/get_entries')
def get_entries():
    """Get all time entries"""
    return jsonify(load_wage_data())

@app.route('/api/calculate_total_wage')
def calculate_total_wage():
    """Calculate total wage based on all entries"""
    wage_data = load_wage_data()
    # Only count hours for non-absent days (already includes recess deduction and overtime)
    total_hours = sum(entry.get('hours', 0) for entry in wage_data.values() if not entry.get('absent', False))
    total_wage = sum(entry.get('total_wage', 0) for entry in wage_data.values() if not entry.get('absent', False))
    
    # Calculate average hourly rate
    work_entries = [entry for entry in wage_data.values() if not entry.get('absent', False)]
    if work_entries:
        avg_hourly_rate = sum(entry.get('hourly_rate', 50) for entry in work_entries) / len(work_entries)
    else:
        avg_hourly_rate = 50
    
    return jsonify({
        'total_hours': round(total_hours, 2),
        'total_wage': round(total_wage, 2),
        'hourly_rate': round(avg_hourly_rate, 2)
    })

@app.route('/api/get_report_data')
def get_report_data():
    """Get formatted data for the report page"""
    try:
        wage_data = load_wage_data()
        
        # Process data for report
        report_data = []
        total_hours = 0
        total_wage = 0
        work_days = 0
        absent_days = 0
        
        # Sort dates for chronological order
        sorted_dates = sorted(wage_data.keys())
        
        for date in sorted_dates:
            entry = wage_data[date]
            
            # Format date for display
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            day_name = date_obj.strftime('%A')
            formatted_date = date_obj.strftime('%d/%m/%Y')
            
            if entry.get('absent', False):
                # Absent entry
                report_data.append({
                    'date': formatted_date,
                    'day': day_name,
                    'in_time': 'N/A',
                    'out_time': 'N/A',
                    'raw_hours': 0,
                    'regular_hours': 0,
                    'overtime_hours': 0,
                    'hours': 0,
                    'hourly_rate': entry.get('hourly_rate', 50),
                    'regular_wage': 0,
                    'overtime_wage': 0,
                    'daily_wage': 0,
                    'status': 'Absent'
                })
                absent_days += 1
            else:
                # Work entry
                in_time = entry.get('in_time', '')
                out_time = entry.get('out_time', '')
                hours = entry.get('hours', 0)
                regular_hours = entry.get('regular_hours', 0)
                overtime_hours = entry.get('overtime_hours', 0)
                raw_hours = entry.get('raw_hours', hours)
                hourly_rate = entry.get('hourly_rate', 50)
                daily_wage = entry.get('total_wage', 0)
                
                report_data.append({
                    'date': formatted_date,
                    'day': day_name,
                    'in_time': in_time,
                    'out_time': out_time,
                    'raw_hours': raw_hours,
                    'regular_hours': regular_hours,
                    'overtime_hours': overtime_hours,
                    'hours': hours,
                    'hourly_rate': hourly_rate,
                    'regular_wage': entry.get('regular_wage', 0),
                    'overtime_wage': entry.get('overtime_wage', 0),
                    'daily_wage': daily_wage,
                    'status': 'Work'
                })
                
                total_hours += hours
                total_wage += daily_wage
                work_days += 1
        
        # Calculate summary statistics
        summary = {
            'total_work_days': work_days,
            'total_absent_days': absent_days,
            'total_hours': round(total_hours, 2),
            'total_wage': round(total_wage, 2),
            'average_hours_per_day': round(total_hours / work_days, 2) if work_days > 0 else 0,
            'average_wage_per_day': round(total_wage / work_days, 2) if work_days > 0 else 0
        }
        
        return jsonify({
            'success': True,
            'data': report_data,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate_report')
def generate_report():
    """Generate CSV report with all wage data"""
    try:
        wage_data = load_wage_data()
        
        # Create CSV content
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Date', 'Day', 'IN Time', 'OUT Time', 'Raw Hours', 'Regular Hours', 'Overtime Hours', 'Hourly Rate', 'Regular Wage (₹)', 'Overtime Wage (₹)', 'Total Wage (₹)', 'Status'])
        
        # Sort dates for chronological order
        sorted_dates = sorted(wage_data.keys())
        
        for date in sorted_dates:
            entry = wage_data[date]
            
            # Format date for display
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            day_name = date_obj.strftime('%A')
            formatted_date = date_obj.strftime('%d/%m/%Y')
            
            if entry.get('absent', False):
                # Absent entry
                writer.writerow([
                    formatted_date,
                    day_name,
                    'N/A',
                    'N/A',
                    '0.00',
                    '0.00',
                    '0.00',
                    f"₹{entry.get('hourly_rate', 50):.2f}",
                    '0.00',
                    '0.00',
                    '0.00',
                    'Absent'
                ])
            else:
                # Work entry
                in_time = entry.get('in_time', '')
                out_time = entry.get('out_time', '')
                raw_hours = entry.get('raw_hours', 0)
                regular_hours = entry.get('regular_hours', 0)
                overtime_hours = entry.get('overtime_hours', 0)
                hourly_rate = entry.get('hourly_rate', 50)
                regular_wage = entry.get('regular_wage', 0)
                overtime_wage = entry.get('overtime_wage', 0)
                total_wage = entry.get('total_wage', 0)
                
                writer.writerow([
                    formatted_date,
                    day_name,
                    in_time,
                    out_time,
                    f"{raw_hours:.2f}",
                    f"{regular_hours:.2f}",
                    f"{overtime_hours:.2f}",
                    f"₹{hourly_rate:.2f}",
                    f"{regular_wage:.2f}",
                    f"{overtime_wage:.2f}",
                    f"{total_wage:.2f}",
                    'Work'
                ])
        
        # Add summary row
        total_hours = sum(entry.get('hours', 0) for entry in wage_data.values() if not entry.get('absent', False))
        total_wage = sum(entry.get('total_wage', 0) for entry in wage_data.values() if not entry.get('absent', False))
        absent_days = sum(1 for entry in wage_data.values() if entry.get('absent', False))
        work_days = len(wage_data) - absent_days
        
        writer.writerow([])  # Empty row
        writer.writerow(['SUMMARY'])
        writer.writerow(['Total Work Days', work_days])
        writer.writerow(['Total Absent Days', absent_days])
        writer.writerow(['Total Hours (After Recess)', f"{total_hours:.2f}"])
        writer.writerow(['Total Wage', f"₹{total_wage:.2f}"])
        writer.writerow(['Note', '1 hour recess time deducted from regular hours. Overtime (after 6 PM) is 1.5x hourly rate. All Sunday hours are treated as overtime.'])
        
        csv_content = output.getvalue()
        output.close()
        
        return jsonify({
            'success': True,
            'report': csv_content
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def calculate_hours_with_overtime(in_time, out_time, date_string=None):
    """Calculate hours between in and out time with overtime after 6 PM, and all Sunday hours as overtime"""
    try:
        in_dt = datetime.strptime(in_time, '%H:%M')
        out_dt = datetime.strptime(out_time, '%H:%M')
        
        # Handle overnight shifts
        if out_dt < in_dt:
            out_dt += timedelta(days=1)
        
        # Calculate total hours
        total_minutes = (out_dt - in_dt).total_seconds() / 60
        total_hours = total_minutes / 60
        
        # Check if it's Sunday
        is_sunday = False
        if date_string:
            try:
                date_obj = datetime.strptime(date_string, '%Y-%m-%d')
                is_sunday = date_obj.weekday() == 6  # Sunday is 6
            except ValueError:
                pass
        
        # If it's Sunday, all hours are overtime
        if is_sunday:
            return total_hours, 0, total_hours
        
        # Define overtime start time (6 PM = 18:00)
        overtime_start = datetime.strptime('18:00', '%H:%M')
        
        # Calculate regular and overtime hours
        if out_dt <= overtime_start:
            # All hours are regular
            regular_hours = total_hours
            overtime_hours = 0
        elif in_dt >= overtime_start:
            # All hours are overtime
            regular_hours = 0
            overtime_hours = total_hours
        else:
            # Split between regular and overtime
            regular_minutes = (overtime_start - in_dt).total_seconds() / 60
            overtime_minutes = (out_dt - overtime_start).total_seconds() / 60
            regular_hours = regular_minutes / 60
            overtime_hours = overtime_minutes / 60
        
        return total_hours, regular_hours, overtime_hours
    except ValueError:
        return 0, 0, 0

def calculate_hours(in_time, out_time):
    """Calculate hours between in and out time (legacy function)"""
    try:
        in_dt = datetime.strptime(in_time, '%H:%M')
        out_dt = datetime.strptime(out_time, '%H:%M')
        
        # Handle overnight shifts
        if out_dt < in_dt:
            out_dt += timedelta(days=1)
        
        time_diff = out_dt - in_dt
        return time_diff.total_seconds() / 3600
    except ValueError:
        return 0

if __name__ == '__main__':
    app.run(debug=True) 