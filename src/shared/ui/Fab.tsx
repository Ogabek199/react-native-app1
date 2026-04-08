import * as React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

type Props = {
  onPress: () => void;
  className?: string;
  style?: ViewStyle;
};

export function Fab({ onPress, className, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'h-14 w-14 rounded-full bg-accent items-center justify-center shadow-black/10 shadow-xl active:opacity-85',
        className ?? '',
      ].join(' ')}
      style={style}
    >
      <Text className="text-text text-2xl font-semibold">+</Text>
    </Pressable>
  );
}

