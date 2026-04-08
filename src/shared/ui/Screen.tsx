import * as React from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function Screen({ style, children, ...rest }: Props) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-page px-5 pt-2"
      style={style}
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
}

