package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.DTO.*;
import com.transit.SGComplaint.service.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/complaints")
public class ComplaintController {
    private final ComplaintService complaintService;
    public ComplaintController(ComplaintService complaintService) { this.complaintService = complaintService; }

    @PostMapping("/{complaintNo}/verify")
    public ResponseEntity<ComplaintPasswordResponse> verify(@PathVariable Long complaintNo,
            @RequestParam String password, HttpSession session) {
        try {
            Long locked = (Long) session.getAttribute(lockKey(complaintNo));
            if (locked != null && locked > System.currentTimeMillis()) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(ComplaintPasswordResponse.failure("비밀번호 입력을 여러 번 실패했습니다. 1분 후 다시 시도해 주세요."));
            }
            if (!complaintService.verifyPublicPassword(complaintNo, password)) {
                int failures = session.getAttribute(failureKey(complaintNo)) instanceof Integer count ? count + 1 : 1;
                if (failures >= 5) {
                    session.removeAttribute(failureKey(complaintNo));
                    session.setAttribute(lockKey(complaintNo), System.currentTimeMillis() + 60_000L);
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                            .body(ComplaintPasswordResponse.failure("비밀번호 입력을 5회 실패했습니다. 1분 후 다시 시도해 주세요."));
                }
                session.setAttribute(failureKey(complaintNo), failures);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ComplaintPasswordResponse.failure("게시글 비밀번호가 일치하지 않습니다."));
            }
            session.removeAttribute(failureKey(complaintNo));
            session.removeAttribute(lockKey(complaintNo));
            session.setAttribute(verifiedKey(complaintNo), Boolean.TRUE);
            return ResponseEntity.ok(ComplaintPasswordResponse.success(complaintNo));
        } catch (ComplaintException exception) {
            return ResponseEntity.badRequest().body(ComplaintPasswordResponse.failure(exception.getMessage()));
        }
    }

    @GetMapping("/view/{complaintNo}")
    public PublicComplaintDetail detail(@PathVariable Long complaintNo, HttpSession session,
            Authentication authentication) {
        requireVerified(session, complaintNo);
        return complaintService.getPublicComplaint(complaintNo,
                authentication == null ? null : authentication.getName());
    }

    @PostMapping
    public ResponseEntity<ComplaintCreateResponse> create(Authentication authentication,
            @Valid @ModelAttribute ComplaintCreateRequest request, BindingResult errors) {
        if (errors.hasErrors()) {
            String message = errors.getFieldErrors().stream().findFirst()
                    .map(error -> error.getDefaultMessage()).orElse("입력 내용을 확인해 주세요.");
            return ResponseEntity.badRequest().body(ComplaintCreateResponse.failure(message));
        }
        try {
            return ResponseEntity.ok(ComplaintCreateResponse.success(
                    complaintService.createComplaint(authentication.getName(), request)));
        } catch (ComplaintException exception) {
            return ResponseEntity.badRequest().body(ComplaintCreateResponse.failure(exception.getMessage()));
        }
    }

    @GetMapping("/view/{complaintNo}/attachments/{attachmentNo}")
    public ResponseEntity<Resource> complaintFile(@PathVariable Long complaintNo,
            @PathVariable Long attachmentNo, HttpSession session) {
        requireVerified(session, complaintNo);
        return download(complaintService.getPublicComplaintAttachment(complaintNo, attachmentNo));
    }
    @GetMapping("/view/{complaintNo}/answer-attachments/{attachmentNo}")
    public ResponseEntity<Resource> answerFile(@PathVariable Long complaintNo,
            @PathVariable Long attachmentNo, HttpSession session) {
        requireVerified(session, complaintNo);
        return download(complaintService.getPublicComplaintAnswerAttachment(complaintNo, attachmentNo));
    }
    @GetMapping("/answer-attachments/{attachmentNo}")
    public ResponseEntity<Resource> memberAnswerFile(Authentication authentication, @PathVariable Long attachmentNo) {
        return download(complaintService.getMemberAnswerAttachment(authentication.getName(), attachmentNo));
    }

    private void requireVerified(HttpSession session, Long no) {
        if (!Boolean.TRUE.equals(session.getAttribute(verifiedKey(no)))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "게시글 비밀번호 확인이 필요합니다.");
        }
    }
    private String verifiedKey(Long no) { return "verifiedComplaint:" + no; }
    private String failureKey(Long no) { return "complaintPasswordFailures:" + no; }
    private String lockKey(Long no) { return "complaintPasswordLockedUntil:" + no; }
    private ResponseEntity<Resource> download(StoredAttachment attachment) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(attachment.originalName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(attachment.path()));
    }
}
