import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 22, color = '#111217' }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}

