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
          className={`flex-1 mx-1 py-2 rounded-full ${
            currentView === view ? 'bg-[#2A9D8F]' : 'bg-[#E5E7EB] dark:bg-[#374151]'
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
        onPress={() => setIsVisible(true)}
        className="flex-row items-center justify-center"
      >
        <Text className="text-md font-medium text-[#212121] dark:text-[#FFFFFF]">
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-center items-center">
          <View className={`w-[90%] p-4 rounded-2xl ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
            <ViewSelector />
            <Calendar
              onDayPress={handleDayPress}
              markedDates={getMarkedDates()}
              markingType="period"
              theme={{
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                calendarBackground: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                textSectionTitleColor: isDarkMode ? '#FFFFFF' : '#212121',
                selectedDayBackgroundColor: '#2A9D8F',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#2A9D8F',
                dayTextColor: isDarkMode ? '#FFFFFF' : '#212121',
                textDisabledColor: isDarkMode ? '#666666' : '#D1D1D1',
              }}
            />
            <TouchableOpacity
              onPress={handleClose}
              className="mt-4 bg-[#2A9D8F] py-2 rounded-full"
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