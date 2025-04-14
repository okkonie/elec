import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, Pressable, TextInput, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Loading from '../components/loading';
import { checkAndFetchPrices } from '../components/fetchprices';
import { useState, useEffect } from 'react';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import Switch from '../components/switch';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const [prices, setPrices] = useState(null);
  const [displayPrices, setDisplayPrices] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [addedPrices, setAddedPrices] = useState(0);
  const [tempAddedPrices, setTempAddedPrices] = useState(0);
  const [isAlvOn, setAlvOn] = useState(true);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [showAddedPrices, setShowAddedPrices] = useState(false);
  const [values, setValues] = useState([7, 15, 22]);
  const [changeValues, setChangeValues] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const zoomOptions = Array.from({ length: 11 }, (_, i) => i + 5);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const fetchPrices = async () => {
      const fetchedPrices = await checkAndFetchPrices();
      setPrices(fetchedPrices);
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      
      if (prices) {
        const displayedPrices = Object.entries(prices)
          .filter(([dateTime]) => {
            const priceDate = new Date(dateTime);
            return priceDate >= now || (priceDate.getDate() === now.getDate() && priceDate.getHours() === now.getHours());
          })
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
        
        setDisplayPrices(displayedPrices);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const hasTomorrowPrices = Object.keys(prices).some(dateTime => {
          const priceDate = new Date(dateTime);
          return priceDate.getDate() === tomorrow.getDate() && 
                 priceDate.getMonth() === tomorrow.getMonth() && 
                 priceDate.getFullYear() === tomorrow.getFullYear();
        });

        if (now.getHours() === 14 && !hasTomorrowPrices) {
          console.log('Fetching new prices');
          checkAndFetchPrices().then(setPrices);
        }
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [prices]);

  const calculateAlvAndAddedPrices = (price) => {
    if (price + parseFloat(addedPrices) < 0) {
      return price + parseFloat(addedPrices);
    }
    return (price + parseFloat(addedPrices)) / (isAlvOn ? 1 : 1.255);
  };

  const toggleAlv = () => {
    const newValue = !isAlvOn;
    setAlvOn(newValue);
    AsyncStorage.setItem('isAlvOn', JSON.stringify(newValue));
  };

  useEffect(() => {
    const loadValues = async () => {
      try {
        const storedValues = await AsyncStorage.getItem('userValues');
        const storedZoom = await AsyncStorage.getItem('zoom');
        const storedAddedPrices = await AsyncStorage.getItem('addedPrices');
        const storedAlvOn = await AsyncStorage.getItem('isAlvOn');
        if (storedValues !== null) {
          setValues(JSON.parse(storedValues));
        }
        if (storedZoom !== null) {
          setZoom(JSON.parse(storedZoom));
        }
        if (storedAddedPrices !== null) {
          setAddedPrices(JSON.parse(storedAddedPrices));
        }
        if (storedAlvOn !== null) {
          setAlvOn(JSON.parse(storedAlvOn));
        }
      } catch (error) {
        console.error('Error loading values from AsyncStorage', error);
      }
    };
  
    loadValues();
  }, []);

  if (!displayPrices || Object.keys(displayPrices).length === 0) {
    return <Loading />;
  }

  const maxPrice = Math.max(...displayPrices.map(([_, price]) => calculateAlvAndAddedPrices(price)));
  const chartWidth = dimensions.width - 40;
  const effectiveZoom = Math.min(zoom, displayPrices.length);
  const barGap = 70 / effectiveZoom;
  const barWidth = (chartWidth - (effectiveZoom + 1) * barGap) / effectiveZoom;

  const maxBarHeight = 
  maxPrice > values[2] ? dimensions.height * 0.5 : 
  maxPrice > values[1] ? dimensions.height * 0.35 : 
  maxPrice > values[0] ? dimensions.height * 0.2 : 
  dimensions.height * 0.1;

  const getBarHeight = (price) => {
    if (price < 0) {
      return (maxPrice / price) * maxBarHeight
    }
    return (price / maxPrice) * maxBarHeight;
  };

  const getColor = (price) => {
    if (price > values[2]) {
      return '#f241c9';
    } else if (price > values[1]) {
      return '#fa5a5a';
    } else if (price > values[0]) {
      return '#facf5a';
    };
    return '#83f07f';
  };

  const renderColorButton = (index) => {
    return (
      <TouchableOpacity
        style={{ alignItems: 'center' }}
        onPress={() => {
          setSelectedIndex(index);
          setTempValue(values[index].toString());
          setChangeValues(true);
        }}
      >
        <Text style={[styles.contentText, { color: 'white' }]}>
          {values[index]}
        </Text>
        <View
          style={{
            width: 30,
            height: 4,
            borderRadius: 2,
            backgroundColor:
              index === 0 ? '#facf5a' : index === 1 ? '#fa5a5a' : '#f241c9',
          }}
        />
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style='light' backgroundColor='#101012' translucent={false} />

      <View style={{flexDirection: 'row', width: '100%', justifyContent: 'space-between', height: '35%', alignItems: 'flex-end',}}>

        <View style={styles.priceDisplay}>

          <View style={[styles.clock, {backgroundColor: getColor(
            selectedTime 
              ? (calculateAlvAndAddedPrices(displayPrices?.find(([dateTime]) => dateTime === selectedTime)?.[1]).toFixed(2))
              : (calculateAlvAndAddedPrices(displayPrices?.[0]?.[1]).toFixed(2))
          )}]}>
            <Feather name="clock" size={20} color='#101012' />
            <Text style={{color: '#101012', fontSize: 20, fontWeight: 700}}>
              {selectedTime 
                ? new Date(selectedTime).getHours() 
                : displayPrices?.[0] ? new Date(displayPrices[0][0]).getHours() : ''}
            </Text>
          </View>

          <Text style={[styles.shownPrice, {fontSize: 70, color: 'white'}]}>
            {selectedTime 
              ? (calculateAlvAndAddedPrices(displayPrices?.find(([dateTime]) => dateTime === selectedTime)?.[1]).toFixed(2))
              : (calculateAlvAndAddedPrices(displayPrices?.[0]?.[1]).toFixed(2))}
          </Text> 

          {!selectedTime && (
            <>
              <View style={styles.row}>
              {Number(displayPrices?.[0]?.[1]) >= Number(displayPrices?.[1]?.[1])
              ? <Feather name="arrow-down-right" size={26} color='#83f07f' /> : <Feather name="arrow-up-right" size={26} color='#fa5a5a' />}
              <Text style={[styles.shownPrice, {fontSize: 35, color: 'white'}]}>
                {calculateAlvAndAddedPrices(displayPrices?.[1]?.[1]).toFixed(2)}
              </Text>
              </View>
              <View style={styles.row}>
              {Number(displayPrices?.[1]?.[1]) >= Number(displayPrices?.[2]?.[1])
              ? <Feather name="arrow-down-right" size={26} color='#83f07f' /> : <Feather name="arrow-up-right" size={26} color='#fa5a5a' />}
              <Text style={[styles.shownPrice, {fontSize: 35, color: 'white'}]}>
                {calculateAlvAndAddedPrices(displayPrices?.[2]?.[1]).toFixed(2)}
              </Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => { setShowSettings(true) }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="settings" size={23} color='white' />
        </TouchableOpacity>

        <View style={styles.settingsBack}/>
      
      </View>
      
      <Modal 
        visible={showSettings} 
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.settingsContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>ASETUKSET</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Feather name="x" size={24} color='#ccc' />
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>näytä alv (25,5%)</Text>
              <Switch isOn={isAlvOn} onToggle={toggleAlv} activeColor='#83f07f' inactiveColor='#ccc' />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>lisäkulut</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowAddedPrices(true)}>
                <Text style={styles.dropdownButtonText}>{addedPrices}</Text>
              </TouchableOpacity>
              {showAddedPrices && (
                <Modal
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowAddedPrices(false)}
                >
                  <Pressable 
                    style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                    onPress={() => {setShowAddedPrices(false)}}
                  >
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={tempAddedPrices === 0 ? '' : tempAddedPrices.toString()}
                        onChangeText={(text) => {
                          if (text === '') {
                            setTempAddedPrices(0);
                            return;
                          }
                          if (/^\d*\.?\d*$/.test(text)) {
                            setTempAddedPrices(text);
                          }
                          
                        }}
                        keyboardType="decimal-pad"
                        placeholder=""
                        placeholderTextColor="#ccc"
                        selectTextOnFocus={true}
                        cursorColor="#101012"
                        maxLength={6}
                        autoFocus={true}
                        onSubmitEditing={() => {
                          setShowAddedPrices(false); 
                          setAddedPrices(tempAddedPrices);
                          AsyncStorage.setItem('addedPrices', JSON.stringify(tempAddedPrices));
                        }}
                        returnKeyType="done"
                      />
                      <Text style={styles.inputLabel}>c/kWh</Text>
                    </View>
                  </Pressable>
                </Modal>
              )}
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>palkkien määrä</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowZoomDropdown(!showZoomDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>{zoom}</Text>
                </TouchableOpacity>
                {showZoomDropdown && (
                  <Modal 
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => {setShowZoomDropdown(false)}}
                  >
                    <Pressable 
                    style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                    onPress={() => {setShowZoomDropdown(false)}}
                    >
                      <View style={styles.dropdownContainer}>
                        <FlatList
                          ListHeaderComponent={<View style={{height: 15}} />}
                          ListFooterComponent={<View style={{height: 15}} />}
                          data={zoomOptions}
                          keyExtractor={(item) => item.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => { setZoom(item); AsyncStorage.setItem('zoom', JSON.stringify(item)); setShowZoomDropdown(false)}}>
                              <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                          )}
                          showsVerticalScrollIndicator={false}
                        />
                      </View>
                    </Pressable>
                  </Modal>
                )}
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>palkkien värit</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
              {values.map((value, index) => (
                <View key={index}>{renderColorButton(index)}</View>
              ))}
              {changeValues && (
                <Modal
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setChangeValues(false)}
                >
                  <Pressable
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setChangeValues(false)}
                  >
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={tempValue}
                        onChangeText={(text) => {
                          if (/^\d*\.?\d*$/.test(text)) {
                            setTempValue(text);
                          }
                        }}
                        keyboardType="decimal-pad"
                        placeholder=""
                        placeholderTextColor="#ccc"
                        selectTextOnFocus={true}
                        cursorColor="#101012"
                        maxLength={6}
                        autoFocus={true}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (selectedIndex !== null) {
                            const newValues = [...values];
                            newValues[selectedIndex] = parseFloat(tempValue) || 0;
                            setValues(newValues);
                            AsyncStorage.setItem('userValues', JSON.stringify(newValues)); 
                          }
                          setChangeValues(false);
                        }}
                      />
                      <Text style={styles.inputLabel}>c/kWh</Text>
                    </View>
                  </Pressable>
                </Modal>
              )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      <Pressable style={{
        height: '63%',
        width: '100%',
        borderRadius: 30,
        backgroundColor: '#2e2e2e',
        alignItems: 'center',
        zIndex: 1,
        }} onPress={() => {setSelectedTime(null)}} 
      >
        <ScrollView 
          showsHorizontalScrollIndicator={false}
          horizontal={true} 
          scrollEventThrottle={16} 
          
          contentContainerStyle={{ 
            flexDirection: 'row', 
            gap: barGap, 
            alignItems: 'flex-end', 
            paddingHorizontal: barGap,
            marginBottom: '5%',
          }}
          style={{
            width: chartWidth,
            zIndex: 1000,
          }}
        >
        
          {displayPrices?.map(([dateTime, price], index) => {
            const isDimmed = selectedTime !== null && selectedTime !== dateTime;
            const isFirstBar = index === 0;
            const date = new Date(dateTime);
            const formattedTime = date.toLocaleTimeString('us-US', {
              hour: '2-digit',
              hour12: false,
            });
            return (
                <Pressable
                  hitSlop={{ top: 200, bottom: 30 }}
                  key={dateTime}
                  style={[styles.priceContainer, {opacity: isDimmed ? 0.4 : 1}]} 
                  onPress={() => {
                    if (isFirstBar) {
                      setSelectedTime(null);
                    } else {
                      setSelectedTime(selectedTime === dateTime ? null : dateTime);
                    }
                  }}
                >
                  <View 
                    style={
                      { 
                        height: getBarHeight(calculateAlvAndAddedPrices(price)),
                        minHeight: barWidth,
                        width: barWidth,
                        borderRadius: barWidth / 2,
                        backgroundColor: getColor(calculateAlvAndAddedPrices(price)),
                        borderCurve: 'circular',
                      }}
                  />
                  <Text style={[styles.timeText, {fontSize: effectiveZoom > 10 ? barWidth / 1.5 : barWidth / 2, color: 'white'}]}>{formattedTime}</Text>
                </Pressable>
            );
          })}
        </ScrollView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#101012',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 3,
    fontWeight: 900,
  },
  priceDisplay: {
    backgroundColor: '#2e2e2e',
    borderRadius: 30,
    width: '100%',
    paddingHorizontal: 30,
    paddingVertical: 20,
    height: '100%',
  },
  shownPrice: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 900,
  },
  clock: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    borderRadius: 20, 
    borderCurve: 'circular',
    justifyContent: 'center', 
    width: 70, 
    height: 35
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  settingsContainer: {
    backgroundColor: '#2e2e2e',
    padding: 30,
    width: '100%',
    height: '50%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    paddingBottom: 30,
    borderColor: 'grey',
  },
  headerText: {
    color: '#ccc',
    fontSize: 20,
    fontWeight: 900,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  contentText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#ccc',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'circular',
    zIndex: 1000,
  },
  settingsBack: {
    position: 'absolute',
    right: 0,
    bottom: 0,

  },
  dropdownButton: {
    backgroundColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 30,
    gap: 8,
  },
  dropdownButtonText: {
    color: '#101012',
    fontSize: 14,
    fontWeight: 700,
  },
  dropdownContainer: {
    backgroundColor: '#ccc',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 250,
    width: 100,
    zIndex: 1000,
  },
  dropdownItemText: {
    marginVertical: 10,
    color: '#101012',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#ccc',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    color: '#101012',
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
    width: 100,
  },
  inputLabel: {
    color: '#101012',
    fontSize: 16,
    fontWeight: 700,
  },
});