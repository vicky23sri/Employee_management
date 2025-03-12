document.addEventListener('DOMContentLoaded', function () {
    // State variables
    let currentWeek = 1
    let currentYear = 2025
    let currentDate = new Date(currentYear, 0, 1) // Jan 1st of the year
    let attendanceData = []
    let currentEditId = null

    // Initialize the page
    initializeDateTimeDisplay()
    initializeWeekSelector()
    navigateToCurrentWeek()
    loadAttendanceData()
    initializeAttendanceTracking();
    
    // Update time every second
    setInterval(updateCurrentTime, 1000)

    // Event listeners
    document
        .getElementById('prev-week')
        .addEventListener('click', navigateToPreviousWeek)
    document
        .getElementById('next-week')
        .addEventListener('click', navigateToNextWeek)
    document
        .getElementById('today-btn')
        .addEventListener('click', navigateToCurrentWeek)
    document
        .getElementById('export-btn')
        .addEventListener('click', exportAttendanceData)
    document
        .getElementById('cancel-edit')
        .addEventListener('click', closeEditModal)
    document
        .getElementById('edit-form')
        .addEventListener('submit', saveEditedRecord)

    function initializeDateTimeDisplay() {
        const weeklyViewDiv = document.querySelector('.bg-white.rounded-xl.shadow-md.p-6.mb-8.border-l-4.border-cyan-500')
        
        const dateTimeContainer = document.createElement('div')
        dateTimeContainer.className = 'date-time-display bg-white rounded-xl shadow-md p-4 mb-4 w-fit border-l-4 border-teal-500 flex justify-end'
        dateTimeContainer.innerHTML = `
            <div class="flex items-center">
                <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <i class="ti ti-clock text-red-500"></i>
                </div>
                <div>
                    <div id="current-full-date" class="text-sm font-medium text-gray-600"></div>
                    <div id="current-time" class="text-xl font-bold text-red-500">00:00:00</div>
                </div>
            </div>
        `
        
        // Insert before the weekly view div
        weeklyViewDiv.parentNode.insertBefore(dateTimeContainer, weeklyViewDiv)
        
        // Initial update
        updateCurrentTime()
    }

    function updateCurrentTime() {
        const now = new Date()
        const timeElement = document.getElementById('current-time')
        const dateElement = document.getElementById('current-full-date')
        
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        timeElement.textContent = `${hours}:${minutes}:${seconds}`
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        dateElement.textContent = now.toLocaleDateString('en-US', options)
    }

    function initializeWeekSelector() {
        // Calculate the first day of the week (Monday)
        const firstDay = new Date(currentDate)
        const dayOfWeek = firstDay.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to make Monday the first day
        firstDay.setDate(firstDay.getDate() + diff)

        const container = document.getElementById('week-selector-container')
        container.innerHTML = ''

        // Create 7 day cards for the week (Monday to Sunday)
        for (let i = 0; i < 7; i++) {
            const date = new Date(firstDay)
            date.setDate(date.getDate() + i)

            const dayCard = createDayCard(date, i)
            container.appendChild(dayCard)
        }

        // Update week display
        const lastDay = new Date(firstDay)
        lastDay.setDate(lastDay.getDate() + 6)

        document.getElementById(
            'current-week'
        ).textContent = `Week ${currentWeek} (${formatDate(
            firstDay,
            'short'
        )} - ${formatDate(lastDay, 'short')}, ${currentYear})`
        document.getElementById('table-date-range').textContent = `${formatDate(
            firstDay
        )} - ${formatDate(lastDay)}, ${currentYear}`
    }

    function createDayCard(date, index) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const today = new Date()
        
        // Check if the date is today
        const isToday = date.toDateString() === today.toDateString()
        const isPast = date < today && !isToday
        const isFuture = date > today && !isToday
        const isSunday = date.getDay() === 0
        // Only Sunday is considered weekend now
        const isWeekend = isSunday
        
        const dayDiv = document.createElement('div')
        // Update the styling for current date with a more distinctive background color
        dayDiv.className = `attendance-card flex flex-col items-center justify-center p-3 rounded-lg ${
            isToday
                ? 'bg-cyan-100 border-2 border-cyan-500 shadow-md'
                : 'bg-white border border-gray-200'
        } week-selector cursor-pointer`
        dayDiv.setAttribute('data-date', formatDate(date))
        
        // Create day of week display - Sunday in red, current day more prominent
        const dayOfWeek = document.createElement('div')
        dayOfWeek.className = `text-xs font-medium ${
            isWeekend
                ? 'text-red-600 font-bold'
                : isToday
                ? 'text-cyan-800 font-bold'
                : 'text-gray-500'
        }`
        // Map day index (0-6) to correct day name (Mon-Sun)
        const dayNameIndex = index
        dayOfWeek.textContent = dayNames[dayNameIndex]
        
        // Create date display with enhanced highlighting for current date
        const dateDisplay = document.createElement('div')
        dateDisplay.className = `text-2xl font-bold mt-1 ${
            isWeekend
                ? 'text-red-600'
                : isToday
                ? 'text-cyan-700'
                : isPast
                ? 'text-gray-700'
                : 'text-gray-600'
        }`
        dateDisplay.textContent = date.getDate()
        
        // Create indicator for attendance status (not for Sunday)
        if (!isWeekend) {
            const attendanceRecord = getAttendanceForDate(formatDate(date))
            let statusIndicator = document.createElement('div')
            statusIndicator.className = 'w-2 h-2 rounded-full mt-2 opacity-0'
            
            if (attendanceRecord) {
                statusIndicator.classList.remove('opacity-0')
                if (attendanceRecord.status === 'present') {
                    statusIndicator.classList.add('bg-blue-500')
                } else if (attendanceRecord.status === 'late') {
                    statusIndicator.classList.add('bg-yellow-500')
                } else {
                    statusIndicator.classList.add('bg-red-500')
                }
            }
            dayDiv.appendChild(statusIndicator)
        } else {
            // For Sunday, add a "Weekend" badge
            const weekendBadge = document.createElement('div')
            weekendBadge.className =
                'text-xs font-semibold mt-2 px-2 py-1 bg-red-100 text-red-600 rounded'
            weekendBadge.textContent = 'Weekend'
            dayDiv.appendChild(weekendBadge)
        }
        
        // For today, add a "Today" badge for better visibility
        if (isToday) {
            const todayBadge = document.createElement('div')
            todayBadge.className =
                'text-xs font-semibold mt-2 px-2 py-1 bg-cyan-200 text-cyan-700 rounded'
            todayBadge.textContent = 'Today'
            dayDiv.appendChild(todayBadge)
        }
        
        dayDiv.appendChild(dayOfWeek)
        dayDiv.appendChild(dateDisplay)
        
        dayDiv.addEventListener('click', () => {
            // Don't highlight Sunday in the table as it has no data
            if (!isWeekend) {
                highlightDayInTable(formatDate(date))
            }
        })
        
        return dayDiv
    }

    function navigateToPreviousWeek () {
        currentWeek--
        currentDate.setDate(currentDate.getDate() - 7)
        initializeWeekSelector()
        loadAttendanceData()
    }

    function navigateToNextWeek () {
        currentWeek++
        currentDate.setDate(currentDate.getDate() + 7)
        initializeWeekSelector()
        loadAttendanceData()
    }

    function navigateToCurrentWeek() {
        const today = new Date() 
        
        function getISOWeek(date) {
            const target = new Date(date.valueOf());
            const dayNr = (date.getDay() + 6) % 7; 
            target.setDate(target.getDate() - dayNr + 3); 
            const firstThursday = target.valueOf();
            target.setMonth(0, 1);
            if (target.getDay() !== 4) { 
                target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
            }
            return 1 + Math.ceil((firstThursday - target) / 604800000);
        }
        
        currentWeek = getISOWeek(today);
        currentYear = today.getFullYear();
        
        // Set currentDate to Monday of the current week
        currentDate = new Date(today);
        const todayDayOfWeek = today.getDay();
        // Calculate days to Monday (Monday=1, Sunday=0 in getDay)
        const daysToMonday = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek;
        currentDate.setDate(today.getDate() + daysToMonday);
        
        initializeWeekSelector();
        loadAttendanceData();
    }

    function renderAttendanceTable() {
        const tableBody = document.getElementById('attendance-table-body')
        const today = new Date().toDateString()
        
        if (attendanceData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                        No attendance records found for this week.
                    </td>
                </tr>
            `
            return
        }
        
        tableBody.innerHTML = ''
        
        attendanceData.forEach(record => {
            const recordDate = new Date(record.date).toDateString()
            const isToday = recordDate === today
            
            const row = document.createElement('tr')
            // Add special highlighting for today's row
            row.className = isToday 
                ? 'hover:bg-cyan-50 bg-cyan-50 transition-colors' 
                : 'hover:bg-teal-50 transition-colors'
            
            // Date column with today indicator
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        ${isToday ? '<div class="w-2 h-full bg-cyan-500 mr-2 rounded-full"></div>' : ''}
                        <div>
                            <div class="text-sm font-medium ${isToday ? 'text-cyan-700' : 'text-slate-700'}">
                                ${formatDate(new Date(record.date), 'medium')}
                            </div>
                            <div class="text-xs ${isToday ? 'text-cyan-600' : 'text-slate-500'}">
                                ${new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-700">${record.checkIn || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-700">${record.checkOut || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-teal-600">${record.workingHours || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${getStatusBadge(record.status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    <button class="text-blue-500 hover:text-blue-700 mr-3 transition-colors" onclick="editRecord(${record.id})">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 transition-colors" onclick="deleteRecord(${record.id})">
                        <i class="ti ti-trash"></i>
                    </button>
                </td>
            `
            
            tableBody.appendChild(row)
        })
    }
    
    function getStatusBadge(status) {
        if (status === 'present') {
            return `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-300 text-teal-700">On Time</span>`
        } else if (status === 'late') {
            return `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-yellow-700">Late</span>`
        } else if (status === 'absent') {
            return `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">Absent</span>`
        } else {
            return `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">Unknown</span>`
        }
    }

    function loadAttendanceData() {
        // Show loading state
        document.getElementById('attendance-table-body').innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-10 text-center">
                <div class="custom-loader mx-auto mb-4"></div>
                <p class="text-gray-500">Loading attendance data...</p>
                </td>
            </tr>
            `
    
        // The currentDate should already be set to Monday of the current week
        // So we don't need to adjust it further, just use it directly as the start date
        const firstDay = new Date(currentDate)
        
        // Calculate the last day of the week (Sunday) by adding 6 days to Monday
        const lastDay = new Date(firstDay)
        lastDay.setDate(lastDay.getDate() + 6)
    
        // Format dates for API request
        const startDate = formatDate(firstDay)
        const endDate = formatDate(lastDay)
        
        console.log("API Request Date Range:", startDate, "to", endDate)
    
        // Fetch attendance data from your database/API
        fetchAttendanceFromDatabase(startDate, endDate)
        .then(data => {
            attendanceData = data
            renderAttendanceTable()
            updateWeeklySummary()
        })
        .catch(error => {
            console.error('Error loading attendance data:', error)
            document.getElementById('attendance-table-body').innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-10 text-center text-red-500">
                        Error loading attendance data. Please try again later.
                    </td>
                </tr>
                `
        })
    }

    function showNotification (message) {
        // Create notification element
        const notification = document.createElement('div')
        notification.className =
        'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transform transition-all duration-500 translate-y-20 opacity-0 flex items-center'
        notification.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            ${message}
        `

        document.body.appendChild(notification)

        // Show notification
        setTimeout(() => {
        notification.classList.remove('translate-y-20', 'opacity-0')
        }, 100)

        // Hide and remove notification
        setTimeout(() => {
        notification.classList.add('translate-y-20', 'opacity-0')
        setTimeout(() => {
            notification.remove()
        }, 500)
        }, 3000)
    }

    function getAttendanceForDate (date) {
        return attendanceData.find(record => record.date === date)
    }

    function formatDate (date, format = 'full') {
        if (format === 'short') {
        // Format as "Jan 1"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
        } else {
        // Format as "YYYY-MM-DD"
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
        }
    }

    function fetchAttendanceFromDatabase(startDate, endDate) {
        // This function simulates an API call to fetch attendance data
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate dummy data for the week
                const attendanceData = generateDummyAttendanceData(startDate, endDate);
                resolve(attendanceData);
            }, 800); // Simulate network delay
        });
    }
    
    function generateDummyAttendanceData(startDate, endDate) {
        const data = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Generate a record for each day from start to end date
        let currentDate = new Date(start);
        let id = 1;
        
        while (currentDate <= end) {
            // Skip Sundays (Sunday = 0), but include Saturdays
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0) {  // Only skip Sundays
                // Random check-in time between 8:30 and 9:15
                const randomMinutes = Math.floor(Math.random() * 45);
                const checkInHour = 8;
                const checkInMinute = 30 + randomMinutes;
                const checkInTime = `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`;
                
                // Random check-out time between 17:00 and 18:30
                const randomOutMinutes = Math.floor(Math.random() * 90);
                const checkOutHour = 17;
                const checkOutMinute = randomOutMinutes;
                const checkOutTime = `${checkOutHour}:${checkOutMinute.toString().padStart(2, '0')}`;
                
                // Calculate working hours (difference between check-in and check-out)
                const workingHoursDecimal = (checkOutHour - checkInHour) + (checkOutMinute - checkInMinute) / 60;
                const workingHours = workingHoursDecimal.toFixed(1);
                
                // Determine status (present if check-in before 9:00, late otherwise)
                let status = 'present';
                if (checkInHour === 9 && checkInMinute > 0) {
                    status = 'late';
                }
                
                // Special case for today (March 10, 2025) - ongoing day
                const today = new Date();
                const isToday = currentDate.toDateString() === today.toDateString();
                
                // Add random variation to attendance data
                if (isToday) {
                    // For today, only show check-in time if before current time
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    
                    if (currentHour >= checkInHour) {
                        data.push({
                            id: id++,
                            date: formatDate(currentDate),
                            dayOfWeek: getDayName(currentDate),
                            checkIn: `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`,
                            checkOut: currentHour >= checkOutHour ? `${checkOutHour}:${checkOutMinute.toString().padStart(2, '0')}` : '-',
                            workingHours: currentHour >= checkOutHour ? workingHours : '-',
                            status: status,
                            isToday: true
                        });
                    } else {
                        // Haven't checked in yet
                        data.push({
                            id: id++,
                            date: formatDate(currentDate),
                            dayOfWeek: getDayName(currentDate),
                            checkIn: '-',
                            checkOut: '-',
                            workingHours: '-',
                            status: 'absent',
                            isToday: true
                        });
                    }
                } else if (currentDate > today) {
                    // Future dates - no attendance yet
                    data.push({
                        id: id++,
                        date: formatDate(currentDate),
                        dayOfWeek: getDayName(currentDate),
                        checkIn: '-',
                        checkOut: '-',
                        workingHours: '-',
                        status: 'absent',
                        isToday: false
                    });
                } else {
                    // Past dates - complete attendance records
                    // Randomly make one day absent (10% chance)
                    const isAbsent = Math.random() < 0.1;
                    
                    if (isAbsent) {
                        data.push({
                            id: id++,
                            date: formatDate(currentDate),
                            dayOfWeek: getDayName(currentDate),
                            checkIn: '-',
                            checkOut: '-',
                            workingHours: '0.0',
                            status: 'absent',
                            isToday: false
                        });
                    } else {
                        data.push({
                            id: id++,
                            date: formatDate(currentDate),
                            dayOfWeek: getDayName(currentDate),
                            checkIn: `${checkInHour}:${checkInMinute.toString().padStart(2, '0')}`,
                            checkOut: `${checkOutHour}:${checkOutMinute.toString().padStart(2, '0')}`,
                            workingHours: workingHours,
                            status: status,
                            isToday: false
                        });
                    }
                }
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return data;
    }
    
    function getDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    function formatDate(date, format = 'full') {
        if (format === 'short') {
            // Format as "Jan 1"
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        } else if (format === 'medium') {
            // Format as "Jan 1, 2025"
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } else {
            // Format as "YYYY-MM-DD"
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }
    
    function updateWeeklySummary() {
        // Calculate summary statistics from the attendance data
        let totalHours = 0;
        let onTimeCount = 0;
        let lateCount = 0;
        let absentCount = 0;
        
        attendanceData.forEach(record => {
            // Add working hours to total (if it's a number)
            if (record.workingHours !== '-') {
                totalHours += parseFloat(record.workingHours) || 0;
            }
            
            // Count status types
            if (record.status === 'present') {
                onTimeCount++;
            } else if (record.status === 'late') {
                lateCount++;
            } else if (record.status === 'absent') {
                absentCount++;
            }
        });
        
        // Update summary display with animation
        animateCounter('total-hours', totalHours.toFixed(1));
        animateCounter('on-time-count', onTimeCount);
        animateCounter('late-count', lateCount);
        animateCounter('absent-count', absentCount);
    }
    
    function animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const start = parseFloat(element.textContent) || 0;
        const target = parseFloat(targetValue);
        const duration = 1000; // ms
        const startTime = performance.now();
        
        function updateCounter(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = start + (target - start) * progress;
            
            if (Number.isInteger(target)) {
                element.textContent = Math.round(currentValue);
            } else {
                element.textContent = currentValue.toFixed(1);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue; // Ensure we end with the exact target
            }
        }
        
        requestAnimationFrame(updateCounter);
    }
    
    // Render attendance table with enhanced styling
    function renderAttendanceTable() {
        const tableBody = document.getElementById('attendance-table-body');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Add a row for each record
        attendanceData.forEach(record => {
            const row = document.createElement('tr');
            
            // Apply special styling for today
            if (record.isToday) {
                row.className = 'bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-150';
            } else {
                row.className = 'hover:bg-gray-50 transition-colors duration-150';
            }
            
            // Add subtle animation on load
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            // Create status badge with appropriate styling
            let statusBadge;
            if (record.isToday) {
                // For today's row, use white-based colors for better contrast against blue background
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-white text-green-800' :
                    record.status === 'late' ? 'bg-white text-yellow-800' :
                    'bg-white text-red-800'
                }">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>`;
            } else {
                // Normal colored badges for other days
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>`;
            }
            
            // Add working hours with visual indicator
            let hoursDisplay;
            if (record.workingHours !== '-') {
                const hours = parseFloat(record.workingHours);
                let hoursClass = '';
                
                if (record.isToday) {
                    hoursClass = 'font-bold'; // Just bold for today (already has white text)
                } else {
                    hoursClass = hours >= 8 ? 'text-green-600 font-bold' : 
                               hours >= 6 ? 'text-yellow-600' : 'text-red-600';
                }
                
                hoursDisplay = `<span class="${hoursClass}">${record.workingHours}</span>`;
            } else {
                hoursDisplay = '-';
            }
            
            row.innerHTML = `
                <td class="py-4 px-6 border-b ${!record.isToday ? 'border-gray-200' : ''}">
                    <div class="flex flex-col">
                        <span class="font-medium">${formatDate(new Date(record.date), 'medium')}</span>
                        <span class="text-xs ${record.isToday ? 'text-white' : 'text-gray-500'}">${record.dayOfWeek}</span>
                    </div>
                </td>
                <td class="py-4 px-6 border-b ${!record.isToday ? 'border-gray-200' : ''}">
    <div class="flex items-center">
        <i class="ti ti-clock mr-2 ${record.isToday ? 'text-white' : 'text-gray-500'}"></i>
        ${record.checkIn}
    </div>
</td>
<td class="py-4 px-6 border-b ${!record.isToday ? 'border-gray-200' : ''}">
    <div class="flex items-center">
        <i class="ti ti-check mr-2 ${record.isToday ? 'text-white' : 'text-gray-500'}"></i>
        ${record.checkOut}
    </div>
</td>
                <td class="py-4 px-6 border-b ${!record.isToday ? 'border-gray-200' : ''} text-center">
                    ${hoursDisplay}
                </td>
                <td class="py-4 px-6 border-b ${!record.isToday ? 'border-gray-200' : ''} text-center">
                    ${statusBadge}
                </td>
            `;
            
            tableBody.appendChild(row);
            
            // Trigger animation after a short delay
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 50 * tableBody.children.length);
        });
    }
    
    // Create enhanced table header with modern style
    function createEnhancedTable() {
        const tableContainer = document.getElementById('attendance-table-container');
        if (!tableContainer) return;
        
        // Create a new styled table
        tableContainer.innerHTML = `
            <div class="overflow-hidden rounded-lg shadow-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Check In
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Check Out
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hours
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody id="attendance-table-body" class="bg-white divide-y divide-gray-200">
                        <!-- Table rows will be inserted here -->
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Enhance summary cards with visual indicators
    function enhanceSummaryCards() {
        const summaryContainer = document.getElementById('weekly-summary');
        if (!summaryContainer) return;
        
        summaryContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 mr-4">
                            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Hours</p>
                            <p class="text-2xl font-bold text-gray-900"><span id="total-hours">0.0</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 mr-4">
                            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">On Time</p>
                            <p class="text-2xl font-bold text-gray-900"><span id="on-time-count">0</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 mr-4">
                            <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Late</p>
                            <p class="text-2xl font-bold text-gray-900"><span id="late-count">0</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 mr-4">
                            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-500">Absent</p>
                            <p class="text-2xl font-bold text-gray-900"><span id="absent-count">0</span></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Initialization code to add to the existing DOMContentLoaded event
    function initializeAttendanceTracking() {
        // Add custom CSS for animations and effects
        const style = document.createElement('style');
        style.textContent = `
            .custom-loader {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 4px solid #e2e8f0;
                border-top-color: #3b82f6;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .fade-in {
                animation: fadeIn 0.5s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            tr {
                transition: background-color 0.2s ease;
            }
        `;
        document.head.appendChild(style);
        
        // Create enhanced UI components
        enhanceSummaryCards();
        createEnhancedTable();
        
        // Set initial date range (2025-03-10 to 2025-03-16)
        const startDate = '2025-03-10';
        const endDate = '2025-03-16';
        
        // Log API request date range
        console.log('API Request Date Range:', startDate, 'to', endDate);
        
        // Show loading indicator
        const tableBody = document.getElementById('attendance-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center">
                        <div class="flex justify-center">
                            <div class="custom-loader"></div>
                        </div>
                        <p class="mt-4 text-gray-500">Loading attendance data...</p>
                    </td>
                </tr>
            `;
        }
        
        // Fetch and render the attendance data
        fetchAttendanceFromDatabase(startDate, endDate).then(data => {
            attendanceData = data;
            renderAttendanceTable();
            updateWeeklySummary();
        });
    }
})