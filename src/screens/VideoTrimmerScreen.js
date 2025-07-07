import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import CustomTimelineSlider from '../components/CustomTimelineSlider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoTrimmerScreen({ navigation, route }) {
  // Safe parameter access with fallbacks
  const { videoUri, videoDuration } = route.params || {};
  
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);

  useEffect(() => {
    // Validate required parameters
    if (!videoUri) {
      Alert.alert('Error', 'No video selected', [
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    
    // Set initial values
    if (videoDuration) {
      const initialEndTime = Math.min(videoDuration, 30000); // Max 30 seconds
      setEndTime(initialEndTime);
    }
    
    setIsLoading(false);
  }, [videoUri, videoDuration, navigation]);

  // Handle screen focus/blur for video pausing
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - video can play
      return () => {
        // Screen is blurred - pause video
        if (videoRef.current && isPlaying) {
          videoRef.current.pauseAsync();
          setIsPlaying(false);
        }
      };
    }, [isPlaying])
  );

  // Handle navigation events
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // Pause video when leaving screen
      if (videoRef.current && isPlaying) {
        videoRef.current.pauseAsync();
        setIsPlaying(false);
      }
    });

    return unsubscribe;
  }, [navigation, isPlaying]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.log('Error playing/pausing video:', error);
      }
    }
  };

  const handleVideoStatusUpdate = (status) => {
    setVideoStatus(status);
    
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis || 0);
      setIsPlaying(status.isPlaying || false);
      
      // If video reaches end time, loop back to start time
      if (status.positionMillis >= endTime) {
        videoRef.current?.setPositionAsync(startTime);
      }
    }
  };

  const handleStartTimeChange = (newStartTime) => {
    const clampedStartTime = Math.max(0, Math.min(endTime - 1000, newStartTime));
    setStartTime(clampedStartTime);
    
    // If current time is before new start time, seek to start time
    if (currentTime < clampedStartTime) {
      videoRef.current?.setPositionAsync(clampedStartTime);
    }
  };

  const handleEndTimeChange = (newEndTime) => {
    const clampedEndTime = Math.max(startTime + 1000, Math.min(videoDuration, newEndTime));
    setEndTime(clampedEndTime);
    
    // If current time is after new end time, seek to end time
    if (currentTime > clampedEndTime) {
      videoRef.current?.setPositionAsync(clampedEndTime);
    }
  };

  const handlePreviewTrimmed = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(startTime);
        await videoRef.current.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.log('Error previewing trim:', error);
      }
    }
  };

  const handleProceedToPlayer = () => {
    if (!videoUri) {
      Alert.alert('Error', 'No video to trim');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('Error', 'Start time must be less than end time');
      return;
    }

    const trimmedDuration = endTime - startTime;
    if (trimmedDuration < 1000) {
      Alert.alert('Error', 'Trimmed duration must be at least 1 second');
      return;
    }

    // Pause video before navigating
    if (videoRef.current && isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }

    // Navigate to player with trim settings
    navigation.navigate('VideoPlayer', {
      videoUri,
      startTime,
      endTime,
      originalDuration: videoDuration,
      trimmedDuration,
    });
  };

  // Show loading if no video data
  if (isLoading || !videoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff" 
          translucent={false}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Trim Video</Text>
          <Text style={styles.subtitle}>
            Total Duration: {Math.floor((videoDuration || 0) / 1000)}s
          </Text>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUri }}
          useNativeControls={false}
          resizeMode="contain"
          isLooping={false}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
        />
        
        {/* Video Controls Overlay */}
        <TouchableOpacity 
          style={styles.videoControlsOverlay}
          onPress={handlePlayPause}
        >
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Video Info Overlay */}
        <View style={styles.videoInfoOverlay}>
          <Text style={styles.videoInfoText}>
            {Math.floor(currentTime / 1000)}s / {Math.floor(videoDuration / 1000)}s
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.previewButton]}
          onPress={handlePreviewTrimmed}
        >
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.proceedButton]}
          onPress={handleProceedToPlayer}
        >
          <Text style={styles.proceedButtonText}>Apply Trim</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Timeline Slider */}
      <CustomTimelineSlider
        duration={videoDuration}
        startTime={startTime}
        endTime={endTime}
        currentTime={currentTime}
        onStartTimeChange={handleStartTimeChange}
        onEndTimeChange={handleEndTimeChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  videoInfoOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  videoInfoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  controlButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#28a745',
    marginLeft: 10,
  },
  proceedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
