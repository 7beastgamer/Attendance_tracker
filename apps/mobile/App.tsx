import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { Text, View, ActivityIndicator } from 'react-native';
import { requestNotificationPermissions } from './src/utils/notifications';

function MainApp() {
  const { user, loading } = React.useContext(AuthContext);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#004d40'}}>
        <ActivityIndicator size="large" color="#64ffda" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
