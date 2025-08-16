import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

// Signup events
class SignupRequested extends AuthEvent {
  final String email;

  const SignupRequested(this.email);

  @override
  List<Object?> get props => [email];
}

class SetPasswordRequested extends AuthEvent {
  final String email;
  final String password;
  final String confirmPassword;

  const SetPasswordRequested({
    required this.email,
    required this.password,
    required this.confirmPassword,
  });

  @override
  List<Object?> get props => [email, password, confirmPassword];
}

// Login events
class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

// OTP verification events
class OtpVerificationRequested extends AuthEvent {
  final String email;
  final String otp;

  const OtpVerificationRequested({
    required this.email,
    required this.otp,
  });

  @override
  List<Object?> get props => [email, otp];
}

// Google authentication events
class GoogleAuthRequested extends AuthEvent {
  final String idToken;

  const GoogleAuthRequested(this.idToken);

  @override
  List<Object?> get props => [idToken];
}

// Password reset events
class PasswordResetRequested extends AuthEvent {
  final String email;

  const PasswordResetRequested(this.email);

  @override
  List<Object?> get props => [email];
}

class PasswordResetConfirmed extends AuthEvent {
  final String email;
  final String token;
  final String password;
  final String confirmPassword;

  const PasswordResetConfirmed({
    required this.email,
    required this.token,
    required this.password,
    required this.confirmPassword,
  });

  @override
  List<Object?> get props => [email, token, password, confirmPassword];
}

// User management events
class GetCurrentUserRequested extends AuthEvent {}

class LogoutRequested extends AuthEvent {}

// Check authentication status
class CheckAuthStatus extends AuthEvent {}
