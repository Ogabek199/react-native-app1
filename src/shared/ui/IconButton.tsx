import * as React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

type Props = {
  icon: string; // MVP: emoji/icon-text; can switch to vector icons later
  onPress: () => void;
  className?: string;
  style?: ViewStyle;
};

export function IconButton({ icon, onPress, className, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={['h-10 w-10 rounded-full bg-card items-center justify-center shadow-black/5 shadow-md active:opacity-80', className ?? ''].join(' ')}
      style={style}
    >
      <Text className="text-text">{icon}</Text>
    </Pressable>
  );
}

