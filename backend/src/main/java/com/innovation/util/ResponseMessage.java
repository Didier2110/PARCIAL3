package com.innovation.util;

import java.util.HashMap;
import java.util.Map;

public class ResponseMessage {

	public static Map<String, Object> success(String message, Object data) {
		Map<String, Object> response = new HashMap<>();
		response.put("status", "success");
		response.put("message", message);
		response.put("data", data);
		response.put("timestamp", System.currentTimeMillis());
		return response;
	}

	public static Map<String, Object> error(String message) {
		Map<String, Object> response = new HashMap<>();
		response.put("status", "error");
		response.put("message", message);
		response.put("timestamp", System.currentTimeMillis());
		return response;
	}

	public static Map<String, Object> error(String message, String details) {
		Map<String, Object> response = new HashMap<>();
		response.put("status", "error");
		response.put("message", message);
		response.put("details", details);
		response.put("timestamp", System.currentTimeMillis());
		return response;
	}
}
