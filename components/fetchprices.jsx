import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAndFetchPrices = async () => {
  try {
    const storedPrices = await AsyncStorage.getItem('prices');
    
    let prices = storedPrices ? JSON.parse(storedPrices) : {};
    
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    prices = Object.fromEntries(
      Object.entries(prices).filter(([date]) => date >= yesterdayStr)
    );
    
    await AsyncStorage.setItem('prices', JSON.stringify(prices));
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    
    const isAfterTwoPM = new Date().getHours() >= 14;
    const yesterdayPricesExist = Object.keys(prices).some((date) => date.startsWith(yesterdayStr));
    const todayPricesExist = Object.keys(prices).some((date) => date.startsWith(todayStr));
    const tomorrowPricesExist = Object.keys(prices).some((date) => date.startsWith(tomorrowStr));

    if (!storedPrices || !yesterdayPricesExist || !todayPricesExist || (!tomorrowPricesExist && isAfterTwoPM)) {
      console.log('Fetching new prices...');
      const response = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
      const data = await response.json();
      let newPrices = {};
      
      data.prices.forEach((obj) => {
        const priceDate = obj.startDate.slice(0, 10);
        if (priceDate === yesterdayStr || priceDate === todayStr || priceDate === tomorrowStr) {
          newPrices[obj.startDate] = obj.price;
        }
      });
      
      console.log('New prices fetched:', newPrices);
      await AsyncStorage.setItem('prices', JSON.stringify(newPrices));
      return newPrices;
    }
    return prices;
  } catch (error) {
    console.error('Error checking prices:', error);
    return {};
  }
};