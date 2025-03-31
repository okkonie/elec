import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, Modal, TouchableOpacity, Keyboard, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { BarChart } from '../components/bar-chart'
import Slider from '@react-native-community/slider';
import { activateKeepAwakeAsync, deactivateKeepAwakeAsync } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';


const Home = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [isAlvOn, setIsAlvOn] = useState(true);
  const [values, setValues] = useState(['7', '15', '0']);
  const [zoom, setZoom] = useState(10);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true); 
  const [orientation, setOrientation] = useState('PORTRAIT');
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height
    };
  });

  useEffect(() => {
    const enableAllOrientations = async () => {
      await ScreenOrientation.unlockAsync();
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.ALL
      );
    };
    
    enableAllOrientations();

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const orientationEnum = event.orientationInfo.orientation;
      
      let orientationType;
      switch (orientationEnum) {
        case ScreenOrientation.Orientation.PORTRAIT_UP:
        case ScreenOrientation.Orientation.PORTRAIT_DOWN:
          orientationType = 'PORTRAIT';
          break;
        case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
        case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
          orientationType = 'LANDSCAPE';
          break;
        default:
          orientationType = 'PORTRAIT';
      }
      setOrientation(orientationType);
    });

    const getInitialOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      const isPortrait = 
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP || 
        orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN;
      setOrientation(isPortrait ? 'PORTRAIT' : 'LANDSCAPE');
    };
    getInitialOrientation();

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height
      });
    });

    return () => subscription?.remove();
  }, []);

  const checkAndFetchPrices = async () => {
    try {
      const storedPrices = await AsyncStorage.getItem('prices');
      let prices = storedPrices ? JSON.parse(storedPrices) : {};
      
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      prices = Object.fromEntries(
        Object.entries(prices).filter(([date]) => date >= todayStr)
      );
      
      await AsyncStorage.setItem('prices', JSON.stringify(prices));
      
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      
      const isAfterTwoPM = new Date().getHours() >= 14;
      const todayPricesExist = Object.keys(prices).some((date) => date.startsWith(todayStr));
      const tomorrowPricesExist = Object.keys(prices).some((date) => date.startsWith(tomorrowStr));
      
      if ((!todayPricesExist && !isAfterTwoPM) || (!tomorrowPricesExist && isAfterTwoPM)) {
        const response = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
        const data = await response.json();
        let newPrices = {};
        
        data.prices.forEach((obj) => {
          newPrices[obj.startDate] = obj.price;
        });
        
        await AsyncStorage.setItem('prices', JSON.stringify(newPrices));
        const formattedPrices = Object.entries(newPrices).map(([time, price]) => ({ time, price }));
        setPrices(formattedPrices);
      }
    } catch (error) {
      console.error('Error checking prices:', error);
    }
  };
  
  const usePriceChecker = () => {
    useEffect(() => {
      let isMounted = true;
  
      const runChecker = async () => {
        while (isMounted) {
          await checkAndFetchPrices();
          await new Promise((resolve) => setTimeout(resolve, 60000)); 
        }
      };
  
      runChecker();
  
      return () => {
        isMounted = false;
      };
    }, []);
  };

  usePriceChecker();
  
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      checkAndFetchPrices();
    }
  });
  
  useEffect(() => {
    const fetchStoredPrices = async () => {
      try {
        const storedPrices = await AsyncStorage.getItem('prices');
        if (storedPrices) {
          const parsedPrices = JSON.parse(storedPrices);
          const formattedPrices = Object.entries(parsedPrices).map(([time, price]) => ({ time, price }));
          setPrices(formattedPrices);
        } else {
          // If no stored prices, fetch new ones
          const response = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
          const data = await response.json();
          let newPrices = {};
    
          data.prices.forEach((obj) => {
            newPrices[obj.startDate] = obj.price;
          });

          await AsyncStorage.setItem('prices', JSON.stringify(newPrices));
          
          // Format the new prices for the state
          const formattedPrices = Object.entries(newPrices).map(([time, price]) => ({ time, price }));
          setPrices(formattedPrices);
        }
      } catch (error) {
        console.error('Error loading/fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchStoredPrices();
  }, []);

  useEffect(() => {
    // Use async function to activate keep-awake
    const enableKeepAwake = async () => {
      await activateKeepAwakeAsync();
    };
    
    enableKeepAwake();
    
    // Cleanup: deactivate keep-awake when component unmounts
    return async () => {
      await deactivateKeepAwakeAsync();
    };
  }, []);

  const switchTranslateXNotification = useRef(new Animated.Value(0)).current;
  const switchTranslateXAlv = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(switchTranslateXNotification, {
      toValue: isNotificationOn ? 24 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isNotificationOn, dimensions.width]);

  
  useEffect(() => {
    Animated.timing(switchTranslateXAlv, {
      toValue: isAlvOn ? 24 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isAlvOn, dimensions.width]);


  const handleChangeText = (text, index) => {
    if (/^\d*\.?\d*$/.test(text)) {  
      setValues((prev) => {
        const updatedValues = [...prev];
        updatedValues[index] = text; 
        AsyncStorage.setItem('values', JSON.stringify(updatedValues));
        return updatedValues;
      });
    }
  };

  useEffect(() => {
    const loadStoredValues = async () => {
      try {
        const storedNotification = await AsyncStorage.getItem('isNotificationOn');
        const storedAlv = await AsyncStorage.getItem('isAlvOn');
        const storedValues = await AsyncStorage.getItem('values');
        const storedSliderValue = await AsyncStorage.getItem('sliderValue');
  
        if (storedNotification !== null) setIsNotificationOn(JSON.parse(storedNotification));
        if (storedAlv !== null) setIsAlvOn(JSON.parse(storedAlv));
        if (storedValues) {
          const parsedValues = JSON.parse(storedValues).map(v => v === "" ? "0" : v);
          setValues(parsedValues);
        }
        if (storedSliderValue !== null) {
          setZoom(parseFloat(storedSliderValue));
        }
      } catch (error) {
        console.error('Error loading stored values:', error);
      }
    };
  
    loadStoredValues();
  }, []);

  const handleSlidingComplete = async (value) => {
    setZoom(value);
    try {
      await AsyncStorage.setItem('sliderValue', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving slider value:', error);
    }
  };

  const toggleNotification = () => {
    setIsNotificationOn((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem('isNotificationOn', JSON.stringify(newValue));
      return newValue;
    });
  };

  const toggleAlv = async () => {
    try {
      const newValue = !isAlvOn;
      await AsyncStorage.setItem('isAlvOn', JSON.stringify(newValue));
      setIsAlvOn(newValue);
    } catch (error) {
      console.error("Error saving isAlvOn:", error);
    }
  };

  const toggleModal = () => {
    Keyboard.dismiss(); 
    setValues((prev) => 
      prev.map(value => value === "" ? "0" : value) 
    );
    setShowSettings((prev) => !prev);
  };

  const getBackgroundColor = (index) => {
    switch (index) {
      case 0:
        return '#fce16a'; // mid
      case 1:
        return '#fc6a6a'; // pricey
      default: 
        return '#ccc'; 
    }
  };
  
  const [tempValues, setTempValues] = useState([])

  const renderInput = (index) => {
    return (
      <TextInput
        key={index}
        style={[
          styles.input,
          focusedIndex === index && styles.inputFocused,
          { backgroundColor: getBackgroundColor(index) }
        ]}
        placeholder={focusedIndex === index ? '' : '0.00'}
        placeholderTextColor="#ccc"
        keyboardType="decimal-pad"
        textAlign="center"
        value={values[index]}
        onChangeText={(text) => handleChangeText(text, index)}
        onFocus={() => {
          setFocusedIndex(index);
        
          if (values[index] !== '') {
            const updatedTempValues = [...tempValues];
            updatedTempValues[index] = values[index]; 
            setTempValues(updatedTempValues);
            handleChangeText('', index); 
          }
        }}
        onBlur={() => {
          setFocusedIndex(null);
          if (values[index] === '') {
            handleChangeText(tempValues[index] || '0', index);
          }
        }}
      />
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1, 
      backgroundColor: '#1e212e', 
      alignItems: 'center',
      justifyContent: 'center',
    },
    top: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    closeButton: {
      paddingHorizontal: '5%',
    },
    settingHead: {
      color: 'white',
      fontWeight: 900,
      fontSize: 16,
      marginLeft: '5%',
    },
    settingButton: {
      position: 'absolute',
      top: dimensions.width < dimensions.height ? 20 : null,
      bottom: dimensions.width < dimensions.height ? null : 30,
      right: dimensions.width < dimensions.height ? 20 : null,
      left: dimensions.width < dimensions.height ? null : 20,
      justifyContent: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    modalOverlay: {
      justifyContent: 'center',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
      alignSelf: 'center',
      width: dimensions.width < dimensions.height ? dimensions.width * 0.96 : dimensions.width * 0.56,
      height: dimensions.width < dimensions.height ? dimensions.height * 0.5 : dimensions.height * 0.85,
      justifyContent: 'space-evenly',
      alignItems: 'center',
      backgroundColor: '#1e212e',
      borderRadius: dimensions.width * 0.05,
      padding: 10,
      zIndex: 10,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowRadius: 10,
      shadowOpacity: 0.1,
    },
    row: {
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      width: '90%',
    },
    settingText: {
      color: '#ffffff',
      fontWeight: 600,
      fontSize: 14,
    },
    slider: {
      width: 270,
      height: 1,
    },
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
      backgroundColor: '#ffffff',
    },
    input: {
      fontWeight: 700,
      fontSize: 13,
      backgroundColor: '#ccc',
      color: '#1e212e',
      height: 36,
      width: 60,
      borderRadius: 15,
    },
    inputFocused: {
      borderColor: '#fff',
      borderWidth: 1, 
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1e212e" translucent={false} />

      <View style={styles.settingButton}>
        <TouchableOpacity onPress={toggleModal}>
          <Ionicons name={"settings-sharp"} size={25} color="white" />
        </TouchableOpacity>
      </View>

      {loading || !prices || !Array.isArray(prices) || prices.length === 0 ? (
        <ActivityIndicator size="large" color="#83f07f" />
      ) : (
        <BarChart 
          prices={prices} 
          values={values} 
          zoom={zoom} 
          alv={isAlvOn} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}


      <Modal animationType='fade' transparent={true} visible={showSettings}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.top}>
              <Text style={styles.settingHead}>ASETUKSET</Text>
              <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.settingText}>ilmoita huomisista hinnoista</Text>
              <TouchableOpacity
                style={[styles.switch, { backgroundColor: isNotificationOn ? '#83f07f' : '#ccc' }]}
                onPress={toggleNotification}
              >
                <Animated.View style={[styles.switchCircle, { transform: [{ translateX: switchTranslateXNotification }] }]} />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.settingText}>näytä alv (25,5%)</Text>
              <TouchableOpacity
                style={[styles.switch, { backgroundColor: isAlvOn ? '#83f07f' : '#ccc' }]}
                onPress={toggleAlv}
              >
                <Animated.View style={[styles.switchCircle, { transform: [{ translateX: switchTranslateXAlv }] }]} />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.settingText}>lisäkulut (c/kWh)</Text>
              {renderInput(2)}
            </View>
            <View style={styles.row}>
              <Text style={styles.settingText}>värikoodit</Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                {Array.from({ length: 2 }, (_, i) => renderInput(i))}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.settingText}>zoom</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={15}
                step={1}
                value={zoom}
                onSlidingComplete={handleSlidingComplete}
                minimumTrackTintColor='#83f07f'
                maximumTrackTintColor="#ccc"
                thumbTintColor='#83f07f'
              />
            </View>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Home;
