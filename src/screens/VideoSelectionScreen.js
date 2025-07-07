import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  Platform 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

export default function VideoSelectionScreen({ navigation, route }) {
  // Safe parameter access with fallback
  const params = route.params || {};
  
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync();
      const { status: imagePickerStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (mediaLibraryStatus === 'granted' && imagePickerStatus === 'granted') {
        setHasPermissions(true);
      } else {
        Alert.alert('Permission Required', 'Please grant camera and media library permissions');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const pickVideo = async () => {
    if (!hasPermissions) {
      Alert.alert('Error', 'Permissions not granted');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        
        // Navigate with parameters
        navigation.navigate('VideoTrimmer', {
          videoUri: video.uri,
          videoDuration: video.duration || 10000, // fallback duration
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select video');
    } finally {
      setIsLoading(false);
    }
  };

  const recordVideo = async () => {
    if (!hasPermissions) {
      Alert.alert('Error', 'Permissions not granted');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        
        // Navigate with parameters
        navigation.navigate('VideoTrimmer', {
          videoUri: video.uri,
          videoDuration: video.duration || 10000, // fallback duration
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f9fafb" 
        translucent={false}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Video Trimmer App</Text>
          <Text style={styles.subtitle}>Select or record a video to trim</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={pickVideo}
            disabled={!hasPermissions || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Select Video from Gallery'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={recordVideo}
            disabled={!hasPermissions || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Record New Video'}
            </Text>
          </TouchableOpacity>
        </View>

        {!hasPermissions && (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              Camera and media library permissions are required
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={requestPermissions}
            >
              <Text style={styles.permissionButtonText}>Grant Permissions</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 250,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
