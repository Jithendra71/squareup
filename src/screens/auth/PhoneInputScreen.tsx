import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

type PhoneInputScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'PhoneInput'>;
};

const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be 10 digits')
    .max(10, 'Phone number must be 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ navigation }) => {
  const { sendOTP, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: PhoneFormData) => {
    try {
      await sendOTP(data.phoneNumber);
      navigation.navigate('OtpVerification', { phoneNumber: data.phoneNumber });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome to SquareUp
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter your phone number to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <TextInput
                    label="Phone Number"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="phone-pad"
                    maxLength={10}
                    error={!!errors.phoneNumber}
                    style={styles.phoneInput}
                    left={<TextInput.Icon icon="phone" />}
                  />
                </>
              )}
            />
          </View>
          {errors.phoneNumber && (
            <HelperText type="error">{errors.phoneNumber.message}</HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Send OTP
          </Button>

          <Text variant="bodySmall" style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 10,
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  disclaimer: {
    textAlign: 'center',
    color: COLORS.dark,
    opacity: 0.5,
    marginTop: 16,
  },
});
