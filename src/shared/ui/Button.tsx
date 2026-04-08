import * as React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  className,
  style,
  disabled,
}: Props) {
  const base =
    variant === 'primary'
      ? 'bg-accent'
      : 'bg-elevated';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={[
        'rounded-2xl px-4 py-3 items-center justify-center',
        base,
        disabled ? 'opacity-50' : 'active:opacity-80',
        className ?? '',
      ].join(' ')}
      style={style}
    >
      <Text
        className={[
          'font-semibold',
          variant === 'primary' ? 'text-text' : 'text-text',
        ].join(' ')}
      >
        {title}
      </Text>
    </Pressable>
  );
}

