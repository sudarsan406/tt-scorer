import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FooterNavigationProps {
  navigation: any;
  currentRoute?: string;
}

export default function FooterNavigation({ navigation, currentRoute }: FooterNavigationProps) {
  const navItems = [
    { name: 'Home', icon: 'home', route: 'Main', screen: 'Home' },
    { name: 'Players', icon: 'people', route: 'Main', screen: 'Players' },
    { name: 'Matches', icon: 'tennisball', route: 'Main', screen: 'Matches' },
    { name: 'Tournaments', icon: 'trophy', route: 'Main', screen: 'Tournaments' },
    { name: 'Stats', icon: 'stats-chart', route: 'Main', screen: 'Stats' },
  ];

  const handleNavigation = (item: typeof navItems[0]) => {
    navigation.navigate(item.route, { screen: item.screen });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => handleNavigation(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={currentRoute === item.name ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.navText,
                { color: currentRoute === item.name ? '#2196F3' : '#666' }
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 60,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});