package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.DTO.*;
import com.transit.SGComplaint.service.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminContentApiController {
    private final NoticeService noticeService;
    private final RouteOperationService routeService;
    private final DdokBusGuideImageService routeImageService;
    private final AdminPartnerService partnerService;
    private final MainBannerService bannerService;

    public AdminContentApiController(NoticeService noticeService, RouteOperationService routeService,
            DdokBusGuideImageService routeImageService, AdminPartnerService partnerService,
            MainBannerService bannerService) {
        this.noticeService = noticeService;
        this.routeService = routeService;
        this.routeImageService = routeImageService;
        this.partnerService = partnerService;
        this.bannerService = bannerService;
    }

    @GetMapping("/notices")
    public PageResponse<NoticeItem> notices(@RequestParam(defaultValue = "0") int page) {
        return PageResponse.from(noticeService.getAdminNoticePage(page));
    }
    @GetMapping("/notices/{noticeNo}")
    public NoticeCreateRequest notice(Authentication auth, @PathVariable Long noticeNo) {
        return noticeService.getNoticeEditRequest(auth.getName(), noticeNo);
    }
    @PostMapping("/notices")
    public AdminApiResponse createNotice(Authentication auth, @Valid @ModelAttribute NoticeCreateRequest request) {
        Long no = noticeService.createNotice(auth.getName(), request);
        return AdminApiResponse.ok("공지사항 " + no + "번이 등록되었습니다.");
    }
    @PostMapping("/notices/{noticeNo}")
    public AdminApiResponse updateNotice(Authentication auth, @PathVariable Long noticeNo,
            @Valid @ModelAttribute NoticeCreateRequest request) {
        noticeService.updateNotice(auth.getName(), noticeNo, request);
        return AdminApiResponse.ok("공지사항이 수정되었습니다.");
    }
    @DeleteMapping("/notices/{noticeNo}")
    public AdminApiResponse deleteNotice(Authentication auth, @PathVariable Long noticeNo) {
        noticeService.deleteNotice(auth.getName(), noticeNo);
        return AdminApiResponse.ok("공지사항이 삭제되었습니다.");
    }
    @PatchMapping("/notices/{noticeNo}/popup")
    public AdminApiResponse popup(Authentication auth, @PathVariable Long noticeNo, @RequestBody PopupRequest request) {
        noticeService.changePopupSetting(auth.getName(), noticeNo, request.popup());
        return AdminApiResponse.ok(request.popup() ? "메인 팝업을 사용합니다." : "메인 팝업을 해제했습니다.");
    }

    @GetMapping("/routes")
    public RouteAdminResponse routes() {
        return new RouteAdminResponse(routeService.getAdminRoutes(), routeService.countRoutes(),
                routeImageService.getImages(), routeImageService.countImages());
    }
    @PostMapping("/routes")
    public AdminApiResponse createRoute(@Valid @RequestBody RouteOperationRequest request) {
        return AdminApiResponse.ok("운행안내 " + routeService.createRoute(request) + "번을 등록했습니다.");
    }
    @PutMapping("/routes/{routeNo}")
    public AdminApiResponse updateRoute(@PathVariable Long routeNo, @Valid @RequestBody RouteOperationRequest request) {
        return AdminApiResponse.ok(routeService.updateRoute(routeNo, request));
    }
    @DeleteMapping("/routes/{routeNo}")
    public AdminApiResponse deleteRoute(Authentication auth, @PathVariable Long routeNo) {
        return AdminApiResponse.ok(routeService.deleteRoute(auth.getName(), routeNo));
    }
    @PostMapping("/routes/guide-images")
    public AdminApiResponse addRouteImage(@RequestParam("guideImage") MultipartFile image) {
        return AdminApiResponse.ok("똑버스 안내 이미지 " + routeImageService.addImage(image) + "번을 등록했습니다.");
    }
    @DeleteMapping("/routes/guide-images/{imageNo}")
    public AdminApiResponse deleteRouteImage(@PathVariable Long imageNo) {
        routeImageService.deleteImage(imageNo);
        return AdminApiResponse.ok("똑버스 안내 이미지를 삭제했습니다.");
    }

    @GetMapping("/partners")
    public PartnerAdminResponse partners(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page) {
        return new PartnerAdminResponse(PageResponse.from(partnerService.searchPartners(keyword, page)),
                partnerService.countPartners());
    }
    @PostMapping("/partners")
    public AdminApiResponse createPartner(@Valid @RequestBody PartnerRequest request) {
        return AdminApiResponse.ok("협력업체 " + partnerService.createPartner(request) + "번을 등록했습니다.");
    }
    @PutMapping("/partners/{partnerNo}")
    public AdminApiResponse updatePartner(@PathVariable Long partnerNo, @Valid @RequestBody PartnerRequest request) {
        return AdminApiResponse.ok(partnerService.updatePartner(partnerNo, request));
    }
    @DeleteMapping("/partners/{partnerNo}")
    public AdminApiResponse deletePartner(@PathVariable Long partnerNo) {
        return AdminApiResponse.ok(partnerService.deletePartner(partnerNo));
    }

    @GetMapping("/main-page")
    public BannerAdminResponse banners() {
        return new BannerAdminResponse(bannerService.getBanners(), bannerService.countBanners(), bannerService.remainingCount());
    }
    @PostMapping("/main-page/banners")
    public AdminApiResponse addBanners(Authentication auth,
            @RequestParam(name = "bannerImages", required = false) List<MultipartFile> images) {
        return AdminApiResponse.ok("메인 배너 이미지 " + bannerService.addBanners(auth.getName(), images) + "장을 등록했습니다.");
    }
    @DeleteMapping("/main-page/banners/{bannerNo}")
    public AdminApiResponse deleteBanner(Authentication auth, @PathVariable Long bannerNo) {
        bannerService.deleteBanner(auth.getName(), bannerNo);
        return AdminApiResponse.ok("메인 배너 이미지를 삭제했습니다.");
    }

    public record PopupRequest(boolean popup) {}
    public record RouteAdminResponse(List<RouteOperationItem> routes, long routeCount,
            List<DdokBusGuideImageItem> guideImages, long guideImageCount) {}
    public record PartnerAdminResponse(PageResponse<AdminPartnerItem> page, long totalCount) {}
    public record BannerAdminResponse(List<MainBannerItem> banners, long count, long remainingCount) {}
}
