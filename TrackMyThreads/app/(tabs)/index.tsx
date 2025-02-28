import { StyleSheet } from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import Login from './login';
import SignUp from './signup';
import { ThemedView } from '@/components/ThemedView';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RequestReset from './requestreset';
import MainMenu from './mainmenu';
const Stack = createNativeStackNavigator();

export default function HomeScreen() {
  return (

      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={Login}
          options={{ headerShown: false }}  // Hides header
        />
        <Stack.Screen 
          name="MainMenu" 
          component={MainMenu} 
        />
        {/* Add more screens */}
      </Stack.Navigator>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
