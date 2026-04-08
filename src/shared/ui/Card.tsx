import * as React from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function Card({ children, className, ...rest }: Props & { className?: string }) {
  return (
    <View
      className={[
        'rounded-2xl bg-card p-4',
        // Soft, warm elevation
        'shadow-black/5 shadow-lg',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
}

