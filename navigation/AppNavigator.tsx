import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import PlayersScreen from '../screens/PlayersScreen';
import MatchesScreen from '../screens/MatchesScreen';
import StatsScreen from '../screens/StatsScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import QuickMatchScreen from '../screens/QuickMatchScreen';
import MatchScoringScreen from '../screens/MatchScoringScreen';
import TournamentCreateScreen from '../screens/TournamentCreateScreen';
import TournamentDetailScreen from '../screens/TournamentDetailScreen';
import TournamentBracketScreen from '../screens/TournamentBracketScreen';
import PlayerStatsScreen from '../screens/PlayerStatsScreen';
import HeadToHeadScreen from '../screens/HeadToHeadScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Players') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'tennisball' : 'tennisball-outline';
          } else if (route.name === 'Tournaments') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Players" 
        component={PlayersScreen}
        options={{ title: 'Players' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{ title: 'Matches' }}
      />
      <Tab.Screen 
        name="Tournaments" 
        component={TournamentsScreen}
        options={{ title: 'Tournaments' }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ title: 'Statistics' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="QuickMatch" 
          component={QuickMatchScreen}
          options={{ title: 'Quick Match' }}
        />
        <Stack.Screen 
          name="MatchScoring" 
          component={MatchScoringScreen as any}
          options={{ title: 'Match Scoring' }}
        />
        <Stack.Screen 
          name="TournamentCreate" 
          component={TournamentCreateScreen}
          options={{ title: 'Create Tournament' }}
        />
        <Stack.Screen 
          name="TournamentDetail" 
          component={TournamentDetailScreen as any}
          options={{ title: 'Tournament Details' }}
        />
        <Stack.Screen 
          name="TournamentBracket" 
          component={TournamentBracketScreen as any}
          options={{ title: 'Tournament Bracket' }}
        />
        <Stack.Screen
          name="PlayerStats"
          component={PlayerStatsScreen}
          options={{ title: 'Player Statistics' }}
        />
        <Stack.Screen
          name="HeadToHead"
          component={HeadToHeadScreen}
          options={{ title: 'Head to Head' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}