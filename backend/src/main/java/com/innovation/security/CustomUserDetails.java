package com.innovation.security;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.innovation.entity.Usuario;

public class CustomUserDetails implements UserDetails {

	private static final long serialVersionUID = 1L;
	
	private Usuario usuario;

	public CustomUserDetails(Usuario usuario) {
		this.usuario = usuario;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		Collection<GrantedAuthority> authorities = new ArrayList<>();
		String rol = usuario.getRol();
		if (rol != null) {
			authorities.add(new SimpleGrantedAuthority("ROLE_" + rol));
		}
		return authorities;
	}

	@Override
	public String getPassword() {
		return usuario.getContrasena();
	}

	@Override
	public String getUsername() {
		return usuario.getEmail();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return usuario.getActivo();
	}

	public Usuario getUsuario() {
		return usuario;
	}
}
