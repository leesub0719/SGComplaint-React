package com.transit.SGComplaint.controller;

import com.transit.SGComplaint.service.EmployeeService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
public class MemberAvailabilityApiController {
    private final EmployeeService employeeService;
    public MemberAvailabilityApiController(EmployeeService employeeService) { this.employeeService = employeeService; }

    @GetMapping("/check-id")
    public Map<String, Boolean> checkId(@RequestParam(name = "empId") String empId) {
        return Map.of("available", employeeService.isEmpIdAvailable(empId));
    }
}
