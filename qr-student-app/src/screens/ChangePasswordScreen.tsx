import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, Button, Card, Snackbar, useTheme } from 'react-native-paper';
import ScreenContainer from '../components/common/ScreenContainer';
import { users } from '../services/api';

const ChangePasswordScreen = () => {
	const { colors } = useTheme();

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [isCurrentPasswordSecure, setIsCurrentPasswordSecure] = useState(true);
	const [isNewPasswordSecure, setIsNewPasswordSecure] = useState(true);

	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState('');
	const [error, setError] = useState('');

	const handleChangePassword = async () => {
		setError('');
		setSuccess('');

		if (!currentPassword || !newPassword || !confirmPassword) {
			setError('Please fill out all fields.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('New password do not match.');
			return;
		}
		if (newPassword.length < 6) {
			setError('New password must be at least 6 characters long.');
			return;
		}

		setLoading(true);
		try {
			const response = await users.changePassword({ currentPassword, newPassword });
			setSuccess(response.message || 'Password changed successfully!');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			// Optionally navigate back after a delay
			// setTimeout(() => navigation.goBack(), 2000);
		} catch (err: any) {
			setError(err.message || 'Failed to change password.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScreenContainer>
			<View style={styles.container}>
				<Text style={styles.title}>Update Your Password</Text>
				<Card style={styles.card}>
					<Card.Content>
						<TextInput
							label="Current Password"
							value={currentPassword}
							onChangeText={setCurrentPassword}
							secureTextEntry={isCurrentPasswordSecure}
							mode="outlined"
							style={styles.input}
							disabled={loading}
							left={<TextInput.Icon icon="lock-check-outline" />}
							right={
								<TextInput.Icon 
									icon={isCurrentPasswordSecure ? 'eye-off' : 'eye'} 
									onPress={() => setIsCurrentPasswordSecure(!isCurrentPasswordSecure)}
								/>
							}
						/>
						<TextInput
							label="New Password"
							value={newPassword}
							onChangeText={setNewPassword}
							secureTextEntry={isNewPasswordSecure}
							mode="outlined"
							style={styles.input}
							disabled={loading}
							left={<TextInput.Icon icon="lock-outline" />}
							right={
								<TextInput.Icon 
									icon={isNewPasswordSecure ? 'eye-off' : 'eye'} 
									onPress={() => setIsNewPasswordSecure(!isNewPasswordSecure)}
								/>
							}
						/>
						<TextInput
							label="Confirm New Password"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry={isNewPasswordSecure}
							mode="outlined"
							style={styles.input}
							disabled={loading}
							left={<TextInput.Icon icon="lock-outline" />}
						/>
						<Button
							mode="contained"
							onPress={handleChangePassword}
							loading={loading}
							disabled={loading}
							style={styles.button}
							contentStyle={styles.buttonContent}
						>
							Update Password
						</Button>
					</Card.Content>
				</Card>
			</View>
			<Snackbar
				visible={!!error}
				onDismiss={() => setError('')}
				duration={4000}
				style={{ backgroundColor: colors.error }}
			>
				{error}
			</Snackbar>
			<Snackbar
				visible={!!success}
				onDismiss={() => setSuccess('')}
				duration={4000}
				style={{ backgroundColor: colors.primary }}
			>
				{success}
			</Snackbar>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 24,
	},
	card: {
		padding: 8,
	},
	input: {
		marginBottom: 16,
	},
	button: {
		marginTop: 10,
		paddingVertical: 4,
	},
	buttonContent: {
		height: 40,
	},
});

export default ChangePasswordScreen;
