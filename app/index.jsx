import { View, Text, StyleSheet, StatusBar, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Loading from '../components/loading';
import { checkAndFetchPrices } from '../components/fetchprices';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Settings from '../components/settings';

export default function Home() {
  const [prices, setPrices] = useState(null);
  const [displayPrices, setDisplayPrices] = useState(null);
  const [zoom, setZoom] = useState(12);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);
  const chartWidth = dimensions.width;
  const maxBarHeight = dimensions.height * 0.55;
  const barGap = 100 / zoom;
  const barWidth = (chartWidth - (zoom + 1) * barGap) / zoom;


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

  if (!prices || Object.keys(prices).length === 0) {
    return <Loading />;
  }

  const getBarHeight = (price) => {
    const maxPrice = Math.max(...displayPrices.map(([_, price]) => price));
    return (price / maxPrice) * maxBarHeight;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor='#101012' translucent={false} />

      <View style={styles.priceDisplay}>
        <View style={{
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 5, 
          backgroundColor: '#ccc', 
          borderRadius: 20, 
          borderCurve: 'circular',
          justifyContent: 'center', 
          width: 80, 
          height: 40
          }}>
          <Feather name="clock" size={22} color='#101012' />
          <Text style={{color: '#101012', fontSize: 22, fontWeight: 900}}>{displayPrices?.[0] ? new Date(displayPrices[0][0]).getHours() : ''}</Text>
        </View>
        <Text style={[styles.shownPrice, {fontSize: 80}]}>{displayPrices?.[0]?.[1].toFixed(2)}</Text> 
        <View style={styles.row}>
        {displayPrices?.[0]?.[1].toFixed(2) >= displayPrices?.[1]?.[1].toFixed(2) 
        ? <Feather name="arrow-down-right" size={26} color='green' /> : <Feather name="arrow-up-right" size={26} color='red' />}
        <Text style={[styles.shownPrice, {fontSize: 40}]}>{displayPrices?.[1]?.[1].toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
        {displayPrices?.[1]?.[1].toFixed(2) >= displayPrices?.[2]?.[1].toFixed(2) 
        ? <Feather name="arrow-down-right" size={26} color='green' /> : <Feather name="arrow-up-right" size={26} color='red' />}
        <Text style={[styles.shownPrice, {fontSize: 40}]}>{displayPrices?.[2]?.[1].toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={{
        position: 'absolute',
        top: 0,
        right: '5%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ccc',
        borderRadius: 20,
        borderCurve: 'circular',
        height: 40,
        width: 40,
      }}>
      <Feather name="settings" size={22} color='#101012' onPress={() => setShowSettings(true)}/>
      </TouchableOpacity>

      <Settings showSettings={showSettings} setShowSettings={setShowSettings} />

      <LinearGradient
        colors={['#101012', 'transparent']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          top: 0,
          width: '2.4%',
          zIndex: 1000,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <ScrollView 
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        horizontal={true} 
        
        contentContainerStyle={{ 
          flexDirection: 'row', 
          gap: barGap, 
          alignItems: 'flex-end', 
          paddingHorizontal: barGap,
          marginBottom: '5%',
        }}
      >
        {displayPrices?.map(([dateTime, price]) => {
          const date = new Date(dateTime);
          const formattedTime = date.toLocaleTimeString('us-US', {
            hour: '2-digit',
            hour12: false,
          });
          return (
            <View key={dateTime} style={styles.priceContainer}>
              <View 
                style={[
                  styles.priceItem, 
                  { 
                    height: getBarHeight(price),
                    width: barWidth,
                    borderRadius: barWidth / 2,
                  }
                ]}
              />
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient
        colors={['transparent', '#101012']}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          top: 0,
          width: '2.4%',
          zIndex: 1000,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101012',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  priceItem: {
    backgroundColor: '#ccc',
    minHeight: 40,
    borderCurve: 'circular',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    fontWeight: 900,
  },
  priceDisplay: {
    alignSelf: 'flex-start',
    marginLeft: '3%',
  },
  shownPrice: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 900,
    marginTop: -8,
  },
  hourText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 900,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
