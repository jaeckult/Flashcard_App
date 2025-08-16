import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;

  AuthBloc(this._authRepository) : super(AuthInitial()) {
    // Check authentication status on initialization
    on<CheckAuthStatus>(_onCheckAuthStatus);
    
    // Signup events
    on<SignupRequested>(_onSignupRequested);
    on<SetPasswordRequested>(_onSetPasswordRequested);
    
    // Login events
    on<LoginRequested>(_onLoginRequested);
    
    // OTP verification events
    on<OtpVerificationRequested>(_onOtpVerificationRequested);
    
    // Google authentication events
    on<GoogleAuthRequested>(_onGoogleAuthRequested);
    
    // Password reset events
    on<PasswordResetRequested>(_onPasswordResetRequested);
    on<PasswordResetConfirmed>(_onPasswordResetConfirmed);
    
    // User management events
    on<GetCurrentUserRequested>(_onGetCurrentUserRequested);
    on<LogoutRequested>(_onLogoutRequested);
  }

  // Check authentication status
  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    try {
      if (_authRepository.isAuthenticated) {
        final user = await _authRepository.getCurrentUser();
        emit(Authenticated(
          user: user,
          token: _authRepository.token!,
        ));
      } else {
        emit(Unauthenticated());
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Signup with email
  Future<void> _onSignupRequested(
    SignupRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(SignupLoading());
      
      final response = await _authRepository.signup(event.email);
      
      emit(SignupSuccess(
        message: response['message'] ?? 'Signup successful',
        userId: response['id'] ?? '',
        requiresOtp: response['requiresOtp'] ?? false,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Set password after email verification
  Future<void> _onSetPasswordRequested(
    SetPasswordRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(SetPasswordLoading());
      
      final response = await _authRepository.setPassword(
        email: event.email,
        password: event.password,
        confirmPassword: event.confirmPassword,
      );
      
      emit(SetPasswordSuccess(
        message: response['message'] ?? 'Password set successfully',
        userId: response['userId'] ?? '',
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Login with email and password
  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(LoginLoading());
      
      final response = await _authRepository.login(
        email: event.email,
        password: event.password,
      );
      
      if (response.containsKey('token') && response.containsKey('user')) {
        final user = response['user'];
        emit(LoginSuccess(
          token: response['token'],
          user: user,
        ));
      } else {
        emit(AuthError('Invalid response from server'));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Verify OTP
  Future<void> _onOtpVerificationRequested(
    OtpVerificationRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(OtpVerificationLoading());
      
      final response = await _authRepository.verifyOtp(
        email: event.email,
        otp: event.otp,
      );
      
      emit(OtpVerificationSuccess(
        message: response['message'] ?? 'OTP verified successfully',
        userId: response['userId'] ?? '',
        email: response['email'] ?? event.email,
        requiresPassword: response['requiresPassword'] ?? false,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Google authentication
  Future<void> _onGoogleAuthRequested(
    GoogleAuthRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(GoogleAuthLoading());
      
      final response = await _authRepository.googleAuth(event.idToken);
      
      if (response.containsKey('token') && response.containsKey('user')) {
        final user = response['user'];
        emit(GoogleAuthSuccess(
          token: response['token'],
          user: user,
        ));
      } else {
        emit(AuthError('Invalid response from Google authentication'));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Request password reset
  Future<void> _onPasswordResetRequested(
    PasswordResetRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(PasswordResetLoading());
      
      final response = await _authRepository.requestPasswordReset(event.email);
      
      emit(PasswordResetSuccess(
        response['message'] ?? 'Password reset email sent',
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Confirm password reset
  Future<void> _onPasswordResetConfirmed(
    PasswordResetConfirmed event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(PasswordResetLoading());
      
      final response = await _authRepository.resetPassword(
        email: event.email,
        token: event.token,
        password: event.password,
        confirmPassword: event.confirmPassword,
      );
      
      emit(PasswordResetSuccess(
        response['message'] ?? 'Password reset successfully',
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Get current user
  Future<void> _onGetCurrentUserRequested(
    GetCurrentUserRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      
      final user = await _authRepository.getCurrentUser();
      
      emit(Authenticated(
        user: user,
        token: _authRepository.token!,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // Logout
  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      
      await _authRepository.logout();
      
      emit(LogoutSuccess());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
}
