import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { Calendar } from 'react-native-calendars'; // <-- REMOVE THIS LINE
// import { LocaleConfig } from 'react-native-calendars'; // <-- REMOVE THIS LINE


type EventType = 'Assignment' | 'Lecture' | 'Tutorial' | 'Exam';
const types: EventType[] = ['Assignment', 'Lecture', 'Tutorial', 'Exam'];

// LocaleConfig.defaultLocale = 'de'; // <-- REMOVE THIS LINE

export default function AddEventScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const router = useRouter();

  const initialDate = date ? new Date(date) : new Date();

  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<EventType>(types[0]);
  const [eventDate, setEventDate] = useState<Date>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [time, setTime] = useState<Date>(initialDate);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const saveEvent = () => {
    // TODO: Save to AsyncStorage or SQLite
    console.log({ title, type, eventDate, time, notes }); // For debugging
    router.back();
  };

  const handleDateChange = (_: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false); // Hide picker
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleTimeChange = (_: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false); // Hide picker
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="mt-4 mb-1 font-semibold">Title</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3"
        value={title}
        onChangeText={setTitle}
        placeholder="z.B. Biologie-Vorlesung"
      />

      <Text className="mt-4 mb-1 font-semibold">Type</Text>
      <View className="flex-row flex-wrap">
        {types.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            className={`px-4 py-2 mr-2 mb-2 border rounded-full ${type === t ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
          >
            <Text className={`${type === t ? 'text-white' : 'text-gray-800'}`}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="mt-4 mb-1 font-semibold">Date</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-gray-300 rounded-lg p-3"
      >
        <Text>{eventDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <Text className="mt-4 mb-1 font-semibold">Time</Text>
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        className="border border-gray-300 rounded-lg p-3"
      >
        <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <Text className="mt-4 mb-1 font-semibold">Notes</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-6"
        value={notes}
        onChangeText={setNotes}
        placeholder="optional"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        onPress={saveEvent}
        className="bg-blue-500 rounded-lg p-4 items-center mb-8"
      >
        <Text className="text-white font-semibold">Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
