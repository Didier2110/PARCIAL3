package com.innovation.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

	@Value("${app.jwtSecret:mySecretKeyForInnovationTelecomunicacionesProjectWithMoreThanThirtyTwoCharacters}")
	private String jwtSecret;

	@Value("${app.jwtExpirationMs:86400000}")
	private long jwtExpirationMs;

	public String generateToken(String email) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

		return Jwts.builder()
				.subject(email)
				.issuedAt(now)
				.expiration(expiryDate)
				.signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
				.compact();
	}

	public String getEmailFromToken(String token) {
		Claims claims = Jwts.parser()
				.verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
				.build()
				.parseSignedClaims(token)
				.getPayload();

		return claims.getSubject();
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser()
					.verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
					.build()
					.parseSignedClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}
}
