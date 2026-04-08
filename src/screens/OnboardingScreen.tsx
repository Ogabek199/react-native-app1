import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Image, Text, View } from 'react-native';

import type { RootStackParamList } from '../application/navigation/RootNavigator';
import { Button } from '../shared/ui/Button';
import { Screen } from '../shared/ui/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <Screen>
      <View className="items-center pt-8">
        <View className="h-12 w-12 rounded-full bg-accent items-center justify-center shadow-black/10 shadow-lg">
          <Text className="text-text text-2xl font-bold">⚡</Text>
        </View>

        <Text className="text-text text-3xl font-extrabold mt-6 text-center">
          Welcome to Your{'\n'}
          <Text className="text-text">Personal Diary</Text>
        </Text>

        <Text className="text-text2 text-center mt-3 px-6 leading-6">
          A private space for daily reflection and mindful living.
        </Text>

        <View className="w-full mt-8">
          <View className="rounded-3xl bg-card overflow-hidden shadow-black/5 shadow-xl">
            <Image
              source={require('../../assets/splash-icon.png')}
              style={{ width: '100%', height: 220 }}
              resizeMode="cover"
            />
          </View>
        </View>

        <View className="w-full mt-6 gap-3">
          <Button title="Get Started" onPress={() => navigation.replace('MainTabs')} />
          <Text className="text-text2 text-center text-sm">
            I already have an account. <Text className="text-text font-semibold">Sign In</Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}

