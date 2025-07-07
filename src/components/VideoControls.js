import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

const CustomSlider = ({
  label,
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingComplete,
  formatValue,
  minimumTrackTintColor = '#6366f1',
  maximumTrackTintColor = '#d1d5db',
  thumbTintColor = '#6366f1',
  disabled = false,
  step = 1,
  showValueLabel = true,
  containerStyle = {},
  sliderStyle = {},
}) => {

  const formatTime = (timeInMillis) => {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayValue = () => {
    if (formatValue) {
      return formatValue(value);
    }
    return formatTime(value);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Slider */}
      <Slider
        style={[styles.slider, sliderStyle]}
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={minimumTrackTintColor}
        maximumTrackTintColor={maximumTrackTintColor}
        thumbStyle={[styles.thumb, { backgroundColor: thumbTintColor }]}
        trackStyle={styles.track}
        disabled={disabled}
        step={step}
      />

      {/* Value Display */}
      {showValueLabel && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{getDisplayValue()}</Text>
        </View>
      )}

      {/* Range Labels */}
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeText}>
          {formatValue ? formatValue(minimumValue) : formatTime(minimumValue)}
        </Text>
        <Text style={styles.rangeText}>
          {formatValue ? formatValue(maximumValue) : formatTime(maximumValue)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 50,
    marginBottom: 5,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  track: {
    height: 6,
    borderRadius: 3,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  rangeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default CustomSlider;