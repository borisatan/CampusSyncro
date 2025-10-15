import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const LoadingSpinner = () => {
    const { isDarkMode } = useTheme();
    return (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator
                size="large"
                color={isDarkMode ? "#ffffff" : "#000000"} />
            <Text className={isDarkMode ? "text-white mt-2" : "text-black mt-2"}>
                Loading...
            </Text>
        </View>
    );
};


  export default LoadingSpinner;