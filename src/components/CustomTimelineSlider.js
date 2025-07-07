import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 40;
const HANDLE_SIZE = 24;
const TRACK_HEIGHT = 6;
const TIMELINE_HEIGHT = 80;

export default function CustomTimelineSlider({ 
  duration, 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange,
  currentTime = 0 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  
  const startPosition = (startTime / duration) * SLIDER_WIDTH;
  const endPosition = (endTime / duration) * SLIDER_WIDTH;
  const currentPosition = (currentTime / duration) * SLIDER_WIDTH;
  
  const formatTime = (timeMs) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createPanResponder = (isStart) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        setActiveHandle(isStart ? 'start' : 'end');
      },
      onPanResponderMove: (event, gestureState) => {
        const { dx } = gestureState;
        const currentPos = isStart ? startPosition : endPosition;
        const newPosition = currentPos + dx;
        
        if (isStart) {
          const clampedPosition = Math.max(0, Math.min(endPosition - 30, newPosition));
          const newTime = (clampedPosition / SLIDER_WIDTH) * duration;
          onStartTimeChange(Math.max(0, newTime));
        } else {
          const clampedPosition = Math.max(startPosition + 30, Math.min(SLIDER_WIDTH, newPosition));
          const newTime = (clampedPosition / SLIDER_WIDTH) * duration;
          onEndTimeChange(Math.min(duration, newTime));
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setActiveHandle(null);
      },
    });
  };

  const startPanResponder = createPanResponder(true);
  const endPanResponder = createPanResponder(false);

  const renderTimeMarkers = () => {
    const markers = [];
    const markerCount = 6;
    
    for (let i = 0; i <= markerCount; i++) {
      const position = (i / markerCount) * SLIDER_WIDTH;
      const time = (i / markerCount) * duration;
      
      markers.push(
        <View key={i} style={[styles.timeMarker, { left: position - 15 }]}>
          <View style={styles.markerTick} />
          <Text style={styles.markerText}>{formatTime(time)}</Text>
        </View>
      );
    }
    
    return markers;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timelineContainer}>
        {/* Time Markers */}
        <View style={styles.timelineBackground}>
          {renderTimeMarkers()}
        </View>
        
        {/* Main Track Container */}
        <View style={styles.trackContainer}>
          <View style={styles.track}>
            {/* Background Track */}
            <View style={styles.backgroundTrack} />
            
            {/* Unselected areas (dimmed) */}
            <View style={[styles.unselectedTrack, { width: startPosition }]} />
            <View style={[
              styles.unselectedTrack, 
              { 
                width: SLIDER_WIDTH - endPosition, 
                left: endPosition 
              }
            ]} />
            
            {/* Selected area (highlighted) */}
            <View style={[
              styles.selectedTrack, 
              { 
                left: startPosition, 
                width: endPosition - startPosition 
              }
            ]} />
            
            {/* Current time indicator */}
            {currentTime >= startTime && currentTime <= endTime && (
              <View style={[styles.currentTimeIndicator, { left: currentPosition }]} />
            )}
            
            {/* Start Handle */}
            <View
              style={[
                styles.handle, 
                styles.startHandle, 
                { left: startPosition - HANDLE_SIZE/2 },
                activeHandle === 'start' && styles.activeHandle
              ]}
              {...startPanResponder.panHandlers}
            >
              <View style={styles.handleInner}>
                <Text style={styles.handleText}>◀</Text>
              </View>
            </View>
            
            {/* End Handle */}
            <View
              style={[
                styles.handle, 
                styles.endHandle, 
                { left: endPosition - HANDLE_SIZE/2 },
                activeHandle === 'end' && styles.activeHandle
              ]}
              {...endPanResponder.panHandlers}
            >
              <View style={styles.handleInner}>
                <Text style={styles.handleText}>▶</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Time Display */}
        <View style={styles.timeDisplay}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={[styles.timeValue, styles.durationValue]}>
              {formatTime(endTime - startTime)}
            </Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  timelineContainer: {
    height: TIMELINE_HEIGHT + 20,
  },
  timelineBackground: {
    height: 35,
    marginBottom: 15,
    position: 'relative',
  },
  timeMarker: {
    position: 'absolute',
    alignItems: 'center',
    width: 30,
  },
  markerTick: {
    width: 2,
    height: 10,
    backgroundColor: '#adb5bd',
    marginBottom: 4,
    borderRadius: 1,
  },
  markerText: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
  },
  trackContainer: {
    height: TRACK_HEIGHT + HANDLE_SIZE + 10,
    justifyContent: 'center',
    marginBottom: 15,
  },
  track: {
    width: SLIDER_WIDTH,
    height: TRACK_HEIGHT,
    position: 'relative',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#e9ecef',
  },
  backgroundTrack: {
    position: 'absolute',
    width: '100%',
    height: TRACK_HEIGHT,
    backgroundColor: '#e9ecef',
    borderRadius: TRACK_HEIGHT / 2,
  },
  unselectedTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    backgroundColor: '#ced4da',
    borderRadius: TRACK_HEIGHT / 2,
    opacity: 0.6,
  },
  selectedTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    backgroundColor: '#007bff',
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: '#0056b3',
  },
  currentTimeIndicator: {
    position: 'absolute',
    width: 3,
    height: TRACK_HEIGHT + 6,
    backgroundColor: '#dc3545',
    top: -3,
    zIndex: 3,
    borderRadius: 1.5,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    top: -(HANDLE_SIZE - TRACK_HEIGHT) / 2,
    zIndex: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startHandle: {
    // Specific styling for start handle
  },
  endHandle: {
    // Specific styling for end handle
  },
  activeHandle: {
    transform: [{ scale: 1.2 }],
  },
  handleInner: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: HANDLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  handleText: {
    fontSize: 10,
    color: '#007bff',
    fontWeight: 'bold',
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeInfo: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },
  durationValue: {
    color: '#007bff',
  },
});
