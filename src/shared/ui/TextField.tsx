import * as React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label?: string;
};

export function TextField({ label, className, ...rest }: Props) {
  return (
    <View className="w-full">
      {label ? <Text className="text-muted mb-2 text-xs">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#8B919A"
        className={[
          'w-full rounded-2xl border border-elevated bg-card px-4 py-3 text-text',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
    </View>
  );
}

