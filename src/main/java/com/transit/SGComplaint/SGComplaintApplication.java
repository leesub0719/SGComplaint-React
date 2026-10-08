package com.transit.SGComplaint;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan({"com.transit.SGComplaint.mapper", "com.transit.SGComplaint.repository"})
public class SGComplaintApplication {

	public static void main(String[] args) {
		SpringApplication.run(SGComplaintApplication.class, args);
	}

}
