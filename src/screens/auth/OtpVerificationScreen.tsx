import React from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';

type OtpVerificationScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'OtpVerification'>;
  route: RouteProp<AuthStackParamList, 'OtpVerification'>;
};

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits'),
});

type OtpFormData = z.infer<typeof otpSchema>;

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  navigation,
  route
}) => {
  const { phoneNumber } = route.params;
  const { verifyOTP, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      const result = await verifyOTP(data.otp);

      if (result.needsProfileSetup) {
        // Navigate to profile setup
        navigation.navigate('ProfileSetup', {
          userId: result.userId,
          phoneNumber: result.phoneNumber
        });
      }
      // If profile exists, the auth state will update and user will be redirected automatically
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
            Verify OTP
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}+91 {phoneNumber}
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="OTP Code"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
                maxLength={6}
                error={!!errors.otp}
                style={styles.otpInput}
                left={<TextInput.Icon icon="shield-lock" />}
              />
            )}
          />
          {errors.otp && (
            <HelperText type="error">{errors.otp.message}</HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Verify OTP
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.backButton}
          >
            Change Phone Number
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
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  backButton: {
    marginTop: 8,
  },
});
