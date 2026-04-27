import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  contentClassName?: string;
};

export function AppSheet({
  visible,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  showCloseButton = true,
  contentClassName,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/45 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className={[
            'rounded-t-[32px] border-t border-elevated bg-card px-5 pt-4 pb-7 shadow-black/15 shadow-2xl',
            contentClassName ?? '',
          ].join(' ')}
          style={{ maxHeight: '92%' }}
        >
          <View className="items-center">
            <View className="h-1.5 w-14 rounded-full bg-elevated" />
          </View>

          {(title || eyebrow || showCloseButton) ? (
            <View className="mt-4 flex-row items-start justify-between gap-3">
              <View className="flex-1">
                {eyebrow ? <Text className="text-muted text-[11px] font-extrabold uppercase tracking-[1px]">{eyebrow}</Text> : null}
                {title ? <Text className="text-text mt-1 text-xl font-extrabold">{title}</Text> : null}
              </View>

              {showCloseButton ? (
                <Pressable
                  onPress={onClose}
                  className="h-10 w-10 -mr-2 -mt-1 items-center justify-center rounded-2xl active:opacity-70"
                >
                  <AppIcon name="close" size={20} color="#A9ADB2" />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>

          {footer ? <View className="mt-5">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
