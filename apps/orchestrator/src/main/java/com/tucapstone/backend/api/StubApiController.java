package com.tucapstone.backend.api;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
public class StubApiController {

    private static final String WORKER_SERVICE_NAME = "agent-worker";
    private static final String MOCK_TRANSCRIPT = "이 응답은 개발용 초기 스캐폴딩에서 반환하는 mock transcript 입니다.";

    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();
    private final Map<String, JobState> jobs = new ConcurrentHashMap<>();

    @PostMapping("/sessions")
    public CreateSessionResponse createSession(@RequestBody(required = false) CreateSessionRequest request) {
        String sessionId = newId("ses");
        String createdAt = Instant.now().toString();
        String source = request != null && request.source() != null && !request.source().isBlank()
            ? request.source()
            : "web";
        SessionState session = new SessionState(sessionId, createdAt, source);
        sessions.put(sessionId, session);

        return new CreateSessionResponse(sessionId, "created", createdAt, session.source(), "/api/v1/sessions/" + sessionId + "/audio-objects");
    }

    @PostMapping("/sessions/{sessionId}/audio-objects")
    public RegisterAudioResponse registerAudioObject(
        @PathVariable String sessionId,
        @RequestBody RegisterAudioRequest request
    ) {
        SessionState session = requireSession(sessionId);
        String fileName = request != null && request.fileName() != null && !request.fileName().isBlank()
            ? request.fileName()
            : "audio.wav";
        String objectKey = request != null && request.objectKey() != null && !request.objectKey().isBlank()
            ? request.objectKey()
            : "sessions/" + sessionId + "/audio/" + Instant.now().toEpochMilli() + "-" + normalizeFileName(fileName);
        long sizeBytes = request != null && request.sizeBytes() != null ? request.sizeBytes() : 0L;
        String contentType = request != null && request.contentType() != null ? request.contentType() : "audio/wav";

        sessions.put(sessionId, session.withObjectKey(objectKey));

        return new RegisterAudioResponse(sessionId, objectKey, "registered", contentType, sizeBytes);
    }

    @PostMapping("/sessions/{sessionId}/jobs")
    public CreateJobResponse createJob(
        @PathVariable String sessionId,
        @RequestBody CreateJobRequest request
    ) {
        SessionState session = requireSession(sessionId);
        String registeredObjectKey = session.objectKey();
        String requestedObjectKey = request != null ? request.objectKey() : null;

        if (registeredObjectKey == null || registeredObjectKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "audio object must be registered before requesting a job");
        }

        if (requestedObjectKey != null && !requestedObjectKey.isBlank() && !registeredObjectKey.equals(requestedObjectKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requested objectKey must match the registered session objectKey");
        }

        String objectKey = registeredObjectKey;
        String jobId = newId("job");
        JobState job = new JobState(
            jobId,
            sessionId,
            objectKey,
            "completed",
            WORKER_SERVICE_NAME,
            MOCK_TRANSCRIPT,
            Instant.now().toString()
        );
        jobs.put(jobId, job);

        return new CreateJobResponse(jobId, sessionId, objectKey, job.status(), job.workerService(), "/api/v1/jobs/" + jobId);
    }

    @GetMapping("/jobs/{jobId}")
    public JobStatusResponse getJob(@PathVariable String jobId) {
        JobState job = jobs.get(jobId);
        if (job == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "job not found");
        }

        return new JobStatusResponse(
            job.jobId(),
            job.sessionId(),
            job.objectKey(),
            job.status(),
            job.workerService(),
            job.transcript(),
            job.completedAt(),
            Map.of("mode", "stub")
        );
    }

    private SessionState requireSession(String sessionId) {
        SessionState session = sessions.get(sessionId);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "session not found");
        }
        return session;
    }

    private String newId(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String normalizeFileName(String value) {
        return value.replaceAll("[^a-zA-Z0-9._-]", "-");
    }

    public record CreateSessionRequest(String source) {
    }

    public record CreateSessionResponse(
        String sessionId,
        String status,
        String createdAt,
        String source,
        String nextUploadPath
    ) {
    }

    public record RegisterAudioRequest(
        String objectKey,
        String fileName,
        String contentType,
        Long sizeBytes
    ) {
    }

    public record RegisterAudioResponse(
        String sessionId,
        String objectKey,
        String status,
        String contentType,
        Long sizeBytes
    ) {
    }

    public record CreateJobRequest(String objectKey) {
    }

    public record CreateJobResponse(
        String jobId,
        String sessionId,
        String objectKey,
        String status,
        String workerService,
        String pollPath
    ) {
    }

    public record JobStatusResponse(
        String jobId,
        String sessionId,
        String objectKey,
        String status,
        String workerService,
        String transcript,
        String completedAt,
        Map<String, String> metadata
    ) {
    }

    private record SessionState(
        String sessionId,
        String createdAt,
        String source,
        String objectKey
    ) {
        private SessionState(String sessionId, String createdAt, String source) {
            this(sessionId, createdAt, source, null);
        }

        private SessionState withObjectKey(String objectKey) {
            return new SessionState(sessionId, createdAt, source, objectKey);
        }
    }

    private record JobState(
        String jobId,
        String sessionId,
        String objectKey,
        String status,
        String workerService,
        String transcript,
        String completedAt
    ) {
    }
}
