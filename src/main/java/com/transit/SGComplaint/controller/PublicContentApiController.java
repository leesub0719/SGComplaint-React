package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.DTO.*;
import com.transit.SGComplaint.service.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PublicContentApiController {
    private final MainBannerService bannerService;
    private final NoticeService noticeService;
    private final RouteOperationService routeService;
    private final DdokBusGuideImageService imageService;

    public PublicContentApiController(MainBannerService bannerService, NoticeService noticeService,
            RouteOperationService routeService, DdokBusGuideImageService imageService) {
        this.bannerService = bannerService;
        this.noticeService = noticeService;
        this.routeService = routeService;
        this.imageService = imageService;
    }

    @GetMapping("/home")
    public HomeResponse home() {
        return new HomeResponse(bannerService.getBanners(), noticeService.getMainNotices(),
                noticeService.getMainPopupNotices());
    }

    @GetMapping("/notices")
    public PageResponse<NoticeItem> notices(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page) {
        return PageResponse.from(noticeService.getNoticePage(keyword, page));
    }

    @GetMapping("/notices/{noticeNo}")
    public NoticeDetail notice(@PathVariable Long noticeNo) {
        return noticeService.getNoticeDetail(noticeNo);
    }

    @GetMapping("/routes")
    public RouteResponse routes(@RequestParam(defaultValue = RouteOperationService.VILLAGE) String type) {
        return new RouteResponse(routeService.getPublicRoutes(type),
                RouteOperationService.DDOK.equalsIgnoreCase(type) ? imageService.getImages() : List.of());
    }

    public record HomeResponse(List<MainBannerItem> banners, List<NoticeItem> notices,
            List<NoticePopupItem> popupNotices) {}
    public record RouteResponse(List<RouteOperationItem> routes, List<DdokBusGuideImageItem> guideImages) {}
}
