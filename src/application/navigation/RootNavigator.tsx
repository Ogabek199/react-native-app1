import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { EntryDetailScreen } from '../../screens/EntryDetailScreen';
import { EntryEditorScreen } from '../../screens/EntryEditorScreen';
import { JournalListScreen } from '../../screens/JournalListScreen';
import OnboardingScreen from '../../screens/OnboardingScreen';
import { SignInScreen } from '../../screens/SignInScreen';
import { SearchScreen } from '../../screens/SearchScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { DailyRemindersScreen } from '../../screens/DailyRemindersScreen';
import { DataExportScreen } from '../../screens/DataExportScreen';
import { HelpCenterScreen } from '../../screens/HelpCenterScreen';
import { JournalCalendarScreen } from '../../screens/JournalCalendarScreen';
import { JournalFiltersScreen } from '../../screens/JournalFiltersScreen';
import { JournalFilteredScreen } from '../../screens/JournalFilteredScreen';
import { LanguageSelectScreen } from '../../screens/LanguageSelectScreen';
import { AppIcon } from '../../shared/ui/AppIcon';
import { useSettingsStore } from '../../store/useSettingsStore';

export type RootStackParamList = {
  Onboarding: undefined;
  SignIn: { mode?: 'signin' | 'signup' } | undefined;
  MainTabs: undefined;
  JournalList: undefined; // legacy (not used as a direct stack screen)
  EntryEditor: { entryId?: string } | undefined;
  EntryDetail: { entryId: string };
  Search: undefined;
  DailyReminders: undefined;
  DataExport: undefined;
  HelpCenter: undefined;
  JournalFilters: undefined;
  JournalCalendar: undefined;
  JournalFiltered: undefined;
  LanguageSelect: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export type MainTabParamList = {
  Journal: undefined;
  New: undefined;
  Settings: undefined;
};

const Tabs = createBottomTabNavigator<MainTabParamList>();

function NewTabButton(props: any) {
  const { onPress, accessibilityState } = props;
  const selected = Boolean(accessibilityState?.selected);
  return (
    <View className="flex-1 items-center">
      <Pressable
        onPress={onPress}
        className={[
          'h-16 w-16 rounded-full items-center justify-center',
          'bg-danger',
          'shadow-black/10 shadow-2xl',
          selected ? 'opacity-100' : 'opacity-95',
        ].join(' ')}
        style={{ marginTop: -24, elevation: 16 }}
      >
        <AppIcon name="add" size={34} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function MainTabs() {
  const rootNav = useNavigation<any>();
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          height: 72,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: colors.card,
          borderTopWidth: 0,
          shadowColor: '#0F1216',
          shadowOpacity: dark ? 0.25 : 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -8 },
          elevation: 12,
        },
        // Reference: active tab is red on Settings screen
        tabBarActiveTintColor: '#E04E4E',
        tabBarInactiveTintColor: dark ? '#9AA0AA' : '#6B6F75',
      }}
    >
      <Tabs.Screen
        name="Journal"
        component={JournalListScreen}
        options={{
          tabBarLabel: t('common.journal'),
          tabBarIcon: ({ focused, color }) => (
            <AppIcon
              name={focused ? 'book' : 'book-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="New"
        component={View as any}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => (
            <NewTabButton
              {...props}
              onPress={() => {
                rootNav.navigate('EntryEditor');
              }}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Open compose instead of a real tab screen
            e.preventDefault();
            rootNav.navigate('EntryEditor');
          },
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('common.settings'),
          tabBarIcon: ({ focused, color }) => (
            <AppIcon
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const isLoggedIn = useSettingsStore((s) => s.isLoggedIn);
  const hydrated = useSettingsStore((s) => s.hydrated);

  if (!hydrated) return null;

  return (
    <Stack.Navigator initialRouteName={isLoggedIn ? 'MainTabs' : 'Onboarding'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="EntryEditor"
        component={EntryEditorScreen}
        options={{ headerShown: true, title: 'Write Reflection' }}
      />
      <Stack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{ headerShown: true, title: 'Entry' }}
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: true, title: 'Search' }} />
      <Stack.Screen
        name="DailyReminders"
        component={DailyRemindersScreen}
        options={{
          headerShown: true,
          title: 'Daily Reminders',
        }}
      />
      <Stack.Screen
        name="DataExport"
        component={DataExportScreen}
        options={{ headerShown: true, title: 'Data Export' }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ headerShown: true, title: 'Help Center' }}
      />
      <Stack.Screen
        name="JournalFilters"
        component={JournalFiltersScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="JournalCalendar"
        component={JournalCalendarScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="JournalFiltered"
        component={JournalFilteredScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

