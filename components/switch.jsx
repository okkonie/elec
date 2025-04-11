import { TouchableOpacity, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect, useRef } from 'react';

export default function Switch({ isOn, onToggle, activeColor = '#83f07f', inactiveColor = '#ccc' }) {
  const { width } = useWindowDimensions();
  const switchTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(switchTranslateX, {
      toValue: isOn ? 24 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOn, width]);

  return (
    <TouchableOpacity
      style={[styles.switch, { backgroundColor: isOn ? activeColor : inactiveColor }]}
      onPress={onToggle}
    >
      <Animated.View 
        style={[
          styles.switchCircle, 
          { transform: [{ translateX: switchTranslateX }] }
        ]} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  switch: {
    width: 48,
    height: 24,
    borderRadius: 16,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  switchCircle: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
});
