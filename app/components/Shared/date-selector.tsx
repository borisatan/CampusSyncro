import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../../context/ThemeContext';

interface DateRangeSelectorProps {
  onDateRangeSelect?: (startDate: string, endDate: string) => void;
  currentRange?: { start: string; end: string } | null;
}

type CalendarView = 'week' | 'month' | 'year' | null;

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onDateRangeSelect, currentRange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [startDate, setStartDate] = useState(currentRange?.start || '');
  const [endDate, setEndDate] = useState(currentRange?.end || '');
  const [currentView, setCurrentView] = useState<CalendarView>(null);
  const { isDarkMode } = useTheme();

  // Update internal state when currentRange prop changes
  React.useEffect(() => {
    if (currentRange) {
      setStartDate(currentRange.start);
      setEndDate(currentRange.end);
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [currentRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDisplayText = () => {
    if (currentView === 'year') return 'This Year';
    if (currentView === 'month') return 'This Month';
    if (currentView === 'week') return 'This Week';
    
    if (!startDate || !endDate) return 'Select Date Range';
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (startDate) {
      marked[startDate] = {
        selected: true,
        startingDay: true,
        color: '#2A9D8F',
      };
    }

    if (endDate) {
      marked[endDate] = {
        selected: true,
        endingDay: true,
        color: '#2A9D8F',
      };

      // Add dates between start and end
      const start = new Date(startDate);
      const end = new Date(endDate);
      let current = new Date(start);
      
      while (current <= end) {
        const dateString = current.toISOString().split('T')[0];
        if (dateString !== startDate && dateString !== endDate) {
          marked[dateString] = {
            selected: true,
            color: '#2A9D8F',
          };
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return marked;
  };

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    
    if (!startDate) {
      setStartDate(day.dateString);
    } else if (!endDate) {
      const start = new Date(startDate);
      if (selectedDate < start) {
        setStartDate(day.dateString);
        setEndDate('');
      } else {
        setEndDate(day.dateString);
        if (onDateRangeSelect) {
          onDateRangeSelect(startDate, day.dateString);
        }
      }
    } else {
      setStartDate(day.dateString);
      setEndDate('');
    }
    // Reset view when manually selecting dates
    setCurrentView(null);
  };

  const handleViewSelect = (view: CalendarView) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (view) {
      case 'week':
        // Set to start of current week (Sunday)
        start.setDate(today.getDate() - today.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        // Set to start of current month
        start.setDate(1);
        end = new Date(today);
        break;
      case 'year':
        // Set to start of current year
        start.setMonth(0, 1);
        end = new Date(today);
        break;
    }

    const startString = start.toISOString().split('T')[0];
    const endString = end.toISOString().split('T')[0];
    
    setStartDate(startString);
    setEndDate(endString);
    setCurrentView(view);
    
    if (onDateRangeSelect) {
      onDateRangeSelect(startString, endString);
    }
    
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
    // Reset view when closing the modal
    setCurrentView(null);
  };

  const ViewSelector = () => (
    <View className="flex-row justify-between mb-4">
      {(['week', 'month', 'year'] as const).map((view) => (
        <TouchableOpacity
          key={view}
          onPress={() => handleViewSelect(view)}
          className={`flex-1 mx-1 py-2 rounded-xl border-1 border-borderLight dark:border-borderDark ${
            currentView === view ? 'bg-[surfaceDark]' : 'bg-[#E5E7EB] dark:bg-[#374151]'
          }`}
        >
          <Text
            className={`text-center text-sm font-medium ${
              currentView === view
                ? 'text-white'
                : 'text-[#212121] dark:text-[#FFFFFF]'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsVisible(true)}
        className="w-full flex-row items-center justify-between px-4 py-4 rounded-2xl"
      >
        <View className="flex-row items-center">
          <View className="bg-indigo p-2 rounded-xl mr-3">
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color={startDate ? "#818cf8" : "#94a3b8"} 
            />
          </View>
          <View>
            <Text className={`text-sm font-bold ${startDate ? 'text-white' : 'text-white'}`}>
              {getDisplayText()}
            </Text>
            {startDate && (
              <Text className="text-[10px] text-indigo-400 font-medium uppercase tracking-tighter">
                Active Range
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#475569" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`w-[90%] p-4 rounded-2xl border border-slate-700 ${isDarkMode ? 'bg-backgroundDark' : 'bg-white'}`}>
            <ViewSelector />
            <Calendar
              onDayPress={handleDayPress}
              markedDates={getMarkedDates()}
              markingType="period"
              theme={{
                backgroundColor: isDarkMode ? 'bg-bacgkroundDark' : '#FFFFFF',
                calendarBackground: isDarkMode ? 'bg-surfaceDark' : '#FFFFFF',
                textSectionTitleColor: isDarkMode ? '#FFFFFF' : '#212121',
                selectedDayBackgroundColor: 'accentPurple',
                selectedDayTextColor: 'accentPurple',
                todayTextColor: 'accentPurple',
                dayTextColor: isDarkMode ? '#FFFFFF' : '#212121',
                textDisabledColor: isDarkMode ? '#666666' : '#D1D1D1',
              }}
            />
            <TouchableOpacity
              onPress={handleClose}
              className="mt-4 bg-accentBlue py-2 rounded-full"
            >
              <Text className="text-center text-white font-medium">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DateRangeSelector; 