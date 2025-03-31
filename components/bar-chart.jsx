import { View, Text, ScrollView, Pressable, Animated, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';


export const BarChart = React.memo(({ prices, values, zoom, alv, width, height }) => {
  if (!prices || !Array.isArray(prices) || prices.length ===  0) {
    return null;
  }

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedIndex, setSelectedIndex] = useState(null);

  const chartData = useMemo(() => {
    const highestPrice = Math.max(...prices.map(p => p.price));
    const ChartHeight = width < height ? highestPrice > values[0] ? height * 0.68 : height * 0.4 : height * 0.9;
    const ChartWidth = width < height ? width * 1 : width * 0.65;
    const flippedPrices = [...prices].reverse();

    const displayedPrices = flippedPrices
      .filter((price) => {
        const priceDate = new Date(price.time);
        const nowUTC = new Date(currentTime.toISOString().slice(0, 13) + ":00:00Z");
        return priceDate >= nowUTC;
      })
      .map((price) => ({
        ...price,
        price: alv ? price.price : price.price / 1.255
      }));

    const bars = zoom > displayedPrices.length ? displayedPrices.length : zoom;
    const BarGap = bars <= 9 ? 10 : bars <= 14 ? 7 : 5;
    const BarWidth = (ChartWidth - BarGap * (bars + 1)) / bars;

    return {
      highestPrice,
      ChartHeight,
      ChartWidth,
      displayedPrices,
      bars,
      BarGap,
      BarWidth
    };
  }, [prices, values, zoom, alv, width, height, currentTime]);

  const animatedHeights = useRef(chartData.displayedPrices.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    const updateDisplayedData = () => {
      setCurrentTime(new Date());
      setSelectedIndex(null);
    };

    updateDisplayedData();
    const intervalId = setInterval(updateDisplayedData, 60000);

    return () => clearInterval(intervalId);
  }, [prices]);

  useEffect(() => {
    chartData.displayedPrices.forEach((price, index) => {
      const targetHeight = (price.price / chartData.highestPrice) * chartData.ChartHeight * 0.84 + chartData.ChartHeight * 0.02;
      Animated.timing(animatedHeights[index], {
        toValue: targetHeight,
        duration: 400,
        useNativeDriver: false,
      }).start();
    });
  }, [chartData.displayedPrices, chartData.highestPrice, chartData.ChartHeight]);

  const getPriceColor = (price, isDimmed) => {
    const adjustedPrice = parseFloat(price) + parseFloat(values[2]);
    if (isDimmed) return 'rgba(255, 255, 255, 0.4)';
    if (adjustedPrice <= values[0]) return '#83f07f'; // cheap
    if (adjustedPrice <= parseFloat(values[1])) return '#fce16a'; // mid
    return '#fc6a6a'; // pricey
  };  

  return (
    <View style={{ width: '100%', height: '100%' }}>
      {/* Top half for deselecting */}
      <TouchableWithoutFeedback onPress={() => setSelectedIndex(null)}>
        <View style={{ 
          width: '100%', 
          height: '50%', 
          position: 'absolute',
          top: 0
        }}>
          {/* Price display view */}
          <View style={{
            top: 20, 
            position: 'absolute',
            left: 20,
            pointerEvents: 'none',
          }}>
            <View style={{
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 5, 
              backgroundColor: getPriceColor(selectedIndex !== null ? 
                (chartData.displayedPrices[selectedIndex].price + parseFloat(values[2])).toFixed(2) 
                : (chartData.displayedPrices[0].price + parseFloat(values[2])).toFixed(2)),
              width: 80,
              height: 35,
              borderRadius: 18,
            }}>
              <Feather name='clock' size={22} color='#1e212e' />
              <Text style={{fontSize: 20, color: '#1e212e', fontWeight: 800,}}>{selectedIndex !== null ? new Date(chartData.displayedPrices[selectedIndex].time).getHours().toString().padStart(2, '0') : new Date(chartData.displayedPrices[0].time).getHours().toString().padStart(2, '0')}</Text>
            </View>
            <Text style={{
              fontSize: 80, 
              color: '#fff', 
              fontWeight: 900, 
            }}>{selectedIndex !== null ? (chartData.displayedPrices[selectedIndex].price + parseFloat(values[2])).toFixed(2) : (chartData.displayedPrices[0].price + parseFloat(values[2])).toFixed(2)}</Text>
            
            {!selectedIndex || selectedIndex === chartData.displayedPrices[0].price ? (
              <>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  {chartData.displayedPrices[0].price >= chartData.displayedPrices[1].price ? (
                    <Feather name='arrow-down-right' size={30} color='#83f07f' />
                  ) : (
                    <Feather name='arrow-up-right' size={30} color='#fc6a6a' />
                  )}
                  <Text style={{
                    fontSize: 35, 
                    color: '#fff', 
                    fontWeight: 800, 
                  }}>{(chartData.displayedPrices[1].price + parseFloat(values[2])).toFixed(2)}</Text>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  {chartData.displayedPrices[1].price >= chartData.displayedPrices[2].price ? (
                    <Feather name='arrow-down-right' size={30} color='#83f07f' />
                  ) : (
                    <Feather name='arrow-up-right' size={30} color='#fc6a6a' />
                  )}
                  <Text style={{
                    fontSize: 35, 
                    color: '#fff', 
                    fontWeight: 800, 
                  }}>{(chartData.displayedPrices[2].price + parseFloat(values[2])).toFixed(2)}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom half for scrolling */}
      <View style={{ 
        width: '100%', 
        height: '50%', 
        position: 'absolute',
        bottom: 0
      }}>
        <ScrollView 
          bounces={false} 
          alwaysBounceVertical={false} 
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          horizontal={true} 
          contentContainerStyle={{ 
            flexGrow: 1, 
            flexDirection: 'row', 
            gap: chartData.BarGap, 
            alignItems: 'flex-end', 
            paddingHorizontal: chartData.BarGap 
          }}
          style={{ 
            alignSelf: width < height ? 'center' : 'flex-end', 
            right: width > height ? 10 : 0, 
            maxHeight: chartData.ChartHeight, 
            maxWidth: chartData.ChartWidth, 
            overflow: 'hidden', 
            position: 'absolute', 
            bottom: width < height ? width * 0.04 : height * 0.04 
          }}
        >
          {chartData.displayedPrices.map((price, index) => {
            const isDimmed = selectedIndex !== null && selectedIndex !== index && selectedIndex !== 0;
            return (
              <Pressable 
                key={index} 
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(index);
                }}
              >
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: chartData.BarWidth,
                      height: animatedHeights[index],
                      backgroundColor: getPriceColor(price.price, isDimmed),
                      borderRadius: chartData.BarWidth * 0.5,
                      borderCurve: 'circular',
                      justifyContent: 'center',
                      opacity: isDimmed ? 0.5 : 1,
                    }}
                  />
                  <Text style={{ color: isDimmed ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '800', fontSize: zoom < 7 ? 20 :zoom < 10 ? 16 : 14, marginTop: chartData.BarGap }}>
                    {new Date(price.time).getHours().toString().padStart(2, '0')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
});