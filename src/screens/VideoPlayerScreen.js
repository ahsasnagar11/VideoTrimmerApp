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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }) {
  // Safe parameter access with fallbacks
  const { 
    videoUri, 
    startTime = 0, 
    endTime = 0, 
    originalDuration = 0,
    trimmedDuration = 0 
  } = route.params || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});
  const videoRef = useRef(null);
  const initializationAttempted = useRef(false);

  const playbackSpeeds = [0.5, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    // Validate required parameters
    if (!videoUri) {
      Alert.alert('Error', 'No video to play', [
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    // Reset initialization flag when component mounts
    initializationAttempted.current = false;
    setIsInitialized(false);
    setVideoLoaded(false);
    setCurrentTime(startTime);
  }, [videoUri, startTime, navigation]);

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

  const initializeVideo = async () => {
    if (!videoRef.current || initializationAttempted.current || isInitialized) {
      return;
    }

    initializationAttempted.current = true;

    try {
      console.log('Initializing video with start time:', startTime);
      
      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // First, pause the video to prevent auto-play
      await videoRef.current.pauseAsync();
      
      // Then seek to the start position
      if (startTime > 0) {
        console.log('Seeking to start time:', startTime);
        await videoRef.current.setPositionAsync(startTime);
        
        // Wait a bit after seeking
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update states
      setCurrentTime(startTime);
      setIsInitialized(true);
      setVideoLoaded(true);
      setIsPlaying(false);
      
      console.log('Video initialized successfully');
    } catch (error) {
      console.log('Error initializing video:', error);
      Alert.alert('Error', 'Failed to initialize video playback');
    }
  };

  const formatTime = (timeMs) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!videoRef.current || !videoLoaded || !isInitialized) {
      console.log('Video not ready for playback');
      return;
    }

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // Before playing, ensure we're in the correct position
        if (currentTime < startTime || currentTime >= endTime) {
          console.log('Correcting position before play');
          await videoRef.current.setPositionAsync(startTime);
          setCurrentTime(startTime);
        }
        
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error playing/pausing video:', error);
    }
  };

  const handleVideoStatusUpdate = (status) => {
    if (!status.isLoaded) {
      return;
    }

    // Initialize video when it's first loaded
    if (status.isLoaded && !isInitialized && !initializationAttempted.current) {
      initializeVideo();
      return;
    }

    // Only update status if video is initialized
    if (isInitialized) {
      setVideoStatus(status);
      const positionMs = status.positionMillis || 0;
      
      // Update current time
      setCurrentTime(positionMs);
      setIsPlaying(status.isPlaying || false);
      
      // Handle end of trim range
      if (positionMs >= endTime && status.isPlaying) {
        console.log('Reached end of trim range');
        
        if (isLooping) {
          // Loop back to start time
          videoRef.current?.setPositionAsync(startTime);
          setCurrentTime(startTime);
        } else {
          // Stop playing
          videoRef.current?.pauseAsync();
          setIsPlaying(false);
        }
      }
      
      // Handle if position goes before start time
      if (positionMs < startTime && status.isPlaying) {
        console.log('Position before start time, correcting');
        videoRef.current?.setPositionAsync(startTime);
        setCurrentTime(startTime);
      }
    }
  };

  const handleSpeedChange = async () => {
    if (!videoRef.current || !videoLoaded || !isInitialized) return;

    const currentIndex = playbackSpeeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % playbackSpeeds.length;
    const newSpeed = playbackSpeeds[nextIndex];
    
    setPlaybackSpeed(newSpeed);
    
    try {
      await videoRef.current.setRateAsync(newSpeed, true);
    } catch (error) {
      console.log('Error changing playback speed:', error);
    }
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleRestart = async () => {
    if (!videoRef.current || !videoLoaded || !isInitialized) return;

    try {
      await videoRef.current.setPositionAsync(startTime);
      setCurrentTime(startTime);
      await videoRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.log('Error restarting video:', error);
    }
  };

  const handleEditTrim = () => {
    // Pause video before navigating
    if (videoRef.current && isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }

    if (videoUri) {
      navigation.navigate('VideoTrimmer', {
        videoUri,
        videoDuration: originalDuration,
      });
    }
  };

  const handleNewVideo = () => {
    // Pause video before navigating
    if (videoRef.current && isPlaying) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }

    navigation.navigate('VideoSelection');
  };

  // Show error state if no video
  if (!videoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#000000" 
          translucent={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video to display</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleNewVideo}>
            <Text style={styles.errorButtonText}>Select New Video</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const trimmedProgress = endTime > startTime ? ((currentTime - startTime) / (endTime - startTime)) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
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
          <Text style={styles.title}>Trimmed Video</Text>
          <Text style={styles.subtitle}>
            Duration: {formatTime(trimmedDuration)}
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
          rate={playbackSpeed}
          shouldPlay={false}
          onPlaybackStatusUpdate={handleVideoStatusUpdate}
        />
        
        {/* Loading Indicator */}
        {!isInitialized && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Preparing video...</Text>
          </View>
        )}
        
        {/* Video Controls Overlay */}
        {isInitialized && (
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
        )}
        
        {/* Video Info Overlay */}
        {isInitialized && (
          <View style={styles.videoInfoOverlay}>
            <Text style={styles.videoInfoText}>
              {formatTime(currentTime)} / {formatTime(endTime)}
            </Text>
            <Text style={styles.speedText}>
              Speed: {playbackSpeed}x {isLooping ? '(Loop)' : ''}
            </Text>
          </View>
        )}
        
        {/* Progress Bar */}
        {isInitialized && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, trimmedProgress))}%` }]} 
              />
            </View>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.restartButton, !isInitialized && styles.disabledButton]}
          onPress={handleRestart}
          disabled={!isInitialized}
        >
          <Text style={styles.controlButtonText}>Restart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.speedButton, !isInitialized && styles.disabledButton]}
          onPress={handleSpeedChange}
          disabled={!isInitialized}
        >
          <Text style={styles.controlButtonText}>Speed: {playbackSpeed}x</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.loopButton, isLooping && styles.loopButtonActive]}
          onPress={handleToggleLoop}
        >
          <Text style={[styles.controlButtonText, isLooping && styles.loopButtonTextActive]}>
            {isLooping ? 'Loop: ON' : 'Loop: OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEditTrim}
        >
          <Text style={styles.actionButtonText}>Edit Trim</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.newVideoButton]}
          onPress={handleNewVideo}
        >
          <Text style={styles.actionButtonText}>New Video</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#adb5bd',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  videoInfoOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  videoInfoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  speedText: {
    color: '#adb5bd',
    fontSize: 10,
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  controlButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  restartButton: {
    backgroundColor: '#6c757d',
  },
  speedButton: {
    backgroundColor: '#17a2b8',
  },
  loopButton: {
    backgroundColor: '#6c757d',
  },
  loopButtonActive: {
    backgroundColor: '#28a745',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loopButtonTextActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  newVideoButton: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
