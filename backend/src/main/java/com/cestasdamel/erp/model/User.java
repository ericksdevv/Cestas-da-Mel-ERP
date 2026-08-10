package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor
public class User extends BaseEntity {
 @Column(nullable=false) private String name;
 @Column(nullable=false,unique=true) private String email;
 @Column(name="password_hash",nullable=false) private String passwordHash;
 @Column(nullable=false) private boolean active=true;
}
