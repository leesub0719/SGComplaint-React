package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.DTO.StoredAttachment;
import com.transit.SGComplaint.service.NoticeException;
import com.transit.SGComplaint.service.NoticeService;
import com.transit.SGComplaint.service.UploadValidation;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/notices/images")
public class NoticeImageController {
    private final NoticeService noticeService;
    public NoticeImageController(NoticeService noticeService) { this.noticeService = noticeService; }

    @GetMapping("/{noticeImageNo}")
    public ResponseEntity<Resource> image(@PathVariable Long noticeImageNo) {
        try {
            StoredAttachment image = noticeService.getNoticeImage(noticeImageNo);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(UploadValidation.imageContentType(image.path().getFileName().toString())))
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                            .filename(image.originalName(), StandardCharsets.UTF_8).build().toString())
                    .header("X-Content-Type-Options", "nosniff")
                    .body(new FileSystemResource(image.path()));
        } catch (NoticeException | IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항 이미지를 찾을 수 없습니다.", exception);
        }
    }
}
