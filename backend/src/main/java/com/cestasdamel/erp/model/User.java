package com.cestasdamel.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User extends BaseEntity {
    @Column(nullable = false) private String name;
    @Column(nullable = false, unique = true) private String username;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Enums.UserRole role = Enums.UserRole.ADMIN;
    @Column(nullable = false) private boolean active = true;
}
