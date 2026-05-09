package com.tucapstone.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class TuCapStoneApplicationTests {

    private static final Pattern JSON_STRING_FIELD = Pattern.compile("\\\"([a-zA-Z0-9]+)\\\":\\\"([^\\\"]+)\\\"");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointReturnsSharedContractShape() throws Exception {
        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.service").value("orchestrator"))
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.version").value("dev-scaffold"));
    }

    @Test
    void preflightRequestAllowsLocalFrontendOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/sessions")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String allowedOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
                if (!"http://localhost:3000".equals(allowedOrigin)) {
                    throw new IllegalStateException("unexpected Access-Control-Allow-Origin: " + allowedOrigin);
                }
            });
    }

    @Test
    void jobRequestRequiresRegisteredAudioObject() throws Exception {
        MvcResult sessionResult = mockMvc.perform(post("/api/v1/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"source":"web"}
                    """))
            .andExpect(status().isOk())
            .andReturn();

        String sessionId = readField(sessionResult, "sessionId");

        mockMvc.perform(post("/api/v1/sessions/{sessionId}/jobs", sessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"objectKey":"sessions/other/audio/test.wav"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void stubFlowCreatesSessionAndReturnsJobResult() throws Exception {
        MvcResult sessionResult = mockMvc.perform(post("/api/v1/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"source":"web"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("created"))
            .andReturn();

        String sessionId = readField(sessionResult, "sessionId");

        MvcResult audioResult = mockMvc.perform(post("/api/v1/sessions/{sessionId}/audio-objects", sessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fileName": "lecture-01.wav",
                      "contentType": "audio/wav",
                      "sizeBytes": 245760
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("registered"))
            .andExpect(jsonPath("$.contentType").value("audio/wav"))
            .andReturn();

        String objectKey = readField(audioResult, "objectKey");

        MvcResult jobResult = mockMvc.perform(post("/api/v1/sessions/{sessionId}/jobs", sessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"objectKey":"%s"}
                    """.formatted(objectKey)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.workerService").value("agent-worker"))
            .andReturn();

        String jobId = readField(jobResult, "jobId");

        mockMvc.perform(get("/api/v1/jobs/{jobId}", jobId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").value(jobId))
            .andExpect(jsonPath("$.objectKey").value(objectKey))
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.metadata.mode").value("stub"));
    }

    private String readField(MvcResult result, String fieldName) throws Exception {
        String body = result.getResponse().getContentAsString();
        Matcher matcher = JSON_STRING_FIELD.matcher(body);
        while (matcher.find()) {
            if (fieldName.equals(matcher.group(1))) {
                return matcher.group(2);
            }
        }
        throw new IllegalStateException("field not found: " + fieldName + " in " + body);
    }
}
