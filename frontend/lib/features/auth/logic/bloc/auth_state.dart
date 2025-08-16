import 'package:equatable/equatable.dart';

import '../../data/models/user_model.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

// Initial state
class AuthInitial extends AuthState {}

// Loading states
class AuthLoading extends AuthState {}

class SignupLoading extends AuthState {}

class OtpVerificationLoading extends AuthState {}

class SetPasswordLoading extends AuthState {}

class LoginLoading extends AuthState {}

class GoogleAuthLoading extends AuthState {}

class PasswordResetLoading extends AuthState {}

// Success states
class SignupSuccess extends AuthState {
  final String message;
  final String userId;
  final bool requiresOtp;

  const SignupSuccess({
    required this.message,
    required this.userId,
    required this.requiresOtp,
  });

  @override
  List<Object?> get props => [message, userId, requiresOtp];
}

class OtpVerificationSuccess extends AuthState {
  final String message;
  final String userId;
  final String email;
  final bool requiresPassword;

  const OtpVerificationSuccess({
    required this.message,
    required this.userId,
    required this.email,
    required this.requiresPassword,
  });

  @override
  List<Object?> get props => [message, userId, email, requiresPassword];
}

class SetPasswordSuccess extends AuthState {
  final String message;
  final String userId;

  const SetPasswordSuccess({
    required this.message,
    required this.userId,
  });

  @override
  List<Object?> get props => [message, userId];
}

class LoginSuccess extends AuthState {
  final String token;
  final UserModel user;

  const LoginSuccess({
    required this.token,
    required this.user,
  });

  @override
  List<Object?> get props => [token, user];
}

class GoogleAuthSuccess extends AuthState {
  final String token;
  final UserModel user;

  const GoogleAuthSuccess({
    required this.token,
    required this.user,
  });

  @override
  List<Object?> get props => [token, user];
}

class PasswordResetSuccess extends AuthState {
  final String message;

  const PasswordResetSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class LogoutSuccess extends AuthState {}

// Error states
class AuthError extends AuthState {
  final String message;

  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

// Authentication status states
class Authenticated extends AuthState {
  final UserModel user;
  final String token;

  const Authenticated({
    required this.user,
    required this.token,
  });

  @override
  List<Object?> get props => [user, token];
}

class Unauthenticated extends AuthState {}

// Special states for specific flows
class OtpRequired extends AuthState {
  final String email;
  final String userId;

  const OtpRequired({
    required this.email,
    required this.userId,
  });

  @override
  List<Object?> get props => [email, userId];
}

class PasswordRequired extends AuthState {
  final String email;
  final String userId;

  const PasswordRequired({
    required this.email,
    required this.userId,
  });

  @override
  List<Object?> get props => [email, userId];
}
