import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  iconName?: React.ComponentProps<typeof AppIcon>['name'];
  tone?: 'default' | 'danger';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  dismissOnBackdropPress?: boolean;
  contentClassName?: string;
};

export function AppDialog({
  visible,
  onClose,
  title,
  description,
  iconName,
  tone = 'default',
  children,
  footer,
  showCloseButton = true,
  dismissOnBackdropPress = true,
  contentClassName,
}: Props) {
  const iconBg = tone === 'danger' ? '#FDEAEA' : '#F3EEEB';
  const iconColor = tone === 'danger' ? '#E04E4E' : '#6B6F75';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={dismissOnBackdropPress ? onClose : undefined}
        className="flex-1 bg-black/45 justify-center px-6"
      >
        <Pressable
          onPress={() => {}}
          className={[
            'w-full rounded-[28px] border border-elevated bg-card px-5 py-5 shadow-black/15 shadow-2xl',
            contentClassName ?? '',
          ].join(' ')}
          style={{ maxHeight: '88%' }}
        >
          {(iconName || title || showCloseButton) ? (
            <View className="mb-4 flex-row items-start gap-3">
              {iconName ? (
                <View
                  className="h-12 w-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: iconBg }}
                >
                  <AppIcon name={iconName} size={22} color={iconColor} />
                </View>
              ) : null}

              <View className="flex-1 pt-1">
                {title ? <Text className="text-text text-lg font-extrabold">{title}</Text> : null}
                {description ? <Text className="text-text2 mt-1 leading-5">{description}</Text> : null}
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

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>

          {footer ? <View className="mt-5">{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
