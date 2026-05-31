package com.tucapstone.backend.service;

import com.tucapstone.backend.dto.response.PrincipalUser;
import com.tucapstone.backend.dto.response.UserResponse;
import com.tucapstone.backend.entity.User;
import com.tucapstone.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String providerId = (String) attributes.get("sub");

        User userEntity = saveOrUpdate(email, name, picture, registrationId, providerId);
        
        UserResponse userResponse = UserResponse.builder()
                .id(userEntity.getId())
                .email(userEntity.getEmail())
                .name(userEntity.getName())
                .picture(userEntity.getPicture())
                .role(userEntity.getRole())
                .build();

        return new PrincipalUser(userResponse, attributes, userNameAttributeName);
    }

    private User saveOrUpdate(String email, String name, String picture, String provider, String providerId) {
        return userRepository.findByEmail(email)
                .map(entity -> {
                    entity.setName(name);
                    entity.setPicture(picture);
                    entity.setProvider(provider);
                    entity.setProviderId(providerId);
                    return userRepository.save(entity);
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .picture(picture)
                            .provider(provider)
                            .providerId(providerId)
                            .role("ROLE_USER")
                            .build();
                    return userRepository.save(newUser);
                });
    }
}