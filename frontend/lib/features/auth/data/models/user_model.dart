import 'package:equatable/equatable.dart';

class UserModel extends Equatable {
  final String id;
  final String email;
  final String? profilePicture;
  final String? role;
  final bool isVerified;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<AccountModel> accounts;

  const UserModel({
    required this.id,
    required this.email,
    this.profilePicture,
    this.role,
    required this.isVerified,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.accounts = const [],
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      profilePicture: json['profilePicture'] as String?,
      role: json['role'] as String?,
      isVerified: json['isVerified'] as bool? ?? true, // Default to true if not provided
      isActive: json['isActive'] as bool? ?? true, // Default to true if not provided
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(), // Default to current time if not provided
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(), // Default to current time if not provided
      accounts: (json['accounts'] as List<dynamic>?)
          ?.map((account) => AccountModel.fromJson(account as Map<String, dynamic>))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'profilePicture': profilePicture,
      'role': role,
      'isVerified': isVerified,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'accounts': accounts.map((account) => account.toJson()).toList(),
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? profilePicture,
    String? role,
    bool? isVerified,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<AccountModel>? accounts,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      profilePicture: profilePicture ?? this.profilePicture,
      role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      accounts: accounts ?? this.accounts,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        profilePicture,
        role,
        isVerified,
        isActive,
        createdAt,
        updatedAt,
        accounts,
      ];
}

class AccountModel extends Equatable {
  final String provider;
  final String providerAccountId;

  const AccountModel({
    required this.provider,
    required this.providerAccountId,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    return AccountModel(
      provider: json['provider'] as String,
      providerAccountId: json['providerAccountId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'provider': provider,
      'providerAccountId': providerAccountId,
    };
  }

  @override
  List<Object?> get props => [provider, providerAccountId];
}
