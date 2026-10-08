import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { CLASSROOM_SCOPES } from '../shared';

// TODO: Replace with your actual Web Client ID from Google Cloud Console
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: CLASSROOM_SCOPES,
});

export default function LoginScreen() {
  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) throw new Error("No ID token returned.");
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      return auth().signInWithCredential(googleCredential);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login Error', error.message || 'An error occurred during login.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Tracker</Text>
      <Button title="Sign in with Google" onPress={() => onGoogleButtonPress()} color="#64ffda" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#004d40' 
  },
  title: { 
    fontSize: 28, 
    color: '#64ffda', 
    marginBottom: 30, 
    fontWeight: 'bold' 
  }
});
