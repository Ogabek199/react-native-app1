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
        placeholderTextColor="#7f8bb7"
        className={[
          'w-full rounded-2xl border border-white/10 bg-card px-4 py-3 text-text',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
    </View>
  );
}

