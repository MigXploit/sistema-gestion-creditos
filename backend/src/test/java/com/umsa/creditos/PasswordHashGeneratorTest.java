package com.umsa.creditos;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class PasswordHashGeneratorTest {

    @Test
    void testBcryptHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "Bancario2026!";
        String hash = encoder.encode(rawPassword);
        System.out.println("BCRYPT_HASH_GENERATED: " + hash);
        assertTrue(encoder.matches(rawPassword, hash));
    }
}
