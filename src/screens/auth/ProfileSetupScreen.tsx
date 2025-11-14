import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TextInput, Button, Text, HelperText, Avatar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';

type ProfileSetupScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
  route: RouteProp<AuthStackParamList, 'ProfileSetup'>;
};

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
  route
}) => {
  const { userId, phoneNumber } = route.params;
  const { completeProfile, isLoading } = useAuth();
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await completeProfile(userId, phoneNumber, data.displayName, photoURL);
      // Auth state will update and user will be redirected automatically
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleImagePick = () => {
    // TODO: Implement image picker functionality in a future phase
    Alert.alert('Coming Soon', 'Photo upload will be available soon!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Setup Your Profile
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Tell us a bit about yourself
          </Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            onPress={handleImagePick}
            style={styles.avatarContainer}
          >
            {photoURL ? (
              <Avatar.Image size={100} source={{ uri: photoURL }} />
            ) : (
              <Avatar.Icon size={100} icon="account" />
            )}
            <Text variant="bodySmall" style={styles.avatarLabel}>
              Tap to add photo
            </Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Display Name"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.displayName}
                style={styles.input}
                left={<TextInput.Icon icon="account-circle" />}
              />
            )}
          />
          {errors.displayName && (
            <HelperText type="error">{errors.displayName.message}</HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Complete Setup
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.dark,
    opacity: 0.6,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLabel: {
    marginTop: 8,
    color: COLORS.primary,
  },
  input: {
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
