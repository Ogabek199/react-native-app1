import * as React from 'react';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const bg = selected ? 'bg-accent' : 'bg-elevated';
  const text = selected ? 'text-text' : 'text-text2';

  return (
    <Pressable
      onPress={onPress}
      className={[
        'px-4 py-2 rounded-full',
        bg,
        'active:opacity-80',
        !onPress ? 'opacity-60' : '',
      ].join(' ')}
      disabled={!onPress}
    >
      <Text className={['text-sm font-semibold', text].join(' ')}>{label}</Text>
    </Pressable>
  );
}

