import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { RootStackParamList } from '../context/types';


type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type Event = { time: string; title: string; type: string };

type Events = Record<string, Event[]>;



export default function HomeScreen({ navigation }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [events, setEvents] = useState<Events>({});

  useEffect(() => {
    // TODO: Load events from AsyncStorage or SQLite
  }, []);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const dayEvents = events[selectedDate] ?? [];

  const marked = Object.keys(events).reduce((acc, key) => {
    acc[key] = { marked: true };
    return acc;
  }, {} as Record<string, { marked?: boolean; selected?: boolean; selectedColor?: string }>);

  marked[selectedDate] = { selected: true, selectedColor: '#0ea5e9' };

  return (
    <View className="flex-1 bg-white">
      <Calendar
        onDayPress={onDayPress}
        markedDates={marked}
        theme={{ todayTextColor: '#0ea5e9' }}
        className="mb-4"
      />

      <FlatList
        data={dayEvents}
        keyExtractor={(_, idx) => idx.toString()}
        contentContainerStyle={dayEvents.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined}
        renderItem={({ item }) => (
          <View className="flex-row p-4 mb-2 bg-gray-100 rounded-lg mx-4">
            <Text className="w-16 font-bold text-gray-800">{item.time}</Text>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">{item.title}</Text>
              <Text className="text-sm text-gray-600">{item.type}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text className="text-center text-gray-500">Keine Veranstaltungen an diesem Tag.</Text>
        )}
      />

    <Link
        href={{ pathname: '/pages/add-event', params: { date: selectedDate } }} // Navigate to AddEvent screen with the selected date
        className="absolute bottom-8 right-8 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg">
        <MaterialIcons name="add" size={28} color="#fff" />
      </Link>
    </View>
  );
}
