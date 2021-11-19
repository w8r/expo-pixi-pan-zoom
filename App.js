import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Canvas from './src/components/Canvas';
import Viewer from './src/components/Viewer';

console.log(Canvas);

export default function App() {
  return (
    <View style={styles.container}>
      <Viewer />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
