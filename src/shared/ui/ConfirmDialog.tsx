import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppDialog } from './AppDialog';
import { AppIcon } from './AppIcon';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  tone?: 'default' | 'danger';
  iconName?: React.ComponentProps<typeof AppIcon>['name'];
};

export function ConfirmDialog({
  visible,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = 'default',
  iconName = tone === 'danger' ? 'warning-outline' : 'help-circle-outline',
}: Props) {
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  const handleConfirm = React.useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }, [busy, onClose, onConfirm]);

  return (
    <AppDialog
      visible={visible}
      onClose={busy ? () => {} : onClose}
      title={title}
      description={description}
      tone={tone}
      iconName={iconName}
      dismissOnBackdropPress={!busy}
      footer={(
        <View className="flex-row gap-3">
          <Pressable
            disabled={busy}
            onPress={onClose}
            className={[
              'flex-1 rounded-2xl border border-elevated bg-elevated py-3 items-center',
              busy ? 'opacity-50' : 'active:opacity-85',
            ].join(' ')}
          >
            <Text className="text-text font-bold">{cancelLabel}</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => {
              void handleConfirm();
            }}
            className={[
              'flex-1 rounded-2xl py-3 items-center',
              tone === 'danger' ? 'bg-danger' : 'bg-accent',
              busy ? 'opacity-50' : 'active:opacity-85',
            ].join(' ')}
          >
            <Text className={tone === 'danger' ? 'text-white font-bold' : 'text-text font-bold'}>
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}
