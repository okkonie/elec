import { View, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { useEffect, useRef } from 'react';

export default function Loading() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (value, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: 1,
              duration: 1000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: false,
            }),
            Animated.timing(value, {
              toValue: 0,
              duration: 1000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: false,
            }),
            Animated.delay(100),
          ])
        ),
      ]).start();
    };

    createAnimation(dot1, 0);
    createAnimation(dot2, 150);
    createAnimation(dot3, 300);
  }, []);

  const getDotStyle = (value) => {
    return {
      height: value.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [20, 40, 20],
      }),
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor='#101012' translucent={false} />
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
        <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
        <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101012',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dotsContainer: {
    bottom: '50%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  dot: {
    width: 15,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: '#ccc',
  },
});
