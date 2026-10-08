package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.DTO.StoredAttachment;
import com.transit.SGComplaint.service.AdminComplaintService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/admin")
public class AdminFileController {
    private final AdminComplaintService service;
    public AdminFileController(AdminComplaintService service) { this.service = service; }
    @GetMapping("/complaints/attachments/{attachmentNo}")
    public ResponseEntity<Resource> complaint(@PathVariable(name = "attachmentNo") Long attachmentNo) {
        return download(service.getComplaintAttachment(attachmentNo));
    }
    @GetMapping("/answers/attachments/{attachmentNo}")
    public ResponseEntity<Resource> answer(@PathVariable(name = "attachmentNo") Long attachmentNo) {
        return download(service.getAnswerAttachment(attachmentNo));
    }
    private ResponseEntity<Resource> download(StoredAttachment attachment) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(attachment.originalName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(new FileSystemResource(attachment.path()));
    }
}
