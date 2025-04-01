import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

export default function Settings({showSettings, setShowSettings}) {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    if (showSettings) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 20,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [showSettings]);

  return (
    <Modal 
      visible={showSettings} 
      transparent={true}
      animationType="none"
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[
          styles.settingsContainer,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>ASETUKSET</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Feather name="x" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-end',
  },
  settingsContainer: {
    backgroundColor: '#101012',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    height: '93%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ccc',
  },
  content: {
    alignItems: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#ccc',
  },
});

